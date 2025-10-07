# Analytics & Tracking Specification

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Product & Engineering Team
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Analytics Tools](#analytics-tools)
3. [Event Taxonomy](#event-taxonomy)
4. [User Properties](#user-properties)
5. [Key Metrics & KPIs](#key-metrics--kpis)
6. [Dashboards](#dashboards)
7. [Funnel Analysis](#funnel-analysis)
8. [A/B Testing](#ab-testing)
9. [Privacy & Compliance](#privacy--compliance)
10. [Implementation](#implementation)

---

## 1. Overview

**Purpose:** Track user behavior, measure product success, and inform data-driven decisions

**Core Questions to Answer:**
- How many active users do we have? (DAU/WAU/MAU)
- Which features are most used?
- Where do users drop off in onboarding?
- Which acquisition channels convert best?
- Are paid users more engaged than free users?

**Analytics Philosophy:**
- **Track events, not pageviews**: Focus on user actions (e.g., "created_alert" not "visited_alerts_page")
- **Privacy-first**: No PII in analytics, GDPR/CCPA compliant
- **Actionable**: Every metric should inform a decision

---

## 2. Analytics Tools

### 2.1 Tool Stack

**Primary:** Mixpanel ($0-89/month)
- **Why:** Best for product analytics, user-centric tracking
- **Tier:** Free (100K events/month) → Growth ($89/month, 1M events)
- **Used for:** User behavior, funnels, retention, cohorts

**Secondary:** PostHog (Self-hosted, free)
- **Why:** Open-source, privacy-focused, session replay
- **Deployment:** Docker container on our AWS infrastructure
- **Used for:** Session replay, feature flags, heatmaps

**Error Tracking:** Sentry ($26/month)
- **Why:** Already using for error monitoring
- **Used for:** Track exceptions, performance issues

**Marketing:** Google Analytics 4 (Free)
- **Why:** SEO tracking, acquisition sources
- **Used for:** Traffic sources, landing page performance

### 2.2 Tool Comparison

| Feature | Mixpanel | PostHog | Google Analytics |
|---------|----------|---------|------------------|
| Event tracking | ✅ Excellent | ✅ Good | ⚠️ Limited |
| User profiles | ✅ Yes | ✅ Yes | ❌ No |
| Funnels | ✅ Yes | ✅ Yes | ⚠️ Basic |
| Retention | ✅ Yes | ✅ Yes | ❌ No |
| Session replay | ❌ No | ✅ Yes | ❌ No |
| A/B testing | ✅ Yes | ✅ Yes | ❌ No |
| Privacy | ⚠️ Cloud | ✅ Self-hosted | ⚠️ Google-owned |
| Cost | $0-89/mo | Free (self-host) | Free |

**Decision:** Use Mixpanel for product analytics + PostHog for session replay

---

## 3. Event Taxonomy

### 3.1 Event Naming Convention

**Format:** `<object>_<action>`

**Examples:**
- `portfolio_viewed` (not "user_viewed_portfolio")
- `holding_added` (not "added_holding")
- `alert_created` (not "create_alert")

**Categories:**

1. **Authentication**
   - `signup_started`
   - `signup_completed`
   - `email_verified`
   - `login_succeeded`
   - `login_failed`
   - `logout_clicked`

2. **Onboarding**
   - `onboarding_started`
   - `persona_selected`
   - `first_holding_added`
   - `exchange_connected`
   - `tutorial_completed`
   - `onboarding_abandoned`

3. **Portfolio**
   - `portfolio_viewed`
   - `holding_added`
   - `holding_edited`
   - `holding_deleted`
   - `portfolio_value_calculated`

4. **Alerts**
   - `alert_created`
   - `alert_edited`
   - `alert_deleted`
   - `alert_triggered`
   - `alert_limit_reached`

5. **Predictions**
   - `prediction_viewed`
   - `prediction_accuracy_checked`

6. **Subscription**
   - `upgrade_clicked`
   - `checkout_started`
   - `subscription_created`
   - `subscription_cancelled`
   - `payment_failed`

7. **Engagement**
   - `session_started`
   - `feature_discovered`
   - `help_article_viewed`
   - `feedback_submitted`

### 3.2 Event Properties

**Standard properties (every event):**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-10-07T14:30:00Z",
  "platform": "web",  // or "mobile", "api"
  "device": "desktop",  // or "mobile", "tablet"
  "browser": "Chrome 118",
  "os": "macOS 14.1",
  "screen_size": "1920x1080",
  "session_id": "sess_abc123",
  "app_version": "1.2.3"
}
```

**Event-specific properties:**

**Example: `holding_added`**
```json
{
  "asset_symbol": "BTC",
  "quantity": 0.5,
  "entry_method": "manual",  // or "api_import"
  "exchange": null,  // or "binance"
  "has_purchase_price": true,
  "time_since_signup": 120  // seconds
}
```

**Example: `alert_created`**
```json
{
  "alert_type": "price_alert",  // or "risk_alert"
  "asset_symbol": "ETH",
  "threshold_usd": 2500,
  "condition": "above",  // or "below"
  "channels": ["email", "push"],
  "user_tier": "free"
}
```

**Example: `subscription_created`**
```json
{
  "plan": "plus",  // or "pro", "power-trader"
  "billing_interval": "monthly",  // or "yearly"
  "amount_usd": 9.00,
  "coupon_code": "LAUNCH50",  // or null
  "trial_days": 7
}
```

---

## 4. User Properties

**Stored on user profile (updated on events):**

```json
{
  // Identity
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",  // Hashed in Mixpanel
  "created_at": "2025-10-01T10:00:00Z",

  // Subscription
  "tier": "plus",  // or "free", "pro", "power-trader"
  "subscription_status": "active",  // or "cancelled", "expired"
  "mrr": 9.00,  // Monthly recurring revenue
  "ltv": 45.00,  // Lifetime value (total paid)

  // Engagement
  "total_sessions": 42,
  "last_seen_at": "2025-10-07T14:30:00Z",
  "days_since_signup": 6,
  "onboarding_completed": true,

  // Portfolio stats
  "total_holdings": 5,
  "portfolio_value_usd": 25340.67,
  "exchanges_connected": 1,

  // Alerts
  "total_alerts": 3,
  "alerts_triggered": 12,

  // Acquisition
  "signup_source": "google-ads",  // or "organic", "twitter", etc.
  "utm_campaign": "crypto-tracker-q4",
  "referrer": "https://twitter.com"
}
```

**Update triggers:**
- `signup_completed` → Set `created_at`, `signup_source`
- `holding_added` → Increment `total_holdings`
- `subscription_created` → Set `tier`, `mrr`
- `session_started` → Increment `total_sessions`, update `last_seen_at`

---

## 5. Key Metrics & KPIs

### 5.1 Growth Metrics

**Active Users:**
- **DAU (Daily Active Users):** Unique users who log in each day
- **WAU (Weekly Active Users):** Unique users per week
- **MAU (Monthly Active Users):** Unique users per month
- **DAU/MAU Ratio:** Stickiness (target: >20%)

**Signups:**
- **New signups per day:** Target 10/day (MVP), 100/day (Month 12)
- **Signup conversion rate:** Visitors → Signups (target: 5%)

**Acquisition:**
- **Cost per Acquisition (CPA):** Ad spend / signups
- **Best channels:** Organic, Google Ads, Twitter, Reddit

### 5.2 Engagement Metrics

**Retention:**
- **Day 1 retention:** % of users who return next day (target: 60%)
- **Day 7 retention:** % who return in first week (target: 40%)
- **Day 30 retention:** % who return in first month (target: 25%)

**Session metrics:**
- **Sessions per user:** Target 20/month (daily check-ins)
- **Session duration:** Target 3 minutes
- **Bounce rate:** % of 1-session users (target: <30%)

**Feature adoption:**
- **% users with >1 holding:** Target 80%
- **% users with >1 alert:** Target 40%
- **% users who view predictions:** Target 60%

### 5.3 Revenue Metrics

**Conversion:**
- **Free → Paid conversion:** Target 10% within 30 days
- **Trial → Paid conversion:** Target 60%

**Revenue:**
- **MRR (Monthly Recurring Revenue):** Target $420K by Month 12
- **ARR (Annual Recurring Revenue):** MRR × 12
- **ARPU (Average Revenue Per User):** MRR / total users

**Churn:**
- **Monthly churn rate:** Target <5%
- **Reasons for churn:** Tracked via exit survey

### 5.4 Product Health

**Errors:**
- **Error rate:** Errors per 1,000 requests (target: <1%)
- **Crash-free users:** % users with no crashes (target: >99%)

**Performance:**
- **API response time:** p95 latency (target: <500ms)
- **Page load time:** p95 (target: <2 seconds)

---

## 6. Dashboards

### 6.1 Executive Dashboard (Weekly Review)

**Metrics:**
1. **MAU** (this month vs last month)
2. **New signups** (this week)
3. **MRR** (this month vs last month)
4. **Churn rate** (this month)
5. **Top 3 features** (by engagement)

**Chart: MAU Growth**
```
    MAU
3000 |                        ╱
2500 |                   ╱───╯
2000 |              ╱───╯
1500 |         ╱───╯
1000 |    ╱───╯
 500 |───╯
   0 +─────────────────────────────
     Jan Feb Mar Apr May Jun Jul Aug
```

**Chart: MRR Growth**
```
     MRR ($)
50K  |                        ╱
40K  |                   ╱───╯
30K  |              ╱───╯
20K  |         ╱───╯
10K  |    ╱───╯
  0  |───╯
     +─────────────────────────────
     Jan Feb Mar Apr May Jun Jul Aug
```

---

### 6.2 Product Dashboard (Daily Review)

**Metrics:**
1. **DAU** (today vs yesterday)
2. **New signups** (today)
3. **Feature usage** (top 5 features today)
4. **Alert triggers** (count)
5. **Error rate** (last 24h)

**Funnel: Onboarding Completion**
```
Signup: 100 users
   ↓ 90% (10 dropped)
Email verified: 90 users
   ↓ 75% (23 dropped)
First holding: 67 users
   ↓ 85% (10 dropped)
Onboarding complete: 57 users

Conversion: 57% (signup → complete)
```

---

### 6.3 Acquisition Dashboard (Marketing)

**Metrics:**
1. **Signups by source** (organic, paid, referral)
2. **Cost per acquisition** (by channel)
3. **Conversion rate** (by landing page)
4. **LTV/CAC ratio** (target: >3)

**Chart: Signups by Channel**
```
Organic:      ████████████████ 45%
Google Ads:   ██████████ 28%
Twitter:      ██████ 15%
Reddit:       ████ 8%
Other:        ██ 4%
```

---

## 7. Funnel Analysis

### 7.1 Signup Funnel

**Steps:**
1. **Visited landing page** (100%)
2. **Clicked "Sign Up"** (20%)
3. **Submitted form** (80% of clickers)
4. **Verified email** (90% of submitters)
5. **Added first holding** (70% of verified)
6. **Completed onboarding** (85% of holders)

**Overall conversion:** 100 visitors → 8.6 completed onboardings (8.6%)

**Drop-off analysis:**
- **Landing → Signup:** 80% drop (need better CTA)
- **Signup → Email verified:** 10% drop (reasonable)
- **Email → First holding:** 30% drop (simplify onboarding)

---

### 7.2 Upgrade Funnel (Free → Paid)

**Steps:**
1. **Free user active** (100%)
2. **Viewed upgrade prompt** (40%)
3. **Clicked "Upgrade"** (15% of viewers)
4. **Started checkout** (80% of clickers)
5. **Completed payment** (70% of starters)

**Overall conversion:** 100 free users → 3.36 paid (3.36%)

**Optimization opportunities:**
- Show upgrade prompts more (only 40% see them)
- Improve checkout flow (30% abandon)

---

## 8. A/B Testing

### 8.1 Testing Framework

**Tool:** PostHog Feature Flags + Experimentation

**Process:**
1. **Hypothesis:** "Changing CTA from 'Sign Up' to 'Get Started' will increase clicks by 20%"
2. **Create experiment:** 50/50 split (variant A vs B)
3. **Run for 2 weeks:** Collect 1,000+ samples per variant
4. **Analyze results:** Statistical significance test (p < 0.05)
5. **Ship winner:** Deploy to 100% of users

### 8.2 Active Experiments (Examples)

**Experiment 1: Signup CTA Wording**
- **Variant A:** "Create Free Account" (control)
- **Variant B:** "Start Tracking Free"
- **Metric:** Signup conversion rate
- **Status:** Running (Week 1/2)

**Experiment 2: Onboarding Flow**
- **Variant A:** Persona selection screen (control)
- **Variant B:** Skip persona, auto-detect
- **Metric:** Onboarding completion rate
- **Status:** Planning

**Experiment 3: Upgrade Prompt Timing**
- **Variant A:** Show after 3 days (control)
- **Variant B:** Show after 10 logins
- **Metric:** Free → Paid conversion
- **Status:** Complete (B won, +15% conversion)

### 8.3 Implementation

```typescript
import { useFeatureFlag } from 'posthog-js/react';

function SignupButton() {
  const variant = useFeatureFlag('signup-cta-test');

  const ctaText = variant === 'variant-b'
    ? 'Start Tracking Free'
    : 'Create Free Account';

  return (
    <button onClick={handleSignup}>
      {ctaText}
    </button>
  );
}
```

**Track experiment exposure:**
```typescript
analytics.track('experiment_viewed', {
  experimentId: 'signup-cta-test',
  variant: 'variant-b',
  userId: user.id
});
```

---

## 9. Privacy & Compliance

### 9.1 GDPR Compliance

**User rights:**
- **Right to access:** Export all analytics data on user request
- **Right to deletion:** Delete all analytics data on request
- **Right to opt-out:** Disable analytics tracking

**Implementation:**
```typescript
// Check user's analytics consent
if (user.analytics_consent === true) {
  analytics.track('portfolio_viewed', { userId: user.id });
} else {
  // Skip tracking
}
```

**Consent banner:**
```
┌────────────────────────────────────────────┐
│ 🍪 We use analytics to improve your       │
│ experience. No personal data is sold.     │
│                                            │
│ [Accept] [Decline] [Customize]            │
└────────────────────────────────────────────┘
```

### 9.2 Data Anonymization

**PII handling:**
- **Email:** SHA-256 hash before sending to Mixpanel
- **IP address:** Truncate last octet (192.168.1.XXX)
- **User ID:** UUID (no connection to real identity)

**Example:**
```typescript
import crypto from 'crypto';

const emailHash = crypto
  .createHash('sha256')
  .update(user.email)
  .digest('hex');

mixpanel.people.set({
  $email: emailHash,  // Not raw email
  $created: user.createdAt
});
```

### 9.3 Data Retention

**Retention policy:**
- **Event data:** 2 years (then deleted)
- **User profiles:** Deleted 30 days after account deletion
- **Session replays:** 30 days (PostHog auto-deletes)

**Compliance table:**
```sql
-- Auto-delete old events (run monthly)
DELETE FROM analytics_events
WHERE timestamp < NOW() - INTERVAL '2 years';
```

---

## 10. Implementation

### 10.1 Analytics SDK Setup

**Frontend (React):**
```typescript
import mixpanel from 'mixpanel-browser';
import posthog from 'posthog-js';

// Initialize on app load
mixpanel.init(process.env.MIXPANEL_TOKEN, {
  api_host: 'https://api.mixpanel.com',
  disable_persistence: false,
  cross_subdomain_cookie: true
});

posthog.init(process.env.POSTHOG_TOKEN, {
  api_host: 'https://analytics.coinsphere.io',
  autocapture: false  // Only track explicit events
});

// Wrapper function for all tracking
export const analytics = {
  track: (event: string, properties?: object) => {
    if (!user.analytics_consent) return;

    mixpanel.track(event, properties);
    posthog.capture(event, properties);
  },

  identify: (userId: string, traits?: object) => {
    mixpanel.identify(userId);
    mixpanel.people.set(traits);

    posthog.identify(userId, traits);
  },

  reset: () => {
    mixpanel.reset();
    posthog.reset();
  }
};
```

**Backend (Node.js):**
```typescript
import Mixpanel from 'mixpanel';

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);

// Track server-side events
export function trackEvent(userId: string, event: string, properties?: object) {
  mixpanel.track(event, {
    distinct_id: userId,
    ...properties
  });
}

// Example: Alert triggered
trackEvent(alert.userId, 'alert_triggered', {
  alertType: alert.type,
  assetSymbol: alert.assetSymbol,
  threshold: alert.thresholdUsd
});
```

### 10.2 Common Tracking Patterns

**Track page views:**
```typescript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    analytics.track('page_viewed', {
      path: location.pathname,
      referrer: document.referrer
    });
  }, [location]);
}
```

**Track button clicks:**
```typescript
function UpgradeButton() {
  const handleClick = () => {
    analytics.track('upgrade_clicked', {
      location: 'dashboard_banner',
      currentTier: user.tier
    });

    navigate('/upgrade');
  };

  return <button onClick={handleClick}>Upgrade to Plus</button>;
}
```

**Track form submissions:**
```typescript
function CreateAlertForm() {
  const onSubmit = async (data: AlertFormData) => {
    analytics.track('alert_created', {
      alertType: data.type,
      assetSymbol: data.assetSymbol,
      threshold: data.thresholdUsd,
      channels: [data.emailEnabled && 'email', data.pushEnabled && 'push'].filter(Boolean)
    });

    await createAlert(data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>;
}
```

### 10.3 Testing Analytics

**Automated tests:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { analytics } from '@/lib/analytics';

jest.mock('@/lib/analytics');

test('tracks upgrade_clicked event', () => {
  render(<UpgradeButton />);

  fireEvent.click(screen.getByText('Upgrade to Plus'));

  expect(analytics.track).toHaveBeenCalledWith('upgrade_clicked', {
    location: 'dashboard_banner',
    currentTier: 'free'
  });
});
```

**Manual QA checklist:**
- [ ] Check Mixpanel live events (events appear within 10 seconds)
- [ ] Verify user properties update correctly
- [ ] Test on incognito (no tracking if no consent)
- [ ] Test on mobile (events work on iOS/Android)

---

## Appendix A: Event Catalog

**Complete list of tracked events (50+ events):**

| Category | Event Name | Frequency | Priority |
|----------|------------|-----------|----------|
| **Auth** | `signup_completed` | Low | High |
| **Auth** | `login_succeeded` | High | Medium |
| **Onboarding** | `first_holding_added` | Low | High |
| **Onboarding** | `tutorial_completed` | Low | High |
| **Portfolio** | `portfolio_viewed` | High | Medium |
| **Portfolio** | `holding_added` | Medium | High |
| **Alerts** | `alert_created` | Medium | High |
| **Alerts** | `alert_triggered` | High | High |
| **Subscription** | `subscription_created` | Low | High |
| **Subscription** | `payment_failed` | Low | High |

*Full catalog: See [Event Taxonomy Google Sheet]*

---

## Appendix B: SQL Queries for Dashboards

**DAU calculation:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM analytics_events
WHERE event = 'session_started'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

**Retention cohort:**
```sql
WITH signups AS (
  SELECT user_id, DATE(created_at) as signup_date
  FROM users
  WHERE created_at >= '2025-01-01'
),
activity AS (
  SELECT user_id, DATE(created_at) as activity_date
  FROM analytics_events
  WHERE event = 'session_started'
)
SELECT
  s.signup_date,
  COUNT(DISTINCT s.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_date = s.signup_date + 1 THEN a.user_id END) as day_1,
  COUNT(DISTINCT CASE WHEN a.activity_date = s.signup_date + 7 THEN a.user_id END) as day_7,
  COUNT(DISTINCT CASE WHEN a.activity_date = s.signup_date + 30 THEN a.user_id END) as day_30
FROM signups s
LEFT JOIN activity a ON s.user_id = a.user_id
GROUP BY s.signup_date
ORDER BY s.signup_date;
```

---

**Document End**

*Analytics implementation will begin in Sprint 1 alongside core feature development.*
