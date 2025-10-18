# Prediction Accuracy Tracking System

**Status**: Backend Complete, Frontend Pending
**Date**: October 18, 2025
**Version**: 1.0.0

---

## Overview

The Prediction Accuracy Tracking System automatically stores all ML predictions, tracks their outcomes, and provides comprehensive accuracy metrics. This enables data-driven model improvement and transparent performance reporting to users.

## Features Implemented ✅

### 1. Database Schema
- Extended `predictions` table with tracking columns
- Added indexes for performance optimization
- Support for multiple timeframes (7d, 14d, 30d)
- Tracks prediction direction, confidence, and outcomes

### 2. Backend Services

#### Prediction Tracking Service
**File**: `backend/src/services/predictionTrackingService.ts`

**Functions**:
- `storePrediction()` - Save predictions with metadata
- `calculatePredictionAccuracy()` - Evaluate completed predictions
- `getTokenAccuracy()` - Get accuracy metrics for specific token
- `getOverallAccuracy()` - Get system-wide accuracy metrics
- `getPredictionHistory()` - Retrieve historical predictions

#### Accuracy Scheduler
**File**: `backend/src/services/accuracyScheduler.ts`

**Features**:
- Runs hourly (`0 * * * *` cron schedule)
- Automatically evaluates predictions that reached target date
- Calculates accuracy scores and price errors
- Integrated with server lifecycle

### 3. API Endpoints

#### GET /api/v1/predictions/:symbol/history
Get historical predictions for a specific cryptocurrency.

**Parameters**:
- `symbol` (path) - Cryptocurrency symbol (e.g., BTC, ETH)
- `limit` (query) - Number of records to return (default: 50)

**Response**:
```json
{
  "symbol": "BTC",
  "history": [
    {
      "id": "uuid",
      "symbol": "BTC",
      "timeframe": "7d",
      "direction": "bullish",
      "predictedPrice": 108500.00,
      "priceAtPrediction": 106822.53,
      "confidence": 0.359,
      "actualPrice": 107200.00,
      "wasCorrect": true,
      "accuracyScore": 0.92,
      "priceError": 1.21,
      "createdAt": "2025-10-11T10:00:00Z",
      "targetDate": "2025-10-18T10:00:00Z"
    }
  ],
  "total": 50
}
```

#### GET /api/v1/predictions/:symbol/accuracy
Get accuracy metrics for a specific cryptocurrency.

**Parameters**:
- `symbol` (path) - Cryptocurrency symbol
- `days` (query) - Time period in days (default: 30)

**Response**:
```json
{
  "symbol": "BTC",
  "period": "last 30 days",
  "totalPredictions": 42,
  "correctPredictions": 28,
  "accuracy": 66.67,
  "averageAccuracyScore": 0.73,
  "averagePriceError": 3.45,
  "byTimeframe": {
    "7d": {
      "total": 15,
      "correct": 11,
      "accuracy": 73.33
    },
    "14d": {
      "total": 14,
      "correct": 9,
      "accuracy": 64.29
    },
    "30d": {
      "total": 13,
      "correct": 8,
      "accuracy": 61.54
    }
  },
  "byDirection": {
    "bullish": {
      "total": 25,
      "correct": 18,
      "accuracy": 72.0
    },
    "bearish": {
      "total": 17,
      "correct": 10,
      "accuracy": 58.82
    }
  },
  "timestamp": "2025-10-18T13:30:00Z"
}
```

#### GET /api/v1/predictions/accuracy/overall
Get system-wide accuracy metrics across all cryptocurrencies.

**Parameters**:
- `days` (query) - Time period in days (default: 30)

**Response**:
```json
{
  "period": "last 30 days",
  "totalPredictions": 450,
  "correctPredictions": 297,
  "accuracy": 66.0,
  "averageAccuracyScore": 0.71,
  "averagePriceError": 4.23,
  "byToken": {
    "BTC": {
      "total": 42,
      "correct": 28,
      "accuracy": 66.67
    },
    "ETH": {
      "total": 41,
      "correct": 29,
      "accuracy": 70.73
    }
    // ... more tokens
  },
  "byTimeframe": {
    "7d": {
      "total": 150,
      "correct": 108,
      "accuracy": 72.0
    },
    "14d": {
      "total": 150,
      "correct": 99,
      "accuracy": 66.0
    },
    "30d": {
      "total": 150,
      "correct": 90,
      "accuracy": 60.0
    }
  },
  "byModelVersion": {
    "v1.0.0": {
      "total": 450,
      "correct": 297,
      "accuracy": 66.0
    }
  },
  "recentPredictions": [
    // Last 20 predictions with outcomes
  ],
  "timestamp": "2025-10-18T13:30:00Z"
}
```

---

## Database Schema

### Predictions Table (Extended)

```sql
CREATE TABLE predictions (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL REFERENCES tokens(id),

  -- Prediction Details
  timeframe TEXT NOT NULL,           -- '7d', '14d', '30d'
  direction TEXT NOT NULL,            -- 'bullish', 'bearish', 'neutral'
  predicted_price NUMERIC(18,8) NOT NULL,
  price_at_prediction NUMERIC(18,8) NOT NULL,
  target_price_range JSONB NOT NULL, -- {low, high}
  confidence NUMERIC(5,4) NOT NULL,
  confidence_score NUMERIC(5,4) NOT NULL,

  -- Model Info
  model_version TEXT NOT NULL,
  model_type TEXT,                    -- 'single', 'ensemble'
  ensemble_method TEXT,               -- 'weighted_average', etc.
  features JSONB,

  -- Outcome (populated after evaluation)
  actual_price NUMERIC(18,8),
  outcome_calculated_at TIMESTAMP(3),
  was_correct BOOLEAN,
  accuracy_score NUMERIC(5,4),        -- 0-1 scale
  price_error NUMERIC(10,4),          -- Absolute error percentage

  -- Timestamps
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  target_date TIMESTAMP(3) NOT NULL,
  expires_at TIMESTAMP(3) NOT NULL
);

CREATE INDEX predictions_token_id_idx ON predictions(token_id);
CREATE INDEX predictions_created_at_idx ON predictions(created_at);
CREATE INDEX predictions_target_date_idx ON predictions(target_date);
CREATE INDEX predictions_timeframe_idx ON predictions(timeframe);
CREATE INDEX predictions_model_version_idx ON predictions(model_version);
CREATE INDEX predictions_was_correct_idx ON predictions(was_correct);
```

---

## How It Works

### 1. Prediction Storage Flow

```
User Requests Prediction
        ↓
ML Service Generates Prediction
        ↓
Backend Receives Prediction
        ↓
predictionTrackingService.storePrediction()
        ↓
Save to Database with:
  - Predicted price
  - Current price
  - Confidence score
  - Target date (created_at + timeframe)
  - Model metadata
        ↓
Return Prediction to User
```

### 2. Accuracy Calculation Flow

```
Hourly Cron Job Runs
        ↓
Find Predictions where:
  target_date <= NOW()
  AND outcome_calculated_at IS NULL
        ↓
For Each Prediction:
  1. Get actual price at target date from price_data table
  2. Compare predicted direction vs. actual direction
  3. Calculate price error percentage
  4. Calculate accuracy score (0-1)
  5. Update prediction record with outcomes
        ↓
Log Results
```

### 3. Accuracy Metrics Calculation

#### Direction Correctness
```typescript
const predictedDirection = prediction.direction; // 'bullish', 'bearish', 'neutral'
const actualDirection = actualPrice > priceAtPrediction ? 'bullish' :
                       actualPrice < priceAtPrediction ? 'bearish' :
                       'neutral';
const wasCorrect = predictedDirection === actualDirection;
```

#### Price Error
```typescript
const priceError = Math.abs((actualPrice - predictedPrice) / actualPrice) * 100;
// Example: 3.45% error
```

#### Accuracy Score
```typescript
const maxError = 50; // 50% error = 0 score
const accuracyScore = Math.max(0, 1 - (priceError / maxError));
// Range: 0.0 (worst) to 1.0 (perfect)
```

---

## Configuration

### Environment Variables

```bash
# Accuracy calculation schedule (default: every hour)
ACCURACY_CALC_SCHEDULE=0 * * * *  # Cron expression
```

### Scheduler Configuration

The accuracy scheduler runs automatically when the backend server starts. It evaluates predictions every hour and calculates outcomes for any predictions that have reached their target date.

**Default Schedule**: `0 * * * *` (every hour at minute 0)

**Custom Schedule Examples**:
```bash
# Every 30 minutes
ACCURACY_CALC_SCHEDULE="*/30 * * * *"

# Every 2 hours
ACCURACY_CALC_SCHEDULE="0 */2 * * *"

# Every day at 3 AM
ACCURACY_CALC_SCHEDULE="0 3 * * *"
```

---

## Integration with ML Service

### Storing Predictions from ML Service

When the ML service generates a prediction, the backend should store it for tracking:

```typescript
// In ML prediction endpoint handler
const predictionResult = await mlServiceClient.predict({
  symbol: 'BTC',
  timeframe: '7d',
});

// Store prediction for accuracy tracking
await predictionTrackingService.storePrediction({
  tokenId: token.id,
  symbol: token.symbol,
  timeframe: '7d',
  direction: predictionResult.direction,
  predictedPrice: predictionResult.targetPrice,
  priceAtPrediction: predictionResult.currentPrice,
  targetPriceRange: predictionResult.targetPriceRange,
  confidence: predictionResult.confidence,
  confidenceScore: predictionResult.confidenceScore,
  modelVersion: predictionResult.model_version,
  modelType: predictionResult.modelType || 'single',
  ensembleMethod: predictionResult.ensembleMethod,
  features: {
    rsi: predictionResult.indicators.rsi,
    macd: predictionResult.indicators.macd,
    volumeTrend: predictionResult.indicators.volumeTrend,
  },
});
```

---

## Frontend Integration (Pending)

### Accuracy Dashboard Component

**Proposed Component**: `frontend/src/components/AccuracyDashboard.tsx`

**Features**:
- Overall accuracy scorecard
- Per-token accuracy breakdown
- Timeframe comparison charts
- Model performance trends
- Recent prediction outcomes table

**Example Usage**:
```tsx
import { AccuracyDashboard } from '@/components/AccuracyDashboard';

function AdminPage() {
  return (
    <div>
      <h1>Prediction Accuracy Dashboard</h1>
      <AccuracyDashboard days={30} />
    </div>
  );
}
```

### API Integration

```typescript
// Fetch overall accuracy
const { data } = await fetch('/api/v1/predictions/accuracy/overall?days=30');

// Fetch token-specific accuracy
const { data } = await fetch('/api/v1/predictions/BTC/accuracy?days=30');

// Fetch prediction history
const { data } = await fetch('/api/v1/predictions/BTC/history?limit=50');
```

---

## Performance Considerations

### Database Indexes
All queries are optimized with appropriate indexes on:
- `token_id` - Fast lookups by cryptocurrency
- `created_at` - Time-based queries
- `target_date` - Finding predictions to evaluate
- `timeframe` - Grouping by prediction period
- `was_correct` - Accuracy filtering

### Caching
- Consider adding Redis caching for accuracy metrics
- Cache TTL: 15 minutes for overall metrics
- Cache TTL: 5 minutes for token-specific metrics

### Query Optimization
- Accuracy calculations use aggregation queries
- Limit result sets with configurable `days` parameter
- Use `LIMIT` clauses to prevent large result sets

---

## Testing

### Manual Testing

#### 1. Store a Test Prediction
```bash
# Via API or directly in database
INSERT INTO predictions (
  id, token_id, timeframe, direction,
  predicted_price, price_at_prediction,
  target_price_range, confidence, confidence_score,
  model_version, target_date, expires_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM tokens WHERE symbol = 'BTC' LIMIT 1),
  '7d',
  'bullish',
  108000.00,
  106000.00,
  '{"low": 107000, "high": 109000}',
  0.75,
  0.75,
  'v1.0.0',
  NOW() - INTERVAL '1 day',  -- Set in the past to trigger evaluation
  NOW() + INTERVAL '1 hour'
);
```

#### 2. Trigger Accuracy Calculation
```bash
# Manually trigger via API (requires admin auth)
curl -X POST http://localhost:3001/api/v1/admin/trigger-accuracy-calc \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Or wait for hourly cron job
```

#### 3. Check Results
```bash
# Get overall accuracy
curl http://localhost:3001/api/v1/predictions/accuracy/overall?days=30

# Get BTC accuracy
curl http://localhost:3001/api/v1/predictions/BTC/accuracy?days=30

# Get BTC history
curl http://localhost:3001/api/v1/predictions/BTC/history?limit=10
```

###  Automated Testing

```typescript
// Example test
describe('Prediction Accuracy Tracking', () => {
  it('should calculate accuracy correctly', async () => {
    // 1. Create test prediction
    const predictionId = await storePrediction({
      tokenId: testTokenId,
      symbol: 'BTC',
      timeframe: '7d',
      direction: 'bullish',
      predictedPrice: 108000,
      priceAtPrediction: 106000,
      // ...
    });

    // 2. Set target date in past
    await prisma.prediction.update({
      where: { id: predictionId },
      data: { targetDate: new Date(Date.now() - 86400000) },
    });

    // 3. Run accuracy calculation
    await calculatePredictionAccuracy();

    // 4. Verify results
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    expect(prediction.wasCorrect).toBeDefined();
    expect(prediction.accuracyScore).toBeGreaterThan(0);
  });
});
```

---

## Future Enhancements

### Short-term
- [ ] Add admin API endpoint to manually trigger accuracy calculation
- [ ] Implement Redis caching for accuracy metrics
- [ ] Create frontend accuracy dashboard component
- [ ] Add email notifications for accuracy milestones

### Medium-term
- [ ] A/B testing framework for comparing model versions
- [ ] Confidence calibration analysis
- [ ] Prediction error distribution charts
- [ ] Model performance degradation alerts

### Long-term
- [ ] Machine learning model retraining triggers based on accuracy
- [ ] Multi-model comparison dashboards
- [ ] User-specific accuracy tracking (for personalized models)
- [ ] Real-time accuracy updates via WebSocket

---

## Files Created/Modified

### New Files
1. `backend/src/services/predictionTrackingService.ts` - Core tracking service (410 lines)
2. `backend/src/services/accuracyScheduler.ts` - Automated scheduler (71 lines)
3. `backend/prisma/migrations/20251018_add_prediction_tracking.sql` - Database migration

### Modified Files
1. `backend/prisma/schema.prisma` - Extended Prediction model
2. `backend/src/server.ts` - Integrated accuracy scheduler
3. `backend/src/routes/predictions.ts` - Added accuracy endpoints

---

## API Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/predictions/:symbol/history` | GET | Get prediction history for token | Public |
| `/api/v1/predictions/:symbol/accuracy` | GET | Get accuracy metrics for token | Public |
| `/api/v1/predictions/accuracy/overall` | GET | Get overall accuracy metrics | Public |

---

## Monitoring

### Logs to Watch
```bash
# Accuracy calculation logs
docker-compose logs backend | grep "accuracy"

# Scheduler logs
docker-compose logs backend | grep "Accuracy calculation"

# Prediction storage logs
docker-compose logs backend | grep "Stored prediction"
```

### Key Metrics
- **Predictions Evaluated**: Number of predictions processed hourly
- **Average Accuracy Score**: System-wide accuracy (target: >65%)
- **Price Error**: Average prediction error percentage (target: <5%)
- **Direction Accuracy**: Percentage of correct direction predictions (target: >70%)

---

## Conclusion

The Prediction Accuracy Tracking System provides a robust foundation for monitoring and improving ML model performance. With automated evaluation, comprehensive metrics, and flexible API access, it enables data-driven model optimization and transparent performance reporting.

**Status**: Backend implementation complete ✅
**Next Steps**: Frontend dashboard development 🚧

---

**Generated**: October 18, 2025
**Version**: 1.0.0
**Author**: Coinsphere Development Team
