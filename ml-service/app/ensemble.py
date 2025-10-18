"""
Model Ensemble for Improved Predictions
Combines predictions from multiple models for better accuracy
"""

import numpy as np
import torch
from typing import List, Dict, Tuple
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ModelPrediction:
    """Single model prediction result"""
    symbol: str
    probabilities: np.ndarray  # [bearish, neutral, bullish]
    direction: str
    confidence: float
    model_name: str
    model_accuracy: float = 0.5  # Historical accuracy weight


class PredictionEnsemble:
    """
    Ensemble predictor that combines multiple models

    Methods:
    - Weighted Average: Combine probabilities weighted by model accuracy
    - Majority Voting: Take the most frequent prediction
    - Confidence Threshold: Only use high-confidence predictions
    """

    def __init__(self, method: str = 'weighted_average'):
        """
        Initialize ensemble

        Args:
            method: Ensemble method ('weighted_average', 'majority_voting', 'max_confidence')
        """
        self.method = method
        logger.info(f"Ensemble initialized with method: {method}")

    def combine_predictions(
        self,
        predictions: List[ModelPrediction],
        min_confidence: float = 0.3
    ) -> Tuple[np.ndarray, str, float, Dict]:
        """
        Combine multiple model predictions

        Args:
            predictions: List of ModelPrediction objects
            min_confidence: Minimum confidence threshold to include prediction

        Returns:
            (combined_probabilities, direction, confidence, metadata)
        """
        if not predictions:
            raise ValueError("No predictions to combine")

        if len(predictions) == 1:
            pred = predictions[0]
            return pred.probabilities, pred.direction, pred.confidence, {
                'method': 'single_model',
                'models_used': 1,
                'model_names': [pred.model_name]
            }

        # Filter predictions by minimum confidence
        filtered_preds = [
            p for p in predictions
            if p.confidence >= min_confidence
        ]

        if not filtered_preds:
            logger.warning(f"All predictions below confidence threshold {min_confidence}, using all")
            filtered_preds = predictions

        logger.info(f"Combining {len(filtered_preds)}/{len(predictions)} predictions (method: {self.method})")

        if self.method == 'weighted_average':
            return self._weighted_average(filtered_preds)
        elif self.method == 'majority_voting':
            return self._majority_voting(filtered_preds)
        elif self.method == 'max_confidence':
            return self._max_confidence(filtered_preds)
        else:
            raise ValueError(f"Unknown ensemble method: {self.method}")

    def _weighted_average(
        self,
        predictions: List[ModelPrediction]
    ) -> Tuple[np.ndarray, str, float, Dict]:
        """
        Weighted average ensemble
        Combines probabilities weighted by historical model accuracy
        """
        # Calculate weights based on model accuracy
        weights = np.array([p.model_accuracy for p in predictions])
        weights = weights / weights.sum()  # Normalize to sum to 1

        # Combine probabilities
        combined_probs = np.zeros(3)
        for pred, weight in zip(predictions, weights):
            combined_probs += pred.probabilities * weight

        # Get final direction and confidence
        classes = ['bearish', 'neutral', 'bullish']
        predicted_class_idx = combined_probs.argmax()
        direction = classes[predicted_class_idx]
        confidence = float(combined_probs.max())

        metadata = {
            'method': 'weighted_average',
            'models_used': len(predictions),
            'model_names': [p.model_name for p in predictions],
            'weights': weights.tolist(),
            'individual_confidences': [p.confidence for p in predictions],
            'combined_probabilities': combined_probs.tolist()
        }

        logger.info(f"Weighted average: {direction} ({confidence:.3f}) from {len(predictions)} models")

        return combined_probs, direction, confidence, metadata

    def _majority_voting(
        self,
        predictions: List[ModelPrediction]
    ) -> Tuple[np.ndarray, str, float, Dict]:
        """
        Majority voting ensemble
        Takes the most frequent prediction direction
        """
        # Count votes for each direction
        from collections import Counter
        direction_votes = Counter([p.direction for p in predictions])

        # Get majority direction
        majority_direction = direction_votes.most_common(1)[0][0]
        vote_count = direction_votes[majority_direction]
        vote_ratio = vote_count / len(predictions)

        # Calculate combined probabilities based on voting
        classes = ['bearish', 'neutral', 'bullish']
        combined_probs = np.zeros(3)

        for pred in predictions:
            pred_idx = classes.index(pred.direction)
            combined_probs[pred_idx] += 1

        combined_probs = combined_probs / len(predictions)

        # Confidence is based on vote ratio and average confidence of majority voters
        majority_preds = [p for p in predictions if p.direction == majority_direction]
        avg_confidence = np.mean([p.confidence for p in majority_preds])
        confidence = float(vote_ratio * avg_confidence)

        metadata = {
            'method': 'majority_voting',
            'models_used': len(predictions),
            'model_names': [p.model_name for p in predictions],
            'vote_counts': dict(direction_votes),
            'vote_ratio': vote_ratio,
            'individual_directions': [p.direction for p in predictions]
        }

        logger.info(f"Majority vote: {majority_direction} ({vote_count}/{len(predictions)} votes, confidence: {confidence:.3f})")

        return combined_probs, majority_direction, confidence, metadata

    def _max_confidence(
        self,
        predictions: List[ModelPrediction]
    ) -> Tuple[np.ndarray, str, float, Dict]:
        """
        Max confidence ensemble
        Uses the prediction with highest confidence
        """
        # Find prediction with max confidence
        max_pred = max(predictions, key=lambda p: p.confidence)

        metadata = {
            'method': 'max_confidence',
            'models_used': len(predictions),
            'model_names': [p.model_name for p in predictions],
            'selected_model': max_pred.model_name,
            'selected_confidence': max_pred.confidence,
            'all_confidences': [p.confidence for p in predictions]
        }

        logger.info(f"Max confidence: {max_pred.direction} ({max_pred.confidence:.3f}) from {max_pred.model_name}")

        return max_pred.probabilities, max_pred.direction, max_pred.confidence, metadata


class TemporalEnsemble:
    """
    Temporal ensemble that combines predictions across multiple timeframes
    Gives more weight to recent predictions
    """

    def __init__(self, decay_factor: float = 0.9):
        """
        Initialize temporal ensemble

        Args:
            decay_factor: Weight decay for older predictions (0-1)
        """
        self.decay_factor = decay_factor
        self.prediction_history: Dict[str, List[ModelPrediction]] = {}

    def add_prediction(self, symbol: str, prediction: ModelPrediction):
        """Add a new prediction to history"""
        if symbol not in self.prediction_history:
            self.prediction_history[symbol] = []

        self.prediction_history[symbol].append(prediction)

        # Keep only last 10 predictions
        if len(self.prediction_history[symbol]) > 10:
            self.prediction_history[symbol] = self.prediction_history[symbol][-10:]

    def get_temporal_prediction(self, symbol: str) -> Tuple[np.ndarray, str, float, Dict]:
        """
        Get prediction combining temporal history
        More recent predictions have higher weight
        """
        if symbol not in self.prediction_history or not self.prediction_history[symbol]:
            raise ValueError(f"No prediction history for {symbol}")

        predictions = self.prediction_history[symbol]
        n = len(predictions)

        # Calculate exponential weights (more recent = higher weight)
        weights = np.array([self.decay_factor ** (n - i - 1) for i in range(n)])
        weights = weights / weights.sum()

        # Combine probabilities with temporal weights
        combined_probs = np.zeros(3)
        for pred, weight in zip(predictions, weights):
            combined_probs += pred.probabilities * weight

        # Get direction and confidence
        classes = ['bearish', 'neutral', 'bullish']
        predicted_class_idx = combined_probs.argmax()
        direction = classes[predicted_class_idx]
        confidence = float(combined_probs.max())

        metadata = {
            'method': 'temporal_ensemble',
            'predictions_used': n,
            'decay_factor': self.decay_factor,
            'weights': weights.tolist(),
            'trend': self._detect_trend(predictions)
        }

        logger.info(f"Temporal ensemble for {symbol}: {direction} ({confidence:.3f}) from {n} predictions")

        return combined_probs, direction, confidence, metadata

    def _detect_trend(self, predictions: List[ModelPrediction]) -> str:
        """Detect if predictions are trending in a direction"""
        if len(predictions) < 3:
            return 'insufficient_data'

        recent_3 = predictions[-3:]

        if all(p.direction == 'bullish' for p in recent_3):
            return 'strong_bullish'
        elif all(p.direction == 'bearish' for p in recent_3):
            return 'strong_bearish'
        elif all(p.direction == recent_3[0].direction for p in recent_3):
            return f'consistent_{recent_3[0].direction}'
        else:
            return 'mixed'


def create_ensemble_prediction(
    symbol: str,
    model_predictions: List[Dict],
    method: str = 'weighted_average',
    min_confidence: float = 0.3
) -> Dict:
    """
    Convenience function to create ensemble prediction

    Args:
        symbol: Cryptocurrency symbol
        model_predictions: List of prediction dicts with keys:
            - probabilities: np.ndarray
            - direction: str
            - confidence: float
            - model_name: str
            - accuracy: float (optional)
        method: Ensemble method
        min_confidence: Minimum confidence threshold

    Returns:
        Dict with ensemble prediction results
    """
    # Convert to ModelPrediction objects
    predictions = []
    for pred_dict in model_predictions:
        prediction = ModelPrediction(
            symbol=symbol,
            probabilities=pred_dict['probabilities'],
            direction=pred_dict['direction'],
            confidence=pred_dict['confidence'],
            model_name=pred_dict['model_name'],
            model_accuracy=pred_dict.get('accuracy', 0.5)
        )
        predictions.append(prediction)

    # Create ensemble
    ensemble = PredictionEnsemble(method=method)

    # Combine predictions
    combined_probs, direction, confidence, metadata = ensemble.combine_predictions(
        predictions,
        min_confidence=min_confidence
    )

    return {
        'symbol': symbol,
        'probabilities': combined_probs,
        'direction': direction,
        'confidence': confidence,
        'ensemble_metadata': metadata
    }
