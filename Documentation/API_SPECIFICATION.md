# API Specification Document
## Coinsphere - REST API & WebSocket

**Version:** 1.0
**Date:** October 6, 2025
**Base URL (Production):** `https://api.coinsphere.app/v1`
**Base URL (Staging):** `https://api-staging.coinsphere.app/v1`
**Documentation:** `https://api.coinsphere.app/docs` (Swagger/OpenAPI)

---

## TABLE OF CONTENTS

1. [Authentication](#1-authentication)
2. [Rate Limiting](#2-rate-limiting)
3. [Error Handling](#3-error-handling)
4. [Pagination](#4-pagination)
5. [API Endpoints](#5-api-endpoints)
6. [WebSocket API](#6-websocket-api)
7. [Webhooks](#7-webhooks)
8. [Data Models](#8-data-models)

---

## 1. AUTHENTICATION

### 1.1 JWT Token-Based Authentication

All API requests (except public endpoints) require a Bearer token in the Authorization header.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Token Endpoints

#### **POST /auth/register**

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tier": "free",
    "createdAt": "2025-10-06T12:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Errors:**
- `400` - Validation error (weak password, invalid email)
- `409` - Email already exists

---

#### **POST /auth/login**

Authenticate and receive access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "tier": "pro"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Errors:**
- `401` - Invalid credentials
- `429` - Rate limit exceeded (5 attempts per 15 minutes)

---

#### **POST /auth/refresh**

Refresh expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

---

#### **POST /auth/logout**

Invalidate refresh token.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

#### **POST /auth/forgot-password**

Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

#### **POST /auth/reset-password**

Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password successfully reset"
}
```

---

## 2. RATE LIMITING

### 2.1 Rate Limits by Tier

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| **Free** | 30 | 500 | 5,000 |
| **Plus** | 60 | 1,500 | 20,000 |
| **Pro** | 120 | 5,000 | 100,000 |
| **Power Trader** | Unlimited | Unlimited | Unlimited |

### 2.2 Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696608000
```

### 2.3 Rate Limit Exceeded Response

**Response (429 Too Many Requests):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Upgrade to Pro for higher limits.",
    "retryAfter": 60
  }
}
```

---

## 3. ERROR HANDLING

### 3.1 Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "Additional context"
    },
    "requestId": "req_xyz789",
    "timestamp": "2025-10-06T12:00:00Z"
  }
}
```

### 3.2 Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| **400** | `VALIDATION_ERROR` | Invalid request parameters |
| **400** | `INVALID_REQUEST` | Malformed request body |
| **401** | `UNAUTHORIZED` | Missing or invalid authentication token |
| **403** | `FORBIDDEN` | Insufficient permissions for this resource |
| **404** | `NOT_FOUND` | Resource does not exist |
| **409** | `CONFLICT` | Resource already exists (e.g., duplicate email) |
| **422** | `UNPROCESSABLE_ENTITY` | Valid syntax but semantically incorrect |
| **429** | `RATE_LIMIT_EXCEEDED` | Too many requests |
| **500** | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| **503** | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

### 3.3 Validation Error Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "Invalid email format"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters"
        }
      ]
    }
  }
}
```

---

## 4. PAGINATION

### 4.1 Pagination Parameters

All list endpoints support pagination:

**Query Parameters:**
- `page` (default: 1) - Page number (1-indexed)
- `limit` (default: 20, max: 100) - Items per page
- `sort` (default varies) - Sort field
- `order` (default: `desc`) - Sort order (`asc` or `desc`)

**Example:**
```http
GET /portfolios/transactions?page=2&limit=50&sort=timestamp&order=desc
```

### 4.2 Pagination Response

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1234,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## 5. API ENDPOINTS

### 5.1 User Management

#### **GET /users/me**

Get current user profile.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tier": "pro",
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "2025-11-06T12:00:00Z",
    "cancelAtPeriodEnd": false
  },
  "createdAt": "2025-01-15T12:00:00Z",
  "preferences": {
    "currency": "USD",
    "language": "en",
    "timezone": "America/New_York"
  }
}
```

---

#### **PATCH /users/me**

Update user profile.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "preferences": {
    "currency": "EUR",
    "timezone": "Europe/London"
  }
}
```

**Response (200 OK):**
```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "preferences": {
    "currency": "EUR",
    "timezone": "Europe/London"
  }
}
```

---

#### **DELETE /users/me**

Delete user account (irreversible).

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "password": "SecurePass123!",
  "confirmation": "DELETE"
}
```

**Response (204 No Content)**

---

### 5.2 Portfolio Management

#### **GET /portfolios**

List all portfolios for current user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "prt_xyz789",
      "name": "Main Portfolio",
      "totalValue": 125430.50,
      "totalValueChange24h": 3.2,
      "currency": "USD",
      "lastSyncedAt": "2025-10-06T11:55:00Z",
      "assetCount": 12,
      "sources": ["binance", "coinbase", "wallet:0x123..."]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

---

#### **POST /portfolios**

Create a new portfolio.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Trading Portfolio",
  "currency": "USD"
}
```

**Response (201 Created):**
```json
{
  "id": "prt_new123",
  "name": "Trading Portfolio",
  "totalValue": 0,
  "currency": "USD",
  "createdAt": "2025-10-06T12:00:00Z"
}
```

**Tier Limits:**
- Free: 5 portfolios
- Plus: 25 portfolios
- Pro+: Unlimited

---

#### **GET /portfolios/{portfolioId}**

Get detailed portfolio information.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**
- `portfolioId` - Portfolio ID

**Response (200 OK):**
```json
{
  "id": "prt_xyz789",
  "name": "Main Portfolio",
  "totalValue": 125430.50,
  "totalValueChange24h": 3.2,
  "totalValueChange7d": -2.1,
  "totalValueChange30d": 12.5,
  "currency": "USD",
  "lastSyncedAt": "2025-10-06T11:55:00Z",
  "holdings": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 2.5,
      "value": 87500.00,
      "price": 35000.00,
      "change24h": 2.3,
      "allocation": 69.7,
      "avgBuyPrice": 28000.00,
      "totalGainLoss": 17500.00,
      "totalGainLossPercent": 25.0
    }
  ],
  "allocation": {
    "BTC": 69.7,
    "ETH": 20.1,
    "SOL": 5.2,
    "Other": 5.0
  }
}
```

---

#### **PATCH /portfolios/{portfolioId}**

Update portfolio settings.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Updated Portfolio Name",
  "currency": "EUR"
}
```

**Response (200 OK):**
```json
{
  "id": "prt_xyz789",
  "name": "Updated Portfolio Name",
  "currency": "EUR"
}
```

---

#### **DELETE /portfolios/{portfolioId}**

Delete a portfolio.

**Headers:** `Authorization: Bearer {token}`

**Response (204 No Content)**

---

#### **POST /portfolios/{portfolioId}/sync**

Manually trigger portfolio sync.

**Headers:** `Authorization: Bearer {token}`

**Response (202 Accepted):**
```json
{
  "message": "Sync initiated",
  "jobId": "job_sync_123",
  "estimatedCompletionTime": 30
}
```

---

### 5.3 Exchange Connections

#### **GET /exchanges**

List supported exchanges.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "binance",
      "name": "Binance",
      "icon": "https://cdn.coinsphere.app/exchanges/binance.png",
      "supported": true,
      "features": ["spot", "futures", "margin"]
    }
  ]
}
```

---

#### **POST /portfolios/{portfolioId}/exchanges**

Connect an exchange to portfolio.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "exchange": "binance",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret"
}
```

**Response (201 Created):**
```json
{
  "id": "exc_conn_123",
  "exchange": "binance",
  "status": "connected",
  "lastSyncedAt": null,
  "createdAt": "2025-10-06T12:00:00Z"
}
```

**Security Note:** API keys are encrypted at rest. Only read-only keys accepted.

---

#### **GET /portfolios/{portfolioId}/exchanges**

List connected exchanges for portfolio.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "exc_conn_123",
      "exchange": "binance",
      "status": "connected",
      "lastSyncedAt": "2025-10-06T11:55:00Z",
      "accountBalance": 45230.50
    }
  ]
}
```

---

#### **DELETE /portfolios/{portfolioId}/exchanges/{connectionId}**

Disconnect exchange from portfolio.

**Headers:** `Authorization: Bearer {token}`

**Response (204 No Content)**

---

### 5.4 Wallet Connections

#### **POST /portfolios/{portfolioId}/wallets**

Add wallet to portfolio (read-only via public address).

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "blockchain": "ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "label": "MetaMask Wallet"
}
```

**Response (201 Created):**
```json
{
  "id": "wlt_conn_456",
  "blockchain": "ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "label": "MetaMask Wallet",
  "balance": 12.5,
  "balanceUSD": 23450.00,
  "createdAt": "2025-10-06T12:00:00Z"
}
```

---

#### **GET /portfolios/{portfolioId}/wallets**

List connected wallets.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "wlt_conn_456",
      "blockchain": "ethereum",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "label": "MetaMask Wallet",
      "balance": 12.5,
      "balanceUSD": 23450.00,
      "lastSyncedAt": "2025-10-06T11:55:00Z"
    }
  ]
}
```

---

### 5.5 Transactions

#### **GET /portfolios/{portfolioId}/transactions**

List transactions for portfolio.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`, `limit` - Pagination
- `startDate` - Filter by date (ISO 8601)
- `endDate` - Filter by date
- `type` - Filter by type (`buy`, `sell`, `transfer`, `deposit`, `withdrawal`)
- `symbol` - Filter by asset symbol

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "txn_abc123",
      "type": "buy",
      "symbol": "BTC",
      "amount": 0.5,
      "price": 35000.00,
      "total": 17500.00,
      "fee": 17.50,
      "currency": "USD",
      "timestamp": "2025-10-05T14:30:00Z",
      "source": "binance",
      "notes": null,
      "confidence": 0.98
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234
  }
}
```

---

#### **POST /portfolios/{portfolioId}/transactions**

Manually add a transaction.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "type": "buy",
  "symbol": "ETH",
  "amount": 10,
  "price": 1850.00,
  "fee": 5.00,
  "currency": "USD",
  "timestamp": "2025-10-04T10:00:00Z",
  "notes": "Bought the dip"
}
```

**Response (201 Created):**
```json
{
  "id": "txn_new789",
  "type": "buy",
  "symbol": "ETH",
  "amount": 10,
  "price": 1850.00,
  "total": 18500.00,
  "fee": 5.00,
  "timestamp": "2025-10-04T10:00:00Z"
}
```

---

#### **PATCH /portfolios/{portfolioId}/transactions/{transactionId}**

Edit a transaction.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "price": 1855.00,
  "notes": "Corrected price"
}
```

**Response (200 OK):**
```json
{
  "id": "txn_new789",
  "price": 1855.00,
  "notes": "Corrected price"
}
```

---

#### **DELETE /portfolios/{portfolioId}/transactions/{transactionId}**

Delete a transaction.

**Headers:** `Authorization: Bearer {token}`

**Response (204 No Content)**

---

### 5.6 Market Data

#### **GET /market/search**

Search for cryptocurrencies.

**Query Parameters:**
- `q` - Search query (symbol or name)
- `limit` (default: 10, max: 50)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin",
      "image": "https://cdn.coinsphere.app/coins/btc.png",
      "currentPrice": 35000.00,
      "marketCap": 685000000000,
      "rank": 1
    }
  ]
}
```

---

#### **GET /market/tokens/{symbol}**

Get detailed token information.

**Path Parameters:**
- `symbol` - Token symbol (e.g., `BTC`, `ETH`)

**Response (200 OK):**
```json
{
  "id": "bitcoin",
  "symbol": "BTC",
  "name": "Bitcoin",
  "currentPrice": 35000.00,
  "marketCap": 685000000000,
  "volume24h": 28500000000,
  "change24h": 2.3,
  "change7d": -1.2,
  "change30d": 8.5,
  "high24h": 35500.00,
  "low24h": 34200.00,
  "circulatingSupply": 19500000,
  "totalSupply": 21000000,
  "rank": 1,
  "updatedAt": "2025-10-06T11:59:00Z"
}
```

---

#### **GET /market/prices**

Get current prices for multiple tokens.

**Query Parameters:**
- `symbols` - Comma-separated list (e.g., `BTC,ETH,SOL`)
- `currency` (default: `USD`)

**Response (200 OK):**
```json
{
  "data": {
    "BTC": {
      "price": 35000.00,
      "change24h": 2.3,
      "lastUpdated": "2025-10-06T11:59:00Z"
    },
    "ETH": {
      "price": 1850.00,
      "change24h": 3.1,
      "lastUpdated": "2025-10-06T11:59:00Z"
    }
  }
}
```

---

### 5.7 AI Predictions (Premium Feature)

#### **GET /predictions/{symbol}**

Get AI market prediction for a token.

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**
- `symbol` - Token symbol (e.g., `BTC`)

**Query Parameters:**
- `timeframe` (default: `7d`) - Prediction timeframe (`7d`, `14d`, `30d`)

**Response (200 OK):**
```json
{
  "symbol": "BTC",
  "timeframe": "7d",
  "prediction": {
    "direction": "bullish",
    "confidence": "medium",
    "confidenceScore": 0.68,
    "targetPrice": 37500.00,
    "targetPriceRange": {
      "low": 36000.00,
      "high": 39000.00
    },
    "currentPrice": 35000.00,
    "potentialGain": 7.14
  },
  "indicators": {
    "rsi": 58.3,
    "macd": "bullish",
    "volumeTrend": "increasing",
    "socialSentiment": 0.72
  },
  "explanation": "Bitcoin shows bullish momentum with RSI at 58.3 (neutral to bullish). MACD indicates positive momentum. Social sentiment is strong at 0.72. Volume has increased 15% in the last 7 days.",
  "historicalAccuracy": {
    "last30Days": 0.73,
    "last90Days": 0.71
  },
  "generatedAt": "2025-10-06T12:00:00Z",
  "expiresAt": "2025-10-06T18:00:00Z"
}
```

**Tier Requirements:**
- Free: Not available
- Plus: BTC and ETH only
- Pro+: All 50+ supported tokens

---

#### **GET /predictions/history/{symbol}**

Get historical predictions for accuracy tracking.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limit` (default: 10, max: 100)

**Response (200 OK):**
```json
{
  "data": [
    {
      "predictedAt": "2025-09-29T12:00:00Z",
      "timeframe": "7d",
      "predictedPrice": 34000.00,
      "actualPrice": 35000.00,
      "accuracy": 0.97,
      "direction": "bullish",
      "directionCorrect": true
    }
  ]
}
```

---

### 5.8 Risk Scoring (Premium Feature)

#### **GET /risk/portfolio/{portfolioId}**

Get overall portfolio risk score.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "portfolioId": "prt_xyz789",
  "overallRiskScore": 42,
  "riskLevel": "medium",
  "breakdown": {
    "volatility": 38,
    "concentration": 55,
    "liquidityRisk": 28,
    "smartContractRisk": 45
  },
  "highRiskAssets": [
    {
      "symbol": "SHIB",
      "riskScore": 82,
      "allocation": 5.2,
      "riskFactors": ["high_volatility", "low_liquidity", "meme_coin"]
    }
  ],
  "recommendations": [
    "Consider reducing exposure to high-risk meme coins (SHIB: 82/100 risk)",
    "Portfolio concentration in BTC (69.7%) reduces diversification risk"
  ],
  "generatedAt": "2025-10-06T12:00:00Z"
}
```

---

#### **GET /risk/token/{blockchain}/{address}**

Get degen risk score for specific token (smart contract analysis).

**Headers:** `Authorization: Bearer {token}`

**Path Parameters:**
- `blockchain` - Blockchain network (`ethereum`, `bsc`, `polygon`, `solana`)
- `address` - Token contract address

**Response (200 OK):**
```json
{
  "blockchain": "ethereum",
  "address": "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  "symbol": "SHIB",
  "name": "Shiba Inu",
  "riskScore": 82,
  "riskLevel": "extreme",
  "riskFactors": {
    "marketCap": {
      "value": 5000000000,
      "risk": "low",
      "score": 15
    },
    "liquidity": {
      "totalLocked": 85000000,
      "risk": "medium",
      "score": 45
    },
    "volatility": {
      "volatility90d": 0.85,
      "risk": "high",
      "score": 78
    },
    "smartContract": {
      "audited": false,
      "risk": "high",
      "score": 75
    },
    "ownership": {
      "ownershipRenounced": false,
      "risk": "high",
      "score": 80
    },
    "holders": {
      "topHolderConcentration": 0.42,
      "risk": "high",
      "score": 72
    },
    "socialSentiment": {
      "score": 0.65,
      "risk": "medium",
      "score": 50
    }
  },
  "warnings": [
    "Smart contract not audited by major firms",
    "Ownership not renounced - owner can modify contract",
    "Top 10 holders control 42% of supply"
  ],
  "analyzedAt": "2025-10-06T12:00:00Z",
  "cacheExpiresAt": "2025-10-06T14:00:00Z"
}
```

**Tier Requirements:**
- Free: Top 10 holdings only
- Plus: Top 25 holdings
- Pro+: Full portfolio + on-demand analysis

---

### 5.9 Alerts

#### **POST /alerts**

Create a price or risk alert.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "type": "price",
  "symbol": "BTC",
  "condition": "above",
  "threshold": 40000.00,
  "notificationMethod": "email"
}
```

**Response (201 Created):**
```json
{
  "id": "alt_abc123",
  "type": "price",
  "symbol": "BTC",
  "condition": "above",
  "threshold": 40000.00,
  "status": "active",
  "notificationMethod": "email",
  "createdAt": "2025-10-06T12:00:00Z"
}
```

**Alert Types:**
- `price` - Price crosses threshold
- `change` - Price change % in timeframe
- `prediction` - AI prediction changes (bull → bear)
- `risk` - Portfolio risk score exceeds threshold

**Tier Limits:**
- Free: 3 alerts
- Plus: 10 alerts
- Pro: 50 alerts
- Power Trader: Unlimited

---

#### **GET /alerts**

List user's alerts.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "alt_abc123",
      "type": "price",
      "symbol": "BTC",
      "condition": "above",
      "threshold": 40000.00,
      "status": "active",
      "triggeredAt": null,
      "createdAt": "2025-10-06T12:00:00Z"
    }
  ]
}
```

---

#### **DELETE /alerts/{alertId}**

Delete an alert.

**Headers:** `Authorization: Bearer {token}`

**Response (204 No Content)**

---

### 5.10 Subscription & Billing

#### **GET /subscription**

Get current subscription details.

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "tier": "pro",
  "status": "active",
  "billingCycle": "monthly",
  "amount": 19.99,
  "currency": "USD",
  "currentPeriodStart": "2025-10-01T00:00:00Z",
  "currentPeriodEnd": "2025-11-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "paymentMethod": {
    "type": "card",
    "last4": "4242",
    "brand": "visa"
  }
}
```

---

#### **POST /subscription/upgrade**

Upgrade subscription tier.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "tier": "pro",
  "billingCycle": "annual"
}
```

**Response (200 OK):**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

#### **POST /subscription/cancel**

Cancel subscription (at end of billing period).

**Headers:** `Authorization: Bearer {token}`

**Response (200 OK):**
```json
{
  "message": "Subscription will be cancelled on 2025-11-01",
  "cancelAtPeriodEnd": true,
  "currentPeriodEnd": "2025-11-01T00:00:00Z"
}
```

---

## 6. WEBSOCKET API

### 6.1 Connection

**WebSocket URL:** `wss://api.coinsphere.app/v1/ws`

**Authentication:**
```javascript
const ws = new WebSocket('wss://api.coinsphere.app/v1/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
};
```

### 6.2 Subscribe to Price Updates

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "prices",
  "symbols": ["BTC", "ETH", "SOL"]
}
```

**Price Update Event:**
```json
{
  "type": "price",
  "symbol": "BTC",
  "price": 35123.45,
  "change24h": 2.34,
  "timestamp": "2025-10-06T12:00:00Z"
}
```

### 6.3 Subscribe to Portfolio Updates

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "portfolio",
  "portfolioId": "prt_xyz789"
}
```

**Portfolio Update Event:**
```json
{
  "type": "portfolio_update",
  "portfolioId": "prt_xyz789",
  "totalValue": 125550.00,
  "change": 120.00,
  "timestamp": "2025-10-06T12:00:15Z"
}
```

### 6.4 Subscribe to Alert Triggers

**Subscribe:**
```json
{
  "type": "subscribe",
  "channel": "alerts"
}
```

**Alert Triggered Event:**
```json
{
  "type": "alert_triggered",
  "alertId": "alt_abc123",
  "symbol": "BTC",
  "condition": "above",
  "threshold": 40000.00,
  "currentPrice": 40123.45,
  "timestamp": "2025-10-06T12:05:00Z"
}
```

### 6.5 Heartbeat

**Ping (every 30 seconds):**
```json
{
  "type": "ping"
}
```

**Pong Response:**
```json
{
  "type": "pong",
  "timestamp": "2025-10-06T12:00:00Z"
}
```

---

## 7. WEBHOOKS

### 7.1 Webhook Configuration

**POST /webhooks**

Create a webhook endpoint.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "url": "https://yourapp.com/webhooks/coinsphere",
  "events": ["alert.triggered", "portfolio.synced"],
  "secret": "your_webhook_secret"
}
```

**Response (201 Created):**
```json
{
  "id": "wh_xyz123",
  "url": "https://yourapp.com/webhooks/coinsphere",
  "events": ["alert.triggered", "portfolio.synced"],
  "status": "active",
  "createdAt": "2025-10-06T12:00:00Z"
}
```

### 7.2 Webhook Events

**Alert Triggered:**
```json
{
  "event": "alert.triggered",
  "data": {
    "alertId": "alt_abc123",
    "symbol": "BTC",
    "currentPrice": 40123.45
  },
  "timestamp": "2025-10-06T12:05:00Z"
}
```

**Portfolio Synced:**
```json
{
  "event": "portfolio.synced",
  "data": {
    "portfolioId": "prt_xyz789",
    "totalValue": 125550.00,
    "transactionsAdded": 5
  },
  "timestamp": "2025-10-06T12:00:00Z"
}
```

### 7.3 Webhook Signature

All webhooks include `X-Coinsphere-Signature` header for verification:

```
X-Coinsphere-Signature: sha256=abcdef123456...
```

**Verify:**
```javascript
const crypto = require('crypto');

const signature = request.headers['x-coinsphere-signature'];
const payload = JSON.stringify(request.body);
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature === expectedSignature) {
  // Valid webhook
}
```

---

## 8. DATA MODELS

### 8.1 User

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'free' | 'plus' | 'pro' | 'power_trader';
  subscription?: {
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  preferences: {
    currency: string;
    language: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 8.2 Portfolio

```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  totalValue: number;
  totalValueChange24h: number;
  currency: string;
  lastSyncedAt: string | null;
  assetCount: number;
  sources: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 8.3 Transaction

```typescript
interface Transaction {
  id: string;
  portfolioId: string;
  type: 'buy' | 'sell' | 'transfer' | 'deposit' | 'withdrawal';
  symbol: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  currency: string;
  timestamp: string;
  source: string;
  notes?: string;
  confidence: number; // 0-1 scale
  createdAt: string;
  updatedAt: string;
}
```

### 8.4 Prediction

```typescript
interface Prediction {
  symbol: string;
  timeframe: '7d' | '14d' | '30d';
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: 'low' | 'medium' | 'high';
    confidenceScore: number; // 0-1 scale
    targetPrice: number;
    targetPriceRange: {
      low: number;
      high: number;
    };
    currentPrice: number;
    potentialGain: number; // percentage
  };
  indicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    socialSentiment: number; // 0-1 scale
  };
  explanation: string;
  historicalAccuracy: {
    last30Days: number;
    last90Days: number;
  };
  generatedAt: string;
  expiresAt: string;
}
```

### 8.5 Risk Score

```typescript
interface RiskScore {
  blockchain: string;
  address: string;
  symbol: string;
  name: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: {
    marketCap: RiskFactor;
    liquidity: RiskFactor;
    volatility: RiskFactor;
    smartContract: RiskFactor;
    ownership: RiskFactor;
    holders: RiskFactor;
    socialSentiment: RiskFactor;
  };
  warnings: string[];
  analyzedAt: string;
  cacheExpiresAt: string;
}

interface RiskFactor {
  value: any;
  risk: 'low' | 'medium' | 'high';
  score: number; // 0-100
}
```

---

## APPENDIX A: HTTP Status Codes Summary

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH requests |
| 201 | Created | Successful POST requests |
| 202 | Accepted | Async operation initiated |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Valid syntax but semantically incorrect |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Service temporarily down |

---

## APPENDIX B: OpenAPI 3.0 Specification

Full OpenAPI/Swagger spec available at: `https://api.coinsphere.app/openapi.json`

Import into Postman: `https://api.coinsphere.app/postman-collection.json`

---

## APPENDIX C: API Client Libraries

**Official SDKs:**
- JavaScript/TypeScript: `npm install @coinsphere/sdk`
- Python: `pip install coinsphere-sdk`
- Go: `go get github.com/coinsphere/go-sdk`

**Example Usage (JavaScript):**
```javascript
import Coinsphere from '@coinsphere/sdk';

const client = new Coinsphere({ apiKey: 'your_api_key' });

// Get portfolio
const portfolio = await client.portfolios.get('prt_xyz789');

// Get prediction
const prediction = await client.predictions.get('BTC', { timeframe: '7d' });
```

---

**Document Prepared By:** Backend Development Team
**Last Updated:** October 6, 2025
**Next Review:** Post-MVP (Week 10)

---

**END OF API SPECIFICATION**
