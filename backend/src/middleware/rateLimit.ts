import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../services/rateLimitService.js';
import { logger } from '../utils/logger.js';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests default
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Get client identifier (IP address or user ID if authenticated)
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `${req.path}:${identifier}`;

    try {
      // Check rate limit using Redis
      const result = await rateLimitService.checkLimit(key, windowMs, max);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      // Check if limit exceeded
      if (!result.allowed) {
        res.set({
          'Retry-After': result.retryAfter?.toString() || '60',
        });

        logger.warn(`Rate limit exceeded for ${identifier}`, {
          path: req.path,
          ip,
          userId,
        });

        return res.status(429).json({
          error: message,
          retryAfter: result.retryAfter,
        });
      }

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (body) {
          const statusCode = res.statusCode;

          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            // Decrement counter asynchronously
            rateLimitService.decrementCount(key).catch((error) => {
              logger.error('Error decrementing rate limit:', error);
            });
          }

          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

// Predefined rate limit configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 in prod, 100 in dev/test
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many API requests, please try again later',
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Rate limit exceeded, please slow down',
});
