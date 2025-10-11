"""
Coinsphere ML Service - FastAPI Application
Provides AI-powered price predictions using LSTM models
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from datetime import datetime
import logging

from app.models.lstm_predictor import LSTMPredictor
from app.services.prediction_service import PredictionService
from app.utils.database import init_db, get_db_session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Coinsphere ML Service",
    description="AI-powered cryptocurrency price predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Node.js backend
        "http://localhost:5173",  # Vite frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
prediction_service = PredictionService()

# Request/Response models
class PredictionRequest(BaseModel):
    symbol: str
    timeframe: str  # 7d, 14d, 30d

class PredictionResponse(BaseModel):
    symbol: str
    timeframe: str
    current_price: float
    predicted_price: float
    confidence: float
    prediction_change_percent: float
    model_version: str
    created_at: datetime

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: int

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Coinsphere ML Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0",
        "models_loaded": prediction_service.get_loaded_models_count()
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    """
    Generate price prediction for a cryptocurrency

    Args:
        symbol: Cryptocurrency symbol (e.g., BTC, ETH)
        timeframe: Prediction timeframe (7d, 14d, 30d)

    Returns:
        Prediction with confidence score
    """
    try:
        prediction = await prediction_service.get_prediction(
            symbol=request.symbol,
            timeframe=request.timeframe
        )
        return prediction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.get("/predictions/{symbol}", response_model=List[PredictionResponse])
async def get_predictions_for_symbol(symbol: str):
    """
    Get all available predictions for a symbol (7d, 14d, 30d)
    """
    try:
        predictions = await prediction_service.get_all_predictions(symbol)
        return predictions
    except Exception as e:
        logger.error(f"Error fetching predictions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch predictions")

@app.post("/train/{symbol}")
async def train_model(symbol: str, force: bool = False):
    """
    Train or retrain model for a specific cryptocurrency

    Args:
        symbol: Cryptocurrency symbol
        force: Force retrain even if model exists
    """
    try:
        result = await prediction_service.train_model(symbol, force)
        return result
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail="Training failed")

@app.get("/models")
async def list_models():
    """List all trained models"""
    return prediction_service.list_models()

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database and load models on startup"""
    logger.info("Starting ML Service...")

    try:
        # Initialize database connection
        init_db()
        logger.info("Database connection initialized")

        # Load trained models
        prediction_service.load_models()
        logger.info(f"Loaded {prediction_service.get_loaded_models_count()} models")

        logger.info("ML Service started successfully")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ML Service...")
    prediction_service.cleanup()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
