import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const redisClient = getRedisClient();

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 60)
  prefix?: string; // Cache key prefix (default: 'cache')
  varyBy?: string[]; // Query parameters to include in cache key
}

/**
 * Cache middleware for GET requests
 * Caches response in Redis with configurable TTL
 */
export function cache(options: CacheOptions = {}) {
  const { ttl = 60, prefix = 'cache', varyBy = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Build cache key from route and query params
      const baseKey = `${prefix}:${req.path}`;
      const queryParts: string[] = [];

      // Add specified query parameters to cache key
      for (const param of varyBy) {
        const value = req.query[param];
        if (value) {
          queryParts.push(`${param}=${value}`);
        }
      }

      const cacheKey = queryParts.length > 0
        ? `${baseKey}:${queryParts.join(':')}`
        : baseKey;

      // Try to get cached response
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        const parsed = JSON.parse(cachedData);
        return res.json(parsed);
      }

      logger.debug(`Cache miss: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data: any) {
        // Cache the response
        redisClient.setex(cacheKey, ttl, JSON.stringify(data)).catch((error) => {
          logger.error(`Failed to cache response for ${cacheKey}:`, error);
        });

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Don't block request on cache errors
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 * @param pattern Redis key pattern (e.g., 'cache:tokens:*')
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redisClient.del(...keys);
    logger.info(`Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    return keys.length;
  } catch (error) {
    logger.error(`Failed to invalidate cache for pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Invalidate cache for specific key
 * @param key Redis cache key
 */
export async function invalidateCacheKey(key: string): Promise<boolean> {
  try {
    const result = await redisClient.del(key);
    if (result > 0) {
      logger.debug(`Invalidated cache key: ${key}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to invalidate cache key ${key}:`, error);
    return false;
  }
}
