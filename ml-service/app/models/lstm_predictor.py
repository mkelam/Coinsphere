"""
LSTM-based Price Prediction Model
Uses PyTorch to predict cryptocurrency prices
"""
import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional
import pickle
import os
from datetime import datetime

class LSTMModel(nn.Module):
    """
    LSTM neural network for time series prediction
    """
    def __init__(self, input_size: int = 1, hidden_size: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super(LSTMModel, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )

        # Fully connected layer
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        # Initialize hidden state and cell state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)

        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))

        # Get output from last time step
        out = self.fc(out[:, -1, :])

        return out


class LSTMPredictor:
    """
    Wrapper class for LSTM model with training and prediction capabilities
    """

    def __init__(self, symbol: str, model_version: str = "v1.0.0"):
        self.symbol = symbol
        self.model_version = model_version
        self.model: Optional[LSTMModel] = None
        self.scaler_params: Optional[dict] = None
        self.sequence_length = 60  # Use 60 data points for prediction
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for LSTM training

        Args:
            data: Price data array

        Returns:
            X: Input sequences
            y: Target values
        """
        X, y = [], []

        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i + self.sequence_length])
            y.append(data[i + self.sequence_length])

        return np.array(X), np.array(y)

    def normalize_data(self, data: np.ndarray, fit: bool = False) -> np.ndarray:
        """
        Normalize data using min-max scaling

        Args:
            data: Data to normalize
            fit: Whether to fit scaler (True for training data)

        Returns:
            Normalized data
        """
        if fit:
            self.scaler_params = {
                'min': np.min(data),
                'max': np.max(data)
            }

        if self.scaler_params is None:
            raise ValueError("Scaler not fitted. Call with fit=True first.")

        normalized = (data - self.scaler_params['min']) / (self.scaler_params['max'] - self.scaler_params['min'])
        return normalized

    def denormalize_data(self, data: np.ndarray) -> np.ndarray:
        """
        Denormalize data back to original scale
        """
        if self.scaler_params is None:
            raise ValueError("Scaler not fitted")

        return data * (self.scaler_params['max'] - self.scaler_params['min']) + self.scaler_params['min']

    def train(
        self,
        price_data: np.ndarray,
        epochs: int = 100,
        batch_size: int = 32,
        learning_rate: float = 0.001
    ) -> dict:
        """
        Train the LSTM model

        Args:
            price_data: Historical price data
            epochs: Number of training epochs
            batch_size: Batch size for training
            learning_rate: Learning rate

        Returns:
            Training metrics
        """
        # Normalize data
        normalized_data = self.normalize_data(price_data, fit=True)

        # Create sequences
        X, y = self.create_sequences(normalized_data)

        # Convert to PyTorch tensors
        X = torch.FloatTensor(X).unsqueeze(-1).to(self.device)
        y = torch.FloatTensor(y).unsqueeze(-1).to(self.device)

        # Initialize model
        self.model = LSTMModel().to(self.device)

        # Loss and optimizer
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)

        # Training loop
        self.model.train()
        losses = []

        for epoch in range(epochs):
            total_loss = 0
            num_batches = 0

            for i in range(0, len(X), batch_size):
                batch_X = X[i:i + batch_size]
                batch_y = y[i:i + batch_size]

                # Forward pass
                outputs = self.model(batch_X)
                loss = criterion(outputs, batch_y)

                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

                total_loss += loss.item()
                num_batches += 1

            avg_loss = total_loss / num_batches
            losses.append(avg_loss)

            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        return {
            'final_loss': losses[-1],
            'epochs': epochs,
            'data_points': len(price_data)
        }

    def predict(self, recent_prices: np.ndarray, days_ahead: int = 7) -> Tuple[float, float]:
        """
        Predict future price

        Args:
            recent_prices: Recent price data (at least sequence_length points)
            days_ahead: Number of days to predict ahead

        Returns:
            Predicted price and confidence score
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        if len(recent_prices) < self.sequence_length:
            raise ValueError(f"Need at least {self.sequence_length} data points")

        self.model.eval()

        # Use last sequence_length prices
        input_data = recent_prices[-self.sequence_length:]

        # Normalize
        normalized_input = self.normalize_data(input_data, fit=False)

        # Convert to tensor
        X = torch.FloatTensor(normalized_input).unsqueeze(0).unsqueeze(-1).to(self.device)

        # Predict
        with torch.no_grad():
            prediction = self.model(X)
            prediction = prediction.cpu().numpy()[0][0]

        # Denormalize
        predicted_price = self.denormalize_data(np.array([prediction]))[0]

        # Calculate confidence (simple heuristic based on recent volatility)
        recent_volatility = np.std(recent_prices[-30:]) / np.mean(recent_prices[-30:])
        confidence = max(0.5, 1.0 - (recent_volatility * 5))  # Lower confidence for high volatility
        confidence = min(0.95, confidence)  # Cap at 95%

        return float(predicted_price), float(confidence)

    def save(self, save_dir: str = "models/checkpoints"):
        """
        Save model and scaler parameters
        """
        if self.model is None:
            raise ValueError("No model to save")

        os.makedirs(save_dir, exist_ok=True)

        # Save model weights
        model_path = os.path.join(save_dir, f"{self.symbol}_{self.model_version}.pth")
        torch.save(self.model.state_dict(), model_path)

        # Save scaler parameters
        scaler_path = os.path.join(save_dir, f"{self.symbol}_{self.model_version}_scaler.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler_params, f)

        print(f"Model saved to {model_path}")

    def load(self, save_dir: str = "models/checkpoints"):
        """
        Load model and scaler parameters
        """
        model_path = os.path.join(save_dir, f"{self.symbol}_{self.model_version}.pth")
        scaler_path = os.path.join(save_dir, f"{self.symbol}_{self.model_version}_scaler.pkl")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        # Load model
        self.model = LSTMModel().to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

        # Load scaler
        with open(scaler_path, 'rb') as f:
            self.scaler_params = pickle.load(f)

        print(f"Model loaded from {model_path}")
