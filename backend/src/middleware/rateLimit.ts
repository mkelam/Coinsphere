import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 10 * 60 * 1000);

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

  return (req: Request, res: Response, next: NextFunction) => {
    // Get client identifier (IP address or user ID if authenticated)
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rateLimit:${identifier}`;

    const now = Date.now();
    const record = store[key];

    // Initialize or reset if window expired
    if (!record || record.resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const currentRecord = store[key];

    // Check if limit exceeded
    if (currentRecord.count >= max) {
      const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);

      logger.warn(`Rate limit exceeded for ${identifier}`, {
        ip: identifier,
        path: req.path,
        count: currentRecord.count,
      });

      res.set({
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(currentRecord.resetTime).toISOString(),
      });

      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    // Increment counter (will be decremented if skipSuccessfulRequests/skipFailedRequests is true)
    currentRecord.count++;

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': (max - currentRecord.count).toString(),
      'X-RateLimit-Reset': new Date(currentRecord.resetTime).toISOString(),
    });

    // Handle skip options
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        const statusCode = res.statusCode;

        if (
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          currentRecord.count--;
        }

        return originalSend.call(this, body);
      };
    }

    next();
  };
}

// Predefined rate limit configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
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
