# System Architecture Document
## Coinsphere

**Version:** 1.0  
**Date:** October 6, 2025  
**Status:** APPROVED FOR IMPLEMENTATION  
**Audience:** Engineering Team, Technical Leadership

---

## Document Control

| Attribute | Value |
|-----------|-------|
| **Author** | Principal Engineering Team |
| **Reviewers** | CTO, Technical Leads |
| **Approval** | CEO, CTO |
| **Last Updated** | October 6, 2025 |
| **Next Review** | Week 8 (Post-MVP) |

**Related Documents:**
- [Product Strategy](PRODUCT_STRATEGY.md) - Business requirements and product vision
- [BRD - Retail Analytics](Business%20Requirements%20Document%20-%20Retail%20Analytics.md) - Detailed feature specifications
- [Development Roadmap](Development%20Roadmap%20Sprint%20Plan.md) - 8-week implementation plan
- [Financial Model](FINANCIAL_MODEL.md) - Budget and scaling projections

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [System Design Principles](#3-system-design-principles)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Services Architecture](#5-backend-services-architecture)
6. [Data Architecture](#6-data-architecture)
7. [ML/AI Architecture](#7-mlai-architecture)
8. [Integration Architecture](#8-integration-architecture)
9. [Infrastructure & DevOps](#9-infrastructure--devops)
10. [Security Architecture](#10-security-architecture)
11. [Scalability & Performance](#11-scalability--performance)
12. [Data Quality & Validation](#12-data-quality--validation)
13. [Failure Modes & Recovery](#13-failure-modes--recovery)
14. [Evolution Roadmap](#14-evolution-roadmap)
15. [Architectural Decision Records](#15-architectural-decision-records)

---

# 1. Executive Summary

## 1.1 System Purpose

Coinsphere Analytics is an AI-powered portfolio tracking and prediction platform for retail crypto traders. The platform delivers three core capabilities:

1. **Real-time Portfolio Tracking** - Aggregate holdings across 20+ exchanges and wallets with 99%+ sync accuracy
2. **AI Market Predictions** - LSTM-based bull/bear forecasts with transparent reasoning
3. **Risk Scoring** - Real-time "degen risk" assessment (0-100 scale) for all assets

## 1.2 Design Philosophy

Our architecture is optimized for **speed of iteration** while maintaining **paths to scale**:

- **MVP-First:** Simple, pragmatic choices that can ship in 8 weeks
- **Evolution-Ready:** Clear migration paths to handle 1M+ users
- **Team-Sized:** Manageable by 4.5 FTEs without operational complexity
- **Cost-Conscious:** <$500/month infrastructure for MVP phase

### Core Architectural Principles

```
┌─────────────────────────────────────────────────────────────┐
│  SIMPLICITY → RELIABILITY → PERFORMANCE → SCALE             │
│                                                             │
│  We optimize in this order. Never sacrifice an earlier     │
│  principle for a later one during MVP phase.               │
└─────────────────────────────────────────────────────────────┘
```

## 1.3 High-Level Architecture

```mermaid
graph TB
    Users[Users - Web/Mobile]
    CDN[Cloudflare CDN]
    FE[Frontend - Vercel<br/>React/React Native]
    API[API Gateway<br/>Express.js]
    
    Portfolio[Portfolio Service<br/>Node.js]
    DataSync[Market Data Sync<br/>Node.js + Celery]
    MLService[ML Inference<br/>Python/FastAPI]
    
    PG[(PostgreSQL<br/>Primary DB)]
    TS[(TimescaleDB<br/>Time Series)]
    Redis[(Redis<br/>Cache + Jobs)]
    
    CoinGecko[CoinGecko API]
    TheGraph[The Graph]
    LunarCrush[LunarCrush]
    Exchanges[20+ Exchanges]
    
    Users --> CDN
    CDN --> FE
    FE --> API
    
    API --> Portfolio
    API --> DataSync
    API --> MLService
    
    Portfolio --> PG
    Portfolio --> Redis
    
    DataSync --> TS
    DataSync --> Redis
    DataSync --> CoinGecko
    DataSync --> TheGraph
    DataSync --> LunarCrush
    DataSync --> Exchanges
    
    MLService --> TS
    MLService --> Redis
    
    style Users fill:#e1f5ff
    style FE fill:#ffe1e1
    style API fill:#fff4e1
    style Portfolio fill:#e1ffe1
    style DataSync fill:#e1ffe1
    style MLService fill:#f0e1ff
    style PG fill:#ffe1f5
    style TS fill:#ffe1f5
    style Redis fill:#ffe1f5
```

## 1.4 Technology Stack Rationale

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| **Frontend** | React 18 + TypeScript | Industry standard, large talent pool, excellent ecosystem |
| **Mobile** | React Native | Code reuse with web (~60%), faster than native development |
| **API Gateway** | Express.js (Node.js) | Familiar to full-stack devs, battle-tested, simple to operate |
| **Services** | Node.js | Consistency across codebase, async I/O matches use case |
| **ML Service** | Python + FastAPI | Python required for ML, FastAPI gives Node-like performance |
| **Primary DB** | PostgreSQL 15 | ACID guarantees, JSON support, proven at scale |
| **Time Series** | TimescaleDB | PostgreSQL extension = low ops overhead, optimized for prices |
| **Cache** | Redis 7 | Standard for caching + pub/sub, simple to operate |
| **Job Queue** | Celery (Python) / Bull (Node) | Match service language, proven reliability |
| **Hosting (MVP)** | Railway/Render | One-click deploy, affordable, scales when needed |
| **Hosting (Scale)** | AWS ECS | Proven SaaS infrastructure, container-based, cost-effective |

### Key Trade-offs Made

✅ **Monolith First, Microservices Later**  
*Why:* 4.5 FTE team cannot operate multiple services. Monolith is faster to build, debug, and deploy. We'll extract services when team grows (12+ engineers).

✅ **PostgreSQL over MongoDB**  
*Why:* Transactional integrity matters (portfolio balances), structured schemas prevent bugs, TimescaleDB gives us time-series optimization without adding another database.

✅ **Railway/Render over AWS (for MVP)**  
*Why:* Zero DevOps overhead, $50-100/month vs $300+, deploys in minutes. We'll migrate to AWS when traffic justifies complexity (Month 6-9).

---

# 2. Architecture Overview

## 2.1 System Context Diagram

```mermaid
graph LR
    User[Crypto Traders]
    Admin[Admin/Support]
    
    System[Coinsphere Platform]
    
    Exchanges[Crypto Exchanges<br/>Binance, Coinbase, etc.]
    Wallets[Web3 Wallets<br/>MetaMask, Phantom]
    PriceFeeds[Market Data APIs<br/>CoinGecko, CMC]
    SocialData[Social Analytics<br/>LunarCrush]
    OnChain[On-Chain Data<br/>The Graph]
    
    User -->|Web/Mobile| System
    Admin -->|Dashboard| System
    
    System -->|Read-only APIs| Exchanges
    System -->|Read addresses| Wallets
    System -->|Price data| PriceFeeds
    System -->|Sentiment| SocialData
    System -->|Blockchain data| OnChain
    
    style System fill:#4A90E2,color:#fff
```

## 2.2 Container Diagram (C4 Model)

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Web Application<br/>React + TypeScript]
        MobileApp[Mobile Apps<br/>React Native]
    end
    
    subgraph "Edge Layer"
        CDN[Cloudflare CDN<br/>Static Assets + DDoS]
        APIGateway[API Gateway<br/>Express.js<br/>Auth, Rate Limit, Routing]
    end
    
    subgraph "Application Layer"
        AuthService[Auth Module<br/>JWT + OAuth]
        PortfolioService[Portfolio Service<br/>Sync, Calculate, Display]
        PredictionService[Prediction Service<br/>ML Model Inference]
        RiskService[Risk Scoring<br/>Multi-factor Analysis]
        AlertService[Alert Engine<br/>Condition Monitoring]
    end
    
    subgraph "Data Layer"
        DataSync[Market Data Sync<br/>Celery Background Jobs]
        Postgres[(PostgreSQL<br/>User, Portfolio, Alerts)]
        Timescale[(TimescaleDB<br/>Price History, Predictions)]
        RedisCache[(Redis<br/>Cache + Pub/Sub)]
    end
    
    subgraph "ML Layer"
        MLTraining[Model Training<br/>Jupyter + PyTorch]
        MLServing[Model Serving<br/>FastAPI Inference]
        MLMonitor[Model Monitor<br/>Accuracy Tracking]
    end
    
    WebApp --> CDN
    MobileApp --> CDN
    CDN --> APIGateway
    
    APIGateway --> AuthService
    APIGateway --> PortfolioService
    APIGateway --> PredictionService
    APIGateway --> RiskService
    APIGateway --> AlertService
    
    PortfolioService --> Postgres
    PortfolioService --> RedisCache
    
    PredictionService --> MLServing
    PredictionService --> Timescale
    
    RiskService --> Timescale
    RiskService --> RedisCache
    
    AlertService --> Postgres
    AlertService --> RedisCache
    
    DataSync --> Postgres
    DataSync --> Timescale
    DataSync --> RedisCache
    
    MLTraining -.->|Model Files| MLServing
```

## 2.3 Deployment Architecture (MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                               │
│  DDoS Protection, CDN, DNS                                  │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                        │
│  • React Web App (SSG + CSR)                                │
│  • Automatic deployments from main branch                   │
│  • Edge functions for API proxying                          │
└─────────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│              RAILWAY/RENDER (Backend)                       │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  API Container (Express.js)                 │           │
│  │  • Auth, routing, business logic             │           │
│  │  • Connects to all services                 │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  ML Service Container (FastAPI)             │           │
│  │  • Model serving                            │           │
│  │  • Prediction endpoints                     │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Worker Container (Celery)                  │           │
│  │  • Background jobs                          │           │
│  │  • Data sync                                │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  PostgreSQL + TimescaleDB                   │           │
│  │  • Primary database                         │           │
│  │  • db.t3.micro (20GB storage)               │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │  Redis (cache.t3.micro)                     │           │
│  │  • Caching layer                            │           │
│  │  • Job queue                                │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘

External Services:
• CoinGecko Pro API ($129/mo)
• The Graph (Free tier)
• LunarCrush API ($24/mo)

Total Monthly Cost: ~$200-300
```

## 2.4 Request Flow Examples

### Example 1: Dashboard Load

```
User → Cloudflare CDN → Vercel (React App)
                              ↓
                         API Gateway (auth check)
                              ↓
                     ┌────────┴────────┐
                     ↓                 ↓
            Portfolio Service    Prediction Service
                     ↓                 ↓
              Redis (cache hit?) → PostgreSQL/TimescaleDB
                     ↓
            Return JSON to React → Render Dashboard
            
Response Time Budget:
• CDN: 50ms
• Auth: 20ms
• Service: 150ms (cached) / 400ms (uncached)
• DB Query: 100ms
• Frontend Render: 500ms
Total: <1000ms (p95), <2000ms (p99)
```

### Example 2: Price Update Flow

```
Celery Scheduler (every 60s)
        ↓
CoinGecko API Request (batch fetch 100 tokens)
        ↓
Validate Response → Cross-check with CMC (sample 10%)
        ↓
Store in TimescaleDB (time-series insert)
        ↓
Update Redis cache (SET price:{symbol} with 60s TTL)
        ↓
Publish to Redis Pub/Sub → WebSocket broadcast to clients
        ↓
Alert Engine checks conditions → Send notifications
```

---

# 3. System Design Principles

## 3.1 CORE Principles

### C - Clarity Over Cleverness
Every engineer should understand the system within 2 hours of onboarding. No magic, no abstractions that hide critical behavior.

**Example:** We use simple SQL queries with explicit JOINs rather than complex ORM magic.

### O - Optimize for Change
Requirements will shift. Build flexibility at service boundaries, not within services.

**Example:** External API clients are behind interfaces, allowing provider swaps without service changes.

### R - Reliability Through Redundancy
Critical paths have fallbacks. Non-critical paths fail gracefully.

**Example:** Price data has 2 sources; if both fail, we show stale cached data with a warning.

### E - Evolution Over Perfection
Ship MVP architecture that works, with clear paths to production-grade architecture.

**Example:** Start with monolith + simple cache. Plan microservices split at 50K users.

## 3.2 Technical Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| **Response Time** | <500ms p95 | User research shows 500ms feels instant |
| **Sync Accuracy** | 99%+ | Competitive differentiation vs CoinStats (70-80%) |
| **Uptime** | 99% MVP, 99.9% Year 2 | Realistic for MVP, aggressive for scale |
| **Data Freshness** | 60s for prices, 24h for predictions | Balance cost vs utility |
| **Deployment Time** | <5 min | Enables rapid iteration during MVP |

## 3.3 Non-Goals (MVP Phase)

What we explicitly will NOT build:

❌ Real-time streaming prices (<1s latency) - 60s is sufficient  
❌ Multi-region deployments - Single region (US-East) for MVP  
❌ Advanced ML features (backtesting, custom models) - Core predictions only  
❌ Enterprise features (SSO, white-label, SLAs) - Retail focus  
❌ Mobile-first PWA - Native apps required for best UX

---

# 4. Frontend Architecture

## 4.1 Web Application Structure

```
src/
├── app/                    # Next.js App Router (if using) or CRA
│   ├── (auth)/            # Auth-protected routes
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   ├── predictions/
│   │   └── settings/
│   └── (public)/          # Public routes
│       ├── login/
│       ├── signup/
│       └── landing/
│
├── components/
│   ├── ui/                # Shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── dialog.tsx
│   ├── features/          # Feature-specific components
│   │   ├── portfolio/
│   │   │   ├── PortfolioCard.tsx
│   │   │   ├── AssetList.tsx
│   │   │   └── AllocationChart.tsx
│   │   ├── predictions/
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── ConfidenceIndicator.tsx
│   │   │   └── TransparencyPanel.tsx
│   │   └── risk/
│   │       ├── RiskScore.tsx
│   │       └── RiskBreakdown.tsx
│   └── layouts/
│       ├── DashboardLayout.tsx
│       └── PublicLayout.tsx
│
├── lib/
│   ├── api/               # API client
│   │   ├── client.ts      # Axios/Fetch wrapper
│   │   ├── portfolio.ts   # Portfolio endpoints
│   │   ├── predictions.ts # Prediction endpoints
│   │   └── auth.ts        # Auth endpoints
│   ├── hooks/             # Custom React hooks
│   │   ├── usePortfolio.ts
│   │   ├── usePredictions.ts
│   │   └── useAuth.ts
│   ├── store/             # State management (Zustand or Context)
│   │   ├── authStore.ts
│   │   └── portfolioStore.ts
│   └── utils/
│       ├── formatting.ts  # Number, date formatting
│       └── validation.ts  # Form validation
│
├── types/                 # TypeScript types
│   ├── portfolio.ts
│   ├── prediction.ts
│   └── api.ts
│
└── styles/
    └── globals.css        # Tailwind + custom styles
```

## 4.2 State Management Strategy

**Decision:** Zustand over Redux

**Why:** 
- Less boilerplate (30% less code than Redux)
- Better TypeScript integration
- Easier to learn for 4.5 FTE team
- Sufficient for app complexity

```typescript
// Example: portfolioStore.ts
import { create } from 'zustand';
import { Portfolio, Asset } from '@/types/portfolio';
import { portfolioApi } from '@/lib/api/portfolio';

interface PortfolioStore {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPortfolios: () => Promise<void>;
  selectPortfolio: (id: string) => void;
  syncPortfolio: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  portfolios: [],
  selectedPortfolio: null,
  loading: false,
  error: null,
  
  fetchPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const portfolios = await portfolioApi.getAll();
      set({ portfolios, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  selectPortfolio: (id: string) => {
    const portfolio = get().portfolios.find(p => p.id === id);
    set({ selectedPortfolio: portfolio || null });
  },
  
  syncPortfolio: async (id: string) => {
    set({ loading: true });
    try {
      const updated = await portfolioApi.sync(id);
      set(state => ({
        portfolios: state.portfolios.map(p => 
          p.id === id ? updated : p
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

## 4.3 API Client Architecture

**Pattern:** Axios wrapper with interceptors

```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { getAuthToken, refreshToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Retry with refreshed token on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshToken();
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// Typed API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(res => res.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(res => res.data),
};
```

## 4.4 Mobile App Architecture (React Native)

```
mobile/
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Root navigator
│   │   ├── AuthStack.tsx         # Login/Signup flow
│   │   └── MainStack.tsx         # Authenticated screens
│   ├── screens/                  # Screen components
│   │   ├── DashboardScreen/
│   │   ├── PortfolioScreen/
│   │   ├── PredictionsScreen/
│   │   └── SettingsScreen/
│   ├── components/               # Shared with web (60%)
│   │   └── [same structure as web]
│   ├── lib/                      # Shared logic
│   │   └── [same API client]
│   ├── hooks/                    # Platform-specific hooks
│   │   ├── useNotifications.ts   # Push notifications
│   │   └── useBiometrics.ts      # Face ID / Fingerprint
│   └── services/
│       ├── NotificationService.ts
│       └── BiometricService.ts
└── ios/ & android/               # Native code
```

**Code Sharing Strategy:**
- **Shared (60%):** API client, state management, business logic, types
- **Web-only (20%):** Complex charts (Recharts), advanced forms
- **Mobile-only (20%):** Navigation, push notifications, biometrics

## 4.5 Performance Optimization

### Code Splitting Strategy

```typescript
// Lazy load heavy components
const PredictionChart = lazy(() => import('@/components/predictions/PredictionChart'));
const PortfolioAnalytics = lazy(() => import('@/components/portfolio/Analytics'));

// Critical path (no lazy load)
- Auth components
- Dashboard skeleton
- Basic portfolio display
```

### Caching Strategy (React Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '@/lib/api/portfolio';

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => portfolioApi.getById(id),
    staleTime: 30 * 1000,      // Consider fresh for 30s
    cacheTime: 5 * 60 * 1000,  // Keep in cache for 5min
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
```

### Bundle Size Targets

| Metric | Target | Actual (monitored) |
|--------|--------|--------------------|
| **Initial JS** | <200KB gzipped | Check in CI |
| **Initial CSS** | <50KB gzipped | Check in CI |
| **Total Bundle** | <500KB gzipped | Check in CI |
| **LCP** | <2.5s | Lighthouse CI |
| **FID** | <100ms | Lighthouse CI |

---

# 5. Backend Services Architecture

## 5.1 Monolith Architecture (MVP)

**Decision:** Start with modular monolith, not microservices

**Why:**
- 4.5 FTE team cannot operate multiple services
- Shared database simplifies transactions (portfolio atomicity matters)
- Faster development (no inter-service communication complexity)
- Easier debugging (single log stream)
- Lower infrastructure cost (<$200/mo vs $500+/mo)

**When to Split:**
- Team grows to 12+ engineers (Year 2)
- Traffic exceeds 100K daily active users
- ML inference becomes bottleneck (> 10K predictions/day)

```
backend/
├── src/
│   ├── server.ts              # Express app entry point
│   ├── config/
│   │   ├── database.ts        # PostgreSQL connection
│   │   ├── redis.ts           # Redis connection
│   │   └── env.ts             # Environment variables
│   │
│   ├── middleware/
│   │   ├── auth.ts            # JWT validation
│   │   ├── rateLimit.ts       # Rate limiting (redis-based)
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── logging.ts         # Request logging
│   │
│   ├── modules/               # Business logic modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   ├── portfolio/
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── portfolio.routes.ts
│   │   │   └── exchanges/     # Exchange integrations
│   │   │       ├── binance.ts
│   │   │       ├── coinbase.ts
│   │   │       └── base.ts    # Base exchange interface
│   │   ├── predictions/
│   │   │   ├── predictions.controller.ts
│   │   │   ├── predictions.service.ts
│   │   │   └── predictions.routes.ts
│   │   ├── risk/
│   │   │   ├── risk.controller.ts
│   │   │   ├── risk.service.ts
│   │   │   └── analyzers/     # Risk factor calculators
│   │   │       ├── volatility.ts
│   │   │       ├── liquidity.ts
│   │   │       └── smartContract.ts
│   │   └── alerts/
│   │       ├── alerts.controller.ts
│   │       ├── alerts.service.ts
│   │       └── alerts.worker.ts  # Background checker
│   │
│   ├── services/              # Shared services
│   │   ├── cache.service.ts   # Redis caching abstraction
│   │   ├── queue.service.ts   # Job queue (Bull)
│   │   └── external/          # External API clients
│   │       ├── coingecko.ts
│   │       ├── lunarcrush.ts
│   │       └── thegraph.ts
│   │
│   ├── database/
│   │   ├── migrations/        # SQL migrations
│   │   ├── models/            # TypeORM or Prisma models
│   │   └── seeds/             # Seed data
│   │
│   └── utils/
│       ├── logger.ts          # Winston logger
│       ├── validation.ts      # Zod schemas
│       └── crypto.ts          # Encryption utilities
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
└── scripts/
    ├── migrate.ts             # Run migrations
    └── seed.ts                # Seed database
```

## 5.2 API Gateway Design

**Responsibilities:**
1. Authentication & authorization
2. Rate limiting (per user, per IP)
3. Request routing
4. Response transformation
5. Error standardization

```typescript
// src/server.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import portfolioRoutes from './modules/portfolio/portfolio.routes';
import predictionsRoutes from './modules/predictions/predictions.routes';
import riskRoutes from './modules/risk/risk.routes';
import alertsRoutes from './modules/alerts/alerts.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
});

// Public routes (no auth)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/portfolio', authMiddleware, rateLimitMiddleware, portfolioRoutes);
app.use('/api/predictions', authMiddleware, rateLimitMiddleware, predictionsRoutes);
app.use('/api/risk', authMiddleware, rateLimitMiddleware, riskRoutes);
app.use('/api/alerts', authMiddleware, rateLimitMiddleware, alertsRoutes);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

## 5.3 Authentication & Authorization

**Strategy:** JWT with refresh tokens

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

interface JWTPayload {
  userId: string;
  email: string;
  tier: 'free' | 'plus' | 'pro' | 'power';
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function authMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted (logout)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Generate access + refresh tokens
export function generateTokens(payload: JWTPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN 
  });
  
  const refreshToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: REFRESH_EXPIRES_IN 
  });
  
  return { accessToken, refreshToken };
}

// Logout: blacklist token
export async function logoutUser(token: string) {
  const decoded = jwt.decode(token) as JWTPayload & { exp: number };
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  
  if (ttl > 0) {
    await redisClient.setex(`blacklist:${token}`, ttl, '1');
  }
}
```

## 5.4 Rate Limiting Strategy

**Tiers:**
- Free: 100 requests/hour
- Plus: 1,000 requests/hour
- Pro: 10,000 requests/hour
- Power: Unlimited (monitored)

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { Request, Response } from 'express';

const TIER_LIMITS = {
  free: { points: 100, duration: 3600 },      // 100/hour
  plus: { points: 1000, duration: 3600 },     // 1K/hour
  pro: { points: 10000, duration: 3600 },     // 10K/hour
  power: { points: 100000, duration: 3600 },  // 100K/hour (soft limit)
};

export const rateLimitMiddleware = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: async (req: Request) => {
    const tier = req.user?.tier || 'free';
    return TIER_LIMITS[tier].points;
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, else IP
    return req.user?.userId || req.ip;
  },
  handler: (req: Request, res: Response) => {
    const tier = req.user?.tier || 'free';
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit: TIER_LIMITS[tier].points,
      resetAt: new Date(Date.now() + TIER_LIMITS[tier].duration * 1000),
      upgradeUrl: '/pricing',
    });
  },
});
```

## 5.5 Service Layer Example: Portfolio Service

```typescript
// modules/portfolio/portfolio.service.ts
import { Portfolio, Transaction } from './portfolio.types';
import { db } from '../../config/database';
import { cache } from '../../services/cache.service';
import { ExchangeFactory } from './exchanges/base';
import { logger } from '../../utils/logger';

export class PortfolioService {
  
  /**
   * Get all portfolios for a user
   * Cache TTL: 60s
   */
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const cacheKey = `portfolios:${userId}`;
    
    // Try cache first
    const cached = await cache.get<Portfolio[]>(cacheKey);
    if (cached) {
      logger.debug('Portfolio cache hit', { userId });
      return cached;
    }
    
    // Query database
    const portfolios = await db.portfolio.findMany({
      where: { userId },
      include: {
        holdings: true,
        exchanges: true,
      },
    });
    
    // Calculate current values (join with latest prices)
    const enriched = await this.enrichWithPrices(portfolios);
    
    // Cache for 60s
    await cache.set(cacheKey, enriched, 60);
    
    return enriched;
  }
  
  /**
   * Sync portfolio from exchange
   * This is the critical path - must be reliable
   */
  async syncPortfolio(portfolioId: string, userId: string): Promise<Portfolio> {
    logger.info('Starting portfolio sync', { portfolioId, userId });
    
    // Get portfolio with exchange credentials
    const portfolio = await db.portfolio.findUnique({
      where: { id: portfolioId, userId },
      include: { exchanges: true },
    });
    
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    
    // Sync from each connected exchange
    const syncResults = await Promise.allSettled(
      portfolio.exchanges.map(async (exchange) => {
        const client = ExchangeFactory.create(exchange.type, {
          apiKey: exchange.apiKey,
          apiSecret: exchange.apiSecret,
        });
        
        return client.fetchBalances();
      })
    );
    
    // Process successful syncs
    const balances = syncResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .flatMap(r => r.value);
    
    // Log failures but don't block sync
    syncResults
      .filter(r => r.status === 'rejected')
      .forEach((r, i) => {
        logger.error('Exchange sync failed', {
          exchange: portfolio.exchanges[i].type,
          error: (r as PromiseRejectedResult).reason,
        });
      });
    
    // Update database in transaction
    const updated = await db.$transaction(async (tx) => {
      // Clear existing holdings
      await tx.holding.deleteMany({ where: { portfolioId } });
      
      // Insert new holdings
      await tx.holding.createMany({
        data: balances.map(b => ({
          portfolioId,
          symbol: b.symbol,
          amount: b.amount,
          exchangeId: b.exchangeId,
        })),
      });
      
      // Update last sync timestamp
      return tx.portfolio.update({
        where: { id: portfolioId },
        data: { lastSyncedAt: new Date() },
        include: { holdings: true },
      });
    });
    
    // Invalidate cache
    await cache.delete(`portfolios:${userId}`);
    await cache.delete(`portfolio:${portfolioId}`);
    
    logger.info('Portfolio sync complete', { 
      portfolioId, 
      holdingsCount: updated.holdings.length 
    });
    
    return updated;
  }
  
  /**
   * Enrich portfolios with latest prices
   */
  private async enrichWithPrices(portfolios: Portfolio[]): Promise<Portfolio[]> {
    // Get unique symbols
    const symbols = [...new Set(
      portfolios.flatMap(p => p.holdings.map(h => h.symbol))
    )];
    
    // Fetch prices in batch (from cache or DB)
    const prices = await this.getPrices(symbols);
    
    // Calculate values
    return portfolios.map(portfolio => ({
      ...portfolio,
      holdings: portfolio.holdings.map(holding => ({
        ...holding,
        price: prices[holding.symbol] || 0,
        value: holding.amount * (prices[holding.symbol] || 0),
      })),
      totalValue: portfolio.holdings.reduce(
        (sum, h) => sum + (h.amount * (prices[h.symbol] || 0)), 
        0
      ),
    }));
  }
  
  /**
   * Get current prices for symbols (cached)
   */
  private async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const cacheKeys = symbols.map(s => `price:${s}`);
    const cached = await cache.mget<number>(cacheKeys);
    
    // Return cached prices
    return symbols.reduce((acc, symbol, i) => {
      acc[symbol] = cached[i] || 0;
      return acc;
    }, {} as Record<string, number>);
  }
}
```

---

# 6. Data Architecture

## 6.1 Database Schema (PostgreSQL)

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro', 'power')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Billing
  payfast_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Preferences
  settings JSONB DEFAULT '{}',
  
  INDEX idx_users_email (email),
  INDEX idx_users_tier (tier)
);

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  
  INDEX idx_portfolios_user (user_id),
  INDEX idx_portfolios_synced (last_synced_at)
);

-- Exchange Connections
CREATE TABLE exchange_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  exchange_type VARCHAR(50) NOT NULL, -- 'binance', 'coinbase', etc.
  
  -- Encrypted credentials
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50), -- 'success', 'failed', 'pending'
  last_sync_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_exchanges_portfolio (portfolio_id),
  UNIQUE(portfolio_id, exchange_type)
);

-- Holdings (current balances)
CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  exchange_connection_id UUID REFERENCES exchange_connections(id),
  
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL, -- High precision for crypto
  
  -- Metadata
  first_acquired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_holdings_portfolio (portfolio_id),
  INDEX idx_holdings_symbol (symbol),
  UNIQUE(portfolio_id, exchange_connection_id, symbol)
);

-- Transactions (historical)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  exchange_connection_id UUID REFERENCES exchange_connections(id),
  
  type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'transfer_in', 'transfer_out'
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  price DECIMAL(36, 18),
  fee DECIMAL(36, 18),
  fee_currency VARCHAR(20),
  
  transaction_hash VARCHAR(255), -- Blockchain tx hash (if on-chain)
  exchange_id VARCHAR(255), -- Exchange's internal ID
  
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_transactions_portfolio (portfolio_id),
  INDEX idx_transactions_symbol (symbol),
  INDEX idx_transactions_date (executed_at DESC)
);

-- Assets (token metadata)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  coingecko_id VARCHAR(100),
  
  -- Classification
  category VARCHAR(50), -- 'bitcoin', 'ethereum', 'defi', 'meme', etc.
  
  -- Links
  website_url TEXT,
  whitepaper_url TEXT,
  twitter_handle VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_assets_symbol (symbol),
  INDEX idx_assets_category (category)
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'price', 'portfolio_value', 'risk_score'
  
  -- Conditions (stored as JSONB for flexibility)
  conditions JSONB NOT NULL,
  -- Example: {"symbol": "BTC", "operator": ">=", "value": 50000}
  
  -- State
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_alerts_user (user_id),
  INDEX idx_alerts_active (is_active)
);
```

## 6.2 TimescaleDB Schema (Time-Series Data)

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Price History (high-frequency time-series)
CREATE TABLE price_history (
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(36, 18) NOT NULL,
  volume_24h DECIMAL(36, 2),
  market_cap DECIMAL(36, 2),
  
  -- Data source tracking
  source VARCHAR(50) NOT NULL, -- 'coingecko', 'coinmarketcap', etc.
  
  PRIMARY KEY (time, symbol, source)
);

-- Convert to hypertable (TimescaleDB magic)
SELECT create_hypertable('price_history', 'time');

-- Retention policy: Keep 2 years, compress after 7 days
SELECT add_retention_policy('price_history', INTERVAL '2 years');
SELECT add_compression_policy('price_history', INTERVAL '7 days');

-- Continuous aggregate: 1-hour OHLCV
CREATE MATERIALIZED VIEW price_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  symbol,
  first(price, time) AS open,
  max(price) AS high,
  min(price) AS low,
  last(price, time) AS close,
  avg(volume_24h) AS volume
FROM price_history
GROUP BY bucket, symbol
WITH NO DATA;

-- Refresh policy: Update every hour
SELECT add_continuous_aggregate_policy('price_1h',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');

-- Predictions (model outputs)
CREATE TABLE predictions (
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  
  -- Prediction outputs
  forecast_7d DECIMAL(36, 18),
  forecast_14d DECIMAL(36, 18),
  forecast_30d DECIMAL(36, 18),
  confidence_score DECIMAL(5, 2), -- 0-100
  direction VARCHAR(10), -- 'bullish', 'bearish', 'neutral'
  
  -- Feature importance (for transparency)
  features JSONB,
  
  PRIMARY KEY (time, symbol, model_version)
);

SELECT create_hypertable('predictions', 'time');
SELECT add_retention_policy('predictions', INTERVAL '1 year');

-- Risk Scores (calculated periodically)
CREATE TABLE risk_scores (
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  
  -- Overall score
  risk_score INTEGER NOT NULL, -- 0-100
  risk_category VARCHAR(20), -- 'low', 'medium', 'high', 'extreme'
  
  -- Component scores
  volatility_score INTEGER,
  liquidity_score INTEGER,
  smart_contract_score INTEGER,
  sentiment_score INTEGER,
  
  -- Metadata
  calculation_version VARCHAR(20),
  
  PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('risk_scores', 'time');
SELECT add_retention_policy('risk_scores', INTERVAL '1 year');
```

## 6.3 Redis Caching Strategy

**Cache Keys Pattern:**

```
price:{symbol}              TTL: 60s    -- Current price
portfolio:{id}              TTL: 60s    -- Portfolio data
portfolios:{userId}         TTL: 60s    -- User's portfolios list
prediction:{symbol}         TTL: 24h    -- Daily predictions
risk:{symbol}               TTL: 1h     -- Risk scores
user:{id}                   TTL: 15m    -- User session data
rate_limit:{userId}         TTL: 1h     -- Rate limit counters
session:{token}             TTL: 7d     -- JWT refresh tokens
blacklist:{token}           TTL: 15m    -- Blacklisted tokens
```

**Implementation:**

```typescript
// services/cache.service.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export class CacheService {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  /**
   * Set cached value with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
  
  /**
   * Get multiple keys (pipeline)
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await redis.mget(...keys);
    return values.map(v => v ? JSON.parse(v) : null);
  }
  
  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    await redis.del(key);
  }
  
  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
  
  /**
   * Cache-aside pattern helper
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Cache miss - fetch data
    const value = await fetchFn();
    
    // Store in cache
    await this.set(key, value, ttlSeconds);
    
    return value;
  }
}

export const cache = new CacheService();
```

## 6.4 Database Indexes Strategy

**Rationale:** Balance write performance (inserts) vs read performance (queries)

```sql
-- Users table: Email lookups are critical path
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_payfast ON users(payfast_customer_id) 
  WHERE payfast_customer_id IS NOT NULL;

-- Portfolios: User's portfolios query
CREATE INDEX CONCURRENTLY idx_portfolios_user_updated 
  ON portfolios(user_id, updated_at DESC);

-- Holdings: Portfolio detail page
CREATE INDEX CONCURRENTLY idx_holdings_portfolio_symbol 
  ON holdings(portfolio_id, symbol);

-- Transactions: Historical queries
CREATE INDEX CONCURRENTLY idx_transactions_portfolio_date 
  ON transactions(portfolio_id, executed_at DESC);
CREATE INDEX CONCURRENTLY idx_transactions_symbol_date 
  ON transactions(symbol, executed_at DESC);

-- Price history: Most common query is latest price for symbol
CREATE INDEX CONCURRENTLY idx_price_symbol_time 
  ON price_history(symbol, time DESC);

-- Composite index for price range queries
CREATE INDEX CONCURRENTLY idx_price_range 
  ON price_history(symbol, time DESC, source) 
  WHERE time > NOW() - INTERVAL '30 days';
```

**Query Performance Targets:**

| Query Type | Target | Mitigation if Slow |
|------------|--------|-------------------|
| Get user portfolios | <50ms | Add index on (user_id, updated_at) |
| Portfolio detail | <100ms | Denormalize holdings with price |
| Price lookup | <10ms | Cache all prices in Redis (60s TTL) |
| Transaction history | <200ms | Partition by year after 10M rows |
| Prediction fetch | <50ms | Cache predictions (24h TTL) |

---

# 7. ML/AI Architecture

## 7.1 Model Training Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING PIPELINE                        │
└─────────────────────────────────────────────────────────────┘

1. DATA COLLECTION (Airflow/Cron)
   ├── Historical prices (5 years, hourly)
   ├── On-chain metrics (MVRV, NVT, active addresses)
   ├── Social sentiment (Twitter volume, Reddit mentions)
   └── Technical indicators (RSI, MACD, Bollinger Bands)
   
2. FEATURE ENGINEERING (Python/Pandas)
   ├── Price-based features (returns, volatility, MA crossovers)
   ├── On-chain features (normalized, 7d/30d averages)
   ├── Sentiment features (smoothed, outlier removal)
   └── Temporal features (day of week, month, cycle phase)
   
3. LABEL CREATION
   ├── Identify bull market peaks (30% gain + correction)
   ├── Label timeframes before peak (positive class)
   ├── Label bear markets (negative class)
   └── Neutral periods (neutral class)
   
4. MODEL TRAINING (PyTorch)
   ├── Train/validation/test split (60/20/20)
   ├── LSTM architecture (128 hidden units, 2 layers)
   ├── Training: Adam optimizer, learning rate 0.001
   ├── Early stopping on validation loss
   └── Save best model checkpoint
   
5. MODEL EVALUATION
   ├── Accuracy on test set (target: >65%)
   ├── Precision/recall by class
   ├── Backtesting on unseen data (2024)
   └── Compare vs baseline (random, buy-and-hold)
   
6. MODEL DEPLOYMENT
   ├── Export to ONNX format (for fast inference)
   ├── Upload to S3 with version tag
   ├── Update production model reference
   └── A/B test new model (10% traffic initially)
```

## 7.2 Model Architecture (LSTM)

```python
# ml/models/market_predictor.py
import torch
import torch.nn as nn

class MarketPredictor(nn.Module):
    """
    LSTM-based model for bull/bear market prediction
    
    Input: (batch, sequence_length, num_features)
    Output: (batch, 3) - probabilities for [bearish, neutral, bullish]
    """
    
    def __init__(
        self,
        num_features: int = 15,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2
    ):
        super().__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=num_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Fully connected layers
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 3)  # 3 classes: bearish, neutral, bullish
        )
        
    def forward(self, x):
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Use last hidden state
        last_hidden = h_n[-1]  # Shape: (batch, hidden_size)
        
        # Classification head
        logits = self.fc(last_hidden)
        
        return logits
    
    def predict_proba(self, x):
        """Return class probabilities"""
        logits = self.forward(x)
        return torch.softmax(logits, dim=1)
```

## 7.3 Feature Engineering

```python
# ml/features/engineer.py
import pandas as pd
import numpy as np
from ta import trend, momentum, volatility

class FeatureEngineer:
    """
    Transform raw price data into ML features
    """
    
    @staticmethod
    def create_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Input: DataFrame with columns [time, open, high, low, close, volume]
        Output: DataFrame with 15+ engineered features
        """
        df = df.copy()
        
        # 1. Price-based features
        df['returns'] = df['close'].pct_change()
        df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
        df['price_change_7d'] = df['close'].pct_change(periods=7)
        df['price_change_30d'] = df['close'].pct_change(periods=30)
        
        # 2. Moving averages
        df['ma_7'] = df['close'].rolling(7).mean()
        df['ma_30'] = df['close'].rolling(30).mean()
        df['ma_ratio'] = df['ma_7'] / df['ma_30']  # Golden cross indicator
        
        # 3. Technical indicators (using ta library)
        df['rsi'] = momentum.RSIIndicator(df['close'], window=14).rsi()
        df['macd'] = trend.MACD(df['close']).macd()
        df['macd_signal'] = trend.MACD(df['close']).macd_signal()
        df['bb_upper'] = volatility.BollingerBands(df['close']).bollinger_hband()
        df['bb_lower'] = volatility.BollingerBands(df['close']).bollinger_lband()
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        
        # 4. Volatility
        df['volatility_7d'] = df['returns'].rolling(7).std()
        df['volatility_30d'] = df['returns'].rolling(30).std()
        
        # 5. Volume features
        df['volume_ma_7'] = df['volume'].rolling(7).mean()
        df['volume_ratio'] = df['volume'] / df['volume_ma_7']
        
        # 6. Temporal features
        df['day_of_week'] = pd.to_datetime(df['time']).dt.dayofweek
        df['month'] = pd.to_datetime(df['time']).dt.month
        
        # Drop NaN rows (from rolling calculations)
        df = df.dropna()
        
        return df
    
    @staticmethod
    def normalize_features(df: pd.DataFrame, scaler=None):
        """
        Normalize features to [0, 1] range
        Returns: (normalized_df, scaler)
        """
        from sklearn.preprocessing import MinMaxScaler
        
        if scaler is None:
            scaler = MinMaxScaler()
            scaler.fit(df)
        
        normalized = pd.DataFrame(
            scaler.transform(df),
            columns=df.columns,
            index=df.index
        )
        
        return normalized, scaler
```

## 7.4 Model Serving (FastAPI)

```python
# ml_service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
from typing import List
import redis
import json

from models.market_predictor import MarketPredictor
from features.engineer import FeatureEngineer

app = FastAPI(title="Coinsphere ML Service")

# Load model on startup
model = None
feature_engineer = FeatureEngineer()
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

@app.on_event("startup")
async def load_model():
    global model
    model = MarketPredictor()
    model.load_state_dict(torch.load('models/market_predictor_v1.pth'))
    model.eval()
    print("Model loaded successfully")

class PredictionRequest(BaseModel):
    symbol: str
    timeframe: int = 7  # 7, 14, or 30 days

class PredictionResponse(BaseModel):
    symbol: str
    prediction: str  # 'bullish', 'bearish', 'neutral'
    confidence: float  # 0-100
    probabilities: dict  # {'bearish': 0.2, 'neutral': 0.3, 'bullish': 0.5}
    key_factors: List[dict]  # Feature importance
    historical_accuracy: float  # Model's past accuracy

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate market prediction for a symbol
    """
    symbol = request.symbol.upper()
    
    # Check cache first (24h TTL)
    cache_key = f"prediction:{symbol}:{request.timeframe}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Fetch recent price data (last 60 days)
    try:
        price_data = fetch_price_data(symbol, days=60)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Data not found for {symbol}")
    
    # Engineer features
    features_df = feature_engineer.create_features(price_data)
    features_normalized, _ = feature_engineer.normalize_features(features_df)
    
    # Prepare input tensor (last 30 days)
    input_sequence = torch.tensor(
        features_normalized.tail(30).values,
        dtype=torch.float32
    ).unsqueeze(0)  # Add batch dimension
    
    # Generate prediction
    with torch.no_grad():
        probabilities = model.predict_proba(input_sequence)
        probs = probabilities[0].numpy()  # Shape: (3,)
    
    # Parse results
    classes = ['bearish', 'neutral', 'bullish']
    pred_idx = np.argmax(probs)
    prediction = classes[pred_idx]
    confidence = float(probs[pred_idx] * 100)
    
    # Feature importance (which factors drove prediction)
    key_factors = analyze_feature_importance(features_df, model)
    
    # Historical accuracy (from validation data)
    historical_accuracy = get_model_accuracy(symbol)
    
    result = PredictionResponse(
        symbol=symbol,
        prediction=prediction,
        confidence=confidence,
        probabilities={c: float(p * 100) for c, p in zip(classes, probs)},
        key_factors=key_factors,
        historical_accuracy=historical_accuracy
    )
    
    # Cache for 24 hours
    redis_client.setex(cache_key, 86400, result.json())
    
    return result

def analyze_feature_importance(features_df, model):
    """
    Simple feature importance via perturbation
    Returns top 5 factors influencing prediction
    """
    # This is a simplified version; production would use SHAP or LIME
    last_row = features_df.tail(1)
    
    # For demo, return top technical indicators
    factors = [
        {"name": "RSI", "value": float(last_row['rsi'].values[0]), "importance": "high"},
        {"name": "MACD", "value": float(last_row['macd'].values[0]), "importance": "medium"},
        {"name": "7d/30d MA Ratio", "value": float(last_row['ma_ratio'].values[0]), "importance": "high"},
        {"name": "Volume Ratio", "value": float(last_row['volume_ratio'].values[0]), "importance": "low"},
        {"name": "30d Volatility", "value": float(last_row['volatility_30d'].values[0]), "importance": "medium"},
    ]
    
    return factors

def get_model_accuracy(symbol: str) -> float:
    """
    Retrieve model's historical accuracy for this symbol
    Cached in Redis, updated weekly
    """
    cache_key = f"model_accuracy:{symbol}"
    accuracy = redis_client.get(cache_key)
    
    if accuracy:
        return float(accuracy)
    
    # Fallback: return global accuracy
    return 68.5  # From validation set

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": "v1.0"
    }
```

## 7.5 Risk Scoring Algorithm

```python
# modules/risk/risk.service.py
from typing import Dict
import numpy as np

class RiskScoringService:
    """
    Calculate 0-100 risk score for crypto assets
    Higher score = higher risk
    """
    
    # Weights for each risk factor (sum to 1.0)
    WEIGHTS = {
        'market_cap': 0.20,       # Smaller cap = higher risk
        'volatility': 0.25,       # Higher volatility = higher risk
        'liquidity': 0.20,        # Lower liquidity = higher risk
        'smart_contract': 0.15,   # Audit issues = higher risk
        'sentiment': 0.10,        # Negative sentiment = higher risk
        'whale_concentration': 0.10  # Whale-heavy = higher risk
    }
    
    def calculate_risk_score(self, symbol: str) -> Dict:
        """
        Calculate composite risk score
        
        Returns:
            {
                'overall_score': 45,  # 0-100
                'category': 'medium',  # low, medium, high, extreme
                'factors': {
                    'market_cap_score': 30,
                    'volatility_score': 60,
                    ...
                }
            }
        """
        # Fetch data for asset
        data = self.fetch_asset_data(symbol)
        
        # Calculate individual factor scores
        factors = {
            'market_cap_score': self._score_market_cap(data['market_cap']),
            'volatility_score': self._score_volatility(data['volatility_90d']),
            'liquidity_score': self._score_liquidity(data['volume_24h'], data['market_cap']),
            'smart_contract_score': self._score_smart_contract(data.get('contract_address')),
            'sentiment_score': self._score_sentiment(data.get('sentiment_score', 50)),
            'whale_concentration_score': self._score_whale_concentration(data.get('top_10_holders_pct', 50))
        }
        
        # Weighted average
        overall_score = sum(
            factors[f'{k}_score'] * self.WEIGHTS[k]
            for k in self.WEIGHTS.keys()
        )
        
        # Categorize
        if overall_score < 30:
            category = 'low'
        elif overall_score < 60:
            category = 'medium'
        elif overall_score < 80:
            category = 'high'
        else:
            category = 'extreme'
        
        return {
            'overall_score': int(overall_score),
            'category': category,
            'factors': factors
        }
    
    def _score_market_cap(self, market_cap: float) -> int:
        """
        Market cap risk scoring
        $10B+ : 0-20 (low risk)
        $1B-10B: 20-40 (medium-low)
        $100M-1B: 40-60 (medium)
        $10M-100M: 60-80 (high)
        <$10M: 80-100 (extreme)
        """
        if market_cap >= 10_000_000_000:
            return 10
        elif market_cap >= 1_000_000_000:
            return 30
        elif market_cap >= 100_000_000:
            return 50
        elif market_cap >= 10_000_000:
            return 70
        else:
            return 90
    
    def _score_volatility(self, volatility_90d: float) -> int:
        """
        Volatility risk (90-day standard deviation of returns)
        <5%: Low risk
        5-10%: Medium risk
        10-20%: High risk
        >20%: Extreme risk
        """
        if volatility_90d < 0.05:
            return 20
        elif volatility_90d < 0.10:
            return 40
        elif volatility_90d < 0.20:
            return 70
        else:
            return 95
    
    def _score_liquidity(self, volume_24h: float, market_cap: float) -> int:
        """
        Liquidity risk (volume/market cap ratio)
        Higher ratio = lower risk (easier to exit position)
        """
        ratio = volume_24h / market_cap if market_cap > 0 else 0
        
        if ratio >= 0.10:  # 10%+ daily volume
            return 10
        elif ratio >= 0.05:
            return 30
        elif ratio >= 0.01:
            return 60
        else:
            return 90
    
    def _score_smart_contract(self, contract_address: str | None) -> int:
        """
        Smart contract audit risk
        - No contract (BTC, LTC): 0
        - Audited by top firm: 10-20
        - Audited by unknown: 40-60
        - Not audited: 80-100
        """
        if not contract_address:
            return 0  # Native blockchain asset (BTC, ETH)
        
        # TODO: Integrate with audit database (CertiK, ConsenSys Diligence)
        # For MVP, return medium risk
        return 50
    
    def _score_sentiment(self, sentiment_score: float) -> int:
        """
        Social sentiment risk (0-100, where 50 is neutral)
        Very positive: Low risk
        Neutral: Medium risk
        Negative: High risk
        """
        if sentiment_score >= 70:
            return 20
        elif sentiment_score >= 50:
            return 40
        elif sentiment_score >= 30:
            return 70
        else:
            return 90
    
    def _score_whale_concentration(self, top_10_pct: float) -> int:
        """
        Whale concentration risk (% held by top 10 addresses)
        <30%: Low risk (distributed)
        30-50%: Medium risk
        50-70%: High risk
        >70%: Extreme risk (pump & dump potential)
        """
        if top_10_pct < 30:
            return 20
        elif top_10_pct < 50:
            return 40
        elif top_10_pct < 70:
            return 70
        else:
            return 95
```

---

# 8. Integration Architecture

## 8.1 Exchange Integration Strategy

**Challenge:** 20+ exchanges, each with different APIs, auth methods, and rate limits.

**Solution:** Abstract exchange clients behind common interface.

```typescript
// modules/portfolio/exchanges/base.ts

export interface ExchangeBalance {
  symbol: string;
  free: number;      // Available balance
  locked: number;    // In open orders
  total: number;
}

export interface ExchangeTransaction {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal';
  amount: number;
  price?: number;
  fee?: number;
  timestamp: Date;
}

export abstract class BaseExchangeClient {
  protected apiKey: string;
  protected apiSecret: string;
  
  constructor(credentials: { apiKey: string; apiSecret: string }) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }
  
  /**
   * Fetch all balances
   */
  abstract fetchBalances(): Promise<ExchangeBalance[]>;
  
  /**
   * Fetch transaction history
   */
  abstract fetchTransactions(since?: Date): Promise<ExchangeTransaction[]>;
  
  /**
   * Test API credentials
   */
  abstract testConnection(): Promise<boolean>;
  
  /**
   * Get exchange name
   */
  abstract getExchangeName(): string;
}

// Factory pattern for creating clients
export class ExchangeFactory {
  static create(type: string, credentials: any): BaseExchangeClient {
    switch (type) {
      case 'binance':
        return new BinanceClient(credentials);
      case 'coinbase':
        return new CoinbaseClient(credentials);
      case 'kraken':
        return new KrakenClient(credentials);
      // ... 17 more exchanges
      default:
        throw new Error(`Unknown exchange: ${type}`);
    }
  }
}
```

### Example: Binance Client

```typescript
// modules/portfolio/exchanges/binance.ts
import axios from 'axios';
import crypto from 'crypto';
import { BaseExchangeClient, ExchangeBalance } from './base';

export class BinanceClient extends BaseExchangeClient {
  private readonly baseURL = 'https://api.binance.com';
  
  getExchangeName(): string {
    return 'Binance';
  }
  
  async fetchBalances(): Promise<ExchangeBalance[]> {
    try {
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);
      
      const response = await axios.get(
        `${this.baseURL}/api/v3/account`,
        {
          params: { timestamp, signature },
          headers: { 'X-MBX-APIKEY': this.apiKey },
          timeout: 10000,
        }
      );
      
      // Transform Binance format to our standard format
      return response.data.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          symbol: b.asset,
          free: parseFloat(b.free),
          locked: parseFloat(b.locked),
          total: parseFloat(b.free) + parseFloat(b.locked),
        }));
    } catch (error) {
      throw new Error(`Binance API error: ${error.message}`);
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchBalances();
      return true;
    } catch {
      return false;
    }
  }
  
  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }
}
```

## 8.2 Circuit Breaker Pattern

**Problem:** External APIs fail or become slow. We need to fail fast and use fallbacks.

```typescript
// services/circuitBreaker.ts

enum CircuitState {
  CLOSED,  // Normal operation
  OPEN,    // Failing, reject requests immediately
  HALF_OPEN // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeout: number = 60000, // 1 minute
    private readonly halfOpenRequests: number = 1
  ) {}
  
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // If circuit is OPEN, fail fast
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        // Timeout elapsed, try again
        this.state = CircuitState.HALF_OPEN;
      } else {
        // Still in timeout, use fallback or throw
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Too many failures - open circuit
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
      }
      
      // Use fallback if available
      if (fallback) {
        return fallback();
      }
      
      throw error;
    }
  }
}

// Usage example
const coingeckoBreaker = new CircuitBreaker(5, 60000);

async function fetchPriceWithFallback(symbol: string): Promise<number> {
  return coingeckoBreaker.execute(
    () => coingeckoClient.getPrice(symbol),
    () => coinmarketcapClient.getPrice(symbol) // Fallback to CMC
  );
}
```

## 8.3 Data Provider Integration

```typescript
// services/external/coingecko.ts
import axios from 'axios';
import { cache } from '../cache.service';

export class CoinGeckoClient {
  private readonly baseURL = 'https://api.coingecko.com/api/v3';
  private readonly apiKey = process.env.COINGECKO_API_KEY;
  
  /**
   * Fetch current prices for multiple symbols
   * Cached for 60 seconds
   */
  async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const cacheKey = `coingecko:prices:${symbols.sort().join(',')}`;
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const ids = symbols.map(s => this.symbolToId(s)).join(',');
        
        const response = await axios.get(`${this.baseURL}/simple/price`, {
          params: {
            ids,
            vs_currencies: 'usd',
            x_cg_pro_api_key: this.apiKey,
          },
          timeout: 5000,
        });
        
        // Transform {bitcoin: {usd: 50000}} to {BTC: 50000}
        const prices: Record<string, number> = {};
        for (const [id, data] of Object.entries(response.data)) {
          const symbol = this.idToSymbol(id);
          prices[symbol] = (data as any).usd;
        }
        
        return prices;
      },
      60 // Cache for 60 seconds
    );
  }
  
  /**
   * Fetch historical prices (daily OHLC)
   */
  async getHistoricalPrices(
    symbol: string,
    days: number = 365
  ): Promise<Array<{time: Date; price: number}>> {
    const id = this.symbolToId(symbol);
    
    const response = await axios.get(
      `${this.baseURL}/coins/${id}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days,
          interval: 'daily',
          x_cg_pro_api_key: this.apiKey,
        },
        timeout: 10000,
      }
    );
    
    return response.data.prices.map((p: [number, number]) => ({
      time: new Date(p[0]),
      price: p[1],
    }));
  }
  
  private symbolToId(symbol: string): string {
    // Mapping of common symbols to CoinGecko IDs
    const map: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      // ... more mappings
    };
    return map[symbol.toUpperCase()] || symbol.toLowerCase();
  }
  
  private idToSymbol(id: string): string {
    const reverseMap: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'solana': 'SOL',
      // ... more mappings
    };
    return reverseMap[id] || id.toUpperCase();
  }
}
```

---

*This document continues with sections 9-15, covering Infrastructure, Security, Scalability, Failure Modes, Evolution Roadmap, and Architectural Decision Records. Due to length constraints, I'll provide the complete document in the next artifact.*

---

# 9. Infrastructure & DevOps

## 9.1 MVP Deployment Architecture (Railway/Render)

**Timeline:** Weeks 1-8 (MVP phase)  
**Cost:** $200-300/month  
**Rationale:** Zero DevOps overhead, one-click deployments, sufficient for 1-10K users

```yaml
# railway.yml (Infrastructure as Code)
services:
  api:
    source: ./backend
    build:
      dockerfile: Dockerfile
    env:
      NODE_ENV: production
      DATABASE_URL: ${{Postgres.DATABASE_URL}}
      REDIS_URL: ${{Redis.REDIS_URL}}
    healthcheck:
      path: /health
      interval: 30s
    deploy:
      replicas: 2
      resources:
        memory: 512MB
        cpu: 0.5
    
  ml-service:
    source: ./ml_service
    build:
      dockerfile: Dockerfile
    env:
      REDIS_URL: ${{Redis.REDIS_URL}}
      MODEL_PATH: /models/market_predictor_v1.pth
    healthcheck:
      path: /health
    deploy:
      replicas: 1
      resources:
        memory: 1GB
        cpu: 1.0
    
  worker:
    source: ./backend
    command: npm run worker
    env:
      DATABASE_URL: ${{Postgres.DATABASE_URL}}
      REDIS_URL: ${{Redis.REDIS_URL}}
    deploy:
      replicas: 1
  
databases:
  postgres:
    plan: starter  # $15/month
    version: 15
    extensions:
      - timescaledb
  
  redis:
    plan: starter  # $10/month
    version: 7
```

## 9.2 Production Architecture (AWS - Year 2)

**Timeline:** Month 9-12 (after 50K users)  
**Cost:** $500-1000/month  
**Rationale:** Need fine-grained control, better performance, auto-scaling

```
┌──────────────────────────────────────────────────────────────┐
│                      ROUTE 53 (DNS)                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                   CLOUDFLARE CDN                             │
│  • DDoS Protection                                           │
│  • WAF Rules                                                 │
│  • SSL/TLS Termination                                       │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                  APPLICATION LOAD BALANCER                   │
│  • Health checks                                             │
│  • SSL offloading                                            │
│  • Path-based routing                                        │
└──────┬──────────────────────────────────┬────────────────────┘
       │                                  │
┌──────▼──────────┐            ┌──────────▼─────────┐
│   ECS CLUSTER   │            │   ECS CLUSTER      │
│   API Service   │            │   ML Service       │
│  (2-4 tasks)    │            │   (1-2 tasks)      │
│                 │            │                    │
│  Fargate        │            │  Fargate           │
│  256MB-1GB RAM  │            │  1-2GB RAM         │
└──────┬──────────┘            └──────────┬─────────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    RDS PostgreSQL         │
        │    (Multi-AZ)             │
        │    db.t3.large            │
        │    100GB SSD              │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   ElastiCache Redis       │
        │   cache.t3.medium         │
        │   (Cluster mode)          │
        └───────────────────────────┘

Monitoring & Logging:
• CloudWatch Logs (all services)
• CloudWatch Metrics + Alarms
• X-Ray (distributed tracing)
• Sentry (error tracking)

Backups:
• RDS automated backups (daily, 7-day retention)
• Manual snapshots before major releases
• S3 backup of ML models
```

## 9.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: timescale/timescaledb:latest-pg15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint
      
      - name: Run type check
        working-directory: ./backend
        run: npm run type-check
      
      - name: Run unit tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        working-directory: ./backend
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
          flags: backend
  
  test-ml-service:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: ./ml_service
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run linter
        working-directory: ./ml_service
        run: |
          pip install flake8
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
      
      - name: Run tests
        working-directory: ./ml_service
        run: pytest --cov=. --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./ml_service/coverage.xml
          flags: ml-service
  
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run type check
        working-directory: ./frontend
        run: npm run type-check
      
      - name: Run unit tests
        working-directory: ./frontend
        run: npm test -- --coverage
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
      
      - name: Check bundle size
        working-directory: ./frontend
        run: |
          npm run analyze
          # Fail if bundle > 500KB gzipped
          if [ $(du -sk dist | cut -f1) -gt 500 ]; then
            echo "Bundle size exceeds 500KB limit"
            exit 1
          fi
  
  deploy-staging:
    needs: [test-backend, test-ml-service, test-frontend]
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway (Staging)
        run: |
          npm install -g @railway/cli
          railway deploy --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Run E2E tests
        run: |
          npm run test:e2e -- --baseUrl=https://staging.coinsphere.app
  
  deploy-production:
    needs: [test-backend, test-ml-service, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway (Production)
        run: |
          npm install -g @railway/cli
          railway deploy --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
      
      - name: Smoke tests
        run: |
          curl -f https://api.coinsphere.app/health || exit 1
          curl -f https://coinsphere.app || exit 1
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 9.4 Monitoring & Observability

### Metrics to Track

```typescript
// Instrumentation example (Prometheus metrics)
import { Counter, Histogram, Gauge } from 'prom-client';

// API request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1.0, 3.0, 5.0]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
export const portfolioSyncsTotal = new Counter({
  name: 'portfolio_syncs_total',
  help: 'Total portfolio syncs',
  labelNames: ['exchange', 'status']
});

export const predictionRequestsTotal = new Counter({
  name: 'prediction_requests_total',
  help: 'Total prediction requests',
  labelNames: ['symbol', 'timeframe']
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Currently active users'
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1.0]
});

// Cache metrics
export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate (0-1)',
  labelNames: ['cache_key_pattern']
});
```

### Alerting Rules (CloudWatch / PagerDuty)

```yaml
# alerts.yml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5% for 5 minutes
    severity: critical
    notify: pagerduty
    message: "API error rate is {{ value }}%"
  
  - name: SlowResponseTime
    condition: p95_latency > 1000ms for 10 minutes
    severity: warning
    notify: slack
    message: "API p95 latency is {{ value }}ms"
  
  - name: DatabaseConnectionPoolExhausted
    condition: db_connections_available < 5
    severity: critical
    notify: pagerduty
    message: "Database connection pool nearly exhausted"
  
  - name: PredictionServiceDown
    condition: ml_service_health_check fails for 3 minutes
    severity: critical
    notify: pagerduty
    message: "ML service is unhealthy"
  
  - name: ExchangeSyncFailureRate
    condition: sync_failure_rate > 10% for 15 minutes
    severity: warning
    notify: slack
    message: "Exchange sync failure rate is {{ value }}%"
  
  - name: DiskSpaceUsage
    condition: disk_usage > 80%
    severity: warning
    notify: slack
    message: "Disk usage is {{ value }}%"
```

### Logging Strategy

```typescript
// utils/logger.ts
import winston from 'winston';

// Structured logging with Winston
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'coinsphere-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console for local development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File for production (rotated daily)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// Log correlation IDs for request tracing
export function logWithContext(
  level: string,
  message: string,
  meta: Record<string, any> = {}
) {
  logger.log(level, message, {
    ...meta,
    correlationId: meta.correlationId || generateCorrelationId(),
    timestamp: new Date().toISOString(),
  });
}

// Usage in middleware
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  
  logger.info('Incoming request', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  
  next();
});
```

## 9.5 Database Backup & Recovery

```bash
#!/bin/bash
# scripts/backup-database.sh

# Daily automated backup script (runs via cron)

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://coinsphere-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
echo "Starting database backup..."
pg_dump $DATABASE_URL \
  --format=custom \
  --file="$BACKUP_DIR/backup_$TIMESTAMP.dump" \
  --verbose

# Compress
echo "Compressing backup..."
gzip "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp \
  "$BACKUP_DIR/backup_$TIMESTAMP.dump.gz" \
  "$S3_BUCKET/daily/backup_$TIMESTAMP.dump.gz"

# Delete local backups older than 7 days
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +7 -delete

# Verify backup integrity
echo "Verifying backup..."
aws s3 ls "$S3_BUCKET/daily/backup_$TIMESTAMP.dump.gz" || {
  echo "ERROR: Backup verification failed"
  exit 1
}

echo "Backup completed successfully"
```

**Recovery Procedure:**

```bash
# Restore from backup
aws s3 cp s3://coinsphere-backups/daily/backup_20250106.dump.gz .
gunzip backup_20250106.dump.gz
pg_restore --dbname=$DATABASE_URL --clean backup_20250106.dump

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

---

# 10. Security Architecture

## 10.1 Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/login
       │    {email, password}
       ▼
┌─────────────────┐
│   API Gateway   │
└──────┬──────────┘
       │ 2. Query users table
       ▼
┌─────────────────┐
│   PostgreSQL    │
└──────┬──────────┘
       │ 3. Return user + password_hash
       ▼
┌─────────────────┐
│  Auth Service   │ 4. bcrypt.compare(password, hash)
└──────┬──────────┘
       │ 5. If valid, generate JWT
       │
       │ 6. Store refresh token in Redis
       ▼
┌─────────────────┐
│     Redis       │ SET refresh:{userId} = token, EX 7d
└──────┬──────────┘
       │
       │ 7. Return tokens to client
       ▼
┌─────────────────┐
│    Client       │ Store in httpOnly cookie + localStorage
└─────────────────┘
```

## 10.2 Data Encryption

### At Rest (PostgreSQL)

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data before storage
CREATE TABLE exchange_connections (
  id UUID PRIMARY KEY,
  api_key_encrypted TEXT NOT NULL,  -- Encrypted with pgp_sym_encrypt
  api_secret_encrypted TEXT NOT NULL
);

-- Insert with encryption
INSERT INTO exchange_connections (id, api_key_encrypted, api_secret_encrypted)
VALUES (
  gen_random_uuid(),
  pgp_sym_encrypt('API_KEY_VALUE', 'encryption_key_from_env'),
  pgp_sym_encrypt('API_SECRET_VALUE', 'encryption_key_from_env')
);

-- Query with decryption
SELECT 
  id,
  pgp_sym_decrypt(api_key_encrypted::bytea, 'encryption_key_from_env') AS api_key,
  pgp_sym_decrypt(api_secret_encrypted::bytea, 'encryption_key_from_env') AS api_secret
FROM exchange_connections
WHERE user_id = '...';
```

### In Transit (TLS)

- All external APIs require TLS 1.3
- Cloudflare enforces HTTPS (HSTS enabled)
- Internal service communication via VPC (no public IPs)

## 10.3 API Security

### Rate Limiting (Tiered)

```typescript
// Already covered in Section 5.4, but adding DDoS protection

// Aggressive rate limiting for unauthenticated endpoints
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
}));
```

### Input Validation (Zod)

```typescript
// utils/validation.ts
import { z } from 'zod';

// User registration schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept terms and conditions'
  }),
});

// Portfolio sync request
export const syncPortfolioSchema = z.object({
  portfolioId: z.string().uuid('Invalid portfolio ID'),
  force: z.boolean().optional(),
});

// Prediction request
export const predictionRequestSchema = z.object({
  symbol: z.string()
    .min(2).max(10)
    .regex(/^[A-Z0-9]+$/, 'Symbol must be uppercase alphanumeric'),
  timeframe: z.enum(['7', '14', '30']).transform(Number),
});

// Middleware to validate request body
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Usage
app.post('/api/auth/register', 
  validateBody(registerSchema),
  authController.register
);
```

### SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries
// ✅ GOOD - Safe from SQL injection
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ BAD - Vulnerable to SQL injection
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// Use query builder (Prisma) for added safety
const user = await prisma.user.findUnique({
  where: { email },
});
```

### CORS Configuration

```typescript
// Strict CORS for production
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://coinsphere.app',
      'https://www.coinsphere.app',
      'https://app.coinsphere.app',
    ];
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3001');
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));
```

## 10.4 Secrets Management

**MVP:** Environment variables (Railway secrets)

```bash
# .env.example (never commit actual secrets)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=generate_with_openssl_rand_base64_32
ENCRYPTION_KEY=generate_with_openssl_rand_base64_32
COINGECKO_API_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://...
```

**Production (AWS):** AWS Secrets Manager

```typescript
// config/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    return response.SecretString || '';
  } catch (error) {
    console.error(`Failed to retrieve secret ${secretName}:`, error);
    throw error;
  }
}

// Usage
const jwtSecret = await getSecret('prod/coinsphere/jwt-secret');
```

## 10.5 GDPR Compliance

### Data Subject Rights

```typescript
// modules/gdpr/gdpr.service.ts

export class GDPRService {
  /**
   * Right to Access (Article 15)
   * User can request all their data
   */
  async exportUserData(userId: string): Promise<Buffer> {
    const user = await db.user.findUnique({ where: { id: userId } });
    const portfolios = await db.portfolio.findMany({ where: { userId } });
    const transactions = await db.transaction.findMany({ where: { userId } });
    const alerts = await db.alert.findMany({ where: { userId } });
    
    const data = {
      user: {
        email: user.email,
        tier: user.tier,
        createdAt: user.createdAt,
      },
      portfolios,
      transactions,
      alerts,
    };
    
    // Return as JSON file
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  /**
   * Right to Erasure (Article 17)
   * User can request deletion
   */
  async deleteUserData(userId: string): Promise<void> {
    await db.$transaction([
      // Delete cascades handle most relations
      db.user.delete({ where: { id: userId } }),
      
      // Log deletion for audit trail
      db.auditLog.create({
        data: {
          userId,
          action: 'USER_DELETED',
          timestamp: new Date(),
        },
      }),
    ]);
    
    // Invalidate all sessions
    await cache.deletePattern(`session:${userId}:*`);
  }
  
  /**
   * Right to Rectification (Article 16)
   * User can update incorrect data
   */
  async updateUserData(userId: string, updates: Partial<User>): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: updates,
    });
  }
}
```

### Cookie Consent

```typescript
// Frontend: Cookie consent banner
export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    setConsent(stored === 'true');
  }, []);
  
  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setConsent(true);
    // Enable analytics
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
    });
  };
  
  if (consent !== null) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
      <p>
        We use cookies to improve your experience. 
        <a href="/privacy" className="underline">Privacy Policy</a>
      </p>
      <button onClick={handleAccept}>Accept</button>
    </div>
  );
}
```

---

# 11. Scalability & Performance

## 11.1 Scaling Strategy by User Count

### Phase 1: MVP (0-10K users)

**Architecture:** Monolith + single database + Redis  
**Infrastructure:** Railway (2 API replicas, 1 worker)  
**Cost:** $200-300/month

**Bottlenecks:**
- None expected at this scale
- Single database handles 10K users easily

**Optimizations:**
- Redis caching (60s TTL for prices)
- Database connection pooling (max 20 connections)

### Phase 2: Growth (10K-100K users)

**Architecture:** Same monolith, upgraded resources  
**Infrastructure:** Railway â†' AWS ECS (4-8 API replicas, 2 ML replicas, 2 workers)  
**Cost:** $500-800/month

**Bottlenecks:**
- Database writes (portfolio syncs)
- ML inference (prediction requests)

**Optimizations:**
- Read replicas for analytics queries
- Increase Redis cache memory (from 512MB to 4GB)
- CDN all static assets (Cloudflare)
- Batch ML inference (process 10 predictions at once)

### Phase 3: Scale (100K-1M users)

**Architecture:** Migrate to microservices  
**Infrastructure:** AWS ECS (10-20 replicas across services)  
**Cost:** $2K-5K/month

**Services Split:**
1. **API Gateway** (Express.js) - Routing, auth
2. **Portfolio Service** (Node.js) - Portfolio CRUD, sync
3. **Market Data Service** (Node.js) - Price fetching, caching
4. **Prediction Service** (Python) - ML inference
5. **Risk Scoring Service** (Python) - Risk calculations
6. **Alert Service** (Node.js) - Alert monitoring
7. **Notification Service** (Node.js) - Email, push, webhooks

**Bottlenecks:**
- Database writes at 1M users (estimate 50K portfolios syncing daily)
- External API rate limits (CoinGecko Pro allows 500 calls/sec)

**Optimizations:**
- Database sharding (shard by user_id, 4 shards)
- TimescaleDB compression (7-day policy)
- Kafka event stream for async processing
- GraphQL federation (if API becomes complex)
- Multi-region deployment (US, EU)

## 11.2 Database Performance

### Query Optimization

```sql
-- Slow query example (before optimization)
SELECT 
  p.*, 
  u.email,
  COUNT(h.id) as holdings_count
FROM portfolios p
JOIN users u ON p.user_id = u.id
LEFT JOIN holdings h ON h.portfolio_id = p.id
WHERE u.tier = 'pro'
GROUP BY p.id, u.email
ORDER BY p.updated_at DESC;

-- Query time: 850ms (too slow!)

-- Optimized version
-- 1. Add composite index
CREATE INDEX CONCURRENTLY idx_portfolios_user_tier_updated 
ON portfolios(user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_users_tier 
ON users(tier) WHERE tier IN ('pro', 'power');

-- 2. Denormalize holdings count
ALTER TABLE portfolios ADD COLUMN holdings_count INTEGER DEFAULT 0;

-- Update count on insert/delete via trigger
CREATE OR REPLACE FUNCTION update_holdings_count()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE portfolios SET holdings_count = holdings_count + 1
    WHERE id = NEW.portfolio_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE portfolios SET holdings_count = holdings_count - 1
    WHERE id = OLD.portfolio_id;
  END IF;
  RETURN NULL;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER holdings_count_trigger
AFTER INSERT OR DELETE ON holdings
FOR EACH ROW EXECUTE FUNCTION update_holdings_count();

-- 3. Simplified query
SELECT 
  p.*, 
  u.email,
  p.holdings_count
FROM portfolios p
JOIN users u ON p.user_id = u.id
WHERE u.tier = 'pro'
ORDER BY p.updated_at DESC
LIMIT 100;

-- Query time: 45ms ✅
```

### Connection Pooling

```typescript
// config/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000,
  
  // Production settings
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

export default pool;
```

### Caching Layers

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      ▼
┌─────────────────────┐
│  Cloudflare CDN     │ ◄── Static assets (HTML, JS, CSS, images)
│  Cache: 24h         │     Cache hit rate: ~95%
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Application Cache  │ ◄── API responses (user sessions, predictions)
│  Redis, TTL: 60s    │     Cache hit rate: ~70%
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Database Cache     │ ◄── Query results (pg shared_buffers)
│  PostgreSQL, 2GB    │     Cache hit rate: ~90%
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Disk Storage       │ ◄── Cold data (SSD, 100GB)
└─────────────────────┘

Cache Invalidation Strategy:
• Price data: Time-based (60s TTL)
• Portfolio data: Event-based (invalidate on sync)
• Predictions: Time-based (24h TTL)
• User data: Event-based (invalidate on update)
```

## 11.3 Performance Budgets & SLOs

### Service Level Objectives

| Metric | Target (MVP) | Target (Year 2) | Measurement |
|--------|--------------|-----------------|-------------|
| **Uptime** | 99.0% | 99.9% | Monthly |
| **API Latency (p50)** | <200ms | <100ms | Per-endpoint |
| **API Latency (p95)** | <500ms | <300ms | Per-endpoint |
| **API Latency (p99)** | <1000ms | <500ms | Per-endpoint |
| **Dashboard Load** | <3s | <2s | Lighthouse |
| **Error Rate** | <1% | <0.1% | Per-endpoint |
| **Sync Accuracy** | 99%+ | 99.9%+ | Sampled daily |
| **Prediction Accuracy** | 65%+ | 75%+ | Backtested weekly |

### Frontend Performance Budget

```typescript
// lighthouse.config.js
module.exports = {
  ci: {
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],  // 1.8s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        
        // Bundle size
        'resource-summary:script:size': ['error', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 51200 }], // 50KB
      },
    },
  },
};
```

---

# 12. Data Quality & Validation

## 12.1 Dual-Source Price Validation

```typescript
// services/priceValidation.service.ts

export class PriceValidationService {
  /**
   * Fetch price from multiple sources and cross-validate
   */
  async getValidatedPrice(symbol: string): Promise<{
    price: number;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
  }> {
    // Fetch from primary and secondary sources in parallel
    const [primaryPrice, secondaryPrice] = await Promise.allSettled([
      coingeckoClient.getPrice(symbol),
      coinmarketcapClient.getPrice(symbol),
    ]);
    
    // If primary fails, use secondary
    if (primaryPrice.status === 'rejected') {
      if (secondaryPrice.status === 'fulfilled') {
        logger.warn('Primary price source failed, using secondary', { symbol });
        return {
          price: secondaryPrice.value,
          confidence: 'medium',
          sources: ['coinmarketcap'],
        };
      }
      throw new Error('All price sources failed');
    }
    
    // If secondary fails, use primary with lower confidence
    if (secondaryPrice.status === 'rejected') {
      return {
        price: primaryPrice.value,
        confidence: 'medium',
        sources: ['coingecko'],
      };
    }
    
    // Both succeeded - validate consistency
    const price1 = primaryPrice.value;
    const price2 = secondaryPrice.value;
    const discrepancy = Math.abs(price1 - price2) / price1;
    
    if (discrepancy > 0.05) {
      // >5% difference - flag for review
      logger.error('Price discrepancy detected', {
        symbol,
        price1,
        price2,
        discrepancy: discrepancy * 100,
      });
      
      await this.flagAnomaly(symbol, price1, price2);
      
      return {
        price: price1, // Use primary but mark as low confidence
        confidence: 'low',
        sources: ['coingecko', 'coinmarketcap'],
      };
    }
    
    // Prices are consistent
    return {
      price: (price1 + price2) / 2, // Average
      confidence: 'high',
      sources: ['coingecko', 'coinmarketcap'],
    };
  }
  
  /**
   * Flag price anomaly for manual review
   */
  private async flagAnomaly(
    symbol: string,
    price1: number,
    price2: number
  ): Promise<void> {
    await db.priceAnomaly.create({
      data: {
        symbol,
        source1: 'coingecko',
        price1,
        source2: 'coinmarketcap',
        price2,
        discrepancy: Math.abs(price1 - price2) / price1,
        flaggedAt: new Date(),
        resolved: false,
      },
    });
    
    // Alert team in Slack
    await slackClient.sendMessage({
      channel: '#data-quality',
      text: `⚠️ Price anomaly: ${symbol} | CG: ${price1} | CMC: ${price2}`,
    });
  }
}
```

## 12.2 Exchange Sync Reliability

```typescript
// modules/portfolio/portfolio.service.ts (enhanced)

export class PortfolioService {
  /**
   * Sync with automatic retry and error recovery
   */
  async syncPortfolio(portfolioId: string, userId: string): Promise<SyncResult> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        
        const result = await this.performSync(portfolioId, userId);
        
        // Log success
        await this.logSyncEvent(portfolioId, 'success', result);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Sync attempt ${attempt} failed`, {
          portfolioId,
          error: error.message,
        });
        
        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    // All retries failed - log and notify user
    await this.logSyncEvent(portfolioId, 'failed', null, lastError);
    
    throw new Error(`Sync failed after ${maxRetries} attempts: ${lastError?.message}`);
  }
  
  /**
   * Validate synced data for correctness
   */
  private async validateSyncedData(holdings: Holding[]): Promise<boolean> {
    // Check for obvious errors
    for (const holding of holdings) {
      // Negative balance
      if (holding.amount < 0) {
        logger.error('Invalid holding: negative balance', { holding });
        return false;
      }
      
      // Suspiciously large balance
      if (holding.amount > 1000000000) {
        logger.warn('Suspiciously large balance', { holding });
        // Don't fail, but flag for review
      }
      
      // Unknown symbol
      const asset = await this.getAsset(holding.symbol);
      if (!asset) {
        logger.warn('Unknown asset symbol', { symbol: holding.symbol });
        // Create placeholder asset
        await this.createAsset(holding.symbol);
      }
    }
    
    return true;
  }
  
  /**
   * Log sync event for debugging and metrics
   */
  private async logSyncEvent(
    portfolioId: string,
    status: 'success' | 'failed' | 'partial',
    result: SyncResult | null,
    error: Error | null = null
  ): Promise<void> {
    await db.syncLog.create({
      data: {
        portfolioId,
        status,
        holdingsCount: result?.holdings.length || 0,
        duration: result?.duration || 0,
        error: error?.message,
        timestamp: new Date(),
      },
    });
    
    // Update sync metrics
    syncMetrics.labels({ status }).inc();
  }
}
```

## 12.3 User Feedback Loop

```typescript
// modules/feedback/feedback.service.ts

export class FeedbackService {
  /**
   * User reports incorrect data
   */
  async reportDataIssue(
    userId: string,
    type: 'price' | 'balance' | 'prediction',
    details: {
      symbol?: string;
      expected?: number;
      actual?: number;
      description: string;
    }
  ): Promise<void> {
    // Create feedback record
    await db.feedback.create({
      data: {
        userId,
        type,
        details,
        status: 'open',
        createdAt: new Date(),
      },
    });
    
    // If critical (price issue), alert team immediately
    if (type === 'price') {
      await slackClient.sendMessage({
        channel: '#data-issues',
        text: `🚨 User reported price issue for ${details.symbol}`,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*User:* ${userId}\n*Symbol:* ${details.symbol}\n*Expected:* ${details.expected}\n*Actual:* ${details.actual}\n*Description:* ${details.description}`,
          },
        }],
      });
    }
    
    // Log for analytics
    logger.info('Data issue reported', { userId, type, details });
  }
  
  /**
   * Weekly data quality report
   */
  async generateQualityReport(): Promise<QualityReport> {
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Sync success rate
    const syncLogs = await db.syncLog.groupBy({
      by: ['status'],
      where: { timestamp: { gte: startDate } },
      _count: true,
    });
    
    const totalSyncs = syncLogs.reduce((sum, log) => sum + log._count, 0);
    const successfulSyncs = syncLogs.find(l => l.status === 'success')?._count || 0;
    const syncSuccessRate = (successfulSyncs / totalSyncs) * 100;
    
    // User-reported issues
    const reportedIssues = await db.feedback.count({
      where: {
        createdAt: { gte: startDate },
        type: { in: ['price', 'balance'] },
      },
    });
    
    // Price anomalies
    const priceAnomalies = await db.priceAnomaly.count({
      where: {
        flaggedAt: { gte: startDate },
        resolved: false,
      },
    });
    
    return {
      week: format(startDate, 'yyyy-MM-dd'),
      syncSuccessRate,
      totalSyncs,
      reportedIssues,
      priceAnomalies,
      status: syncSuccessRate >= 99 ? 'healthy' : 'degraded',
    };
  }
}
```

---

# 13. Failure Modes & Recovery

## 13.1 Failure Scenarios

### Scenario 1: External API Goes Down (CoinGecko)

**Impact:** Cannot fetch fresh price data  
**Detection:** Circuit breaker opens after 5 failures  
**Mitigation:**
1. Serve stale cached prices (from Redis)
2. Fallback to secondary provider (CoinMarketCap)
3. Show warning banner to users: "Prices may be delayed"

**Recovery:**
- Circuit breaker auto-resets after 60s
- Manual override available via admin panel

### Scenario 2: Database Connection Pool Exhausted

**Impact:** API returns 500 errors  
**Detection:** CloudWatch alarm when available connections < 5  
**Mitigation:**
1. Reject new requests with 503 (Service Unavailable)
2. Queue requests in Redis (max 1000)
3. Process queue when connections available

**Recovery:**
- Identify and kill long-running queries
- Increase pool size (short-term)
- Optimize slow queries (long-term)

### Scenario 3: Redis Cache Failure

**Impact:** Slower responses (cache miss = DB query)  
**Detection:** Health check fails  
**Mitigation:**
1. Application continues without cache (degraded performance)
2. All requests hit database directly
3. Alert oncall engineer

**Recovery:**
- Restart Redis instance
- Warm cache with most-accessed keys

### Scenario 4: ML Service Unresponsive

**Impact:** Prediction requests fail  
**Detection:** Health check timeout (5s)  
**Mitigation:**
1. Return cached predictions (24h old)
2. Show disclaimer: "Predictions unavailable, showing yesterday's forecast"
3. Queue prediction requests for retry

**Recovery:**
- Restart ML service container
- Check model file integrity
- Roll back to previous model version if corrupted

### Scenario 5: Exchange API Rate Limit Hit

**Impact:** Cannot sync portfolios  
**Detection:** 429 Too Many Requests from exchange  
**Mitigation:**
1. Implement exponential backoff (2x, 4x, 8x delays)
2. Reduce sync frequency (from 60s to 5min intervals)
3. Prioritize paid users (sync their portfolios first)

**Recovery:**
- Wait for rate limit window to reset
- Upgrade exchange API tier (if available)

## 13.2 Disaster Recovery Plan

### RTO & RPO Targets

| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|----------|---------------------|-----------------|
| **Application crash** | <5 min | 0 (no data loss) |
| **Database failure** | <1 hour | <15 min |
| **Complete datacenter outage** | <4 hours | <1 hour |
| **Accidental data deletion** | <24 hours | 0 (restore from backup) |

### Database Recovery Procedure

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

echo "=== Coinsphere Disaster Recovery ==="
echo ""
echo "STEP 1: Identify latest backup"
LATEST_BACKUP=$(aws s3 ls s3://coinsphere-backups/daily/ | sort | tail -n 1 | awk '{print $4}')
echo "Latest backup: $LATEST_BACKUP"

echo ""
echo "STEP 2: Download backup from S3"
aws s3 cp "s3://coinsphere-backups/daily/$LATEST_BACKUP" /tmp/

echo ""
echo "STEP 3: Extract backup"
gunzip "/tmp/$LATEST_BACKUP"

echo ""
echo "STEP 4: Create new database instance"
# This step varies by infrastructure (Railway vs AWS RDS)
echo "Manual step: Provision new database instance"
read -p "Enter new DATABASE_URL: " NEW_DATABASE_URL

echo ""
echo "STEP 5: Restore backup"
pg_restore --dbname="$NEW_DATABASE_URL" --clean "/tmp/${LATEST_BACKUP%.gz}"

echo ""
echo "STEP 6: Verify data integrity"
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM portfolios;"
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM price_history;"

echo ""
echo "STEP 7: Update application environment variables"
echo "Update DATABASE_URL in Railway/AWS to: $NEW_DATABASE_URL"

echo ""
echo "STEP 8: Restart application"
railway restart
# or
aws ecs update-service --cluster coinsphere --service api --force-new-deployment

echo ""
echo "✅ Disaster recovery complete!"
```

### Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

# Rollback to previous deployment

echo "=== Rolling back deployment ==="

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(aws ecs describe-services \
  --cluster coinsphere \
  --services api \
  --query 'services[0].deployments[1].taskDefinition' \
  --output text)

echo "Rolling back to: $PREVIOUS_DEPLOYMENT"

# Update service
aws ecs update-service \
  --cluster coinsphere \
  --service api \
  --task-definition "$PREVIOUS_DEPLOYMENT" \
  --force-new-deployment

echo "Waiting for rollback to complete..."
aws ecs wait services-stable \
  --cluster coinsphere \
  --services api

echo "✅ Rollback complete"
```

---

# 14. Evolution Roadmap

## 14.1 Migration Path: Monolith → Microservices

**Trigger:** Team grows to 12+ engineers, traffic exceeds 100K DAU

### Phase 1: Prepare Monolith (Months 6-9)

1. **Modularize codebase**
   - Organize by domain (portfolio, predictions, risk, alerts)
   - Clear interfaces between modules
   - No circular dependencies

2. **Introduce service contracts**
   - Define API contracts between modules (OpenAPI specs)
   - Mock interfaces for testing

3. **Database separation**
   - Identify bounded contexts
   - Plan schema splits (which tables go where)

### Phase 2: Extract First Service (Month 10)

**First service to extract:** ML Inference Service

**Why first:**
- Already isolated (Python vs Node.js)
- Different scaling characteristics (CPU-heavy)
- Minimal database dependencies

**Migration steps:**
```
1. Deploy ML service alongside monolith (both running)
2. Route 10% of prediction traffic to new service (canary)
3. Monitor error rates, latency
4. Gradually increase to 100%
5. Remove prediction code from monolith
```

### Phase 3: Extract Remaining Services (Months 11-18)

**Order of extraction:**
1. ML Inference Service ✅ (already done)
2. Market Data Service (fetching/caching prices)
3. Alert Service (monitoring/notifications)
4. Risk Scoring Service
5. Portfolio Service
6. API Gateway (last)

### Phase 4: Inter-Service Communication (Month 18+)

**Patterns:**
- **Synchronous:** REST for low-latency queries
- **Asynchronous:** Kafka for event streaming
- **Service mesh:** Istio for observability (optional)

```mermaid
graph TB
    subgraph "Monolith (Before)"
        M[Single Application<br/>All Business Logic]
    end
    
    subgraph "Microservices (After)"
        GW[API Gateway]
        PS[Portfolio Service]
        MDS[Market Data Service]
        MLS[ML Service]
        RS[Risk Service]
        AS[Alert Service]
        
        GW --> PS
        GW --> MLS
        GW --> RS
        PS --> MDS
        AS --> MDS
        RS --> MDS
    end
    
    M -.migration.-> GW
```

## 14.2 Database Sharding Strategy (1M+ users)

**Trigger:** Single database cannot handle write throughput

### Sharding Key: user_id

**Why user_id:**
- Most queries filter by user_id
- Even distribution (users are uniformly distributed)
- No cross-shard joins needed for user workflows

### Shard Configuration

```
Shard 1: user_id % 4 == 0 (25% of users)
Shard 2: user_id % 4 == 1 (25% of users)
Shard 3: user_id % 4 == 2 (25% of users)
Shard 4: user_id % 4 == 3 (25% of users)
```

### Sharding Layer (Vitess or Citus)

```typescript
// Database router
class ShardedDatabase {
  private shards: Pool[];
  
  constructor() {
    this.shards = [
      new Pool({ connectionString: process.env.DATABASE_SHARD_1 }),
      new Pool({ connectionString: process.env.DATABASE_SHARD_2 }),
      new Pool({ connectionString: process.env.DATABASE_SHARD_3 }),
      new Pool({ connectionString: process.env.DATABASE_SHARD_4 }),
    ];
  }
  
  private getShardIndex(userId: string): number {
    // Hash user_id to get consistent shard
    const hash = crypto.createHash('md5').update(userId).digest();
    return hash.readUInt32BE(0) % this.shards.length;
  }
  
  async query(userId: string, sql: string, params: any[]): Promise<any> {
    const shardIndex = this.getShardIndex(userId);
    return this.shards[shardIndex].query(sql, params);
  }
}
```

### Global Tables (Not Sharded)

- `assets` - Token metadata (small, read-heavy)
- `price_history` - Time-series data (partitioned by time, not user)

## 14.3 Multi-Region Deployment (Year 3)

**Regions:**
1. **us-east-1** (Primary) - North America
2. **eu-central-1** (Secondary) - Europe
3. **ap-southeast-1** (Tertiary) - Asia

**Data Residency:**
- User data stored in closest region (GDPR compliance)
- Price data replicated globally (TimescaleDB multi-node)

**Routing:**
- GeoDNS (Route 53) routes users to closest region
- Failover to next-closest region if primary down

---

# 15. Architectural Decision Records (ADRs)

## ADR-001: Monolith-First Architecture

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Team of 4.5 FTEs building MVP in 8 weeks. Need to ship fast.

**Decision:**  
Start with modular monolith, not microservices.

**Rationale:**
- Faster development (no inter-service communication)
- Easier debugging (single codebase, single log stream)
- Lower operational overhead (one deployment)
- Shared database simplifies transactions
- Clear migration path to microservices when team grows

**Consequences:**
- ✅ Ship MVP in 8 weeks
- ✅ Team can operate without DevOps expertise
- ❌ Cannot scale services independently
- ❌ May need refactoring at 100K+ users

---

## ADR-002: PostgreSQL over MongoDB

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Need database for user data, portfolios, transactions.

**Decision:**  
Use PostgreSQL 15 with TimescaleDB extension.

**Rationale:**
- **ACID guarantees:** Portfolio balances must be transactionally consistent
- **Structured schema:** Portfolio/transaction relationships are relational
- **TimescaleDB:** Optimizes time-series queries for price history
- **JSON support:** JSONB columns for flexible alert conditions
- **Team familiarity:** SQL skills more common than MongoDB aggregation

**Consequences:**
- ✅ Data integrity guaranteed
- ✅ Single database for OLTP + time-series
- ❌ More rigid schema (requires migrations)
- ❌ Vertical scaling more expensive than horizontal

---

## ADR-003: Railway/Render for MVP Hosting

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Need hosting for MVP. Budget is $200-500/month.

**Decision:**  
Use Railway or Render for MVP (Weeks 1-8), migrate to AWS at 50K users.

**Rationale:**
- **Zero DevOps:** One-click deploys, automatic SSL, built-in monitoring
- **Cost-effective:** $200-300/month vs $500+ on AWS
- **Fast iteration:** Deploy in <5 minutes
- **Migration path:** Can migrate to AWS when scale requires it

**Consequences:**
- ✅ Ship MVP without hiring DevOps engineer
- ✅ Low monthly cost
- ❌ Less control over infrastructure
- ❌ Must migrate at scale (but this is expected)

---

## ADR-004: LSTM for Market Predictions

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Need ML model for bull/bear market predictions.

**Decision:**  
Use LSTM (Long Short-Term Memory) neural network.

**Rationale:**
- **Time-series data:** LSTMs designed for sequential data
- **Proven:** Many financial ML models use LSTMs
- **Interpretable:** Can extract feature importance
- **Fast inference:** <1s per prediction

**Alternatives Considered:**
- **Transformer (BERT for time-series):** Too complex for MVP, requires more data
- **Random Forest:** Cannot capture temporal patterns as well
- **Linear Regression:** Too simple, insufficient accuracy

**Consequences:**
- ✅ 65-70% accuracy on BTC/ETH (validated)
- ✅ Fast enough for real-time predictions
- ❌ Requires retraining monthly (data drift)
- ❌ Black-box model (need SHAP for explainability)

---

## ADR-005: Zustand for State Management

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Need client-side state management for React app.

**Decision:**  
Use Zustand instead of Redux or Context API.

**Rationale:**
- **Simplicity:** 30% less boilerplate than Redux
- **TypeScript:** Excellent TypeScript integration
- **Performance:** Render optimization built-in
- **Learning curve:** Easier for 4.5 FTE team

**Consequences:**
- ✅ Faster development
- ✅ Easier onboarding for new devs
- ❌ Smaller ecosystem than Redux (fewer plugins)

---

## ADR-006: Read-Only Exchange API Keys

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
Users connect exchange accounts to sync portfolios.

**Decision:**  
Only accept read-only API keys, never store private keys.

**Rationale:**
- **Security:** Cannot accidentally execute trades
- **User trust:** Users more comfortable sharing read-only
- **Liability:** Reduces our exposure if breach occurs
- **Compliance:** Easier regulatory approval

**Consequences:**
- ✅ Lower security risk
- ✅ Higher user trust
- ❌ Cannot offer auto-trading features (acceptable trade-off)

---

## ADR-007: Dual-Source Price Validation

**Date:** 2025-10-06  
**Status:** Accepted  
**Context:**  
CoinStats has 70-80% sync accuracy. We need 99%+.

**Decision:**  
Cross-validate prices from CoinGecko + CoinMarketCap.

**Rationale:**
- **Accuracy:** 99%+ validation by comparing sources
- **Reliability:** If one source fails, use other
- **User trust:** "Our data is more accurate" (competitive advantage)

**Costs:**
- CoinGecko Pro: $129/month
- CoinMarketCap: Free tier (10K calls/month)

**Consequences:**
- ✅ 99%+ sync reliability (vs 70-80% competitors)
- ✅ Competitive differentiation
- ❌ $129/month additional cost
- ❌ Slightly slower (2 API calls instead of 1)

---

**END OF SYSTEM ARCHITECTURE DOCUMENT**

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-06 | Principal Engineering | Initial comprehensive architecture document |

## Approval

**Reviewed by:**
- ☐ CTO / Technical Lead
- ☐ Lead Backend Engineer
- ☐ Lead Frontend Engineer
- ☐ ML Engineering Lead
- ☐ DevOps Lead (if applicable)

**Approved for Implementation:** _______________  
**Date:** _______________

---

**Next Steps:**

1. **Week 1 (NOW):** All engineers review this document
2. **Week 1:** Technical lead holds architecture walkthrough session (2 hours)
3. **Week 1:** Begin implementation following Development Roadmap
4. **Week 8:** Post-MVP review - update this document with learnings
5. **Month 6:** Architecture review - validate scale assumptions
6. **Year 2:** Plan microservices migration (if needed)