import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Redis-backed caching service
 */
export class CacheService {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as T;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a cached value with TTL
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedisClient();
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
      logger.debug(`Cached key ${key} with TTL ${ttlSeconds}s`);
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(key);
      logger.debug(`Deleted cache key ${key}`);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple cached values by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Deleted ${keys.length} cache keys matching ${pattern}`);
      }
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit for key ${key}`);
      return cached;
    }

    // Cache miss - fetch data
    logger.debug(`Cache miss for key ${key}`);
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttlSeconds);

    return data;
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const redis = getRedisClient();
      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      const redis = getRedisClient();
      return await redis.incr(key);
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration on an existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(`Error setting expiration for key ${key}:`, error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key prefixes
export const CACHE_KEYS = {
  COINGECKO_PRICES: (coinIds: string) => `cache:coingecko:prices:${coinIds}`,
  COINGECKO_MARKET_DATA: (coinId: string) => `cache:coingecko:market:${coinId}`,
  PORTFOLIO: (userId: string, portfolioId: string) =>
    `cache:portfolio:${userId}:${portfolioId}`,
  PORTFOLIO_LIST: (userId: string) => `cache:portfolios:${userId}`,
  PREDICTIONS: (tokenId: string) => `cache:predictions:${tokenId}`,
  RISK_SCORE: (tokenId: string) => `cache:risk:${tokenId}`,
  TOKEN_PRICES: 'cache:tokens:prices',
  USER_HOLDINGS: (userId: string) => `cache:holdings:${userId}`,
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  COINGECKO_PRICES: 60, // 1 minute
  COINGECKO_MARKET_DATA: 300, // 5 minutes
  PORTFOLIO: 60, // 1 minute
  PORTFOLIO_LIST: 30, // 30 seconds
  PREDICTIONS: 3600, // 1 hour
  RISK_SCORE: 1800, // 30 minutes
  TOKEN_PRICES: 30, // 30 seconds
  USER_HOLDINGS: 60, // 1 minute
};
