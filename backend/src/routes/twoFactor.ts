import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { twoFactorService } from '../services/twoFactorService.js';
import { logger } from '../utils/logger.js';
import { auditLogService } from '../services/auditLog.js';

const router = Router();

// POST /api/v1/2fa/setup - Initiate 2FA setup (generates QR code)
router.post('/setup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate new TOTP secret
    const secret = twoFactorService.generateSecret();

    // Generate QR code for user to scan
    const qrCodeDataUrl = await twoFactorService.generateQRCode(user.email, secret);

    // Temporarily store the secret in session/response (not yet enabled)
    // The user will need to verify a token before we enable 2FA

    logger.info(`2FA setup initiated for user: ${user.email}`, { userId });

    // Audit log
    auditLogService.log({
      userId,
      action: '2fa_setup_initiated',
      resource: 'user',
      resourceId: userId,
      status: 'success',
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
    }).catch((err) => logger.error('Failed to log 2FA setup initiation:', err));

    res.json({
      secret, // Send the secret to the frontend temporarily
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.), then verify with a code',
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/2fa/verify - Verify and enable 2FA
router.post('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { secret, token } = z.object({
      secret: z.string(), // The temporary secret from /setup
      token: z.string().length(6), // 6-digit TOTP code
    }).parse(req.body);

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Verify the token
    const isValid = twoFactorService.verifyToken(token, secret);

    if (!isValid) {
      logger.warn(`Failed 2FA verification attempt for user: ${user.email}`, { userId });

      // Audit log
      auditLogService.log({
        userId,
        action: '2fa_verification_failed',
        resource: 'user',
        resourceId: userId,
        status: 'failure',
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        errorMessage: 'Invalid 2FA token',
      }).catch((err) => logger.error('Failed to log 2FA verification failure:', err));

      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Encrypt the secret before storing
    const encryptedSecret = twoFactorService.encryptSecret(secret);

    // Enable 2FA and store the encrypted secret
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
      },
    });

    // Generate backup codes
    const backupCodes = twoFactorService.generateBackupCodes();

    logger.info(`2FA enabled for user: ${user.email}`, { userId });

    // Audit log
    auditLogService.log({
      userId,
      action: '2fa_enabled',
      resource: 'user',
      resourceId: userId,
      status: 'success',
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
    }).catch((err) => logger.error('Failed to log 2FA enablement:', err));

    res.json({
      success: true,
      message: '2FA successfully enabled',
      backupCodes,
      warning: 'Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('2FA verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/2fa/disable - Disable 2FA
router.post('/disable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { password, token } = z.object({
      password: z.string(),
      token: z.string().length(6), // 6-digit TOTP code or 8-char backup code
    }).parse(req.body);

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify password
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      logger.warn(`Failed 2FA disable attempt (invalid password) for user: ${user.email}`, { userId });

      // Audit log
      auditLogService.log({
        userId,
        action: '2fa_disable_failed',
        resource: 'user',
        resourceId: userId,
        status: 'failure',
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        errorMessage: 'Invalid password',
      }).catch((err) => logger.error('Failed to log 2FA disable failure:', err));

      return res.status(401).json({ error: 'Invalid password' });
    }

    // Decrypt and verify the 2FA token
    if (!user.twoFactorSecret) {
      return res.status(500).json({ error: 'No 2FA secret found' });
    }

    const decryptedSecret = twoFactorService.decryptSecret(user.twoFactorSecret);
    const isValidToken = twoFactorService.verifyToken(token, decryptedSecret);

    if (!isValidToken) {
      logger.warn(`Failed 2FA disable attempt (invalid token) for user: ${user.email}`, { userId });

      // Audit log
      auditLogService.log({
        userId,
        action: '2fa_disable_failed',
        resource: 'user',
        resourceId: userId,
        status: 'failure',
        ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        errorMessage: 'Invalid 2FA token',
      }).catch((err) => logger.error('Failed to log 2FA disable failure:', err));

      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    logger.info(`2FA disabled for user: ${user.email}`, { userId });

    // Audit log
    auditLogService.log({
      userId,
      action: '2fa_disabled',
      resource: 'user',
      resourceId: userId,
      status: 'success',
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
    }).catch((err) => logger.error('Failed to log 2FA disable:', err));

    res.json({
      success: true,
      message: '2FA successfully disabled',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('2FA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/2fa/status - Check if 2FA is enabled
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      enabled: user.twoFactorEnabled,
    });
  } catch (error) {
    logger.error('2FA status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
