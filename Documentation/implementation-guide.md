# Implementation Guide
## Coinsphere - Getting Started

**Version:** 1.0  
**Date:** October 6, 2025  
**Timeline:** 8 Weeks to MVP Launch  
**Team Size:** 4.5 FTEs

---

## Document Purpose

This guide provides **step-by-step instructions** for implementing the Coinsphere Analytics platform. Use this as your daily reference during the 8-week MVP build.

**Related Documents:**
- [System Architecture Document](SYSTEM_ARCHITECTURE.md) - Technical blueprint
- [Development Roadmap](Development%20Roadmap%20Sprint%20Plan.md) - Week-by-week plan
- [Product Strategy](PRODUCT_STRATEGY.md) - Business requirements

---

## Table of Contents

1. [Pre-Implementation Checklist](#1-pre-implementation-checklist)
2. [Week 1: Foundation Setup](#2-week-1-foundation-setup)
3. [Week 2-4: Core Development](#3-week-2-4-core-development)
4. [Week 5-7: Integration & Polish](#4-week-5-7-integration--polish)
5. [Week 8: Testing & Launch](#5-week-8-testing--launch)
6. [Team Structure & Responsibilities](#6-team-structure--responsibilities)
7. [Development Workflow](#7-development-workflow)
8. [Critical Path Items](#8-critical-path-items)
9. [Troubleshooting Guide](#9-troubleshooting-guide)
10. [Success Criteria](#10-success-criteria)

---

# 1. Pre-Implementation Checklist

## Before You Start Coding

### 1.1 Team Alignment (Day 1 Morning)

**Duration:** 2 hours  
**Attendees:** All 4.5 FTEs + Stakeholders

**Agenda:**
- [ ] Review System Architecture Document (Section 1-3: Overview & Principles)
- [ ] Confirm 8-week timeline is realistic
- [ ] Assign roles and responsibilities
- [ ] Set up communication channels
- [ ] Agree on working hours and daily standup time

**Deliverables:**
- [ ] Signed approval on architecture document
- [ ] Team roster with roles
- [ ] Slack channels created (#dev, #deploys, #incidents)
- [ ] Calendar invites for daily standups (15 min, 10am)

### 1.2 Access & Accounts (Day 1 Afternoon)

**Duration:** 2-3 hours  
**Responsible:** Technical Lead

**Required Accounts:**
- [ ] GitHub Organization created
- [ ] Railway or Render account (staging + production)
- [ ] Vercel account (frontend hosting)
- [ ] CoinGecko Pro API key ($129/mo)
- [ ] LunarCrush API key ($24/mo)
- [ ] Domain purchased (coinsphere.app or similar)
- [ ] Cloudflare account (DNS + CDN)
- [ ] Sentry account (error tracking)
- [ ] Slack workspace

**Team Access:**
- [ ] Add all developers to GitHub org
- [ ] Grant Railway/Render deployment access
- [ ] Share API keys via secure channel (1Password/LastPass)
- [ ] Add to Slack channels

### 1.3 Development Tools (Day 1 Afternoon)

**Duration:** 1-2 hours  
**Responsible:** Each developer individually

**Required Software:**
```bash
# Install on macOS
brew install node@20          # Node.js 20 LTS
brew install python@3.11      # Python 3.11
brew install postgresql@15    # PostgreSQL
brew install redis            # Redis
brew install docker           # Docker Desktop
brew install git              # Git

# Install on Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm python3.11 postgresql-15 redis docker.io git

# Install on Windows
# Download installers from official websites or use WSL2
```

**IDE Setup:**
- [ ] VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript + JavaScript Language Features
  - Python
  - GitLens
  - Docker
  - Thunder Client (API testing)
- [ ] Configure Prettier (format on save)
- [ ] Configure ESLint rules

**Recommended VS Code Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "rangav.vscode-thunder-client"
  ]
}
```

### 1.4 Repository Setup (Day 1 Evening)

**Duration:** 1 hour  
**Responsible:** Technical Lead

**Create Repository Structure:**
```bash
# Create GitHub repository
gh repo create coinsphere-analytics --private --clone

cd coinsphere-analytics

# Initialize monorepo structure
mkdir -p {backend,frontend,ml_service,mobile,docs,scripts}

# Initialize package.json (root)
npm init -y

# Create README
cat > README.md << 'EOF'
# Coinsphere Analytics

AI-powered crypto portfolio tracking and prediction platform.

## Quick Start
See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)

## Architecture
See [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
*.log
dist/
build/
.DS_Store
__pycache__/
*.pyc
.vscode/
.idea/
EOF

# Initial commit
git add .
git commit -m "chore: initialize repository structure"
git push origin main
```

**Branch Protection Rules:**
- [ ] Enable on `main` branch
- [ ] Require pull request reviews (1 approver)
- [ ] Require status checks to pass (CI tests)
- [ ] No force pushes allowed

---

# 2. Week 1: Foundation Setup

## Day 1: Environment Setup

### Morning (4 hours)
**Goal:** Get local development environment running

**Tasks:**

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/coinsphere-analytics.git
cd coinsphere-analytics
```

#### 2. Backend Setup
```bash
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors helmet compression
npm install dotenv bcryptjs jsonwebtoken
npm install pg redis ioredis
npm install zod winston

# Dev dependencies
npm install -D typescript @types/node @types/express
npm install -D ts-node nodemon
npm install -D eslint prettier
npm install -D jest @types/jest ts-jest

# Initialize TypeScript
npx tsc --init

# Update tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create folder structure
mkdir -p src/{config,middleware,modules,services,utils,database}
mkdir -p src/modules/{auth,portfolio,predictions,risk,alerts}
```

#### 3. Frontend Setup
```bash
cd ../frontend

# Create React app with TypeScript
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install additional dependencies
npm install axios zustand
npm install @tanstack/react-query
npm install recharts
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react
npm install zod

# Create folder structure
mkdir -p components/{ui,features,layouts}
mkdir -p lib/{api,hooks,store,utils}
mkdir -p types
```

#### 4. ML Service Setup
```bash
cd ../ml_service

# Create Python virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn
pip install torch torchvision
pip install pandas numpy scikit-learn
pip install redis python-dotenv
pip install pydantic

# Create requirements.txt
pip freeze > requirements.txt

# Create folder structure
mkdir -p {models,features,services,utils}
```

#### 5. Docker Compose Setup
```bash
cd ..

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: coinsphere-db
    environment:
      POSTGRES_DB: coinsphere_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: coinsphere-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

# Start services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Afternoon (4 hours)
**Goal:** Database schema and basic API

#### 6. Database Setup
```bash
cd backend

# Create database migration files
mkdir -p src/database/migrations

# Create initial schema
cat > src/database/migrations/001_initial_schema.sql << 'EOF'
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro', 'power')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

-- Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_default BOOLEAN DEFAULT FALSE,
  sync_enabled BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  coingecko_id VARCHAR(100),
  category VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_symbol ON assets(symbol);

-- Price history (TimescaleDB hypertable)
CREATE TABLE price_history (
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price DECIMAL(36, 18) NOT NULL,
  volume_24h DECIMAL(36, 2),
  market_cap DECIMAL(36, 2),
  source VARCHAR(50) NOT NULL
);

SELECT create_hypertable('price_history', 'time');
CREATE INDEX idx_price_symbol_time ON price_history(symbol, time DESC);

-- Seed some initial assets
INSERT INTO assets (symbol, name, coingecko_id, category) VALUES
  ('BTC', 'Bitcoin', 'bitcoin', 'bitcoin'),
  ('ETH', 'Ethereum', 'ethereum', 'ethereum'),
  ('SOL', 'Solana', 'solana', 'layer1'),
  ('USDT', 'Tether', 'tether', 'stablecoin'),
  ('BNB', 'BNB', 'binancecoin', 'exchange');
EOF

# Run migration
psql postgresql://postgres:postgres@localhost:5432/coinsphere_dev \
  -f src/database/migrations/001_initial_schema.sql
```

#### 7. Create Basic API
```bash
# Create config files
cat > src/config/database.ts << 'EOF'
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coinsphere_dev',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
EOF

cat > src/config/redis.ts << 'EOF'
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

export default redis;
EOF

# Create server.ts
cat > src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'coinsphere-api'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Update package.json scripts
cat > package.json << 'EOF'
{
  "name": "coinsphere-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  }
}
EOF

# Create .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coinsphere_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
EOF

# Start development server
npm run dev

# Test in another terminal
curl http://localhost:3001/health
```

### Success Criteria (Day 1)
- [ ] All developers have local environment running
- [ ] Docker containers (Postgres + Redis) are healthy
- [ ] Backend server responds to /health endpoint
- [ ] Frontend dev server runs without errors
- [ ] Database schema is created and seeded

---

## Day 2-3: Core Authentication

### Authentication Implementation

**Files to Create:**

#### 1. Auth Module
```bash
cd backend/src/modules/auth

# Create auth types
cat > auth.types.ts << 'EOF'
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    tier: string;
  };
  accessToken: string;
  refreshToken: string;
}
EOF

# Create auth service
cat > auth.service.ts << 'EOF'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/database';
import { redis } from '../../config/redis';

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthService {
  async register(email: string, password: string) {
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, tier',
      [email, passwordHash]
    );
    
    const user = result.rows[0];
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return { user, ...tokens };
  }
  
  async login(email: string, password: string) {
    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, tier FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Generate tokens
    const tokens = this.generateTokens(user);
    
    return { 
      user: {
        id: user.id,
        email: user.email,
        tier: user.tier
      }, 
      ...tokens 
    };
  }
  
  private generateTokens(user: any) {
    const payload = {
      userId: user.id,
      email: user.email,
      tier: user.tier
    };
    
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });
    
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });
    
    // Store refresh token in Redis
    redis.setex(
      `refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );
    
    return { accessToken, refreshToken };
  }
}
EOF

# Create auth controller
cat > auth.controller.ts << 'EOF'
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class AuthController {
  private authService = new AuthService();
  
  register = async (req: Request, res: Response) => {
    try {
      const { email, password } = registerSchema.parse(req.body);
      const result = await this.authService.register(email, password);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
}
EOF

# Create auth routes
cat > auth.routes.ts << 'EOF'
import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
EOF
```

#### 2. Update server.ts
```typescript
// Add to server.ts
import authRoutes from './modules/auth/auth.routes';

app.use('/api/auth', authRoutes);
```

#### 3. Test Authentication
```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

### Success Criteria (Day 2-3)
- [ ] Users can register
- [ ] Users can login and receive JWT
- [ ] Passwords are hashed with bcrypt
- [ ] Refresh tokens stored in Redis
- [ ] Basic validation works (Zod)

---

## Day 4-5: CI/CD Pipeline

### GitHub Actions Setup

**Create workflow file:**

```bash
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOF'
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: timescale/timescaledb:latest-pg15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
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
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
  
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
EOF

# Commit and push
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline"
git push
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Deploy backend
cd backend
railway up

# Deploy frontend (use Vercel instead)
cd ../frontend
npx vercel --prod
```

### Success Criteria (Day 4-5)
- [ ] CI pipeline runs on every push
- [ ] Tests pass in CI
- [ ] Backend deploys to Railway
- [ ] Frontend deploys to Vercel
- [ ] Environment variables configured

---

# 3. Week 2-4: Core Development

## Week 2: Portfolio Service

**Owner:** Backend Developer  
**Duration:** 5 days

### Tasks:
1. **Exchange Integration Framework**
   - [ ] Create BaseExchangeClient interface
   - [ ] Implement Binance client
   - [ ] Implement Coinbase client
   - [ ] Add 3 more exchanges (Kraken, Bybit, OKX)

2. **Portfolio CRUD**
   - [ ] Create portfolio endpoint
   - [ ] List portfolios endpoint
   - [ ] Update portfolio endpoint
   - [ ] Delete portfolio endpoint

3. **Portfolio Sync**
   - [ ] Connect exchange API
   - [ ] Fetch balances
   - [ ] Store holdings in database
   - [ ] Calculate portfolio value

4. **Testing**
   - [ ] Unit tests for each exchange client
   - [ ] Integration tests for portfolio sync
   - [ ] Error handling tests

**Reference:** Architecture Doc Section 5 & 8

---

## Week 3: Market Data & ML Service

### Part A: Data Sync Service (2.5 days)
**Owner:** Backend Developer

**Tasks:**
- [ ] Integrate CoinGecko API
- [ ] Create price fetching job (Celery/Bull)
- [ ] Store prices in TimescaleDB
- [ ] Implement caching layer (Redis)
- [ ] Dual-source validation logic

### Part B: ML Service (2.5 days)
**Owner:** Data Scientist/ML Engineer

**Tasks:**
- [ ] Set up FastAPI service
- [ ] Create prediction endpoint
- [ ] Load pre-trained LSTM model
- [ ] Implement feature engineering
- [ ] Test inference speed (<2s per prediction)

**Reference:** Architecture Doc Section 7

---

## Week 4: Risk Scoring & Alerts

### Part A: Risk Scoring (2 days)
**Owner:** Backend Developer + ML Engineer

**Tasks:**
- [ ] Implement risk scoring algorithm
- [ ] Create risk calculation endpoint
- [ ] Store risk scores in TimescaleDB
- [ ] Test accuracy on known assets

### Part B: Alert System (3 days)
**Owner:** Backend Developer

**Tasks:**
- [ ] Create alert CRUD endpoints
- [ ] Implement alert monitoring job
- [ ] WebSocket for real-time notifications
- [ ] Test alert triggering

**Reference:** Architecture Doc Section 5.5 & 12

---

# 4. Week 5-7: Integration & Polish

## Week 5: Frontend Development

**Owner:** Frontend Developer  
**Duration:** 5 days

### Tasks:
1. **Dashboard Page**
   - [ ] Portfolio overview card
   - [ ] Asset allocation chart
   - [ ] Recent transactions list
   - [ ] Total value display

2. **Predictions Page**
   - [ ] Prediction cards (BTC, ETH)
   - [ ] Confidence indicators
   - [ ] Transparency panel (show key factors)
   - [ ] Historical accuracy chart

3. **Risk Scoring Page**
   - [ ] Risk score display (0-100)
   - [ ] Risk factor breakdown
   - [ ] Portfolio risk summary

4. **Authentication UI**
   - [ ] Login page
   - [ ] Register page
   - [ ] Password reset (basic)

**Reference:** Architecture Doc Section 4

---

## Week 6: Mobile App (React Native)

**Owner:** Mobile Developer (or split with Frontend Dev)  
**Duration:** 5 days

### Tasks:
- [ ] Set up React Native project
- [ ] Implement navigation (React Navigation)
- [ ] Share API client with web
- [ ] Build key screens (Dashboard, Portfolio, Predictions)
- [ ] Test on iOS and Android simulators

**Note:** If time is tight, defer mobile to Week 9-10 post-MVP

---

## Week 7: Integration Testing & Bug Fixes

**Owner:** Full Team  
**Duration:** 5 days

### Tasks:
- [ ] End-to-end testing (Playwright/Cypress)
- [ ] Load testing (Locust - simulate 1000 users)
- [ ] Fix all critical bugs
- [ ] Performance optimization
- [ ] Security audit (basic)

---

# 5. Week 8: Testing & Launch

## Day 1-2: Beta Testing

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Invite 20 beta testers
- [ ] Monitor error logs (Sentry)
- [ ] Gather feedback (Google Form)

## Day 3-4: Final Fixes & Optimization

**Tasks:**
- [ ] Fix beta tester issues
- [ ] Optimize slow queries
- [ ] Reduce bundle size
- [ ] Add loading states

## Day 5: Production Launch

**Launch Checklist:**
- [ ] Database backed up
- [ ] Environment variables set
- [ ] Monitoring enabled (Sentry, CloudWatch)
- [ ] Deploy to production
- [ ] Smoke tests pass
- [ ] Announce on Twitter/Reddit

---

# 6. Team Structure & Responsibilities

## Core Team (4.5 FTEs)

### Role 1: Full-Stack Developer (1.0 FTE)
**Primary:** Frontend + API Integration  
**Responsibilities:**
- React frontend development
- API client implementation
- State management (Zustand)
- UI/UX implementation

**Key Deliverables:**
- Dashboard, Predictions, Risk pages
- Authentication UI
- Charts and visualizations

---

### Role 2: Backend Developer (1.0 FTE)
**Primary:** API + Database + Integrations  
**Responsibilities:**
- Express API development
- Database schema design
- Exchange API integrations
- Portfolio sync logic

**Key Deliverables:**
- Auth endpoints
- Portfolio CRUD
- Exchange clients (20+ integrations)
- Data sync jobs

---

### Role 3: Data Scientist / ML Engineer (1.0 FTE)
**Primary:** ML Models + Risk Scoring  
**Responsibilities:**
- LSTM model training
- FastAPI ML service
- Feature engineering
- Risk scoring algorithm

**Key Deliverables:**
- Market prediction model (65%+ accuracy)
- ML inference API
- Risk scoring system
- Model monitoring

---

### Role 4: Blockchain Developer (0.5 FTE, Part-time)
**Primary:** Exchange Integrations + Wallet Connections  
**Responsibilities:**
- Exchange API clients
- Wallet address tracking
- On-chain data integration (The Graph)
- Smart contract analysis (for risk scoring)

**Key Deliverables:**
- 20+ exchange integrations
- Wallet connection feature
- On-chain data fetching

---

### Role 5: Product Manager / Designer (0.5 FTE, Part-time)
**Primary:** Product Decisions + UI/UX  
**Responsibilities:**
- Feature prioritization
- UI/UX design (Figma)
- User testing coordination
- Product documentation

**Key Deliverables:**
- Figma designs for all screens
- Product requirements clarification
- Beta testing coordination
- Launch planning

---

# 7. Development Workflow

## Daily Routine

### 10:00 AM - Daily Standup (15 min)
**Format:**
- What did I do yesterday?
- What will I do today?
- Any blockers?

**Location:** Slack #dev or Zoom

---

### Work Blocks
**10:15 AM - 12:30 PM:** Deep work (no meetings)  
**12:30 PM - 1:30 PM:** Lunch  
**1:30 PM - 3:30 PM:** Deep work  
**3:30 PM - 4:00 PM:** Code reviews + collaboration  
**4:00 PM - 6:00 PM:** Deep work or meetings

---

### Friday 2:00 PM - Sprint Review (1 hour)
**Agenda:**
- Demo completed features
- Review progress vs roadmap
- Plan next week's work
- Retrospective (what went well, what to improve)

---

## Git Workflow

### Branch Naming
```
feature/portfolio-sync
bugfix/login-validation
hotfix/critical-api-error
```

### Commit Messages
```
feat: add portfolio sync endpoint
fix: resolve login validation bug
chore: update dependencies
docs: add API documentation
test: add unit tests for auth service
```

### Pull Request Process
1. Create feature branch from `main`
2. Commit changes with descriptive messages
3. Push to GitHub
4. Create PR with description:
   - What changed?
   - Why?
   - How to test?
4. Request review from 1 team member
5. Address feedback
6. Merge when approved + CI passes

---

## Code Review Guidelines

**What to Check:**
- [ ] Code works as intended
- [ ] No obvious bugs
- [ ] Follows coding standards (ESLint/Prettier)
- [ ] Has tests (if applicable)
- [ ] No security vulnerabilities
- [ ] Performance concerns addressed

**Response Time:** Within 4 hours

---

# 8. Critical Path Items

## Must-Have for MVP (Week 8 Launch)

### P0 (Showstoppers - Cannot launch without)
- [ ] User registration and login
- [ ] Portfolio tracking (at least 5 exchanges)
- [ ] Real-time price data
- [ ] Basic predictions (BTC/ETH)
- [ ] Risk scoring
- [ ] Dashboard UI

### P1 (Important - Launch degraded without)
- [ ] 20+ exchange integrations
- [ ] Predictions for 50+ assets
- [ ] Mobile app (can defer to Week 9)
- [ ] Alert system

### P2 (Nice-to-have - Can add post-launch)
- [ ] Advanced charts
- [ ] Historical prediction accuracy
- [ ] Social sharing
- [ ] Referral program

---

# 9. Troubleshooting Guide

## Common Issues

### Issue 1: Database Connection Fails

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

---

### Issue 2: Redis Connection Fails

**Symptoms:**
```
Error: Redis connection to localhost:6379 failed
```

**Solution:**
```bash
# Restart Redis
docker-compose restart redis

# Test connection
redis-cli ping  # Should return PONG
```

---

### Issue 3: CI Pipeline Fails

**Symptoms:**
```
Tests fail in GitHub Actions but pass locally
```

**Solution:**
```bash
# Run tests with same environment as CI
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test npm test

# Check .env files are not committed
git status --ignored

# Ensure test database is created
psql -U postgres -c "CREATE DATABASE test;"
```

---

### Issue 4: Module Not Found Errors

**Symptoms:**
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check package.json has correct dependencies
```

---

## Getting Help

**Internal:**
- Slack #dev channel
- Tag @technical-lead for urgent issues

**External:**
- Check System Architecture Document
- Review relevant code examples in architecture doc
- Stack Overflow (tag questions appropriately)

---

# 10. Success Criteria

## Week 1 ✅
- [ ] All developers can run app locally
- [ ] Database schema created
- [ ] Basic API responds to /health
- [ ] CI pipeline works

## Week 4 ✅ (Checkpoint)
- [ ] Authentication works
- [ ] Portfolio sync works (5+ exchanges)
- [ ] Predictions API works
- [ ] Risk scoring API works

## Week 8 ✅ (MVP Launch)
- [ ] 20+ exchange integrations
- [ ] Dashboard shows portfolio
- [ ] Predictions display correctly
- [ ] Risk scores calculated
- [ ] 20 beta users tested successfully
- [ ] <5 critical bugs
- [ ] Production deployment successful

---

# Appendix A: Quick Reference Commands

## Development
```bash
# Start all services
docker-compose up -d

# Backend dev server
cd backend && npm run dev

# Frontend dev server
cd frontend && npm run dev

# ML service dev server
cd ml_service && uvicorn main:app --reload

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Database
```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/coinsphere_dev

# Run migration
psql <database-url> -f src/database/migrations/001_initial_schema.sql

# Backup database
pg_dump <database-url> > backup.sql

# Restore database
psql <database-url> < backup.sql
```

## Deployment
```bash
# Deploy to Railway
railway up

# Deploy frontend to Vercel
vercel --prod

# Check deployment status
railway status
vercel ls
```

---

# Appendix B: Resources & Links

## Documentation
- [System Architecture](SYSTEM_ARCHITECTURE.md)
- [Development Roadmap](Development%20Roadmap%20Sprint%20Plan.md)
- [Product Strategy](PRODUCT_STRATEGY.md)
- [Financial Model](FINANCIAL_MODEL.md)

## External Resources
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [TimescaleDB Docs](https://docs.timescale.com/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [PyTorch Docs](https://pytorch.org/docs/)

## APIs
- [CoinGecko API](https://www.coingecko.com/en/api)
- [LunarCrush API](https://lunarcrush.com/developers/api)
- [Binance API](https://binance-docs.github.io/apidocs/)
- [Coinbase API](https://developers.coinbase.com/)

---

## Contact

**Questions?** Ask in Slack #dev  
**Urgent Issues?** Tag @technical-lead  
**Product Questions?** Tag @product-manager

---

**Last Updated:** October 6, 2025  
**Next Review:** Week 4 (Mid-Sprint Checkpoint)

---

**LET'S BUILD! 🚀**