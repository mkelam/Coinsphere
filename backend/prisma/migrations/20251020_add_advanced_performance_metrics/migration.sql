-- Add advanced performance metrics to backtest_configs table

-- Risk-Adjusted Metrics
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS calmar_ratio DECIMAL(8, 4);
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS ulcer_index DECIMAL(8, 4);

-- Position Sizing & Expectancy
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS kelly_criterion DECIMAL(5, 4);
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS expectancy DECIMAL(18, 2);
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS payoff_ratio DECIMAL(8, 4);

-- Drawdown Metrics
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS avg_drawdown_pct DECIMAL(5, 4);
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS max_drawdown_duration DECIMAL(10, 2);

-- Trade Quality
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS recovery_factor DECIMAL(8, 4);

-- Consistency
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS consecutive_wins INTEGER;
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS consecutive_losses INTEGER;
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS win_streak_avg DECIMAL(5, 2);
ALTER TABLE backtest_configs ADD COLUMN IF NOT EXISTS lose_streak_avg DECIMAL(5, 2);
