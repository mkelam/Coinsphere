# Degen Risk Score Algorithm Specification

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Owner:** ML/Quantitative Team
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Risk Score Overview](#risk-score-overview)
3. [Algorithm Design](#algorithm-design)
4. [Factor Definitions](#factor-definitions)
5. [Calculation Methodology](#calculation-methodology)
6. [Score Interpretation](#score-interpretation)
7. [Implementation Details](#implementation-details)
8. [Data Sources](#data-sources)
9. [Testing & Validation](#testing--validation)
10. [Maintenance & Updates](#maintenance--updates)

---

## 1. Executive Summary

The **Degen Risk Score** is a proprietary 0-100 metric that quantifies the investment risk level of cryptocurrency assets. Lower scores indicate safer, more established assets (e.g., BTC = 15), while higher scores indicate speculative, high-volatility assets (e.g., new meme coins = 95).

**Core Purpose:**
- Help users make informed portfolio decisions
- Provide at-a-glance risk assessment for 2,000+ crypto assets
- Enable portfolio-level risk aggregation
- Support risk-based alerts and notifications

**Algorithm Approach:**
- Weighted multi-factor model (7 core factors)
- Data-driven weights calibrated on historical outcomes
- Real-time updates as market conditions change
- Transparent, explainable scores (no black-box ML)

---

## 2. Risk Score Overview

### 2.1 What is a Degen Risk Score?

A single numerical value (0-100) representing the overall risk profile of a cryptocurrency asset:

- **0-20**: Blue-chip assets (BTC, ETH, stablecoins)
- **21-40**: Established altcoins (ADA, SOL, MATIC)
- **41-60**: Mid-cap projects with moderate risk (NEAR, FTM)
- **61-80**: High-risk speculative assets (new DeFi tokens)
- **81-100**: Extreme risk "degen" plays (meme coins, micro-caps)

### 2.2 Use Cases

**For Users:**
- Quickly assess risk before buying
- Balance portfolio risk (mix low + high scores)
- Set risk-based alerts ("notify if any holding exceeds score 70")

**For the Platform:**
- Filter assets by risk tier in UI
- Calculate portfolio-wide risk score (weighted average)
- Trigger warnings for high-risk allocations ("80% of your portfolio is in 70+ risk assets")

### 2.3 Key Properties

- **Granular**: 101 discrete levels (0-100)
- **Relative**: Scores are comparable across assets
- **Dynamic**: Updated every 6 hours as market data changes
- **Transparent**: Users can see factor breakdown
- **Calibrated**: Validated against historical rug pulls, delistings, crashes

---

## 3. Algorithm Design

### 3.1 Multi-Factor Weighted Model

The Degen Risk Score is calculated as a **weighted sum** of 7 normalized factors:

```
Risk Score = w1·F1 + w2·F2 + w3·F3 + w4·F4 + w5·F5 + w6·F6 + w7·F7
```

Where:
- **Fi** = Normalized factor score (0-100 scale)
- **wi** = Weight assigned to factor i
- **Σ wi = 1** (weights sum to 100%)

### 3.2 Seven Core Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| **F1: Market Capitalization** | 25% | Asset size and liquidity |
| **F2: Volatility (90-day)** | 20% | Price stability |
| **F3: Liquidity Depth** | 15% | Order book thickness |
| **F4: Age & Track Record** | 15% | Time since launch |
| **F5: Development Activity** | 10% | GitHub commits, active developers |
| **F6: Centralization Risk** | 10% | Token distribution, holder concentration |
| **F7: Audit & Security** | 5% | Smart contract audits, exploits history |

**Why These 7?**
- Cover fundamental risk dimensions (size, volatility, liquidity, maturity)
- Data is publicly available for 2,000+ assets
- Proven correlation with negative outcomes (rug pulls, delistings)
- Actionable for users (understand why score is high/low)

### 3.3 Weight Rationale

**Market Cap (25%)**: Largest weight because size is the strongest predictor of stability. $100B assets (BTC) rarely go to zero, while $1M micro-caps often do.

**Volatility (20%)**: High volatility = high risk. Second-largest weight because it directly measures price instability.

**Liquidity (15%)**: Thin order books = slippage risk, manipulation risk. Critical for actually being able to sell.

**Age (15%)**: Projects that have survived multiple market cycles are proven. New projects (<6 months) are unproven.

**Development (10%)**: Active GitHub = ongoing work. Abandoned projects = high risk.

**Centralization (10%)**: If 5 wallets hold 80% of supply, they can dump and crash the price.

**Audit/Security (5%)**: Smallest weight because most assets lack audits. But unaudited DeFi = major exploit risk.

---

## 4. Factor Definitions

### 4.1 F1: Market Capitalization (25% weight)

**Raw Metric:** Fully diluted market cap in USD

**Normalization:**
```
F1 = 100 - min(100, 20 * log10(market_cap_usd / 1,000,000))
```

**Scoring Logic:**
- $1M market cap → F1 = 100 (extreme risk)
- $10M market cap → F1 = 80
- $100M market cap → F1 = 60
- $1B market cap → F1 = 40
- $10B market cap → F1 = 20
- $100B+ market cap → F1 = 0 (BTC, ETH)

**Data Source:** CoinGecko API `/coins/{id}` → `market_data.market_cap.usd`

**Edge Cases:**
- If market cap unavailable → F1 = 100 (assume extreme risk)
- If market cap = $0 → F1 = 100

---

### 4.2 F2: Volatility (20% weight)

**Raw Metric:** 90-day annualized volatility (standard deviation of daily returns)

**Calculation:**
```python
daily_returns = (price[t] - price[t-1]) / price[t-1]
volatility_90d = daily_returns.std() * sqrt(365)  # Annualize
F2 = min(100, volatility_90d * 100)  # Scale to 0-100
```

**Scoring Logic:**
- 0% volatility → F2 = 0 (stablecoins)
- 25% volatility → F2 = 25 (BTC/ETH typical)
- 50% volatility → F2 = 50 (altcoins)
- 100%+ volatility → F2 = 100 (extreme, meme coins)

**Data Source:** Internal `price_history` table (90 days of OHLCV data)

**Edge Cases:**
- If <30 days of price data → F2 = 100 (insufficient history = high risk)
- If volatility > 200% → F2 = 100 (cap at maximum)

---

### 4.3 F3: Liquidity Depth (15% weight)

**Raw Metric:** Average bid-ask spread + slippage for $10K trade

**Calculation:**
```python
# From exchange order book
bid_ask_spread = (best_ask - best_bid) / best_bid
slippage_10k = execute_10k_market_order() - mid_price

liquidity_score = (bid_ask_spread * 0.5 + slippage_10k * 0.5) * 1000
F3 = min(100, liquidity_score)
```

**Scoring Logic:**
- 0.01% spread, 0.05% slippage → F3 = 6 (BTC on Binance)
- 0.1% spread, 0.2% slippage → F3 = 30 (altcoins)
- 1% spread, 2% slippage → F3 = 100 (low liquidity)

**Data Source:** CCXT `fetchOrderBook()` from top 3 exchanges

**Edge Cases:**
- If not listed on any major exchange → F3 = 100
- If order book depth < $50K total → F3 = 100

---

### 4.4 F4: Age & Track Record (15% weight)

**Raw Metric:** Days since token launch / listing

**Calculation:**
```
F4 = 100 - min(100, days_since_launch / 10)
```

**Scoring Logic:**
- 0-30 days → F4 = 100 (brand new, unproven)
- 90 days → F4 = 91
- 180 days → F4 = 82
- 365 days → F4 = 63 (survived 1 year)
- 730 days → F4 = 27 (survived 2 years)
- 1000+ days → F4 = 0 (BTC, ETH, long track record)

**Data Source:** CoinGecko API `/coins/{id}` → `genesis_date` or first price date

**Edge Cases:**
- If launch date unknown → use first price data date
- If age > 3000 days → F4 = 0 (cap at maximum safety)

---

### 4.5 F5: Development Activity (10% weight)

**Raw Metric:** GitHub commits in last 90 days + active contributors

**Calculation:**
```python
commits_90d = github_api.get_commits(since=90_days_ago).count()
contributors_90d = len(unique_commit_authors)

dev_score = min(100, commits_90d / 2) * 0.7 + min(100, contributors_90d * 10) * 0.3
F5 = 100 - dev_score
```

**Scoring Logic:**
- 0 commits, 0 contributors → F5 = 100 (abandoned project)
- 10 commits, 2 contributors → F5 = 70
- 50 commits, 5 contributors → F5 = 40
- 200+ commits, 10+ contributors → F5 = 0 (very active)

**Data Source:** GitHub API for project's main repository

**Edge Cases:**
- If no public GitHub repo → F5 = 80 (lack of transparency)
- If repo is archived → F5 = 100
- If commits are automated/bot-generated → exclude from count

---

### 4.6 F6: Centralization Risk (10% weight)

**Raw Metric:** Top 10 holders % of total supply + Gini coefficient

**Calculation:**
```python
top_10_pct = sum(top_10_holder_balances) / total_supply * 100
gini = calculate_gini_coefficient(all_holder_balances)

F6 = (top_10_pct * 0.6) + (gini * 100 * 0.4)
```

**Scoring Logic:**
- Top 10 hold 10%, Gini = 0.3 → F6 = 18 (well distributed, BTC)
- Top 10 hold 50%, Gini = 0.7 → F6 = 58 (moderate centralization)
- Top 10 hold 90%, Gini = 0.95 → F6 = 92 (extreme centralization)

**Data Source:** On-chain data from The Graph or block explorers

**Edge Cases:**
- If holder data unavailable → F6 = 70 (assume moderate risk)
- Exclude exchange wallets from "top holders" (use known addresses)
- For tokens with staking, use circulating supply not total supply

---

### 4.7 F7: Audit & Security (5% weight)

**Raw Metric:** Number of professional audits + exploit history

**Calculation:**
```python
audit_score = 0
if has_audit_from_top_firm:  # CertiK, Trail of Bits, etc.
    audit_score += 40
if has_multiple_audits:
    audit_score += 30
if has_bug_bounty_program:
    audit_score += 30

exploit_penalty = 0
if had_critical_exploit_last_year:
    exploit_penalty = 80
elif had_medium_exploit_last_year:
    exploit_penalty = 40

F7 = max(0, 100 - audit_score + exploit_penalty)
```

**Scoring Logic:**
- No audit, no exploit → F7 = 100
- 1 audit from top firm, no exploit → F7 = 60
- Multiple audits + bug bounty, no exploit → F7 = 0
- Had critical exploit last year → F7 = 100 (even if audited)

**Data Source:**
- Manual database of audit reports (updated monthly)
- DeFi Llama exploits database
- Project documentation

**Edge Cases:**
- Only applies to smart contract platforms (Ethereum, BSC, etc.)
- For non-smart-contract coins (BTC, LTC) → F7 = 0 (N/A)
- Self-audits don't count, must be independent 3rd party

---

## 5. Calculation Methodology

### 5.1 Step-by-Step Process

**Step 1: Gather Raw Data**
```python
# Fetch all required data for asset
data = {
    'market_cap': coingecko.get_market_cap(coin_id),
    'price_history_90d': db.query_price_history(symbol, days=90),
    'order_book': ccxt.binance.fetch_order_book(symbol),
    'genesis_date': coingecko.get_genesis_date(coin_id),
    'github_commits': github.get_commits(repo, since='90d'),
    'top_holders': thegraph.get_top_holders(contract_address, n=10),
    'audits': db.query_audits(coin_id),
    'exploits': defi_llama.get_exploits(protocol_name)
}
```

**Step 2: Calculate Normalized Factor Scores**
```python
F1 = calculate_market_cap_score(data['market_cap'])
F2 = calculate_volatility_score(data['price_history_90d'])
F3 = calculate_liquidity_score(data['order_book'])
F4 = calculate_age_score(data['genesis_date'])
F5 = calculate_development_score(data['github_commits'])
F6 = calculate_centralization_score(data['top_holders'])
F7 = calculate_audit_score(data['audits'], data['exploits'])
```

**Step 3: Apply Weights and Calculate Final Score**
```python
weights = {
    'market_cap': 0.25,
    'volatility': 0.20,
    'liquidity': 0.15,
    'age': 0.15,
    'development': 0.10,
    'centralization': 0.10,
    'audit': 0.05
}

risk_score = (
    weights['market_cap'] * F1 +
    weights['volatility'] * F2 +
    weights['liquidity'] * F3 +
    weights['age'] * F4 +
    weights['development'] * F5 +
    weights['centralization'] * F6 +
    weights['audit'] * F7
)

# Round to integer
final_score = round(risk_score)
```

**Step 4: Store Result with Metadata**
```python
db.insert_risk_score({
    'asset_symbol': symbol,
    'risk_score': final_score,
    'factors': {
        'market_cap': F1,
        'volatility': F2,
        'liquidity': F3,
        'age': F4,
        'development': F5,
        'centralization': F6,
        'audit': F7
    },
    'calculated_at': datetime.now(),
    'data_version': '1.0'
})
```

### 5.2 Example Calculation: Bitcoin (BTC)

**Raw Data:**
- Market cap: $520 billion
- 90-day volatility: 28% annualized
- Bid-ask spread: 0.01%, slippage: 0.03%
- Age: 5,000+ days
- GitHub: 500 commits/90d, 50 contributors
- Top 10 holders: 12% of supply
- Audits: Core protocol (no smart contracts), no exploits

**Factor Scores:**
```
F1 = 100 - min(100, 20 * log10(520,000,000,000 / 1,000,000))
   = 100 - min(100, 20 * log10(520,000,000))
   = 100 - min(100, 20 * 8.72)
   = 100 - 100 = 0

F2 = min(100, 28 * 100) = 28

F3 = min(100, (0.0001 * 0.5 + 0.0003 * 0.5) * 1000)
   = min(100, 0.2) = 0.2

F4 = 100 - min(100, 5000 / 10) = 100 - 100 = 0

F5 = 100 - (min(100, 500/2) * 0.7 + min(100, 50*10) * 0.3)
   = 100 - (100 * 0.7 + 100 * 0.3) = 0

F6 = (12 * 0.6) + (0.35 * 100 * 0.4)  # Gini ~0.35 for BTC
   = 7.2 + 14 = 21.2

F7 = 0  # Core protocol, no smart contracts
```

**Final Score:**
```
Risk = 0.25(0) + 0.20(28) + 0.15(0.2) + 0.15(0) + 0.10(0) + 0.10(21.2) + 0.05(0)
     = 0 + 5.6 + 0.03 + 0 + 0 + 2.12 + 0
     = 7.75
     ≈ 8 (rounded)
```

**BTC Degen Risk Score: 8/100** ✅ (Very low risk, blue-chip asset)

---

### 5.3 Example Calculation: New Meme Coin

**Raw Data:**
- Market cap: $2 million
- 90-day volatility: 180% annualized
- Bid-ask spread: 2%, slippage: 5%
- Age: 15 days
- GitHub: No public repo
- Top 10 holders: 85% of supply
- Audits: None, no exploits yet

**Factor Scores:**
```
F1 = 100 - min(100, 20 * log10(2,000,000 / 1,000,000))
   = 100 - min(100, 20 * 0.30) = 100 - 6 = 94

F2 = min(100, 180 * 100) = 100

F3 = min(100, (0.02 * 0.5 + 0.05 * 0.5) * 1000)
   = min(100, 35) = 35

F4 = 100 - min(100, 15 / 10) = 100 - 1.5 = 98.5

F5 = 80  # No public repo = 80 default

F6 = (85 * 0.6) + (0.92 * 100 * 0.4)  # Gini ~0.92
   = 51 + 36.8 = 87.8

F7 = 100  # No audit
```

**Final Score:**
```
Risk = 0.25(94) + 0.20(100) + 0.15(35) + 0.15(98.5) + 0.10(80) + 0.10(87.8) + 0.05(100)
     = 23.5 + 20 + 5.25 + 14.78 + 8 + 8.78 + 5
     = 85.31
     ≈ 85 (rounded)
```

**Meme Coin Degen Risk Score: 85/100** 🔥 (Extreme risk)

---

## 6. Score Interpretation

### 6.1 Risk Tiers

| Score Range | Tier | Description | Example Assets |
|-------------|------|-------------|----------------|
| **0-20** | Blue-Chip | Safest crypto assets, institutional-grade | BTC (8), ETH (12), USDC (5) |
| **21-40** | Established | Proven altcoins with solid track record | ADA (28), SOL (35), MATIC (32) |
| **41-60** | Moderate Risk | Mid-cap projects, higher volatility | NEAR (48), FTM (55), ALGO (42) |
| **61-80** | High Risk | Speculative plays, unproven or volatile | New DeFi tokens, low-cap alts |
| **81-100** | Extreme Risk | "Degen" territory, very high chance of loss | Meme coins, micro-caps, rug pulls |

### 6.2 Portfolio-Level Risk Score

Calculate weighted average based on allocation:

```python
portfolio_risk = sum(holding.value_usd * holding.asset.risk_score for holding in holdings) / total_portfolio_value
```

**Example Portfolio:**
- 50% BTC (score 8) → contributes 4.0
- 30% ETH (score 12) → contributes 3.6
- 15% SOL (score 35) → contributes 5.25
- 5% SHIB (score 88) → contributes 4.4

**Portfolio Risk Score: 17.25** (Low risk, conservative allocation)

### 6.3 Risk Warnings

Trigger UI warnings based on thresholds:

| Condition | Warning Level | Message |
|-----------|---------------|---------|
| Individual asset score > 80 | ⚠️ High | "This asset has an extreme risk score of {score}. Consider your risk tolerance." |
| Portfolio score > 60 | ⚠️ High | "Your portfolio has a high-risk score of {score}. {pct}% is in risky assets." |
| New purchase score > current portfolio + 20 | ⚠️ Medium | "Adding this asset will increase your portfolio risk from {old} to {new}." |

---

## 7. Implementation Details

### 7.1 Database Schema

**Table: `risk_scores`**
```sql
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_symbol VARCHAR(20) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),

    -- Factor breakdown
    factor_market_cap NUMERIC(5,2),
    factor_volatility NUMERIC(5,2),
    factor_liquidity NUMERIC(5,2),
    factor_age NUMERIC(5,2),
    factor_development NUMERIC(5,2),
    factor_centralization NUMERIC(5,2),
    factor_audit NUMERIC(5,2),

    -- Metadata
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_version VARCHAR(10) NOT NULL DEFAULT '1.0',

    UNIQUE(asset_symbol, calculated_at)
);

CREATE INDEX idx_risk_scores_symbol ON risk_scores(asset_symbol);
CREATE INDEX idx_risk_scores_calculated_at ON risk_scores(calculated_at DESC);
```

### 7.2 API Endpoint

**GET `/api/v1/assets/{symbol}/risk-score`**

Response:
```json
{
  "asset_symbol": "BTC",
  "risk_score": 8,
  "risk_tier": "Blue-Chip",
  "factors": {
    "market_cap": {"score": 0, "weight": 0.25, "contribution": 0},
    "volatility": {"score": 28, "weight": 0.20, "contribution": 5.6},
    "liquidity": {"score": 0.2, "weight": 0.15, "contribution": 0.03},
    "age": {"score": 0, "weight": 0.15, "contribution": 0},
    "development": {"score": 0, "weight": 0.10, "contribution": 0},
    "centralization": {"score": 21.2, "weight": 0.10, "contribution": 2.12},
    "audit": {"score": 0, "weight": 0.05, "contribution": 0}
  },
  "calculated_at": "2025-10-07T14:30:00Z",
  "next_update": "2025-10-07T20:30:00Z"
}
```

### 7.3 Calculation Service

**File:** `ml-service/app/services/risk_score_service.py`

```python
class RiskScoreCalculator:
    def __init__(self, data_fetcher: DataFetcher):
        self.data_fetcher = data_fetcher
        self.weights = {
            'market_cap': 0.25,
            'volatility': 0.20,
            'liquidity': 0.15,
            'age': 0.15,
            'development': 0.10,
            'centralization': 0.10,
            'audit': 0.05
        }

    def calculate_score(self, asset_symbol: str) -> RiskScore:
        """Calculate risk score for a single asset"""
        data = self.data_fetcher.fetch_all_data(asset_symbol)

        factors = {
            'market_cap': self._calc_market_cap_score(data.market_cap),
            'volatility': self._calc_volatility_score(data.price_history),
            'liquidity': self._calc_liquidity_score(data.order_book),
            'age': self._calc_age_score(data.genesis_date),
            'development': self._calc_development_score(data.github_data),
            'centralization': self._calc_centralization_score(data.holders),
            'audit': self._calc_audit_score(data.audits, data.exploits)
        }

        total_score = sum(
            self.weights[factor] * score
            for factor, score in factors.items()
        )

        return RiskScore(
            asset_symbol=asset_symbol,
            risk_score=round(total_score),
            factors=factors,
            calculated_at=datetime.now()
        )

    def _calc_market_cap_score(self, market_cap: float) -> float:
        """F1: Market Cap (lower cap = higher risk)"""
        if market_cap <= 0:
            return 100.0
        return max(0, 100 - min(100, 20 * math.log10(market_cap / 1_000_000)))

    def _calc_volatility_score(self, price_history: List[float]) -> float:
        """F2: 90-day volatility"""
        if len(price_history) < 30:
            return 100.0  # Insufficient data

        returns = np.diff(price_history) / price_history[:-1]
        volatility_annual = np.std(returns) * np.sqrt(365)
        return min(100.0, volatility_annual * 100)

    # ... other factor calculation methods
```

### 7.4 Batch Update Job

**Schedule:** Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)

**Process:**
```python
# Cron job: 0 */6 * * *
def update_all_risk_scores():
    assets = db.query("SELECT DISTINCT symbol FROM assets WHERE is_active = true")

    for asset in assets:
        try:
            score = RiskScoreCalculator().calculate_score(asset.symbol)
            db.insert_risk_score(score)
            logger.info(f"Updated {asset.symbol}: {score.risk_score}")
        except Exception as e:
            logger.error(f"Failed to calculate {asset.symbol}: {e}")
            # Continue with next asset, don't fail entire batch

    logger.info(f"Batch complete: {len(assets)} assets updated")
```

---

## 8. Data Sources

### 8.1 Required Data & APIs

| Factor | Data Source | API/Method | Update Frequency |
|--------|-------------|------------|------------------|
| Market Cap | CoinGecko | `/coins/{id}` | Hourly |
| Price History | Internal DB | `price_history` table | Real-time (via WebSocket) |
| Order Book | CCXT | `fetchOrderBook()` | On-demand |
| Genesis Date | CoinGecko | `/coins/{id}` | Once (static) |
| GitHub Commits | GitHub API | `/repos/{owner}/{repo}/commits` | Daily |
| Top Holders | The Graph | Custom query per chain | Daily |
| Audits | Manual DB | Internal `audits` table | Monthly |
| Exploits | DeFi Llama | `/protocol/{name}` | Daily |

### 8.2 Data Quality

**Missing Data Handling:**
- If primary data unavailable → use fallback source
- If fallback unavailable → use conservative default (high risk score)
- Log all missing data events for monitoring

**Example:**
```python
def get_market_cap(symbol: str) -> float:
    # Primary source
    market_cap = coingecko.get_market_cap(symbol)
    if market_cap is not None:
        return market_cap

    # Fallback: calculate from price * circulating supply
    price = db.get_latest_price(symbol)
    supply = coingecko.get_circulating_supply(symbol)
    if price and supply:
        return price * supply

    # No data available → return 0 (will result in F1 = 100)
    logger.warning(f"No market cap data for {symbol}, defaulting to high risk")
    return 0.0
```

---

## 9. Testing & Validation

### 9.1 Unit Tests

**Test Coverage:**
- Each factor calculation function (7 tests)
- Normalization edge cases (min/max values)
- Weight validation (sum to 1.0)
- Score range (always 0-100)

**Example Test:**
```python
def test_market_cap_score():
    calc = RiskScoreCalculator()

    # Test known values
    assert calc._calc_market_cap_score(1_000_000) == 100  # $1M
    assert calc._calc_market_cap_score(100_000_000_000) == 0  # $100B

    # Test edge cases
    assert calc._calc_market_cap_score(0) == 100
    assert calc._calc_market_cap_score(-1000) == 100

    # Test logarithmic scaling
    score_1b = calc._calc_market_cap_score(1_000_000_000)
    score_10b = calc._calc_market_cap_score(10_000_000_000)
    assert score_10b < score_1b  # Higher cap = lower risk
```

### 9.2 Backtesting

**Validation Method:** Test if high-risk scores predicted negative outcomes

**Test Data:**
- 50 known rug pulls from 2023-2024
- 30 delisted assets from major exchanges
- 20 blue-chip assets (should have low scores)

**Success Criteria:**
- 80%+ of rug pulls had score > 70 before collapse
- 70%+ of delistings had score > 60
- 90%+ of blue-chips have score < 30

**Backtesting Script:**
```python
def validate_historical_scores():
    rug_pulls = load_rug_pull_dataset()  # 50 known cases

    correct_predictions = 0
    for case in rug_pulls:
        # Calculate what the score would have been 7 days before rug pull
        historical_score = calculate_score_at_date(
            case.symbol,
            case.rug_pull_date - timedelta(days=7)
        )

        if historical_score > 70:  # Threshold for "extreme risk"
            correct_predictions += 1
            logger.info(f"✅ {case.symbol}: Score {historical_score} predicted rug pull")
        else:
            logger.warning(f"❌ {case.symbol}: Score {historical_score} missed rug pull")

    accuracy = correct_predictions / len(rug_pulls)
    logger.info(f"Rug pull prediction accuracy: {accuracy:.1%}")
    assert accuracy >= 0.80, "Must achieve 80%+ accuracy"
```

### 9.3 Sensitivity Analysis

Test how changes in weights affect scores:

```python
def test_weight_sensitivity():
    # Calculate BTC score with default weights
    base_score = calculate_score('BTC', weights=DEFAULT_WEIGHTS)

    # Test +10% weight on volatility
    modified_weights = DEFAULT_WEIGHTS.copy()
    modified_weights['volatility'] = 0.30
    modified_weights['market_cap'] = 0.15  # Reduce market cap to keep sum=1

    new_score = calculate_score('BTC', weights=modified_weights)

    # Score should increase (volatility factor is 28 for BTC)
    assert new_score > base_score
    logger.info(f"BTC score changed from {base_score} to {new_score} (+10% vol weight)")
```

---

## 10. Maintenance & Updates

### 10.1 Weight Tuning

**Process:** Quarterly review of weights based on:
- Backtesting accuracy on new rug pulls/delistings
- User feedback ("scores seem too high/low")
- Market regime changes (e.g., 2024 vs 2021 bull market)

**Weight Update Procedure:**
1. Data Science team proposes new weights
2. Backtest on last 6 months of outcomes
3. If accuracy improves by >5% → deploy to staging
4. A/B test for 2 weeks (50% users see new scores)
5. If no user complaints → deploy to production
6. Document change in `CHANGELOG.md`

### 10.2 Factor Addition

**Potential Future Factors:**
- **Social Sentiment Score** (Twitter/Reddit mentions)
- **Regulatory Risk** (SEC investigations, banned in countries)
- **Smart Contract Complexity** (lines of code, dependencies)
- **Team Doxxing** (anonymous vs. public team)

**Evaluation Criteria for New Factors:**
- Must improve backtest accuracy by >3%
- Must be available for >70% of assets
- Must update at least daily
- Must not slow down calculation by >50ms

### 10.3 Version Control

All algorithm changes are versioned:

```sql
ALTER TABLE risk_scores ADD COLUMN algorithm_version VARCHAR(10) DEFAULT '1.0';
```

**Version History:**
- **v1.0** (2025-10-07): Initial 7-factor model
- **v1.1** (Future): Add social sentiment factor (weight TBD)
- **v2.0** (Future): Machine learning model replacing weighted sum

**Migration Strategy:**
- Keep v1.0 scores in production for 30 days after v1.1 launch
- Show both scores in UI during transition ("New Risk Score: 42 | Old: 38")
- User feedback determines when to fully deprecate old version

### 10.4 Monitoring

**Key Metrics:**
- Calculation success rate (target: >99.5%)
- Average calculation time (target: <500ms per asset)
- Data availability rate per factor (target: >95%)
- Score distribution (should be roughly normal, mean ~50)

**Alerts:**
- If >10% of calculations fail → page on-call engineer
- If average score shifts by >10 points week-over-week → investigate
- If any blue-chip asset (BTC, ETH) scores >40 → manual review

**Dashboard:**
```sql
-- Daily score distribution
SELECT
    CASE
        WHEN risk_score BETWEEN 0 AND 20 THEN 'Blue-Chip'
        WHEN risk_score BETWEEN 21 AND 40 THEN 'Established'
        WHEN risk_score BETWEEN 41 AND 60 THEN 'Moderate'
        WHEN risk_score BETWEEN 61 AND 80 THEN 'High Risk'
        ELSE 'Extreme Risk'
    END as tier,
    COUNT(*) as asset_count,
    AVG(risk_score) as avg_score
FROM risk_scores
WHERE calculated_at > NOW() - INTERVAL '1 day'
GROUP BY tier
ORDER BY tier;
```

---

## Appendix A: Reference Scores

**Blue-Chip Assets (0-20):**
- BTC: 8
- ETH: 12
- USDC: 5
- USDT: 7
- BNB: 18

**Established Altcoins (21-40):**
- ADA: 28
- SOL: 35
- DOT: 32
- MATIC: 29
- AVAX: 36

**Mid-Cap (41-60):**
- NEAR: 48
- FTM: 55
- ALGO: 42
- ATOM: 45
- HBAR: 52

**High Risk (61-80):**
- New DeFi tokens (first 6 months): 65-75
- Low-cap altcoins (<$50M): 70-80
- Tokens with no audits: 65+

**Extreme Risk (81-100):**
- Meme coins (SHIB, DOGE derivatives): 85-95
- Micro-caps (<$5M): 90-100
- Known scams/rug pulls: 95-100

---

**Document End**

*This specification will be updated quarterly based on backtesting results and market feedback. Next review: January 2026.*
