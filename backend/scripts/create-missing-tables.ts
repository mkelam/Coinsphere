/**
 * Create missing trading tables directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating missing trading tables...\n');

  try {
    // Create strategy_execution_state table
    console.log('Creating strategy_execution_state table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS strategy_execution_state (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        strategy_id TEXT UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT false NOT NULL,
        mode VARCHAR(20) DEFAULT 'paper' NOT NULL,
        current_capital DECIMAL(18,2) NOT NULL,
        allocated_capital DECIMAL(18,2) NOT NULL,
        total_pnl DECIMAL(18,2) DEFAULT 0 NOT NULL,
        realized_pnl DECIMAL(18,2) DEFAULT 0 NOT NULL,
        unrealized_pnl DECIMAL(18,2) DEFAULT 0 NOT NULL,
        total_trades INTEGER DEFAULT 0 NOT NULL,
        winning_trades INTEGER DEFAULT 0 NOT NULL,
        losing_trades INTEGER DEFAULT 0 NOT NULL,
        win_rate DECIMAL(5,4),
        sharpe_ratio DECIMAL(8,4),
        max_drawdown DECIMAL(5,4),
        daily_loss_limit DECIMAL(5,4) DEFAULT 0.05 NOT NULL,
        daily_loss_current DECIMAL(18,2) DEFAULT 0 NOT NULL,
        max_position_size DECIMAL(5,4) DEFAULT 0.20 NOT NULL,
        max_open_positions INTEGER DEFAULT 5 NOT NULL,
        current_open_positions INTEGER DEFAULT 0 NOT NULL,
        last_trade_at TIMESTAMP(3),
        last_pnl_update_at TIMESTAMP(3),
        emergency_stop_triggered BOOLEAN DEFAULT false NOT NULL,
        stop_reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (strategy_id) REFERENCES trading_strategies(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ strategy_execution_state created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_active
      ON strategy_execution_state(is_active);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_strategy_execution_state_mode
      ON strategy_execution_state(mode);
    `);

    console.log('\n✨ All trading tables are ready!\n');

  } catch (error: any) {
    if (error.code === '42P07') {
      console.log('✅ Tables already exist');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
