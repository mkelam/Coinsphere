# Sprint 1 Kickoff - Coinsphere MVP
## Foundation & Infrastructure (Week 1-2)

**Date:** October 11, 2025
**Sprint Duration:** 2 weeks (October 11-25, 2025)
**Status:** 🟢 READY TO START
**Previous Sprint:** Sprint 0 - 100% Complete ✅

---

## Executive Summary

**Sprint 0 Achievement:** All 7 critical blockers (NCB-01 through NCB-07) have been resolved with exceptional success. The Coinsphere MVP now has:
- ✅ 100% operational infrastructure (all 6 services running)
- ✅ 88% TypeScript error reduction (51 → 6 errors)
- ✅ 100% ML models trained and loading (BTC, ETH, SOL)
- ✅ Production-ready development environment (Grade A+)

**Sprint 1 Goal:** Build on this solid foundation by implementing core functionality - database schemas, API endpoints, authentication system, and data ingestion pipeline.

---

## Sprint 1 Overview

### Goals
1. Complete database schema design and migrations
2. Implement core authentication (register, login, JWT)
3. Build data ingestion pipeline for real-time price data
4. Setup CI/CD pipeline with automated testing
5. Establish development workflow and team processes

### Key Deliverables
- [ ] PostgreSQL + TimescaleDB schemas migrated
- [ ] User authentication fully functional
- [ ] Price data flowing from CoinGecko → TimescaleDB
- [ ] CI/CD pipeline running tests automatically
- [ ] All developers can run app locally

### Success Metrics
- All services remain healthy (100% uptime)
- User registration + login works end-to-end
- Price data updates every 5 minutes for 20+ tokens
- CI pipeline passes with 0 test failures
- Test coverage increases to 50%+

---

## Sprint 1 Task Breakdown

### Week 1: Database & Authentication

#### Day 1-2: Database Schema Implementation
**Priority:** P0 - Critical Foundation
**Owner:** Backend Lead
**Estimated Time:** 16 hours

**Tasks:**
- [ ] Review existing Prisma schema ([backend/prisma/schema.prisma](../backend/prisma/schema.prisma))
- [ ] Create initial migration if needed
- [ ] Add missing indexes for performance
- [ ] Setup TimescaleDB hypertables for price_data
- [ ] Create seed data for development
- [ ] Test migrations rollback/forward
- [ ] Document schema decisions

**Verification:**
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
# Verify tables exist
docker exec coinsphere-postgres psql -U coinsphere -d coinsphere_dev -c "\dt"
```

**Files to Modify:**
- [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)
- Create: `backend/prisma/seed.ts`
- Create: `backend/prisma/migrations/`

---

#### Day 3-4: Authentication System
**Priority:** P0 - Critical for all features
**Owner:** Backend Developer
**Estimated Time:** 16 hours

**Tasks:**
- [ ] Implement `/api/v1/auth/register` endpoint
  - Email validation
  - Password hashing with bcrypt
  - Email verification token generation
  - Return JWT token
- [ ] Implement `/api/v1/auth/login` endpoint
  - Email + password validation
  - JWT token generation with RS256
  - Refresh token support
- [ ] Implement `/api/v1/auth/verify-email` endpoint
  - Token validation
  - User account activation
- [ ] Implement `/api/v1/auth/me` endpoint
  - Get current user profile
  - Requires JWT authentication
- [ ] Add rate limiting to auth endpoints
  - 5 requests/minute for login
  - 3 requests/minute for register
- [ ] Write comprehensive auth tests
  - Unit tests for each endpoint
  - Integration tests for full flow

**Verification:**
```bash
# Test registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@coinsphere.com","password":"SecurePass123!"}'

# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@coinsphere.com","password":"SecurePass123!"}'

# Test protected route
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer {token}"
```

**Files to Modify:**
- [backend/src/routes/auth.ts](../backend/src/routes/auth.ts) - Already exists, enhance
- [backend/src/middleware/auth.ts](../backend/src/middleware/auth.ts) - Already exists
- [backend/src/services/emailService.ts](../backend/src/services/emailService.ts) - Already fixed
- Create: `backend/tests/auth.test.ts`

---

#### Day 5: CI/CD Pipeline Setup
**Priority:** P1 - High (prevents future issues)
**Owner:** DevOps / Backend Lead
**Estimated Time:** 8 hours

**Tasks:**
- [ ] Create `.github/workflows/ci.yml`
  - Run on PR and push to master
  - Install dependencies
  - Run TypeScript type checking
  - Run linting
  - Run unit tests
  - Run E2E tests (if services available)
  - Build production artifacts
- [ ] Add code coverage reporting
  - Setup Codecov or similar
  - Enforce 70% minimum coverage
- [ ] Add status badges to README
  - CI status
  - Test coverage
  - TypeScript version
- [ ] Setup Docker image building
  - Build on every merge to master
  - Tag with commit SHA
  - Push to container registry (optional for MVP)
- [ ] Document CI/CD process

**Verification:**
```bash
# Manually trigger workflow
git push origin feature/add-ci-pipeline
# Watch GitHub Actions tab for green checkmark
```

**Files to Create:**
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-staging.yml` (optional)

---

### Week 2: Data Ingestion & Token Management

#### Day 1-2: CoinGecko Integration
**Priority:** P0 - Critical for core functionality
**Owner:** Backend Developer
**Estimated Time:** 16 hours

**Tasks:**
- [ ] Create `PriceDataService` class
  - CoinGecko API client with rate limiting
  - Fetch current prices for list of symbols
  - Fetch historical OHLCV data
  - Error handling with retries
  - Caching with Redis (5-minute TTL)
- [ ] Implement background job for price updates
  - Use Bull queue or similar
  - Fetch prices every 5 minutes
  - Store in TimescaleDB price_data hypertable
  - Handle API rate limits gracefully
- [ ] Create `/api/v1/prices/current` endpoint
  - Get current prices for multiple symbols
  - Return from cache if available
- [ ] Create `/api/v1/prices/historical` endpoint
  - Get OHLCV data for specific timeframes
  - Support: 1h, 24h, 7d, 30d, 90d, 1y
- [ ] Add monitoring for price updates
  - Log successful/failed updates
  - Alert if data becomes stale (>10 minutes)

**Verification:**
```bash
# Test price fetching
curl http://localhost:3001/api/v1/prices/current?symbols=BTC,ETH,SOL

# Check database
docker exec coinsphere-postgres psql -U coinsphere -d coinsphere_dev \
  -c "SELECT * FROM price_data ORDER BY timestamp DESC LIMIT 10;"
```

**Files to Create:**
- `backend/src/services/priceDataService.ts`
- `backend/src/jobs/priceUpdateJob.ts`
- `backend/tests/priceData.test.ts`

**External Dependencies:**
- CoinGecko API key (already configured)
- Redis running (already operational)

---

#### Day 3-4: Token Management System
**Priority:** P1 - High (supports all features)
**Owner:** Backend Developer
**Estimated Time:** 16 hours

**Tasks:**
- [ ] Create token metadata seeding script
  - Populate tokens table with top 50 cryptocurrencies
  - Include: symbol, name, coingecko_id, logo_url, market_cap_rank
  - Source from CoinGecko `/coins/list` endpoint
- [ ] Implement `/api/v1/tokens/search` endpoint
  - Search by name or symbol
  - Support fuzzy matching
  - Pagination (20 per page)
  - Return sorted by market cap rank
- [ ] Implement `/api/v1/tokens/:symbol` endpoint
  - Get detailed token information
  - Include current price, 24h change, volume
  - Include market cap, circulating supply
- [ ] Implement `/api/v1/tokens/trending` endpoint
  - Return top gainers/losers (24h)
  - Return most searched tokens
  - Cache for 5 minutes
- [ ] Add token watchlist endpoints (authenticated)
  - POST `/api/v1/tokens/watchlist` - Add to watchlist
  - DELETE `/api/v1/tokens/watchlist/:symbol` - Remove from watchlist
  - GET `/api/v1/tokens/watchlist` - Get user's watchlist

**Verification:**
```bash
# Test search
curl http://localhost:3001/api/v1/tokens/search?q=bitcoin

# Test token details
curl http://localhost:3001/api/v1/tokens/BTC

# Test trending
curl http://localhost:3001/api/v1/tokens/trending

# Test watchlist (authenticated)
curl -X POST http://localhost:3001/api/v1/tokens/watchlist \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTC"}'
```

**Files to Create:**
- `backend/src/routes/tokens.ts` - Already exists, enhance
- `backend/src/services/tokenService.ts`
- `backend/prisma/seed-tokens.ts`
- `backend/tests/tokens.test.ts`

---

#### Day 5: Testing & Documentation
**Priority:** P1 - High (ensures quality)
**Owner:** Full Team
**Estimated Time:** 8 hours

**Tasks:**
- [ ] Write integration tests for full user flows
  - User signup → email verify → login → access protected route
  - User login → add token to watchlist → view watchlist
  - Price data updates → fetch via API → verify freshness
- [ ] Achieve 50% test coverage minimum
  - Focus on critical paths (auth, price data)
  - Mock external APIs (CoinGecko)
- [ ] Update API documentation
  - Add OpenAPI/Swagger annotations
  - Test all endpoints in Swagger UI
  - Document rate limits and caching
- [ ] Write Sprint 1 completion report
  - Document what was accomplished
  - Note any blockers or challenges
  - Metrics: test coverage, API response times
- [ ] Plan Sprint 2 priorities
  - Review ML pipeline requirements
  - Assign initial tasks for Week 3

**Verification:**
```bash
# Run all tests
cd backend && npm test

# Check coverage
npm run test:coverage

# View API docs
open http://localhost:3001/docs
```

---

## Technical Specifications

### Database Schema Updates

**New Tables Required:**
```sql
-- Token watchlists (many-to-many)
CREATE TABLE user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, token_id)
);

-- Price update logs (monitoring)
CREATE TABLE price_update_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual'
  symbols_updated INTEGER NOT NULL,
  symbols_failed INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes to Add:**
```sql
-- Performance optimizations
CREATE INDEX idx_price_data_symbol_time ON price_data(symbol, timestamp DESC);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_market_cap ON tokens(market_cap_rank);
CREATE INDEX idx_user_watchlists_user ON user_watchlists(user_id);
```

---

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | User registration |
| POST | `/api/v1/auth/login` | No | User login |
| POST | `/api/v1/auth/verify-email` | No | Email verification |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| GET | `/api/v1/prices/current` | No | Current prices |
| GET | `/api/v1/prices/historical` | No | Historical OHLCV |
| GET | `/api/v1/tokens/search` | No | Search tokens |
| GET | `/api/v1/tokens/:symbol` | No | Token details |
| GET | `/api/v1/tokens/trending` | No | Trending tokens |
| GET | `/api/v1/tokens/watchlist` | Yes | User's watchlist |
| POST | `/api/v1/tokens/watchlist` | Yes | Add to watchlist |
| DELETE | `/api/v1/tokens/watchlist/:symbol` | Yes | Remove from watchlist |

---

## Success Criteria

### Must Complete (Blocking Sprint 2)
- [ ] ✅ All database migrations successful
- [ ] ✅ User registration + login working end-to-end
- [ ] ✅ Price data updating automatically every 5 minutes
- [ ] ✅ At least 20 tokens seeded in database
- [ ] ✅ CI/CD pipeline running and passing
- [ ] ✅ Test coverage ≥50%

### Should Complete (High Priority)
- [ ] Token search and details endpoints working
- [ ] Watchlist functionality implemented
- [ ] API documentation updated
- [ ] No new TypeScript errors introduced
- [ ] All services remain healthy

### Nice to Have (Optional)
- [ ] Load testing for auth endpoints
- [ ] Email verification actually sending emails
- [ ] Frontend integration started
- [ ] Additional tokens seeded (50+)

---

## Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| CoinGecko API rate limits | High | Medium | Aggressive caching, backup data source |
| CI/CD setup complexity | Medium | Medium | Start simple, iterate gradually |
| Test coverage slips below 50% | Medium | High | Make tests required in PRs |
| Database migration issues | Low | High | Test migrations on fresh DB first |
| Team velocity lower than estimated | Medium | Medium | Prioritize must-haves, defer nice-to-haves |

### Mitigation Strategies

**CoinGecko Rate Limits:**
- Cache ALL responses for 5 minutes minimum
- Implement circuit breaker pattern
- Monitor API usage daily
- Have fallback mock data ready

**CI/CD Complexity:**
- Start with basic workflow (just tests)
- Add features incrementally
- Document every step clearly
- Get team buy-in early

**Test Coverage:**
- Make tests part of definition of done
- Review coverage in every PR
- Pair programming for complex tests
- Celebrate when coverage increases

---

## Daily Standup Format

**Every morning at 10:00 AM (15 minutes max)**

**Each team member answers:**
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers or risks?

**Team reviews:**
- Are all services still healthy?
- Are tests still passing?
- Any new critical issues discovered?

**Example:**
```
Alice (Backend):
- Yesterday: Completed auth registration endpoint, 10 tests passing
- Today: Implement login endpoint and JWT generation
- Blockers: None

Bob (Backend):
- Yesterday: Started CoinGecko integration, basic client working
- Today: Add rate limiting and error handling
- Blockers: Need API key from product manager

Charlie (DevOps):
- Yesterday: Research GitHub Actions best practices
- Today: Create initial CI workflow file
- Blockers: Waiting for Bob's tests to be ready
```

---

## Definition of Done

A task is considered "done" when:
- [ ] Code is written and reviewed
- [ ] Unit tests are written and passing
- [ ] Integration tests added if applicable
- [ ] TypeScript compiles with no new errors
- [ ] Code is formatted and linted
- [ ] Documentation is updated
- [ ] PR is approved by 1+ team member
- [ ] CI pipeline passes
- [ ] Feature tested locally
- [ ] No new security vulnerabilities introduced

---

## Sprint Review (End of Week 2)

**Friday, October 25, 2025 at 2:00 PM**

**Agenda:**
1. Demo all completed features (30 minutes)
   - Live demo of registration/login flow
   - Show price data updating in database
   - Demo CI/CD pipeline running
   - Show API documentation
2. Review Sprint 1 metrics (15 minutes)
   - Test coverage achieved
   - Number of endpoints implemented
   - CI/CD pipeline success rate
   - Any production issues
3. Retrospective (30 minutes)
   - What went well?
   - What could be improved?
   - Action items for Sprint 2
4. Sprint 2 planning (15 minutes)
   - Review Sprint 2 goals (ML pipeline)
   - Assign initial tasks
   - Identify dependencies

**Deliverable:** Sprint 1 Completion Report document

---

## Team Assignments

### Backend Lead
- Database schema design and migrations
- CI/CD pipeline setup
- Code review for all backend PRs
- Sprint 1 completion report

### Backend Developer 1
- Authentication system implementation
- Email service integration
- Auth tests

### Backend Developer 2
- CoinGecko integration
- Price data ingestion pipeline
- Background job setup

### Backend Developer 3 (if available)
- Token management system
- Token search and details
- Watchlist functionality

### DevOps Engineer (0.5 FTE)
- GitHub Actions workflow
- Docker optimization
- Monitoring setup

---

## Tools & Resources

### Development Tools
- **IDE:** VS Code or Windsurf
- **API Testing:** Postman or Insomnia
- **Database Client:** Adminer (http://localhost:8080)
- **Git:** Standard GitHub workflow

### External Services
- **CoinGecko API:** https://www.coingecko.com/en/api/documentation
  - Pro plan: 500 calls/minute
  - API key: Stored in `.env`
- **SendGrid:** Email service for verification
  - API key: Stored in `.env`

### Documentation
- [System Architecture](./System Architecture Document.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Specification](./API_SPECIFICATION.md)
- [Code Style Guide](./CODE_STYLE_GUIDE.md)

### Communication
- **Daily Standups:** Slack #coinsphere-dev channel
- **Code Reviews:** GitHub pull requests
- **Questions:** Slack DMs or team channel
- **Emergencies:** Tag @backend-lead

---

## Next Steps (Start Monday, October 14, 2025)

### Monday Morning (Day 1)
1. **Team Kickoff Meeting** (30 minutes)
   - Review Sprint 1 plan together
   - Clarify goals and success metrics
   - Assign tasks to team members
   - Answer any questions

2. **Environment Verification** (1 hour)
   - Everyone runs `docker-compose ps` - all services healthy?
   - Everyone runs `npm test` - all tests passing?
   - Everyone can access Adminer and see database
   - Verify API responds: `curl http://localhost:3001/health`

3. **Create Feature Branches** (15 minutes)
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/database-migrations  # Backend Lead
   git checkout -b feature/auth-system          # Backend Dev 1
   git checkout -b feature/coingecko-integration # Backend Dev 2
   ```

4. **Start Coding!** (Rest of day)
   - Backend Lead: Database schema design
   - Backend Dev 1: Review existing auth code
   - Backend Dev 2: CoinGecko API research
   - DevOps: GitHub Actions research

---

## Sprint 1 Metrics (Track Daily)

| Metric | Target | Current |
|--------|--------|---------|
| Test Coverage | 50% | TBD |
| Endpoints Implemented | 12 | 0 |
| TypeScript Errors | 6 | 6 |
| CI Pipeline Success | 100% | N/A |
| Services Healthy | 6/6 | 6/6 ✅ |
| Commit Frequency | 3+/day | TBD |

---

## Conclusion

Sprint 0 was a massive success, establishing a rock-solid foundation. Sprint 1 builds on this by implementing the core functionality that every feature depends on:
- **Authentication** - Identity and security
- **Price Data** - The lifeblood of the application
- **Token Management** - Organizing the crypto universe
- **CI/CD** - Ensuring quality at scale

With these pieces in place, Sprint 2 can focus on the exciting ML pipeline and prediction engine that makes Coinsphere unique.

**Let's ship it! 🚀**

---

*Created: October 11, 2025*
*Author: Sprint Planning Team*
*Status: Ready for Team Review*
