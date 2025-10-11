from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import os
import uvicorn

from app.models.lstm_predictor import LSTMPredictor

app = FastAPI(
    title="Coinsphere ML Service",
    description="AI-powered crypto price prediction and risk scoring service",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for loaded models
model_cache = {}

# Pydantic models for request/response
class PredictionRequest(BaseModel):
    symbol: str
    historical_prices: List[float]
    days_ahead: int = 7

class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    predicted_price: float
    prediction_change: float
    prediction_change_percent: float
    confidence: float
    days_ahead: int
    timestamp: str

class RiskScoreRequest(BaseModel):
    symbol: str
    historical_prices: List[float]

class RiskScoreResponse(BaseModel):
    symbol: str
    risk_score: int  # 0-100
    risk_level: str  # conservative, moderate, degen
    volatility: float
    timestamp: str

@app.get("/")
def read_root():
    return {
        "service": "Coinsphere ML",
        "status": "running",
        "version": "0.1.0",
        "endpoints": {
            "/health": "Health check",
            "/predict": "Price prediction",
            "/risk-score": "Degen risk scoring",
            "/models/{symbol}": "Model info"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint for Docker/K8s"""
    import torch

    return {
        "status": "healthy",
        "pytorch_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "models_loaded": len(model_cache)
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    """
    Predict future price for a cryptocurrency

    Args:
        symbol: Crypto symbol (e.g., BTC, ETH)
        historical_prices: List of historical prices (minimum 60 data points)
        days_ahead: Number of days to predict (default: 7)

    Returns:
        Predicted price with confidence score
    """
    try:
        # Validate input
        if len(request.historical_prices) < 60:
            raise HTTPException(
                status_code=400,
                detail="Need at least 60 historical price points for prediction"
            )

        # Check if model exists in cache
        model_key = f"{request.symbol}_{os.getenv('MODEL_VERSION', 'v1.0.0')}"

        if model_key not in model_cache:
            # Create new predictor
            predictor = LSTMPredictor(
                symbol=request.symbol,
                model_version=os.getenv('MODEL_VERSION', 'v1.0.0')
            )

            # Try to load pre-trained model
            try:
                predictor.load(save_dir="/models/checkpoints")
            except FileNotFoundError:
                # If no pre-trained model, train on provided data
                # (In production, models should be pre-trained)
                if len(request.historical_prices) < 200:
                    raise HTTPException(
                        status_code=404,
                        detail=f"No pre-trained model for {request.symbol}. Provide at least 200 data points for training."
                    )

                price_array = np.array(request.historical_prices)
                predictor.train(price_array, epochs=50, batch_size=32)
                predictor.save(save_dir="/models/checkpoints")

            model_cache[model_key] = predictor
        else:
            predictor = model_cache[model_key]

        # Make prediction
        price_array = np.array(request.historical_prices)
        predicted_price, confidence = predictor.predict(price_array, request.days_ahead)

        # Calculate metrics
        current_price = request.historical_prices[-1]
        prediction_change = predicted_price - current_price
        prediction_change_percent = (prediction_change / current_price) * 100

        from datetime import datetime

        return PredictionResponse(
            symbol=request.symbol,
            current_price=current_price,
            predicted_price=predicted_price,
            prediction_change=prediction_change,
            prediction_change_percent=prediction_change_percent,
            confidence=confidence,
            days_ahead=request.days_ahead,
            timestamp=datetime.utcnow().isoformat()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/risk-score", response_model=RiskScoreResponse)
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Calculate Degen Risk Score for a cryptocurrency

    Risk Score ranges from 0 (conservative) to 100 (extremely risky/degen)

    Factors considered:
    - Price volatility (30-day standard deviation)
    - Volume volatility
    - Recent price movement
    - Market cap (if available)
    """
    try:
        if len(request.historical_prices) < 30:
            raise HTTPException(
                status_code=400,
                detail="Need at least 30 historical price points for risk scoring"
            )

        prices = np.array(request.historical_prices)

        # Calculate volatility (30-day)
        recent_prices = prices[-30:]
        volatility = np.std(recent_prices) / np.mean(recent_prices)

        # Calculate recent price swings (max swing in last 7 days)
        recent_7d = prices[-7:]
        max_swing = (np.max(recent_7d) - np.min(recent_7d)) / np.mean(recent_7d)

        # Calculate trend strength (linear regression slope)
        x = np.arange(len(recent_prices))
        y = recent_prices
        trend_slope = np.polyfit(x, y, 1)[0] / np.mean(recent_prices)

        # Composite risk score (0-100)
        # Higher volatility = higher risk
        # Higher max swing = higher risk
        # Stronger trend (up or down) = higher risk

        volatility_score = min(100, volatility * 200)  # Scale volatility to 0-100
        swing_score = min(100, max_swing * 150)  # Scale swing to 0-100
        trend_score = min(100, abs(trend_slope) * 500)  # Scale trend to 0-100

        # Weighted average
        risk_score = int(
            volatility_score * 0.5 +  # 50% weight on volatility
            swing_score * 0.3 +        # 30% weight on recent swings
            trend_score * 0.2          # 20% weight on trend strength
        )

        # Clamp to 0-100
        risk_score = max(0, min(100, risk_score))

        # Determine risk level
        if risk_score < 30:
            risk_level = "conservative"
        elif risk_score < 70:
            risk_level = "moderate"
        else:
            risk_level = "degen"

        from datetime import datetime

        return RiskScoreResponse(
            symbol=request.symbol,
            risk_score=risk_score,
            risk_level=risk_level,
            volatility=float(volatility),
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk scoring failed: {str(e)}")

@app.get("/models/{symbol}")
def get_model_info(symbol: str):
    """Get information about a loaded model"""
    model_version = os.getenv('MODEL_VERSION', 'v1.0.0')
    model_key = f"{symbol}_{model_version}"

    if model_key not in model_cache:
        return {
            "symbol": symbol,
            "status": "not_loaded",
            "model_version": model_version
        }

    predictor = model_cache[model_key]

    return {
        "symbol": symbol,
        "status": "loaded",
        "model_version": model_version,
        "sequence_length": predictor.sequence_length,
        "device": str(predictor.device)
    }

@app.delete("/models/{symbol}")
def unload_model(symbol: str):
    """Unload a model from memory"""
    model_version = os.getenv('MODEL_VERSION', 'v1.0.0')
    model_key = f"{symbol}_{model_version}"

    if model_key in model_cache:
        del model_cache[model_key]
        return {"message": f"Model {symbol} unloaded"}

    raise HTTPException(status_code=404, detail=f"Model {symbol} not loaded")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
