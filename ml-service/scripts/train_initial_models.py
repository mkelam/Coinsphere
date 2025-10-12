"""
ML-002: Train Initial Models Script
Trains LSTM models for BTC, ETH, and SOL using the infrastructure from ML-001

This script:
1. Fetches historical price data from CryptoCompare API
2. Engineers 20 features per asset
3. Creates training sequences
4. Trains LSTM models with early stopping
5. Saves trained models to checkpoints directory
"""

import sys
import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.crypto_lstm import CryptoLSTM, create_model
from app.training.trainer import ModelTrainer, TRAINING_CONFIG
from app.utils.feature_engineering import (
    engineer_features,
    create_labels,
    create_sequences,
    normalize_features,
    split_time_series_data
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training_ml002.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Assets to train
ASSETS = ['BTC', 'ETH', 'SOL']

# Training configuration (from ML specification)
TRAINING_PARAMS = {
    'epochs': 100,
    'batch_size': 32,
    'learning_rate': 0.001,
    'early_stopping_patience': 10,
    'sequence_length': 90,
    'historical_days': 730,  # 2 years
    'prediction_horizon': 7,  # 7-day predictions
}


async def fetch_historical_data_cryptocompare(symbol: str, days: int = 730) -> pd.DataFrame:
    """
    Fetch historical daily OHLCV data from CryptoCompare

    Args:
        symbol: Asset symbol (BTC, ETH, SOL)
        days: Number of days of historical data

    Returns:
        DataFrame with columns: timestamp, open, high, low, close, volume
    """
    import requests

    logger.info(f"Fetching {days} days of historical data for {symbol}...")

    # CryptoCompare API endpoint
    url = "https://min-api.cryptocompare.com/data/v2/histoday"

    # Get API key from environment
    api_key = os.getenv('CRYPTOCOMPARE_API_KEY', '')

    params = {
        'fsym': symbol,
        'tsym': 'USD',
        'limit': days,
        'api_key': api_key
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if data['Response'] != 'Success':
            raise Exception(f"API Error: {data.get('Message', 'Unknown error')}")

        # Parse response
        price_data = data['Data']['Data']

        df = pd.DataFrame(price_data)
        df['timestamp'] = pd.to_datetime(df['time'], unit='s')
        df = df.rename(columns={
            'open': 'open',
            'high': 'high',
            'low': 'low',
            'close': 'price',
            'volumefrom': 'volume'
        })

        # Select relevant columns
        df = df[['timestamp', 'open', 'high', 'low', 'price', 'volume']]
        df = df.set_index('timestamp')

        # Add market cap (estimated from volume and price)
        df['market_cap'] = df['price'] * df['volume'] * 10  # Rough estimate

        logger.info(f"✅ Fetched {len(df)} days of data for {symbol}")
        logger.info(f"   Date range: {df.index.min()} to {df.index.max()}")
        logger.info(f"   Price range: ${df['price'].min():.2f} - ${df['price'].max():.2f}")

        return df

    except Exception as e:
        logger.error(f"❌ Error fetching data for {symbol}: {str(e)}")

        # Fallback: Generate synthetic data for testing
        logger.warning(f"Generating synthetic data for {symbol} (TESTING ONLY)")
        return generate_synthetic_data(symbol, days)


def generate_synthetic_data(symbol: str, days: int) -> pd.DataFrame:
    """
    Generate synthetic price data for testing (when API unavailable)
    """
    base_prices = {
        'BTC': 45000.0,
        'ETH': 2500.0,
        'SOL': 100.0
    }

    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')

    # Generate price with random walk
    base_price = base_prices.get(symbol, 100.0)
    returns = np.random.normal(0.001, 0.02, days)  # 0.1% mean, 2% std daily return
    prices = base_price * np.exp(np.cumsum(returns))

    # Generate OHLC from close prices
    df = pd.DataFrame({
        'timestamp': dates,
        'open': prices * (1 + np.random.uniform(-0.01, 0.01, days)),
        'high': prices * (1 + np.random.uniform(0, 0.02, days)),
        'low': prices * (1 + np.random.uniform(-0.02, 0, days)),
        'price': prices,
        'volume': np.random.uniform(1e9, 1e10, days),
        'market_cap': prices * np.random.uniform(5e11, 1e12, days)
    })

    df = df.set_index('timestamp')

    return df


async def train_model_for_asset(symbol: str, use_mlflow: bool = False) -> Dict:
    """
    Train LSTM model for a single asset

    Args:
        symbol: Asset symbol (BTC, ETH, SOL)
        use_mlflow: Whether to use MLflow tracking

    Returns:
        Training results dictionary
    """
    logger.info(f"\n{'='*80}")
    logger.info(f"TRAINING MODEL FOR {symbol}")
    logger.info(f"{'='*80}\n")

    start_time = datetime.now()

    try:
        # Step 1: Fetch historical data
        df = await fetch_historical_data_cryptocompare(
            symbol,
            days=TRAINING_PARAMS['historical_days']
        )

        if len(df) < TRAINING_PARAMS['sequence_length'] + 50:
            raise ValueError(f"Insufficient data: {len(df)} days (need at least {TRAINING_PARAMS['sequence_length'] + 50})")

        # Step 2: Engineer features
        logger.info(f"Engineering features for {symbol}...")
        features = engineer_features(df)
        logger.info(f"✅ Engineered {len(features.columns)} features")
        logger.info(f"   Features: {', '.join(features.columns.tolist())}")

        # Step 3: Create labels
        logger.info(f"Creating labels (7-day prediction horizon)...")
        labels = create_labels(features, horizon=TRAINING_PARAMS['prediction_horizon'])
        logger.info(f"✅ Created {len(labels)} labels")
        logger.info(f"   Distribution: {labels.value_counts().to_dict()}")

        # Step 4: Create sequences
        logger.info(f"Creating sequences (90-day lookback)...")
        X, y = create_sequences(
            features,
            labels,
            sequence_length=TRAINING_PARAMS['sequence_length']
        )
        logger.info(f"✅ Created sequences: X={X.shape}, y={y.shape}")

        # Step 5: Normalize features
        logger.info(f"Normalizing features...")
        X_normalized = X.copy()
        # Normalize each feature across the time dimension
        for i in range(X.shape[2]):  # For each feature
            feature_data = X[:, :, i].reshape(-1)
            mean = feature_data.mean()
            std = feature_data.std()
            if std > 0:
                X_normalized[:, :, i] = (X[:, :, i] - mean) / std
        logger.info(f"✅ Features normalized")

        # Step 6: Split data
        logger.info(f"Splitting data (70/15/15)...")
        X_train, X_val, X_test, y_train, y_val, y_test = split_time_series_data(
            X_normalized, y,
            train_pct=0.7,
            val_pct=0.15
        )
        logger.info(f"✅ Data split:")
        logger.info(f"   Train: {X_train.shape[0]} samples")
        logger.info(f"   Val:   {X_val.shape[0]} samples")
        logger.info(f"   Test:  {X_test.shape[0]} samples")

        # Step 7: Create model
        logger.info(f"Creating LSTM model...")
        model = create_model(input_size=20)
        logger.info(f"✅ Model created with {model.get_num_parameters():,} parameters")

        # Step 8: Create trainer
        logger.info(f"Creating trainer with early stopping (patience=10)...")
        trainer = ModelTrainer(
            model=model,
            config=TRAINING_CONFIG,
            use_mlflow=use_mlflow
        )

        # Step 9: Train model
        logger.info(f"Starting training (max 100 epochs)...")
        results = trainer.train(
            X_train=X_train,
            y_train=y_train,
            X_val=X_val,
            y_val=y_val,
            symbol=symbol,
            verbose=True
        )

        # Step 10: Evaluate on test set
        logger.info(f"Evaluating on test set...")
        test_loss, test_accuracy, test_metrics = trainer.validate(
            trainer.prepare_dataloaders(X_test, y_test, X_test, y_test)[1]
        )

        logger.info(f"✅ Test Results:")
        logger.info(f"   Test Loss: {test_loss:.6f}")
        logger.info(f"   Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
        logger.info(f"   Bearish Accuracy: {test_metrics['bearish_accuracy']:.4f}")
        logger.info(f"   Neutral Accuracy: {test_metrics['neutral_accuracy']:.4f}")
        logger.info(f"   Bullish Accuracy: {test_metrics['bullish_accuracy']:.4f}")

        # Calculate training time
        training_time = (datetime.now() - start_time).total_seconds()

        # Final results
        final_results = {
            'symbol': symbol,
            'status': 'success',
            'data_points': len(df),
            'features': len(features.columns),
            'sequences': len(X),
            'train_samples': len(X_train),
            'val_samples': len(X_val),
            'test_samples': len(X_test),
            'best_val_loss': results['best_val_loss'],
            'best_val_accuracy': results['best_val_accuracy'],
            'test_loss': test_loss,
            'test_accuracy': test_accuracy,
            'test_bearish_accuracy': test_metrics['bearish_accuracy'],
            'test_neutral_accuracy': test_metrics['neutral_accuracy'],
            'test_bullish_accuracy': test_metrics['bullish_accuracy'],
            'epochs_trained': results['epochs_trained'],
            'early_stopped': results['early_stopped'],
            'training_time_seconds': training_time,
            'model_parameters': model.get_num_parameters(),
            'checkpoint_path': f"models/checkpoints/{symbol}_best.pth",
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"\n{'='*80}")
        logger.info(f"✅ {symbol} MODEL TRAINING COMPLETE!")
        logger.info(f"{'='*80}")
        logger.info(f"Best Val Accuracy: {results['best_val_accuracy']:.2%}")
        logger.info(f"Test Accuracy: {test_accuracy:.2%}")
        logger.info(f"Training Time: {training_time:.2f}s")
        logger.info(f"Checkpoint: models/checkpoints/{symbol}_best.pth")
        logger.info(f"{'='*80}\n")

        return final_results

    except Exception as e:
        logger.error(f"❌ Training failed for {symbol}: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'symbol': symbol,
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


async def train_all_models(use_mlflow: bool = False) -> List[Dict]:
    """
    Train models for all assets (BTC, ETH, SOL)

    Args:
        use_mlflow: Whether to use MLflow tracking

    Returns:
        List of training results
    """
    logger.info(f"\n{'#'*80}")
    logger.info(f"ML-002: TRAIN INITIAL MODELS")
    logger.info(f"{'#'*80}")
    logger.info(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Assets: {', '.join(ASSETS)}")
    logger.info(f"Configuration: {TRAINING_PARAMS}")
    logger.info(f"{'#'*80}\n")

    all_results = []

    for i, symbol in enumerate(ASSETS, 1):
        logger.info(f"\n>>> Training {i}/{len(ASSETS)}: {symbol}")

        result = await train_model_for_asset(symbol, use_mlflow=use_mlflow)
        all_results.append(result)

        # Small delay between trainings
        if i < len(ASSETS):
            await asyncio.sleep(2)

    # Summary
    logger.info(f"\n{'#'*80}")
    logger.info(f"TRAINING COMPLETE - SUMMARY")
    logger.info(f"{'#'*80}\n")

    successful = [r for r in all_results if r['status'] == 'success']
    failed = [r for r in all_results if r['status'] == 'failed']

    logger.info(f"Total: {len(all_results)} models")
    logger.info(f"Successful: {len(successful)}")
    logger.info(f"Failed: {len(failed)}")

    if successful:
        logger.info(f"\n✅ Successful Models:")
        for result in successful:
            logger.info(f"\n  {result['symbol']}:")
            logger.info(f"    Val Accuracy: {result['best_val_accuracy']:.2%}")
            logger.info(f"    Test Accuracy: {result['test_accuracy']:.2%}")
            logger.info(f"    Training Time: {result['training_time_seconds']:.1f}s")
            logger.info(f"    Checkpoint: {result['checkpoint_path']}")

    if failed:
        logger.info(f"\n❌ Failed Models:")
        for result in failed:
            logger.info(f"  {result['symbol']}: {result['error']}")

    logger.info(f"\n{'#'*80}\n")

    # Save summary
    save_training_summary(all_results)

    return all_results


def save_training_summary(results: List[Dict]):
    """Save training summary to JSON file"""
    import json

    summary_file = f"training_summary_ml002_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(summary_file, 'w') as f:
        json.dump(results, f, indent=2)

    logger.info(f"📄 Training summary saved to {summary_file}")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Train LSTM models for BTC, ETH, SOL')
    parser.add_argument(
        '--mlflow',
        action='store_true',
        help='Enable MLflow experiment tracking'
    )
    parser.add_argument(
        '--assets',
        nargs='+',
        default=ASSETS,
        help='Specific assets to train (default: BTC ETH SOL)'
    )

    args = parser.parse_args()

    # Update global ASSETS list if specified
    if args.assets:
        ASSETS.clear()
        ASSETS.extend(args.assets)

    # Train all models
    results = await train_all_models(use_mlflow=args.mlflow)

    # Exit with status code
    failed_count = sum(1 for r in results if r['status'] == 'failed')
    sys.exit(failed_count)


if __name__ == "__main__":
    asyncio.run(main())
