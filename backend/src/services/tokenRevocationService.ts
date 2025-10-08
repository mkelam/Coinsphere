import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// Get Redis client instance
const redisClient = getRedisClient();

interface TokenFamily {
  userId: string;
  familyId: string;
  createdAt: number;
  lastUsedAt: number;
  tokenCount: number;
}

/**
 * Token Revocation Service
 *
 * Implements refresh token revocation with:
 * - Token blacklist (revoked tokens)
 * - Token families (detect reuse attacks)
 * - Automatic cleanup of expired entries
 */
class TokenRevocationService {
  private readonly REVOKED_PREFIX = 'revoked:token:';
  private readonly FAMILY_PREFIX = 'token:family:';
  private readonly USER_FAMILIES_PREFIX = 'user:families:';

  /**
   * Revoke a specific refresh token
   * Token is stored in Redis until it would naturally expire
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration time (don't verify, just decode)
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.exp) {
        logger.warn('Attempted to revoke token with no expiration');
        return;
      }

      // Calculate TTL (time until token expires)
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      if (ttl <= 0) {
        // Token already expired, no need to revoke
        return;
      }

      // Store revoked token with TTL
      const key = `${this.REVOKED_PREFIX}${token}`;
      await redisClient.setex(key, ttl, '1');

      logger.info(`Token revoked for user ${decoded.userId}`, {
        userId: decoded.userId,
        expiresIn: ttl,
      });
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw error;
    }
  }

  /**
   * Check if a token has been revoked
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const key = `${this.REVOKED_PREFIX}${token}`;
      const result = await redisClient.get(key);
      return result !== null;
    } catch (error) {
      logger.error('Error checking token revocation:', error);
      // Fail secure: if Redis is down, reject the token
      return true;
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all token families for this user
      const familiesKey = `${this.USER_FAMILIES_PREFIX}${userId}`;
      const familyIds = await redisClient.smembers(familiesKey);

      // Revoke each family
      const promises = familyIds.map(familyId => this.revokeTokenFamily(familyId));
      await Promise.all(promises);

      // Clear the user's family set
      await redisClient.del(familiesKey);

      logger.info(`All tokens revoked for user ${userId}`, {
        userId,
        familiesRevoked: familyIds.length,
      });
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  /**
   * Create a new token family
   * Token families help detect token reuse attacks
   */
  async createTokenFamily(userId: string, familyId: string): Promise<void> {
    try {
      const family: TokenFamily = {
        userId,
        familyId,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        tokenCount: 1,
      };

      // Store family data (expires in 7 days, same as refresh token)
      const familyKey = `${this.FAMILY_PREFIX}${familyId}`;
      await redisClient.setex(
        familyKey,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify(family)
      );

      // Add family to user's family set
      const userFamiliesKey = `${this.USER_FAMILIES_PREFIX}${userId}`;
      await redisClient.sadd(userFamiliesKey, familyId);
      await redisClient.expire(userFamiliesKey, 7 * 24 * 60 * 60); // 7 days

      logger.debug(`Token family created: ${familyId} for user ${userId}`);
    } catch (error) {
      logger.error('Error creating token family:', error);
      throw error;
    }
  }

  /**
   * Update token family on refresh
   * Returns true if family is valid, false if suspected reuse attack
   */
  async updateTokenFamily(familyId: string): Promise<boolean> {
    try {
      const familyKey = `${this.FAMILY_PREFIX}${familyId}`;
      const familyData = await redisClient.get(familyKey);

      if (!familyData) {
        // Family doesn't exist or was revoked - possible reuse attack
        logger.warn(`Token family not found: ${familyId} - possible reuse attack`);
        return false;
      }

      const family: TokenFamily = JSON.parse(familyData);

      // Check if family was used too recently (possible concurrent use)
      const now = Date.now();
      const timeSinceLastUse = now - family.lastUsedAt;
      if (timeSinceLastUse < 1000) {
        // Used within 1 second - might be a reuse attack
        logger.warn(`Token family ${familyId} used too quickly`, {
          timeSinceLastUse,
          userId: family.userId,
        });
        // Revoke entire family as a precaution
        await this.revokeTokenFamily(familyId);
        return false;
      }

      // Update family
      family.lastUsedAt = now;
      family.tokenCount += 1;

      await redisClient.setex(
        familyKey,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify(family)
      );

      logger.debug(`Token family updated: ${familyId}`, {
        tokenCount: family.tokenCount,
      });

      return true;
    } catch (error) {
      logger.error('Error updating token family:', error);
      // Fail secure: reject on error
      return false;
    }
  }

  /**
   * Revoke an entire token family (on detected reuse attack)
   */
  async revokeTokenFamily(familyId: string): Promise<void> {
    try {
      const familyKey = `${this.FAMILY_PREFIX}${familyId}`;
      const familyData = await redisClient.get(familyKey);

      if (familyData) {
        const family: TokenFamily = JSON.parse(familyData);

        // Remove from user's family set
        const userFamiliesKey = `${this.USER_FAMILIES_PREFIX}${family.userId}`;
        await redisClient.srem(userFamiliesKey, familyId);
      }

      // Delete family
      await redisClient.del(familyKey);

      logger.info(`Token family revoked: ${familyId}`);
    } catch (error) {
      logger.error('Error revoking token family:', error);
      throw error;
    }
  }

  /**
   * Validate that a token family exists
   */
  async isTokenFamilyValid(familyId: string): Promise<boolean> {
    try {
      const familyKey = `${this.FAMILY_PREFIX}${familyId}`;
      const exists = await redisClient.exists(familyKey);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking token family:', error);
      // Fail secure: reject on error
      return false;
    }
  }

  /**
   * Get statistics about user's active token families
   */
  async getUserTokenStats(userId: string): Promise<{
    activeFamilies: number;
    totalTokensIssued: number;
  }> {
    try {
      const familiesKey = `${this.USER_FAMILIES_PREFIX}${userId}`;
      const familyIds = await redisClient.smembers(familiesKey);

      let totalTokens = 0;
      for (const familyId of familyIds) {
        const familyKey = `${this.FAMILY_PREFIX}${familyId}`;
        const familyData = await redisClient.get(familyKey);
        if (familyData) {
          const family: TokenFamily = JSON.parse(familyData);
          totalTokens += family.tokenCount;
        }
      }

      return {
        activeFamilies: familyIds.length,
        totalTokensIssued: totalTokens,
      };
    } catch (error) {
      logger.error('Error getting user token stats:', error);
      return { activeFamilies: 0, totalTokensIssued: 0 };
    }
  }
}

// Export singleton instance
export const tokenRevocationService = new TokenRevocationService();
