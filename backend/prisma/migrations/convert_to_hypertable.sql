-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Convert price_data table to hypertable
-- The 'time' column must be the first dimension
-- migrate_data => TRUE moves existing data
SELECT create_hypertable('price_data', 'time', migrate_data => TRUE, if_not_exists => TRUE);

-- Create index on tokenId for faster queries
CREATE INDEX IF NOT EXISTS idx_price_data_token_time ON price_data (token_id, time DESC);

-- Set chunk time interval to 7 days (good for crypto data)
SELECT set_chunk_time_interval('price_data', INTERVAL '7 days');

-- Enable compression (saves storage for historical data)
ALTER TABLE price_data SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'token_id'
);

-- Add compression policy (compress data older than 14 days)
SELECT add_compression_policy('price_data', INTERVAL '14 days', if_not_exists => TRUE);

-- Create continuous aggregate for 1-hour candles
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  token_id,
  FIRST(open, time) AS open,
  MAX(high) AS high,
  MIN(low) AS low,
  LAST(close, time) AS close,
  SUM(volume) AS volume
FROM price_data
GROUP BY bucket, token_id
WITH NO DATA;

-- Add refresh policy for 1-hour aggregate (refresh every hour)
SELECT add_continuous_aggregate_policy('price_data_1h',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Create continuous aggregate for 1-day candles
CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_1d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  token_id,
  FIRST(open, time) AS open,
  MAX(high) AS high,
  MIN(low) AS low,
  LAST(close, time) AS close,
  SUM(volume) AS volume
FROM price_data
GROUP BY bucket, token_id
WITH NO DATA;

-- Add refresh policy for 1-day aggregate (refresh every 6 hours)
SELECT add_continuous_aggregate_policy('price_data_1d',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 day',
  schedule_interval => INTERVAL '6 hours',
  if_not_exists => TRUE
);
