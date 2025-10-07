# ML Model Specification - CryptoSense Analytics Platform

**Document Version**: 1.0
**Date**: October 7, 2025
**Status**: Ready for Implementation
**Model Version**: LSTM v1.0.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Model Architecture](#model-architecture)
3. [Data Pipeline](#data-pipeline)
4. [Feature Engineering](#feature-engineering)
5. [Training Strategy](#training-strategy)
6. [Model Evaluation](#model-evaluation)
7. [Deployment Architecture](#deployment-architecture)
8. [Prediction API](#prediction-api)
9. [Model Monitoring](#model-monitoring)
10. [Improvement Roadmap](#improvement-roadmap)

---

## 1. Executive Summary

### 1.1 Model Purpose

The CryptoSense ML system provides **AI-powered market predictions** with three core capabilities:

1. **Price Direction Prediction** (7d, 14d, 30d timeframes)
   - Bullish/Bearish/Neutral classification
   - Confidence scores (0-100%)
   - Target: 70%+ accuracy for BTC/ETH

2. **Volatility Forecasting**
   - Expected price volatility over next 7/14/30 days
   - Risk assessment input

3. **Support/Resistance Level Detection**
   - Key price levels based on historical patterns
   - Entry/exit signal generation

### 1.2 Target Performance (MVP)

| Metric | BTC | ETH | Other Top 20 | Target |
|--------|-----|-----|--------------|--------|
| **7-Day Accuracy** | 72% | 68% | 65% | 65%+ |
| **14-Day Accuracy** | 68% | 65% | 60% | 60%+ |
| **30-Day Accuracy** | 62% | 58% | 55% | 55%+ |
| **Confidence Calibration** | ±5% | ±7% | ±10% | ±10% |
| **Inference Latency** | <100ms | <100ms | <100ms | <200ms |

**Note**: Accuracy is measured as directional correctness (predicted up/down matches actual movement)

### 1.3 Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **ML Framework** | PyTorch 2.0 | Industry standard, excellent LSTM support, production-ready |
| **Data Processing** | Pandas, NumPy | Standard data science stack |
| **Feature Calculation** | TA-Lib, pandas-ta | Technical indicators library |
| **Model Serving** | FastAPI + Redis | Fast inference API with caching |
| **Training Infrastructure** | AWS EC2 (g4dn.xlarge) or local GPU | Cost-effective GPU training |
| **Experiment Tracking** | MLflow | Track experiments, model versions |
| **Model Storage** | AWS S3 + DynamoDB | Versioned model artifacts |

---

## 2. Model Architecture

### 2.1 LSTM Architecture (v1.0)

**Network Design**:
```
Input Layer (Features)
    ↓
LSTM Layer 1 (128 units, dropout=0.2)
    ↓
LSTM Layer 2 (64 units, dropout=0.2)
    ↓
LSTM Layer 3 (32 units, dropout=0.2)
    ↓
Dense Layer (16 units, ReLU activation)
    ↓
Output Layer (3 units, Softmax) → [Bearish, Neutral, Bullish]
```

**PyTorch Implementation**:
```python
import torch
import torch.nn as nn

class CryptoLSTM(nn.Module):
    def __init__(self, input_size=20, hidden_sizes=[128, 64, 32], num_classes=3, dropout=0.2):
        super(CryptoLSTM, self).__init__()

        # LSTM layers
        self.lstm1 = nn.LSTM(input_size, hidden_sizes[0], batch_first=True)
        self.dropout1 = nn.Dropout(dropout)

        self.lstm2 = nn.LSTM(hidden_sizes[0], hidden_sizes[1], batch_first=True)
        self.dropout2 = nn.Dropout(dropout)

        self.lstm3 = nn.LSTM(hidden_sizes[1], hidden_sizes[2], batch_first=True)
        self.dropout3 = nn.Dropout(dropout)

        # Dense layers
        self.fc1 = nn.Linear(hidden_sizes[2], 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, num_classes)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        # x shape: (batch_size, sequence_length, input_size)

        out, _ = self.lstm1(x)
        out = self.dropout1(out)

        out, _ = self.lstm2(out)
        out = self.dropout2(out)

        out, (hidden, cell) = self.lstm3(out)
        out = self.dropout3(out)

        # Take last timestep output
        out = out[:, -1, :]

        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        out = self.softmax(out)

        return out

# Model instantiation
model = CryptoLSTM(
    input_size=20,           # 20 features per timestep
    hidden_sizes=[128, 64, 32],
    num_classes=3,           # Bearish, Neutral, Bullish
    dropout=0.2
)

# Total parameters: ~250K (lightweight for fast inference)
```

### 2.2 Input/Output Specification

**Input**:
- **Shape**: `(batch_size, sequence_length, num_features)`
- **Sequence Length**: 90 timesteps (90 days of data)
- **Features**: 20 features per timestep (see Feature Engineering section)
- **Example**: `(32, 90, 20)` for batch of 32 predictions

**Output**:
- **Shape**: `(batch_size, 3)`
- **Classes**:
  - `[0]`: Bearish probability (price will decrease)
  - `[1]`: Neutral probability (price will stay flat ±2%)
  - `[2]`: Bullish probability (price will increase)
- **Example Output**: `[0.15, 0.25, 0.60]` → 60% bullish confidence

**Confidence Score Calculation**:
```python
def calculate_confidence(probabilities):
    """
    Convert softmax probabilities to confidence score (0-100)
    """
    max_prob = probabilities.max()

    # Calibrated confidence (adjusted for historical accuracy)
    confidence = max_prob * 100

    # Map to confidence levels
    if confidence >= 70:
        return confidence, "high"
    elif confidence >= 50:
        return confidence, "medium"
    else:
        return confidence, "low"
```

### 2.3 Why LSTM?

**Advantages**:
1. **Temporal Dependencies**: Captures patterns across time (essential for crypto)
2. **Long-Term Memory**: Remembers patterns from weeks ago
3. **Proven for Time-Series**: State-of-the-art for financial forecasting
4. **Interpretable**: Can analyze which timesteps influence predictions

**Alternatives Considered**:
- **Transformer**: Too complex for MVP, requires more data
- **GRU**: Similar to LSTM, slightly faster but less expressive
- **Simple RNN**: Poor long-term memory, vanishing gradients
- **CNN**: Good for spatial patterns, less effective for time-series

---

## 3. Data Pipeline

### 3.1 Data Sources

**Primary Data Source**: TimescaleDB (local price history)
**Backup Sources**: CoinGecko Pro API, Binance API

**Data Fetch Strategy**:
```python
# data/fetch_price_history.py
import asyncpg
import pandas as pd
from datetime import datetime, timedelta

async def fetch_training_data(asset_symbol: str, days: int = 365):
    """
    Fetch historical price data from TimescaleDB
    """
    conn = await asyncpg.connect(DATABASE_URL)

    query = """
        SELECT
            time,
            price_usd,
            volume_24h_usd,
            market_cap_usd,
            percent_change_1h,
            percent_change_24h
        FROM price_history
        WHERE asset_symbol = $1
          AND time >= NOW() - INTERVAL '{days} days'
        ORDER BY time ASC
    """.format(days=days)

    rows = await conn.fetch(query, asset_symbol)
    await conn.close()

    df = pd.DataFrame(rows, columns=['time', 'price', 'volume', 'market_cap', 'change_1h', 'change_24h'])
    df.set_index('time', inplace=True)

    return df
```

### 3.2 Data Requirements

**Training Data Volume**:
- **BTC/ETH**: 5 years (2019-2024) = ~1,825 days
- **Other Top 20**: 3 years (2021-2024) = ~1,095 days
- **Total Dataset Size**: ~50 MB (uncompressed)

**Data Quality Checks**:
```python
def validate_data_quality(df):
    """
    Ensure data is suitable for training
    """
    # Check for missing values
    missing_pct = (df.isnull().sum() / len(df)) * 100
    assert missing_pct.max() < 5, f"Too many missing values: {missing_pct.max()}%"

    # Check for price anomalies (>50% daily change = likely error)
    daily_change = df['price'].pct_change()
    anomalies = daily_change.abs() > 0.5
    assert anomalies.sum() < 10, f"Too many price anomalies: {anomalies.sum()}"

    # Check for data freshness
    latest_date = df.index.max()
    assert (datetime.now() - latest_date).days < 2, "Data is stale"

    return True
```

### 3.3 Data Preprocessing

**Normalization**:
```python
from sklearn.preprocessing import StandardScaler

def preprocess_data(df):
    """
    Normalize features to zero mean, unit variance
    """
    scaler = StandardScaler()

    # Fit on training data only (avoid data leakage)
    scaled_features = scaler.fit_transform(df[FEATURE_COLUMNS])

    df_scaled = pd.DataFrame(scaled_features, columns=FEATURE_COLUMNS, index=df.index)

    return df_scaled, scaler
```

**Train/Val/Test Split**:
```python
def split_time_series_data(df, train_pct=0.7, val_pct=0.15):
    """
    Time-series split (no shuffling!)
    """
    n = len(df)
    train_size = int(n * train_pct)
    val_size = int(n * val_pct)

    train = df.iloc[:train_size]
    val = df.iloc[train_size:train_size+val_size]
    test = df.iloc[train_size+val_size:]

    return train, val, test

# Example: 5 years of BTC data
# Train: 2019-2022 (70% = 3.5 years)
# Val: 2022-2023 (15% = 0.75 years)
# Test: 2023-2024 (15% = 0.75 years)
```

---

## 4. Feature Engineering

### 4.1 Feature Categories

**20 Input Features** (per timestep):

#### Price-Based Features (5)
1. **Close Price** (normalized)
2. **Price Change 1h** (%)
3. **Price Change 24h** (%)
4. **High-Low Spread** (volatility proxy)
5. **Log Returns** (log(price_t / price_t-1))

#### Technical Indicators (8)
6. **RSI (14-day)** - Relative Strength Index (0-100)
7. **MACD** - Moving Average Convergence Divergence
8. **MACD Signal**
9. **Bollinger Bands (Upper)**
10. **Bollinger Bands (Lower)**
11. **EMA 20** - Exponential Moving Average (20-day)
12. **EMA 50**
13. **Volume MA (20-day)** - Volume moving average

#### Volume & Market Data (4)
14. **Volume (24h)** (normalized)
15. **Volume Change** (%)
16. **Market Cap** (normalized)
17. **Market Cap Change** (%)

#### Social Sentiment (3)
18. **Social Score** (LunarCrush, 0-100)
19. **Sentiment Positive** (%)
20. **Sentiment Negative** (%)

**Implementation**:
```python
import talib
import pandas as pd

def engineer_features(df):
    """
    Calculate all 20 features from raw price data
    """
    features = pd.DataFrame(index=df.index)

    # Price-based features
    features['close'] = df['price']
    features['change_1h'] = df['change_1h']
    features['change_24h'] = df['change_24h']
    features['hl_spread'] = (df['high'] - df['low']) / df['close']
    features['log_returns'] = np.log(df['price'] / df['price'].shift(1))

    # Technical indicators
    features['rsi'] = talib.RSI(df['price'], timeperiod=14)
    macd, macd_signal, _ = talib.MACD(df['price'])
    features['macd'] = macd
    features['macd_signal'] = macd_signal
    upper, middle, lower = talib.BBANDS(df['price'], timeperiod=20)
    features['bb_upper'] = upper
    features['bb_lower'] = lower
    features['ema_20'] = talib.EMA(df['price'], timeperiod=20)
    features['ema_50'] = talib.EMA(df['price'], timeperiod=50)
    features['volume_ma'] = talib.SMA(df['volume'], timeperiod=20)

    # Volume & market data
    features['volume'] = df['volume']
    features['volume_change'] = df['volume'].pct_change()
    features['market_cap'] = df['market_cap']
    features['market_cap_change'] = df['market_cap'].pct_change()

    # Social sentiment (from separate table)
    sentiment = fetch_social_sentiment(df.index)
    features['social_score'] = sentiment['social_score']
    features['sentiment_pos'] = sentiment['sentiment_positive']
    features['sentiment_neg'] = sentiment['sentiment_negative']

    # Drop NaN rows (first 50 due to moving averages)
    features.dropna(inplace=True)

    return features
```

### 4.2 Label Creation (Target Variable)

**7-Day Prediction Label**:
```python
def create_labels(df, horizon=7):
    """
    Create classification labels:
    - Bearish: price decreases >2%
    - Neutral: price changes ±2%
    - Bullish: price increases >2%
    """
    future_price = df['close'].shift(-horizon)
    current_price = df['close']

    pct_change = (future_price - current_price) / current_price * 100

    labels = pd.Series(index=df.index, dtype=int)
    labels[pct_change < -2] = 0  # Bearish
    labels[(pct_change >= -2) & (pct_change <= 2)] = 1  # Neutral
    labels[pct_change > 2] = 2  # Bullish

    return labels
```

### 4.3 Sequence Creation

**Sliding Window Approach** (90-day lookback):
```python
def create_sequences(features, labels, sequence_length=90):
    """
    Create sequences for LSTM input
    """
    X, y = [], []

    for i in range(len(features) - sequence_length):
        # Input: 90 days of features
        X.append(features.iloc[i:i+sequence_length].values)

        # Label: future direction at end of sequence
        y.append(labels.iloc[i+sequence_length])

    X = np.array(X)  # Shape: (num_samples, 90, 20)
    y = np.array(y)  # Shape: (num_samples,)

    return X, y
```

---

## 5. Training Strategy

### 5.1 Training Configuration

**Hyperparameters**:
```python
TRAINING_CONFIG = {
    # Model architecture
    'input_size': 20,
    'hidden_sizes': [128, 64, 32],
    'num_classes': 3,
    'dropout': 0.2,

    # Training
    'batch_size': 32,
    'epochs': 100,
    'learning_rate': 0.001,
    'optimizer': 'Adam',
    'loss_function': 'CrossEntropyLoss',

    # Regularization
    'weight_decay': 1e-5,
    'early_stopping_patience': 10,

    # Data
    'sequence_length': 90,
    'train_val_test_split': [0.7, 0.15, 0.15],
}
```

### 5.2 Training Loop

```python
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

def train_model(model, train_loader, val_loader, config):
    """
    Train LSTM model with early stopping
    """
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        model.parameters(),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )

    best_val_loss = float('inf')
    patience_counter = 0

    for epoch in range(config['epochs']):
        # Training phase
        model.train()
        train_loss = 0.0

        for batch_features, batch_labels in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_features)
            loss = criterion(outputs, batch_labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # Validation phase
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for batch_features, batch_labels in val_loader:
                outputs = model(batch_features)
                loss = criterion(outputs, batch_labels)
                val_loss += loss.item()

                _, predicted = torch.max(outputs, 1)
                total += batch_labels.size(0)
                correct += (predicted == batch_labels).sum().item()

        val_accuracy = correct / total

        print(f"Epoch {epoch+1}/{config['epochs']}")
        print(f"  Train Loss: {train_loss/len(train_loader):.4f}")
        print(f"  Val Loss: {val_loss/len(val_loader):.4f}")
        print(f"  Val Accuracy: {val_accuracy:.4f}")

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            # Save best model
            torch.save(model.state_dict(), 'models/best_model.pth')
        else:
            patience_counter += 1
            if patience_counter >= config['early_stopping_patience']:
                print("Early stopping triggered")
                break

    return model
```

### 5.3 Training Schedule

**Initial Training** (Week 3-4):
- Train models for BTC, ETH, SOL (top 3 assets)
- Training time: ~2-4 hours per asset (on GPU)
- Store models in S3 with versioning

**Retraining Frequency**:
- **Weekly**: Retrain with latest data (automated)
- **On-Demand**: If accuracy drops below threshold (65%)
- **Major Events**: Retrain immediately after black swan events

**Retraining Script**:
```python
# scripts/retrain_models.py
import schedule
import time

def retrain_all_models():
    """
    Weekly retraining job
    """
    assets = ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX']  # Expand to top 20

    for asset in assets:
        print(f"Retraining model for {asset}...")

        # Fetch latest data
        df = fetch_training_data(asset, days=730)  # 2 years

        # Preprocess
        features = engineer_features(df)
        labels = create_labels(features, horizon=7)
        X, y = create_sequences(features, labels)

        # Train
        model = CryptoLSTM()
        train_model(model, X, y, TRAINING_CONFIG)

        # Save to S3 with version
        version = datetime.now().strftime('%Y%m%d_%H%M%S')
        save_model_to_s3(model, asset, version)

        print(f"✅ {asset} model retrained (version: {version})")

# Schedule weekly retraining (Sunday 2 AM UTC)
schedule.every().sunday.at("02:00").do(retrain_all_models)

while True:
    schedule.run_pending()
    time.sleep(3600)  # Check every hour
```

---

## 6. Model Evaluation

### 6.1 Evaluation Metrics

**Primary Metric**: **Directional Accuracy**
```python
def calculate_directional_accuracy(predictions, actuals):
    """
    Did we predict the correct direction (up/down/neutral)?
    """
    correct = (predictions == actuals).sum()
    total = len(predictions)
    accuracy = correct / total
    return accuracy
```

**Secondary Metrics**:
- **Precision/Recall/F1** (per class: Bearish, Neutral, Bullish)
- **Confidence Calibration** (predicted confidence vs actual accuracy)
- **Sharpe Ratio** (if users traded based on predictions)

**Confusion Matrix**:
```python
from sklearn.metrics import confusion_matrix, classification_report

def evaluate_model(model, test_loader):
    """
    Comprehensive evaluation
    """
    model.eval()
    all_predictions = []
    all_labels = []

    with torch.no_grad():
        for batch_features, batch_labels in test_loader:
            outputs = model(batch_features)
            _, predicted = torch.max(outputs, 1)

            all_predictions.extend(predicted.cpu().numpy())
            all_labels.extend(batch_labels.cpu().numpy())

    # Confusion matrix
    cm = confusion_matrix(all_labels, all_predictions)
    print("Confusion Matrix:")
    print(cm)

    # Classification report
    print("\nClassification Report:")
    print(classification_report(all_labels, all_predictions,
                                target_names=['Bearish', 'Neutral', 'Bullish']))

    # Directional accuracy
    accuracy = (np.array(all_predictions) == np.array(all_labels)).mean()
    print(f"\nDirectional Accuracy: {accuracy:.2%}")

    return accuracy
```

### 6.2 Backtesting

**Walk-Forward Validation** (realistic evaluation):
```python
def backtest_predictions(asset='BTC', days=365):
    """
    Simulate real-world predictions over past year
    """
    results = []

    for i in range(0, days, 7):  # Weekly predictions
        # Use data up to this point
        train_end_date = datetime.now() - timedelta(days=days-i)

        # Train model on data before train_end_date
        df = fetch_training_data(asset, end_date=train_end_date)
        model = train_model_on_data(df)

        # Predict next 7 days
        prediction = model.predict(df.tail(90))

        # Get actual outcome 7 days later
        actual = get_actual_outcome(asset, train_end_date + timedelta(days=7))

        results.append({
            'date': train_end_date,
            'prediction': prediction,
            'actual': actual,
            'correct': prediction == actual
        })

    accuracy = sum([r['correct'] for r in results]) / len(results)
    print(f"Backtest Accuracy ({asset}, {days} days): {accuracy:.2%}")

    return results
```

### 6.3 Performance Tracking

**MLflow Integration**:
```python
import mlflow

def log_experiment(model, config, metrics):
    """
    Track experiments in MLflow
    """
    with mlflow.start_run():
        # Log hyperparameters
        mlflow.log_params(config)

        # Log metrics
        mlflow.log_metrics({
            'accuracy': metrics['accuracy'],
            'precision': metrics['precision'],
            'recall': metrics['recall'],
            'f1': metrics['f1']
        })

        # Log model artifact
        mlflow.pytorch.log_model(model, "model")

        # Log feature importance (if applicable)
        # mlflow.log_artifact("feature_importance.png")
```

---

## 7. Deployment Architecture

### 7.1 Model Serving (FastAPI)

**API Service**:
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import redis
import pickle

app = FastAPI()

# Load models at startup
models = {}
for asset in ['BTC', 'ETH', 'SOL']:
    models[asset] = load_model_from_s3(asset, version='latest')

# Redis for caching predictions
redis_client = redis.Redis(host='localhost', port=6379, db=0)

class PredictionRequest(BaseModel):
    asset_symbol: str
    timeframe: str  # '7d', '14d', '30d'

class PredictionResponse(BaseModel):
    asset_symbol: str
    prediction: str  # 'bullish', 'bearish', 'neutral'
    confidence: float
    probabilities: dict
    factors: dict
    model_version: str

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate price prediction for asset
    """
    # Check cache first (TTL: 5 minutes)
    cache_key = f"prediction:{request.asset_symbol}:{request.timeframe}"
    cached = redis_client.get(cache_key)
    if cached:
        return pickle.loads(cached)

    # Load model
    model = models.get(request.asset_symbol)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model not found for {request.asset_symbol}")

    # Fetch latest data (90 days)
    df = await fetch_latest_data(request.asset_symbol, days=90)

    # Engineer features
    features = engineer_features(df)
    features_scaled, scaler = preprocess_data(features)

    # Prepare input tensor
    input_tensor = torch.tensor(features_scaled.values[-90:], dtype=torch.float32).unsqueeze(0)

    # Predict
    with torch.no_grad():
        output = model(input_tensor)
        probabilities = output[0].numpy()

    # Parse results
    classes = ['bearish', 'neutral', 'bullish']
    predicted_class = classes[probabilities.argmax()]
    confidence = probabilities.max() * 100

    response = PredictionResponse(
        asset_symbol=request.asset_symbol,
        prediction=predicted_class,
        confidence=round(confidence, 2),
        probabilities={
            'bearish': round(probabilities[0] * 100, 2),
            'neutral': round(probabilities[1] * 100, 2),
            'bullish': round(probabilities[2] * 100, 2)
        },
        factors=extract_top_factors(features.iloc[-1]),  # Last day's values
        model_version='v1.0.0'
    )

    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, pickle.dumps(response))

    return response
```

### 7.2 Batch Predictions (Async)

**Generate predictions for all top 50 assets** (runs every 6 hours):
```python
# jobs/generate_batch_predictions.py
import asyncio

async def generate_batch_predictions():
    """
    Generate predictions for all tracked assets
    """
    assets = ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', ...]  # Top 50

    for asset in assets:
        try:
            prediction = await predict({'asset_symbol': asset, 'timeframe': '7d'})

            # Save to database
            await save_prediction_to_db(prediction)

            print(f"✅ Prediction saved for {asset}: {prediction.prediction}")
        except Exception as e:
            print(f"❌ Error predicting {asset}: {e}")

# Run every 6 hours
schedule.every(6).hours.do(asyncio.run, generate_batch_predictions)
```

---

## 8. Prediction API

### 8.1 REST API Endpoints

**POST /api/v1/ml/predict**
```json
// Request
{
  "asset_symbol": "BTC",
  "timeframe": "7d"
}

// Response (200 OK)
{
  "asset_symbol": "BTC",
  "prediction": "bullish",
  "confidence": 72.5,
  "probabilities": {
    "bearish": 12.3,
    "neutral": 15.2,
    "bullish": 72.5
  },
  "factors": {
    "rsi": 65,
    "macd": 0.02,
    "volume_trend": "increasing",
    "social_sentiment": "positive"
  },
  "model_version": "v1.0.0",
  "predicted_at": "2025-10-07T14:30:00Z",
  "target_date": "2025-10-14T14:30:00Z"
}
```

**GET /api/v1/ml/predictions/{asset_symbol}**
```json
// Get historical predictions
{
  "asset_symbol": "BTC",
  "predictions": [
    {
      "prediction_date": "2025-09-30",
      "prediction": "bullish",
      "confidence": 68.2,
      "actual_outcome": "bullish",
      "accuracy": true
    },
    // ... more predictions
  ],
  "overall_accuracy": 72.0
}
```

**GET /api/v1/ml/model/status**
```json
// Model health check
{
  "status": "healthy",
  "models": [
    {
      "asset": "BTC",
      "version": "v1.0.0",
      "last_trained": "2025-10-06T02:00:00Z",
      "accuracy_7d": 72.0,
      "accuracy_14d": 68.5,
      "accuracy_30d": 62.3
    }
  ]
}
```

---

## 9. Model Monitoring

### 9.1 Key Metrics to Monitor

**Model Performance**:
- **Accuracy Drift**: Alert if accuracy drops below 65% (7-day rolling)
- **Confidence Calibration**: Predicted confidence matches actual accuracy
- **Prediction Distribution**: Are we predicting too many bullish/bearish?

**Monitoring Dashboard** (Grafana):
```python
# metrics/model_metrics.py
from prometheus_client import Gauge, Counter

# Accuracy metrics
accuracy_7d = Gauge('model_accuracy_7d', 'Model accuracy (7-day)', ['asset'])
accuracy_14d = Gauge('model_accuracy_14d', 'Model accuracy (14-day)', ['asset'])

# Prediction counts
predictions_total = Counter('predictions_total', 'Total predictions made', ['asset', 'class'])

# Latency
inference_latency = Gauge('inference_latency_ms', 'Inference latency', ['asset'])

def update_metrics(asset, prediction, actual, latency_ms):
    """
    Update Prometheus metrics after prediction
    """
    # Update accuracy (calculate rolling window)
    accuracy = calculate_rolling_accuracy(asset, days=7)
    accuracy_7d.labels(asset=asset).set(accuracy)

    # Update prediction counts
    predictions_total.labels(asset=asset, class=prediction).inc()

    # Update latency
    inference_latency.labels(asset=asset).set(latency_ms)
```

### 9.2 Alerts & Triggers

**Alert Rules**:
```yaml
# alerts/model_alerts.yaml
groups:
  - name: ml_model_alerts
    rules:
      - alert: ModelAccuracyLow
        expr: model_accuracy_7d < 0.65
        for: 24h
        annotations:
          summary: "Model accuracy below threshold for {{ $labels.asset }}"
          description: "7-day accuracy is {{ $value | humanizePercentage }}"

      - alert: ModelStale
        expr: time() - model_last_trained_timestamp > 86400 * 10  # 10 days
        annotations:
          summary: "Model not retrained for 10 days ({{ $labels.asset }})"

      - alert: InferenceLatencyHigh
        expr: inference_latency_ms > 500
        for: 10m
        annotations:
          summary: "Inference latency >500ms for {{ $labels.asset }}"
```

**Auto-Retraining Trigger**:
```python
def check_model_health():
    """
    Check model accuracy, trigger retraining if needed
    """
    for asset in TRACKED_ASSETS:
        accuracy = get_7d_accuracy(asset)

        if accuracy < 0.65:
            print(f"⚠️ {asset} accuracy low ({accuracy:.1%}), triggering retrain...")
            retrain_model(asset)
```

---

## 10. Improvement Roadmap

### 10.1 Phase 2 Enhancements (Months 3-6)

1. **Multi-Asset Predictions** (beyond top 3)
   - Expand to top 50 assets
   - Transfer learning from BTC/ETH models

2. **Ensemble Models**
   - Combine LSTM + Transformer + GRU
   - Voting mechanism for final prediction

3. **Explainable AI (XAI)**
   - SHAP values to explain feature importance
   - "Why this prediction?" explanations

4. **On-Chain Features**
   - Whale wallet movements (from The Graph)
   - Exchange inflow/outflow
   - Network activity (transaction count, fees)

### 10.2 Phase 3 Enhancements (Months 7-12)

5. **Sentiment Analysis (NLP)**
   - Twitter sentiment (real-time)
   - Reddit/Discord sentiment
   - News headline analysis

6. **Regime Detection**
   - Identify bull/bear market regimes
   - Adapt model per regime

7. **Personalized Predictions**
   - Per-user risk tolerance
   - Portfolio-specific predictions

8. **Automated Trading Signals**
   - Entry/exit signals
   - Stop-loss recommendations

---

## Appendix A: Model File Structure

```
ml/
├── models/
│   ├── btc_v1.0.0.pth
│   ├── eth_v1.0.0.pth
│   └── sol_v1.0.0.pth
├── data/
│   ├── fetch_price_history.py
│   └── feature_engineering.py
├── training/
│   ├── train_lstm.py
│   └── train_config.yaml
├── inference/
│   ├── predict_api.py
│   └── batch_predictions.py
├── evaluation/
│   ├── backtest.py
│   └── metrics.py
├── monitoring/
│   ├── model_metrics.py
│   └── alerts.yaml
└── scripts/
    ├── retrain_models.py
    └── export_model_to_s3.py
```

---

**Document Maintained By:** ML Team
**Last Updated:** October 7, 2025
**Next Review:** Week 6 (Model Performance Review)

---

**END OF DOCUMENT**
