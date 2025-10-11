"""
Prediction Service
Handles prediction generation, caching, and model management
"""
import os
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging

from app.models.lstm_predictor import LSTMPredictor
from app.utils.database import get_price_data, get_latest_price

logger = logging.getLogger(__name__)

class PredictionService:
    """
    Service for managing predictions and models
    """

    def __init__(self):
        self.models: Dict[str, LSTMPredictor] = {}
        self.predictions_cache: Dict[str, dict] = {}
        self.cache_ttl = 3600  # 1 hour cache
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Timeframe to days mapping
        self.timeframe_days = {
            '7d': 7,
            '14d': 14,
            '30d': 30
        }

    def load_models(self):
        """
        Load all trained models from disk
        """
        models_dir = "models/checkpoints"
        if not os.path.exists(models_dir):
            logger.warning(f"Models directory not found: {models_dir}")
            return

        # For now, create dummy models for common cryptocurrencies
        # In production, these would be loaded from trained model files
        symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOT', 'MATIC']

        for symbol in symbols:
            try:
                model = LSTMPredictor(symbol)
                # Try to load existing model, skip if not found
                try:
                    model.load(models_dir)
                    self.models[symbol] = model
                    logger.info(f"Loaded model for {symbol}")
                except FileNotFoundError:
                    logger.info(f"No trained model found for {symbol}, will use mock predictions")
            except Exception as e:
                logger.error(f"Error loading model for {symbol}: {str(e)}")

    def get_loaded_models_count(self) -> int:
        """Get number of loaded models"""
        return len(self.models)

    def list_models(self) -> List[dict]:
        """List all available models"""
        return [
            {
                'symbol': symbol,
                'version': model.model_version,
                'loaded': True
            }
            for symbol, model in self.models.items()
        ]

    async def get_prediction(self, symbol: str, timeframe: str) -> dict:
        """
        Get or generate prediction for a symbol

        Args:
            symbol: Cryptocurrency symbol
            timeframe: Prediction timeframe (7d, 14d, 30d)

        Returns:
            Prediction dictionary
        """
        # Check cache first
        cache_key = f"{symbol}:{timeframe}"
        if cache_key in self.predictions_cache:
            cached = self.predictions_cache[cache_key]
            if datetime.now() - cached['cached_at'] < timedelta(seconds=self.cache_ttl):
                logger.info(f"Returning cached prediction for {cache_key}")
                return cached['prediction']

        # Generate new prediction
        prediction = await self._generate_prediction(symbol, timeframe)

        # Cache result
        self.predictions_cache[cache_key] = {
            'prediction': prediction,
            'cached_at': datetime.now()
        }

        return prediction

    async def _generate_prediction(self, symbol: str, timeframe: str) -> dict:
        """
        Generate a new prediction

        Args:
            symbol: Cryptocurrency symbol
            timeframe: Prediction timeframe

        Returns:
            Prediction dictionary
        """
        if timeframe not in self.timeframe_days:
            raise ValueError(f"Invalid timeframe: {timeframe}. Must be one of {list(self.timeframe_days.keys())}")

        days_ahead = self.timeframe_days[timeframe]

        # Get current price from database
        current_price = await get_latest_price(symbol)
        if current_price is None:
            raise ValueError(f"No price data found for {symbol}")

        # Check if we have a trained model
        if symbol in self.models:
            try:
                # Get recent price data (last 90 days)
                price_data = await get_price_data(symbol, days=90)

                if len(price_data) < 60:
                    logger.warning(f"Insufficient data for {symbol}, using mock prediction")
                    return self._generate_mock_prediction(symbol, current_price, timeframe)

                # Run prediction in thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                predicted_price, confidence = await loop.run_in_executor(
                    self.executor,
                    self.models[symbol].predict,
                    price_data,
                    days_ahead
                )

                return self._format_prediction(
                    symbol=symbol,
                    timeframe=timeframe,
                    current_price=current_price,
                    predicted_price=predicted_price,
                    confidence=confidence
                )

            except Exception as e:
                logger.error(f"Prediction error for {symbol}: {str(e)}")
                # Fall back to mock prediction
                return self._generate_mock_prediction(symbol, current_price, timeframe)
        else:
            # No model available, use mock prediction
            return self._generate_mock_prediction(symbol, current_price, timeframe)

    def _generate_mock_prediction(self, symbol: str, current_price: float, timeframe: str) -> dict:
        """
        Generate mock prediction when model not available
        Uses simple trend-based estimation
        """
        # Simple mock: predict slight upward trend with some randomness
        # In production, this would be replaced with actual ML predictions
        import random

        days_ahead = self.timeframe_days[timeframe]

        # Generate a somewhat realistic prediction
        # - Short-term (7d): ±5% with trend
        # - Medium-term (14d): ±10% with trend
        # - Long-term (30d): ±15% with trend

        if timeframe == '7d':
            change_range = 0.05
            base_confidence = 0.75
        elif timeframe == '14d':
            change_range = 0.10
            base_confidence = 0.65
        else:  # 30d
            change_range = 0.15
            base_confidence = 0.55

        # Add some randomness
        change_percent = random.uniform(-change_range, change_range * 1.5)  # Slight bullish bias
        predicted_price = current_price * (1 + change_percent)

        # Confidence decreases with volatility
        confidence = base_confidence + random.uniform(-0.1, 0.1)
        confidence = max(0.5, min(0.9, confidence))

        return self._format_prediction(
            symbol=symbol,
            timeframe=timeframe,
            current_price=current_price,
            predicted_price=predicted_price,
            confidence=confidence,
            is_mock=True
        )

    def _format_prediction(
        self,
        symbol: str,
        timeframe: str,
        current_price: float,
        predicted_price: float,
        confidence: float,
        is_mock: bool = False
    ) -> dict:
        """
        Format prediction response
        """
        prediction_change_percent = ((predicted_price - current_price) / current_price) * 100

        return {
            'symbol': symbol,
            'timeframe': timeframe,
            'current_price': round(current_price, 2),
            'predicted_price': round(predicted_price, 2),
            'confidence': round(confidence, 4),
            'prediction_change_percent': round(prediction_change_percent, 2),
            'model_version': 'mock-v1.0.0' if is_mock else 'lstm-v1.0.0',
            'created_at': datetime.now().isoformat()
        }

    async def get_all_predictions(self, symbol: str) -> List[dict]:
        """
        Get all timeframe predictions for a symbol
        """
        predictions = []
        for timeframe in ['7d', '14d', '30d']:
            try:
                prediction = await self.get_prediction(symbol, timeframe)
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Error getting {timeframe} prediction for {symbol}: {str(e)}")

        return predictions

    async def train_model(self, symbol: str, force: bool = False) -> dict:
        """
        Train or retrain model for a symbol

        Args:
            symbol: Cryptocurrency symbol
            force: Force retrain even if model exists

        Returns:
            Training results
        """
        # Check if model already exists
        if symbol in self.models and not force:
            return {
                'status': 'already_trained',
                'message': f'Model for {symbol} already exists. Use force=true to retrain.'
            }

        try:
            # Get historical price data (last 365 days)
            price_data = await get_price_data(symbol, days=365)

            if len(price_data) < 100:
                raise ValueError(f"Insufficient data for training. Need at least 100 days, got {len(price_data)}")

            # Create and train model
            model = LSTMPredictor(symbol)

            # Run training in thread pool
            loop = asyncio.get_event_loop()
            training_results = await loop.run_in_executor(
                self.executor,
                model.train,
                price_data,
                100,  # epochs
                32,   # batch_size
                0.001 # learning_rate
            )

            # Save model
            model.save()

            # Add to loaded models
            self.models[symbol] = model

            return {
                'status': 'success',
                'symbol': symbol,
                'training_results': training_results,
                'message': f'Model for {symbol} trained successfully'
            }

        except Exception as e:
            logger.error(f"Training error for {symbol}: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def cleanup(self):
        """
        Cleanup resources
        """
        self.executor.shutdown(wait=True)
        logger.info("Prediction service cleaned up")
