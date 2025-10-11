"""
ML Model Training Script
Trains LSTM models for all supported cryptocurrencies using historical data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime, timedelta
from typing import List

from app.models.lstm_predictor import LSTMPredictor
from app.utils.database import get_price_data, generate_mock_price_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Cryptocurrencies to train models for
SUPPORTED_SYMBOLS = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
    'ADA', 'DOT', 'MATIC', 'AVAX', 'DOGE',
    'LINK', 'UNI', 'ATOM', 'LTC', 'ETC'
]

# Training configuration
TRAINING_CONFIG = {
    'epochs': 100,
    'batch_size': 32,
    'learning_rate': 0.001,
    'minimum_data_points': 180,  # Minimum 180 days of data
    'historical_days': 365  # Use 1 year of historical data
}


async def fetch_training_data(symbol: str) -> tuple:
    """
    Fetch historical price data for training

    Returns:
        (price_data, data_source) tuple
    """
    try:
        logger.info(f"Fetching historical data for {symbol}...")

        # Try to fetch from database
        price_data = await get_price_data(symbol, days=TRAINING_CONFIG['historical_days'])

        if len(price_data) >= TRAINING_CONFIG['minimum_data_points']:
            logger.info(f"✓ Fetched {len(price_data)} data points from database for {symbol}")
            return price_data, 'database'
        else:
            logger.warning(f"Insufficient database data for {symbol} ({len(price_data)} points)")
            logger.info(f"Generating mock data for training...")

            # Generate mock data for training
            mock_data = generate_mock_price_data(
                days=TRAINING_CONFIG['historical_days'],
                base_price=get_base_price(symbol)
            )
            logger.info(f"✓ Generated {len(mock_data)} mock data points for {symbol}")
            return mock_data, 'mock'

    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        raise


def get_base_price(symbol: str) -> float:
    """Get realistic base price for a symbol"""
    price_map = {
        'BTC': 45000.0,
        'ETH': 2500.0,
        'BNB': 350.0,
        'SOL': 100.0,
        'XRP': 0.55,
        'ADA': 0.45,
        'DOT': 7.50,
        'MATIC': 0.85,
        'AVAX': 35.0,
        'DOGE': 0.08,
        'LINK': 15.0,
        'UNI': 6.5,
        'ATOM': 10.0,
        'LTC': 70.0,
        'ETC': 20.0
    }
    return price_map.get(symbol, 100.0)


async def train_model_for_symbol(symbol: str) -> dict:
    """
    Train LSTM model for a single cryptocurrency

    Returns:
        Training results dictionary
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Training model for {symbol}")
    logger.info(f"{'='*60}")

    start_time = datetime.now()

    try:
        # Fetch training data
        price_data, data_source = await fetch_training_data(symbol)

        # Create model instance
        model = LSTMPredictor(symbol, model_version="v1.0.0")

        # Train model
        logger.info(f"Starting training for {symbol}...")
        logger.info(f"Configuration: {TRAINING_CONFIG}")

        training_results = model.train(
            price_data=price_data,
            epochs=TRAINING_CONFIG['epochs'],
            batch_size=TRAINING_CONFIG['batch_size'],
            learning_rate=TRAINING_CONFIG['learning_rate']
        )

        # Save trained model
        logger.info(f"Saving model for {symbol}...")
        model.save(save_dir="../models/checkpoints")

        # Calculate training time
        training_time = (datetime.now() - start_time).total_seconds()

        # Prepare results
        results = {
            'symbol': symbol,
            'status': 'success',
            'data_source': data_source,
            'data_points': len(price_data),
            'training_results': training_results,
            'training_time_seconds': round(training_time, 2),
            'model_version': 'v1.0.0',
            'timestamp': datetime.now().isoformat()
        }

        logger.info(f"✓ Model for {symbol} trained successfully")
        logger.info(f"  - Final loss: {training_results['final_loss']:.6f}")
        logger.info(f"  - Training time: {training_time:.2f}s")
        logger.info(f"  - Data source: {data_source}")

        return results

    except Exception as e:
        logger.error(f"✗ Training failed for {symbol}: {str(e)}")
        return {
            'symbol': symbol,
            'status': 'failed',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }


async def train_all_models(symbols: List[str] = None) -> List[dict]:
    """
    Train models for all specified cryptocurrencies

    Args:
        symbols: List of symbols to train (default: SUPPORTED_SYMBOLS)

    Returns:
        List of training results
    """
    if symbols is None:
        symbols = SUPPORTED_SYMBOLS

    logger.info(f"\n{'#'*60}")
    logger.info(f"COINSPHERE ML MODEL TRAINING")
    logger.info(f"{'#'*60}")
    logger.info(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Symbols to train: {len(symbols)}")
    logger.info(f"Symbols: {', '.join(symbols)}")
    logger.info(f"{'#'*60}\n")

    all_results = []

    for i, symbol in enumerate(symbols, 1):
        logger.info(f"Progress: {i}/{len(symbols)}")

        result = await train_model_for_symbol(symbol)
        all_results.append(result)

        # Add delay between trainings to prevent resource exhaustion
        if i < len(symbols):
            await asyncio.sleep(2)

    # Summary
    logger.info(f"\n{'#'*60}")
    logger.info(f"TRAINING COMPLETE")
    logger.info(f"{'#'*60}")

    successful = sum(1 for r in all_results if r['status'] == 'success')
    failed = len(all_results) - successful

    logger.info(f"Total: {len(all_results)} models")
    logger.info(f"Successful: {successful}")
    logger.info(f"Failed: {failed}")

    if successful > 0:
        avg_loss = sum(r['training_results']['final_loss'] for r in all_results if r['status'] == 'success') / successful
        logger.info(f"Average final loss: {avg_loss:.6f}")

    logger.info(f"{'#'*60}\n")

    # Save training summary
    save_training_summary(all_results)

    return all_results


def save_training_summary(results: List[dict]):
    """Save training summary to file"""
    summary_file = f"training_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    with open(summary_file, 'w') as f:
        f.write("COINSPHERE ML MODEL TRAINING SUMMARY\n")
        f.write("=" * 60 + "\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total models: {len(results)}\n\n")

        for result in results:
            f.write(f"\n{result['symbol']}:\n")
            f.write(f"  Status: {result['status']}\n")

            if result['status'] == 'success':
                f.write(f"  Data source: {result['data_source']}\n")
                f.write(f"  Data points: {result['data_points']}\n")
                f.write(f"  Final loss: {result['training_results']['final_loss']:.6f}\n")
                f.write(f"  Training time: {result['training_time_seconds']:.2f}s\n")
            else:
                f.write(f"  Error: {result['error']}\n")

    logger.info(f"Training summary saved to {summary_file}")


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Train LSTM models for cryptocurrency prediction')
    parser.add_argument(
        '--symbols',
        nargs='+',
        help='Specific symbols to train (default: all supported symbols)'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=TRAINING_CONFIG['epochs'],
        help=f'Number of training epochs (default: {TRAINING_CONFIG["epochs"]})'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=TRAINING_CONFIG['batch_size'],
        help=f'Batch size (default: {TRAINING_CONFIG["batch_size"]})'
    )

    args = parser.parse_args()

    # Update config if custom values provided
    if args.epochs:
        TRAINING_CONFIG['epochs'] = args.epochs
    if args.batch_size:
        TRAINING_CONFIG['batch_size'] = args.batch_size

    # Train models
    symbols = args.symbols if args.symbols else SUPPORTED_SYMBOLS
    await train_all_models(symbols)


if __name__ == "__main__":
    asyncio.run(main())
