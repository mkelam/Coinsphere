import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const redisClient = getRedisClient();

/**
 * Account Lockout Service
 *
 * Prevents brute force attacks by locking accounts after failed login attempts.
 * Uses Redis for distributed lockout tracking.
 */
class AccountLockoutService {
  private readonly FAILED_ATTEMPTS_PREFIX = 'failed_attempts:';
  private readonly LOCKOUT_PREFIX = 'account_locked:';

  // Configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly ATTEMPT_WINDOW_MINUTES = 30;

  /**
   * Record a failed login attempt
   * Returns true if account should be locked
   */
  async recordFailedAttempt(email: string): Promise<{
    shouldLock: boolean;
    attemptsRemaining: number;
    lockedUntil?: Date;
  }> {
    try {
      const key = `${this.FAILED_ATTEMPTS_PREFIX}${email.toLowerCase()}`;

      // Increment failed attempts
      const attempts = await redisClient.incr(key);

      // Set TTL on first attempt
      if (attempts === 1) {
        await redisClient.expire(key, this.ATTEMPT_WINDOW_MINUTES * 60);
      }

      // Check if we've exceeded max attempts
      if (attempts >= this.MAX_ATTEMPTS) {
        await this.lockAccount(email);

        const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);

        logger.warn(`Account locked due to failed login attempts: ${email}`, {
          attempts,
          lockedUntil: lockedUntil.toISOString(),
        });

        return {
          shouldLock: true,
          attemptsRemaining: 0,
          lockedUntil,
        };
      }

      return {
        shouldLock: false,
        attemptsRemaining: this.MAX_ATTEMPTS - attempts,
      };
    } catch (error) {
      logger.error('Error recording failed attempt:', error);
      // Fail open - don't lock accounts on Redis errors
      return {
        shouldLock: false,
        attemptsRemaining: this.MAX_ATTEMPTS,
      };
    }
  }

  /**
   * Lock an account
   */
  private async lockAccount(email: string): Promise<void> {
    try {
      const lockKey = `${this.LOCKOUT_PREFIX}${email.toLowerCase()}`;
      const lockDuration = this.LOCKOUT_DURATION_MINUTES * 60; // seconds

      await redisClient.setex(lockKey, lockDuration, Date.now().toString());

      logger.info(`Account locked: ${email} for ${this.LOCKOUT_DURATION_MINUTES} minutes`);
    } catch (error) {
      logger.error('Error locking account:', error);
      throw error;
    }
  }

  /**
   * Check if an account is currently locked
   */
  async isAccountLocked(email: string): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    remainingSeconds?: number;
  }> {
    try {
      const lockKey = `${this.LOCKOUT_PREFIX}${email.toLowerCase()}`;

      const lockTime = await redisClient.get(lockKey);

      if (!lockTime) {
        return { isLocked: false };
      }

      // Get TTL to determine when lock expires
      const ttl = await redisClient.ttl(lockKey);

      if (ttl <= 0) {
        return { isLocked: false };
      }

      const lockedUntil = new Date(Date.now() + ttl * 1000);

      return {
        isLocked: true,
        lockedUntil,
        remainingSeconds: ttl,
      };
    } catch (error) {
      logger.error('Error checking account lockout:', error);
      // Fail open - allow login attempts on Redis errors
      return { isLocked: false };
    }
  }

  /**
   * Clear failed attempts after successful login
   */
  async clearFailedAttempts(email: string): Promise<void> {
    try {
      const key = `${this.FAILED_ATTEMPTS_PREFIX}${email.toLowerCase()}`;
      await redisClient.del(key);

      logger.debug(`Cleared failed attempts for: ${email}`);
    } catch (error) {
      logger.error('Error clearing failed attempts:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Manually unlock an account (admin function)
   */
  async unlockAccount(email: string): Promise<void> {
    try {
      const lockKey = `${this.LOCKOUT_PREFIX}${email.toLowerCase()}`;
      const attemptsKey = `${this.FAILED_ATTEMPTS_PREFIX}${email.toLowerCase()}`;

      await Promise.all([
        redisClient.del(lockKey),
        redisClient.del(attemptsKey),
      ]);

      logger.info(`Account manually unlocked: ${email}`);
    } catch (error) {
      logger.error('Error unlocking account:', error);
      throw error;
    }
  }

  /**
   * Get current failed attempt count
   */
  async getFailedAttemptCount(email: string): Promise<number> {
    try {
      const key = `${this.FAILED_ATTEMPTS_PREFIX}${email.toLowerCase()}`;
      const attempts = await redisClient.get(key);
      return attempts ? parseInt(attempts, 10) : 0;
    } catch (error) {
      logger.error('Error getting failed attempt count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const accountLockoutService = new AccountLockoutService();
