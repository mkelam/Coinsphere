# 📐 Coinsphere Screen Wireframes
**Version:** 1.0
**Date:** October 9, 2025
**Analyst:** Mary (Business Analyst)
**Purpose:** Detailed wireframes for missing MVP screens

---

## Table of Contents

1. [Priority 1: Critical MVP Screens](#priority-1-critical-mvp-screens)
   - [Portfolio Management](#1-portfolio-management)
   - [Pricing/Upgrade Page](#2-pricingupgrade-page)
   - [Asset Detail Page](#3-asset-detail-page)
2. [Priority 2: Onboarding Flow](#priority-2-onboarding-flow)
3. [Priority 3: Transactions Manager](#priority-3-transactions-manager)
4. [Design System Reference](#design-system-reference)

---

## PRIORITY 1: CRITICAL MVP SCREENS

### 1. Portfolio Management

#### Screen: `/portfolios` - Portfolio List

**Purpose:** Allow users to view, create, switch between, and manage multiple portfolios

**User Story:**
> "As a user with multiple portfolios (Personal, DeFi, Trading), I need to easily switch between them and create new ones"

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (CoinSphere Logo | Alerts | User Menu)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  My Portfolios                                    [+ New Portfolio]│
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Portfolio: "Personal Holdings" [Active]           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  💼 Personal Holdings                           [⋮ Menu]  │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Total Value: $125,420.50                                 │ │
│  │  24h Change: +$3,241.20 (+2.65%) [Green]                 │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Assets: 12 | Transactions: 247                          │ │
│  │  Created: Jan 15, 2025 | Last Updated: 2 hours ago       │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [View Dashboard]  [Edit]  [Export CSV]                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Portfolio: "DeFi Experiments"                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🚀 DeFi Experiments                            [⋮ Menu]  │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Total Value: $8,450.30                                   │ │
│  │  24h Change: -$124.50 (-1.45%) [Red]                     │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Assets: 8 | Transactions: 52                            │ │
│  │  Created: Mar 3, 2025 | Last Updated: 1 day ago          │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [View Dashboard]  [Edit]  [Set as Active]               │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Portfolio: "Trading Portfolio"                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  📈 Trading Portfolio                           [⋮ Menu]  │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Total Value: $42,180.75                                  │ │
│  │  24h Change: +$892.15 (+2.16%) [Green]                   │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Assets: 25 | Transactions: 412                          │ │
│  │  Created: Feb 1, 2025 | Last Updated: 30 minutes ago     │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [View Dashboard]  [Edit]  [Set as Active]               │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

Tier Limits:
┌───────────────────────────────────────────────────────────────┐
│  You're on the Free plan (3/5 portfolios used)                │
│  [Upgrade to Plus for 25 portfolios →]                        │
└───────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Header:** Standard CoinSphere header with navigation
2. **Title Bar:** "My Portfolios" with "+ New Portfolio" button (primary blue)
3. **Portfolio Cards:** Each portfolio displayed as GlassCard with:
   - Portfolio emoji/icon + name
   - Three-dot menu (⋮) for actions
   - Total value (large, white text)
   - 24h change (colored: green/red)
   - Metadata: Asset count, transaction count, dates
   - Action buttons: View Dashboard, Edit, Set as Active
   - Active portfolio has blue border + "Active" badge
4. **Tier Limit Banner:** Show current usage vs tier limits

**Interactive Elements:**

- **+ New Portfolio button** → Opens modal/drawer
- **Portfolio card click** → Navigate to `/dashboard` with that portfolio active
- **⋮ Menu** → Dropdown: Edit, Delete, Duplicate, Export
- **[View Dashboard]** → Navigate to `/dashboard`
- **[Edit]** → Navigate to `/portfolios/:id/edit`
- **[Set as Active]** → Set as default portfolio for dashboard

**States:**

- **Empty State:** "No portfolios yet. Create your first one!"
- **Tier Limit Reached:** Disable "+ New Portfolio", show upgrade CTA
- **Loading State:** Skeleton loaders for cards

---

#### Screen: `/portfolios/new` - Create New Portfolio Modal

**Purpose:** Guide user through creating a new portfolio

**Layout (Modal/Drawer):**

```
┌─────────────────────────────────────────────────────────────┐
│  Create New Portfolio                                   [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Portfolio Name *                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ My DeFi Portfolio                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Choose an Icon (optional)                                   │
│  [💼] [🚀] [📈] [💎] [🔥] [⚡] [🌙] [🎯]                    │
│                                                              │
│  Base Currency                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ USD ($) ▼                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  (Options: USD, EUR, GBP, BTC, ETH)                         │
│                                                              │
│  Description (optional)                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Portfolio for tracking my DeFi investments...          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Privacy Settings                                            │
│  ☐ Make this portfolio private (hide from leaderboards)     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  How do you want to add holdings?                    │   │
│  │                                                       │   │
│  │  [🔗 Connect Exchange]  [👛 Connect Wallet]          │   │
│  │  [📊 Import CSV]        [✋ Add Manually Later]       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                                  [Cancel]  [Create Portfolio]│
└─────────────────────────────────────────────────────────────┘
```

**Form Fields:**

1. **Portfolio Name** (required) - Text input, max 50 chars
2. **Icon** (optional) - Emoji picker, default: 💼
3. **Base Currency** (required) - Dropdown, default: USD
4. **Description** (optional) - Textarea, max 200 chars
5. **Privacy** (optional) - Checkbox, default: unchecked

**Next Steps:**

After "Create Portfolio" → Route based on selection:
- Connect Exchange → `/onboarding/connect-exchange?portfolio=:id`
- Connect Wallet → `/onboarding/connect-wallet?portfolio=:id`
- Import CSV → `/transactions/import?portfolio=:id`
- Add Manually Later → `/dashboard` with empty portfolio

---

#### Screen: `/portfolios/:id/edit` - Edit Portfolio

**Purpose:** Modify portfolio settings

**Layout:** Same as Create modal, but pre-filled with existing data

**Additional Actions:**
- **[Delete Portfolio]** button (red, bottom left)
- Confirmation modal: "Are you sure? This will delete X assets and Y transactions"

---

### 2. Pricing/Upgrade Page

#### Screen: `/pricing` - Subscription Tiers

**Purpose:** Display pricing tiers and convert free users to paid subscriptions

**User Story:**
> "As a free user who hit the 5 portfolio limit, I need to see what Plus/Pro offers and upgrade"

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header (CoinSphere Logo | Alerts | User Menu)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Unlock AI-Powered Insights                    │
│          Choose the plan that fits your trading style            │
│                                                                   │
│  Billing: [Monthly] [Annual (Save 20%)] ← Toggle switch         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          4-Column Pricing Grid                                │
└──────────────────────────────────────────────────────────────────────────────┘

FREE                 PLUS                PRO                 POWER TRADER
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │ MOST POPULAR │    │              │    │              │
│              │    │   (Badge)    │    │              │    │              │
│              │    └──────────────┘    │              │    │              │
│   $0/mo      │    │   $9.99/mo   │    │  $19.99/mo   │    │  $49.99/mo   │
│              │    │ ($7.99 annual│    │ ($15.99 ann) │    │ ($39.99 ann) │
│              │    │              │    │              │    │              │
│ ✓ 5 portfolios│    │✓ 25 portfolios│   │✓ Unlimited   │    │✓ Unlimited   │
│ ✓ 100 trans/ │    │✓ 1K trans/mo│     │✓ Unlimited   │    │✓ Unlimited   │
│   month      │    │✓ 1-year hist│     │✓ Full history│    │✓ Full history│
│ ✓ 30-day hist│    │✓ Basic pred. │    │✓ AI predict. │    │✓ Advanced AI │
│ ✗ AI predict.│    │✗ Risk scores │    │✓ Risk scores │    │✓ Risk scores │
│ ✗ Risk scores│    │✗ Real-time   │    │✓ Real-time   │    │✓ Real-time   │
│ ✗ Alerts     │    │✓ 10 alerts   │    │✓ 100 alerts  │    │✓ Unlimited   │
│ ✗ API access │    │✗ API access  │    │✗ API access  │    │✓ API access  │
│              │    │              │    │✓ Priority    │    │✓ White-label │
│              │    │              │    │  support     │    │✓ Dedicated   │
│              │    │              │    │              │    │  support     │
│              │    │              │    │              │    │              │
│ [Current]    │    │ [Upgrade] ←  │    │ [Upgrade] ←  │    │ [Upgrade] ←  │
│              │    │   (Blue)     │    │   (Blue)     │    │   (Blue)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  💳 All plans include:                                            │
│  ✓ Bank-level encryption                                          │
│  ✓ Cancel anytime                                                 │
│  ✓ 30-day money-back guarantee                                    │
│  ✓ Multi-device sync                                              │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  FAQ                                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ▼ Can I upgrade or downgrade anytime?                      │  │
│  │   Yes! You can change plans at any time. If you upgrade... │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ▼ What payment methods do you accept?                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ▼ How accurate are the AI predictions?                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Hero Section:** Headline + toggle (Monthly/Annual)
2. **Pricing Cards:** 4 columns (GlassCard style)
   - Tier name (white, bold)
   - Price (large, white)
   - Annual price (smaller, white/70)
   - Feature list with checkmarks (✓/✗)
   - CTA button (blue for upgrade, gray for current)
   - "Most Popular" badge on Plus tier
3. **Trust Signals:** Encryption, cancel policy, guarantee
4. **FAQ Accordion:** Common questions

**Interactive Elements:**

- **Monthly/Annual toggle** → Recalculate prices
- **[Upgrade] button** → Navigate to `/checkout?tier=plus`
- **FAQ items** → Expand/collapse

**States:**

- **Current tier highlighted** with "Current Plan" badge
- **Upgrade CTAs** only show for higher tiers
- **Loading state** during Stripe session creation

---

#### Screen: `/checkout` - Stripe Checkout

**Purpose:** Handle payment via Stripe

**Implementation:**
- Use Stripe Checkout (hosted page)
- Or embed Stripe Elements for custom UI
- Redirect to `/billing/success` after payment

---

#### Screen: `/billing` - Subscription Management

**Purpose:** Manage active subscription, view invoices, cancel

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Billing & Subscription                                          │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Current Plan                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Pro Plan                                    [Change Plan]│ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  $19.99 / month                                           │ │
│  │  Next billing date: November 9, 2025                      │ │
│  │  Payment method: •••• 4242                                │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [Update Payment Method]  [Cancel Subscription]           │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Billing History                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Date           Amount    Status      Invoice             │ │
│  │  ────────────────────────────────────────────────────────│ │
│  │  Oct 9, 2025    $19.99    Paid        [Download PDF]     │ │
│  │  Sep 9, 2025    $19.99    Paid        [Download PDF]     │ │
│  │  Aug 9, 2025    $19.99    Paid        [Download PDF]     │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Usage This Month                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Portfolios: 8 / Unlimited                                │ │
│  │  Transactions: 342 / Unlimited                            │ │
│  │  API Calls: N/A (Pro plan)                                │ │
│  │  Alerts: 24 / 100                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Current Plan Card:** Shows active subscription details
2. **Billing History:** Table of past invoices
3. **Usage Meter:** Current usage vs tier limits

**Actions:**

- **[Change Plan]** → Navigate to `/pricing`
- **[Update Payment Method]** → Stripe payment method update
- **[Cancel Subscription]** → Confirmation modal
- **[Download PDF]** → Generate invoice PDF

---

### 3. Asset Detail Page

#### Screen: `/assets/:symbol` - Asset Detail (e.g., `/assets/BTC`)

**Purpose:** Deep dive into a specific cryptocurrency with AI predictions and risk analysis

**User Story:**
> "As a trader considering buying SOL, I want to see price charts, AI predictions, and risk score before investing"

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                             │
│                                                                   │
│  [BTC Icon] Bitcoin (BTC)                          [⭐ Watch]     │
│  $67,234.50                                                       │
│  +$1,234.20 (+1.87%) 24h [Green]                                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Tab Navigation:                                                  │
│  [Overview] [Predictions] [Risk Analysis] [Holdings] [News]      │
└──────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  TAB: OVERVIEW                                                  ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Price Chart                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [1D] [7D] [30D] [90D] [1Y] [ALL] ← Time selector       │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │                                                      │ │ │
│  │  │         Candlestick Chart                            │ │ │
│  │  │         (Recharts component)                         │ │ │
│  │  │         Shows OHLCV data                             │ │ │
│  │  │                                                      │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Grid: 2 columns                                                 │
│                                                                   │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │ GlassCard - Market Stats   │  │ GlassCard - Supply Info    │ │
│  │ ────────────────────────── │  │ ────────────────────────── │ │
│  │ Market Cap                 │  │ Circulating Supply         │ │
│  │ $1.32T                     │  │ 19.8M BTC                  │ │
│  │                            │  │                            │ │
│  │ 24h Volume                 │  │ Max Supply                 │ │
│  │ $42.3B                     │  │ 21M BTC                    │ │
│  │                            │  │                            │ │
│  │ All-Time High              │  │ Total Supply               │ │
│  │ $69,000 (Nov 2021)         │  │ 19.8M BTC                  │ │
│  │                            │  │                            │ │
│  │ All-Time Low               │  │ % of Max Mined             │ │
│  │ $67.81 (Jul 2013)          │  │ 94.3%                      │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  TAB: PREDICTIONS (🔒 Pro Plan Required)                       ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - AI Price Prediction                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  7-Day Forecast                        [7D] [14D] [30D]  │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │                                                           │ │
│  │  Predicted Price:  $72,450                               │ │
│  │  Current Price:    $67,234                               │ │
│  │  Expected Change:  +$5,216 (+7.8%) [Green]               │ │
│  │                                                           │ │
│  │  Confidence: ████████░░ 82% (High) [Green]               │ │
│  │                                                           │ │
│  │  Direction: 📈 BULLISH                                    │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Key Indicators Supporting This Prediction:              │ │
│  │  ✓ RSI: 58 (Neutral, room to grow)                       │ │
│  │  ✓ MACD: Bullish crossover detected                      │ │
│  │  ✓ Volume: +23% above 30-day average                     │ │
│  │  ✓ Social Sentiment: 72% positive                        │ │
│  │  ⚠ Resistance Level: $70,000 (watch closely)             │ │
│  │                                                           │ │
│  │  [📊 View Model Transparency]                             │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Historical Accuracy                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Our Model's Accuracy for BTC (Last 90 Days)             │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  7-Day Predictions:  ████████░░ 76% accurate             │ │
│  │  14-Day Predictions: ███████░░░ 68% accurate             │ │
│  │  30-Day Predictions: ██████░░░░ 61% accurate             │ │
│  │                                                           │ │
│  │  Last updated: 2 hours ago                               │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  TAB: RISK ANALYSIS (🔒 Pro Plan Required)                     ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Degen Risk Score                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Risk Score: 18 / 100  [Green]                           │ │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ LOW RISK      │ │
│  │                                                           │ │
│  │  Bitcoin is considered LOW RISK due to:                  │ │
│  │  ✓ Largest market cap ($1.32T)                           │ │
│  │  ✓ High liquidity (24h vol: $42B)                        │ │
│  │  ✓ Low volatility (30-day: 2.3%)                         │ │
│  │  ✓ Established project (since 2009)                      │ │
│  │  ✓ Listed on 200+ exchanges                              │ │
│  │  ✓ Decentralized governance                              │ │
│  │                                                           │ │
│  │  Risk Breakdown:                                          │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ Market Risk:        ███░░░░░░░░  5/100 (Very Low)  │ │ │
│  │  │ Liquidity Risk:     ██░░░░░░░░░  3/100 (Very Low)  │ │ │
│  │  │ Volatility Risk:    ████░░░░░░░  8/100 (Low)       │ │ │
│  │  │ Project Risk:       ██░░░░░░░░░  2/100 (Very Low)  │ │ │
│  │  │ Regulatory Risk:    ███████░░░░ 15/100 (Low)       │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Risk Level History (30 days):                           │ │
│  │  [Line chart showing risk score over time]              │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  TAB: HOLDINGS                                                  ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Your BTC Holdings                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Portfolio          Amount      Value        P&L          │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Personal Holdings  0.5 BTC    $33,617      +$2,450      │ │
│  │  Trading Portfolio  0.25 BTC   $16,808      +$892        │ │
│  │  DeFi Experiments   0.1 BTC    $6,723       -$124        │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Total              0.85 BTC   $57,148      +$3,218      │ │
│  │                                                           │ │
│  │  [+ Add BTC Holding]                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Recent BTC Transactions                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Date       Type    Amount      Price      Total          │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  Oct 5      Buy     0.1 BTC    $66,500    $6,650         │ │
│  │  Sep 28     Sell    0.05 BTC   $65,200    $3,260         │ │
│  │  Sep 15     Buy     0.2 BTC    $62,100    $12,420        │ │
│  │                                                           │ │
│  │  [View All Transactions →]                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  TAB: NEWS                                                      ║
╚═══════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Latest Bitcoin News                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [News Item 1]                                  2 hours ago│ │
│  │  Bitcoin Breaks $67K as ETF Inflows Surge                │ │
│  │  Source: CoinDesk                                         │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [News Item 2]                                  5 hours ago│ │
│  │  BlackRock's Bitcoin ETF Sees Record $500M Daily Inflow  │ │
│  │  Source: Bloomberg                                        │ │
│  │  ──────────────────────────────────────────────────────── │ │
│  │  [News Item 3]                                  1 day ago │ │
│  │  Analysts Predict BTC Could Reach $75K by Year End      │ │
│  │  Source: Cointelegraph                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Asset Header:** Symbol, name, current price, 24h change
2. **Tab Navigation:** Overview, Predictions, Risk Analysis, Holdings, News
3. **Price Chart:** Interactive candlestick chart with timeframe selector
4. **Market Stats:** Key metrics (market cap, volume, ATH/ATL)
5. **AI Prediction Panel:** Forecast, confidence, indicators (🔒 Pro only)
6. **Risk Score Panel:** Degen score breakdown (🔒 Pro only)
7. **Holdings Summary:** User's positions across portfolios
8. **News Feed:** Latest news articles

**Interactive Elements:**

- **[⭐ Watch]** → Add to watchlist
- **Tab clicks** → Switch between sections
- **Timeframe buttons** → Update chart data
- **[📊 View Model Transparency]** → Modal explaining prediction logic
- **[+ Add BTC Holding]** → Quick add transaction modal
- **News items** → External links

**Paywall:**

- Predictions and Risk Analysis tabs show **blur effect** + "Upgrade to Pro" CTA for free users
- Lock icon (🔒) on tab labels

---

## PRIORITY 2: ONBOARDING FLOW

### 4. Onboarding Wizard

#### Screen: `/onboarding/welcome` - Step 1

**Purpose:** Welcome new users and set expectations

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Skip Setup →]                                                  │
│                                                                   │
│                         🔮                                        │
│              Welcome to CoinSphere!                               │
│                                                                   │
│  Let's set up your first portfolio in 3 easy steps               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Step 1: Choose how to add holdings                          ││
│  │ Step 2: Connect your data source                            ││
│  │ Step 3: Review and sync                                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  What type of trader are you?                                    │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐│
│  │   📊 Active      │  │   🚀 Degen       │  │  🌱 Beginner    ││
│  │   Trader         │  │   Trader         │  │                 ││
│  │                  │  │                  │  │  I'm new to     ││
│  │  I trade weekly  │  │  High risk, high │  │  crypto         ││
│  │  and need real-  │  │  reward. Need    │  │                 ││
│  │  time insights   │  │  quick risk      │  │                 ││
│  │                  │  │  checks          │  │                 ││
│  │  [Select]        │  │  [Select]        │  │  [Select]       ││
│  └──────────────────┘  └──────────────────┘  └─────────────────┘│
│                                                                   │
│                                    [Next: Connect Data →]        │
└─────────────────────────────────────────────────────────────────┘
```

**Purpose:**
- Segment users for personalized experience
- Set expectations for setup process

**Next:** Navigate to `/onboarding/connect`

---

#### Screen: `/onboarding/connect` - Step 2

**Purpose:** Guide user to connect portfolio data

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]                                   Progress: ●●○ (2/3)  │
│                                                                   │
│  How do you want to add your holdings?                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🔗 Connect Exchange (Recommended)                         │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Automatically sync holdings from Binance, Coinbase,       │  │
│  │  Kraken, and 20+ other exchanges                           │  │
│  │                                                             │  │
│  │  [Connect Exchange →]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👛 Connect Wallet                                          │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Link MetaMask, Phantom, or paste your wallet address      │  │
│  │  for read-only tracking                                     │  │
│  │                                                             │  │
│  │  [Connect Wallet →]                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📊 Import CSV File                                         │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Upload a CSV export from your exchange or tracking app    │  │
│  │                                                             │  │
│  │  [Upload CSV →]                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ✋ Add Manually                                            │  │
│  │  ─────────────────────────────────────────────────────────  │  │
│  │  Enter your holdings one by one (you can add more later)   │  │
│  │                                                             │  │
│  │  [Add Manually →]                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│                                          [Skip for Now]          │
└─────────────────────────────────────────────────────────────────┘
```

**Next Steps:**

- **Connect Exchange** → `/onboarding/connect-exchange`
- **Connect Wallet** → `/onboarding/connect-wallet`
- **Import CSV** → `/transactions/import`
- **Add Manually** → `/transactions/add`
- **Skip** → `/dashboard` (empty portfolio)

---

#### Screen: `/onboarding/connect-exchange` - Exchange API Setup

**Purpose:** Guide user through generating and entering API keys

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]                                   Progress: ●●● (3/3)  │
│                                                                   │
│  Connect Your Exchange                                           │
│                                                                   │
│  Select your exchange:                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🟡 Binance         [Most Popular]                           ││
│  │ 🔵 Coinbase                                                  ││
│  │ 🟣 Kraken                                                    ││
│  │ ⚪ Bybit                                                     ││
│  │ [Show all 20+ exchanges ▼]                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Selected: Binance                                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🔐 How to get your Binance API key:                         ││
│  │                                                              ││
│  │ 1. Log in to Binance.com                                    ││
│  │ 2. Go to Account → API Management                           ││
│  │ 3. Create a new API key                                     ││
│  │ 4. Enable "Read Only" permissions (DO NOT enable trading)   ││
│  │ 5. Copy your API Key and Secret Key                         ││
│  │                                                              ││
│  │ [📺 Watch Video Tutorial]   [📖 Read Full Guide]            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Enter your API credentials:                                     │
│                                                                   │
│  API Key *                                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ your-api-key-here                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Secret Key *                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ your-secret-key-here                            [👁 Show]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ⚠️ Security Notice:                                             │
│  • We only request READ-ONLY access                              │
│  • Your keys are encrypted with AES-256                          │
│  • We NEVER ask for withdrawal permissions                       │
│                                                                   │
│                              [Cancel]  [Connect & Sync →]        │
└─────────────────────────────────────────────────────────────────┘
```

**Next:** After successful connection → `/onboarding/syncing`

---

#### Screen: `/onboarding/syncing` - Sync Progress

**Purpose:** Show progress while importing portfolio data

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         ⏳                                        │
│                  Syncing Your Portfolio                           │
│                                                                   │
│  We're importing your holdings from Binance...                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✓ Connected to Binance API                                  ││
│  │ ✓ Fetched account balances                                  ││
│  │ ⏳ Importing transaction history (247/500)                   ││
│  │ ○ Calculating profit/loss                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Progress: ████████████████░░░░░░░░░░░░░░░░ 62%                 │
│                                                                   │
│  This usually takes 30-60 seconds                                │
└─────────────────────────────────────────────────────────────────┘
```

**Next:** Auto-navigate to `/onboarding/complete` when done

---

#### Screen: `/onboarding/complete` - Success!

**Purpose:** Celebrate completion and direct user to dashboard

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         🎉                                        │
│              You're All Set!                                      │
│                                                                   │
│  Your portfolio is synced and ready to explore                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Portfolio Summary:                                           ││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ Total Value:  $125,420.50                                   ││
│  │ Assets:       12 cryptocurrencies                            ││
│  │ Transactions: 247 imported                                   ││
│  │ Exchanges:    1 connected (Binance)                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  What's Next?                                                    │
│                                                                   │
│  ✓ View your dashboard and portfolio analytics                  │
│  ✓ Set up price alerts for your favorite assets                 │
│  ✓ Get AI predictions to guide your trades (Pro plan)           │
│                                                                   │
│                           [Go to Dashboard →]                    │
│                                                                   │
│                           [Watch Quick Tour (2 min)]             │
└─────────────────────────────────────────────────────────────────┘
```

**Next:** Navigate to `/dashboard`

---

## PRIORITY 3: TRANSACTIONS MANAGER

### 5. Transactions Page

#### Screen: `/transactions` - Transaction History

**Purpose:** View, filter, and manage all transactions across portfolios

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Transaction History                      [+ Add Transaction]    │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Filters:                                                      │
│  [All Portfolios ▼] [All Types ▼] [All Assets ▼] [Date: 30d ▼]│
│  [Search transactions...]                                      │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  GlassCard - Transactions Table                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Date       Type  Asset  Amount     Price    Total   P&L  │ │
│  │ ──────────────────────────────────────────────────────── │ │
│  │ Oct 9      Buy   BTC    0.1       $67,234  $6,723   N/A  │ │
│  │ 10:23 AM                                          [Edit] │ │
│  │ ──────────────────────────────────────────────────────── │ │
│  │ Oct 8      Sell  ETH    2.5       $2,456   $6,140  +$342 │ │
│  │ 2:15 PM                                           [Edit] │ │
│  │ ──────────────────────────────────────────────────────── │ │
│  │ Oct 7      Buy   SOL    50        $142     $7,100   N/A  │ │
│  │ 5:42 PM                                           [Edit] │ │
│  │                                                           │ │
│  │                      ... more rows ...                    │ │
│  │                                                           │ │
│  │ Showing 1-25 of 247 transactions                          │ │
│  │ [← Previous] [1] [2] [3] [4] ... [10] [Next →]           │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Actions:                                                      │
│  [Export CSV] [Import Transactions] [Bulk Delete]             │
└───────────────────────────────────────────────────────────────┘
```

**Components:**

1. **Filter Bar:** Portfolio, type (buy/sell/transfer), asset, date range
2. **Search:** Free text search
3. **Table:** Sortable columns with pagination
4. **Action Buttons:** Add, export, import, bulk actions

---

#### Screen: `/transactions/add` - Add Transaction

**Purpose:** Manually add a transaction

**Layout (Modal):**

```
┌─────────────────────────────────────────────────────────────┐
│  Add Transaction                                        [✕]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Portfolio *                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Personal Holdings ▼                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Transaction Type *                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Buy] [Sell] [Transfer] [Stake] [Unstake]             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Asset *                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ BTC - Bitcoin ▼                        [Search assets] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Amount *                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 0.5                                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Price per Unit *                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ $67,234.50                       [Use Current Price]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Total: $33,617.25                                           │
│                                                              │
│  Date & Time *                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 10/09/2025  10:23 AM                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Fees (optional)                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ $2.50                                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Notes (optional)                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Bought the dip!                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                                  [Cancel]  [Add Transaction] │
└─────────────────────────────────────────────────────────────┘
```

---

## DESIGN SYSTEM REFERENCE

All screens follow the **Coinsphere Design System** documented in `DESIGN_SYSTEM.md`:

### Core Principles

1. **Glassmorphism Cards**
   - Background: `rgba(255, 255, 255, 0.05)`
   - Border: `1px solid rgba(255, 255, 255, 0.08)`
   - Backdrop blur: `20px`
   - Hover: Increase opacity to `0.10`

2. **Color Palette**
   - Background: Pure black `#000000`
   - Text primary: `#ffffff` (100%)
   - Text secondary: `rgba(255, 255, 255, 0.7)` (70%)
   - Text tertiary: `rgba(255, 255, 255, 0.5)` (50%)
   - Accent blue: `#3b82f6` (CTAs, links)
   - Accent green: `#10b981` (positive values)
   - Accent red: `#ef4444` (negative values)

3. **Typography**
   - Font: System UI sans-serif stack
   - Headings: 3xl, 2xl, xl (700 weight)
   - Body: base, sm, xs (400-500 weight)
   - Monospace: For prices, addresses, IDs

4. **Spacing**
   - Card padding: `p-6` (1.5rem)
   - Section gaps: `gap-6` (1.5rem)
   - Container: `max-w-7xl` centered

5. **Interactive States**
   - Hover: `bg-white/[0.10]` + `translateY(-2px)`
   - Focus: `ring-2 ring-white/20`
   - Disabled: `opacity-50`
   - Transition: `0.2s ease`

---

## IMPLEMENTATION NOTES

### Component Reuse

Maximize component reuse across screens:

1. **GlassCard** - Base card component (already exists)
2. **Header** - Shared header with navigation (already exists)
3. **LoadingSpinner** - Loading states (already exists)
4. **EmptyState** - When no data exists (create new)
5. **Modal** - Overlay dialogs (create new)
6. **Table** - Data tables with sorting/pagination (create new)
7. **Chart** - Recharts wrapper (already exists as PriceHistoryChart)
8. **UpgradeCTA** - Paywall component (create new)

### API Integration

Each screen requires backend API endpoints:

- `/portfolios` → `GET /api/v1/portfolios`, `POST /api/v1/portfolios`
- `/assets/:symbol` → `GET /api/v1/tokens/:symbol`
- `/transactions` → `GET /api/v1/transactions`, `POST /api/v1/transactions`
- `/pricing` → Static data (no API needed)
- `/billing` → Stripe integration

### Mobile Responsiveness

All wireframes assume desktop (1280px+). Mobile adaptations:

- Stack 2-column grids vertically
- Reduce padding from `p-6` to `p-4`
- Hide tertiary info on cards
- Use bottom sheet instead of modals
- Simplify tables to card lists

---

## DEVELOPMENT PRIORITIES

### Phase 1: MVP Critical (2 weeks)

1. **Portfolio Management** (`/portfolios`, `/portfolios/new`) - 3 days
2. **Pricing Page** (`/pricing`) - 2 days
3. **Asset Detail** (`/assets/:symbol`) - 5 days
4. **Onboarding** (4 screens) - 4 days

**Total:** 14 days

### Phase 2: Enhanced UX (1 week)

5. **Transactions Manager** (`/transactions`) - 4 days
6. **Billing Page** (`/billing`) - 2 days
7. **Help Center** (`/help`) - 1 day

**Total:** 7 days

---

## WIREFRAME STATUS

| Screen | Priority | Status | Effort |
|--------|----------|--------|--------|
| Portfolio List | P0 | ✅ Wireframed | 2d |
| Create Portfolio | P0 | ✅ Wireframed | 1d |
| Edit Portfolio | P0 | ✅ Wireframed | 1d |
| Pricing Page | P0 | ✅ Wireframed | 2d |
| Asset Detail | P0 | ✅ Wireframed | 5d |
| Onboarding (4 screens) | P1 | ✅ Wireframed | 4d |
| Transactions List | P1 | ✅ Wireframed | 3d |
| Add Transaction | P1 | ✅ Wireframed | 1d |
| Billing Page | P2 | ⏳ Summary only | 2d |

**Total Estimated Effort:** 21 developer days (~4.5 weeks for 1 developer)

---

## NEXT STEPS

1. **Review wireframes** with team/stakeholders
2. **Create Figma designs** based on these wireframes (optional)
3. **Break down into Jira tickets** (1 ticket per screen)
4. **Start development** with Phase 1 screens
5. **E2E test each screen** as it's built

---

**Questions or feedback?** Let me know and I'll refine these wireframes! 📐
