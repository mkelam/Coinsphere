import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Applying Phase 2 live trading tables migration...\n');

  // Live Positions Table
  console.log('1️⃣  Creating live_positions table...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS live_positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id UUID NOT NULL,
      exchange VARCHAR(50) NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      side VARCHAR(10) NOT NULL,
      entry_price DECIMAL(18, 8) NOT NULL,
      quantity DECIMAL(20, 8) NOT NULL,
      status VARCHAR(20) NOT NULL,
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
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_positions_strategy ON live_positions(strategy_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_positions_status ON live_positions(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_positions_exchange ON live_positions(exchange)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_positions_symbol ON live_positions(symbol)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_positions_created ON live_positions(created_at)`;
  console.log('   ✅ live_positions created');

  // Live Orders Table
  console.log('2️⃣  Creating live_orders table...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS live_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id UUID NOT NULL,
      position_id UUID,
      exchange VARCHAR(50) NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      order_type VARCHAR(20) NOT NULL,
      side VARCHAR(10) NOT NULL,
      amount DECIMAL(20, 8) NOT NULL,
      price DECIMAL(18, 8),
      stop_price DECIMAL(18, 8),
      status VARCHAR(20) NOT NULL,
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
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_strategy ON live_orders(strategy_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_position ON live_orders(position_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_status ON live_orders(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_exchange ON live_orders(exchange)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_symbol ON live_orders(symbol)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_live_orders_created ON live_orders(created_at)`;
  console.log('   ✅ live_orders created');

  // Strategy Execution State Table
  console.log('3️⃣  Creating strategy_execution_state table...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS strategy_execution_state (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id UUID UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      mode VARCHAR(20) DEFAULT 'paper',
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
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_active ON strategy_execution_state(is_active)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_mode ON strategy_execution_state(mode)`;
  console.log('   ✅ strategy_execution_state created');

  // Account Balances Table
  console.log('4️⃣  Creating account_balances table...');
  await prisma.$executeRaw`
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
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_account_balances_exchange ON account_balances(exchange)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_account_balances_asset ON account_balances(asset)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_account_balances_timestamp ON account_balances(timestamp)`;
  console.log('   ✅ account_balances created');

  // Trading Signals Table
  console.log('5️⃣  Creating trading_signals table...');
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS trading_signals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id UUID NOT NULL,
      symbol VARCHAR(50) NOT NULL,
      signal_type VARCHAR(20) NOT NULL,
      action VARCHAR(10) NOT NULL,
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
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy ON trading_signals(strategy_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol ON trading_signals(symbol)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_trading_signals_executed ON trading_signals(executed)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_trading_signals_created ON trading_signals(created_at)`;
  console.log('   ✅ trading_signals created');

  console.log('\n✅ All Phase 2 live trading tables created successfully!');
  console.log('\n📊 Summary:');
  console.log('   • live_positions - Track open/closed positions');
  console.log('   • live_orders - Track all order executions');
  console.log('   • strategy_execution_state - Strategy runtime state & P&L');
  console.log('   • account_balances - Exchange account balance snapshots');
  console.log('   • trading_signals - Strategy signals & execution tracking');
}

main()
  .catch((e) => {
    console.error('\n❌ Migration failed:', e.message);
    console.error('\nError details:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
