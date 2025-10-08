import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Singleton Redis client
let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    // Parse Redis URL or use defaults
    const redisUrl = config.redisUrl || 'redis://localhost:6379';

    logger.info('Initializing Redis connection', { url: redisUrl.replace(/:[^:]*@/, ':****@') });

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: false, // Fail fast if Redis is down
      lazyConnect: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms`);
        return delay;
      },
    });

    // Connection event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('✅ Redis client connected and ready');
    });

    redisClient.on('error', (error) => {
      isConnected = false;
      logger.error('Redis client error:', error);
    });

    redisClient.on('close', () => {
      isConnected = false;
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    redisClient.on('end', () => {
      isConnected = false;
      logger.warn('Redis connection ended');
    });
  }

  return redisClient;
}

/**
 * Check if Redis is connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    if (!redisClient) {
      return { status: 'error', message: 'Redis client not initialized' };
    }

    // Test Redis with PING command
    const result = await redisClient.ping();

    if (result === 'PONG') {
      return { status: 'ok', message: 'Redis is healthy' };
    } else {
      return { status: 'error', message: `Unexpected PING response: ${result}` };
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      logger.info('Closing Redis connection...');
      await redisClient.quit();
      redisClient = null;
      isConnected = false;
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      // Force close if graceful quit fails
      redisClient.disconnect();
      redisClient = null;
      isConnected = false;
    }
  }
}

// Initialize Redis client on module load
getRedisClient();
