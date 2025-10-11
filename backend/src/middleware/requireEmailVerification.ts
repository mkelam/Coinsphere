import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to require email verification for certain endpoints
 * Should be used after authenticate middleware
 */
export async function requireEmailVerification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user's email is verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.emailVerified) {
      logger.warn(`Unverified user attempted to access protected endpoint: ${user.email}`, {
        userId,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this feature. Check your inbox for the verification link.',
        emailVerified: false,
      });
    }

    // Email is verified, proceed
    next();
  } catch (error) {
    logger.error('Error checking email verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
