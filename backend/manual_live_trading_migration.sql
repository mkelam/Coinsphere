-- Phase 2: Live Trading Tables Migration
-- Created: 2025-10-20

-- Live Positions Table
CREATE TABLE IF NOT EXISTS live_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
  entry_price DECIMAL(18, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'partial', 'closed')),
  pnl DECIMAL(18, 2) DEFAULT 0,
  pnl_percent DECIMAL(10, 4),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  entry_order_id TEXT,
  exit_order_id TEXT,
  close_reason VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_live_positions_strategy ON live_positions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_live_positions_status ON live_positions(status);
CREATE INDEX IF NOT EXISTS idx_live_positions_exchange ON live_positions(exchange);
CREATE INDEX IF NOT EXISTS idx_live_positions_symbol ON live_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_live_positions_created ON live_positions(created_at);

-- Live Orders Table
CREATE TABLE IF NOT EXISTS live_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
  position_id UUID,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(18, 8),
  stop_price DECIMAL(18, 8),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed', 'canceled', 'expired', 'rejected')),
  filled DECIMAL(20, 8) DEFAULT 0,
  remaining DECIMAL(20, 8) NOT NULL,
  avg_fill_price DECIMAL(18, 8),
  fee DECIMAL(18, 8),
  fee_currency VARCHAR(20),
  exchange_order_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_live_orders_strategy ON live_orders(strategy_id);
CREATE INDEX IF NOT EXISTS idx_live_orders_position ON live_orders(position_id);
CREATE INDEX IF NOT EXISTS idx_live_orders_status ON live_orders(status);
CREATE INDEX IF NOT EXISTS idx_live_orders_exchange ON live_orders(exchange);
CREATE INDEX IF NOT EXISTS idx_live_orders_symbol ON live_orders(symbol);
CREATE INDEX IF NOT EXISTS idx_live_orders_created ON live_orders(created_at);

-- Strategy Execution State Table
CREATE TABLE IF NOT EXISTS strategy_execution_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID UNIQUE NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  mode VARCHAR(20) DEFAULT 'paper' CHECK (mode IN ('paper', 'live')),
  current_capital DECIMAL(18, 2) NOT NULL,
  allocated_capital DECIMAL(18, 2) NOT NULL,
  total_pnl DECIMAL(18, 2) DEFAULT 0,
  realized_pnl DECIMAL(18, 2) DEFAULT 0,
  unrealized_pnl DECIMAL(18, 2) DEFAULT 0,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  win_rate DECIMAL(5, 4),
  sharpe_ratio DECIMAL(8, 4),
  max_drawdown DECIMAL(5, 4),
  daily_loss_limit DECIMAL(5, 4) DEFAULT 0.05,
  daily_loss_current DECIMAL(18, 2) DEFAULT 0,
  max_position_size DECIMAL(5, 4) DEFAULT 0.20,
  max_open_positions INT DEFAULT 5,
  current_open_positions INT DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  last_pnl_update_at TIMESTAMPTZ,
  emergency_stop_triggered BOOLEAN DEFAULT FALSE,
  stop_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_active ON strategy_execution_state(is_active);
CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_mode ON strategy_execution_state(mode);

-- Account Balances Table
CREATE TABLE IF NOT EXISTS account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange VARCHAR(50) NOT NULL,
  asset VARCHAR(20) NOT NULL,
  free DECIMAL(20, 8) NOT NULL,
  locked DECIMAL(20, 8) NOT NULL,
  total DECIMAL(20, 8) NOT NULL,
  value_usd DECIMAL(18, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(exchange, asset, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_exchange ON account_balances(exchange);
CREATE INDEX IF NOT EXISTS idx_account_balances_asset ON account_balances(asset);
CREATE INDEX IF NOT EXISTS idx_account_balances_timestamp ON account_balances(timestamp);

-- Trading Signals Table
CREATE TABLE IF NOT EXISTS trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('buy', 'sell', 'hold')),
  strength DECIMAL(5, 4) NOT NULL,
  entry_price DECIMAL(18, 8),
  stop_loss DECIMAL(18, 8),
  take_profit DECIMAL(18, 8),
  position_size DECIMAL(5, 4),
  reasoning TEXT,
  metadata JSONB,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  position_id UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy ON trading_signals(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_executed ON trading_signals(executed);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created ON trading_signals(created_at);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_live_positions_updated_at ON live_positions;
CREATE TRIGGER update_live_positions_updated_at
  BEFORE UPDATE ON live_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF NOT EXISTS update_live_orders_updated_at ON live_orders;
CREATE TRIGGER update_live_orders_updated_at
  BEFORE UPDATE ON live_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategy_execution_state_updated_at ON strategy_execution_state;
CREATE TRIGGER update_strategy_execution_state_updated_at
  BEFORE UPDATE ON strategy_execution_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
