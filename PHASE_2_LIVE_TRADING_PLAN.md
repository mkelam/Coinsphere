# Phase 2: Live Trading System - Implementation Plan

## Overview
Building on our successful backtesting system (Phase 1), Phase 2 implements automated live trading with real capital. Based on backtest results, we'll start with **Token Unlock Front-Running** strategy (+0.51% return on real data).

## Key Findings from Phase 1
- ✅ 53 backtests completed (23 simulated, 30 real data)
- ✅ Real data testing reveals realistic expectations
- ✅ Token Unlock Front-Running: Only profitable strategy (+0.51%)
- ⚠️ Most strategies need optimization (-1.53% avg return on real data)
- ⚠️ Real data generates 67% fewer trade signals (5.3 vs 15.9)

## Phase 2 Architecture

### 1. Exchange Connection Layer
**Technology:** CCXT (Cryptocurrency Exchange Trading Library)

**Features:**
- Multi-exchange support (Binance, Coinbase Pro, Kraken)
- Unified API interface across exchanges
- WebSocket connections for real-time data
- API key management with encryption
- Rate limiting and error handling

**Files to Create:**
- `backend/src/services/exchange/ExchangeManager.ts`
- `backend/src/services/exchange/BinanceConnector.ts`
- `backend/src/services/exchange/types.ts`

### 2. Position Management Engine
**Purpose:** Manage open positions, track P&L, handle orders

**Features:**
- Position tracking (open, closed, partial fills)
- Portfolio-level risk management
- Order state management (pending, filled, cancelled)
- Real-time P&L calculation
- Position sizing based on risk parameters

**Files to Create:**
- `backend/src/services/trading/PositionManager.ts`
- `backend/src/services/trading/OrderExecutor.ts`
- `backend/src/services/trading/RiskManager.ts`

### 3. Real-Time Market Data Service
**Purpose:** Stream live price data and process it

**Features:**
- WebSocket connections to exchanges
- OHLCV candle aggregation (1m, 5m, 15m, 1h, 4h)
- Order book monitoring
- Trade data streaming
- Data persistence to TimescaleDB

**Files to Create:**
- `backend/src/services/market-data/MarketDataStreamer.ts`
- `backend/src/services/market-data/CandleAggregator.ts`
- `backend/src/services/market-data/OrderBookManager.ts`

### 4. Strategy Execution Engine
**Purpose:** Execute trading strategies automatically

**Features:**
- Strategy signal generation
- Entry/exit condition monitoring
- Automated order placement
- Strategy state management
- Performance tracking

**Files to Create:**
- `backend/src/services/strategy/StrategyExecutor.ts`
- `backend/src/services/strategy/SignalGenerator.ts`
- `backend/src/services/strategy/TokenUnlockStrategy.ts`

### 5. Safety & Risk Controls
**Critical Features:**
- Maximum daily loss limits
- Position size limits
- Maximum open positions
- Circuit breakers (pause trading on errors)
- Kill switch (emergency stop all trading)
- Slippage protection
- Minimum balance checks

**Files to Create:**
- `backend/src/services/safety/CircuitBreaker.ts`
- `backend/src/services/safety/RiskLimits.ts`
- `backend/src/services/safety/EmergencyControls.ts`

### 6. Live Trading Dashboard
**Purpose:** Real-time monitoring and control

**Features:**
- Active positions display
- Real-time P&L
- Strategy performance metrics
- Trade history
- Manual override controls
- Emergency stop button
- Account balance tracking

**Files to Create:**
- `frontend/src/pages/LiveTradingDashboard.tsx`
- `frontend/src/components/trading/PositionTable.tsx`
- `frontend/src/components/trading/LivePerformance.tsx`
- `frontend/src/components/trading/EmergencyControls.tsx`

## Database Schema Updates

### New Tables

```sql
-- Live trading positions
CREATE TABLE live_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES trading_strategies(id),
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'long' or 'short'
  entry_price NUMERIC(20, 8) NOT NULL,
  current_price NUMERIC(20, 8),
  quantity NUMERIC(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'open', 'closed', 'partial'
  pnl NUMERIC(20, 8),
  pnl_pct NUMERIC(10, 4),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  exit_price NUMERIC(20, 8),
  stop_loss NUMERIC(20, 8),
  take_profit NUMERIC(20, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live orders
CREATE TABLE live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES live_positions(id),
  exchange VARCHAR(50) NOT NULL,
  exchange_order_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'market', 'limit', 'stop'
  side VARCHAR(10) NOT NULL, -- 'buy', 'sell'
  price NUMERIC(20, 8),
  quantity NUMERIC(20, 8) NOT NULL,
  filled_quantity NUMERIC(20, 8) DEFAULT 0,
  status VARCHAR(20) NOT NULL, -- 'pending', 'filled', 'cancelled', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

-- Strategy execution state
CREATE TABLE strategy_execution_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES trading_strategies(id),
  status VARCHAR(20) NOT NULL, -- 'active', 'paused', 'stopped'
  last_signal_time TIMESTAMPTZ,
  last_trade_time TIMESTAMPTZ,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl NUMERIC(20, 8) DEFAULT 0,
  daily_pnl NUMERIC(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading account balances
CREATE TABLE account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange VARCHAR(50) NOT NULL,
  asset VARCHAR(20) NOT NULL,
  free NUMERIC(20, 8) NOT NULL,
  locked NUMERIC(20, 8) NOT NULL,
  total NUMERIC(20, 8) NOT NULL,
  usd_value NUMERIC(20, 8),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exchange, asset)
);
```

## Implementation Phases

### Phase 2.1: Foundation (Week 1-2)
- [x] Set up CCXT integration
- [ ] Implement exchange connectors (Binance first)
- [ ] Create position management system
- [ ] Build order execution engine
- [ ] Add database schema updates

### Phase 2.2: Strategy Execution (Week 3-4)
- [ ] Implement Token Unlock Front-Running strategy
- [ ] Create signal generation logic
- [ ] Build automated execution system
- [ ] Add strategy state management
- [ ] Implement performance tracking

### Phase 2.3: Safety & Monitoring (Week 5-6)
- [ ] Build risk management system
- [ ] Implement circuit breakers
- [ ] Add emergency controls
- [ ] Create live trading dashboard
- [ ] Build real-time monitoring

### Phase 2.4: Testing & Deployment (Week 7-8)
- [ ] Paper trading mode (simulated with real data)
- [ ] Small capital testing ($100-500)
- [ ] Performance monitoring
- [ ] Bug fixes and optimization
- [ ] Production deployment

## Risk Management Parameters

### Position Sizing
- **Max Position Size:** 20% of portfolio per trade
- **Max Portfolio Heat:** 30% (total risk across all positions)
- **Min Position Size:** $50 USD equivalent

### Stop Loss & Take Profit
- **Default Stop Loss:** 2% below entry
- **Default Take Profit:** 5% above entry
- **Trailing Stop:** Enabled after 3% profit

### Circuit Breakers
- **Daily Loss Limit:** -5% of portfolio
- **Consecutive Losses:** Stop after 3 consecutive losing trades
- **Max Drawdown:** Pause at -10% from peak

### Account Protection
- **Min Account Balance:** $100 USD
- **Emergency Reserve:** Keep 20% in stablecoins
- **Max Open Positions:** 5 simultaneous

## Technology Stack

### Backend
- **CCXT:** v4.2.0 - Exchange connectivity
- **Bull:** v4.12.0 - Job queue for order execution
- **Winston:** v3.11.0 - Logging
- **Redis:** v7.0 - Caching and pub/sub

### Frontend
- **TanStack Query:** v5.12.0 - Real-time data
- **Recharts:** v2.10.3 - Live charts
- **React Hook Form:** v7.48.2 - Controls

## Security Considerations

1. **API Key Storage:** Encrypted in database, never in logs
2. **IP Whitelisting:** Configure exchange API keys with IP restrictions
3. **2FA:** Require 2FA for emergency stop actions
4. **Audit Logging:** Log all trading decisions and actions
5. **Rate Limiting:** Respect exchange rate limits

## Monitoring & Alerts

### Critical Alerts (Immediate)
- Position opened/closed
- Daily loss limit approaching (80%)
- Circuit breaker triggered
- Exchange API errors
- Order execution failures

### Performance Alerts (Daily)
- Daily P&L summary
- Win rate below 35%
- Sharpe ratio dropping
- Unusual trading volume

## Next Steps

1. ✅ Complete Phase 1 backtesting with real data
2. 🔄 Implement exchange connection layer
3. 🔄 Build position management engine
4. 🔄 Create safety controls
5. 🔄 Develop live trading dashboard
6. ⏳ Paper trading testing
7. ⏳ Live trading with small capital

## Success Metrics

- **Target Return:** +5% monthly (conservative based on backtests)
- **Max Drawdown:** < 10%
- **Win Rate:** > 40%
- **Sharpe Ratio:** > 1.0
- **Uptime:** 99%+ (automated execution)

---

**Status:** Phase 2.1 Starting - Exchange Connection Layer
**Last Updated:** 2025-10-20
**Next Review:** Weekly sprint reviews
