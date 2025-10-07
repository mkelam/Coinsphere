# Environment Configuration Guide - CryptoSense Analytics Platform

**Document Version**: 1.0
**Date**: October 7, 2025
**Status**: Production Ready
**Security Level**: CONFIDENTIAL

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Types](#environment-types)
3. [Environment Variables](#environment-variables)
4. [Service-Specific Configuration](#service-specific-configuration)
5. [Third-Party API Keys](#third-party-api-keys)
6. [Secrets Management](#secrets-management)
7. [Deployment Configuration](#deployment-configuration)
8. [Security Best Practices](#security-best-practices)

---

## 1. Overview

### 1.1 Purpose

This document provides comprehensive configuration for all environments (local, staging, production) across all services.

**⚠️ CRITICAL SECURITY RULES**:
1. **NEVER** commit `.env` files to Git
2. **ALWAYS** use `.env.example` as template (no real secrets)
3. **ALWAYS** use environment-specific secrets
4. **ALWAYS** rotate secrets every 90 days in production

### 1.2 Configuration Files

| File | Purpose | Git Tracked? |
|------|---------|--------------|
| `.env.example` | Template with dummy values | ✅ Yes |
| `.env` | Local development secrets | ❌ NO |
| `.env.local` | Local overrides | ❌ NO |
| `.env.production` | Production secrets (AWS Secrets Manager) | ❌ NO |

---

## 2. Environment Types

### 2.1 Local Development

**Purpose**: Developer workstations
**Infrastructure**: Docker Compose (PostgreSQL, Redis)
**Data**: Seed data, test users

**Characteristics**:
- Hot reload enabled
- Debug logging (verbose)
- Relaxed rate limits
- Test payment keys (Stripe)
- Mock external APIs (optional)

### 2.2 Staging

**Purpose**: QA testing, pre-production validation
**Infrastructure**: Railway/Render (MVP), AWS (later)
**Data**: Sanitized production copy (no real user data)

**Characteristics**:
- Production-like setup
- Real external APIs (test keys)
- Moderate rate limits
- Monitoring enabled

### 2.3 Production

**Purpose**: Live customer traffic
**Infrastructure**: AWS ECS + RDS + ElastiCache
**Data**: Real user data (encrypted)

**Characteristics**:
- High availability
- Strict rate limits
- Production API keys
- Full monitoring & alerting
- Auto-scaling enabled

---

## 3. Environment Variables

### 3.1 Backend (Node.js) `.env`

**File**: `backend/.env`

```bash
# ==================================
# ENVIRONMENT
# ==================================
NODE_ENV=development                    # development | staging | production
PORT=3001
API_VERSION=v1

# ==================================
# DATABASE (PostgreSQL + TimescaleDB)
# ==================================
DATABASE_URL=postgresql://cryptosense:password@localhost:5432/cryptosense_dev
DATABASE_SSL=false                      # true in production
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_TIMEOUT=30000                  # milliseconds

# ==================================
# REDIS (Cache & Job Queues)
# ==================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=                         # leave empty for local
REDIS_DB=0                              # database number (0-15)
REDIS_TTL=3600                          # default TTL in seconds

# ==================================
# AUTHENTICATION & SECURITY
# ==================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=3600                     # Access token expiration (1 hour)
JWT_REFRESH_EXPIRES_IN=604800           # Refresh token expiration (7 days)
BCRYPT_ROUNDS=12                        # Password hashing rounds

# Session cookies
SESSION_SECRET=your-session-secret-key-change-this
SESSION_COOKIE_NAME=cryptosense_session
SESSION_MAX_AGE=604800000               # 7 days in milliseconds

# CORS
CORS_ORIGIN=http://localhost:5173       # Frontend URL (comma-separated for multiple)
CORS_CREDENTIALS=true

# ==================================
# EXTERNAL APIs
# ==================================

# CoinGecko (Crypto price data)
COINGECKO_API_KEY=your-coingecko-pro-api-key
COINGECKO_BASE_URL=https://pro-api.coingecko.com/api/v3
COINGECKO_RATE_LIMIT=500                # requests per minute

# LunarCrush (Social sentiment)
LUNARCRUSH_API_KEY=your-lunarcrush-api-key
LUNARCRUSH_BASE_URL=https://api.lunarcrush.com/v2

# The Graph (On-chain data)
THE_GRAPH_API_KEY=your-the-graph-api-key
THE_GRAPH_ENDPOINT=https://gateway.thegraph.com/api

# Exchange APIs (for sync)
BINANCE_API_KEY=                        # Leave empty (users provide their own)
COINBASE_API_KEY=

# ==================================
# PAYMENTS (Stripe)
# ==================================
STRIPE_SECRET_KEY=sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PRICE_PLUS_MONTHLY=price_XXXXXXXXXXXX
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXXXXXXX
STRIPE_PRICE_POWER_TRADER_MONTHLY=price_XXXXXXXXXXXX

# ==================================
# EMAIL (SendGrid)
# ==================================
SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_FROM_EMAIL=noreply@cryptosense.com
SENDGRID_FROM_NAME=CryptoSense

# Email templates
SENDGRID_TEMPLATE_WELCOME=d-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_TEMPLATE_PASSWORD_RESET=d-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SENDGRID_TEMPLATE_ALERT=d-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ==================================
# AWS (Production)
# ==================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# S3 (for ML model storage)
AWS_S3_BUCKET=cryptosense-models
AWS_S3_REGION=us-east-1

# Secrets Manager (for production secrets)
AWS_SECRETS_MANAGER_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:cryptosense-prod

# ==================================
# MONITORING & LOGGING
# ==================================

# Sentry (Error tracking)
SENTRY_DSN=https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=development          # development | staging | production
SENTRY_TRACES_SAMPLE_RATE=0.1           # 10% of transactions

# Datadog (Metrics & APM)
DATADOG_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
DATADOG_APP_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Log level
LOG_LEVEL=debug                         # debug | info | warn | error
LOG_FORMAT=json                         # json | pretty

# ==================================
# RATE LIMITING
# ==================================
RATE_LIMIT_WINDOW_MS=3600000            # 1 hour in milliseconds
RATE_LIMIT_MAX_REQUESTS_FREE=100        # Free tier limit
RATE_LIMIT_MAX_REQUESTS_PLUS=1000       # Plus tier limit
RATE_LIMIT_MAX_REQUESTS_PRO=5000        # Pro tier limit
RATE_LIMIT_MAX_REQUESTS_POWER=10000     # Power Trader limit

# ==================================
# FEATURE FLAGS
# ==================================
FEATURE_ML_PREDICTIONS=true
FEATURE_RISK_SCORES=true
FEATURE_ALERTS=true
FEATURE_MOBILE_APP=false                # Not yet released
FEATURE_TAX_REPORTING=false             # Future feature

# ==================================
# ML SERVICE
# ==================================
ML_SERVICE_URL=http://localhost:8000    # Python FastAPI service
ML_SERVICE_TIMEOUT=30000                # milliseconds
ML_CACHE_TTL=300                        # 5 minutes
```

### 3.2 Frontend (React) `.env`

**File**: `frontend/.env`

```bash
# ==================================
# ENVIRONMENT
# ==================================
VITE_ENV=development                    # development | staging | production

# ==================================
# API ENDPOINTS
# ==================================
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001         # WebSocket for real-time updates

# ==================================
# AUTHENTICATION
# ==================================
VITE_JWT_STORAGE_KEY=cryptosense_token
VITE_REFRESH_TOKEN_KEY=cryptosense_refresh_token

# ==================================
# STRIPE (Public keys only)
# ==================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ==================================
# EXTERNAL SERVICES
# ==================================

# Google OAuth
VITE_GOOGLE_CLIENT_ID=XXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com

# Google Analytics (optional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# ==================================
# FEATURE FLAGS (Client-side)
# ==================================
VITE_FEATURE_DARK_MODE=true
VITE_FEATURE_MOBILE_VIEW=true
VITE_FEATURE_BETA_PREDICTIONS=false

# ==================================
# APP CONFIGURATION
# ==================================
VITE_APP_NAME=CryptoSense
VITE_APP_URL=http://localhost:5173
VITE_SUPPORT_EMAIL=support@cryptosense.com

# ==================================
# DEVELOPMENT TOOLS
# ==================================
VITE_DEBUG_MODE=true                    # Enable React DevTools
VITE_MOCK_API=false                     # Use mock API data
```

### 3.3 ML Service (Python) `.env`

**File**: `ml-service/.env`

```bash
# ==================================
# ENVIRONMENT
# ==================================
ENV=development                         # development | staging | production
PORT=8000

# ==================================
# DATABASE (Read-only for ML training)
# ==================================
DATABASE_URL=postgresql://cryptosense:password@localhost:5432/cryptosense_dev

# ==================================
# REDIS (Model cache)
# ==================================
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=1                              # Use different DB than backend

# ==================================
# ML MODEL CONFIGURATION
# ==================================
MODEL_VERSION=v1.0.0
MODEL_S3_BUCKET=cryptosense-models
MODEL_S3_PREFIX=lstm/                   # models/lstm/btc_v1.0.0.pth

# Model hyperparameters
MODEL_SEQUENCE_LENGTH=90                # 90 days lookback
MODEL_HIDDEN_SIZES=128,64,32
MODEL_DROPOUT=0.2
MODEL_LEARNING_RATE=0.001

# Training
TRAINING_BATCH_SIZE=32
TRAINING_EPOCHS=100
TRAINING_EARLY_STOPPING_PATIENCE=10

# ==================================
# DATA SOURCES
# ==================================

# CoinGecko (for historical data)
COINGECKO_API_KEY=your-coingecko-pro-api-key

# Binance (backup data source)
BINANCE_API_URL=https://api.binance.com/api/v3

# ==================================
# AWS (for model storage)
# ==================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ==================================
# MLFLOW (Experiment tracking)
# ==================================
MLFLOW_TRACKING_URI=http://localhost:5000  # Local MLflow server
# MLFLOW_TRACKING_URI=https://mlflow.cryptosense.com  # Production

# ==================================
# INFERENCE CONFIGURATION
# ==================================
INFERENCE_TIMEOUT=30                    # seconds
PREDICTION_CACHE_TTL=300                # 5 minutes
BATCH_PREDICTION_SIZE=50                # Max assets per batch

# ==================================
# MONITORING
# ==================================
SENTRY_DSN=https://XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX@o123456.ingest.sentry.io/1234567
LOG_LEVEL=DEBUG                         # DEBUG | INFO | WARNING | ERROR
```

---

## 4. Service-Specific Configuration

### 4.1 Docker Compose (Local Development)

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: cryptosense_db
    environment:
      POSTGRES_USER: cryptosense
      POSTGRES_PASSWORD: password
      POSTGRES_DB: cryptosense_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cryptosense"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cryptosense_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: MLflow (for experiment tracking)
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.8.0
    container_name: cryptosense_mlflow
    ports:
      - "5000:5000"
    command: mlflow server --host 0.0.0.0 --port 5000 --backend-store-uri sqlite:///mlflow.db --default-artifact-root ./mlruns
    volumes:
      - mlflow_data:/mlflow

volumes:
  postgres_data:
  redis_data:
  mlflow_data:
```

### 4.2 GitHub Actions (CI/CD)

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  NODE_VERSION: 20
  PYTHON_VERSION: 3.11

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: npm test

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          # Deploy script here
```

---

## 5. Third-Party API Keys

### 5.1 How to Obtain API Keys

**CoinGecko Pro**:
1. Visit https://www.coingecko.com/en/api/pricing
2. Subscribe to Pro plan ($129/month)
3. Copy API key from dashboard
4. Add to `.env`: `COINGECKO_API_KEY=CG-XXXXXXXXXXXXXXXXXXXXXXXX`

**LunarCrush**:
1. Visit https://lunarcrush.com/developers
2. Sign up for API access ($24/month)
3. Generate API key
4. Add to `.env`: `LUNARCRUSH_API_KEY=XXXXXXXXXXXXXXXXXXXXXXXX`

**Stripe**:
1. Visit https://stripe.com
2. Create account
3. Get test keys from dashboard
4. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**SendGrid**:
1. Visit https://sendgrid.com
2. Create account (free tier: 100 emails/day)
3. Create API key with "Mail Send" permissions
4. Add to `.env`: `SENDGRID_API_KEY=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**AWS**:
1. Create IAM user with programmatic access
2. Attach policies: `AmazonS3FullAccess`, `SecretsManagerReadWrite`
3. Download credentials CSV
4. Add to `.env`:
   ```
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### 5.2 API Key Rotation Schedule

| Service | Rotation Frequency | Owner | Next Rotation |
|---------|-------------------|-------|---------------|
| JWT Secret | Every 90 days | Backend Lead | Jan 15, 2026 |
| Database Password | Every 90 days | DevOps | Jan 20, 2026 |
| Stripe API Keys | Never (unless compromised) | Finance | N/A |
| CoinGecko | Every 180 days | Backend Lead | Apr 15, 2026 |
| AWS Keys | Every 90 days | DevOps | Jan 10, 2026 |
| SendGrid | Every 180 days | Backend Lead | Apr 10, 2026 |

---

## 6. Secrets Management

### 6.1 Local Development

**Use `.env` files** (never commit):
```bash
# Copy template
cp .env.example .env

# Edit with real keys (local/test keys only)
nano .env
```

### 6.2 Staging/Production (AWS Secrets Manager)

**Store secrets in AWS**:
```bash
# Create secret
aws secretsmanager create-secret \
  --name cryptosense-prod-secrets \
  --secret-string file://secrets.json

# Retrieve secret (in app startup)
aws secretsmanager get-secret-value \
  --secret-id cryptosense-prod-secrets \
  --query SecretString \
  --output text
```

**Node.js retrieval**:
```javascript
// config/secrets.js
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function loadSecrets() {
  const client = new SecretsManagerClient({ region: "us-east-1" });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: "cryptosense-prod-secrets",
    })
  );

  const secrets = JSON.parse(response.SecretString);

  // Inject into process.env
  process.env.DATABASE_URL = secrets.DATABASE_URL;
  process.env.JWT_SECRET = secrets.JWT_SECRET;
  // ... etc
}
```

### 6.3 1Password (Team Secrets)

**Shared secrets vault**:
- Vault name: `CryptoSense Engineering`
- Categories:
  - `Development` - Local test keys
  - `Staging` - Staging environment keys
  - `Production` - Production keys (restricted access)

**Access control**:
- All engineers: `Development` vault
- Senior engineers: `Staging` vault
- Tech lead + DevOps: `Production` vault

---

## 7. Deployment Configuration

### 7.1 Railway (MVP Deployment)

**File**: `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Environment variables** (set in Railway dashboard):
- Copy from `.env.example`
- Use production API keys
- Set `NODE_ENV=production`

### 7.2 AWS ECS (Production)

**Task Definition** (`ecs-task-def.json`):
```json
{
  "family": "cryptosense-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/cryptosense-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:cryptosense-prod:DATABASE_URL::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cryptosense-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 8. Security Best Practices

### 8.1 Secret Checklist

✅ **DO**:
- Use `.env.example` with dummy values (commit to Git)
- Store real secrets in `.env` (local) or AWS Secrets Manager (prod)
- Rotate secrets every 90 days
- Use different secrets per environment
- Restrict access to production secrets (only tech lead + DevOps)
- Enable 2FA on all third-party services

❌ **DON'T**:
- Commit `.env` files to Git
- Hardcode secrets in code
- Share secrets via Slack/email
- Use production secrets in development
- Reuse secrets across services

### 8.2 Emergency Secret Rotation

**If a secret is compromised**:

1. **Immediately rotate**:
   ```bash
   # Generate new secret
   NEW_SECRET=$(openssl rand -base64 32)

   # Update in AWS Secrets Manager
   aws secretsmanager update-secret \
     --secret-id cryptosense-prod-secrets \
     --secret-string "{\"JWT_SECRET\":\"$NEW_SECRET\"}"
   ```

2. **Deploy updated config**:
   ```bash
   # Trigger ECS task update (pulls new secrets)
   aws ecs update-service \
     --cluster cryptosense-prod \
     --service backend \
     --force-new-deployment
   ```

3. **Notify team**:
   - Post in #engineering Slack channel
   - Document in incident log
   - Update 1Password vault

### 8.3 Audit Log

**Secret access logging** (AWS CloudTrail):
```bash
# View who accessed secrets
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=cryptosense-prod-secrets \
  --max-items 50
```

---

## Appendix A: .env.example Files

### Backend `.env.example`

```bash
# Copy this file to .env and fill in your values
# NEVER commit .env to Git!

NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/cryptosense_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-to-a-random-32-char-string
COINGECKO_API_KEY=your-api-key-here
STRIPE_SECRET_KEY=sk_test_your-key-here
SENDGRID_API_KEY=SG.your-key-here
```

### Frontend `.env.example`

```bash
VITE_ENV=development
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
```

### ML Service `.env.example`

```bash
ENV=development
PORT=8000
DATABASE_URL=postgresql://user:password@localhost:5432/cryptosense_dev
REDIS_URL=redis://localhost:6379
MODEL_VERSION=v1.0.0
```

---

**Document Maintained By:** DevOps Team
**Last Updated:** October 7, 2025
**Next Review:** Monthly (or when secrets change)

---

**END OF DOCUMENT**
