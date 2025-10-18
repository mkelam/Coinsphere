"""
Coinsphere ML Service - FastAPI Application
Provides AI-powered price predictions and risk scoring
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Literal
import numpy as np
import torch
import os
import logging
import redis
import pickle
from datetime import datetime, timedelta
import asyncio

from app.models.crypto_lstm import CryptoLSTM
from app.utils.feature_engineering import engineer_features, create_sequences
from app.utils.database import fetch_price_history, get_latest_prices
from app.training.trainer import load_checkpoint
from app.ensemble import PredictionEnsemble, ModelPrediction, create_ensemble_prediction

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Coinsphere ML Service",
    description="AI-powered cryptocurrency price prediction and risk scoring service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis cache client
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    db=int(os.getenv('REDIS_DB', 0)),
    decode_responses=False  # Keep as bytes for pickle
)

# Model cache (in-memory)
model_cache: Dict[str, Dict] = {}

# Supported cryptocurrencies
SUPPORTED_SYMBOLS = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'ADA', 'DOT', 'MATIC', 'AVAX', 'DOGE',
    'LINK', 'UNI', 'ATOM', 'LTC', 'ETC'
]

# Configuration
MODEL_CHECKPOINT_DIR = os.getenv('MODEL_CHECKPOINT_DIR', './models/checkpoints')
CACHE_TTL = int(os.getenv('CACHE_TTL', 300))  # 5 minutes
SEQUENCE_LENGTH = 70  # Reduced from 90 to work with 90 days of data from free API
INPUT_FEATURES = 20

# ============================================================================
# Pydantic Models (Request/Response)
# ============================================================================

class PredictionRequest(BaseModel):
    """Request model for price prediction"""
    symbol: str = Field(..., description="Cryptocurrency symbol (e.g., BTC, ETH)")
    timeframe: Literal['7d', '14d', '30d'] = Field(default='7d', description="Prediction timeframe")

    @validator('symbol')
    def validate_symbol(cls, v):
        if v.upper() not in SUPPORTED_SYMBOLS:
            raise ValueError(f"Symbol {v} not supported. Supported: {', '.join(SUPPORTED_SYMBOLS)}")
        return v.upper()


class PredictionResponse(BaseModel):
    """Response model for price prediction"""
    symbol: str
    timeframe: str
    prediction: Dict = Field(..., description="Prediction details")
    indicators: Dict = Field(..., description="Technical indicators")
    explanation: str = Field(..., description="Human-readable explanation")
    historical_accuracy: Dict = Field(..., description="Model historical accuracy")
    generated_at: str
    expires_at: str
    model_version: str


class RiskScoreRequest(BaseModel):
    """Request model for risk scoring"""
    symbol: str = Field(..., description="Cryptocurrency symbol")
    portfolio_allocation: Optional[float] = Field(None, ge=0, le=1, description="Portfolio allocation percentage (0-1)")

    @validator('symbol')
    def validate_symbol(cls, v):
        # Allow all symbols for risk scoring (no model required)
        return v.upper()


class RiskScoreResponse(BaseModel):
    """Response model for risk scoring"""
    symbol: str
    risk_score: int = Field(..., ge=0, le=100, description="Risk score (0-100)")
    risk_level: Literal['low', 'medium', 'high', 'extreme']
    risk_factors: Dict
    warnings: List[str]
    analyzed_at: str
    cache_expires_at: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    pytorch_available: bool
    device: str
    models_loaded: int
    supported_symbols: List[str]
    redis_connected: bool


class ModelInfo(BaseModel):
    """Model information response"""
    symbol: str
    status: str
    model_version: str
    last_trained: Optional[str]
    accuracy_7d: Optional[float]
    checkpoint_path: Optional[str]


class EnsemblePredictionRequest(BaseModel):
    """Request model for ensemble prediction"""
    symbol: str = Field(..., description="Cryptocurrency symbol")
    timeframe: Literal['7d', '14d', '30d'] = Field(default='7d', description="Prediction timeframe")
    ensemble_method: Literal['weighted_average', 'majority_voting', 'max_confidence'] = Field(
        default='weighted_average',
        description="Ensemble combination method"
    )
    min_confidence: float = Field(default=0.3, ge=0, le=1, description="Minimum confidence threshold")

    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper()


class EnsemblePredictionResponse(BaseModel):
    """Response model for ensemble prediction"""
    symbol: str
    timeframe: str
    prediction: Dict = Field(..., description="Ensemble prediction details")
    indicators: Dict = Field(..., description="Technical indicators")
    explanation: str = Field(..., description="Human-readable explanation")
    ensemble_metadata: Dict = Field(..., description="Ensemble combination metadata")
    generated_at: str
    expires_at: str
    model_version: str


# ============================================================================
# Helper Functions
# ============================================================================

def get_cache_key(symbol: str, timeframe: str, operation: str = 'prediction') -> str:
    """Generate Redis cache key"""
    return f"{operation}:{symbol}:{timeframe}"


async def load_model(symbol: str) -> Dict:
    """
    Load ML model from checkpoint or cache

    Returns:
        Dict with 'model', 'scaler', 'metadata'
    """
    if symbol in model_cache:
        logger.info(f"Model for {symbol} loaded from memory cache")
        return model_cache[symbol]

    # Load from checkpoint
    checkpoint_path = os.path.join(MODEL_CHECKPOINT_DIR, f"{symbol}_best.pth")

    if not os.path.exists(checkpoint_path):
        logger.error(f"Model checkpoint not found: {checkpoint_path}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No trained model found for {symbol}. Please train the model first."
        )

    try:
        # Load checkpoint first to get architecture config
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        config = checkpoint.get('config', {})

        # Extract architecture parameters from config
        hidden_sizes = config.get('hidden_sizes', [128, 64, 32])
        dropout = config.get('dropout', 0.2)

        # Create model instance with correct architecture
        model = CryptoLSTM(
            input_size=INPUT_FEATURES,
            hidden_sizes=hidden_sizes,
            num_classes=3,
            dropout=dropout
        )

        logger.info(f"Loading model for {symbol} with architecture: {hidden_sizes}")

        # Load checkpoint weights
        checkpoint_data = load_checkpoint(checkpoint_path, model)

        model.eval()  # Set to evaluation mode

        # Cache in memory
        model_info = {
            'model': model,
            'scaler': checkpoint_data.get('scaler'),
            'metadata': checkpoint_data.get('metadata', {}),
            'loaded_at': datetime.utcnow().isoformat()
        }

        model_cache[symbol] = model_info
        logger.info(f"Model for {symbol} loaded from checkpoint and cached")

        return model_info

    except Exception as e:
        logger.error(f"Error loading model for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model: {str(e)}"
        )


def calculate_confidence(probabilities: np.ndarray) -> tuple:
    """
    Calculate confidence score and level from probabilities

    Returns:
        (confidence_score, confidence_level)
    """
    max_prob = probabilities.max()
    confidence_score = float(max_prob)

    if confidence_score >= 0.70:
        confidence_level = "high"
    elif confidence_score >= 0.50:
        confidence_level = "medium"
    else:
        confidence_level = "low"

    return confidence_score, confidence_level


def get_direction_from_probabilities(probabilities: np.ndarray) -> str:
    """Get market direction from model probabilities"""
    classes = ['bearish', 'neutral', 'bullish']
    predicted_class_idx = probabilities.argmax()
    return classes[predicted_class_idx]


def generate_explanation(symbol: str, direction: str, indicators: Dict, confidence_score: float) -> str:
    """Generate human-readable prediction explanation"""

    rsi = indicators.get('rsi', 50)
    volume_trend = indicators.get('volume_trend', 'stable')

    # RSI interpretation
    if rsi > 70:
        rsi_text = f"RSI at {rsi:.1f} (overbought)"
    elif rsi < 30:
        rsi_text = f"RSI at {rsi:.1f} (oversold)"
    else:
        rsi_text = f"RSI at {rsi:.1f} (neutral)"

    # Direction text
    direction_text = {
        'bullish': 'shows bullish momentum',
        'bearish': 'shows bearish pressure',
        'neutral': 'shows neutral consolidation'
    }.get(direction, 'shows mixed signals')

    explanation = (
        f"{symbol} {direction_text} with {int(confidence_score * 100)}% confidence. "
        f"{rsi_text}. "
        f"Volume trend is {volume_trend}. "
    )

    if direction == 'bullish' and confidence_score > 0.7:
        explanation += "Strong buy signal detected."
    elif direction == 'bearish' and confidence_score > 0.7:
        explanation += "Strong sell signal detected."
    else:
        explanation += "Monitor closely for confirmation."

    return explanation


async def fetch_and_prepare_data(symbol: str) -> tuple:
    """
    Fetch historical data and prepare for prediction

    Returns:
        (features_tensor, latest_features_dict, price_history)
    """
    try:
        # Fetch 120 days to ensure we have 90 days after feature engineering
        df = await fetch_price_history(symbol, days=120)

        if len(df) < 91:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient historical data for {symbol} (need 91+ days, got {len(df)})"
            )

        # Engineer features
        features = engineer_features(df)

        if len(features) < SEQUENCE_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data after feature engineering (need {SEQUENCE_LENGTH}+ days, got {len(features)})"
            )

        # Get last N days for prediction (based on SEQUENCE_LENGTH)
        features_for_prediction = features.tail(SEQUENCE_LENGTH)

        # Convert to numpy array
        features_array = features_for_prediction.values

        # Normalize features (using stored scaler would be better)
        features_normalized = (features_array - features_array.mean(axis=0)) / (features_array.std(axis=0) + 1e-8)

        # Convert to PyTorch tensor
        features_tensor = torch.FloatTensor(features_normalized).unsqueeze(0)  # Shape: (1, 90, 20)

        # Get latest feature values for indicators
        latest_features = features.iloc[-1].to_dict()

        return features_tensor, latest_features, df

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing data for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data preparation failed: {str(e)}"
        )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": "Coinsphere ML Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/health": "Health check",
            "/docs": "API documentation (Swagger UI)",
            "/redoc": "API documentation (ReDoc)",
            "/predict": "Price prediction endpoint",
            "/risk-score": "Risk scoring endpoint",
            "/models/{symbol}": "Model information"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint

    Returns service status and configuration
    """
    try:
        redis_connected = redis_client.ping()
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}")
        redis_connected = False

    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        pytorch_available=torch.cuda.is_available(),
        device="cuda" if torch.cuda.is_available() else "cpu",
        models_loaded=len(model_cache),
        supported_symbols=SUPPORTED_SYMBOLS,
        redis_connected=redis_connected
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Predictions"])
async def predict_price(request: PredictionRequest):
    """
    Generate AI price prediction for cryptocurrency

    - **symbol**: Cryptocurrency symbol (BTC, ETH, etc.)
    - **timeframe**: Prediction timeframe (7d, 14d, 30d)

    Returns prediction with confidence score, target price, and technical indicators.
    """
    symbol = request.symbol
    timeframe = request.timeframe

    # Check cache first
    cache_key = get_cache_key(symbol, timeframe)
    try:
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached prediction for {symbol} {timeframe}")
            return pickle.loads(cached_result)
    except Exception as e:
        logger.warning(f"Cache read error: {e}")

    try:
        # Load model
        model_info = await load_model(symbol)
        model = model_info['model']
        metadata = model_info['metadata']

        # Fetch and prepare data
        features_tensor, latest_features, price_history = await fetch_and_prepare_data(symbol)

        # Make prediction
        with torch.no_grad():
            output = model(features_tensor)
            probabilities = output[0].cpu().numpy()

        # Parse prediction
        direction = get_direction_from_probabilities(probabilities)
        confidence_score, confidence_level = calculate_confidence(probabilities)

        # Get current price
        current_price = float(price_history['price'].iloc[-1])

        # Calculate target price based on direction and timeframe
        timeframe_days = int(timeframe.replace('d', ''))
        historical_volatility = price_history['price'].pct_change().std()

        if direction == 'bullish':
            target_price = current_price * (1 + historical_volatility * timeframe_days / 30 * confidence_score)
        elif direction == 'bearish':
            target_price = current_price * (1 - historical_volatility * timeframe_days / 30 * confidence_score)
        else:  # neutral
            target_price = current_price

        # Calculate target price range
        target_price_range = {
            'low': target_price * 0.95,
            'high': target_price * 1.05
        }

        potential_gain = ((target_price - current_price) / current_price) * 100

        # Extract indicators
        indicators = {
            'rsi': round(float(latest_features.get('rsi', 50)), 2),
            'macd': 'bullish' if latest_features.get('macd', 0) > latest_features.get('macd_signal', 0) else 'bearish',
            'volumeTrend': 'increasing' if latest_features.get('volume_change', 0) > 0 else 'decreasing',
            'socialSentiment': round(float(latest_features.get('social_score', 50)) / 100, 2)
        }

        # Generate explanation
        explanation = generate_explanation(symbol, direction, indicators, confidence_score)

        # Build response
        generated_at = datetime.utcnow()
        expires_at = generated_at + timedelta(seconds=CACHE_TTL)

        response = PredictionResponse(
            symbol=symbol,
            timeframe=timeframe,
            prediction={
                'direction': direction,
                'confidence': confidence_level,
                'confidenceScore': round(confidence_score, 3),
                'targetPrice': round(target_price, 2),
                'targetPriceRange': {
                    'low': round(target_price_range['low'], 2),
                    'high': round(target_price_range['high'], 2)
                },
                'currentPrice': round(current_price, 2),
                'potentialGain': round(potential_gain, 2)
            },
            indicators=indicators,
            explanation=explanation,
            historical_accuracy={
                'last30Days': metadata.get('test_accuracy', 0.65),
                'last90Days': metadata.get('val_accuracy', 0.68)
            },
            generated_at=generated_at.isoformat() + 'Z',
            expires_at=expires_at.isoformat() + 'Z',
            model_version=metadata.get('model_version', 'v1.0.0')
        )

        # Cache response
        try:
            redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(response))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

        logger.info(f"Prediction generated for {symbol} {timeframe}: {direction} ({confidence_score:.2f})")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed for {symbol}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction generation failed: {str(e)}"
        )


@app.post("/risk-score", response_model=RiskScoreResponse, tags=["Risk Scoring"])
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Calculate degen risk score for cryptocurrency

    - **symbol**: Cryptocurrency symbol

    Returns risk score (0-100) with breakdown by risk factors.
    """
    symbol = request.symbol

    # Check cache
    cache_key = get_cache_key(symbol, '7d', 'risk_score')
    try:
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached risk score for {symbol}")
            return pickle.loads(cached_result)
    except Exception as e:
        logger.warning(f"Cache read error: {e}")

    try:
        # Fetch price history
        df = await fetch_price_history(symbol, days=90)

        if len(df) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient data for risk scoring (need 30+ days)"
            )

        # Calculate risk factors
        prices = df['price'].values
        volume = df['volume_24h'].values

        # Volatility (30-day)
        recent_30d = prices[-30:]
        volatility = np.std(recent_30d) / np.mean(recent_30d)
        volatility_score = min(100, int(volatility * 200))

        # Price swings (7-day max swing)
        recent_7d = prices[-7:]
        max_swing = (np.max(recent_7d) - np.min(recent_7d)) / np.mean(recent_7d)
        swing_score = min(100, int(max_swing * 150))

        # Volume volatility
        volume_changes = np.diff(volume) / (volume[:-1] + 1)
        volume_volatility = np.std(volume_changes)
        volume_score = min(100, int(volume_volatility * 100))

        # Trend strength
        x = np.arange(len(recent_30d))
        trend_slope = np.polyfit(x, recent_30d, 1)[0] / np.mean(recent_30d)
        trend_score = min(100, int(abs(trend_slope) * 500))

        # Calculate composite risk score
        risk_score = int(
            volatility_score * 0.4 +  # 40% weight
            swing_score * 0.3 +        # 30% weight
            volume_score * 0.2 +       # 20% weight
            trend_score * 0.1          # 10% weight
        )

        risk_score = max(0, min(100, risk_score))

        # Determine risk level
        if risk_score < 30:
            risk_level = 'low'
        elif risk_score < 60:
            risk_level = 'medium'
        elif risk_score < 80:
            risk_level = 'high'
        else:
            risk_level = 'extreme'

        # Build risk factors dict
        risk_factors = {
            'volatility': {
                'value': round(volatility, 4),
                'score': volatility_score,
                'risk': 'high' if volatility_score > 60 else 'medium' if volatility_score > 30 else 'low'
            },
            'priceSwings': {
                'value': round(max_swing, 4),
                'score': swing_score,
                'risk': 'high' if swing_score > 60 else 'medium' if swing_score > 30 else 'low'
            },
            'volumeVolatility': {
                'value': round(volume_volatility, 4),
                'score': volume_score,
                'risk': 'high' if volume_score > 60 else 'medium' if volume_score > 30 else 'low'
            },
            'trendStrength': {
                'value': round(abs(trend_slope), 6),
                'score': trend_score,
                'risk': 'high' if trend_score > 60 else 'medium' if trend_score > 30 else 'low'
            }
        }

        # Generate warnings
        warnings = []
        if volatility_score > 70:
            warnings.append(f"High volatility detected ({volatility * 100:.1f}% daily stddev)")
        if swing_score > 70:
            warnings.append(f"Large price swings in last 7 days ({max_swing * 100:.1f}%)")
        if risk_score > 80:
            warnings.append("EXTREME RISK: This asset is highly volatile and speculative")

        # Build response
        analyzed_at = datetime.utcnow()
        cache_expires_at = analyzed_at + timedelta(hours=2)

        response = RiskScoreResponse(
            symbol=symbol,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            warnings=warnings if warnings else ["No major risk warnings"],
            analyzed_at=analyzed_at.isoformat() + 'Z',
            cache_expires_at=cache_expires_at.isoformat() + 'Z'
        )

        # Cache response (2 hour TTL for risk scores)
        try:
            redis_client.setex(cache_key, 7200, pickle.dumps(response))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

        logger.info(f"Risk score calculated for {symbol}: {risk_score}/100 ({risk_level})")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk scoring failed for {symbol}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk scoring failed: {str(e)}"
        )


@app.get("/models/{symbol}", response_model=ModelInfo, tags=["Models"])
async def get_model_info(symbol: str):
    """
    Get information about trained model for symbol

    - **symbol**: Cryptocurrency symbol

    Returns model metadata, training info, and accuracy metrics.
    """
    symbol = symbol.upper()

    if symbol not in SUPPORTED_SYMBOLS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {symbol} not supported"
        )

    checkpoint_path = os.path.join(MODEL_CHECKPOINT_DIR, f"{symbol}_best.pth")

    if not os.path.exists(checkpoint_path):
        return ModelInfo(
            symbol=symbol,
            status="not_trained",
            model_version="N/A",
            last_trained=None,
            accuracy_7d=None,
            checkpoint_path=None
        )

    try:
        # Load checkpoint metadata
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        metadata = checkpoint.get('metadata', {})

        return ModelInfo(
            symbol=symbol,
            status="trained",
            model_version=metadata.get('model_version', 'v1.0.0'),
            last_trained=metadata.get('trained_at'),
            accuracy_7d=metadata.get('test_accuracy'),
            checkpoint_path=checkpoint_path
        )

    except Exception as e:
        logger.error(f"Error reading model info for {symbol}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read model information: {str(e)}"
        )


@app.post("/predict/ensemble", response_model=EnsemblePredictionResponse, tags=["Predictions"])
async def predict_ensemble(request: EnsemblePredictionRequest):
    """
    Generate ensemble AI price prediction combining multiple models

    This endpoint uses ensemble learning to combine predictions from different
    model architectures and training runs for improved accuracy.

    - **symbol**: Cryptocurrency symbol (BTC, ETH, etc.)
    - **timeframe**: Prediction timeframe (7d, 14d, 30d)
    - **ensemble_method**: How to combine predictions
        - weighted_average: Weight by model accuracy (recommended)
        - majority_voting: Take most common prediction
        - max_confidence: Use highest confidence prediction
    - **min_confidence**: Minimum confidence to include a prediction (0-1)

    Returns enhanced prediction with ensemble metadata.
    """
    symbol = request.symbol
    timeframe = request.timeframe
    method = request.ensemble_method
    min_confidence = request.min_confidence

    # Check cache first
    cache_key = f"ensemble:{symbol}:{timeframe}:{method}"
    try:
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached ensemble prediction for {symbol} {timeframe}")
            return pickle.loads(cached_result)
    except Exception as e:
        logger.warning(f"Cache read error: {e}")

    try:
        # Fetch and prepare data once
        features_tensor, latest_features, price_history = await fetch_and_prepare_data(symbol)
        current_price = float(price_history['price'].iloc[-1])

        # Collect predictions from available models
        model_predictions = []

        # Try to load both original and improved models if they exist
        model_variants = [
            f"{symbol}_best.pth",      # Current/improved model
            f"{symbol}_v1.pth",         # Original model (if backed up)
        ]

        for model_file in model_variants:
            checkpoint_path = os.path.join(MODEL_CHECKPOINT_DIR, model_file)

            if not os.path.exists(checkpoint_path):
                continue

            try:
                # Load model
                checkpoint = torch.load(checkpoint_path, map_location='cpu')
                config = checkpoint.get('config', {})
                metadata = checkpoint.get('metadata', {})

                hidden_sizes = config.get('hidden_sizes', [128, 64, 32])
                dropout = config.get('dropout', 0.2)

                model = CryptoLSTM(
                    input_size=INPUT_FEATURES,
                    hidden_sizes=hidden_sizes,
                    num_classes=3,
                    dropout=dropout
                )

                checkpoint_data = load_checkpoint(checkpoint_path, model)
                model.eval()

                # Make prediction
                with torch.no_grad():
                    output = model(features_tensor)
                    probabilities = output[0].cpu().numpy()

                direction = get_direction_from_probabilities(probabilities)
                confidence_score, _ = calculate_confidence(probabilities)

                # Add to predictions list
                model_predictions.append({
                    'probabilities': probabilities,
                    'direction': direction,
                    'confidence': confidence_score,
                    'model_name': f"{symbol}_{hidden_sizes}",
                    'accuracy': metadata.get('test_accuracy', 0.5)
                })

                logger.info(f"Loaded model {model_file}: {direction} ({confidence_score:.3f})")

            except Exception as e:
                logger.warning(f"Could not load {model_file}: {e}")
                continue

        if not model_predictions:
            # Fallback to single model
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No models available for ensemble prediction for {symbol}"
            )

        # Create ensemble prediction
        ensemble_result = create_ensemble_prediction(
            symbol=symbol,
            model_predictions=model_predictions,
            method=method,
            min_confidence=min_confidence
        )

        # Parse ensemble results
        direction = ensemble_result['direction']
        confidence_score = ensemble_result['confidence']
        ensemble_metadata = ensemble_result['ensemble_metadata']

        # Calculate target price
        timeframe_days = int(timeframe.replace('d', ''))
        historical_volatility = price_history['price'].pct_change().std()

        if direction == 'bullish':
            target_price = current_price * (1 + historical_volatility * timeframe_days / 30 * confidence_score)
        elif direction == 'bearish':
            target_price = current_price * (1 - historical_volatility * timeframe_days / 30 * confidence_score)
        else:
            target_price = current_price

        target_price_range = {
            'low': target_price * 0.95,
            'high': target_price * 1.05
        }

        potential_gain = ((target_price - current_price) / current_price) * 100

        # Extract indicators
        indicators = {
            'rsi': round(float(latest_features.get('rsi', 50)), 2),
            'macd': 'bullish' if latest_features.get('macd', 0) > latest_features.get('macd_signal', 0) else 'bearish',
            'volumeTrend': 'increasing' if latest_features.get('volume_change', 0) > 0 else 'decreasing',
            'socialSentiment': round(float(latest_features.get('social_score', 50)) / 100, 2)
        }

        # Enhanced explanation for ensemble
        explanation = generate_explanation(symbol, direction, indicators, confidence_score)
        explanation += f" Ensemble of {ensemble_metadata['models_used']} models using {method.replace('_', ' ')} method."

        # Build response
        generated_at = datetime.utcnow()
        expires_at = generated_at + timedelta(seconds=CACHE_TTL)

        response = EnsemblePredictionResponse(
            symbol=symbol,
            timeframe=timeframe,
            prediction={
                'direction': direction,
                'confidence': 'high' if confidence_score >= 0.7 else 'medium' if confidence_score >= 0.5 else 'low',
                'confidenceScore': round(confidence_score, 3),
                'targetPrice': round(target_price, 2),
                'targetPriceRange': {
                    'low': round(target_price_range['low'], 2),
                    'high': round(target_price_range['high'], 2)
                },
                'currentPrice': round(current_price, 2),
                'potentialGain': round(potential_gain, 2)
            },
            indicators=indicators,
            explanation=explanation,
            ensemble_metadata=ensemble_metadata,
            generated_at=generated_at.isoformat() + 'Z',
            expires_at=expires_at.isoformat() + 'Z',
            model_version='ensemble-v1.0.0'
        )

        # Cache response
        try:
            redis_client.setex(cache_key, CACHE_TTL, pickle.dumps(response))
        except Exception as e:
            logger.warning(f"Cache write error: {e}")

        logger.info(f"Ensemble prediction generated for {symbol}: {direction} ({confidence_score:.3f})")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ensemble prediction failed for {symbol}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ensemble prediction failed: {str(e)}"
        )


@app.delete("/models/{symbol}/cache", tags=["Models"])
async def clear_model_cache(symbol: str):
    """
    Clear cached model and predictions for symbol

    Useful after retraining a model.
    """
    symbol = symbol.upper()

    # Remove from memory cache
    if symbol in model_cache:
        del model_cache[symbol]
        logger.info(f"Cleared model cache for {symbol}")

    # Clear prediction caches in Redis
    try:
        for timeframe in ['7d', '14d', '30d']:
            cache_key = get_cache_key(symbol, timeframe)
            redis_client.delete(cache_key)

        risk_cache_key = get_cache_key(symbol, '7d', 'risk_score')
        redis_client.delete(risk_cache_key)

        logger.info(f"Cleared Redis caches for {symbol}")
    except Exception as e:
        logger.warning(f"Error clearing Redis cache: {e}")

    return {
        "message": f"Cache cleared for {symbol}",
        "symbol": symbol,
        "timestamp": datetime.utcnow().isoformat() + 'Z'
    }


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    logger.info("=" * 60)
    logger.info("Coinsphere ML Service Starting")
    logger.info("=" * 60)
    logger.info(f"PyTorch device: {'cuda' if torch.cuda.is_available() else 'cpu'}")
    logger.info(f"Model checkpoint directory: {MODEL_CHECKPOINT_DIR}")
    logger.info(f"Cache TTL: {CACHE_TTL} seconds")
    logger.info(f"Supported symbols: {', '.join(SUPPORTED_SYMBOLS)}")

    # Check Redis connection
    try:
        redis_client.ping()
        logger.info("✓ Redis connection successful")
    except Exception as e:
        logger.warning(f"✗ Redis connection failed: {e}")
        logger.warning("  Service will run without caching")

    # Pre-load models for top assets (optional)
    # for symbol in ['BTC', 'ETH', 'SOL']:
    #     try:
    #         await load_model(symbol)
    #         logger.info(f"✓ Pre-loaded model for {symbol}")
    #     except Exception as e:
    #         logger.warning(f"✗ Could not pre-load model for {symbol}: {e}")

    logger.info("ML Service ready")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ML Service...")

    # Clear model cache
    model_cache.clear()

    # Close Redis connection
    try:
        redis_client.close()
    except:
        pass

    logger.info("ML Service stopped")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv('PORT', 8000)),
        reload=os.getenv('ENVIRONMENT', 'development') == 'development',
        log_level="info"
    )
