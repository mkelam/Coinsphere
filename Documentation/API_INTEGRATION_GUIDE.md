# API Integration Guide - Coinsphere

**Document Version**: 1.0
**Date**: October 7, 2025
**Status**: Ready for Implementation
**Target**: 20+ Exchange Integrations

---

## Table of Contents

1. [Overview](#overview)
2. [Exchange Integration Architecture](#exchange-integration-architecture)
3. [Supported Exchanges](#supported-exchanges)
4. [Integration Pattern](#integration-pattern)
5. [Step-by-Step: Adding a New Exchange](#step-by-step-adding-a-new-exchange)
6. [Rate Limiting Strategy](#rate-limiting-strategy)
7. [Error Handling](#error-handling)
8. [Testing Exchange Integrations](#testing-exchange-integrations)
9. [Security Considerations](#security-considerations)

---

## 1. Overview

### 1.1 Goal

Enable users to sync their crypto portfolios from **20+ exchanges** with **99%+ sync accuracy**.

**MVP Priority Exchanges** (Week 1-2):
1. Binance (largest exchange, 120M users)
2. Coinbase (US market leader)
3. Kraken (strong reputation, API-friendly)

**Phase 2 Exchanges** (Week 3-4):
4. Bybit, OKX, KuCoin, Bitget, Gate.io, MEXC, HTX, Bitfinex, Gemini, Bitstamp, Crypto.com

**Phase 3 Exchanges** (Month 2-3):
15. Upbit, Bithumb, Korbit (Korea), Bitso, Mercado Bitcoin (LatAm), WazirX (India)

### 1.2 Integration Types

| Type | Description | Implementation Complexity | Examples |
|------|-------------|--------------------------|----------|
| **REST API** | Poll for balances/transactions | Medium | Binance, Coinbase, Kraken |
| **WebSocket** | Real-time balance updates | High | Binance WS, OKX WS |
| **CCXT Library** | Unified exchange wrapper | Low | All supported by CCXT |

**Recommended**: Use **CCXT library** for consistency and faster development.

---

## 2. Exchange Integration Architecture

### 2.1 System Design

```
┌──────────────────────────────────────────────────┐
│                  User Request                     │
│        "Sync my Binance portfolio"               │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│         Exchange Connection Service              │
│                                                  │
│  - Validate API keys                            │
│  - Select exchange adapter                       │
│  - Trigger sync job                             │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│          Exchange Adapter (CCXT)                 │
│                                                  │
│  - BinanceAdapter                               │
│  - CoinbaseAdapter                              │
│  - KrakenAdapter                                │
│  - ... (20+ adapters)                           │
└───────────────────┬──────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ Binance │ │Coinbase │ │ Kraken  │
  │   API   │ │   API   │ │   API   │
  └─────────┘ └─────────┘ └─────────┘
        │           │           │
        └───────────┼───────────┘
                    ▼
┌──────────────────────────────────────────────────┐
│          Data Normalization Layer                │
│                                                  │
│  - Convert to standard format                    │
│  - Calculate USD values                         │
│  - Deduplicate holdings                         │
└───────────────────┬──────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────┐
│            Database (PostgreSQL)                 │
│                                                  │
│  - Save to holdings table                       │
│  - Update last_sync_at timestamp                │
└──────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **User connects exchange** → Store encrypted API key
2. **Sync triggered** (manual or scheduled) → Create sync job
3. **Exchange adapter** → Fetch balances via CCXT
4. **Normalize data** → Convert to standard format
5. **Save to database** → Update holdings table
6. **Notify user** → "Sync complete" or "Sync failed"

---

## 3. Supported Exchanges

### 3.1 Exchange Matrix

| Exchange | API Docs | CCXT Support | Rate Limit | Priority |
|----------|----------|--------------|------------|----------|
| **Binance** | [docs.binance.com](https://binance-docs.github.io/apidocs/) | ✅ Yes | 1200/min | MVP |
| **Coinbase** | [docs.cloud.coinbase.com](https://docs.cloud.coinbase.com/) | ✅ Yes | 10/sec | MVP |
| **Kraken** | [docs.kraken.com](https://docs.kraken.com/rest/) | ✅ Yes | 15/sec | MVP |
| **Bybit** | [bybit-exchange.github.io](https://bybit-exchange.github.io/docs/) | ✅ Yes | 120/min | Phase 2 |
| **OKX** | [okx.com/docs-v5](https://www.okx.com/docs-v5/en/) | ✅ Yes | 60/2sec | Phase 2 |
| **KuCoin** | [docs.kucoin.com](https://docs.kucoin.com/) | ✅ Yes | 1800/min | Phase 2 |

**Full list**: See [CCXT Supported Exchanges](https://github.com/ccxt/ccxt#supported-cryptocurrency-exchange-markets) (300+ exchanges)

### 3.2 API Key Permissions

**CRITICAL**: Only accept **READ-ONLY** API keys (no trading/withdrawal permissions).

**Required Permissions**:
- ✅ **Read balances** (spot, futures, margin)
- ✅ **Read transaction history** (optional)

**Forbidden Permissions**:
- ❌ **Trade** (create/cancel orders)
- ❌ **Withdraw** (send funds)
- ❌ **Manage sub-accounts**

**Validation during connection**:
```javascript
async function validateApiKeyPermissions(exchange, apiKey, apiSecret) {
  try {
    // Attempt to access balance (safe operation)
    const balance = await exchange.fetchBalance();

    // Try to create order (should fail if read-only)
    try {
      await exchange.createOrder('BTC/USDT', 'limit', 'buy', 0.001, 1);
      throw new Error('API key has TRADING permissions. Please use read-only key.');
    } catch (error) {
      if (error.message.includes('permission')) {
        return true; // Good! Read-only key
      }
      throw error;
    }
  } catch (error) {
    throw new Error(`API key validation failed: ${error.message}`);
  }
}
```

---

## 4. Integration Pattern

### 4.1 CCXT Library Setup

**Installation**:
```bash
npm install ccxt
```

**Basic Usage**:
```javascript
import ccxt from 'ccxt';

// Initialize exchange
const binance = new ccxt.binance({
  apiKey: 'YOUR_API_KEY',
  secret: 'YOUR_API_SECRET',
  enableRateLimit: true,  // Auto rate limiting
});

// Fetch balance
const balance = await binance.fetchBalance();
console.log(balance);
```

### 4.2 Generic Exchange Adapter

**File**: `backend/src/services/exchanges/BaseExchangeAdapter.ts`

```typescript
import ccxt, { Exchange } from 'ccxt';
import { decrypt } from '../../utils/encryption';

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  password?: string; // For exchanges like KuCoin
}

export interface NormalizedHolding {
  symbol: string;          // 'BTC', 'ETH'
  quantity: number;        // 1.5
  free: number;            // Available balance
  locked: number;          // In orders
  usdValue?: number;       // Calculated from current price
  accountType: 'spot' | 'futures' | 'margin';
}

export abstract class BaseExchangeAdapter {
  protected exchange: Exchange;
  protected exchangeName: string;

  constructor(exchangeName: string, credentials: ExchangeCredentials) {
    this.exchangeName = exchangeName;

    // Initialize CCXT exchange
    const ExchangeClass = ccxt[exchangeName as keyof typeof ccxt] as any;
    this.exchange = new ExchangeClass({
      apiKey: credentials.apiKey,
      secret: credentials.apiSecret,
      password: credentials.password,
      enableRateLimit: true,
      options: {
        defaultType: 'spot', // Default to spot market
      },
    });
  }

  /**
   * Fetch all balances from exchange
   */
  async fetchBalances(): Promise<NormalizedHolding[]> {
    try {
      const balance = await this.exchange.fetchBalance();
      return this.normalizeBalance(balance);
    } catch (error) {
      throw new Error(`Failed to fetch balances from ${this.exchangeName}: ${error.message}`);
    }
  }

  /**
   * Normalize CCXT balance format to our standard
   */
  protected normalizeBalance(balance: any): NormalizedHolding[] {
    const holdings: NormalizedHolding[] = [];

    // CCXT balance format:
    // { BTC: { free: 1.5, used: 0.0, total: 1.5 }, ETH: {...}, ... }
    for (const [symbol, data] of Object.entries(balance)) {
      if (symbol === 'info' || symbol === 'free' || symbol === 'used' || symbol === 'total') {
        continue; // Skip metadata
      }

      const holding = data as any;

      if (holding.total > 0) {
        holdings.push({
          symbol: symbol,
          quantity: holding.total,
          free: holding.free,
          locked: holding.used,
          accountType: 'spot',
        });
      }
    }

    return holdings;
  }

  /**
   * Test API key connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.exchange.fetchBalance();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get exchange info
   */
  getExchangeInfo() {
    return {
      name: this.exchangeName,
      rateLimit: this.exchange.rateLimit,
      has: this.exchange.has, // Supported features
    };
  }
}
```

### 4.3 Exchange-Specific Adapters

**Binance Adapter**:
```typescript
// backend/src/services/exchanges/BinanceAdapter.ts
import { BaseExchangeAdapter, ExchangeCredentials, NormalizedHolding } from './BaseExchangeAdapter';

export class BinanceAdapter extends BaseExchangeAdapter {
  constructor(credentials: ExchangeCredentials) {
    super('binance', credentials);
  }

  /**
   * Binance-specific: Fetch both spot and futures balances
   */
  async fetchBalances(): Promise<NormalizedHolding[]> {
    const spotBalances = await super.fetchBalances();

    // Fetch futures balances (if user enabled)
    let futuresBalances: NormalizedHolding[] = [];
    if (this.exchange.has['fetchBalance']) {
      try {
        this.exchange.options['defaultType'] = 'future';
        const futuresBalance = await this.exchange.fetchBalance();
        futuresBalances = this.normalizeBalance(futuresBalance).map(h => ({
          ...h,
          accountType: 'futures' as const,
        }));
      } catch (error) {
        console.log('Futures not available for this account');
      }
    }

    return [...spotBalances, ...futuresBalances];
  }
}
```

**Coinbase Adapter**:
```typescript
// backend/src/services/exchanges/CoinbaseAdapter.ts
import { BaseExchangeAdapter, ExchangeCredentials } from './BaseExchangeAdapter';

export class CoinbaseAdapter extends BaseExchangeAdapter {
  constructor(credentials: ExchangeCredentials) {
    super('coinbase', credentials);
  }

  // Coinbase uses OAuth, may need special auth handling
  // For now, use standard API key (Coinbase Advanced Trade API)
}
```

### 4.4 Exchange Factory

**File**: `backend/src/services/exchanges/ExchangeFactory.ts`

```typescript
import { BaseExchangeAdapter, ExchangeCredentials } from './BaseExchangeAdapter';
import { BinanceAdapter } from './BinanceAdapter';
import { CoinbaseAdapter } from './CoinbaseAdapter';
import { KrakenAdapter } from './KrakenAdapter';

export class ExchangeFactory {
  static create(exchangeName: string, credentials: ExchangeCredentials): BaseExchangeAdapter {
    switch (exchangeName.toLowerCase()) {
      case 'binance':
        return new BinanceAdapter(credentials);
      case 'coinbase':
        return new CoinbaseAdapter(credentials);
      case 'kraken':
        return new KrakenAdapter(credentials);
      // Add more exchanges here
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }
  }

  static getSupportedExchanges(): string[] {
    return ['binance', 'coinbase', 'kraken', 'bybit', 'okx', 'kucoin'];
  }
}
```

---

## 5. Step-by-Step: Adding a New Exchange

### Step 1: Check CCXT Support

```bash
# Check if exchange is supported by CCXT
node -e "const ccxt = require('ccxt'); console.log(ccxt.exchanges.includes('bybit'))"
# Output: true
```

### Step 2: Create Adapter

**File**: `backend/src/services/exchanges/BybitAdapter.ts`

```typescript
import { BaseExchangeAdapter, ExchangeCredentials } from './BaseExchangeAdapter';

export class BybitAdapter extends BaseExchangeAdapter {
  constructor(credentials: ExchangeCredentials) {
    super('bybit', credentials);
  }

  // Override methods if exchange has specific quirks
  // Otherwise, use base class implementation
}
```

### Step 3: Register in Factory

```typescript
// backend/src/services/exchanges/ExchangeFactory.ts
import { BybitAdapter } from './BybitAdapter';

export class ExchangeFactory {
  static create(exchangeName: string, credentials: ExchangeCredentials): BaseExchangeAdapter {
    switch (exchangeName.toLowerCase()) {
      // ... existing cases
      case 'bybit':
        return new BybitAdapter(credentials);
      default:
        throw new Error(`Unsupported exchange: ${exchangeName}`);
    }
  }

  static getSupportedExchanges(): string[] {
    return ['binance', 'coinbase', 'kraken', 'bybit']; // Add 'bybit'
  }
}
```

### Step 4: Add to Database Enum

```sql
-- migrations/YYYYMMDD_add_bybit_to_exchanges.sql
ALTER TABLE exchange_connections
DROP CONSTRAINT IF EXISTS exchange_name_check;

ALTER TABLE exchange_connections
ADD CONSTRAINT exchange_name_check
CHECK (exchange_name IN ('binance', 'coinbase', 'kraken', 'bybit')); -- Add 'bybit'
```

### Step 5: Update Frontend

```typescript
// frontend/src/constants/exchanges.ts
export const SUPPORTED_EXCHANGES = [
  { name: 'Binance', id: 'binance', logo: '/logos/binance.png' },
  { name: 'Coinbase', id: 'coinbase', logo: '/logos/coinbase.png' },
  { name: 'Kraken', id: 'kraken', logo: '/logos/kraken.png' },
  { name: 'Bybit', id: 'bybit', logo: '/logos/bybit.png' }, // Add Bybit
];
```

### Step 6: Test Integration

```typescript
// backend/tests/exchanges/bybit.test.ts
import { BybitAdapter } from '../../src/services/exchanges/BybitAdapter';

describe('BybitAdapter', () => {
  it('should fetch balances from Bybit', async () => {
    const adapter = new BybitAdapter({
      apiKey: process.env.BYBIT_TEST_API_KEY!,
      apiSecret: process.env.BYBIT_TEST_API_SECRET!,
    });

    const balances = await adapter.fetchBalances();

    expect(balances).toBeInstanceOf(Array);
    expect(balances.length).toBeGreaterThan(0);
    expect(balances[0]).toHaveProperty('symbol');
    expect(balances[0]).toHaveProperty('quantity');
  });
});
```

---

## 6. Rate Limiting Strategy

### 6.1 Exchange Rate Limits

| Exchange | Rate Limit | Weight System | Notes |
|----------|------------|---------------|-------|
| Binance | 1200 req/min | Yes (weighted endpoints) | Balance = weight 10 |
| Coinbase | 10 req/sec | No | Simple count |
| Kraken | 15 req/sec | Tiered by plan | Pro users get higher limits |

### 6.2 CCXT Auto Rate Limiting

**CCXT handles rate limiting automatically**:
```javascript
const binance = new ccxt.binance({
  enableRateLimit: true,  // CCXT waits between requests
});
```

### 6.3 Custom Rate Limiter (for non-CCXT integrations)

```typescript
// backend/src/utils/rateLimiter.ts
import Bottleneck from 'bottleneck';

export class ExchangeRateLimiter {
  private limiters: Map<string, Bottleneck> = new Map();

  getLimiter(exchangeName: string): Bottleneck {
    if (!this.limiters.has(exchangeName)) {
      const config = this.getRateLimitConfig(exchangeName);
      this.limiters.set(exchangeName, new Bottleneck(config));
    }
    return this.limiters.get(exchangeName)!;
  }

  private getRateLimitConfig(exchangeName: string) {
    const configs = {
      binance: { maxConcurrent: 10, minTime: 50 }, // 1200/min = 50ms between requests
      coinbase: { maxConcurrent: 10, minTime: 100 }, // 10/sec = 100ms
      kraken: { maxConcurrent: 5, minTime: 67 }, // 15/sec = 67ms
    };

    return configs[exchangeName] || { maxConcurrent: 5, minTime: 200 };
  }
}

// Usage
const limiter = new ExchangeRateLimiter();
const binanceLimiter = limiter.getLimiter('binance');

await binanceLimiter.schedule(() => binance.fetchBalance());
```

---

## 7. Error Handling

### 7.1 Common Exchange Errors

| Error Type | CCXT Error Class | User Message | Retry? |
|------------|------------------|--------------|--------|
| Invalid API key | `AuthenticationError` | "Invalid API credentials" | ❌ No |
| Insufficient permissions | `PermissionDenied` | "API key missing read permissions" | ❌ No |
| Rate limit exceeded | `RateLimitExceeded` | "Too many requests. Try again in 1 minute" | ✅ Yes (with backoff) |
| Network error | `NetworkError` | "Connection failed. Check your internet" | ✅ Yes |
| Exchange maintenance | `ExchangeNotAvailable` | "Binance is under maintenance" | ✅ Yes (retry later) |

### 7.2 Error Handling Middleware

```typescript
// backend/src/services/exchanges/errorHandler.ts
import { AuthenticationError, RateLimitExceeded, NetworkError } from 'ccxt';

export async function handleExchangeError<T>(
  operation: () => Promise<T>,
  exchangeName: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (error instanceof AuthenticationError) {
        throw new Error(`Invalid API credentials for ${exchangeName}`);
      }

      if (error instanceof RateLimitExceeded) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Rate limit exceeded for ${exchangeName}. Try again later.`);
      }

      if (error instanceof NetworkError) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(`Network error connecting to ${exchangeName}`);
      }

      // Unknown error, rethrow
      throw error;
    }
  }

  throw lastError!;
}

// Usage
const balance = await handleExchangeError(
  () => exchange.fetchBalance(),
  'binance'
);
```

### 7.3 Logging Errors

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/exchanges.log' }),
    new winston.transports.Console(),
  ],
});

// Log exchange errors
logger.error('Exchange sync failed', {
  exchange: 'binance',
  userId: 'user123',
  error: error.message,
  stack: error.stack,
});
```

---

## 8. Testing Exchange Integrations

### 8.1 Unit Tests

```typescript
// backend/tests/exchanges/binance.test.ts
import { BinanceAdapter } from '../../src/services/exchanges/BinanceAdapter';

describe('BinanceAdapter', () => {
  let adapter: BinanceAdapter;

  beforeEach(() => {
    adapter = new BinanceAdapter({
      apiKey: process.env.BINANCE_TEST_API_KEY!,
      apiSecret: process.env.BINANCE_TEST_API_SECRET!,
    });
  });

  it('should fetch balances successfully', async () => {
    const balances = await adapter.fetchBalances();

    expect(balances).toBeInstanceOf(Array);
    expect(balances[0]).toHaveProperty('symbol');
    expect(balances[0]).toHaveProperty('quantity');
    expect(balances[0].quantity).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid API key', async () => {
    const badAdapter = new BinanceAdapter({
      apiKey: 'invalid',
      apiSecret: 'invalid',
    });

    await expect(badAdapter.fetchBalances()).rejects.toThrow('Invalid API credentials');
  });

  it('should normalize balance format', () => {
    const ccxtBalance = {
      BTC: { free: 1.5, used: 0.0, total: 1.5 },
      ETH: { free: 10.0, used: 5.0, total: 15.0 },
      info: {}, // metadata
    };

    const normalized = adapter['normalizeBalance'](ccxtBalance);

    expect(normalized).toEqual([
      { symbol: 'BTC', quantity: 1.5, free: 1.5, locked: 0.0, accountType: 'spot' },
      { symbol: 'ETH', quantity: 15.0, free: 10.0, locked: 5.0, accountType: 'spot' },
    ]);
  });
});
```

### 8.2 Integration Tests

```typescript
// backend/tests/integration/exchange-sync.test.ts
import { app } from '../../src/app';
import request from 'supertest';

describe('POST /api/exchanges/connect', () => {
  it('should connect Binance exchange', async () => {
    const response = await request(app)
      .post('/api/exchanges/connect')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        exchangeName: 'binance',
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('connectionId');
    expect(response.body.status).toBe('connected');
  });

  it('should sync balances after connection', async () => {
    // Connect exchange first
    const connectRes = await request(app)
      .post('/api/exchanges/connect')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({
        exchangeName: 'binance',
        apiKey: process.env.BINANCE_TEST_API_KEY,
        apiSecret: process.env.BINANCE_TEST_API_SECRET,
      });

    const connectionId = connectRes.body.connectionId;

    // Trigger sync
    const syncRes = await request(app)
      .post(`/api/exchanges/${connectionId}/sync`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.holdings).toBeInstanceOf(Array);
  });
});
```

### 8.3 Manual Testing Checklist

**For each new exchange integration**:
- [ ] Create test account on exchange
- [ ] Generate read-only API key
- [ ] Test connection via Postman/Insomnia
- [ ] Verify balances fetch correctly
- [ ] Test with empty portfolio (0 holdings)
- [ ] Test with multiple assets (BTC, ETH, altcoins)
- [ ] Test rate limiting (make 100+ requests)
- [ ] Test error scenarios (invalid key, expired key)
- [ ] Test in staging environment
- [ ] Get QA approval

---

## 9. Security Considerations

### 9.1 API Key Storage

**Encryption**:
```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key from AWS Secrets Manager

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted, authTagHex] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Usage**:
```typescript
// Save API key (encrypted)
const encryptedKey = encrypt(apiKey);
await db.exchange_connections.create({
  user_id: userId,
  exchange_name: 'binance',
  api_key_encrypted: encryptedKey,
  api_secret_encrypted: encrypt(apiSecret),
  api_key_last_four: apiKey.slice(-4), // For display only
});

// Retrieve API key (decrypted)
const connection = await db.exchange_connections.findOne({ id: connectionId });
const apiKey = decrypt(connection.api_key_encrypted);
```

### 9.2 IP Whitelisting

**Some exchanges allow IP whitelisting**. Inform users:

```typescript
// GET /api/exchanges/:exchangeName/ip-info
export async function getExchangeIpInfo(req, res) {
  const { exchangeName } = req.params;

  const ipInfo = {
    binance: {
      supportsIpWhitelist: true,
      instructions: 'Add these IPs to your Binance API whitelist: 54.123.45.67, 52.98.76.54',
      productionIps: ['54.123.45.67', '52.98.76.54'],
    },
    coinbase: {
      supportsIpWhitelist: false,
      instructions: 'Coinbase does not support IP whitelisting',
    },
  };

  res.json(ipInfo[exchangeName] || { supportsIpWhitelist: false });
}
```

### 9.3 Access Control

**Ensure users can only access their own exchange connections**:
```typescript
// Middleware: Check ownership
export async function checkExchangeOwnership(req, res, next) {
  const { connectionId } = req.params;
  const userId = req.user.id;

  const connection = await db.exchange_connections.findOne({
    id: connectionId,
    user_id: userId,
  });

  if (!connection) {
    return res.status(404).json({ error: 'Exchange connection not found' });
  }

  req.exchangeConnection = connection;
  next();
}

// Usage
router.post('/api/exchanges/:connectionId/sync', authenticateUser, checkExchangeOwnership, syncExchange);
```

---

## Appendix A: Exchange API Documentation Links

| Exchange | API Docs | Auth Type | Notes |
|----------|----------|-----------|-------|
| Binance | https://binance-docs.github.io/apidocs/ | API Key + Secret | Supports IP whitelist |
| Coinbase | https://docs.cloud.coinbase.com/ | API Key + Secret | OAuth also supported |
| Kraken | https://docs.kraken.com/rest/ | API Key + Secret | Tiered rate limits |
| Bybit | https://bybit-exchange.github.io/docs/ | API Key + Secret | V5 API (latest) |
| OKX | https://www.okx.com/docs-v5/en/ | API Key + Secret + Passphrase | 3-part auth |
| KuCoin | https://docs.kucoin.com/ | API Key + Secret + Passphrase | 3-part auth |

---

**Document Maintained By:** Backend Team
**Last Updated:** October 7, 2025
**Next Review:** Monthly (or when adding new exchange)

---

**END OF DOCUMENT**
