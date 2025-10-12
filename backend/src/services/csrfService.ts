import crypto from 'crypto';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const CSRF_PREFIX = 'csrf:';
const CSRF_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Redis-backed CSRF token service
 */
export class CsrfService {
  /**
   * Generate a new CSRF token for a user
   */
  async generateToken(userId: string): Promise<string> {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const key = `${CSRF_PREFIX}${userId}`;

      const redis = getRedisClient();
      await redis.setex(key, CSRF_TTL, token);

      logger.debug(`Generated CSRF token for user ${userId}`);
      return token;
    } catch (error) {
      logger.error('Error generating CSRF token:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Validate a CSRF token for a user
   * Uses constant-time comparison to prevent timing attacks
   */
  async validateToken(userId: string, token: string): Promise<boolean> {
    try {
      const key = `${CSRF_PREFIX}${userId}`;

      const redis = getRedisClient();
      const storedToken = await redis.get(key);

      if (!storedToken) {
        logger.warn(`CSRF token not found for user ${userId}`);
        return false;
      }

      // Use constant-time comparison to prevent timing attacks
      if (storedToken.length !== token.length) {
        logger.warn(`CSRF token length mismatch for user ${userId}`);
        return false;
      }

      const storedBuffer = Buffer.from(storedToken, 'utf8');
      const tokenBuffer = Buffer.from(token, 'utf8');

      if (!crypto.timingSafeEqual(storedBuffer, tokenBuffer)) {
        logger.warn(`CSRF token mismatch for user ${userId}`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating CSRF token:', error);
      return false;
    }
  }

  /**
   * Rotate CSRF token for a user
   * Generates a new token and invalidates the old one
   */
  async rotateToken(userId: string): Promise<string> {
    try {
      const key = `${CSRF_PREFIX}${userId}`;

      // Delete old token
      const redis = getRedisClient();
      await redis.del(key);

      // Generate new token
      return await this.generateToken(userId);
    } catch (error) {
      logger.error('Error rotating CSRF token:', error);
      throw new Error('Failed to rotate CSRF token');
    }
  }

  /**
   * Delete CSRF token for a user (e.g., on logout)
   */
  async deleteToken(userId: string): Promise<void> {
    try {
      const key = `${CSRF_PREFIX}${userId}`;

      const redis = getRedisClient();
      await redis.del(key);

      logger.debug(`Deleted CSRF token for user ${userId}`);
    } catch (error) {
      logger.error('Error deleting CSRF token:', error);
    }
  }

  /**
   * Get remaining TTL for a token (for debugging)
   */
  async getTokenTTL(userId: string): Promise<number> {
    try {
      const key = `${CSRF_PREFIX}${userId}`;

      const redis = getRedisClient();
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Error getting CSRF token TTL:', error);
      return -1;
    }
  }
}

// Export singleton instance
export const csrfService = new CsrfService();
