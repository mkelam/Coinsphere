# Sprint 0: Emergency Bug Fix - Quick Start Guide

**Date:** October 11, 2025
**Duration:** 1 Week (12-16 hours)
**Priority:** P0 - BLOCKING ALL PROGRESS
**Status:** 🔴 READY TO START

---

## Why Sprint 0?

After completing all 7 original critical blockers (CB-01 through CB-07), E2E testing revealed **7 new critical blockers (NCB-01 to NCB-07)** that prevent deployment. We must fix these before resuming the original 8-week MVP roadmap.

---

## The 7 New Critical Blockers

### P0 - Critical (Must Fix First)

**NCB-01: Services Not Starting** 🔴
- Backend (port 3001) and Frontend (port 5173) not running
- **Impact:** Zero functionality, cannot test anything
- **ETA:** 2-3 hours

**NCB-02: Decimal Financial Bugs** 🔴
- multiply() error of $760 million on large numbers
- roundTo() doesn't round (1.5 stays 1.5)
- isNegative() not exported
- **Impact:** Portfolio values will be WRONG
- **ETA:** 2-3 hours

**NCB-03: TypeScript Errors** 🔴
- 44 compilation errors blocking build
- Missing @types/validator, Prisma Decimal issues, JWT types
- **Impact:** Cannot deploy to production
- **ETA:** 4-6 hours

### P1 - High (Fix After P0)

**NCB-04: Email Service Typo** 🟡
- Line 64: createTransporter → createTransport
- **Impact:** Signup emails will fail
- **ETA:** 5 minutes (quick win!)

**NCB-05: ML Models Not Loaded** 🟡
- PyTorch unavailable, 0 models loaded
- **Impact:** Predictions return errors
- **ETA:** 2-4 hours

**NCB-06: Zero E2E Tests** 🟡
- Playwright configured but no test files
- **Impact:** No safety net for bugs
- **ETA:** 8-12 hours

**NCB-07: 10 Unit Test Failures** 🟡
- 6 decimal tests, 4 auth tests failing
- **Impact:** Existing code may be broken
- **ETA:** 3-4 hours

---

## Week Schedule

### Monday (Day 1) - 6 hours

**Morning (3 hours):**
```bash
# 1. Quick win: Fix email typo (5 minutes)
vim backend/src/services/emailService.ts
# Line 64: createTransporter → createTransport

# 2. Fix decimal bugs (3 hours)
vim backend/src/utils/decimal.ts
# - Fix multiply() to use Decimal.js properly
# - Fix roundTo() to actually round
# - Export isNegative()
npm test -- decimal.test.ts
```

**Afternoon (3 hours):**
```bash
# 3. Debug Docker services (2 hours)
docker-compose ps
netstat -ano | findstr ":3001 :5173"
# Check .env files, port conflicts
docker-compose up -d backend frontend
curl http://localhost:3001/health
```

**Deliverable:** Backend running, financial bugs fixed ✅

---

### Tuesday (Day 2) - 6 hours

**All Day:**
```bash
# Fix TypeScript compilation errors
cd backend

# 1. Install missing types
npm install --save-dev @types/validator

# 2. Fix Prisma Decimal issues (12 errors)
# Convert: decimal.toNumber() where needed
# Use Decimal operations instead of number arithmetic

# 3. Fix JWT types (2 errors)
# Update jwt.sign() calls

# 4. Fix Request.user (create types/express.d.ts)
# 5. Fix CCXT namespace errors

# Verify
npm run build  # Should succeed with 0 errors
```

**Deliverable:** Backend compiles, frontend runs ✅

---

### Wednesday (Day 3) - 6 hours

**Morning (3 hours):**
```bash
# Train ML models
cd ml-service

# 1. Verify PyTorch
docker exec coinsphere-ml python -c "import torch; print(torch.__version__)"

# 2. Train models (BTC, ETH, SOL minimum)
python app/training/train_lstm.py --symbol BTC
python app/training/train_lstm.py --symbol ETH
python app/training/train_lstm.py --symbol SOL

# 3. Verify models loaded
curl http://localhost:8000/health
# Should show: models_loaded > 0
```

**Afternoon (3 hours):**
```bash
# Fix unit tests
cd frontend
# Fix header import issue
vim src/components/header.test.tsx

cd ../backend
npm test
# All tests should pass
```

**Deliverable:** Models loaded, tests passing ✅

---

### Thursday-Friday (Day 4-5) - 8-12 hours

```bash
# Create E2E test suite
mkdir -p tests/e2e

# 1. Setup Playwright config
cat > playwright.config.ts <<EOF
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
  },
});
EOF

# 2. Write 5 critical tests:
# - tests/e2e/auth.spec.ts (signup, login)
# - tests/e2e/portfolio.spec.ts (connect exchange, view dashboard)
# - tests/e2e/predictions.spec.ts (view predictions as Pro user)
# - tests/e2e/risk.spec.ts (view risk score as Pro user)
# - tests/e2e/alerts.spec.ts (create alert)

# 3. Run tests
npm run test:e2e
```

**Deliverable:** 5 E2E tests passing ✅

---

## Success Criteria

Before moving to Sprint 1, ALL must be true:

- [ ] ✅ Backend API running (port 3001)
- [ ] ✅ Frontend running (port 5173)
- [ ] ✅ Backend compiles (0 TypeScript errors)
- [ ] ✅ All decimal tests pass (financial accuracy verified)
- [ ] ✅ Email service works (auth tests pass)
- [ ] ✅ ML models loaded (3+ models)
- [ ] ✅ Zero unit test failures (0/48 tests failing)
- [ ] ✅ 5+ E2E tests passing

**Verification Commands:**
```bash
npm run build                    # Backend compiles ✅
cd frontend && npm run build     # Frontend compiles ✅
npm test                         # 0 test failures ✅
docker-compose ps                # All 6 services "Up (healthy)" ✅
curl http://localhost:3001/health # 200 OK ✅
curl http://localhost:5173        # HTML response ✅
curl http://localhost:8000/health # models_loaded > 0 ✅
npm run test:e2e                 # 5/5 tests pass ✅
```

---

## Task Assignments

**Backend Lead:**
- NCB-03: TypeScript errors (6 hours)
- NCB-02: Decimal bugs (3 hours)

**Backend Developer:**
- NCB-04: Email typo (5 min)
- NCB-07: Unit test fixes (3 hours)

**DevOps:**
- NCB-01: Debug Docker (2 hours)
- Setup CI/CD after Sprint 0

**Data Scientist:**
- NCB-05: Train ML models (3 hours)

**QA + Full Team:**
- NCB-06: E2E test suite (8-12 hours)

---

## Critical Files to Edit

**NCB-02 (Decimal Bugs):**
```
backend/src/utils/decimal.ts
  - Fix multiply() function (line ~50)
  - Fix roundTo() function (line ~70)
  - Export isNegative() function (line ~90)
backend/src/utils/decimal.test.ts
  - Verify all 41 tests pass
```

**NCB-03 (TypeScript):**
```
backend/package.json
  - Add @types/validator to devDependencies
backend/src/utils/decimal.ts
  - Fix Decimal.js operations (12 locations)
backend/src/utils/jwt.ts
  - Fix jwt.sign() types (2 locations)
backend/types/express.d.ts (CREATE NEW)
  - Augment Express Request interface
```

**NCB-04 (Email):**
```
backend/src/services/emailService.ts
  - Line 64: createTransporter → createTransport
```

**NCB-05 (ML Models):**
```
ml-service/requirements.txt
  - Verify torch is listed
ml-service/app/training/train_lstm.py
  - Run training for BTC, ETH, SOL
ml-service/app/models/
  - Save trained models here
```

**NCB-06 (E2E Tests):**
```
tests/e2e/auth.spec.ts (CREATE NEW)
tests/e2e/portfolio.spec.ts (CREATE NEW)
tests/e2e/predictions.spec.ts (CREATE NEW)
tests/e2e/risk.spec.ts (CREATE NEW)
tests/e2e/alerts.spec.ts (CREATE NEW)
playwright.config.ts (CREATE NEW)
```

**NCB-07 (Unit Tests):**
```
frontend/src/components/header.test.tsx
  - Line 5: Fix import statement
frontend/src/pages/DashboardPage.test.tsx (CREATE NEW)
frontend/src/components/ConnectWallet.test.tsx (CREATE NEW)
```

---

## Daily Standup Questions

**Every morning at 9am:**
1. What did you complete yesterday?
2. What will you complete today?
3. Any blockers?
4. **NEW:** Are all services running?
5. **NEW:** Do all tests pass on your branch?

---

## Definition of Done

A task is only "done" when:
- [ ] Code implemented and committed
- [ ] Unit tests pass
- [ ] Integration test passes (if applicable)
- [ ] Service runs locally
- [ ] PR approved and merged
- [ ] CI pipeline passes

---

## Sprint 0 Review (Friday 4pm)

**Agenda:**
1. Demo: Show all 6 services running
2. Demo: Run test suite (0 failures)
3. Demo: Run E2E tests (5 passing)
4. Review: What went well?
5. Review: What can improve?
6. Decision: Ready for Sprint 1?

**Required Attendees:** Full team

---

## After Sprint 0

**Monday Week 2:**
- Resume original 8-week MVP roadmap (now Week 1)
- Set up GitHub Actions CI/CD
- Daily health checks become habit
- Test coverage enforcement begins

---

## Resources

**Documentation:**
- [E2E Test Report](E2E_TEST_REPORT_EXPERT_REVIEW.md) - Full expert review
- [Gap Analysis](MVP_GAP_ANALYSIS_COMPREHENSIVE.md) - All gaps documented
- [Development Roadmap](Development Roadmap Sprint Plan.md) - Full plan

**Quick Commands:**
```bash
# Check service health
docker-compose ps
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50

# Run tests
npm test                         # All tests
npm test -- decimal.test.ts      # Specific test
npm run test:e2e                 # E2E tests

# Build verification
npm run build                    # Backend
cd frontend && npm run build     # Frontend

# Start services
docker-compose up -d             # All services
docker-compose up -d backend     # Just backend
docker-compose restart backend   # Restart backend
```

---

## Contact

**Questions?** Post in #sprint-0-emergency Slack channel

**Blockers?** Tag @backend-lead or @devops immediately

**Need Help?** Pair programming encouraged!

---

**Let's fix these bugs and get back on track! 💪**

**Goal:** All green checkmarks by Friday 5pm ✅✅✅✅✅✅✅✅
