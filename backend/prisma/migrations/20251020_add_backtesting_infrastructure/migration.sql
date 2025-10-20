-- Phase 1: Backtesting Infrastructure Tables
-- Created: 2025-10-20
-- Purpose: Support backtesting of 5 validated strategies from Phase 0

-- ============================================================================
-- BACKTESTING RUNS
-- ============================================================================

-- Backtest Configurations (Defines parameters for each backtest run)
CREATE TABLE IF NOT EXISTS backtest_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Strategy Reference
    strategy_id TEXT NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,

    -- Backtest Metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Time Period
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timeframe VARCHAR(20) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d, 1w

    -- Capital & Risk Parameters
    initial_capital DECIMAL(18, 2) NOT NULL DEFAULT 10000.00,
    position_size_pct DECIMAL(5, 4) NOT NULL DEFAULT 0.05, -- 5% per trade
    max_portfolio_heat DECIMAL(5, 4) NOT NULL DEFAULT 0.25, -- 25% max at risk
    max_drawdown_limit DECIMAL(5, 4) NOT NULL DEFAULT 0.20, -- 20% circuit breaker

    -- Trading Costs
    maker_fee DECIMAL(6, 5) NOT NULL DEFAULT 0.001, -- 0.1%
    taker_fee DECIMAL(6, 5) NOT NULL DEFAULT 0.001, -- 0.1%
    slippage_pct DECIMAL(6, 5) NOT NULL DEFAULT 0.005, -- 0.5%

    -- Execution Parameters
    latency_ms INTEGER DEFAULT 100, -- Execution delay simulation

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed

    -- Results (populated after run)
    total_trades INTEGER,
    win_rate DECIMAL(5, 4),
    total_return_pct DECIMAL(10, 4),
    sharpe_ratio DECIMAL(8, 4),
    sortino_ratio DECIMAL(8, 4),
    max_drawdown_pct DECIMAL(5, 4),
    profit_factor DECIMAL(8, 4),

    -- Execution Info
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backtest_configs_strategy ON backtest_configs(strategy_id);
CREATE INDEX idx_backtest_configs_status ON backtest_configs(status);
CREATE INDEX idx_backtest_configs_date_range ON backtest_configs(start_date, end_date);

-- Backtest Trades (Individual trades executed during backtest)
CREATE TABLE IF NOT EXISTS backtest_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Backtest Reference
    backtest_id UUID NOT NULL REFERENCES backtest_configs(id) ON DELETE CASCADE,

    -- Trade Identification
    trade_number INTEGER NOT NULL, -- Sequential within backtest
    symbol VARCHAR(50) NOT NULL, -- ETH, BTC, UNI, etc.

    -- Entry
    entry_time TIMESTAMP NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    entry_reason TEXT, -- JSON array of conditions met
    position_size DECIMAL(18, 8) NOT NULL, -- Amount of asset
    position_value_usd DECIMAL(18, 2) NOT NULL,

    -- Exit
    exit_time TIMESTAMP,
    exit_price DECIMAL(18, 8),
    exit_reason VARCHAR(100), -- stop_loss, take_profit, trailing_stop, signal_exit, time_stop

    -- Trade Performance
    pnl_usd DECIMAL(18, 2),
    pnl_pct DECIMAL(10, 4),
    fees_paid DECIMAL(18, 2),
    slippage_cost DECIMAL(18, 2),
    hold_time_hours DECIMAL(10, 2),

    -- Risk Management
    stop_loss_price DECIMAL(18, 8),
    take_profit_price DECIMAL(18, 8),
    risk_reward_ratio DECIMAL(8, 4),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed

    -- Market Context (snapshot at entry)
    market_context JSONB, -- RSI, volume, trend indicators, etc.

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backtest_trades_backtest ON backtest_trades(backtest_id);
CREATE INDEX idx_backtest_trades_symbol ON backtest_trades(symbol);
CREATE INDEX idx_backtest_trades_entry_time ON backtest_trades(entry_time);
CREATE INDEX idx_backtest_trades_status ON backtest_trades(status);

-- Backtest Metrics (Time-series performance snapshots)
CREATE TABLE IF NOT EXISTS backtest_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Backtest Reference
    backtest_id UUID NOT NULL REFERENCES backtest_configs(id) ON DELETE CASCADE,

    -- Time Point
    timestamp TIMESTAMP NOT NULL,

    -- Portfolio State
    portfolio_value DECIMAL(18, 2) NOT NULL,
    cash_balance DECIMAL(18, 2) NOT NULL,
    positions_value DECIMAL(18, 2) NOT NULL,

    -- Performance Metrics
    total_return_pct DECIMAL(10, 4) NOT NULL,
    drawdown_from_peak_pct DECIMAL(5, 4) NOT NULL,
    sharpe_ratio DECIMAL(8, 4),

    -- Active Positions
    open_positions INTEGER NOT NULL DEFAULT 0,
    portfolio_heat_pct DECIMAL(5, 4), -- % at risk

    -- Trade Statistics (cumulative)
    total_trades INTEGER NOT NULL DEFAULT 0,
    winning_trades INTEGER NOT NULL DEFAULT 0,
    losing_trades INTEGER NOT NULL DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backtest_metrics_backtest ON backtest_metrics(backtest_id);
CREATE INDEX idx_backtest_metrics_timestamp ON backtest_metrics(timestamp);

-- ============================================================================
-- MARKET DATA CACHE (For Backtesting)
-- ============================================================================

-- OHLCV Data (Historical price data for backtesting)
CREATE TABLE IF NOT EXISTS market_data_ohlcv (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    symbol VARCHAR(50) NOT NULL,
    timeframe VARCHAR(20) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d, 1w
    timestamp TIMESTAMP NOT NULL,

    -- OHLCV
    open DECIMAL(18, 8) NOT NULL,
    high DECIMAL(18, 8) NOT NULL,
    low DECIMAL(18, 8) NOT NULL,
    close DECIMAL(18, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,

    -- Metadata
    quote_volume DECIMAL(20, 2), -- Volume in USD
    trade_count INTEGER,
    data_source VARCHAR(100), -- binance, coinbase, coingecko

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(symbol, timeframe, timestamp)
);

CREATE INDEX idx_market_data_ohlcv_symbol_time ON market_data_ohlcv(symbol, timeframe, timestamp);
CREATE INDEX idx_market_data_ohlcv_timestamp ON market_data_ohlcv(timestamp);

-- Technical Indicators Cache (Pre-calculated for performance)
CREATE TABLE IF NOT EXISTS technical_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference
    symbol VARCHAR(50) NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,

    -- Moving Averages
    ema_9 DECIMAL(18, 8),
    ema_20 DECIMAL(18, 8),
    ema_50 DECIMAL(18, 8),
    ema_200 DECIMAL(18, 8),
    sma_20 DECIMAL(18, 8),
    sma_50 DECIMAL(18, 8),

    -- Momentum Indicators
    rsi_14 DECIMAL(5, 2),
    rsi_9 DECIMAL(5, 2),
    macd_line DECIMAL(18, 8),
    macd_signal DECIMAL(18, 8),
    macd_histogram DECIMAL(18, 8),

    -- Volatility
    atr_14 DECIMAL(18, 8),
    bollinger_upper DECIMAL(18, 8),
    bollinger_middle DECIMAL(18, 8),
    bollinger_lower DECIMAL(18, 8),

    -- Volume
    volume_sma_20 DECIMAL(20, 8),
    volume_ratio DECIMAL(8, 4), -- Current volume / SMA

    -- Trend
    adx_14 DECIMAL(5, 2),

    -- Support/Resistance (placeholder for future)
    support_level DECIMAL(18, 8),
    resistance_level DECIMAL(18, 8),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(symbol, timeframe, timestamp)
);

CREATE INDEX idx_technical_indicators_symbol_time ON technical_indicators(symbol, timeframe, timestamp);
CREATE INDEX idx_technical_indicators_timestamp ON technical_indicators(timestamp);

-- On-Chain Metrics Cache (DeFi-specific data for strategies)
CREATE TABLE IF NOT EXISTS onchain_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    protocol_name VARCHAR(100) NOT NULL, -- aave, curve, uniswap, etc.
    metric_type VARCHAR(100) NOT NULL, -- tvl, volume, fees, borrows, etc.
    timestamp TIMESTAMP NOT NULL,

    -- Metric Value
    value_numeric DECIMAL(20, 2),
    value_pct_change_24h DECIMAL(10, 4),
    value_pct_change_7d DECIMAL(10, 4),

    -- Additional Data
    metadata JSONB,
    data_source VARCHAR(100), -- defillama, dune, nansen

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(protocol_name, metric_type, timestamp)
);

CREATE INDEX idx_onchain_metrics_protocol ON onchain_metrics(protocol_name);
CREATE INDEX idx_onchain_metrics_type ON onchain_metrics(metric_type);
CREATE INDEX idx_onchain_metrics_timestamp ON onchain_metrics(timestamp);

-- Social Metrics Cache (LunarCrush data for social-aware strategies)
CREATE TABLE IF NOT EXISTS social_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    symbol VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,

    -- Social Volume & Sentiment
    social_volume INTEGER, -- Total mentions
    social_volume_24h_change_pct DECIMAL(10, 4),
    sentiment_score DECIMAL(5, 4), -- -1 to +1

    -- Engagement
    galaxy_score DECIMAL(8, 4), -- LunarCrush metric
    alt_rank INTEGER,

    -- Price Context
    price_usd DECIMAL(18, 8),
    price_btc DECIMAL(18, 8),

    -- Metadata
    metadata JSONB,
    data_source VARCHAR(100) DEFAULT 'lunarcrush',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(symbol, timestamp)
);

CREATE INDEX idx_social_metrics_symbol ON social_metrics(symbol);
CREATE INDEX idx_social_metrics_timestamp ON social_metrics(timestamp);

-- ============================================================================
-- WALK-FORWARD ANALYSIS
-- ============================================================================

-- Walk-Forward Periods (For robust backtesting)
CREATE TABLE IF NOT EXISTS walkforward_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Strategy Reference
    strategy_id TEXT NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,

    -- Period Definition
    period_number INTEGER NOT NULL,
    train_start TIMESTAMP NOT NULL,
    train_end TIMESTAMP NOT NULL,
    test_start TIMESTAMP NOT NULL,
    test_end TIMESTAMP NOT NULL,

    -- Results
    train_backtest_id UUID REFERENCES backtest_configs(id),
    test_backtest_id UUID REFERENCES backtest_configs(id),

    -- Performance Comparison
    train_sharpe DECIMAL(8, 4),
    test_sharpe DECIMAL(8, 4),
    sharpe_degradation_pct DECIMAL(10, 4), -- How much worse in test

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(strategy_id, period_number)
);

CREATE INDEX idx_walkforward_periods_strategy ON walkforward_periods(strategy_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE backtest_configs IS 'Defines backtest runs with parameters and results';
COMMENT ON TABLE backtest_trades IS 'Individual trades executed during backtests';
COMMENT ON TABLE backtest_metrics IS 'Time-series performance snapshots during backtests';
COMMENT ON TABLE market_data_ohlcv IS 'Historical OHLCV price data for backtesting';
COMMENT ON TABLE technical_indicators IS 'Pre-calculated technical indicators cache';
COMMENT ON TABLE onchain_metrics IS 'DeFi protocol metrics (TVL, volume, fees, etc.)';
COMMENT ON TABLE social_metrics IS 'Social sentiment and volume metrics';
COMMENT ON TABLE walkforward_periods IS 'Walk-forward analysis period definitions';
