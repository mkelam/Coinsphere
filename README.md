# 🚀 CryptoSense (Coinsphere) - AI-Powered Crypto Portfolio Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)

**CryptoSense** (formerly Coinsphere) is an enterprise-grade cryptocurrency portfolio tracker with AI-powered market predictions, real-time risk scoring, and intelligent alerts. Built for serious crypto traders who need data-driven insights.

![CryptoSense Dashboard](Documentation/screenshots/dashboard.png)

---

## 🌟 Key Features

### 📊 Portfolio Management
- **Multi-Portfolio Support**: Manage unlimited portfolios with separate tracking
- **Real-Time Price Updates**: WebSocket-powered live price feeds from CoinGecko
- **Transaction History**: Complete audit trail with buy/sell/transfer tracking
- **Asset Allocation Visualization**: Interactive pie charts showing portfolio distribution

### 🤖 AI-Powered Predictions
- **Machine Learning Engine**: Statistical models using 6 technical indicators
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - EMA (Exponential Moving Average - 12 & 26 periods)
  - Bollinger Bands for volatility analysis
  - Volume trend analysis
  - Price momentum tracking
- **Multi-Timeframe Forecasts**: 1h, 4h, 24h, 7d, 30d predictions
- **Confidence Scoring**: Transparent accuracy metrics for each prediction

### 🎯 Degen Risk Scoring
- **0-100 Risk Scale**: Comprehensive asset risk assessment
- **4-Component Analysis**:
  - **Liquidity Score** (25% weight): Market depth and trading volume
  - **Volatility Score** (30% weight): Price stability and standard deviation
  - **Market Cap Score** (30% weight): Project size and stability
  - **Volume Score** (15% weight): Trading activity relative to market cap
- **Risk Levels**: Conservative, Moderate, Aggressive, Degen, Ultra Degen

### 🔔 Smart Alerts System
- **Price Alerts**: Trigger on threshold crossings (above/below/equal)
- **Prediction Alerts**: Notify when ML confidence exceeds threshold
- **Risk Alerts**: Warn when risk score changes significantly
- **Multi-Channel Delivery**: Email, push notifications, in-app alerts

### 📈 Price History Charts
- **Interactive Recharts Visualizations**: Smooth line charts with custom tooltips
- **Multiple Timeframes**: 24h, 7d, 30d, 1y views
- **Real-Time Updates**: Charts refresh automatically with WebSocket data
- **Color-Coded Trends**: Green for bullish, red for bearish

### ⚙️ User Settings
- **Profile Management**: Update name, email, password
- **Notification Preferences**: Granular control over alert channels
- **Account Information**: View subscription tier, account age, data usage
- **Security**: Change password, manage sessions (coming soon)

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
```
React 18.3          - UI framework with Hooks
TypeScript 5.6      - Type-safe development
Vite 6.0            - Lightning-fast build tool
Tailwind CSS v4     - Utility-first styling with @tailwindcss/postcss
Shadcn/ui           - Accessible component primitives
Recharts 2.15       - Data visualization library
Axios 1.7           - HTTP client with interceptors
React Router 7      - Client-side routing
```

#### Backend
```
Node.js 22.15       - Runtime environment
Express 4.21        - Web framework
TypeScript 5.7      - Type safety
Prisma 6.5          - Next-gen ORM
PostgreSQL 15       - Primary database
TimescaleDB         - Time-series extension for price data
Redis 7             - Caching and session storage
ws 8.18             - WebSocket server
```

#### Infrastructure
```
Docker              - Containerization
Docker Compose      - Multi-container orchestration
Nginx               - Reverse proxy and load balancer
PM2                 - Process manager (alternative to Docker)
GitHub Actions      - CI/CD pipelines
```

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80/443)                 │
│                   (Reverse Proxy + SSL)                      │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
        ┌───────▼────────┐    ┌────────▼───────────┐
        │   Frontend     │    │     Backend        │
        │   (React)      │    │   (Express API)    │
        │   Port 5173    │    │   Port 3001        │
        └────────────────┘    └─────┬──────┬───────┘
                                    │      │
                          ┌─────────▼──┐ ┌─▼─────────────┐
                          │ PostgreSQL │ │ WebSocket     │
                          │ TimescaleDB│ │ (Real-Time)   │
                          │ Port 5432  │ │ Port 3001/ws  │
                          └────────────┘ └───────────────┘
                                    │
                          ┌─────────▼────────────┐
                          │   CoinGecko API      │
                          │ (External Data)      │
                          └──────────────────────┘
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20+ LTS
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommended)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/mkelam/Coinsphere.git
cd Coinsphere

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp ml-service/.env.example ml-service/.env

# Start all services with Docker Compose
docker-compose up -d

# Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# ML Service: http://localhost:8000
```

### Manual Setup

#### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install ML service dependencies
cd ../ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Setup Database

```bash
# Start PostgreSQL and Redis (via Docker)
docker-compose up -d postgres redis

# Run database migrations
cd backend
npm run migrate

# Seed database with test data (optional)
npm run seed
```

#### 3. Start Development Servers

```bash
# Terminal 1: Frontend
cd frontend
npm run dev  # http://localhost:5173

# Terminal 2: Backend
cd backend
npm run dev  # http://localhost:3001

# Terminal 3: ML Service
cd ml-service
uvicorn app.main:app --reload --port 8000
```

---

## 📚 Documentation

Complete documentation is available in the [Documentation/](./Documentation) folder:

### Strategy & Planning
- [Product Strategy](./Documentation/PRODUCT_STRATEGY.md) - Market analysis, target users, pricing
- [Business Requirements](./Documentation/Business%20Requirements%20Document%20-%20Retail%20Analytics.md) - Feature requirements
- [Financial Model](./Documentation/FINANCIAL_MODEL.md) - Revenue projections
- [Development Roadmap](./Documentation/Development%20Roadmap%20Sprint%20Plan.md) - 8-week sprint plan
- [Go-to-Market Plan](./Documentation/GO_TO_MARKET_PLAN.md) - Launch strategy

### Technical Documentation
- [System Architecture](./Documentation/System%20Architecture%20Document.md) - Tech stack, design principles
- [API Specification](./Documentation/API_SPECIFICATION.md) - REST endpoints, WebSocket
- [Database Schema](./Documentation/DATABASE_SCHEMA.md) - Tables, indexes, migrations
- [ML Model Specification](./Documentation/ML_MODEL_SPECIFICATION.md) - LSTM architecture
- [Security & Compliance](./Documentation/SECURITY_COMPLIANCE_PLAN.md) - GDPR, encryption

### Development Guides
- [Developer Onboarding](./Documentation/DEVELOPER_ONBOARDING.md) - Setup guide (2-3 hours)
- [Code Style Guide](./Documentation/CODE_STYLE_GUIDE.md) - TypeScript/Python conventions
- [Testing Strategy](./Documentation/TESTING_STRATEGY.md) - Unit/integration/E2E tests
- [Environment Configuration](./Documentation/ENVIRONMENT_CONFIGURATION.md) - .env setup

### Design & UX
- [Frontend Specification](./Documentation/front-end-spec.md) - UX design, wireframes
- [User Onboarding Flow](./Documentation/USER_ONBOARDING_FLOW.md) - Signup to activation
- [Accessibility Guidelines](./Documentation/ACCESSIBILITY_GUIDELINES.md) - WCAG 2.1 AA

### Operations
- [DevOps Infrastructure](./Documentation/DEVOPS_INFRASTRUCTURE_GUIDE.md) - CI/CD, monitoring
- [Support & Operations](./Documentation/SUPPORT_OPERATIONS_PLAYBOOK.md) - SLAs, runbooks
- [Third-Party Services](./Documentation/THIRD_PARTY_SERVICES.md) - API integrations

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test              # Unit tests (Jest)
npm run test:e2e      # E2E tests (Playwright)
npm run test:coverage # Coverage report

# Backend tests
cd backend
npm test              # Unit + integration tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# ML service tests
cd ml-service
pytest                # All tests
pytest --cov          # With coverage
```

**Coverage Targets:**
- Unit tests: 80%+ coverage
- Integration tests: Key user flows
- E2E tests: Critical paths (signup, portfolio, alerts)

---

## 🚀 Deployment

### Production Deployment (AWS ECS)

```bash
# Build and push Docker images
npm run build:all
npm run docker:build
npm run docker:push

# Deploy to AWS ECS
npm run deploy:production
```

### Environment Variables

See [ENVIRONMENT_CONFIGURATION.md](./Documentation/ENVIRONMENT_CONFIGURATION.md) for complete list.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key (min 32 chars)
- `COINGECKO_API_KEY` - CoinGecko Pro API key
- `STRIPE_SECRET_KEY` - PayFast payment processing

---

## 📊 Key Features

### ✅ MVP Features (8 weeks)
- [x] User authentication (email/password + JWT)
- [x] Portfolio tracking (manual entry)
- [x] Real-time price updates (WebSocket)
- [x] Risk score calculation (7-factor algorithm)
- [x] AI predictions (7-day BTC/ETH forecasts)
- [x] Price alerts (email notifications)
- [x] Dashboard with charts
- [x] Subscription tiers (Free/Plus/Pro)

### 🔜 Post-MVP (Months 3-6)
- [ ] Exchange API integration (Binance, Coinbase, Kraken)
- [ ] Mobile app (React Native)
- [ ] Whale activity alerts
- [ ] News feed integration
- [ ] Portfolio export (CSV/PDF)
- [ ] Advanced charts (indicators, multiple timeframes)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Development Workflow:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Convention:** [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding or updating tests

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **CoinGecko** - Cryptocurrency price data
- **LunarCrush** - Social sentiment data
- **CCXT** - Exchange integration library
- **Shadcn/ui** - Beautiful UI components
- **The Graph** - On-chain data queries

---

## 📞 Support

- **Documentation:** [docs.coinsphere.io](https://docs.coinsphere.io)
- **Issues:** [GitHub Issues](https://github.com/mkelam/Coinsphere/issues)
- **Email:** support@coinsphere.io
- **Discord:** [Join our community](https://discord.gg/coinsphere)

---

## 🗺️ Roadmap

**Q4 2025:**
- ✅ Complete documentation
- 🔄 MVP development (Weeks 1-8)
- 🔜 Beta launch (Week 9)
- 🔜 Public launch (Week 12)

**Q1 2026:**
- Exchange integrations
- Mobile app development
- Scale to 10,000 users
- $420K ARR target

**Q2 2026:**
- Advanced ML models (multi-timeframe predictions)
- Portfolio optimization recommendations
- Tax reporting features
- Scale to 50,000 users

---

**Built with ❤️ by the Coinsphere team**

---

## 📈 Status

![GitHub last commit](https://img.shields.io/github/last-commit/mkelam/Coinsphere)
![GitHub issues](https://img.shields.io/github/issues/mkelam/Coinsphere)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mkelam/Coinsphere)

**Current Phase:** MVP Development
**Version:** 0.1.0 (Pre-release)
**Last Updated:** October 7, 2025
