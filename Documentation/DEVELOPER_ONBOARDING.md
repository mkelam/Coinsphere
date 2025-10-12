# Developer Onboarding Guide - Coinsphere

**Document Version**: 1.0
**Date**: October 7, 2025
**Estimated Setup Time**: 2-3 hours
**Target Audience**: New developers joining the team

---

## Table of Contents

1. [Welcome](#welcome)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Development Workflow](#development-workflow)
8. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
9. [Next Steps](#next-steps)

---

## 1. Welcome

Welcome to the Coinsphere team! 🎉

**What We're Building:**
An AI-powered crypto portfolio tracker with market predictions and risk scoring for active traders.

**Core Tech Stack:**
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Node.js 20 + Express.js
- **ML Service**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15 + TimescaleDB + Redis 7
- **Infrastructure**: Docker, AWS (production)

---

## 2. Prerequisites

### 2.1 Required Software

Before you start, ensure you have these installed:

| Software | Version | Download Link | Verification Command |
|----------|---------|---------------|---------------------|
| **Node.js** | 20.x LTS | https://nodejs.org | `node --version` |
| **npm** | 10.x | (comes with Node.js) | `npm --version` |
| **Python** | 3.11.x | https://python.org | `python --version` |
| **PostgreSQL** | 15.x | https://postgresql.org | `psql --version` |
| **Redis** | 7.x | https://redis.io | `redis-cli --version` |
| **Docker** | Latest | https://docker.com | `docker --version` |
| **Git** | Latest | https://git-scm.com | `git --version` |

**Optional (Recommended)**:
- **VS Code** with extensions: ESLint, Prettier, Python, PostgreSQL
- **TablePlus** or **pgAdmin** (database GUI)
- **Postman** or **Insomnia** (API testing)

### 2.2 System Requirements

**Minimum**:
- 8 GB RAM
- 20 GB free disk space
- macOS, Windows 10+, or Linux

**Recommended**:
- 16 GB RAM
- 50 GB free disk space
- SSD for database performance

### 2.3 Accounts & Access

You'll need access to:
- [ ] GitHub repository (https://github.com/mkelam/Coinsphere)
- [ ] AWS account (for production deployment)
- [ ] Slack workspace (#engineering, #support)
- [ ] 1Password vault (for shared secrets)

---

## 3. Project Structure

### 3.1 Repository Organization

```
coinsphere/
├── frontend/                 # React web app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (Dashboard, Predictions, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client, auth service
│   │   ├── lib/             # Utilities, helpers
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── routes/          # Express routes (/api/auth, /api/portfolio)
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models (Prisma/TypeORM)
│   │   ├── middleware/      # Auth, rate limiting, error handling
│   │   └── utils/           # Helpers
│   └── package.json
│
├── ml-service/               # Python ML API
│   ├── app/
│   │   ├── routers/         # FastAPI routes (/predict, /backtest)
│   │   ├── models/          # PyTorch LSTM models
│   │   ├── data/            # Data fetching, feature engineering
│   │   └── utils/           # Helpers
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                     # All documentation (you are here!)
│   ├── current/             # Latest docs
│   └── archive/             # Old versions
│
├── scripts/                  # Automation scripts
│   ├── seed-db.sh           # Seed development database
│   ├── migrate-db.sh        # Run migrations
│   └── deploy.sh            # Deploy to staging/prod
│
├── docker/                   # Docker configs
│   ├── docker-compose.yml   # Local development setup
│   └── Dockerfile.*         # Service-specific Dockerfiles
│
├── .github/                  # GitHub Actions CI/CD
│   └── workflows/
│       ├── test.yml         # Run tests on PR
│       └── deploy.yml       # Deploy to production
│
└── README.md                 # Project overview
```

### 3.2 Key Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template (copy to `.env`) |
| `package.json` | Node.js dependencies |
| `requirements.txt` | Python dependencies |
| `docker-compose.yml` | Local database & Redis setup |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS theme |

---

## 4. Environment Setup

### 4.1 Clone the Repository

```bash
# Clone repo
git clone https://github.com/mkelam/Coinsphere.git
cd Coinsphere

# Create a new branch for your work
git checkout -b feature/your-name-onboarding
```

### 4.2 Install Dependencies

**Frontend (React)**:
```bash
cd frontend
npm install
```

**Backend (Node.js)**:
```bash
cd backend
npm install
```

**ML Service (Python)**:
```bash
cd ml-service
python -m venv venv          # Create virtual environment
source venv/bin/activate     # Activate (Mac/Linux)
# OR
venv\Scripts\activate        # Activate (Windows)

pip install -r requirements.txt
```

### 4.3 Environment Variables

**Copy `.env.example` to `.env` in each service**:

**Frontend** (`frontend/.env`):
```bash
cp .env.example .env
```

**Backend** (`backend/.env`):
```bash
cp .env.example .env
```

**ML Service** (`ml-service/.env`):
```bash
cp .env.example .env
```

**Edit `.env` files** (see [ENVIRONMENT_CONFIGURATION.md](ENVIRONMENT_CONFIGURATION.md) for details):

**Backend `.env` example**:
```env
# Database
DATABASE_URL=postgresql://coinsphere:password@localhost:5432/coinsphere_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=3600

# External APIs
COINGECKO_API_KEY=your-coingecko-key
LUNARCRUSH_API_KEY=your-lunarcrush-key

# PayFast (for payments)
STRIPE_SECRET_KEY=sk_test_...

# Environment
NODE_ENV=development
PORT=3001
```

---

## 5. Database Setup

### 5.1 Option 1: Docker (Recommended)

**Start PostgreSQL + Redis with Docker Compose**:

```bash
# From project root
docker-compose up -d

# Verify services are running
docker ps
```

**Expected output**:
```
CONTAINER ID   IMAGE              PORTS
abc123def456   postgres:15        0.0.0.0:5432->5432/tcp
def456ghi789   redis:7            0.0.0.0:6379->6379/tcp
```

**Connect to database**:
```bash
# Using psql
psql -h localhost -U coinsphere -d coinsphere_dev
# Password: password (from docker-compose.yml)

# OR using TablePlus/pgAdmin
# Host: localhost, Port: 5432, Database: coinsphere_dev
```

### 5.2 Option 2: Local Installation

**PostgreSQL**:
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb coinsphere_dev

# Create user
psql -d postgres
CREATE USER coinsphere WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE coinsphere_dev TO coinsphere;
\q
```

**Redis**:
```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Verify
redis-cli ping
# Should return: PONG
```

### 5.3 Run Migrations

**Option A: Using Prisma (Node.js backend)**:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

**Option B: Using raw SQL migrations**:
```bash
cd backend
npm run migrate:dev
```

**Verify tables were created**:
```bash
psql -h localhost -U coinsphere -d coinsphere_dev -c "\dt"
```

**Expected tables**:
- users
- subscriptions
- portfolios
- holdings
- exchange_connections
- predictions
- risk_scores
- alerts
- price_history (TimescaleDB hypertable)

### 5.4 Seed Development Data

**Load sample data for testing**:
```bash
cd backend
npm run seed:dev
```

**What this creates**:
- 3 test users (admin@coinsphere.dev, pro@coinsphere.dev, free@coinsphere.dev)
- Sample portfolios with holdings
- 24 hours of price history for BTC, ETH, SOL
- Sample predictions and risk scores

**Test login credentials**:
| Email | Password | Tier |
|-------|----------|------|
| admin@coinsphere.dev | Admin123! | power-trader |
| pro@coinsphere.dev | Pro123! | pro |
| free@coinsphere.dev | Free123! | free |

---

## 6. Running the Application

### 6.1 Start Backend API

**Terminal 1** (Backend):
```bash
cd backend
npm run dev
```

**Expected output**:
```
[INFO] Server listening on http://localhost:3001
[INFO] Database connected
[INFO] Redis connected
```

**Test API**:
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 6.2 Start ML Service

**Terminal 2** (ML Service):
```bash
cd ml-service
source venv/bin/activate  # Activate virtual environment
uvicorn app.main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Test ML API**:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","model_version":"v1.0.0"}
```

### 6.3 Start Frontend

**Terminal 3** (Frontend):
```bash
cd frontend
npm run dev
```

**Expected output**:
```
  VITE v5.0.0  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open browser**: http://localhost:5173

**You should see**:
- Login page
- Sign up with one of the test accounts
- Dashboard with sample portfolio

### 6.4 Verify Everything Works

✅ **Checklist**:
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:3001/health
- [ ] ML API responds at http://localhost:8000/health
- [ ] Database has tables (check with `\dt` in psql)
- [ ] Redis is running (check with `redis-cli ping`)
- [ ] Can log in with test account
- [ ] Dashboard shows sample portfolio

---

## 7. Development Workflow

### 7.1 Git Workflow

**Branch Naming**:
- Feature: `feature/short-description`
- Bug fix: `fix/issue-number-description`
- Hotfix: `hotfix/critical-bug`

**Example**:
```bash
# Create feature branch
git checkout -b feature/add-binance-integration

# Make changes, commit frequently
git add .
git commit -m "feat: add Binance API integration"

# Push to remote
git push origin feature/add-binance-integration

# Create Pull Request on GitHub
```

**Commit Message Format** (Conventional Commits):
```
<type>: <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code restructuring
- `test`: Add tests
- `chore`: Build process, dependencies

**Examples**:
```
feat: add portfolio risk calculation
fix: resolve sync error with Coinbase API
docs: update API specification with new endpoints
```

### 7.2 Code Style

**TypeScript/JavaScript** (ESLint + Prettier):
```bash
# Auto-format code
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

**Python** (Black + Flake8):
```bash
# Auto-format
black .

# Check linting
flake8 .
```

**Pre-commit Hook** (runs automatically):
```bash
# Install pre-commit
npm run prepare

# Runs on every commit:
# - ESLint
# - Prettier
# - TypeScript check
# - Python black
```

### 7.3 Testing

**Backend Tests**:
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**Frontend Tests**:
```bash
cd frontend
npm test                 # Run Vitest
npm run test:e2e         # Playwright E2E tests
```

**ML Service Tests**:
```bash
cd ml-service
pytest                   # Run all tests
pytest -v                # Verbose output
pytest tests/test_model.py  # Specific file
```

### 7.4 Making Changes

**1. Pick a Task**:
- Check Linear/Jira board for assigned tasks
- Start with "Good First Issue" labels

**2. Create Branch**:
```bash
git checkout -b feature/your-task
```

**3. Make Changes**:
- Edit code in your IDE
- Save files (hot reload is enabled)
- Test in browser/API client

**4. Write Tests**:
```bash
# Example: backend test
# backend/tests/portfolio.test.ts
import { describe, it, expect } from 'vitest';
import { createPortfolio } from '../src/services/portfolio';

describe('Portfolio Service', () => {
  it('should create portfolio with valid data', async () => {
    const result = await createPortfolio({
      userId: 'test-user-123',
      name: 'My Test Portfolio'
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('My Test Portfolio');
  });
});
```

**5. Run Tests**:
```bash
npm test
```

**6. Commit & Push**:
```bash
git add .
git commit -m "feat: add portfolio creation endpoint"
git push origin feature/your-task
```

**7. Create Pull Request**:
- Go to GitHub
- Click "Compare & pull request"
- Fill in description using PR template
- Request review from team lead

---

## 8. Common Issues & Troubleshooting

### 8.1 Database Connection Errors

**Error**: `Connection refused (postgresql)`

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps                # If using Docker
# OR
brew services list       # If installed locally

# Restart PostgreSQL
docker-compose restart postgres
# OR
brew services restart postgresql@15

# Verify connection
psql -h localhost -U coinsphere -d coinsphere_dev
```

### 8.2 Redis Connection Errors

**Error**: `Redis connection refused`

**Solution**:
```bash
# Check if Redis is running
docker ps
# OR
brew services list

# Restart Redis
docker-compose restart redis
# OR
brew services restart redis

# Test connection
redis-cli ping
# Should return: PONG
```

### 8.3 Port Already in Use

**Error**: `Port 3001 is already in use`

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001              # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>              # macOS/Linux
taskkill /PID <PID> /F     # Windows

# OR use different port
PORT=3002 npm run dev
```

### 8.4 Missing Environment Variables

**Error**: `JWT_SECRET is not defined`

**Solution**:
```bash
# Ensure .env file exists
ls -la .env

# Copy from example if missing
cp .env.example .env

# Edit .env and add missing variables
nano .env  # or your preferred editor
```

### 8.5 TypeScript Errors

**Error**: `Cannot find module '@/types'`

**Solution**:
```bash
# Regenerate TypeScript types
npm run typecheck

# If using Prisma, regenerate client
npx prisma generate

# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"
```

### 8.6 Python Module Not Found

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep fastapi
```

### 8.7 Docker Issues

**Error**: `Cannot connect to Docker daemon`

**Solution**:
```bash
# Start Docker Desktop (macOS/Windows)
# OR start Docker service (Linux)
sudo systemctl start docker

# Verify
docker ps
```

### 8.8 Node Modules Issues

**Error**: Weird npm errors, missing modules

**Solution** (Nuclear option):
```bash
# Delete node_modules and lock files
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

---

## 9. Next Steps

### 9.1 Your First Task

**Option 1: Fix a Bug** (Easiest)
- Look for issues labeled `good-first-issue`
- Example: "Fix typo in Dashboard component"

**Option 2: Add a Small Feature** (Medium)
- Example: "Add sorting to portfolio holdings table"

**Option 3: Improve Tests** (Medium)
- Add test coverage to existing components
- Example: "Add tests for auth middleware"

### 9.2 Learning Resources

**Tech Stack Deep Dives**:
- **React**: https://react.dev/learn
- **TypeScript**: https://typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Node.js**: https://nodejs.org/en/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **PostgreSQL**: https://postgresql.org/docs
- **TimescaleDB**: https://docs.timescale.com
- **PyTorch**: https://pytorch.org/tutorials

**Project-Specific Docs**:
- [API Specification](API_SPECIFICATION.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [ML Model Specification](ML_MODEL_SPECIFICATION.md)
- [Security & Compliance](SECURITY_COMPLIANCE_PLAN.md)

### 9.3 Team Communication

**Daily Standup** (Async in Slack):
- What did you do yesterday?
- What will you do today?
- Any blockers?

**Weekly Sync** (Video call):
- Friday 3 PM PT
- Demo your work
- Sprint planning

**Channels**:
- `#engineering`: Technical discussions
- `#support`: User issues
- `#general`: Team chat
- `#random`: Memes & fun

### 9.4 Useful Commands Cheatsheet

```bash
# Run all services (Docker)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Backend (Node.js)
cd backend
npm run dev              # Start dev server
npm test                 # Run tests
npm run migrate:dev      # Run migrations
npm run seed:dev         # Seed database

# Frontend (React)
cd frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview prod build

# ML Service (Python)
cd ml-service
source venv/bin/activate
uvicorn app.main:app --reload
pytest                   # Run tests
python scripts/train_model.py  # Train model

# Database
psql -h localhost -U coinsphere -d coinsphere_dev
\dt                      # List tables
\d users                 # Describe table

# Redis
redis-cli
KEYS *                   # List all keys
GET prediction:BTC:7d    # Get value
```

---

## 10. Getting Help

### 10.1 Who to Ask

| Topic | Contact | Slack Channel |
|-------|---------|---------------|
| **General Setup** | @tech-lead | #engineering |
| **Frontend (React)** | @frontend-lead | #frontend |
| **Backend (Node.js)** | @backend-lead | #backend |
| **ML/Python** | @ml-engineer | #ml-engineering |
| **Database** | @backend-lead | #backend |
| **DevOps/Deployment** | @devops | #devops |

### 10.2 Debugging Tips

1. **Check logs first**:
   ```bash
   # Backend logs
   docker-compose logs backend

   # ML service logs
   docker-compose logs ml-service
   ```

2. **Use debugger**:
   - VS Code: Set breakpoints, press F5
   - Chrome DevTools: Inspect React components

3. **Search existing issues**:
   - GitHub Issues
   - Slack search

4. **Ask in Slack**:
   - Provide error message
   - Share code snippet
   - Mention what you've tried

---

## Welcome to the Team! 🚀

You're all set! If you encounter any issues not covered here, please:
1. Try searching Slack history
2. Check GitHub Issues
3. Ask in #engineering channel

We're here to help. Happy coding!

---

**Document Maintained By:** Engineering Team
**Last Updated:** October 7, 2025
**Next Review:** Monthly (or when onboarding process changes)

---

**END OF DOCUMENT**
