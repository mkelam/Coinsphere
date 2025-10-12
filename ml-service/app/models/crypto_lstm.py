"""
Enhanced LSTM Model for Crypto Price Prediction
Implements the 3-layer LSTM architecture from ML_MODEL_SPECIFICATION.md

Architecture:
- LSTM Layer 1: 128 units with dropout 0.2
- LSTM Layer 2: 64 units with dropout 0.2
- LSTM Layer 3: 32 units with dropout 0.2
- Dense Layer: 16 units with ReLU
- Output Layer: 3 units with Softmax (Bearish, Neutral, Bullish)
"""

import torch
import torch.nn as nn
from typing import Optional


class CryptoLSTM(nn.Module):
    """
    3-layer LSTM model for crypto price direction prediction

    Predicts market direction as:
    - Class 0: Bearish (price will decrease >2%)
    - Class 1: Neutral (price will stay within ±2%)
    - Class 2: Bullish (price will increase >2%)
    """

    def __init__(
        self,
        input_size: int = 20,
        hidden_sizes: list = [128, 64, 32],
        num_classes: int = 3,
        dropout: float = 0.2
    ):
        """
        Initialize the CryptoLSTM model

        Args:
            input_size: Number of features per timestep (default: 20)
            hidden_sizes: List of hidden layer sizes (default: [128, 64, 32])
            num_classes: Number of output classes (default: 3 for Bearish/Neutral/Bullish)
            dropout: Dropout rate for regularization (default: 0.2)
        """
        super(CryptoLSTM, self).__init__()

        self.input_size = input_size
        self.hidden_sizes = hidden_sizes
        self.num_classes = num_classes
        self.dropout = dropout

        # LSTM Layer 1 (128 units)
        self.lstm1 = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_sizes[0],
            batch_first=True,
            dropout=0  # Dropout handled separately
        )
        self.dropout1 = nn.Dropout(dropout)

        # LSTM Layer 2 (64 units)
        self.lstm2 = nn.LSTM(
            input_size=hidden_sizes[0],
            hidden_size=hidden_sizes[1],
            batch_first=True,
            dropout=0
        )
        self.dropout2 = nn.Dropout(dropout)

        # LSTM Layer 3 (32 units)
        self.lstm3 = nn.LSTM(
            input_size=hidden_sizes[1],
            hidden_size=hidden_sizes[2],
            batch_first=True,
            dropout=0
        )
        self.dropout3 = nn.Dropout(dropout)

        # Dense layers
        self.fc1 = nn.Linear(hidden_sizes[2], 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, num_classes)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        """
        Forward pass through the network

        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)

        Returns:
            Output tensor of shape (batch_size, num_classes) with softmax probabilities
        """
        # x shape: (batch_size, sequence_length, input_size)
        # e.g., (32, 90, 20) for batch of 32, 90-day sequences, 20 features

        # LSTM Layer 1
        out, _ = self.lstm1(x)
        out = self.dropout1(out)

        # LSTM Layer 2
        out, _ = self.lstm2(out)
        out = self.dropout2(out)

        # LSTM Layer 3
        out, (hidden, cell) = self.lstm3(out)
        out = self.dropout3(out)

        # Take last timestep output
        out = out[:, -1, :]  # Shape: (batch_size, 32)

        # Dense layers
        out = self.fc1(out)  # Shape: (batch_size, 16)
        out = self.relu(out)
        out = self.fc2(out)  # Shape: (batch_size, 3)
        out = self.softmax(out)  # Shape: (batch_size, 3) with probabilities summing to 1

        return out

    def get_num_parameters(self) -> int:
        """Calculate total number of trainable parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

    def predict_direction(self, probabilities: torch.Tensor) -> tuple:
        """
        Convert softmax probabilities to prediction and confidence

        Args:
            probabilities: Tensor of shape (batch_size, 3)

        Returns:
            Tuple of (predicted_classes, confidence_scores)
        """
        # Get predicted class (0: bearish, 1: neutral, 2: bullish)
        predicted_classes = torch.argmax(probabilities, dim=1)

        # Confidence is the maximum probability
        confidence_scores = torch.max(probabilities, dim=1)[0]

        return predicted_classes, confidence_scores

    def get_confidence_level(self, confidence: float) -> str:
        """
        Map confidence score to human-readable level

        Args:
            confidence: Confidence score (0-1)

        Returns:
            Confidence level string ('low', 'medium', 'high')
        """
        if confidence >= 0.70:
            return "high"
        elif confidence >= 0.50:
            return "medium"
        else:
            return "low"


def create_model(input_size: int = 20, device: Optional[str] = None) -> CryptoLSTM:
    """
    Factory function to create and initialize a CryptoLSTM model

    Args:
        input_size: Number of input features (default: 20)
        device: Device to place model on ('cuda' or 'cpu', auto-detected if None)

    Returns:
        Initialized CryptoLSTM model
    """
    if device is None:
        device = 'cuda' if torch.cuda.is_available() else 'cpu'

    model = CryptoLSTM(input_size=input_size)
    model = model.to(device)

    # Print model summary
    num_params = model.get_num_parameters()
    print(f"CryptoLSTM model created:")
    print(f"  - Parameters: {num_params:,}")
    print(f"  - Device: {device}")
    print(f"  - Architecture: {model.hidden_sizes}")

    return model


if __name__ == "__main__":
    # Test model creation
    print("Testing CryptoLSTM model...")

    # Create model
    model = create_model()

    # Test forward pass
    batch_size = 32
    sequence_length = 90
    input_size = 20

    # Create dummy input
    x = torch.randn(batch_size, sequence_length, input_size)

    # Forward pass
    output = model(x)

    print(f"\nTest forward pass:")
    print(f"  Input shape: {x.shape}")
    print(f"  Output shape: {output.shape}")
    print(f"  Output sample: {output[0]}")
    print(f"  Output sum (should be ~1.0): {output[0].sum().item():.6f}")

    # Test prediction
    predicted_classes, confidence_scores = model.predict_direction(output)
    print(f"\nPredicted classes: {predicted_classes[:5]}")
    print(f"Confidence scores: {confidence_scores[:5]}")

    print("\n✅ CryptoLSTM model test complete!")
