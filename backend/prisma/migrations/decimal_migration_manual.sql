-- Manual Decimal Migration for Coinsphere
-- Handles TimescaleDB hypertable limitations
-- Date: 2025-10-08
-- Architect: Crypto Architect

BEGIN;

-- =============================================================================
-- STEP 1: Regular Tables (Non-Hypertables)
-- =============================================================================

-- Tokens table
ALTER TABLE "tokens"
  ALTER COLUMN "current_price" TYPE DECIMAL(18,8) USING "current_price"::DECIMAL(18,8),
  ALTER COLUMN "market_cap" TYPE DECIMAL(24,2) USING "market_cap"::DECIMAL(24,2),
  ALTER COLUMN "volume_24h" TYPE DECIMAL(24,2) USING "volume_24h"::DECIMAL(24,2),
  ALTER COLUMN "price_change_24h" TYPE DECIMAL(10,4) USING "price_change_24h"::DECIMAL(10,4);

-- Holdings table
ALTER TABLE "holdings"
  ALTER COLUMN "amount" TYPE DECIMAL(24,8) USING "amount"::DECIMAL(24,8),
  ALTER COLUMN "average_buy_price" TYPE DECIMAL(18,8) USING "average_buy_price"::DECIMAL(18,8);

-- Transactions table
ALTER TABLE "transactions"
  ALTER COLUMN "amount" TYPE DECIMAL(24,8) USING "amount"::DECIMAL(24,8),
  ALTER COLUMN "price" TYPE DECIMAL(18,8) USING "price"::DECIMAL(18,8),
  ALTER COLUMN "fee" TYPE DECIMAL(18,8) USING "fee"::DECIMAL(18,8);

-- Predictions table
ALTER TABLE "predictions"
  ALTER COLUMN "predicted_price" TYPE DECIMAL(18,8) USING "predicted_price"::DECIMAL(18,8),
  ALTER COLUMN "confidence" TYPE DECIMAL(5,4) USING "confidence"::DECIMAL(5,4);

-- Alerts table
ALTER TABLE "alerts"
  ALTER COLUMN "threshold" TYPE DECIMAL(18,8) USING "threshold"::DECIMAL(18,8);

-- =============================================================================
-- STEP 2: TimescaleDB Hypertable (price_data) - Requires Special Handling
-- =============================================================================

-- Option A: If columnstore is NOT critical, disable it temporarily
-- SELECT remove_compression_policy('price_data', if_exists => true);
-- ALTER TABLE price_data SET (timescaledb.compress = false);

-- Option B: Create new table with Decimal columns, copy data, swap tables
-- This is the SAFE approach for production

-- 2.1: Create new table with Decimal types
CREATE TABLE price_data_decimal (
  "time"     TIMESTAMP NOT NULL,
  "token_id" TEXT NOT NULL,
  "open"     DECIMAL(18,8) NOT NULL,
  "high"     DECIMAL(18,8) NOT NULL,
  "low"      DECIMAL(18,8) NOT NULL,
  "close"    DECIMAL(18,8) NOT NULL,
  "volume"   DECIMAL(24,8) NOT NULL,
  PRIMARY KEY ("time", "token_id")
);

-- 2.2: Convert to hypertable
SELECT create_hypertable('price_data_decimal', 'time',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- 2.3: Copy data with type conversion (preserves all data, no loss)
INSERT INTO price_data_decimal ("time", "token_id", "open", "high", "low", "close", "volume")
SELECT
  "time",
  "token_id",
  "open"::DECIMAL(18,8),
  "high"::DECIMAL(18,8),
  "low"::DECIMAL(18,8),
  "close"::DECIMAL(18,8),
  "volume"::DECIMAL(24,8)
FROM price_data;

-- 2.4: Drop old table and rename new one
DROP TABLE price_data CASCADE;
ALTER TABLE price_data_decimal RENAME TO price_data;

-- 2.5: Recreate index
CREATE INDEX price_data_token_id_idx ON price_data("token_id");

-- 2.6: Re-enable compression (optional, if was enabled before)
-- ALTER TABLE price_data SET (
--   timescaledb.compress,
--   timescaledb.compress_orderby = 'time DESC',
--   timescaledb.compress_segmentby = 'token_id'
-- );
--
-- SELECT add_compression_policy('price_data', INTERVAL '7 days');

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check data types
SELECT
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name IN ('tokens', 'holdings', 'transactions', 'predictions', 'alerts', 'price_data')
  AND column_name IN ('current_price', 'amount', 'price', 'fee', 'predicted_price', 'confidence', 'threshold', 'open', 'high', 'low', 'close', 'volume', 'market_cap', 'volume_24h', 'price_change_24h', 'average_buy_price')
ORDER BY table_name, column_name;

-- Verify data integrity (row counts should match)
SELECT 'tokens' as table_name, COUNT(*) as row_count FROM tokens
UNION ALL
SELECT 'holdings', COUNT(*) FROM holdings
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'predictions', COUNT(*) FROM predictions
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'price_data', COUNT(*) FROM price_data;
