import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const RATE_LIMIT_PREFIX = 'ratelimit:';

/**
 * Redis-backed rate limiting service using sliding window algorithm
 */
export class RateLimitService {
  /**
   * Check if a request should be rate limited
   * Uses Redis sorted sets for sliding window algorithm
   */
  async checkLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    try {
      const key = `${RATE_LIMIT_PREFIX}${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const redis = getRedisClient();

      // Remove old entries outside the current window
      await redis.zremrangebyscore(key, '-inf', windowStart);

      // Count requests in current window
      const currentCount = await redis.zcard(key);

      if (currentCount >= maxRequests) {
        // Get the oldest request timestamp to calculate retry-after
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldestRequest.length > 1 ? parseInt(oldestRequest[1]) : now;
        const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

        logger.warn(`Rate limit exceeded for ${identifier}`, {
          currentCount,
          maxRequests,
          windowMs,
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime: oldestTimestamp + windowMs,
          retryAfter: retryAfter > 0 ? retryAfter : 1,
        };
      }

      // Add current request to the sorted set
      const requestId = `${now}:${Math.random()}`;
      await redis.zadd(key, now, requestId);

      // Set expiry on the key (cleanup)
      await redis.pexpire(key, windowMs);

      return {
        allowed: true,
        remaining: maxRequests - currentCount - 1,
        resetTime: now + windowMs,
      };
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: 0,
        resetTime: Date.now(),
      };
    }
  }

  /**
   * Decrement the rate limit count (for skip options)
   */
  async decrementCount(identifier: string): Promise<void> {
    try {
      const key = `${RATE_LIMIT_PREFIX}${identifier}`;
      const redis = getRedisClient();

      // Remove the most recent request
      const requests = await redis.zrange(key, -1, -1);
      if (requests.length > 0) {
        await redis.zrem(key, requests[0]);
      }
    } catch (error) {
      logger.error('Error decrementing rate limit:', error);
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    try {
      const key = `${RATE_LIMIT_PREFIX}${identifier}`;
      const redis = getRedisClient();
      await redis.del(key);
      logger.debug(`Reset rate limit for ${identifier}`);
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
    }
  }

  /**
   * Get current rate limit status for an identifier
   */
  async getStatus(
    identifier: string,
    windowMs: number
  ): Promise<{ count: number; oldestTimestamp: number }> {
    try {
      const key = `${RATE_LIMIT_PREFIX}${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      const redis = getRedisClient();

      // Remove old entries
      await redis.zremrangebyscore(key, '-inf', windowStart);

      // Get count and oldest timestamp
      const count = await redis.zcard(key);
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldest.length > 1 ? parseInt(oldest[1]) : now;

      return { count, oldestTimestamp };
    } catch (error) {
      logger.error('Error getting rate limit status:', error);
      return { count: 0, oldestTimestamp: Date.now() };
    }
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
