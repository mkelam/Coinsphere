import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// Store for CSRF tokens (in production, use Redis)
const tokenStore = new Map<string, { token: string; expiry: number }>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of tokenStore.entries()) {
    if (data.expiry < now) {
      tokenStore.delete(userId);
    }
  }
}, 60 * 60 * 1000);

/**
 * Generate a CSRF token for a user
 */
export function generateCsrfToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  tokenStore.set(userId, { token, expiry });

  return token;
}

/**
 * Validate CSRF token middleware
 * Only validates for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints (login/signup don't have tokens yet)
  if (req.path.includes('/auth/login') || req.path.includes('/auth/signup')) {
    return next();
  }

  // Get user ID from request (set by auth middleware)
  const userId = (req as any).user?.userId;
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

  // Validate token
  const storedData = tokenStore.get(userId);
  if (!storedData) {
    logger.warn(`CSRF token not found for user ${userId}`, {
      method: req.method,
      path: req.path,
    });
    return res.status(403).json({ error: 'CSRF token invalid or expired' });
  }

  if (storedData.token !== csrfToken) {
    logger.warn(`CSRF token mismatch for user ${userId}`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({ error: 'CSRF token invalid' });
  }

  if (storedData.expiry < Date.now()) {
    tokenStore.delete(userId);
    logger.warn(`CSRF token expired for user ${userId}`, {
      method: req.method,
      path: req.path,
    });
    return res.status(403).json({ error: 'CSRF token expired' });
  }

  // Token is valid
  next();
}

/**
 * Endpoint to get a new CSRF token
 * This should be called after login
 */
export function getCsrfToken(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = generateCsrfToken(userId);
  res.json({ csrfToken: token });
}
