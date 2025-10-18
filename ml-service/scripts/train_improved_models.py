"""
Improved Model Training Script
Trains models with enhanced hyperparameters for better accuracy:
- Larger model capacity (256, 128, 64 hidden sizes)
- More training data (1095 days = 3 years)
- Learning rate scheduling
- Increased regularization
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the original training script components
from scripts.train_initial_models import train_model_for_asset, save_training_summary, fetch_historical_data_cryptocompare
import asyncio
import logging
from datetime import datetime
from typing import List, Dict

from app.models.crypto_lstm import CryptoLSTM
from app.training.trainer import IMPROVED_TRAINING_CONFIG

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training_improved.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# IMPROVED Training parameters
IMPROVED_TRAINING_PARAMS = {
    'epochs': 150,
    'batch_size': 16,
    'learning_rate': 0.0005,
    'early_stopping_patience': 20,
    'sequence_length': 90,
    'historical_days': 1095,  # 3 years instead of 2
    'prediction_horizon': 7,
}


def create_improved_model(input_size: int = 20):
    """Create model with improved architecture"""
    hidden_sizes = IMPROVED_TRAINING_CONFIG['hidden_sizes']
    dropout = IMPROVED_TRAINING_CONFIG['dropout']

    model = CryptoLSTM(
        input_size=input_size,
        hidden_sizes=hidden_sizes,
        dropout=dropout
    )

    num_params = model.get_num_parameters()
    logger.info(f"✨ Improved CryptoLSTM model created:")
    logger.info(f"  - Parameters: {num_params:,}")
    logger.info(f"  - Architecture: {hidden_sizes}")
    logger.info(f"  - Dropout: {dropout}")

    return model


async def train_improved_model(symbol: str) -> Dict:
    """
    Train a model with improved hyperparameters

    Args:
        symbol: Cryptocurrency symbol

    Returns:
        Training results dictionary
    """
    logger.info(f"\n{'='*80}")
    logger.info(f"🚀 TRAINING IMPROVED MODEL FOR {symbol}")
    logger.info(f"{'='*80}")
    logger.info(f"Improvements:")
    logger.info(f"  - Model size: [256, 128, 64] (vs [128, 64, 32])")
    logger.info(f"  - Training data: 3 years (vs 2 years)")
    logger.info(f"  - Learning rate: 0.0005 (vs 0.001)")
    logger.info(f"  - Batch size: 16 (vs 32)")
    logger.info(f"  - Early stopping patience: 20 (vs 10)")
    logger.info(f"  - Learning rate scheduling: ENABLED")
    logger.info(f"{'='*80}\n")

    start_time = datetime.now()

    try:
        from app.utils.feature_engineering import (
            engineer_features,
            create_labels,
            create_sequences,
            split_time_series_data
        )
        from app.training.trainer import ModelTrainer

        # Step 1: Fetch 3 years of historical data
        logger.info(f"Fetching {IMPROVED_TRAINING_PARAMS['historical_days']} days of historical data for {symbol}...")
        df = await fetch_historical_data_cryptocompare(
            symbol,
            days=IMPROVED_TRAINING_PARAMS['historical_days']
        )

        if len(df) < 200:
            raise ValueError(f"Insufficient data: {len(df)} days")

        # Step 2: Engineer features
        logger.info(f"Engineering features for {symbol}...")
        features = engineer_features(df)
        logger.info(f"✅ Engineered {len(features.columns)} features")

        # Step 3: Create labels
        logger.info(f"Creating labels (7-day prediction horizon)...")
        labels = create_labels(features, horizon=IMPROVED_TRAINING_PARAMS['prediction_horizon'])
        logger.info(f"✅ Created {len(labels)} labels")
        logger.info(f"   Distribution: {labels.value_counts().to_dict()}")

        # Step 4: Create sequences
        logger.info(f"Creating sequences (90-day lookback)...")
        X, y = create_sequences(
            features,
            labels,
            sequence_length=IMPROVED_TRAINING_PARAMS['sequence_length']
        )
        logger.info(f"✅ Created sequences: X={X.shape}, y={y.shape}")

        # Step 5: Normalize features
        logger.info(f"Normalizing features...")
        X_normalized = X.copy()
        for i in range(X.shape[2]):
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

        # Step 7: Create improved model
        logger.info(f"Creating improved LSTM model...")
        model = create_improved_model(input_size=20)

        # Step 8: Create trainer with improved config
        logger.info(f"Creating trainer with improved configuration...")
        logger.info(f"  - Learning rate scheduling: ENABLED")
        logger.info(f"  - Scheduler patience: 5 epochs")
        logger.info(f"  - Scheduler factor: 0.5x")
        trainer = ModelTrainer(
            model=model,
            config=IMPROVED_TRAINING_CONFIG,
            use_mlflow=False
        )

        # Step 9: Train model
        logger.info(f"Starting training (max {IMPROVED_TRAINING_CONFIG['epochs']} epochs)...")
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
            'model_type': 'improved',
            'architecture': IMPROVED_TRAINING_CONFIG['hidden_sizes'],
            'historical_days': IMPROVED_TRAINING_PARAMS['historical_days'],
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
        logger.info(f"✅ {symbol} IMPROVED MODEL TRAINING COMPLETE!")
        logger.info(f"{'='*80}")
        logger.info(f"Val Accuracy: {results['best_val_accuracy']:.2%}")
        logger.info(f"Test Accuracy: {test_accuracy:.2%}")
        logger.info(f"Training Time: {training_time:.2f}s")
        logger.info(f"Model Parameters: {model.get_num_parameters():,}")
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
            'model_type': 'improved',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


async def train_all_improved_models(assets: List[str]) -> List[Dict]:
    """Train improved models for all specified assets"""
    logger.info(f"\n{'#'*80}")
    logger.info(f"🚀 IMPROVED MODEL TRAINING SESSION")
    logger.info(f"{'#'*80}")
    logger.info(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Assets: {', '.join(assets)}")
    logger.info(f"Configuration:")
    logger.info(f"  - Architecture: {IMPROVED_TRAINING_CONFIG['hidden_sizes']}")
    logger.info(f"  - Historical data: {IMPROVED_TRAINING_PARAMS['historical_days']} days (3 years)")
    logger.info(f"  - Learning rate: {IMPROVED_TRAINING_CONFIG['learning_rate']}")
    logger.info(f"  - Batch size: {IMPROVED_TRAINING_CONFIG['batch_size']}")
    logger.info(f"  - Max epochs: {IMPROVED_TRAINING_CONFIG['epochs']}")
    logger.info(f"  - Early stopping patience: {IMPROVED_TRAINING_CONFIG['early_stopping_patience']}")
    logger.info(f"  - Learning rate scheduling: ENABLED")
    logger.info(f"{'#'*80}\n")

    all_results = []

    for i, symbol in enumerate(assets, 1):
        logger.info(f"\n>>> Training {i}/{len(assets)}: {symbol}")

        result = await train_improved_model(symbol)
        all_results.append(result)

        if i < len(assets):
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
            logger.info(f"    Parameters: {result['model_parameters']:,}")

    if failed:
        logger.info(f"\n❌ Failed Models:")
        for result in failed:
            logger.info(f"  {result['symbol']}: {result['error']}")

    logger.info(f"\n{'#'*80}\n")

    # Save summary
    save_training_summary(all_results)

    return all_results


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Train improved LSTM models')
    parser.add_argument(
        '--assets',
        nargs='+',
        default=['BTC'],
        help='Assets to train (default: BTC)'
    )

    args = parser.parse_args()

    # Train all models
    results = await train_all_improved_models(args.assets)

    # Exit with status code
    failed_count = sum(1 for r in results if r['status'] == 'failed')
    sys.exit(failed_count)


if __name__ == "__main__":
    asyncio.run(main())
