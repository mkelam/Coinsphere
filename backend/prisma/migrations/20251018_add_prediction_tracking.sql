-- Migration: Add prediction tracking columns
-- Date: 2025-10-18
-- Description: Extend predictions table to track accuracy and outcomes

-- Add new columns to predictions table
ALTER TABLE predictions
  -- Rename prediction_type to timeframe
  RENAME COLUMN prediction_type TO timeframe;

ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS direction TEXT,
  ADD COLUMN IF NOT EXISTS price_at_prediction NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS target_price_range JSONB,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS model_type TEXT,
  ADD COLUMN IF NOT EXISTS ensemble_method TEXT,
  ADD COLUMN IF NOT EXISTS actual_price NUMERIC(18,8),
  ADD COLUMN IF NOT EXISTS outcome_calculated_at TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS was_correct BOOLEAN,
  ADD COLUMN IF NOT EXISTS accuracy_score NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS price_error NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS target_date TIMESTAMP(3);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS predictions_target_date_idx ON predictions(target_date);
CREATE INDEX IF NOT EXISTS predictions_timeframe_idx ON predictions(timeframe);
CREATE INDEX IF NOT EXISTS predictions_model_version_idx ON predictions(model_version);
CREATE INDEX IF NOT EXISTS predictions_was_correct_idx ON predictions(was_correct);

-- Add comments for documentation
COMMENT ON COLUMN predictions.direction IS 'Predicted price direction: bullish, bearish, neutral';
COMMENT ON COLUMN predictions.price_at_prediction IS 'Price when prediction was made';
COMMENT ON COLUMN predictions.target_price_range IS 'JSON object with low and high price targets';
COMMENT ON COLUMN predictions.actual_price IS 'Actual price at target date (filled after evaluation)';
COMMENT ON COLUMN predictions.was_correct IS 'Whether prediction direction was correct';
COMMENT ON COLUMN predictions.accuracy_score IS 'Prediction accuracy score (0-1)';
COMMENT ON COLUMN predictions.price_error IS 'Absolute error percentage';
COMMENT ON COLUMN predictions.target_date IS 'Date when prediction should be evaluated';
