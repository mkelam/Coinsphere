# Third-Party Services & API Integrations

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Backend Team
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Cryptocurrency Data APIs](#cryptocurrency-data-apis)
3. [Exchange Integrations](#exchange-integrations)
4. [Blockchain Data](#blockchain-data)
5. [Payment Processing](#payment-processing)
6. [Communications](#communications)
7. [Infrastructure & DevOps](#infrastructure--devops)
8. [Security & Compliance](#security--compliance)
9. [API Key Management](#api-key-management)
10. [Cost Analysis](#cost-analysis)

---

## 1. Overview

Coinsphere integrates with 15+ third-party services to provide real-time data, exchange connectivity, payments, and communications.

**Total Monthly Cost (Estimated):**
- **Development:** $150/month
- **Production (MVP):** $850/month
- **Production (Scale):** $2,500+/month (at 10,000 users)

**Key Principles:**
- **Free tiers first**: Use free plans during development
- **Graceful degradation**: App should work (with reduced features) if API is down
- **Rate limit handling**: Implement exponential backoff for all APIs
- **Cost monitoring**: Alert if API costs exceed budget by 20%

---

## 2. Cryptocurrency Data APIs

### 2.1 CoinGecko API

**Purpose:** Primary source for price data, market cap, trading volume

**Tier:** Pro Plan ($129/month)

**Endpoints Used:**
```
GET /api/v3/coins/markets
  - Get 250 top coins by market cap
  - Returns: price, 24h volume, market cap, price changes

GET /api/v3/coins/{id}
  - Detailed coin info (genesis date, all-time high, etc.)
  - Used for: Risk score factors (age, market cap)

GET /api/v3/simple/price
  - Real-time prices for up to 250 assets
  - Called every 30 seconds for user holdings
```

**Rate Limits:**
- Free: 10-50 calls/minute
- Pro: 500 calls/minute
- **Our usage:** ~200 calls/minute (need Pro tier)

**Authentication:**
```typescript
const response = await fetch(
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=250',
  {
    headers: {
      'x-cg-pro-api-key': process.env.COINGECKO_API_KEY,
    },
  }
);
```

**Alternatives:**
- **CoinMarketCap** ($99/month, similar features)
- **Messari** ($199/month, better on-chain data but pricier)

**Backup Strategy:**
- If CoinGecko is down → fallback to CoinMarketCap (secondary API)
- Cache last 5 minutes of price data in Redis
- Show stale data with warning: "⚠️ Prices delayed (last updated 3 min ago)"

---

### 2.2 LunarCrush API

**Purpose:** Social sentiment data (Twitter mentions, Reddit activity)

**Tier:** Pro Plan ($199/month)

**Endpoints Used:**
```
GET /v2/assets/{symbol}
  - Social metrics: tweet volume, sentiment score, influencer activity
  - Used for: ML prediction features, risk score (sentiment factor)

GET /v2/insights
  - Trending coins based on social activity
  - Used for: "Trending Now" section in UI
```

**Rate Limits:**
- Free: 50 calls/day (unusable)
- Pro: 3,000 calls/day = 125/hour
- **Our usage:** ~100 calls/hour (within limit)

**Data Freshness:** Updated every 15 minutes

**Authentication:**
```typescript
const response = await fetch(
  'https://api.lunarcrush.com/v2/assets/BTC?data=social',
  {
    headers: {
      Authorization: `Bearer ${process.env.LUNARCRUSH_API_KEY}`,
    },
  }
);
```

**MVP Consideration:**
- **Option 1:** Skip social sentiment in MVP (save $199/month)
- **Option 2:** Use free tier with daily batch job (fetch top 50 coins once/day)
- **Recommendation:** Start with Option 2, upgrade to Pro in Month 3

---

### 2.3 CryptoCompare API

**Purpose:** Historical OHLCV data for ML training

**Tier:** Free tier (sufficient for MVP)

**Endpoints Used:**
```
GET /data/v2/histoday
  - Daily OHLCV data for last 2000 days
  - Used for: ML model training (90-day sequences)

GET /data/v2/histohour
  - Hourly data for short-term predictions
  - Used for: 24-hour prediction feature
```

**Rate Limits:**
- Free: 100,000 calls/month
- **Our usage:** ~5,000 calls/month (training pipeline runs weekly)

**Authentication:**
```typescript
const response = await fetch(
  'https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=90',
  {
    headers: {
      authorization: `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`,
    },
  }
);
```

**Note:** Only needed for ML service, not critical for MVP if predictions are pre-generated.

---

## 3. Exchange Integrations

### 3.1 CCXT Library

**Purpose:** Unified interface to 100+ crypto exchanges

**Tier:** Open-source (free)

**Supported Exchanges (Priority):**
1. **Binance** (largest by volume)
2. **Coinbase Pro** (US users)
3. **Kraken** (European users)
4. **KuCoin** (altcoins)

**API Calls via CCXT:**
```typescript
import ccxt from 'ccxt';

const exchange = new ccxt.binance({
  apiKey: userEncryptedApiKey,
  secret: userEncryptedSecret,
  enableRateLimit: true,  // Auto rate limiting
});

const balance = await exchange.fetchBalance();
// Returns: { BTC: { free: 0.5, used: 0.1, total: 0.6 }, ... }

const trades = await exchange.fetchMyTrades('BTC/USDT', since, limit);
// Returns: [{ timestamp, price, amount, side, fee, ... }]
```

**Rate Limits (per exchange):**
- **Binance:** 1200 requests/minute
- **Coinbase:** 10 requests/second (public), 3/sec (private)
- **Kraken:** 15-20 requests/second (tier-based)

**CCXT handles:**
- Automatic rate limiting (if `enableRateLimit: true`)
- Request signing (HMAC-SHA256)
- Pagination for large responses
- Error normalization across exchanges

**User API Key Permissions:**
- **Required:** Read-only access (view balances, trades)
- **NOT required:** Trading, withdrawals (security risk)
- **UI Warning:** "We only need read-only API keys. Never grant trading permissions."

---

### 3.2 Exchange-Specific Notes

**Binance:**
- **Free tier:** Yes (no API key cost)
- **Weight system:** Each endpoint has a "weight" (1-40), limit is 1200 weight/minute
- **IP whitelist:** Users can restrict API key to our server IPs for security

**Coinbase Pro:**
- **Free tier:** Yes
- **Sandbox:** Provides test environment (use during development)
- **Pagination:** Uses cursor-based pagination (not offset)

**Kraken:**
- **Free tier:** Yes
- **Rate limit tiers:** Higher verification level = higher limits
- **2FA:** Some API keys require 2FA (handle gracefully)

**KuCoin:**
- **Free tier:** Yes
- **API v2:** Newer v2 API has better rate limits
- **Trading pairs:** More altcoins than Binance/Coinbase

---

## 4. Blockchain Data

### 4.1 The Graph

**Purpose:** On-chain data (token holders, smart contract events)

**Tier:** Free tier (sufficient for MVP)

**Subgraphs Used:**
```graphql
# Ethereum: Get top token holders
query TopHolders($token: String!) {
  token(id: $token) {
    holders(first: 10, orderBy: balance, orderDirection: desc) {
      address
      balance
    }
  }
}

# Used for: Centralization risk score (F6)
```

**Rate Limits:**
- Free: 1,000 queries/day
- **Our usage:** ~100 queries/day (only for risk score calculation)

**Endpoint:**
```typescript
const response = await fetch('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query {
        token(id: "0x...") {
          holders(first: 10) { address balance }
        }
      }
    `,
  }),
});
```

**Alternative:**
- **Etherscan API** ($99/month, more reliable but requires payment)
- **Alchemy** (free tier: 300M compute units/month)

---

### 4.2 Whale Alert API

**Purpose:** Large transaction monitoring (>$10M transfers)

**Tier:** Starter Plan ($50/month)

**Endpoints Used:**
```
GET /v1/transactions
  - Returns recent large transactions (whales moving funds)
  - Filters: blockchain, min_value, limit

GET /v1/status
  - Check if blockchain is operational
```

**Rate Limits:**
- Starter: 60 calls/hour
- **Our usage:** 1 call/5 minutes = 12/hour (well within limit)

**Authentication:**
```typescript
const response = await fetch(
  'https://api.whale-alert.io/v1/transactions?min_value=10000000&limit=100',
  {
    headers: {
      'X-WA-API-KEY': process.env.WHALE_ALERT_API_KEY,
    },
  }
);
```

**MVP Consideration:**
- **Only for PLUS tier users** (feature gating)
- **Start without it:** Save $50/month, add in Month 2

---

## 5. Payment Processing

### 5.1 PayFast

**Purpose:** Subscription billing (Plus/Pro/Power Trader tiers)

**Tier:** Pay-per-transaction (2.9% + $0.30 per charge)

**Products:**
- **PayFast Checkout:** Pre-built payment page
- **PayFast Billing:** Recurring subscriptions
- **PayFast Customer Portal:** Users manage their subscriptions

**Integration:**
```typescript
import PayFast from 'payfast';

const payfast = new PayFast(process.env.STRIPE_SECRET_KEY);

// Create subscription
const subscription = await payfast.subscriptions.create({
  customer: payfastCustomerId,
  items: [{ price: 'price_1NXYz...' }],  // Plus plan price ID
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});

// Webhook handling (important!)
app.post('/webhooks/payfast', async (req, res) => {
  const sig = req.headers['payfast-signature'];
  const event = payfast.webhooks.constructEvent(req.body, sig, webhookSecret);

  if (event.type === 'customer.subscription.updated') {
    // Update user's tier in database
    await db.updateUserTier(event.data.object.customer, event.data.object.plan.id);
  }

  res.json({ received: true });
});
```

**Pricing:**
- **Transaction fee:** 2.9% + $0.30 (US cards)
- **PayFast Billing:** Free (included)
- **Tax calculation:** $0.50 per transaction (optional, recommended)

**Example Cost:**
- $9 Plus subscription → $0.56 PayFast fee (6.2%)
- $99 Power Trader → $3.17 fee (3.2%)

**Alternatives:**
- **Paddle:** Handles EU VAT/taxes automatically (3.5% + $0.50)
- **LemonSqueezy:** Merchant of record (handles all taxes, 5% + $0.50)

**Recommendation:** Start with PayFast (lowest fees, most flexible).

---

## 6. Communications

### 6.1 SendGrid (Email)

**Purpose:** Transactional emails (alerts, password reset, receipts)

**Tier:** Free tier (100 emails/day) → Pro ($15/month, 40,000 emails/month)

**Email Types:**
1. **Transactional:** Password reset, email verification
2. **Alerts:** Price alerts, risk warnings
3. **Marketing:** Weekly portfolio summary (optional)

**Rate Limits:**
- Free: 100/day (3,000/month)
- Pro: 40,000/month
- **Our usage:** ~500/day at 500 users (need Pro tier)

**Integration:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: user.email,
  from: 'alerts@coinsphere.io',  // Must be verified domain
  subject: '🚀 BTC Price Alert',
  html: '<strong>Bitcoin crossed $50,000!</strong>',
};

await sgMail.send(msg);
```

**Domain Setup Required:**
1. Add DNS records (SPF, DKIM) to `coinsphere.io`
2. Verify domain in SendGrid dashboard
3. Enable link tracking (optional)

**MVP:** Use free tier (100/day), upgrade when needed.

---

### 6.2 Firebase Cloud Messaging (Push)

**Purpose:** Push notifications (mobile & web)

**Tier:** Free (unlimited notifications)

**Platforms:**
- iOS (via APNs)
- Android (native)
- Web (Chrome, Firefox, Safari)

**Integration:**
```typescript
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const message = {
  notification: {
    title: '🚀 BTC Price Alert',
    body: 'Bitcoin crossed $50,000!',
  },
  token: userDeviceToken,
};

const response = await admin.messaging().send(message);
```

**Device Token Registration:**
```typescript
// Frontend (React Native or Web)
import messaging from '@react-native-firebase/messaging';

const fcmToken = await messaging().getToken();
// Send token to backend, store in `user_devices` table
```

**Cost:** Free (Google subsidizes FCM)

---

### 6.3 Twilio (SMS)

**Purpose:** SMS alerts (Pro/Power Trader tiers only)

**Tier:** Pay-per-message ($0.0079 per SMS in US)

**Rate Limits:**
- Default: 1 message/second per phone number
- Higher limits available (contact Twilio)

**Integration:**
```typescript
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

const message = await client.messages.create({
  body: '🚀 BTC crossed $50,000! - Coinsphere',
  from: '+15558675309',  // Twilio number
  to: user.phoneNumber,
});
```

**Pricing:**
- **US/Canada:** $0.0079/SMS
- **UK/Europe:** $0.05-0.10/SMS
- **Phone number rental:** $1/month

**Example Cost:**
- Pro tier: 10 SMS/month = $0.08
- Power Trader: 100 SMS/month = $0.79

**MVP:** Skip SMS in MVP (save costs), add in Month 2.

---

## 7. Infrastructure & DevOps

### 7.1 AWS Services

**Purpose:** Production hosting (ECS, RDS, ElastiCache, S3)

**Estimated Costs (Production):**

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **ECS (Fargate)** | 3 tasks × 0.5 vCPU × 1GB RAM | $50 |
| **RDS (PostgreSQL)** | db.t3.small (2 vCPU, 2GB RAM) | $30 |
| **ElastiCache (Redis)** | cache.t3.micro | $15 |
| **S3** | 10GB storage, 100GB transfer | $5 |
| **CloudWatch Logs** | 10GB logs/month | $5 |
| **Data Transfer** | 500GB/month (API responses) | $45 |
| **Total** | | **$150/month** |

**Scaling (at 10,000 users):**
- ECS: 6 tasks → $100/month
- RDS: db.t3.medium → $60/month
- ElastiCache: cache.t3.small → $30/month
- **Total:** ~$300/month

**Free Tier (first 12 months):**
- 750 hours EC2/month (can run 1 t3.micro 24/7)
- 20GB RDS storage
- 5GB S3 storage

---

### 7.2 GitHub Actions (CI/CD)

**Purpose:** Automated testing, linting, deployments

**Tier:** Free for public repos, 2,000 minutes/month for private

**Usage:**
- 5 minute build × 20 pushes/day = 100 minutes/day
- **Our usage:** ~3,000 minutes/month (need paid tier)

**Pricing:**
- Free: 2,000 minutes/month
- Team: 3,000 minutes/month ($4/user/month)
- **Our cost:** $20/month (5-user team)

**Alternative:**
- **GitLab CI:** 400 minutes/month free (not enough)
- **CircleCI:** 6,000 minutes/month free (sufficient!)

**Recommendation:** Use CircleCI for free tier during MVP.

---

### 7.3 Sentry (Error Tracking)

**Purpose:** Real-time error monitoring and crash reporting

**Tier:** Developer Plan (free, 5K errors/month) → Team ($26/month, 50K errors/month)

**Integration:**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
});

// Errors are automatically captured
throw new Error('Something went wrong!');

// Manual capture
Sentry.captureException(error, {
  tags: { userId: user.id },
  level: 'error',
});
```

**Rate Limits:**
- Developer: 5,000 events/month
- Team: 50,000 events/month
- **Our usage:** ~2,000/month (within free tier initially)

---

### 7.4 Vercel (Frontend Hosting)

**Purpose:** Host React frontend (alternative to AWS S3 + CloudFront)

**Tier:** Hobby (free) → Pro ($20/month)

**Features:**
- Automatic deployments from Git
- Global CDN (Edge Network)
- Serverless functions (API routes)
- Preview deployments for PRs

**Limits:**
- Hobby: 100GB bandwidth/month, 100 deployments/day
- Pro: 1TB bandwidth/month, unlimited deployments

**Pricing:**
- Hobby (free): Sufficient for MVP (<1,000 users)
- Pro ($20/month): Upgrade at ~5,000 users

**Recommendation:** Use Vercel for frontend (free tier), AWS for backend.

---

## 8. Security & Compliance

### 8.1 AWS Secrets Manager

**Purpose:** Securely store API keys, database credentials

**Pricing:**
- $0.40 per secret per month
- $0.05 per 10,000 API calls

**Secrets Stored:**
1. Database URL (PostgreSQL connection string)
2. Redis URL
3. CoinGecko API key
4. PayFast API keys (test + live)
5. SendGrid API key
6. Firebase service account JSON
7. JWT signing key

**Total:** 7 secrets × $0.40 = $2.80/month

**Alternative:**
- **Environment variables** (free but less secure)
- **HashiCorp Vault** (self-hosted, free but complex)

---

### 8.2 Cloudflare

**Purpose:** DDoS protection, WAF (Web Application Firewall), CDN

**Tier:** Free tier → Pro ($20/month)

**Free Tier Includes:**
- Unlimited DDoS mitigation
- Global CDN (caching static assets)
- Free SSL certificate
- 100,000 Workers requests/day (serverless edge functions)

**Pro Tier Adds:**
- Advanced DDoS protection
- WAF rules (block malicious traffic)
- Image optimization
- 10 million Workers requests/month

**MVP:** Use free tier (sufficient for MVP).

---

## 9. API Key Management

### 9.1 Storage

**User Exchange API Keys (encrypted):**
```sql
-- Database table
CREATE TABLE user_exchange_keys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT NOT NULL,  -- AES-256 encrypted
    api_secret_encrypted TEXT NOT NULL,
    encryption_key_id VARCHAR(50) NOT NULL,  -- Reference to AWS KMS key
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);
```

**Encryption/Decryption:**
```typescript
import { KMS } from '@aws-sdk/client-kms';

const kms = new KMS({ region: 'us-east-1' });

// Encrypt
async function encryptApiKey(plaintext: string): Promise<string> {
  const result = await kms.encrypt({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(plaintext),
  });
  return result.CiphertextBlob.toString('base64');
}

// Decrypt
async function decryptApiKey(ciphertext: string): Promise<string> {
  const result = await kms.decrypt({
    CiphertextBlob: Buffer.from(ciphertext, 'base64'),
  });
  return result.Plaintext.toString('utf-8');
}
```

**AWS KMS Pricing:**
- $1/month per key
- $0.03 per 10,000 requests
- **Our cost:** ~$2/month

---

### 9.2 Rotation

**API Key Rotation Schedule:**

| Service | Rotation Frequency | Automated? |
|---------|-------------------|------------|
| Database password | 90 days | Yes (AWS Secrets Manager) |
| CoinGecko API key | Yearly | Manual |
| PayFast API keys | Never (unless compromised) | N/A |
| JWT signing key | 180 days | Manual |
| User exchange keys | User-initiated | N/A |

**Rotation Process:**
1. Generate new secret
2. Store in Secrets Manager with version tag
3. Update application to read new version
4. Deploy (zero downtime, app reads new secret)
5. Revoke old secret after 7 days

---

## 10. Cost Analysis

### 10.1 Development Environment

**Total: $0-50/month**

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| CoinGecko | Free tier | $0 |
| LunarCrush | Free tier | $0 |
| CCXT | Open-source | $0 |
| PayFast | Sandbox mode | $0 |
| SendGrid | Free (100/day) | $0 |
| Firebase | Free tier | $0 |
| AWS | Free tier (first year) | $0 |
| GitHub Actions | Free (public repo) | $0 |
| **Total** | | **$0** |

---

### 10.2 Production MVP (Month 1-3, ~500 users)

**Total: $400-500/month**

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| **Data APIs** | | |
| CoinGecko Pro | 500 calls/min | $129 |
| LunarCrush | Skip in MVP | $0 |
| CryptoCompare | Free tier | $0 |
| **Infrastructure** | | |
| AWS (ECS, RDS, Redis) | Production tier | $150 |
| Vercel | Hobby (free) | $0 |
| **Payments & Comms** | | |
| PayFast | 2.9% + $0.30 | ~$50 (on $2K revenue) |
| SendGrid | Pro (40K emails) | $15 |
| Firebase FCM | Free | $0 |
| Twilio SMS | Skip in MVP | $0 |
| **DevOps & Security** | | |
| GitHub Actions | Team plan | $20 |
| Sentry | Free tier | $0 |
| AWS Secrets Manager | 10 secrets | $5 |
| Cloudflare | Free tier | $0 |
| **Total** | | **~$369** |

---

### 10.3 Production Scale (10,000 users)

**Total: $2,000-3,000/month**

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| CoinGecko Pro | Same | $129 |
| LunarCrush Pro | Social sentiment | $199 |
| Whale Alert | Whale tracking | $50 |
| AWS (scaled) | 6 ECS tasks, larger RDS | $300 |
| Vercel Pro | 1TB bandwidth | $20 |
| PayFast fees | On $50K revenue | ~$1,500 |
| SendGrid | 100K emails | $30 |
| Twilio SMS | 5K messages | $40 |
| GitHub Actions | Same | $20 |
| Sentry | Team plan | $26 |
| AWS Secrets Manager | Same | $5 |
| Cloudflare Pro | WAF, advanced DDoS | $20 |
| **Total** | | **~$2,339** |

**Revenue at 10K users (assuming 10% conversion to paid):**
- 1,000 paid users × $20 avg = $20,000/month
- **Gross margin:** 88% ($20K - $2.3K = $17.7K profit)

---

### 10.4 Cost Optimization Tips

**1. Use Free Tiers Aggressively:**
- Firebase FCM (push) = free forever
- Cloudflare = free tier covers 99% of needs
- GitHub Actions → switch to CircleCI (free tier better)

**2. Cache Aggressively:**
- Cache CoinGecko responses for 30 seconds (reduce API calls 50%)
- Cache user portfolios in Redis (reduce database load)

**3. Batch Operations:**
- Fetch 250 prices in 1 CoinGecko call (not 250 individual calls)
- Batch email sending (SendGrid supports up to 1,000 recipients per API call)

**4. Feature Gating:**
- Whale alerts → PLUS tier only (defer Whale Alert API cost)
- Social sentiment → PRO tier only (defer LunarCrush cost)

**5. Monitor & Alert:**
```typescript
// Alert if daily API costs exceed budget
if (dailyCost > DAILY_BUDGET * 1.2) {
  await alertOpsTeam(`API costs exceeded budget: $${dailyCost} vs $${DAILY_BUDGET}`);
}
```

---

## Appendix A: API Key Inventory

**Production API Keys Required (Total: 12)**

| # | Service | Key Type | Stored In | Rotation |
|---|---------|----------|-----------|----------|
| 1 | CoinGecko | API Key | Secrets Manager | Yearly |
| 2 | LunarCrush | Bearer Token | Secrets Manager | Yearly |
| 3 | CryptoCompare | API Key | Secrets Manager | Yearly |
| 4 | PayFast (Live) | Secret Key | Secrets Manager | Never |
| 5 | PayFast (Live) | Publishable Key | Frontend env | Never |
| 6 | PayFast Webhook | Secret | Secrets Manager | Manual |
| 7 | SendGrid | API Key | Secrets Manager | Yearly |
| 8 | Firebase | Service Account JSON | Secrets Manager | Never |
| 9 | Twilio | Account SID + Auth Token | Secrets Manager | Yearly |
| 10 | Sentry | DSN | Frontend env | Never |
| 11 | AWS | IAM User (CI/CD) | GitHub Secrets | 90 days |
| 12 | Database | PostgreSQL URL | Secrets Manager | 90 days |

---

## Appendix B: Service Health Monitoring

**Uptime Monitoring:**
```typescript
// Ping third-party APIs every 5 minutes
const healthChecks = [
  { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/ping' },
  { name: 'PayFast', url: 'https://api.payfast.com/healthcheck' },
  { name: 'SendGrid', url: 'https://status.sendgrid.com/api/v2/status.json' },
];

for (const check of healthChecks) {
  const response = await fetch(check.url);
  if (!response.ok) {
    logger.error(`${check.name} health check failed`, { status: response.status });
    await alertOpsTeam(`${check.name} may be down`);
  }
}
```

**Fallback Strategy:**
- CoinGecko down → use CoinMarketCap
- PayFast down → show maintenance message ("Payments temporarily unavailable")
- SendGrid down → queue emails in database, retry later

---

**Document End**

*API integrations will be tested and refined during Sprint 1-2. Cost estimates will be updated monthly based on actual usage.*
