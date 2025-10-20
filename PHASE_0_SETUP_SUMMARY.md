# Phase 0 Trading Research - Setup Summary

## Completion Date
October 19, 2025 (Week 1 Day 1)

## Objective
Set up infrastructure for automated cryptocurrency trading research (Phase 0 - Research Phase) following the 18-month trading automation plan.

---

## Completed Infrastructure

### 1. Database Schema ✅

Created 6 new tables in PostgreSQL for research tracking:

#### **verified_wallets**
Tracks Smart Money wallets discovered via Nansen with on-chain and social metrics.

**Key Fields:**
- `address` - Wallet address (unique)
- `nansen_label` - Nansen classification (e.g., "Smart Money - DeFi")
- `blockchain` - ethereum, solana, bsc, etc.
- `discovery_source` - nansen, twitter, tradingview, academic, manual
- `research_phase` - week_1, week_2, week_3, week_4
- **On-Chain Metrics** (from Nansen):
  - `total_trades_analyzed` - Trade count
  - `win_rate` - Decimal 0-1
  - `avg_hold_time_days` - Average position duration
  - `avg_position_size_usd` - Average trade size
  - `total_profit_usd` - Cumulative P&L
  - `sharpe_ratio` - Risk-adjusted returns
- **Social Metrics** (from LunarCrush):
  - `social_leading_score` - 0-1 (>0.5 = leading indicator)
  - `behavior_type` - leading_indicator, mixed, follower, uncorrelated
  - `avg_social_volume_at_entry` - Social activity at trade entry
  - `avg_social_volume_at_peak` - Peak social activity
- **Verification Scores** (Week 2):
  - `authenticity_score` - 0-10
  - `transparency_score` - 0-10
  - `skin_in_game_score` - 0-10
  - `total_verification_score` - Sum (max 30)
  - `verification_status` - pending, verified, disqualified

#### **wallet_trades**
Individual trades from Nansen transaction history.

**Key Fields:**
- `tx_hash` - Transaction hash (unique)
- `wallet_id` - FK to verified_wallets
- `timestamp` - Trade datetime
- `action` - buy, sell
- `token_symbol`, `token_address`
- `amount`, `price_usd`, `value_usd`, `gas_fees_usd`
- **Calculated Metrics:**
  - `hold_time_days` - Duration from buy to sell
  - `profit_loss_usd`, `profit_loss_pct`
  - `was_winner` - Boolean profitability
- **Social Context:**
  - `social_volume`, `social_sentiment`
  - `days_before_social_peak` - Timing relative to social spike
  - `social_timing` - before_spike, during_spike, after_peak

#### **wallet_social_signals**
Time-series social data from LunarCrush for wallet trades.

**Key Fields:**
- `wallet_id` - FK to verified_wallets
- `timestamp`, `token_symbol`
- `social_volume`, `social_score`, `sentiment`
- `influencer_activity`
- `price_usd`, `price_change_pct`

#### **public_traders**
Twitter/TradingView/YouTube traders for Week 1 Day 3-4 research.

**Key Fields:**
- `name`, `platform`, `profile_url`, `handle`
- `claimed_win_rate`, `claimed_returns`, `followers_count`
- `has_proof_of_trades`, `has_public_portfolio`, `has_wallet_address`
- `creator_score` (LunarCrush), `social_influence`
- Verification scores (same as wallets)

#### **research_sources**
Academic papers and institutional reports (Week 1 Day 5).

**Key Fields:**
- `title`, `source_type`, `url`, `authors`
- `published_date`, `venue`, `citations`
- `abstract`, `key_findings`, `strategy_type`
- `reported_sharpe`, `reported_returns`, `backtest_period`
- `relevance_score` - 0-10

#### **trading_strategies**
Strategy archetypes extracted from research (Week 3).

**Key Fields:**
- `name`, `archetype`, `description`
- `timeframe`, `avg_hold_time`, `win_rate`, `risk_reward_ratio`
- `entry_conditions`, `exit_conditions` (arrays)
- `technical_indicators`, `on_chain_metrics`, `social_signals` (arrays)
- `source_wallet_ids`, `source_trader_ids`, `source_research_ids` (evidence)
- **Week 4 Scoring:**
  - `performance_score` - 0-40 points
  - `practicality_score` - 0-30 points
  - `verifiability_score` - 0-30 points
  - `total_score` - 0-100 points
- `status` - identified, scored, selected, backtesting, paper_trading, live
- `priority` - 1-5 ranking

**Migration Applied:** `20251019_add_trading_research_tables`

---

### 2. Nansen MCP Service ✅

**File:** [backend/src/services/nansenMcpService.ts](backend/src/services/nansenMcpService.ts)

#### Key Methods:

**`discoverSmartMoneyWallets(filter)`**
- Week 1 Day 1-2: Query Nansen for Smart Money wallets
- Default filters:
  - Portfolio value >$100K
  - Active for 12+ months
  - Positive returns
  - Labels: Smart Money - DeFi, Smart NFT Trader, Smart LP
  - Blockchains: ethereum, solana, bsc, arbitrum
- Returns: `SmartMoneyDiscoveryResult` with wallet profiles
- Target: 30-40 wallet addresses

**`getWalletProfile(address)`**
- Fetch detailed wallet profile from Nansen Wallet Profiler
- Returns: Total trades, portfolio value, P&L, hold time, top tokens

**`getWalletTrades(address, limit)`**
- Get last N trades for wallet
- Returns: Transaction history with prices, amounts, gas fees

**`getWalletTokenActivity(address, tokenSymbol)`**
- Token God Mode: Analyze wallet's trading of specific token
- Returns: All buy/sell transactions for that token

#### Configuration:
```
NANSEN_MCP_URL=https://mcp.nansen.ai/ra/mcp/
NANSEN_API_KEY=wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR
```

---

### 3. Trading Research Service ✅

**File:** [backend/src/services/tradingResearchService.ts](backend/src/services/tradingResearchService.ts)

Coordinates Week 1-4 research activities.

#### Week 1 Day 1-2 Functions:

**`discoverSmartMoneyWallets(minPortfolioValue, minActiveMonths)`**
- Query Nansen for Smart Money wallets
- Save results to `verified_wallets` table
- Status: pending verification

**`enrichWalletData(walletAddress)`**
- Fetch detailed wallet profile from Nansen
- Fetch last 50 trades
- Update database with full wallet data

**`calculateSocialLeadingScore(walletAddress)`**
- Analyze last 20 trades
- Count trades BEFORE social spike (3-7 days): X
- Count trades DURING social spike: Y
- Count trades AFTER social peak: Z
- **Leading Score = X / (X + Y + Z)**
- Behavior types:
  - >0.5 = **Leading Indicator** (PRIORITY)
  - 0.3-0.5 = **Mixed** (SECONDARY)
  - <0.3 = **Follower** (TERTIARY)

#### Week 2 Functions:

**`calculateVerificationScores(walletAddress)`**
- **Authenticity Score** (0-10):
  - On-chain verified: +5
  - 12+ months history: +3
  - Consistent activity: +2
- **Transparency Score** (0-10):
  - Public wallet: +4
  - Trade history: +4
  - Strategy clear: +2
- **Skin in Game Score** (0-10):
  - Portfolio >$100K: +4
  - 30+ trades: +3
  - Profitable: +3
- **Total Score** >= 15/30 = **verified**, else **disqualified**

**`getResearchProgress()`**
- Returns summary of research status:
  - Total wallets
  - Breakdown by phase (week_1, week_2, etc.)
  - Breakdown by status (verified, disqualified, pending)
  - Leading indicators count
  - Total trades analyzed

---

### 4. API Endpoints ✅

**File:** [backend/src/routes/tradingResearch.ts](backend/src/routes/tradingResearch.ts)

All endpoints mounted at: `/api/v1/trading-research/`

#### **GET /progress**
Get Phase 0 research progress summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWallets": 0,
    "byPhase": { "week_1": 0, "week_2": 0 },
    "byStatus": { "verified": 0, "disqualified": 0, "pending": 0 },
    "leadingIndicators": 0,
    "totalTrades": 0,
    "timestamp": "2025-10-19T21:59:11.103Z"
  }
}
```

#### **POST /discover-wallets**
Week 1 Day 1-2: Initiate Smart Money wallet discovery.

**Body:**
```json
{
  "minPortfolioValue": 100000,
  "minActiveMonths": 12
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet discovery initiated",
  "criteria": {
    "minPortfolioValue": 100000,
    "minActiveMonths": 12
  }
}
```

#### **GET /wallets**
List all discovered wallets with filters.

**Query Params:**
- `phase` - week_1, week_2, week_3, week_4
- `status` - pending, verified, disqualified
- `behaviorType` - leading_indicator, mixed, follower
- `limit` - Number (default 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "wallets": [...],
    "count": 0
  }
}
```

#### **GET /wallets/:address**
Get detailed wallet data.

**Response:** Full wallet object with trades and social signals

#### **POST /wallets/:address/enrich**
Enrich wallet with detailed Nansen data (async).

#### **POST /wallets/:address/social-score**
Calculate social leading score.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "socialLeadingScore": 0.72
  }
}
```

#### **POST /wallets/:address/verify**
Week 2: Calculate verification scores.

**Response:** Updated wallet with verification scores

#### **GET /nansen/health**
Check Nansen MCP health.

**Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "service": "Nansen MCP"
  }
}
```

---

### 5. Environment Configuration ✅

**File:** [backend/.env](backend/.env)

```bash
# Nansen MCP (Phase 0 Trading Research)
NANSEN_MCP_URL=https://mcp.nansen.ai/ra/mcp/
NANSEN_API_KEY=wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR
```

---

## Backend Server Status

✅ **Running on port 3001**
- Trading research endpoints live at: `http://localhost:3001/api/v1/trading-research/`
- PostgreSQL database connected
- Prisma client generated with new models
- LunarCrush MCP service initialized
- Nansen MCP service ready

**Verified Endpoint Test:**
```bash
$ curl http://localhost:3001/api/v1/trading-research/progress
{"success":true,"data":{"totalWallets":0,"byPhase":{"week_1":0,"week_2":0},"byStatus":{"verified":0,"disqualified":0,"pending":0},"leadingIndicators":0,"totalTrades":0,"timestamp":"2025-10-19T21:59:11.103Z"}}
```

---

## Next Steps (Week 1 Day 1-2 Execution)

### Immediate Actions:

1. **Start Redis** (optional, for caching):
   ```bash
   docker-compose up -d redis
   ```

2. **Initiate Smart Money Discovery:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/trading-research/discover-wallets \
     -H "Content-Type: application/json" \
     -d '{"minPortfolioValue": 100000, "minActiveMonths": 12}'
   ```

3. **Monitor Progress:**
   ```bash
   curl http://localhost:3001/api/v1/trading-research/progress
   ```

4. **View Discovered Wallets:**
   ```bash
   curl "http://localhost:3001/api/v1/trading-research/wallets?phase=week_1&limit=50"
   ```

5. **Enrich Specific Wallet:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/trading-research/wallets/0xYOUR_ADDRESS/enrich
   ```

6. **Calculate Social Leading Score:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/trading-research/wallets/0xYOUR_ADDRESS/social-score
   ```

### Week 1 Day 1-2 Goals:
- **Target:** 30-40 Smart Money wallet addresses discovered
- **Data Sources:** Nansen MCP (on-chain verified)
- **Metrics:** Portfolio value, trade history, profitability
- **Output:** `verified_wallets` table populated with pending status

### Week 1 Day 3-4 (Next):
- Public trader research (Twitter, TradingView, YouTube)
- LunarCrush social validation
- Populate `public_traders` table

### Week 1 Day 5:
- Academic paper mining (Google Scholar)
- Institutional reports (Pantera, Galaxy Digital)
- Populate `research_sources` table

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Phase 0 Research Stack                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ Nansen MCP      │──────┐
│ (On-Chain Data) │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │      ┌──────────────────────┐
│ LunarCrush MCP  │──────┼─────>│ Trading Research     │
│ (Social Data)   │      │      │ Service              │
└─────────────────┘      │      └──────────────────────┘
                         │                │
┌─────────────────┐      │                │
│ Public Sources  │──────┘                │
│ (Twitter, etc.) │                       │
└─────────────────┘                       ▼
                                ┌──────────────────────┐
                                │ PostgreSQL           │
                                │ ├─ verified_wallets  │
                                │ ├─ wallet_trades     │
                                │ ├─ wallet_social_sig │
                                │ ├─ public_traders    │
                                │ ├─ research_sources  │
                                │ └─ trading_strategies│
                                └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │ Research API         │
                                │ /api/v1/trading-res  │
                                └──────────────────────┘
```

---

## Files Created/Modified

### New Files:
1. `backend/prisma/migrations/20251019_add_trading_research_tables/migration.sql`
2. `backend/src/services/nansenMcpService.ts`
3. `backend/src/services/tradingResearchService.ts`
4. `backend/src/routes/tradingResearch.ts`
5. `PHASE_0_SETUP_SUMMARY.md` (this file)

### Modified Files:
1. `backend/prisma/schema.prisma` - Added 6 new models
2. `backend/src/server.ts` - Registered trading research routes
3. `backend/.env` - Added Nansen MCP configuration
4. `backend/src/services/priceUpdateScheduler.ts` - Fixed variable name
5. `backend/src/services/accuracyScheduler.ts` - Removed invalid method call

---

## Success Metrics

✅ Database schema designed and migrated
✅ Nansen MCP service implemented
✅ Trading research service created
✅ API endpoints functional
✅ Backend server running
✅ Endpoint verified: `/api/v1/trading-research/progress`

**Phase 0 Week 1 Day 1 Setup: COMPLETE**

---

## References

- **Trading Automation Plan:** [Trading/crypto_trading_action_plan.md](Trading/crypto_trading_action_plan.md) (1026 lines)
- **Research Phase Plan:** [Trading/research_phase_action_plan.md](Trading/research_phase_action_plan.md) (1831 lines)
- **Nansen MCP Documentation:** Claude MCP Integration
- **LunarCrush API:** Social sentiment provider

---

**Generated:** October 19, 2025 23:59 UTC
**Status:** ✅ Ready for Week 1 Day 1-2 Execution
