# TODO: E2E Testing Issues & Improvements

**Product Owner Assessment Date:** October 9, 2025
**Current Test Pass Rate:** 84.8% (39/46 tests passing)
**Target Pass Rate:** 95%+
**Launch Readiness:** ⚠️ Not Recommended (Critical Gaps Exist)

---

## 🚨 CRITICAL BLOCKERS (Must Fix Before MVP Launch)

### P1-001: Missing Settings Page E2E Tests
**Status:** ❌ Not Started
**Priority:** P1 - Blocker
**Effort:** 3 hours
**Assigned To:** QA/Dev Team
**Sprint:** Pre-Launch Sprint

**Description:**
No end-to-end tests exist for the Settings page user flows. This is a core MVP feature that allows users to manage their profile and preferences.

**Required Test Coverage:**
- [ ] Display settings page with user profile information
- [ ] Update user profile (name, email, avatar)
- [ ] Change password functionality
- [ ] Email verification flow
- [ ] Notification preferences toggle
- [ ] Theme preferences (if applicable)
- [ ] Form validation errors
- [ ] Success/error toast notifications

**Acceptance Criteria:**
- All settings page interactions must have E2E coverage
- Tests must validate both happy path and error scenarios
- Form validation must be tested for all fields

**Test File Location:** `e2e/04-settings-page.spec.ts`

**Estimated Test Count:** 8-10 tests

**Blocked Items:**
- MVP launch confidence at 95%+
- Settings page regression detection

---

### P1-002: Missing Alerts Management E2E Tests
**Status:** ❌ Not Started
**Priority:** P1 - Blocker
**Effort:** 3 hours
**Assigned To:** QA/Dev Team
**Sprint:** Pre-Launch Sprint

**Description:**
Alert creation via API is tested, but no UI-level E2E tests exist for the complete alerts management workflow. Alerts are a core value proposition feature.

**Required Test Coverage:**
- [ ] Display alerts page with existing alerts list
- [ ] Create new price alert (above/below threshold)
- [ ] Create new risk score alert
- [ ] Edit existing alert
- [ ] Delete alert with confirmation
- [ ] Toggle alert active/inactive
- [ ] Test alert form validation
- [ ] Test empty state (no alerts)
- [ ] Test alert notification display
- [ ] Test real-time alert triggering

**Acceptance Criteria:**
- Complete CRUD operations for alerts must be tested
- Alert triggering mechanism must be validated
- UI must handle empty and populated states

**Test File Location:** `e2e/05-alerts-management.spec.ts`

**Estimated Test Count:** 10-12 tests

**Blocked Items:**
- MVP launch confidence at 95%+
- Alerts feature regression detection
- User value proposition validation

---

### P1-003: Missing Transaction Management E2E Tests
**Status:** ❌ Not Started
**Priority:** P1 - Blocker
**Effort:** 3 hours
**Assigned To:** QA/Dev Team
**Sprint:** Pre-Launch Sprint

**Description:**
Transaction history display is tested, but no tests exist for creating, editing, or deleting transactions. This is critical for portfolio accuracy.

**Required Test Coverage:**
- [ ] Add new transaction (Buy)
- [ ] Add new transaction (Sell)
- [ ] Add new transaction (Transfer)
- [ ] Edit existing transaction
- [ ] Delete transaction with confirmation
- [ ] Test transaction form validation
- [ ] Test date picker functionality
- [ ] Test amount/quantity validation
- [ ] Test asset selection dropdown
- [ ] Test transaction history updates after add/edit/delete
- [ ] Test portfolio value recalculation after transaction changes

**Acceptance Criteria:**
- Complete CRUD operations for transactions must be tested
- Portfolio calculations must be validated after transaction changes
- Form validation must prevent invalid data entry

**Test File Location:** `e2e/06-transaction-management.spec.ts`

**Estimated Test Count:** 11-13 tests

**Blocked Items:**
- MVP launch confidence at 95%+
- Portfolio accuracy validation
- Data integrity assurance

---

## 🔧 HIGH PRIORITY FIXES (Should Fix Before Launch)

### P2-001: Remove Deprecated Test File (Legacy API Tests)
**Status:** ❌ Not Started
**Priority:** P2 - High
**Effort:** 5 minutes
**Assigned To:** Dev Team
**Sprint:** Pre-Launch Sprint

**Description:**
The file `e2e/03-api-integration.spec.ts` contains 6 failing tests that use the old API integration pattern without CSRF protection. These tests are superseded by `e2e/03-api-integration-fixed.spec.ts`.

**Failing Tests:**
1. ❌ should fetch tokens list
2. ❌ should fetch ML predictions for BTC
3. ❌ should fetch risk score for ETH
4. ❌ should create portfolio with authentication
5. ❌ should create alert with authentication
6. ❌ should handle token refresh

**Root Cause:**
Tests are making API calls without CSRF tokens, which are now required by the backend security middleware.

**Action Required:**
```bash
# Delete deprecated test file
rm e2e/03-api-integration.spec.ts

# Keep only the CSRF-protected version
# e2e/03-api-integration-fixed.spec.ts
```

**Acceptance Criteria:**
- [ ] Delete `e2e/03-api-integration.spec.ts`
- [ ] Verify `e2e/03-api-integration-fixed.spec.ts` has equivalent coverage
- [ ] Run test suite and confirm all API tests pass
- [ ] Update test count documentation (46 → 40 tests)

**Impact:**
- Reduces test noise from 7 failures to 1 failure
- Eliminates confusion about which tests are current
- Improves test pass rate from 84.8% to 90%

**Files to Change:**
- DELETE: `e2e/03-api-integration.spec.ts`

---

### P2-002: Add Error Handling E2E Tests
**Status:** ❌ Not Started
**Priority:** P2 - High
**Effort:** 4 hours
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 2 (Post-Launch)

**Description:**
Limited test coverage exists for error scenarios, network failures, and edge cases. This impacts confidence in application resilience.

**Required Test Coverage:**
- [ ] API timeout scenarios (slow network)
- [ ] API 500 errors (server errors)
- [ ] API 404 errors (resource not found)
- [ ] Malformed API responses
- [ ] Network disconnection during operation
- [ ] Rate limiting (429 errors)
- [ ] Authentication token expiration
- [ ] CSRF token expiration
- [ ] WebSocket connection failures
- [ ] Real-time update failures

**Acceptance Criteria:**
- Application must gracefully handle all error scenarios
- Users must see appropriate error messages
- Application must not crash or show blank screens
- Retry mechanisms must be tested

**Test File Location:** `e2e/07-error-handling.spec.ts`

**Estimated Test Count:** 10-12 tests

---

### P2-003: Add Edge Case E2E Tests
**Status:** ❌ Not Started
**Priority:** P2 - High
**Effort:** 5 hours
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 2 (Post-Launch)

**Description:**
No tests exist for edge cases that could cause poor user experience or performance issues.

**Required Test Coverage:**
- [ ] Empty portfolio state (new user)
- [ ] Large portfolio (100+ assets)
- [ ] Large transaction history (500+ transactions)
- [ ] Special characters in inputs (', ", <, >)
- [ ] XSS attempt prevention
- [ ] SQL injection prevention (via API)
- [ ] Extremely long asset names
- [ ] Negative transaction amounts
- [ ] Zero-value portfolios
- [ ] Future dates in transaction history
- [ ] Concurrent user sessions (multiple tabs)
- [ ] Browser back/forward navigation

**Acceptance Criteria:**
- Application must handle edge cases gracefully
- Performance must remain acceptable with large datasets
- Security measures must prevent injection attacks
- UI must not break with unusual inputs

**Test File Location:** `e2e/08-edge-cases.spec.ts`

**Estimated Test Count:** 12-15 tests

---

## 🐛 MINOR BUGS (Nice to Fix)

### P3-001: Button Hover State Test Assertion Failure
**Status:** ❌ Not Started
**Priority:** P3 - Low
**Effort:** 2 minutes
**Assigned To:** Dev Team
**Sprint:** Pre-Launch Sprint (Quick Win)

**Description:**
Test expects `rgb()` color format, but modern browsers return `oklab()` color space. This is a test issue, not a design bug.

**Failing Test:**
`e2e/03-ux-fidelity.spec.ts:216` - Design System: Interactive States - Button Hover

**Error Message:**
```
Expected substring: "rgb"
Received string: "oklab(0.623018 -0.0332199 -0.185032 / 0.9)"
```

**Root Cause:**
Modern browsers use oklab color space for better color accuracy. Test assertion is too strict.

**Fix Required:**
```typescript
// File: e2e/03-ux-fidelity.spec.ts:216
// Current (WRONG):
expect(hoverBg).toContain('rgb');

// Fixed (CORRECT):
expect(hoverBg).toMatch(/rgb|oklab/);
```

**Acceptance Criteria:**
- [ ] Update test assertion to accept both `rgb` and `oklab` formats
- [ ] Run test and verify it passes
- [ ] Test pass rate improves to 87% (40/46) or 100% (40/40 after P2-001 fix)

**Files to Change:**
- EDIT: `e2e/03-ux-fidelity.spec.ts` (line 216)

**Impact:**
- Increases UX fidelity test pass rate from 90% to 100%
- Eliminates false positive test failure

---

## 📊 ENHANCEMENTS (Future Improvements)

### P4-001: Add Performance E2E Tests
**Status:** ❌ Not Started
**Priority:** P4 - Enhancement
**Effort:** 3 hours
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 3 (Future)

**Description:**
No performance benchmarks or tests exist to validate application speed and responsiveness.

**Required Test Coverage:**
- [ ] Page load time < 3 seconds (dashboard)
- [ ] Time to interactive < 5 seconds
- [ ] Real-time update latency < 1 second
- [ ] Large data set rendering performance
- [ ] API response times < 500ms
- [ ] WebSocket connection establishment < 2 seconds
- [ ] Chart rendering performance
- [ ] Scroll performance with large tables

**Acceptance Criteria:**
- All performance metrics must meet SLA targets
- Tests must fail if performance degrades
- Performance must be tested on slow 3G network simulation

**Test File Location:** `e2e/09-performance.spec.ts`

**Estimated Test Count:** 8-10 tests

---

### P4-002: Add Accessibility (a11y) E2E Tests
**Status:** ❌ Not Started
**Priority:** P4 - Enhancement
**Effort:** 4 hours
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 3 (Future)

**Description:**
No accessibility tests exist to validate WCAG 2.1 AA compliance.

**Required Test Coverage:**
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader compatibility (aria-labels)
- [ ] Color contrast ratios (WCAG AA)
- [ ] Focus indicators visible
- [ ] Form labels properly associated
- [ ] Alt text for images
- [ ] Skip navigation links
- [ ] Heading hierarchy (h1-h6)

**Test File Location:** `e2e/10-accessibility.spec.ts`

**Estimated Test Count:** 8-12 tests

---

### P4-003: Add Multi-Browser E2E Tests
**Status:** ❌ Not Started
**Priority:** P4 - Enhancement
**Effort:** 2 hours (config)
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 3 (Future)

**Description:**
Tests currently run only on Chromium. Need cross-browser validation.

**Action Required:**
```typescript
// File: playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },    // ADD
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },      // ADD
  { name: 'mobile', use: { ...devices['iPhone 13'] } },          // ADD
]
```

**Acceptance Criteria:**
- [ ] All tests pass on Chrome, Firefox, Safari
- [ ] All tests pass on mobile viewport
- [ ] CI/CD pipeline runs all browser tests

---

### P4-004: Add Visual Regression Testing
**Status:** ❌ Not Started
**Priority:** P4 - Enhancement
**Effort:** 6 hours
**Assigned To:** QA/Dev Team
**Sprint:** Sprint 4 (Future)

**Description:**
No visual regression testing exists to catch unintended UI changes.

**Tools to Consider:**
- Percy.io
- Chromatic
- Playwright's built-in screenshot comparison

**Required Coverage:**
- [ ] Login page baseline screenshot
- [ ] Dashboard baseline screenshot
- [ ] Settings page baseline screenshot
- [ ] Alerts page baseline screenshot
- [ ] Mobile responsive baselines

**Test File Location:** `e2e/11-visual-regression.spec.ts`

---

## 📈 METRICS & TRACKING

### Current Test Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Tests** | 46 | 70+ | 🟡 66% |
| **Pass Rate** | 84.8% | 95%+ | 🔴 Below |
| **Critical Path Coverage** | 100% | 100% | 🟢 Met |
| **Core Features Coverage** | 70% | 90%+ | 🟡 Gaps |
| **Design Fidelity** | 99% | 95%+ | 🟢 Excellent |
| **Security Testing** | 100% | 100% | 🟢 Excellent |

### Test Coverage by Feature
| Feature | Tests | Status | Coverage |
|---------|-------|--------|----------|
| Authentication | 8 | ✅ Pass | 100% |
| Dashboard | 9 | ✅ Pass | 100% |
| Portfolio API | 4 | ✅ Pass | 100% |
| Alert API | 2 | ✅ Pass | 100% |
| Settings UI | 0 | ❌ None | 0% |
| Alerts UI | 0 | ❌ None | 0% |
| Transactions UI | 0 | ❌ None | 0% |
| Error Handling | 0 | ❌ None | 0% |
| Edge Cases | 0 | ❌ None | 0% |

### Launch Readiness Scorecard
- ✅ **Authentication Flow:** 100% (8/8 tests passing)
- ✅ **Dashboard Display:** 100% (9/9 tests passing)
- ✅ **API Security:** 100% (10/10 CSRF tests passing)
- ✅ **Design System:** 99% (9/10 tests passing)
- ❌ **Settings Page:** 0% (0 tests)
- ❌ **Alerts Management:** 0% (0 tests)
- ❌ **Transaction Management:** 0% (0 tests)

**Overall MVP Readiness:** 🟡 **70%** (Not Launch Ready)

---

## 🗓️ SPRINT PLAN TO 95% COVERAGE

### Pre-Launch Sprint (2 days, 12 hours total)

#### Day 1 - Add Critical Tests (8 hours)
**Morning (3 hours):**
- [ ] P1-001: Create `e2e/04-settings-page.spec.ts` (3 hours)
  - [ ] Add 8-10 settings page tests
  - [ ] Run and validate all tests pass

**Afternoon (3 hours):**
- [ ] P1-002: Create `e2e/05-alerts-management.spec.ts` (3 hours)
  - [ ] Add 10-12 alerts management tests
  - [ ] Run and validate all tests pass

**Evening (2 hours):**
- [ ] P1-003: Create `e2e/06-transaction-management.spec.ts` (2 hours)
  - [ ] Add 11-13 transaction management tests
  - [ ] Run and validate all tests pass

#### Day 2 - Cleanup & Validation (4 hours)
**Morning (2 hours):**
- [ ] P3-001: Fix button hover test assertion (2 minutes)
- [ ] P2-001: Delete deprecated API test file (5 minutes)
- [ ] Run full test suite (10 minutes)
- [ ] Fix any failing tests (1.5 hours)

**Afternoon (2 hours):**
- [ ] Run full test suite 3 times to validate stability
- [ ] Generate HTML test report
- [ ] Review test coverage metrics
- [ ] Make launch/no-launch decision

**Expected Results After Sprint:**
- Total Tests: ~70
- Pass Rate: 95%+
- Core Feature Coverage: 95%+
- Launch Readiness: ✅ **Ready**

---

## 📋 CHECKLIST: PRE-LAUNCH VALIDATION

### Must Complete Before Launch
- [ ] P1-001: Settings page E2E tests added (8-10 tests)
- [ ] P1-002: Alerts management E2E tests added (10-12 tests)
- [ ] P1-003: Transaction management E2E tests added (11-13 tests)
- [ ] P2-001: Deprecated test file deleted
- [ ] P3-001: Button hover test fixed
- [ ] Full test suite passes at 95%+ rate
- [ ] All tests run successfully 3 consecutive times
- [ ] Test report generated and reviewed
- [ ] No P1 blockers remaining

### Nice to Have Before Launch
- [ ] P2-002: Error handling tests added
- [ ] P2-003: Edge case tests added
- [ ] Multi-browser testing enabled
- [ ] Performance benchmarks established

---

## 🎯 SUCCESS CRITERIA

### Minimum Viable Test Coverage (Launch Threshold)
- ✅ Authentication: 100% coverage
- ✅ Dashboard: 100% coverage
- ✅ Settings: 80%+ coverage (**ADD**)
- ✅ Alerts: 80%+ coverage (**ADD**)
- ✅ Transactions: 80%+ coverage (**ADD**)
- ✅ API Security: 100% coverage
- ✅ Design System: 95%+ coverage

### Launch Decision Criteria
- [ ] **Test Pass Rate:** 95%+ (currently 84.8%)
- [ ] **Critical Path:** 100% covered (currently 100% ✅)
- [ ] **P1 Blockers:** 0 (currently 3 ❌)
- [ ] **Stability:** 3 consecutive successful runs
- [ ] **Documentation:** All test results documented

---

## 📞 ESCALATION & COMMUNICATION

### Who to Notify
- **Product Owner (Sarah):** When blockers are resolved
- **Engineering Lead:** If effort estimates exceeded by 20%+
- **QA Lead:** If new issues discovered during test creation
- **Stakeholders:** When launch readiness reaches 95%+

### Status Update Cadence
- **Daily Standups:** Report progress on P1 items
- **End of Day 1:** Report test count and initial pass rate
- **End of Day 2:** Final launch readiness assessment

---

## 🔗 RELATED DOCUMENTS

- **Test Results Report:** `UX_FIDELITY_REPORT.md`
- **Design System:** `DESIGN_SYSTEM.md`
- **Product Strategy:** `Documentation/PRODUCT_STRATEGY.md`
- **Sprint Plan:** `Documentation/Development Roadmap Sprint Plan.md`
- **Test Config:** `playwright.config.ts`

---

## ✅ COMPLETION TRACKING

### Quick Status View
```
P1 Blockers:     ▢▢▢ (0/3 complete) ❌
P2 High Priority: ▢▢ (0/2 complete) 🟡
P3 Minor Bugs:    ▢ (0/1 complete) 🟡
P4 Enhancements:  ▢▢▢▢ (0/4 complete) ⚪

Launch Readiness: 70% → Target: 95%+
```

---

**Last Updated:** October 9, 2025
**Document Owner:** Sarah (Product Owner)
**Next Review:** After Pre-Launch Sprint completion

---

## 📝 NOTES & ASSUMPTIONS

1. **Effort estimates** assume developer familiarity with Playwright
2. **Test counts** are estimates and may vary by ±20%
3. **Pass rate targets** assume no major bugs discovered during test creation
4. **Launch readiness** is gated on P1 items only; P2-P4 are post-launch improvements
5. **Backend/Frontend services** must be running for E2E tests to execute
6. **Test data** cleanup between test runs is assumed to be handled automatically

---

**END OF DOCUMENT**
