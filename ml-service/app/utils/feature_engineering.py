"""
Feature Engineering for Crypto Price Prediction
Implements 20 input features as specified in ML_MODEL_SPECIFICATION.md

Features:
1-5:   Price-Based Features (close, change_1h, change_24h, hl_spread, log_returns)
6-13:  Technical Indicators (RSI, MACD, Bollinger Bands, EMAs, Volume MA)
14-17: Volume & Market Data (volume, volume_change, market_cap, market_cap_change)
18-20: Social Sentiment (social_score, sentiment_positive, sentiment_negative)
"""

import numpy as np
import pandas as pd
from typing import Optional, Dict
import warnings

warnings.filterwarnings('ignore')


def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate Relative Strength Index (RSI)

    Args:
        prices: Price series
        period: RSI period (default: 14)

    Returns:
        RSI series (0-100)
    """
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))

    return rsi


def calculate_macd(
    prices: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9
) -> tuple:
    """
    Calculate MACD (Moving Average Convergence Divergence)

    Args:
        prices: Price series
        fast_period: Fast EMA period (default: 12)
        slow_period: Slow EMA period (default: 26)
        signal_period: Signal line period (default: 9)

    Returns:
        Tuple of (macd, macd_signal, macd_histogram)
    """
    ema_fast = prices.ewm(span=fast_period, adjust=False).mean()
    ema_slow = prices.ewm(span=slow_period, adjust=False).mean()

    macd = ema_fast - ema_slow
    macd_signal = macd.ewm(span=signal_period, adjust=False).mean()
    macd_histogram = macd - macd_signal

    return macd, macd_signal, macd_histogram


def calculate_bollinger_bands(
    prices: pd.Series,
    period: int = 20,
    std_dev: float = 2.0
) -> tuple:
    """
    Calculate Bollinger Bands

    Args:
        prices: Price series
        period: Moving average period (default: 20)
        std_dev: Number of standard deviations (default: 2.0)

    Returns:
        Tuple of (upper_band, middle_band, lower_band)
    """
    middle_band = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()

    upper_band = middle_band + (std * std_dev)
    lower_band = middle_band - (std * std_dev)

    return upper_band, middle_band, lower_band


def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    """
    Calculate Exponential Moving Average

    Args:
        prices: Price series
        period: EMA period

    Returns:
        EMA series
    """
    return prices.ewm(span=period, adjust=False).mean()


def calculate_sma(prices: pd.Series, period: int) -> pd.Series:
    """
    Calculate Simple Moving Average

    Args:
        prices: Price series
        period: SMA period

    Returns:
        SMA series
    """
    return prices.rolling(window=period).mean()


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate all 20 features from raw price data

    Args:
        df: DataFrame with columns: 'price', 'high', 'low', 'volume', 'market_cap'
            Optional: 'change_1h', 'change_24h'

    Returns:
        DataFrame with 20 engineered features
    """
    features = pd.DataFrame(index=df.index)

    # ========== Price-Based Features (5) ==========

    # 1. Close Price (normalized later)
    features['close'] = df['price']

    # 2. Price Change 1h (%)
    if 'change_1h' in df.columns:
        features['change_1h'] = df['change_1h']
    else:
        features['change_1h'] = df['price'].pct_change(periods=1) * 100

    # 3. Price Change 24h (%)
    if 'change_24h' in df.columns:
        features['change_24h'] = df['change_24h']
    else:
        features['change_24h'] = df['price'].pct_change(periods=24) * 100

    # 4. High-Low Spread (volatility proxy)
    if 'high' in df.columns and 'low' in df.columns:
        features['hl_spread'] = (df['high'] - df['low']) / df['price']
    else:
        # Estimate from rolling std if high/low not available
        features['hl_spread'] = df['price'].rolling(window=24).std() / df['price']

    # 5. Log Returns
    features['log_returns'] = np.log(df['price'] / df['price'].shift(1))

    # ========== Technical Indicators (8) ==========

    # 6. RSI (14-day)
    features['rsi'] = calculate_rsi(df['price'], period=14)

    # 7-8. MACD and Signal
    macd, macd_signal, macd_hist = calculate_macd(df['price'])
    features['macd'] = macd
    features['macd_signal'] = macd_signal

    # 9-10. Bollinger Bands (Upper and Lower)
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(df['price'], period=20)
    features['bb_upper'] = bb_upper
    features['bb_lower'] = bb_lower

    # 11-12. EMAs (20-day and 50-day)
    features['ema_20'] = calculate_ema(df['price'], period=20)
    features['ema_50'] = calculate_ema(df['price'], period=50)

    # 13. Volume MA (20-day)
    if 'volume' in df.columns:
        features['volume_ma'] = calculate_sma(df['volume'], period=20)
    else:
        features['volume_ma'] = 0  # Placeholder if volume not available

    # ========== Volume & Market Data (4) ==========

    # 14. Volume (normalized later)
    if 'volume' in df.columns:
        features['volume'] = df['volume']
    else:
        features['volume'] = 0

    # 15. Volume Change (%)
    if 'volume' in df.columns:
        features['volume_change'] = df['volume'].pct_change() * 100
    else:
        features['volume_change'] = 0

    # 16. Market Cap (normalized later)
    if 'market_cap' in df.columns:
        features['market_cap'] = df['market_cap']
    else:
        features['market_cap'] = 0

    # 17. Market Cap Change (%)
    if 'market_cap' in df.columns:
        features['market_cap_change'] = df['market_cap'].pct_change() * 100
    else:
        features['market_cap_change'] = 0

    # ========== Social Sentiment (3) ==========
    # Note: These would normally come from LunarCrush API
    # For now, using placeholders (will be populated by prediction service)

    # 18. Social Score (0-100)
    features['social_score'] = 50.0  # Placeholder

    # 19. Sentiment Positive (%)
    features['sentiment_pos'] = 50.0  # Placeholder

    # 20. Sentiment Negative (%)
    features['sentiment_neg'] = 50.0  # Placeholder

    # Drop NaN rows (first ~50 rows due to moving averages)
    features = features.dropna()

    return features


def create_labels(df: pd.DataFrame, horizon: int = 7, threshold: float = 2.0) -> pd.Series:
    """
    Create classification labels for price direction prediction

    Labels:
    - 0: Bearish (price decreases > threshold%)
    - 1: Neutral (price changes within ±threshold%)
    - 2: Bullish (price increases > threshold%)

    Args:
        df: DataFrame with 'close' or 'price' column
        horizon: Number of days ahead to predict (default: 7)
        threshold: Percentage threshold for neutral zone (default: 2.0%)

    Returns:
        Series of labels (0, 1, 2)
    """
    price_col = 'close' if 'close' in df.columns else 'price'

    # Calculate future price (shifted backwards)
    future_price = df[price_col].shift(-horizon)
    current_price = df[price_col]

    # Calculate percentage change
    pct_change = (future_price - current_price) / current_price * 100

    # Create labels
    labels = pd.Series(index=df.index, dtype=int)
    labels[pct_change < -threshold] = 0  # Bearish
    labels[(pct_change >= -threshold) & (pct_change <= threshold)] = 1  # Neutral
    labels[pct_change > threshold] = 2  # Bullish

    # Drop last 'horizon' rows (no future data)
    labels = labels[:-horizon]

    return labels


def create_sequences(
    features: pd.DataFrame,
    labels: pd.Series,
    sequence_length: int = 90
) -> tuple:
    """
    Create sequences for LSTM input using sliding window approach

    Args:
        features: DataFrame with engineered features (20 columns)
        labels: Series with labels (0, 1, 2)
        sequence_length: Number of timesteps in each sequence (default: 90)

    Returns:
        Tuple of (X, y) where:
        - X: numpy array of shape (num_samples, sequence_length, num_features)
        - y: numpy array of shape (num_samples,)
    """
    X, y = [], []

    # Ensure indices align
    common_index = features.index.intersection(labels.index)
    features = features.loc[common_index]
    labels = labels.loc[common_index]

    feature_values = features.values
    label_values = labels.values

    # Create sequences
    for i in range(len(features) - sequence_length):
        # Input: sequence_length days of features
        X.append(feature_values[i:i + sequence_length])

        # Label: future direction at end of sequence
        y.append(label_values[i + sequence_length])

    X = np.array(X)  # Shape: (num_samples, sequence_length, num_features)
    y = np.array(y)  # Shape: (num_samples,)

    return X, y


def normalize_features(features: pd.DataFrame, scaler_params: Optional[Dict] = None) -> tuple:
    """
    Normalize features using standardization (zero mean, unit variance)

    Args:
        features: DataFrame with features to normalize
        scaler_params: Optional dict with 'mean' and 'std' for pre-fitted scaler

    Returns:
        Tuple of (normalized_features, scaler_params)
    """
    if scaler_params is None:
        # Fit scaler on training data
        scaler_params = {
            'mean': features.mean().to_dict(),
            'std': features.std().to_dict()
        }

    # Normalize
    normalized = features.copy()
    for col in features.columns:
        mean = scaler_params['mean'][col]
        std = scaler_params['std'][col]

        if std > 0:
            normalized[col] = (features[col] - mean) / std
        else:
            normalized[col] = 0  # Handle constant features

    return normalized, scaler_params


def split_time_series_data(
    X: np.ndarray,
    y: np.ndarray,
    train_pct: float = 0.7,
    val_pct: float = 0.15
) -> tuple:
    """
    Split time-series data into train/val/test sets (no shuffling!)

    Args:
        X: Feature array
        y: Label array
        train_pct: Training data percentage (default: 0.7)
        val_pct: Validation data percentage (default: 0.15)

    Returns:
        Tuple of (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    n = len(X)
    train_size = int(n * train_pct)
    val_size = int(n * val_pct)

    X_train = X[:train_size]
    X_val = X[train_size:train_size + val_size]
    X_test = X[train_size + val_size:]

    y_train = y[:train_size]
    y_val = y[train_size:train_size + val_size]
    y_test = y[train_size + val_size:]

    return X_train, X_val, X_test, y_train, y_val, y_test


if __name__ == "__main__":
    # Test feature engineering
    print("Testing feature engineering...")

    # Create mock data
    dates = pd.date_range(start='2023-01-01', periods=365, freq='D')
    mock_data = pd.DataFrame({
        'price': np.random.randn(365).cumsum() + 50000,
        'high': np.random.randn(365).cumsum() + 51000,
        'low': np.random.randn(365).cumsum() + 49000,
        'volume': np.random.rand(365) * 1e9,
        'market_cap': np.random.rand(365) * 1e12
    }, index=dates)

    # Engineer features
    features = engineer_features(mock_data)
    print(f"\n✅ Engineered {len(features.columns)} features:")
    print(features.columns.tolist())
    print(f"\n   Feature matrix shape: {features.shape}")

    # Create labels
    labels = create_labels(features, horizon=7)
    print(f"\n✅ Created labels: {len(labels)} samples")
    print(f"   Label distribution: {labels.value_counts().to_dict()}")

    # Create sequences
    X, y = create_sequences(features, labels, sequence_length=90)
    print(f"\n✅ Created sequences:")
    print(f"   X shape: {X.shape}")
    print(f"   y shape: {y.shape}")

    # Split data
    X_train, X_val, X_test, y_train, y_val, y_test = split_time_series_data(X, y)
    print(f"\n✅ Split data:")
    print(f"   Train: {X_train.shape[0]} samples")
    print(f"   Val:   {X_val.shape[0]} samples")
    print(f"   Test:  {X_test.shape[0]} samples")

    print("\n✅ Feature engineering test complete!")
