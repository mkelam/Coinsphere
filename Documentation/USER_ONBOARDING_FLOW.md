# User Onboarding Flow Specification

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** Product & UX Team
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Onboarding Goals](#onboarding-goals)
3. [User Segmentation](#user-segmentation)
4. [Onboarding Flow Steps](#onboarding-flow-steps)
5. [Screen-by-Screen Breakdown](#screen-by-screen-breakdown)
6. [Empty States](#empty-states)
7. [Upgrade Prompts](#upgrade-prompts)
8. [Success Metrics](#success-metrics)
9. [Technical Implementation](#technical-implementation)

---

## 1. Overview

The onboarding flow is the critical first user experience that converts new signups into active users. Our goal is to get users to their "aha moment" within **3 minutes** of signup.

**Aha Moment:** User sees their first portfolio value and AI prediction

**Key Principles:**
- **Progressive disclosure**: Don't overwhelm with all features at once
- **Value first**: Show portfolio data ASAP, collect details later
- **Flexible entry**: Support both manual entry and exchange API import
- **Quick wins**: Free tier users should feel value immediately

**Time to Value:**
- **Manual entry path**: 2 minutes (signup → add 3 holdings → see portfolio)
- **API import path**: 5 minutes (signup → connect exchange → import → see portfolio)

---

## 2. Onboarding Goals

### 2.1 Primary Goals

1. **Account Creation** (90%+ completion rate)
   - Email verification
   - Password creation
   - Accept terms of service

2. **Portfolio Setup** (70%+ completion rate)
   - Add at least 1 holding (manual or API)
   - See portfolio value
   - View risk score

3. **Discover Core Features** (50%+ engagement)
   - See AI prediction for at least 1 asset
   - Understand risk score meaning
   - Know how to add more holdings

### 2.2 Secondary Goals

4. **First Alert Setup** (30%+ conversion)
   - Create 1 price or risk alert
   - Understand alert system

5. **Tier Awareness** (100% awareness)
   - Know they're on Free tier
   - See what Plus/Pro offers
   - Understand upgrade path

---

## 3. User Segmentation

### 3.1 Persona-Based Flows

**Beginner Investor**
- **Profile**: New to crypto, holds 1-3 coins (BTC, ETH)
- **Needs**: Simple tracking, basic alerts
- **Flow**: Manual entry → minimal setup → educational tooltips
- **Example**: "I just bought $500 of Bitcoin on Coinbase, want to track it"

**Active Trader**
- **Profile**: 10+ holdings, uses multiple exchanges
- **Needs**: Real-time sync, advanced alerts, predictions
- **Flow**: API import → bulk import → power user features
- **Example**: "I have 15 different coins across Binance and Kraken"

**Portfolio Manager**
- **Profile**: Managing $50K+, risk-conscious
- **Needs**: Risk analysis, diversification insights
- **Flow**: API import → risk dashboard focus → upgrade to Pro
- **Example**: "I need to monitor my $100K portfolio and reduce risk"

### 3.2 Flow Selection

**Question on signup page:**
```
How would you describe yourself?

○ New to crypto (I own 1-3 coins)
○ Active trader (I trade regularly)
○ Portfolio manager (I manage $10K+)
○ Just exploring (I don't own crypto yet)
```

**Flow routing:**
- New to crypto → Manual entry flow (faster, simpler)
- Active trader / Portfolio manager → API import flow
- Just exploring → Demo mode (pre-filled portfolio)

---

## 4. Onboarding Flow Steps

### 4.1 Manual Entry Flow (Beginner Path)

**Total time: 2-3 minutes**

```
Step 1: Signup (30 seconds)
  ├─ Email + Password
  ├─ Email verification (click link)
  └─ Account created ✓

Step 2: Welcome (15 seconds)
  ├─ "Welcome! Let's set up your portfolio"
  ├─ Choose persona (new/active/manager)
  └─ [Skip to Step 3]

Step 3: Add First Holding (60 seconds)
  ├─ Search for asset (e.g., "Bitcoin")
  ├─ Enter quantity (e.g., "0.5 BTC")
  ├─ Enter purchase price (optional)
  └─ [Add Holding] → Portfolio created ✓

Step 4: Aha Moment! (30 seconds)
  ├─ Show portfolio value ($25,340)
  ├─ Show risk score (28 - Established)
  ├─ Show AI prediction (7-day: BULLISH +5%)
  └─ Celebrate: "🎉 Your portfolio is ready!"

Step 5: Quick Tour (45 seconds)
  ├─ Tooltip: "This is your portfolio value"
  ├─ Tooltip: "Risk scores help you balance your portfolio"
  ├─ Tooltip: "AI predictions updated daily"
  └─ [Got It] → Dashboard

Step 6: Suggest Next Action (15 seconds)
  ├─ "Want to add more holdings?" [+ Add]
  ├─ "Set up a price alert?" [Create Alert]
  └─ [Maybe Later] → Done
```

### 4.2 API Import Flow (Advanced Path)

**Total time: 4-5 minutes**

```
Step 1-2: Same as manual flow

Step 3: Connect Exchange (120 seconds)
  ├─ "Connect your exchange to auto-import holdings"
  ├─ Select exchange (Binance/Coinbase/Kraken)
  ├─ Instructions: "Create read-only API key"
  ├─ [Show Me How] → Tutorial overlay
  ├─ Enter API key + secret
  ├─ [Test Connection] → ✓ Connected
  └─ [Import Holdings]

Step 4: Review Import (60 seconds)
  ├─ Show detected holdings (15 assets found)
  ├─ Checkboxes to select which to import
  ├─ "Select all" by default
  └─ [Confirm Import] → Portfolio created ✓

Step 5-6: Same as manual flow
```

### 4.3 Demo Mode (Explorer Path)

**Total time: 1 minute**

```
Step 1-2: Same (but "Just exploring" selected)

Step 3: Load Demo Portfolio
  ├─ "No problem! Here's a sample portfolio to explore"
  ├─ Pre-filled: 40% BTC, 30% ETH, 20% SOL, 10% MATIC
  ├─ Value: $50,000 (fake data, clearly labeled)
  └─ [Explore Demo] → Dashboard

Step 4: Limited Tour
  ├─ Banner: "This is a demo portfolio. Add your own holdings anytime!"
  ├─ All features work (but data is fake)
  └─ Persistent CTA: [Add Real Holdings]
```

---

## 5. Screen-by-Screen Breakdown

### 5.1 Screen 1: Signup

**Layout:**
```
┌────────────────────────────────────┐
│  COINSPHERE                    [X] │
│                                    │
│  Track Your Crypto Portfolio       │
│  Get AI-Powered Predictions        │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Email                        │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Password                     │ │
│  └──────────────────────────────┘ │
│                                    │
│  □ I agree to Terms & Privacy      │
│                                    │
│  [   Create Free Account   ]       │
│                                    │
│  Already have an account? Log in   │
└────────────────────────────────────┘
```

**Validation:**
- Email: Valid format, not already registered
- Password: Min 8 chars, 1 uppercase, 1 number
- Terms: Must be checked

**Error states:**
```
❌ Email already registered → "This email is taken. Try logging in instead?"
❌ Weak password → "Password must be 8+ chars with 1 uppercase and 1 number"
❌ Terms not checked → "Please accept our terms to continue"
```

---

### 5.2 Screen 2: Email Verification

**Immediately after signup:**
```
┌────────────────────────────────────┐
│                                    │
│        📧                          │
│                                    │
│  Check Your Email                  │
│                                    │
│  We sent a verification link to:   │
│  user@example.com                  │
│                                    │
│  Click the link to activate your   │
│  account and continue.             │
│                                    │
│  Didn't receive it?                │
│  [Resend Email]                    │
│                                    │
└────────────────────────────────────┘
```

**Email content:**
```
Subject: Verify your Coinsphere account

Hi there!

Welcome to Coinsphere! Click the link below to verify your email:

[Verify Email →]  (expires in 24 hours)

If you didn't create an account, you can safely ignore this email.

---
Coinsphere Team
```

**After clicking link:**
→ Redirect to `/onboarding/welcome` (Step 3)

---

### 5.3 Screen 3: Welcome & Persona Selection

```
┌────────────────────────────────────┐
│                                    │
│  Welcome to Coinsphere! 👋         │
│                                    │
│  Let's set up your portfolio in    │
│  under 3 minutes.                  │
│                                    │
│  How would you describe yourself?  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ ○ New to crypto             │  │
│  │   (I own 1-3 coins)         │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ ○ Active trader             │  │
│  │   (I trade regularly)       │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ ○ Portfolio manager         │  │
│  │   (I manage $10K+)          │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ ○ Just exploring            │  │
│  │   (I don't own crypto yet)  │  │
│  └─────────────────────────────┘  │
│                                    │
│  [        Continue        ]        │
│                                    │
└────────────────────────────────────┘
```

**Routing logic:**
```typescript
if (persona === 'new') {
  navigate('/onboarding/add-holding');  // Manual entry
} else if (persona === 'active' || persona === 'manager') {
  navigate('/onboarding/connect-exchange');  // API import
} else if (persona === 'explorer') {
  navigate('/onboarding/demo');  // Demo mode
}
```

---

### 5.4 Screen 4A: Add Holding (Manual Path)

```
┌────────────────────────────────────┐
│  [← Back]              Step 1 of 1 │
│                                    │
│  Add Your First Holding            │
│                                    │
│  Don't worry, you can add more     │
│  later or connect an exchange.     │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Search for asset... 🔍       │ │
│  └──────────────────────────────┘ │
│    ↓ (as user types "bit")        │
│  ┌──────────────────────────────┐ │
│  │ 🟡 Bitcoin (BTC)             │ │
│  │ 🔵 Bitcoin Cash (BCH)        │ │
│  └──────────────────────────────┘ │
│                                    │
│  [User selects Bitcoin]            │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ How much BTC do you own?     │ │
│  │ [    0.5    ] BTC            │ │
│  └──────────────────────────────┘ │
│                                    │
│  Purchase price (optional)         │
│  ┌──────────────────────────────┐ │
│  │ [$  45,000  ] per BTC        │ │
│  └──────────────────────────────┘ │
│  💡 Helps calculate profit/loss    │
│                                    │
│  [    Add to Portfolio    ]        │
│                                    │
│  Or [Connect Exchange Instead]     │
└────────────────────────────────────┘
```

**Validation:**
- Quantity: Must be > 0, max 12 decimal places
- Purchase price: Optional, but must be > 0 if provided

**After adding:**
→ Redirect to `/onboarding/success` (Aha moment screen)

---

### 5.5 Screen 4B: Connect Exchange (API Path)

```
┌────────────────────────────────────┐
│  [← Back]              Step 1 of 2 │
│                                    │
│  Connect Your Exchange             │
│                                    │
│  Automatically sync your holdings  │
│  from 20+ exchanges                │
│                                    │
│  Select your exchange:             │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [Binance Logo]  Binance     │ │
│  │  Most popular worldwide      │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [Coinbase Logo] Coinbase    │ │
│  │  Popular in US               │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [Kraken Logo]   Kraken      │ │
│  │  Popular in Europe           │ │
│  └──────────────────────────────┘ │
│                                    │
│  [Show More Exchanges...]          │
│                                    │
│  Or [Add Holdings Manually]        │
└────────────────────────────────────┘
```

**After selecting exchange (e.g., Binance):**

```
┌────────────────────────────────────┐
│  [← Back]              Step 1 of 2 │
│                                    │
│  Connect Binance                   │
│                                    │
│  🔒 We only need read-only access  │
│     (we can't trade or withdraw)   │
│                                    │
│  How to get your API key:          │
│  1. Log in to Binance              │
│  2. Go to Account → API Management │
│  3. Create API Key                 │
│  4. Enable "Read Info" only        │
│  5. Copy key and secret below      │
│                                    │
│  [📺 Watch Video Tutorial]         │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ API Key                      │ │
│  │ [                          ] │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ API Secret                   │ │
│  │ [                          ] │ │
│  └──────────────────────────────┘ │
│                                    │
│  [   Test Connection   ]           │
│                                    │
│  ✓ Connected successfully!         │
│  Found 12 holdings                 │
│                                    │
│  [    Import Holdings    ]         │
└────────────────────────────────────┘
```

**After import:**
→ Redirect to `/onboarding/success`

---

### 5.6 Screen 5: Aha Moment (Success)

```
┌────────────────────────────────────┐
│                                    │
│          🎉                        │
│                                    │
│  Your Portfolio is Ready!          │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  Total Value                 │ │
│  │  $25,340.67                  │ │
│  │  +$2,450 (+10.7%) all-time   │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  Portfolio Risk Score        │ │
│  │  28 / 100                    │ │
│  │  Established (Low risk)      │ │
│  └──────────────────────────────┘ │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  AI Prediction (7-day)       │ │
│  │  BULLISH 🚀                  │ │
│  │  +5.2% expected (72% conf.)  │ │
│  └──────────────────────────────┘ │
│                                    │
│  [   View Full Dashboard   ]       │
│                                    │
└────────────────────────────────────┘
```

**Auto-advance after 3 seconds** → Dashboard with tutorial tooltips

---

### 5.7 Screen 6: Interactive Tutorial (Dashboard)

**Tooltip sequence (appears one at a time):**

```
Tooltip 1: Portfolio Overview
┌─────────────────────────────────────┐
│ This is your portfolio overview     │
│ It updates in real-time as prices   │
│ change.                              │
│                                      │
│ [Next] [Skip Tour]                   │
└─────────────────────────────────────┘
         ↓ (pointing to portfolio card)

Tooltip 2: Holdings Table
┌─────────────────────────────────────┐
│ Your holdings are listed here.      │
│ Each shows current value, risk      │
│ score, and AI prediction.            │
│                                      │
│ [Next] [Skip Tour]                   │
└─────────────────────────────────────┘
         ↓ (pointing to holdings table)

Tooltip 3: Add Holdings
┌─────────────────────────────────────┐
│ Click here to add more holdings     │
│ or connect another exchange.        │
│                                      │
│ [Next] [Skip Tour]                   │
└─────────────────────────────────────┘
         ↓ (pointing to [+ Add] button)

Tooltip 4: Alerts
┌─────────────────────────────────────┐
│ Set up price or risk alerts here.   │
│ We'll notify you via email or push. │
│                                      │
│ [Got It!]                            │
└─────────────────────────────────────┘
         ↓ (pointing to Alerts menu)
```

**Tutorial state stored:**
```typescript
user.onboarding_completed = true;
user.tutorial_completed = true;
```

---

## 6. Empty States

### 6.1 No Holdings Yet

**When:** User skips onboarding or deletes all holdings

```
┌────────────────────────────────────┐
│                                    │
│        📊                          │
│                                    │
│  Your Portfolio is Empty           │
│                                    │
│  Add your first holding to start   │
│  tracking your crypto portfolio.   │
│                                    │
│  [  Add Holding Manually  ]        │
│                                    │
│  [  Connect Exchange      ]        │
│                                    │
│  Or [Try Demo Mode]                │
│                                    │
└────────────────────────────────────┘
```

### 6.2 No Alerts Set

```
┌────────────────────────────────────┐
│        🔔                          │
│                                    │
│  No Alerts Yet                     │
│                                    │
│  Get notified when prices cross    │
│  thresholds or risks change.       │
│                                    │
│  [  Create Your First Alert  ]     │
│                                    │
└────────────────────────────────────┘
```

### 6.3 No Predictions Available (Free Tier)

```
┌────────────────────────────────────┐
│        🔮                          │
│                                    │
│  AI Predictions (Plus Feature)     │
│                                    │
│  Upgrade to Plus for 7-day price   │
│  predictions with 70%+ accuracy.   │
│                                    │
│  [  Upgrade to Plus ($9/mo)  ]     │
│                                    │
│  [Learn More About Predictions]    │
│                                    │
└────────────────────────────────────┘
```

---

## 7. Upgrade Prompts

### 7.1 In-Context Prompts

**Alert Limit Reached (Free: 5 alerts max):**
```
┌────────────────────────────────────┐
│  ⚠️ Alert Limit Reached            │
│                                    │
│  You've used all 5 free alerts.    │
│  Upgrade to Plus for 20 alerts!    │
│                                    │
│  [  Upgrade to Plus ($9)  ]        │
│                                    │
│  Or [Delete an Alert]              │
└────────────────────────────────────┘
```

**Whale Alerts (Plus Feature):**
```
┌────────────────────────────────────┐
│  🐋 Whale Activity Alerts          │
│                                    │
│  Track large transactions ($10M+)  │
│  that might affect your holdings.  │
│                                    │
│  Available on Plus plan ($9/mo)    │
│                                    │
│  [  Start Free 7-Day Trial  ]      │
│                                    │
│  [Maybe Later]                     │
└────────────────────────────────────┘
```

### 7.2 Upgrade Modal (Full Feature Comparison)

**Triggered by:** Clicking any upgrade CTA

```
┌──────────────────────────────────────────────┐
│  Upgrade Your Plan                      [X]  │
│                                              │
│  ┌──────────┬──────────┬──────────┐         │
│  │   FREE   │   PLUS   │   PRO    │         │
│  ├──────────┼──────────┼──────────┤         │
│  │   $0     │  $9/mo   │  $29/mo  │         │
│  │          │          │          │         │
│  │ ✓ 5      │ ✓ 20     │ ✓ 50     │ Alerts │
│  │ ✗        │ ✓        │ ✓        │ AI     │
│  │ ✗        │ ✓        │ ✓        │ Whale  │
│  │ ✗        │ ✗        │ ✓        │ News   │
│  │          │          │          │         │
│  │ [Current]│ [Upgrade]│ [Upgrade]│         │
│  └──────────┴──────────┴──────────┘         │
│                                              │
│  See all features → [Full Comparison]        │
└──────────────────────────────────────────────┘
```

---

## 8. Success Metrics

### 8.1 Funnel Metrics

**Signup → Email Verification:**
- Target: 90% completion rate
- Benchmark: 85% (industry standard)

**Email Verification → Portfolio Setup:**
- Target: 70% completion rate
- Benchmark: 60%

**Portfolio Setup → First Session Complete:**
- Target: 80% completion rate
- Benchmark: 75%

**Total Signup → Active User:**
- Target: 50% conversion rate
- Benchmark: 40-45% (SaaS apps)

### 8.2 Time Metrics

**Time to first value:**
- Manual path: 2 minutes (target)
- API path: 5 minutes (target)
- Current: 8 minutes (needs improvement)

**Session duration (first session):**
- Target: 5+ minutes
- Benchmark: 3-4 minutes

### 8.3 Engagement Metrics

**Actions in first session:**
- Add at least 1 holding: 70%
- Create at least 1 alert: 30%
- View AI prediction: 50%
- Connect exchange: 20%

**Retention:**
- Day 1: 60%
- Day 7: 40%
- Day 30: 25%

---

## 9. Technical Implementation

### 9.1 Onboarding State Management

**Database table:**
```sql
CREATE TABLE user_onboarding (
    user_id UUID PRIMARY KEY REFERENCES users(id),

    -- Progress tracking
    email_verified BOOLEAN DEFAULT false,
    persona_selected VARCHAR(20),  -- 'new', 'active', 'manager', 'explorer'
    first_holding_added BOOLEAN DEFAULT false,
    exchange_connected BOOLEAN DEFAULT false,
    tutorial_completed BOOLEAN DEFAULT false,
    first_alert_created BOOLEAN DEFAULT false,

    -- Timestamps
    signup_at TIMESTAMPTZ DEFAULT NOW(),
    email_verified_at TIMESTAMPTZ,
    first_holding_at TIMESTAMPTZ,
    tutorial_completed_at TIMESTAMPTZ,

    -- Completion status
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,

    -- Session tracking
    signup_source VARCHAR(100),  -- 'organic', 'google-ads', 'twitter', etc.
    signup_device VARCHAR(50),   -- 'desktop', 'mobile', 'tablet'

    CHECK (persona_selected IN ('new', 'active', 'manager', 'explorer', NULL))
);
```

### 9.2 Analytics Events

**Track every step:**
```typescript
// Event: User started onboarding
analytics.track('onboarding_started', {
  userId: user.id,
  source: 'google-ads',
  device: 'desktop',
  timestamp: new Date()
});

// Event: Persona selected
analytics.track('persona_selected', {
  userId: user.id,
  persona: 'active',
  timestamp: new Date()
});

// Event: First holding added
analytics.track('first_holding_added', {
  userId: user.id,
  method: 'manual',  // or 'api'
  asset: 'BTC',
  timeToValue: 120  // seconds from signup
});

// Event: Onboarding completed
analytics.track('onboarding_completed', {
  userId: user.id,
  path: 'manual',  // or 'api' or 'demo'
  duration: 180,  // seconds
  holdingsAdded: 3,
  alertsCreated: 1
});
```

### 9.3 A/B Testing Opportunities

**Test variations:**

**1. Signup CTA wording:**
- A: "Create Free Account"
- B: "Start Tracking Free"
- C: "Get Started Free"

**2. Persona selection:**
- A: Show persona screen (current)
- B: Skip persona, detect from behavior
- C: Ask on signup page instead

**3. Manual vs API priority:**
- A: Suggest manual entry first (current)
- B: Suggest API import first
- C: Show both options equally

**4. Tutorial style:**
- A: Sequential tooltips (current)
- B: Interactive walkthrough
- C: Skip tutorial, show help center link

**Implementation:**
```typescript
const variant = ab.getVariant(user.id, 'signup_cta');

if (variant === 'A') {
  ctaText = 'Create Free Account';
} else if (variant === 'B') {
  ctaText = 'Start Tracking Free';
} else {
  ctaText = 'Get Started Free';
}
```

### 9.4 Email Drip Campaign

**For users who don't complete onboarding:**

**Day 0 (immediately after signup):**
- Email: "Verify your email to get started"
- CTA: [Verify Email]

**Day 1 (if not verified):**
- Email: "You're almost there! Complete your setup"
- CTA: [Finish Setup]

**Day 3 (if verified but no holdings):**
- Email: "3 reasons to track your crypto with Coinsphere"
- CTA: [Add Your Holdings]

**Day 7 (if inactive):**
- Email: "Need help getting started?"
- CTA: [Watch Tutorial] or [Get Support]

**Implementation:**
```typescript
// Cron job: Check for incomplete onboarding daily
const incompleteUsers = await db.query(`
  SELECT * FROM user_onboarding
  WHERE onboarding_completed = false
  AND signup_at < NOW() - INTERVAL '1 day'
  AND email_verified = false
`);

for (const user of incompleteUsers) {
  await sendEmail({
    to: user.email,
    template: 'onboarding_reminder_day1',
    data: { userName: user.name }
  });
}
```

---

## Appendix A: Wireframes

*See Figma file for detailed mockups: [Figma Link]*

**Key screens:**
1. Signup page
2. Email verification
3. Persona selection
4. Add holding (manual)
5. Connect exchange
6. Success screen
7. Dashboard with tutorial

---

## Appendix B: Copy Variations

**Signup page headlines:**
- "Track Your Crypto Portfolio" (current)
- "See Your Crypto Portfolio in One Place"
- "Portfolio Tracking + AI Predictions"
- "The Smart Way to Track Crypto"

**CTA buttons:**
- "Create Free Account" (current)
- "Get Started Free"
- "Start Tracking"
- "Sign Up Free"

**Success screen celebration:**
- "Your Portfolio is Ready!" (current)
- "You're All Set!"
- "Welcome to Coinsphere!"
- "Let's Track Your Crypto!"

---

**Document End**

*This onboarding flow will be tested and refined based on user analytics in Sprint 2-3.*
