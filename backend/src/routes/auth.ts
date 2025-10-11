import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { tokenRevocationService } from '../services/tokenRevocationService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { accountLockoutService } from '../services/accountLockoutService.js';
import { emailService } from '../services/emailService.js';
import { queueEmail } from '../services/queue.js';
import { auditLogService } from '../services/auditLog.js';
import { twoFactorService } from '../services/twoFactorService.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorToken: z.string().optional(), // Optional 2FA token
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    // Generate tokens with new token family
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Create token family for tracking
    const payload = verifyRefreshToken(refreshToken);
    await tokenRevocationService.createTokenFamily(user.id, payload.familyId);

    // Create email verification token
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Queue verification email (async, non-blocking)
    queueEmail('verification', { email: user.email, token: verificationToken }).catch((error) => {
      logger.error(`Failed to queue verification email to ${user.email}:`, error);
    });

    logger.info(`New user registered: ${user.email}`);

    // Audit log successful registration
    auditLogService.logAuth({
      action: 'signup',
      userId: user.id,
      email: user.email,
      status: 'success',
      req,
    }).catch((err) => logger.error('Failed to log signup audit:', err));

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Registration error:', error);

    // Audit log failed registration
    const email = req.body?.email;
    if (email) {
      auditLogService.logAuth({
        action: 'signup',
        email,
        status: 'failure',
        req,
        errorMessage: error instanceof Error ? error.message : 'Registration failed',
      }).catch((err) => logger.error('Failed to log signup failure audit:', err));
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorToken } = loginSchema.parse(req.body);

    // Check if account is locked
    const lockStatus = await accountLockoutService.isAccountLocked(email);
    if (lockStatus.isLocked) {
      const minutes = Math.ceil((lockStatus.remainingSeconds || 0) / 60);
      logger.warn(`Login attempt on locked account: ${email}`);
      return res.status(429).json({
        error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        lockedUntil: lockStatus.lockedUntil,
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Record failed attempt for non-existent user (prevent enumeration, but track attempts)
      await accountLockoutService.recordFailedAttempt(email);

      // Audit log failed login (non-existent user)
      auditLogService.logAuth({
        action: 'login',
        email,
        status: 'failure',
        req,
        errorMessage: 'Invalid credentials',
      }).catch((err) => logger.error('Failed to log login failure audit:', err));

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Record failed attempt
      const result = await accountLockoutService.recordFailedAttempt(email);

      if (result.shouldLock) {
        const minutes = Math.ceil(((result.lockedUntil?.getTime() || 0) - Date.now()) / 60000);
        logger.warn(`Account locked after failed attempts: ${email}`);
        return res.status(429).json({
          error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          lockedUntil: result.lockedUntil,
        });
      }

      logger.info(`Failed login attempt for: ${email} (${result.attemptsRemaining} attempts remaining)`);

      // Audit log failed login (wrong password)
      auditLogService.logAuth({
        action: 'login',
        userId: user.id,
        email: user.email,
        status: 'failure',
        req,
        errorMessage: 'Invalid credentials',
      }).catch((err) => logger.error('Failed to log login failure audit:', err));

      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // Clear failed attempts on successful password
    await accountLockoutService.clearFailedAttempts(email);

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // User has 2FA enabled but didn't provide a token
        return res.status(403).json({
          error: '2FA code required',
          requires2FA: true,
        });
      }

      // Verify 2FA token
      if (!user.twoFactorSecret) {
        logger.error(`User ${email} has 2FA enabled but no secret stored`, { userId: user.id });
        return res.status(500).json({ error: 'Internal server error' });
      }

      const decryptedSecret = twoFactorService.decryptSecret(user.twoFactorSecret);
      const isValid2FA = twoFactorService.verifyToken(twoFactorToken, decryptedSecret);

      if (!isValid2FA) {
        logger.warn(`Failed 2FA verification for user: ${email}`, { userId: user.id });

        // Audit log failed 2FA
        auditLogService.logAuth({
          action: 'login',
          userId: user.id,
          email: user.email,
          status: 'failure',
          req,
          errorMessage: 'Invalid 2FA token',
        }).catch((err) => logger.error('Failed to log 2FA failure audit:', err));

        return res.status(401).json({ error: 'Invalid 2FA code' });
      }

      logger.info(`2FA verification successful for user: ${email}`, { userId: user.id });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens with new token family
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Create token family for tracking
    const payload = verifyRefreshToken(refreshToken);
    await tokenRevocationService.createTokenFamily(user.id, payload.familyId);

    logger.info(`User logged in: ${user.email}`);

    // Audit log successful login
    auditLogService.logAuth({
      action: 'login',
      userId: user.id,
      email: user.email,
      status: 'success',
      req,
    }).catch((err) => logger.error('Failed to log login success audit:', err));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscriptionTier: user.subscriptionTier,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Login error:', error);

    // Audit log error
    const email = req.body?.email;
    if (email) {
      auditLogService.logAuth({
        action: 'login',
        email,
        status: 'failure',
        req,
        errorMessage: error instanceof Error ? error.message : 'Login failed',
      }).catch((err) => logger.error('Failed to log login error audit:', err));
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/refresh - Refresh access token using refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Check if token has been revoked
    const isRevoked = await tokenRevocationService.isTokenRevoked(refreshToken);
    if (isRevoked) {
      logger.warn('Attempted to use revoked refresh token');
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      logger.warn('Invalid refresh token attempt', { error });
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Check token family (detect reuse attacks)
    const isFamilyValid = await tokenRevocationService.updateTokenFamily(payload.familyId);
    if (!isFamilyValid) {
      logger.error(`Token reuse detected for user ${payload.userId}`, {
        userId: payload.userId,
        familyId: payload.familyId,
      });
      // Revoke old token and reject request
      await tokenRevocationService.revokeToken(refreshToken);
      return res.status(401).json({
        error: 'Token reuse detected - all tokens revoked for security',
      });
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Revoke old refresh token (token rotation)
    await tokenRevocationService.revokeToken(refreshToken);

    // Generate new tokens with same family ID (token rotation within family)
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email }, payload.familyId);

    logger.info(`Token refreshed for user: ${user.email}`, {
      userId: user.id,
      familyId: payload.familyId,
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/logout - Logout from current device (revoke refresh token)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Revoke the refresh token
    await tokenRevocationService.revokeToken(refreshToken);

    // Try to extract user info for logging
    try {
      const payload = verifyRefreshToken(refreshToken);
      logger.info(`User logged out: ${payload.email}`, {
        userId: payload.userId,
        familyId: payload.familyId,
      });

      // Audit log logout
      auditLogService.logAuth({
        action: 'logout',
        userId: payload.userId,
        email: payload.email,
        status: 'success',
        req,
      }).catch((err) => logger.error('Failed to log logout audit:', err));
    } catch (error) {
      // Token might be expired, but we still revoked it
      logger.info('Token revoked during logout (token was invalid)');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/logout-all - Logout from all devices (revoke all refresh tokens)
router.post('/logout-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Revoke all refresh tokens for this user
    await tokenRevocationService.revokeAllUserTokens(userId);

    logger.info(`User logged out from all devices: ${req.user?.email}`, {
      userId,
    });

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/auth/me (requires authentication)
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscriptionTier: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get token stats
    const tokenStats = await tokenRevocationService.getUserTokenStats(userId);

    res.json({
      user,
      tokenStats,
    });
  } catch (error) {
    logger.error('Auth/me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (verification.isUsed) {
      return res.status(400).json({ error: 'Verification token already used' });
    }

    if (verification.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification token expired' });
    }

    // Mark token as used and verify email
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
    ]);

    logger.info(`Email verified for user: ${verification.user.email}`);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security)
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Invalidate old password reset tokens
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Create new password reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Queue password reset email (async, non-blocking)
    queueEmail('password-reset', { email: user.email, token: resetToken }).catch((error) => {
      logger.error(`Failed to queue password reset email to ${user.email}:`, error);
    });

    logger.info(`Password reset requested for: ${user.email}`);

    // Audit log password reset request
    auditLogService.logAuth({
      action: 'password_reset_request',
      userId: user.id,
      email: user.email,
      status: 'success',
      req,
    }).catch((err) => logger.error('Failed to log password reset request audit:', err));

    // Always return success message (security best practice)
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email address', details: error.errors });
    }
    logger.error('Forgot password error:', error);

    // Audit log error
    const email = req.body?.email;
    if (email) {
      auditLogService.logAuth({
        action: 'password_reset_request',
        email,
        status: 'failure',
        req,
        errorMessage: error instanceof Error ? error.message : 'Password reset request failed',
      }).catch((err) => logger.error('Failed to log password reset failure audit:', err));
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = z.object({
      token: z.string(),
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    }).parse(req.body);

    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid password reset token' });
    }

    if (resetRequest.isUsed) {
      return res.status(400).json({ error: 'Password reset token already used' });
    }

    if (resetRequest.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Password reset token expired' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash },
      }),
    ]);

    // Revoke all existing refresh tokens for security
    await tokenRevocationService.revokeAllUserTokens(resetRequest.userId);

    logger.info(`Password reset successful for user: ${resetRequest.user.email}`);

    // Audit log successful password reset
    auditLogService.logAuth({
      action: 'password_reset_complete',
      userId: resetRequest.userId,
      email: resetRequest.user.email,
      status: 'success',
      req,
    }).catch((err) => logger.error('Failed to log password reset complete audit:', err));

    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Reset password error:', error);

    // Audit log error
    auditLogService.log({
      action: 'password_reset_complete',
      status: 'failure',
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Password reset failed',
    }).catch((err) => logger.error('Failed to log password reset failure audit:', err));

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  try {
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

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Invalidate old verification tokens
    await prisma.emailVerification.updateMany({
      where: {
        userId,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Create new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerification.create({
      data: {
        userId,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(user.email, verificationToken);

    if (!emailSent) {
      logger.error(`Failed to send verification email to ${user.email}`);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    logger.info(`Verification email resent to: ${user.email}`);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    logger.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/auth/profile - Update user profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firstName, lastName, email } = updateProfileSchema.parse(req.body);

    // If email is being changed, check if it's already in use
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email, emailVerified: false }), // Reset verification if email changed
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    // Audit log
    auditLogService.logAuth({
      userId,
      action: 'profile_update',
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      status: 'success',
    }).catch((err) => logger.error('Failed to log profile update audit:', err));

    logger.info(`Profile updated for user ${userId}`);

    res.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    logger.error('Profile update error:', error);

    auditLogService.logAuth({
      userId: req.user?.userId || '',
      action: 'profile_update',
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      status: 'failure',
    }).catch((err) => logger.error('Failed to log profile update failure audit:', err));

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/change-password - Change user password
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      auditLogService.logAuth({
        userId,
        action: 'change_password',
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
        status: 'failure',
      }).catch((err) => logger.error('Failed to log password change failure audit:', err));

      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Revoke all existing tokens (force re-login on all devices for security)
    await tokenRevocationService.revokeAllUserTokens(userId);

    // Audit log
    auditLogService.logAuth({
      userId,
      action: 'change_password',
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      status: 'success',
    }).catch((err) => logger.error('Failed to log password change audit:', err));

    logger.info(`Password changed for user ${userId}`);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }

    logger.error('Password change error:', error);

    auditLogService.logAuth({
      userId: req.user?.userId || '',
      action: 'change_password',
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || '',
      status: 'failure',
    }).catch((err) => logger.error('Failed to log password change failure audit:', err));

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
