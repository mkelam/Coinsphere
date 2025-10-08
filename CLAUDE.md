# CLAUDE.md - Coinsphere Project

This file provides guidance to Claude Code (claude.ai/code) when working with the Coinsphere codebase.

## Project Overview

**Project Name:** Coinsphere
**Domain:** coinsphere.app
**Description:** AI-powered crypto portfolio tracker with market predictions and risk scoring
**Status:** Pre-Development (Sprint 1 starting)
**Repository:** https://github.com/coinsphere/coinsphere

---

## Tech Stack

### Frontend
- **Framework:** React 18.2.0
- **Language:** TypeScript 5.3
- **Build Tool:** Vite 5.0.8
- **UI Framework:** Tailwind CSS 3.4.18
- **Component Library:** Shadcn/ui (New York style)
- **State Management:**
  - React Query (TanStack Query 5.12.0) - Server state
  - Zustand 4.4.7 - Client state
- **Forms:** React Hook Form 7.48.2 + Zod 3.22.4
- **Charts:** Recharts 2.10.3
- **Icons:** Lucide React 0.294.0

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5.3
- **ORM:** Prisma 5.7.0
- **Authentication:** JWT (RS256) with jsonwebtoken 9.0.2
- **Validation:** Zod 3.22.4
- **Cache:** ioredis 5.3.2
- **Jobs:** Bull 4.12.0
- **API Clients:** CCXT 4.2.0, Axios 1.6.2

### ML Service
- **Language:** Python 3.11
- **Framework:** FastAPI
- **ML Library:** PyTorch 2.1
- **Data Processing:** pandas, numpy
- **Experiment Tracking:** MLflow
- **Database:** SQLAlchemy (for PostgreSQL)

### Database & Infrastructure
- **Primary Database:** PostgreSQL 15
- **Time-Series Extension:** TimescaleDB (latest)
- **Cache:** Redis 7-alpine
- **Containers:** Docker + Docker Compose
- **Cloud:** AWS (ECS, RDS, ElastiCache, S3)
- **CI/CD:** GitHub Actions

---

## Development Environment

### Required Tools
- **Node.js:** v20 LTS (not v22 - see alignment report)
- **npm:** 10.9.2+
- **Python:** 3.11+
- **Docker Desktop:** Latest
- **Git:** 2.49.0+
- **IDE:** VS Code 1.100.0+ or Windsurf 1.8.2+

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/coinsphere/coinsphere.git
cd coinsphere
```

#### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

#### 3. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env
```

#### 4. Start Development Environment
```bash
# From project root
docker-compose up

# Or use npm script
npm run dev
```

---

## Port Configuration

**IMPORTANT:** These ports are standardized across all documentation.

| Service | Port | URL |
|---------|------|-----|
| **Frontend** | 5173 | http://localhost:5173 |
| **Backend API** | 3001 | http://localhost:3001 |
| **ML Service** | 8000 | http://localhost:8000 |
| **PostgreSQL** | 5432 | localhost:5432 |
| **Redis** | 6379 | localhost:6379 |
| **Adminer** | 8080 | http://localhost:8080 |

### API Endpoints
- **Base URL (Dev):** http://localhost:3001/api/v1
- **WebSocket (Dev):** ws://localhost:3001/api/v1/ws
- **Base URL (Prod):** https://api.coinsphere.app/v1
- **WebSocket (Prod):** wss://api.coinsphere.app/v1/ws

---

## Database Configuration

### Development Database
- **Name:** coinsphere_dev
- **User:** coinsphere
- **Password:** postgres (dev only - see .env.example)
- **Host:** localhost
- **Port:** 5432

### Connection String
```
DATABASE_URL=postgresql://coinsphere:postgres@localhost:5432/coinsphere_dev
```

### Key Tables
- `users` - User accounts and profiles
- `portfolios` - User portfolio holdings
- `tokens` - Crypto asset metadata
- `alerts` - Price and risk alerts
- `price_data` (hypertable) - OHLCV time-series data
- `metrics` (hypertable) - On-chain metrics data

---

## Project Structure

```
coinsphere/
├── Documentation/              # 33 comprehensive docs (strategy, technical, operations)
│   ├── PRODUCT_STRATEGY.md
│   ├── System Architecture Document.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   └── Development Roadmap Sprint Plan.md
├── frontend/                   # React + TypeScript web app
│   ├── src/
│   │   ├── components/        # Shadcn/ui components + custom
│   │   │   ├── ui/           # 13 Shadcn components
│   │   │   └── *.tsx         # 5 custom crypto components
│   │   ├── pages/            # 7 route pages
│   │   ├── lib/              # Utilities (utils.ts)
│   │   └── main.tsx          # Entry point
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── components.json       # Shadcn config
├── backend/                   # Node.js + Express API
│   ├── src/
│   │   ├── server.ts         # Express server
│   │   ├── routes/           # API routes
│   │   ├── controllers/      # Business logic
│   │   ├── services/         # External API integrations
│   │   ├── middleware/       # Auth, validation, error handling
│   │   └── utils/            # Helper functions
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── package.json
│   └── tsconfig.json
├── ml-service/                # Python + FastAPI ML service
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── models/           # ML model definitions
│   │   ├── training/         # Training scripts
│   │   └── prediction/       # Prediction endpoints
│   ├── requirements.txt
│   └── .env.example
├── docker-compose.yml         # Local dev environment
├── package.json               # Root workspace
├── README.md
├── LICENSE (MIT)
└── CLAUDE.md (this file)
```

---

## Common Development Commands

### Frontend (React + Vite)
```bash
cd frontend

npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
```

### Backend (Node.js + Express)
```bash
cd backend

npm run dev          # Start dev server with hot reload (port 3001)
npm run build        # Compile TypeScript
npm start            # Start production server
npm run typecheck    # Check types
npm test             # Run tests
npm run migrate      # Run Prisma migrations
npm run seed         # Seed database
```

### ML Service (Python + FastAPI)
```bash
cd ml-service

uvicorn app.main:app --reload --port 8000  # Start dev server
python -m pytest                           # Run tests
```

### Docker Commands
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild containers
docker-compose build

# View logs
docker-compose logs -f [service-name]
```

---

## Key Documentation Files

### Must Read Before Coding
1. **[Development Roadmap Sprint Plan.md](Documentation/Development Roadmap Sprint Plan.md)** - 8-week MVP timeline
2. **[System Architecture Document.md](Documentation/System Architecture Document.md)** - Full tech architecture
3. **[DATABASE_SCHEMA.md](Documentation/DATABASE_SCHEMA.md)** - Database design
4. **[API_SPECIFICATION.md](Documentation/API_SPECIFICATION.md)** - API endpoints & contracts
5. **[implementation-guide.md](Documentation/implementation-guide.md)** - Setup instructions

### Reference Documentation
- **[PRODUCT_STRATEGY.md](Documentation/PRODUCT_STRATEGY.md)** - Product vision & strategy
- **[CODE_STYLE_GUIDE.md](Documentation/CODE_STYLE_GUIDE.md)** - Coding standards
- **[TESTING_STRATEGY.md](Documentation/TESTING_STRATEGY.md)** - Testing approach
- **[COMPREHENSIVE_ALIGNMENT_REPORT.md](COMPREHENSIVE_ALIGNMENT_REPORT.md)** - 98% alignment audit

---

## Coding Standards

### TypeScript/React
- **Style Guide:** Airbnb + Prettier
- **File Naming:** kebab-case for files, PascalCase for components
- **Component Pattern:** Functional components with hooks
- **State Management:** React Query for server state, Zustand for client state
- **Styling:** Tailwind CSS utility classes + Shadcn/ui components
- **Forms:** React Hook Form + Zod validation

### Code Organization
```typescript
// Component structure
import statements
type/interface definitions
component function
hooks
event handlers
render JSX

// Example
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  name: string;
}

export function MyComponent({ name }: Props) {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
  };

  return (
    <div>
      <Button onClick={handleClick}>{name}: {count}</Button>
    </div>
  );
}
```

### API Routes (Backend)
- **Pattern:** `/api/v1/{resource}`
- **Authentication:** JWT Bearer token required (except auth routes)
- **Validation:** Zod schemas for request/response
- **Error Handling:** Centralized error middleware

### Database (Prisma)
- **Naming:** snake_case for tables/columns
- **Migrations:** `npm run migrate` creates migration files
- **Seeding:** `npm run seed` populates dev data

---

## Testing Guidelines

### Frontend Testing (Vitest + Testing Library)
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent name="Test" />);
  expect(screen.getByText(/Test/i)).toBeInTheDocument();
});
```

### Backend Testing (Vitest + Supertest)
```typescript
// API test example
import request from 'supertest';
import app from '../src/server';

test('GET /api/v1/health returns 200', async () => {
  const response = await request(app).get('/api/v1/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});
```

### Running Tests
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test

# ML Service
cd ml-service && pytest

# All tests
npm test  # From root
```

---

## Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation
- `refactor/component-name` - Refactoring
- `test/test-description` - Test additions

### Commit Convention (Conventional Commits)
```
type(scope): description

feat(auth): add JWT authentication
fix(api): resolve CORS issue on /predictions endpoint
docs(readme): update setup instructions
refactor(components): extract reusable Button component
test(auth): add unit tests for login flow
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code formatting
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Build/tooling changes

---

## Environment Variables

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001/api/v1/ws
VITE_APP_NAME=Coinsphere
VITE_APP_VERSION=0.1.0
```

### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://coinsphere:postgres@localhost:5432/coinsphere_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=3600
COINGECKO_API_KEY=your-api-key
```

### ML Service (.env)
```bash
DATABASE_URL=postgresql://coinsphere:postgres@localhost:5432/coinsphere_dev
MODEL_VERSION=v1.0.0
TRAINING_BATCH_SIZE=32
MLFLOW_TRACKING_URI=http://localhost:5000
```

---

## External APIs & Services

### Required for MVP
- **CoinGecko Pro** - $129/month (500 calls/min) - Price data
- **Stripe** - 2.9% + $0.30/transaction - Payments
- **SendGrid** - $15/month - Transactional emails

### Optional for MVP
- **LunarCrush Pro** - $199/month - Social sentiment (Month 2+)
- **CryptoCompare** - Backup price data source

### API Keys Setup
1. Sign up for each service
2. Add API keys to `.env` files
3. Never commit `.env` files (in .gitignore)
4. Production: Use AWS Secrets Manager

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
npx kill-port 3001  # or 5173, 8000

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d postgres
cd backend && npm run migrate
```

### TypeScript Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .next
npm install
npm run build
```

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

---

## Quick Reference

### Project Metrics (Year 1 Targets)
- **Users:** 50,000
- **Paid Users:** 2,150 (4.3% conversion)
- **ARR:** $420,000
- **MRR (exit):** $28K-35K
- **Timeline:** 8-week MVP

### Pricing Tiers
- **Free:** $0/month
- **Plus:** $9.99/month
- **Pro:** $19.99/month
- **Power Trader:** $49.99/month

### Core Features (MVP)
1. Portfolio Tracking (20+ exchanges)
2. AI Price Predictions (LSTM models)
3. Degen Risk Scores (0-100)
4. Real-time Alerts (price + risk)

### What We're NOT Building (MVP)
- ❌ Institutional features
- ❌ Tax reporting
- ❌ TradFi integration
- ❌ White-label solutions

---

## Contact & Resources

### Documentation
- **Full Docs:** `/Documentation` folder (33 files)
- **API Docs:** http://localhost:3001/docs (Swagger UI)
- **Alignment Report:** [COMPREHENSIVE_ALIGNMENT_REPORT.md](COMPREHENSIVE_ALIGNMENT_REPORT.md)

### External Resources
- **React Docs:** https://react.dev
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Prisma Docs:** https://www.prisma.io/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com

### Support Channels
- **GitHub Issues:** https://github.com/coinsphere/coinsphere/issues
- **Team Slack:** #coinsphere-dev
- **Weekly Standups:** Mondays 10am

---

## Important Notes for Claude Code

### When Working on Coinsphere:

1. **Always use "Coinsphere"** (not CryptoSense or CoinStats)
2. **Backend API port is 3001** (not 3000)
3. **WebSocket URL includes /api/v1 prefix:** `ws://localhost:3001/api/v1/ws`
4. **Node.js version is 20 LTS** (not 22)
5. **Database name is coinsphere_dev** (not cryptosense_dev)
6. **All service names use coinsphere-* prefix**
7. **Refer to COMPREHENSIVE_ALIGNMENT_REPORT.md** for latest alignment status

### Before Making Changes:
- ✅ Check relevant documentation in `/Documentation` folder
- ✅ Review [System Architecture Document.md](Documentation/System Architecture Document.md) for architecture decisions
- ✅ Follow coding standards in [CODE_STYLE_GUIDE.md](Documentation/CODE_STYLE_GUIDE.md)
- ✅ Add tests for new features
- ✅ Update documentation if changing APIs or architecture

### Alignment Status
**Last Updated:** October 7, 2025
**Alignment Score:** 98% ✅
**Status:** Production-ready, Sprint 1 starting

---

**Happy Coding! 🚀**

Built with ❤️ by the Coinsphere team
