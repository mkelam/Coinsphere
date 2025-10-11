import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if authenticated user has admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch user from database to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      logger.warn(`Non-admin user attempted admin action: ${req.user?.email}`, {
        userId,
        path: req.path,
        method: req.method,
      });
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    logger.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
