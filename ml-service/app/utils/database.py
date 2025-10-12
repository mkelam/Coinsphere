"""
Database Utilities for ML Service
Connects to PostgreSQL to fetch price data
"""
import os
from typing import Optional, List, Dict
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta

load_dotenv()
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://coinsphere:password@localhost:5432/coinsphere_dev')

# Create engine
engine = None
SessionLocal = None

def init_db():
    """
    Initialize database connection
    """
    global engine, SessionLocal

    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("Database connection initialized")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

def get_db_session():
    """
    Get database session
    """
    if SessionLocal is None:
        init_db()

    return SessionLocal()

async def get_price_data(symbol: str, days: int = 90) -> np.ndarray:
    """
    Fetch historical price data for a symbol

    Args:
        symbol: Cryptocurrency symbol (e.g., BTC, ETH)
        days: Number of days of historical data

    Returns:
        NumPy array of close prices
    """
    try:
        session = get_db_session()

        # Query to get price data
        # Joins tokens and price_data tables
        query = text("""
            SELECT pd.close
            FROM price_data pd
            JOIN tokens t ON pd.token_id = t.id
            WHERE t.symbol = :symbol
            AND pd.time >= NOW() - INTERVAL ':days days'
            ORDER BY pd.time ASC
        """)

        result = session.execute(query, {'symbol': symbol, 'days': days})
        prices = [row[0] for row in result]

        session.close()

        if not prices:
            logger.warning(f"No price data found for {symbol}")
            # Return mock data for development
            return generate_mock_price_data(days)

        return np.array([float(p) for p in prices])

    except Exception as e:
        logger.error(f"Error fetching price data for {symbol}: {str(e)}")
        # Return mock data on error
        return generate_mock_price_data(days)

async def fetch_price_history(symbol: str, days: int = 90) -> pd.DataFrame:
    """
    Fetch historical price data for a symbol (returns DataFrame)

    Args:
        symbol: Cryptocurrency symbol (e.g., BTC, ETH)
        days: Number of days of historical data

    Returns:
        DataFrame with columns: time, price, volume_24h, market_cap, change_1h, change_24h, high, low
    """
    try:
        session = get_db_session()

        # Query to get OHLCV data
        query = text("""
            SELECT
                pd.time,
                pd.close as price,
                pd.volume as volume_24h,
                t.market_cap as market_cap,
                0 as change_1h,
                pd.percent_change_24h as change_24h,
                pd.high,
                pd.low
            FROM price_data pd
            JOIN tokens t ON pd.token_id = t.id
            WHERE t.symbol = :symbol
            AND pd.time >= NOW() - INTERVAL ':days days'
            ORDER BY pd.time ASC
        """)

        result = session.execute(query, {'symbol': symbol, 'days': days})
        rows = result.fetchall()

        session.close()

        if not rows or len(rows) == 0:
            logger.warning(f"No price data found for {symbol}, generating mock data")
            return generate_mock_price_dataframe(days, symbol)

        df = pd.DataFrame(rows, columns=['time', 'price', 'volume_24h', 'market_cap', 'change_1h', 'change_24h', 'high', 'low'])
        df['time'] = pd.to_datetime(df['time'])
        df.set_index('time', inplace=True)

        # Convert to numeric
        for col in ['price', 'volume_24h', 'market_cap', 'change_1h', 'change_24h', 'high', 'low']:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        return df

    except Exception as e:
        logger.error(f"Error fetching price history for {symbol}: {str(e)}")
        # Return mock data on error
        return generate_mock_price_dataframe(days, symbol)


async def get_latest_price(symbol: str) -> Optional[float]:
    """
    Get the latest price for a symbol

    Args:
        symbol: Cryptocurrency symbol

    Returns:
        Latest price or None
    """
    try:
        session = get_db_session()

        query = text("""
            SELECT t.current_price
            FROM tokens t
            WHERE t.symbol = :symbol
            LIMIT 1
        """)

        result = session.execute(query, {'symbol': symbol})
        row = result.fetchone()

        session.close()

        if row and row[0]:
            return float(row[0])

        # Return mock price for development
        return get_mock_current_price(symbol)

    except Exception as e:
        logger.error(f"Error fetching latest price for {symbol}: {str(e)}")
        return get_mock_current_price(symbol)


async def get_latest_prices(symbols: List[str]) -> Dict[str, float]:
    """
    Get latest prices for multiple symbols

    Args:
        symbols: List of cryptocurrency symbols

    Returns:
        Dictionary mapping symbol to price
    """
    prices = {}

    for symbol in symbols:
        price = await get_latest_price(symbol)
        if price:
            prices[symbol] = price

    return prices

def generate_mock_price_data(days: int = 90, base_price: float = 50000.0) -> np.ndarray:
    """
    Generate mock price data for development/testing

    Args:
        days: Number of days of data
        base_price: Starting price

    Returns:
        NumPy array of mock prices
    """
    import random

    prices = [base_price]

    for _ in range(days - 1):
        # Random walk with slight upward bias
        change_percent = random.gauss(0.001, 0.02)  # Mean=0.1%, StdDev=2%
        new_price = prices[-1] * (1 + change_percent)
        prices.append(new_price)

    return np.array(prices)


def generate_mock_price_dataframe(days: int = 90, symbol: str = 'BTC') -> pd.DataFrame:
    """
    Generate mock price DataFrame for development/testing

    Args:
        days: Number of days of data
        symbol: Symbol to generate data for

    Returns:
        DataFrame with OHLCV data
    """
    import random

    base_price = get_mock_current_price(symbol)

    dates = pd.date_range(end=datetime.now(), periods=days, freq='D')

    prices = []
    volumes = []
    market_caps = []

    current_price = base_price

    for _ in range(days):
        # Price (random walk)
        change_percent = random.gauss(0.001, 0.02)
        current_price = current_price * (1 + change_percent)
        prices.append(current_price)

        # Volume (random with some variation)
        volume = random.gauss(1000000000, 200000000)  # $1B avg volume
        volumes.append(max(volume, 100000000))

        # Market cap (proportional to price)
        market_cap = current_price * random.gauss(19000000, 1000000)  # ~19M BTC
        market_caps.append(max(market_cap, 1000000000))

    df = pd.DataFrame({
        'time': dates,
        'price': prices,
        'high': [p * random.uniform(1.0, 1.03) for p in prices],
        'low': [p * random.uniform(0.97, 1.0) for p in prices],
        'volume_24h': volumes,
        'market_cap': market_caps,
        'change_1h': [random.gauss(0, 0.5) for _ in range(days)],
        'change_24h': [random.gauss(0, 2.0) for _ in range(days)]
    })

    df.set_index('time', inplace=True)

    return df

def get_mock_current_price(symbol: str) -> float:
    """
    Get mock current price for a symbol (for development)

    Returns realistic prices for common cryptocurrencies
    """
    mock_prices = {
        'BTC': 45000.0,
        'ETH': 2500.0,
        'SOL': 100.0,
        'BNB': 350.0,
        'XRP': 0.55,
        'ADA': 0.45,
        'DOT': 7.50,
        'MATIC': 0.85,
        'AVAX': 35.0,
        'DOGE': 0.08
    }

    return mock_prices.get(symbol, 100.0)

async def save_prediction(prediction_data: dict):
    """
    Save prediction to database

    Args:
        prediction_data: Prediction data to save
    """
    try:
        session = get_db_session()

        # Get token_id for symbol
        token_query = text("""
            SELECT id FROM tokens WHERE symbol = :symbol LIMIT 1
        """)

        result = session.execute(token_query, {'symbol': prediction_data['symbol']})
        row = result.fetchone()

        if not row:
            logger.warning(f"Token not found for symbol {prediction_data['symbol']}")
            session.close()
            return

        token_id = row[0]

        # Calculate expiration time based on timeframe
        timeframe_days = {'7d': 7, '14d': 14, '30d': 30}
        days = timeframe_days.get(prediction_data['timeframe'], 7)

        # Insert prediction
        insert_query = text("""
            INSERT INTO predictions (
                id, token_id, prediction_type, predicted_price,
                confidence, model_version, created_at, expires_at
            ) VALUES (
                gen_random_uuid(), :token_id, :prediction_type,
                :predicted_price, :confidence, :model_version,
                NOW(), NOW() + INTERVAL ':days days'
            )
        """)

        session.execute(insert_query, {
            'token_id': token_id,
            'prediction_type': prediction_data['timeframe'],
            'predicted_price': prediction_data['predicted_price'],
            'confidence': prediction_data['confidence'],
            'model_version': prediction_data['model_version'],
            'days': days
        })

        session.commit()
        session.close()

        logger.info(f"Saved prediction for {prediction_data['symbol']}")

    except Exception as e:
        logger.error(f"Error saving prediction: {str(e)}")
        if session:
            session.rollback()
            session.close()
