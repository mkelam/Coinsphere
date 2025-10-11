import { Request, Response, NextFunction } from 'express';
import { csrfService } from '../services/csrfService.js';
import { logger } from '../utils/logger.js';

/**
 * Validate CSRF token middleware
 * Only validates for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export async function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints (login/signup don't have tokens yet)
  if (req.path.includes('/auth/login') || req.path.includes('/auth/signup') || req.path.includes('/auth/register')) {
    return next();
  }

  // Get user ID from request (set by auth middleware)
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'] as string;
  if (!csrfToken) {
    logger.warn(`CSRF token missing for user ${userId}`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({ error: 'CSRF token missing' });
  }

  // Validate token using Redis-backed service
  try {
    const isValid = await csrfService.validateToken(userId, csrfToken);

    if (!isValid) {
      logger.warn(`CSRF token invalid or expired for user ${userId}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'CSRF token invalid or expired' });
    }

    // Token is valid
    next();
  } catch (error) {
    logger.error('Error validating CSRF token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Endpoint to get a new CSRF token
 * This should be called after login
 */
export async function getCsrfToken(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = await csrfService.generateToken(userId);
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error('Error generating CSRF token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate a CSRF token for a user (exported for use in auth routes)
 */
export async function generateCsrfToken(userId: string): Promise<string> {
  return csrfService.generateToken(userId);
}
