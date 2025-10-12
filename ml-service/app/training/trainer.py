"""
LSTM Model Training Pipeline with MLflow Tracking
Implements training with early stopping, validation, and experiment tracking
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple
from datetime import datetime
import os
import json
from tqdm import tqdm

from app.models.crypto_lstm import CryptoLSTM


# Training configuration (from ML specification)
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


class ModelTrainer:
    """
    Trainer class for CryptoLSTM model with early stopping and MLflow tracking
    """

    def __init__(
        self,
        model: CryptoLSTM,
        config: Optional[Dict] = None,
        device: Optional[str] = None,
        use_mlflow: bool = False
    ):
        """
        Initialize the trainer

        Args:
            model: CryptoLSTM model instance
            config: Training configuration (uses defaults if None)
            device: Device to train on ('cuda' or 'cpu')
            use_mlflow: Whether to use MLflow tracking
        """
        self.model = model
        self.config = config or TRAINING_CONFIG
        self.use_mlflow = use_mlflow

        # Device setup
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        self.model = self.model.to(self.device)

        # Loss and optimizer
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = optim.Adam(
            self.model.parameters(),
            lr=self.config['learning_rate'],
            weight_decay=self.config['weight_decay']
        )

        # Training state
        self.best_val_loss = float('inf')
        self.best_val_accuracy = 0.0
        self.patience_counter = 0
        self.train_losses = []
        self.val_losses = []
        self.val_accuracies = []

        # MLflow setup
        if self.use_mlflow:
            try:
                import mlflow
                self.mlflow = mlflow
            except ImportError:
                print("⚠️  MLflow not installed, disabling tracking")
                self.use_mlflow = False

    def prepare_dataloaders(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        batch_size: Optional[int] = None
    ) -> Tuple[DataLoader, DataLoader]:
        """
        Create PyTorch DataLoaders for training and validation

        Args:
            X_train: Training features (num_samples, sequence_length, num_features)
            y_train: Training labels (num_samples,)
            X_val: Validation features
            y_val: Validation labels
            batch_size: Batch size (uses config if None)

        Returns:
            Tuple of (train_loader, val_loader)
        """
        batch_size = batch_size or self.config['batch_size']

        # Convert to tensors
        X_train_tensor = torch.FloatTensor(X_train)
        y_train_tensor = torch.LongTensor(y_train)
        X_val_tensor = torch.FloatTensor(X_val)
        y_val_tensor = torch.LongTensor(y_val)

        # Create datasets
        train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
        val_dataset = TensorDataset(X_val_tensor, y_val_tensor)

        # Create dataloaders
        train_loader = DataLoader(
            train_dataset,
            batch_size=batch_size,
            shuffle=True,  # Shuffle for better training
            drop_last=False
        )
        val_loader = DataLoader(
            val_dataset,
            batch_size=batch_size,
            shuffle=False,
            drop_last=False
        )

        return train_loader, val_loader

    def train_epoch(self, train_loader: DataLoader) -> float:
        """
        Train for one epoch

        Args:
            train_loader: Training data loader

        Returns:
            Average training loss for the epoch
        """
        self.model.train()
        total_loss = 0.0
        num_batches = 0

        for batch_features, batch_labels in train_loader:
            # Move to device
            batch_features = batch_features.to(self.device)
            batch_labels = batch_labels.to(self.device)

            # Forward pass
            self.optimizer.zero_grad()
            outputs = self.model(batch_features)
            loss = self.criterion(outputs, batch_labels)

            # Backward pass
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

        return total_loss / num_batches

    def validate(self, val_loader: DataLoader) -> Tuple[float, float, Dict]:
        """
        Validate the model

        Args:
            val_loader: Validation data loader

        Returns:
            Tuple of (val_loss, val_accuracy, metrics_dict)
        """
        self.model.eval()
        total_loss = 0.0
        num_batches = 0
        all_predictions = []
        all_labels = []

        with torch.no_grad():
            for batch_features, batch_labels in val_loader:
                # Move to device
                batch_features = batch_features.to(self.device)
                batch_labels = batch_labels.to(self.device)

                # Forward pass
                outputs = self.model(batch_features)
                loss = self.criterion(outputs, batch_labels)

                total_loss += loss.item()
                num_batches += 1

                # Get predictions
                _, predicted = torch.max(outputs, 1)
                all_predictions.extend(predicted.cpu().numpy())
                all_labels.extend(batch_labels.cpu().numpy())

        # Calculate metrics
        val_loss = total_loss / num_batches
        val_accuracy = np.mean(np.array(all_predictions) == np.array(all_labels))

        # Per-class accuracy
        all_predictions = np.array(all_predictions)
        all_labels = np.array(all_labels)

        metrics = {
            'val_loss': val_loss,
            'val_accuracy': val_accuracy,
            'bearish_accuracy': np.mean(all_predictions[all_labels == 0] == 0) if np.sum(all_labels == 0) > 0 else 0,
            'neutral_accuracy': np.mean(all_predictions[all_labels == 1] == 1) if np.sum(all_labels == 1) > 0 else 0,
            'bullish_accuracy': np.mean(all_predictions[all_labels == 2] == 2) if np.sum(all_labels == 2) > 0 else 0,
        }

        return val_loss, val_accuracy, metrics

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        symbol: str = "BTC",
        verbose: bool = True
    ) -> Dict:
        """
        Train the model with early stopping

        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features
            y_val: Validation labels
            symbol: Asset symbol for logging
            verbose: Whether to print progress

        Returns:
            Training results dictionary
        """
        if verbose:
            print(f"\n{'='*60}")
            print(f"Training CryptoLSTM for {symbol}")
            print(f"{'='*60}")
            print(f"Training samples: {len(X_train)}")
            print(f"Validation samples: {len(X_val)}")
            print(f"Device: {self.device}")
            print(f"{'='*60}\n")

        # Start MLflow run
        if self.use_mlflow:
            run_name = f"{symbol}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.mlflow.start_run(run_name=run_name)
            self.mlflow.log_params(self.config)
            self.mlflow.log_param("symbol", symbol)
            self.mlflow.log_param("train_samples", len(X_train))
            self.mlflow.log_param("val_samples", len(X_val))

        # Prepare data loaders
        train_loader, val_loader = self.prepare_dataloaders(X_train, y_train, X_val, y_val)

        # Training loop
        start_time = datetime.now()

        epochs_range = range(self.config['epochs'])
        if verbose:
            epochs_range = tqdm(epochs_range, desc="Training")

        for epoch in epochs_range:
            # Train
            train_loss = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)

            # Validate
            val_loss, val_accuracy, val_metrics = self.validate(val_loader)
            self.val_losses.append(val_loss)
            self.val_accuracies.append(val_accuracy)

            # Log to MLflow
            if self.use_mlflow:
                self.mlflow.log_metrics({
                    'train_loss': train_loss,
                    'val_loss': val_loss,
                    'val_accuracy': val_accuracy
                }, step=epoch)

            # Print progress
            if verbose and (epoch + 1) % 10 == 0:
                print(f"\nEpoch {epoch+1}/{self.config['epochs']}")
                print(f"  Train Loss: {train_loss:.4f}")
                print(f"  Val Loss: {val_loss:.4f}")
                print(f"  Val Accuracy: {val_accuracy:.4f}")

            # Early stopping
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.best_val_accuracy = val_accuracy
                self.patience_counter = 0

                # Save best model
                self.save_checkpoint(symbol, epoch, val_metrics)
            else:
                self.patience_counter += 1

                if self.patience_counter >= self.config['early_stopping_patience']:
                    if verbose:
                        print(f"\n⚠️  Early stopping triggered at epoch {epoch+1}")
                    break

        # Training complete
        training_time = (datetime.now() - start_time).total_seconds()

        if verbose:
            print(f"\n{'='*60}")
            print(f"Training Complete!")
            print(f"{'='*60}")
            print(f"Best Val Loss: {self.best_val_loss:.4f}")
            print(f"Best Val Accuracy: {self.best_val_accuracy:.4f}")
            print(f"Training Time: {training_time:.2f}s")
            print(f"{'='*60}\n")

        # Final metrics
        results = {
            'symbol': symbol,
            'best_val_loss': self.best_val_loss,
            'best_val_accuracy': self.best_val_accuracy,
            'final_train_loss': self.train_losses[-1],
            'epochs_trained': len(self.train_losses),
            'training_time_seconds': training_time,
            'early_stopped': self.patience_counter >= self.config['early_stopping_patience']
        }

        # Log final metrics to MLflow
        if self.use_mlflow:
            self.mlflow.log_metrics({
                'best_val_loss': self.best_val_loss,
                'best_val_accuracy': self.best_val_accuracy,
                'training_time': training_time
            })
            self.mlflow.pytorch.log_model(self.model, "model")
            self.mlflow.end_run()

        return results

    def save_checkpoint(self, symbol: str, epoch: int, metrics: Dict):
        """
        Save model checkpoint

        Args:
            symbol: Asset symbol
            epoch: Current epoch
            metrics: Validation metrics
        """
        checkpoint_dir = "models/checkpoints"
        os.makedirs(checkpoint_dir, exist_ok=True)

        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'best_val_loss': self.best_val_loss,
            'best_val_accuracy': self.best_val_accuracy,
            'metrics': metrics,
            'config': self.config
        }

        checkpoint_path = os.path.join(checkpoint_dir, f"{symbol}_best.pth")
        torch.save(checkpoint, checkpoint_path)

    def load_checkpoint(self, checkpoint_path: str):
        """
        Load model checkpoint

        Args:
            checkpoint_path: Path to checkpoint file
        """
        checkpoint = torch.load(checkpoint_path, map_location=self.device)

        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.best_val_loss = checkpoint['best_val_loss']
        self.best_val_accuracy = checkpoint['best_val_accuracy']

        print(f"✅ Loaded checkpoint from {checkpoint_path}")
        print(f"   Val Loss: {self.best_val_loss:.4f}")
        print(f"   Val Accuracy: {self.best_val_accuracy:.4f}")


def load_checkpoint(checkpoint_path: str, model: CryptoLSTM, device: str = 'cpu') -> Dict:
    """
    Load model checkpoint (standalone function for inference)

    Args:
        checkpoint_path: Path to checkpoint file
        model: Model instance to load weights into
        device: Device to load checkpoint on

    Returns:
        Dictionary containing checkpoint metadata
    """
    checkpoint = torch.load(checkpoint_path, map_location=device)

    model.load_state_dict(checkpoint['model_state_dict'])

    metadata = {
        'epoch': checkpoint.get('epoch'),
        'val_accuracy': checkpoint.get('best_val_accuracy'),
        'test_accuracy': checkpoint.get('best_val_accuracy'),  # Alias for compatibility
        'val_loss': checkpoint.get('best_val_loss'),
        'scaler': checkpoint.get('scaler'),  # May be None
        'metadata': checkpoint.get('metadata', {}),
        'config': checkpoint.get('config'),
        'model_version': checkpoint.get('metadata', {}).get('model_version', 'v1.0.0'),
        'trained_at': checkpoint.get('metadata', {}).get('trained_at')
    }

    return metadata


if __name__ == "__main__":
    # Test training pipeline
    print("Testing training pipeline...")

    # Create dummy data
    num_samples = 1000
    sequence_length = 90
    num_features = 20
    num_classes = 3

    X = np.random.randn(num_samples, sequence_length, num_features).astype(np.float32)
    y = np.random.randint(0, num_classes, num_samples)

    # Split data (70/15/15)
    train_size = int(num_samples * 0.7)
    val_size = int(num_samples * 0.15)

    X_train = X[:train_size]
    X_val = X[train_size:train_size+val_size]
    y_train = y[:train_size]
    y_val = y[train_size:train_size+val_size]

    print(f"Train: {X_train.shape}, Val: {X_val.shape}")

    # Create model
    from app.models.crypto_lstm import CryptoLSTM
    model = CryptoLSTM(input_size=num_features)

    # Create trainer
    config = TRAINING_CONFIG.copy()
    config['epochs'] = 5  # Quick test
    trainer = ModelTrainer(model, config=config, use_mlflow=False)

    # Train
    results = trainer.train(X_train, y_train, X_val, y_val, symbol="TEST")

    print(f"\n✅ Training test complete!")
    print(f"Results: {results}")
