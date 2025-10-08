# Redis Migration Implementation Plan

**Project:** CryptoSense (Coinsphere)
**Date:** 2025-10-08
**Priority:** CRITICAL (P0)
**Estimated Effort:** 12-16 hours
**Dependencies:** Redis server running, ioredis package

---

## 📋 EXECUTIVE SUMMARY

Currently, CSRF tokens, rate limiting, and caching all use **in-memory storage**. This creates:
- **100% failure** in load-balanced production environments
- **Memory leaks** from uncleaned intervals
- **Security vulnerabilities** (rate limit bypass)
- **Poor performance** (no caching)

This migration plan moves all stateful data to **Redis**, enabling:
- ✅ Horizontal scaling across multiple servers
- ✅ Persistent state across server restarts
- ✅ Distributed rate limiting and CSRF protection
- ✅ Efficient caching layer
- ✅ Session management foundation

---

## 🎯 MIGRATION GOALS

### Phase 1: Infrastructure Setup (1 hour)
- Install and configure ioredis
- Create Redis client singleton
- Add connection management
- Set up error handling

### Phase 2: CSRF Token Migration (2-3 hours)
- Replace in-memory Map with Redis storage
- Implement token generation/validation with Redis
- Add token rotation
- Test CSRF protection

### Phase 3: Rate Limiting Migration (2-3 hours)
- Replace in-memory store with Redis
- Implement distributed rate limiting
- Add per-user and per-IP limiting
- Test rate limit enforcement

### Phase 4: Caching Layer (4-6 hours)
- Create cache wrapper utilities
- Implement CoinGecko API response caching
- Add portfolio query caching
- Add prediction/risk score caching
- Test cache hit/miss scenarios

### Phase 5: Testing & Validation (2-3 hours)
- Integration testing
- Load testing
- Failover testing
- Performance benchmarking

---

## 📦 PREREQUISITES

### 1. Install ioredis

```bash
cd backend
npm install ioredis @types/ioredis
```

### 2. Verify Redis Server

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis version
redis-cli --version
# Recommended: 7.0+

# Test connection from Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(console.log).finally(() => redis.quit());"
```

### 3. Update Environment Variables

Add to `.env`:
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=  # Leave empty for local dev
REDIS_TLS=false  # Set to true in production
REDIS_DB=0  # Database number (0-15)
```

---

## 🔧 PHASE 1: INFRASTRUCTURE SETUP

### Step 1.1: Create Redis Client Singleton

**File:** `backend/src/lib/redis.ts` (NEW)

```typescript
import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class RedisClient {
  private static instance: Redis | null = null;
  private static isShuttingDown = false;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetErrors = ['READONLY', 'ECONNREFUSED'];
          if (targetErrors.some(targetError => err.message.includes(targetError))) {
            logger.error(`Redis reconnecting due to error: ${err.message}`);
            return true;
          }
          return false;
        },
      });

      // Connection event handlers
      RedisClient.instance.on('connect', () => {
        logger.info('✅ Redis client connected');
      });

      RedisClient.instance.on('ready', () => {
        logger.info('✅ Redis client ready');
      });

      RedisClient.instance.on('error', (error) => {
        logger.error('❌ Redis client error:', error);
      });

      RedisClient.instance.on('close', () => {
        if (!RedisClient.isShuttingDown) {
          logger.warn('⚠️  Redis connection closed unexpectedly');
        }
      });

      RedisClient.instance.on('reconnecting', () => {
        logger.info('🔄 Redis client reconnecting');
      });
    }

    return RedisClient.instance;
  }

  static async shutdown(): Promise<void> {
    if (RedisClient.instance) {
      RedisClient.isShuttingDown = true;
      logger.info('Shutting down Redis connection');
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      RedisClient.isShuttingDown = false;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const redis = RedisClient.getInstance();
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

export const redis = RedisClient.getInstance();
export const redisHealthCheck = RedisClient.healthCheck;
export const shutdownRedis = RedisClient.shutdown;
```

### Step 1.2: Add Graceful Shutdown

**File:** `backend/src/server.ts`

```typescript
import { shutdownRedis } from './lib/redis.js';

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop background services
    priceUpdaterService.stop();
    websocketService.stop();

    // Shutdown Redis
    await shutdownRedis();

    // Close database
    await prisma.$disconnect();

    logger.info('All connections closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  process.kill(process.pid, 'SIGTERM');
});
```

### Step 1.3: Update Health Check

**File:** `backend/src/server.ts`

```typescript
import { redisHealthCheck } from './lib/redis.js';

// Enhanced health check
app.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: false,
      redis: false,
    },
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
  }

  // Check Redis
  checks.services.redis = await redisHealthCheck();

  const allHealthy = Object.values(checks.services).every(status => status === true);
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json(checks);
});
```

---

## 🔧 PHASE 2: CSRF TOKEN MIGRATION

### Step 2.1: Create CSRF Service

**File:** `backend/src/services/csrfService.ts` (NEW)

```typescript
import crypto from 'crypto';
import { redis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export class CsrfTokenService {
  private readonly TOKEN_PREFIX = 'csrf:';
  private readonly TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds

  async generateToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const key = this.getKey(userId);

    try {
      await redis.setex(key, this.TOKEN_TTL, token);
      logger.debug(`CSRF token generated for user: ${userId}`);
      return token;
    } catch (error) {
      logger.error('Error generating CSRF token:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }

  async validateToken(userId: string, token: string): Promise<boolean> {
    const key = this.getKey(userId);

    try {
      const storedToken = await redis.get(key);

      if (!storedToken) {
        logger.warn(`CSRF token not found for user: ${userId}`);
        return false;
      }

      if (storedToken !== token) {
        logger.warn(`CSRF token mismatch for user: ${userId}`);
        return false;
      }

      // Token is valid - rotate it for additional security
      await this.rotateToken(userId);

      return true;
    } catch (error) {
      logger.error('Error validating CSRF token:', error);
      return false;
    }
  }

  async rotateToken(userId: string): Promise<string> {
    const newToken = await this.generateToken(userId);
    logger.debug(`CSRF token rotated for user: ${userId}`);
    return newToken;
  }

  async revokeToken(userId: string): Promise<void> {
    const key = this.getKey(userId);

    try {
      await redis.del(key);
      logger.debug(`CSRF token revoked for user: ${userId}`);
    } catch (error) {
      logger.error('Error revoking CSRF token:', error);
    }
  }

  private getKey(userId: string): string {
    return `${this.TOKEN_PREFIX}${userId}`;
  }

  // Cleanup expired tokens (optional - Redis does this automatically)
  async cleanupExpiredTokens(): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    try {
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          `${this.TOKEN_PREFIX}*`,
          'COUNT',
          100
        );

        cursor = nextCursor;

        for (const key of keys) {
          const ttl = await redis.ttl(key);
          if (ttl === -1) {
            // Key has no expiry - delete it
            await redis.del(key);
            deletedCount++;
          }
        }
      } while (cursor !== '0');

      logger.info(`Cleaned up ${deletedCount} orphaned CSRF tokens`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up CSRF tokens:', error);
      return 0;
    }
  }
}

export const csrfTokenService = new CsrfTokenService();
```

### Step 2.2: Update CSRF Middleware

**File:** `backend/src/middleware/csrf.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { csrfTokenService } from '../services/csrfService.js';
import { logger } from '../utils/logger.js';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

export async function validateCsrfToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Skip CSRF validation for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for exempt paths
  if (CSRF_EXEMPT_PATHS.includes(req.path)) {
    return next();
  }

  // Get user ID from request (set by auth middleware)
  const userId = req.user?.userId;
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
    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING',
    });
  }

  // Validate token
  const isValid = await csrfTokenService.validateToken(userId, csrfToken);

  if (!isValid) {
    logger.warn(`CSRF token validation failed for user ${userId}`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({
      error: 'CSRF token invalid or expired',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  // Token is valid
  next();
}

export async function getCsrfToken(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = await csrfTokenService.generateToken(userId);
    res.json({ csrfToken: token });
  } catch (error) {
    logger.error('Error getting CSRF token:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
}
```

---

## 🔧 PHASE 3: RATE LIMITING MIGRATION

### Step 3.1: Create Rate Limit Service

**File:** `backend/src/services/rateLimitService.ts` (NEW)

```typescript
import { Request } from 'express';
import { redis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Max requests per window
  prefix: string;    // Redis key prefix
  message?: string;  // Error message
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  total: number;
}

export class RateLimitService {
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const windowEnd = now;

    try {
      // Use Redis sorted set for sliding window rate limiting
      const multi = redis.multi();

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Add current request
      multi.zadd(key, now, `${now}:${Math.random()}`);

      // Count requests in window
      multi.zcount(key, windowStart, windowEnd);

      // Set expiry on key
      multi.expire(key, Math.ceil(config.windowMs / 1000));

      const results = await multi.exec();

      if (!results) {
        throw new Error('Redis multi exec failed');
      }

      const count = results[2][1] as number;
      const allowed = count <= config.max;
      const remaining = Math.max(0, config.max - count);
      const resetTime = new Date(now + config.windowMs);

      return {
        allowed,
        remaining,
        resetTime,
        total: count,
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Fail open (allow request) on Redis errors
      return {
        allowed: true,
        remaining: config.max,
        resetTime: new Date(now + config.windowMs),
        total: 0,
      };
    }
  }

  getClientIdentifier(req: Request): string {
    // For authenticated requests, use user ID
    const user = (req as any).user;
    if (user?.userId) {
      return `user:${user.userId}`;
    }

    // For unauthenticated requests, use IP
    // Trust X-Forwarded-For if behind proxy
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string') {
      return `ip:${forwardedFor.split(',')[0].trim()}`;
    }

    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  }

  async resetLimit(identifier: string, prefix: string): Promise<void> {
    const key = `${prefix}:${identifier}`;
    try {
      await redis.del(key);
      logger.debug(`Rate limit reset for: ${identifier}`);
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
    }
  }
}

export const rateLimitService = new RateLimitService();
```

### Step 3.2: Update Rate Limit Middleware

**File:** `backend/src/middleware/rateLimit.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { rateLimitService, RateLimitConfig } from '../services/rateLimitService.js';
import { logger } from '../utils/logger.js';

export function rateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = rateLimitService.getClientIdentifier(req);

    try {
      const result = await rateLimitService.checkLimit(identifier, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        logger.warn(`Rate limit exceeded for ${identifier}`, {
          path: req.path,
          method: req.method,
          total: result.total,
          limit: config.max,
        });

        return res.status(429).json({
          error: config.message || 'Too many requests',
          retryAfter,
          limit: config.max,
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // Fail open - allow request on error
      next();
    }
  };
}

// Predefined rate limiters
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  prefix: 'ratelimit:auth',
  message: 'Too many authentication attempts, please try again later',
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  prefix: 'ratelimit:api',
  message: 'Too many API requests, please try again later',
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  prefix: 'ratelimit:strict',
  message: 'Too many requests, please slow down',
});
```

---

## 🔧 PHASE 4: CACHING LAYER

### Step 4.1: Create Cache Service

**File:** `backend/src/services/cacheService.ts` (NEW)

```typescript
import { redis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export interface CacheOptions {
  ttl: number;  // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    try {
      const fullKey = options.prefix ? `${options.prefix}:${key}` : key;
      const serialized = JSON.stringify(value);

      await redis.setex(fullKey, options.ttl, serialized);
      logger.debug(`Cache set: ${fullKey} (TTL: ${options.ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    try {
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      logger.debug(`Cache deleted ${deletedCount} keys matching: ${pattern}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async cached<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
    prefix?: string
  ): Promise<T> {
    const fullKey = prefix ? `${prefix}:${key}` : key;

    // Try cache first
    const cached = await this.get<T>(fullKey);
    if (cached !== null) {
      logger.debug(`Cache hit: ${fullKey}`);
      return cached;
    }

    // Cache miss - fetch data
    logger.debug(`Cache miss: ${fullKey}`);
    const data = await fetchFn();

    // Store in cache
    await this.set(fullKey, data, { ttl, prefix });

    return data;
  }
}

export const cacheService = new CacheService();
```

### Step 4.2: Add Caching to CoinGecko Service

**File:** `backend/src/services/coingecko.ts`

```typescript
import { cacheService } from './cacheService.js';

export class CoinGeckoService {
  // ... existing code ...

  async getMarketData(coinIds: string[]): Promise<CoinGeckoPrice[]> {
    const cacheKey = `coingecko:market:${coinIds.sort().join(',')}`;
    const CACHE_TTL = 30; // 30 seconds

    return await cacheService.cached(
      cacheKey,
      CACHE_TTL,
      async () => {
        await this.enforceRateLimit();

        const response = await this.client.get('/coins/markets', {
          params: {
            vs_currency: 'usd',
            ids: coinIds.join(','),
            order: 'market_cap_desc',
            per_page: 250,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h',
          },
        });

        logger.info(`Fetched market data for ${response.data.length} coins from API`);
        return response.data;
      }
    );
  }

  // Invalidate cache when needed
  async invalidateMarketDataCache(coinIds?: string[]): Promise<void> {
    if (coinIds) {
      const cacheKey = `coingecko:market:${coinIds.sort().join(',')}`;
      await cacheService.del(cacheKey);
    } else {
      // Invalidate all market data
      await cacheService.delPattern('coingecko:market:*');
    }
  }
}
```

### Step 4.3: Add Caching to Portfolio Queries

**File:** `backend/src/routes/portfolios.ts`

```typescript
import { cacheService } from '../services/cacheService.js';

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cacheKey = `portfolio:user:${userId}`;
    const CACHE_TTL = 60; // 1 minute

    const portfolios = await cacheService.cached(
      cacheKey,
      CACHE_TTL,
      async () => {
        return await prisma.portfolio.findMany({
          where: { userId },
          include: {
            holdings: {
              include: {
                token: {
                  select: {
                    symbol: true,
                    name: true,
                    currentPrice: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        });
      }
    );

    res.json({ portfolios });
  } catch (error) {
    logger.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invalidate cache when portfolio changes
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    // ... create portfolio ...

    // Invalidate user's portfolio cache
    await cacheService.del(`portfolio:user:${userId}`);

    res.status(201).json({ portfolio });
  } catch (error) {
    // ... error handling ...
  }
});
```

---

## 🔧 PHASE 5: TESTING & VALIDATION

### Step 5.1: Integration Tests

**File:** `backend/tests/redis.integration.test.ts` (NEW)

```typescript
import { redis, redisHealthCheck } from '../src/lib/redis';
import { csrfTokenService } from '../src/services/csrfService';
import { rateLimitService } from '../src/services/rateLimitService';
import { cacheService } from '../src/services/cacheService';

describe('Redis Integration Tests', () => {
  beforeAll(async () => {
    // Ensure Redis is connected
    const isHealthy = await redisHealthCheck();
    if (!isHealthy) {
      throw new Error('Redis is not available for testing');
    }
  });

  afterAll(async () => {
    // Clean up test data
    await redis.flushdb();
  });

  describe('CSRF Token Service', () => {
    it('should generate and validate CSRF token', async () => {
      const userId = 'test-user-123';
      const token = await csrfTokenService.generateToken(userId);

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes hex = 64 chars

      const isValid = await csrfTokenService.validateToken(userId, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', async () => {
      const userId = 'test-user-123';
      await csrfTokenService.generateToken(userId);

      const isValid = await csrfTokenService.validateToken(userId, 'invalid-token');
      expect(isValid).toBe(false);
    });

    it('should rotate CSRF token', async () => {
      const userId = 'test-user-123';
      const token1 = await csrfTokenService.generateToken(userId);
      const token2 = await csrfTokenService.rotateToken(userId);

      expect(token1).not.toBe(token2);

      // Old token should be invalid
      const isValid1 = await csrfTokenService.validateToken(userId, token1);
      expect(isValid1).toBe(false);

      // New token should be valid
      const isValid2 = await csrfTokenService.validateToken(userId, token2);
      expect(isValid2).toBe(true);
    });
  });

  describe('Rate Limit Service', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'test-client-1';
      const config = {
        windowMs: 60000,
        max: 5,
        prefix: 'test:ratelimit',
      };

      for (let i = 0; i < 5; i++) {
        const result = await rateLimitService.checkLimit(identifier, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(5 - i - 1);
      }
    });

    it('should block requests exceeding limit', async () => {
      const identifier = 'test-client-2';
      const config = {
        windowMs: 60000,
        max: 3,
        prefix: 'test:ratelimit',
      };

      // Make 3 requests (at limit)
      for (let i = 0; i < 3; i++) {
        await rateLimitService.checkLimit(identifier, config);
      }

      // 4th request should be blocked
      const result = await rateLimitService.checkLimit(identifier, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Cache Service', () => {
    it('should set and get cached data', async () => {
      const key = 'test:cache:1';
      const value = { name: 'Bitcoin', price: 50000 };

      await cacheService.set(key, value, { ttl: 60 });
      const cached = await cacheService.get(key);

      expect(cached).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const cached = await cacheService.get('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should delete cached data', async () => {
      const key = 'test:cache:2';
      const value = { name: 'Ethereum', price: 3000 };

      await cacheService.set(key, value, { ttl: 60 });
      await cacheService.del(key);

      const cached = await cacheService.get(key);
      expect(cached).toBeNull();
    });

    it('should use cached function', async () => {
      const key = 'test:cached:1';
      let callCount = 0;

      const fetchFn = async () => {
        callCount++;
        return { data: 'test-data' };
      };

      // First call - cache miss
      const result1 = await cacheService.cached(key, 60, fetchFn);
      expect(result1).toEqual({ data: 'test-data' });
      expect(callCount).toBe(1);

      // Second call - cache hit
      const result2 = await cacheService.cached(key, 60, fetchFn);
      expect(result2).toEqual({ data: 'test-data' });
      expect(callCount).toBe(1); // Function not called again
    });
  });
});
```

### Step 5.2: Load Testing

**File:** `backend/tests/load-test.js` (NEW)

```javascript
// Run with: node tests/load-test.js

const axios = require('axios');

const API_URL = 'http://localhost:3001';
const CONCURRENT_USERS = 100;
const REQUESTS_PER_USER = 10;

async function testRateLimit() {
  console.log('Testing rate limiting...');

  const promises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    for (let j = 0; j < REQUESTS_PER_USER; j++) {
      promises.push(
        axios.get(`${API_URL}/api/v1/tokens`).catch(err => {
          if (err.response?.status === 429) {
            return { rateLimited: true };
          }
          throw err;
        })
      );
    }
  }

  const results = await Promise.all(promises);
  const rateLimited = results.filter(r => r.rateLimited).length;

  console.log(`Total requests: ${results.length}`);
  console.log(`Rate limited: ${rateLimited}`);
  console.log(`Success rate: ${((results.length - rateLimited) / results.length * 100).toFixed(2)}%`);
}

async function testCachePerformance() {
  console.log('Testing cache performance...');

  const iterations = 100;

  // First request (cache miss)
  const start1 = Date.now();
  await axios.get(`${API_URL}/api/v1/tokens`);
  const duration1 = Date.now() - start1;
  console.log(`Cache miss duration: ${duration1}ms`);

  // Subsequent requests (cache hit)
  const start2 = Date.now();
  for (let i = 0; i < iterations; i++) {
    await axios.get(`${API_URL}/api/v1/tokens`);
  }
  const duration2 = Date.now() - start2;
  const avgDuration = duration2 / iterations;
  console.log(`Average cache hit duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Cache speedup: ${(duration1 / avgDuration).toFixed(2)}x`);
}

async function main() {
  try {
    await testRateLimit();
    await testCachePerformance();
  } catch (error) {
    console.error('Load test failed:', error.message);
    process.exit(1);
  }
}

main();
```

---

## ✅ VERIFICATION CHECKLIST

### Infrastructure
- [ ] Redis server running and accessible
- [ ] ioredis package installed
- [ ] Redis client singleton created
- [ ] Health check endpoint updated
- [ ] Graceful shutdown implemented

### CSRF Tokens
- [ ] CSRF service created
- [ ] CSRF middleware updated
- [ ] Token generation working
- [ ] Token validation working
- [ ] Token rotation implemented
- [ ] Frontend updated to use new endpoint

### Rate Limiting
- [ ] Rate limit service created
- [ ] Rate limit middleware updated
- [ ] Per-user rate limiting working
- [ ] Per-IP rate limiting working
- [ ] Rate limit headers set correctly

### Caching
- [ ] Cache service created
- [ ] CoinGecko API responses cached
- [ ] Portfolio queries cached
- [ ] Cache invalidation working
- [ ] Cache hit/miss logged

### Testing
- [ ] Integration tests passing
- [ ] Load tests passing
- [ ] Performance improved
- [ ] No memory leaks
- [ ] Server restarts don't break functionality

---

## 📈 EXPECTED IMPROVEMENTS

### Performance
- **API Response Time**: 200-500ms → 10-50ms (cache hits)
- **CoinGecko API Calls**: 60/min → 2/min (with caching)
- **Database Queries**: Reduced by 70-80% (with caching)

### Reliability
- **Server Restarts**: No session/token loss
- **Horizontal Scaling**: Support for multiple instances
- **Memory Usage**: Stable over time (no leaks)

### Security
- **Rate Limit Bypass**: Fixed (distributed limiting)
- **CSRF Protection**: Works across all servers
- **Token Persistence**: Survives restarts

---

## 🚨 ROLLBACK PLAN

If Redis migration causes issues:

1. **Immediate Rollback:**
   ```bash
   git checkout HEAD~1 backend/src/lib/redis.ts
   git checkout HEAD~1 backend/src/services/
   git checkout HEAD~1 backend/src/middleware/csrf.ts
   git checkout HEAD~1 backend/src/middleware/rateLimit.ts
   ```

2. **Keep Current Code (Fallback to In-Memory):**
   - Comment out Redis imports
   - Restore old in-memory implementations
   - Restart services

3. **Verify Rollback:**
   - Test authentication flow
   - Test rate limiting
   - Check error logs

---

## 📚 ADDITIONAL RESOURCES

- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Rate Limiting Patterns](https://redis.io/docs/manual/patterns/rate-limiter/)
- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)

---

**Last Updated:** 2025-10-08
**Next Steps:** Begin Phase 1 (Infrastructure Setup)
