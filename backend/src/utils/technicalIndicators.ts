/**
 * Technical Indicators Library
 * Phase 1 - Backtesting Infrastructure
 *
 * Provides calculation functions for all technical indicators needed
 * by the 5 validated trading strategies.
 */

import { MarketDataOhlcv } from '@prisma/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EMAResult {
  timestamp: Date;
  value: number;
}

export interface MACDResult {
  timestamp: Date;
  macd: number;
  signal: number;
  histogram: number;
}

export interface RSIResult {
  timestamp: Date;
  value: number;
}

export interface BollingerBandsResult {
  timestamp: Date;
  upper: number;
  middle: number;
  lower: number;
}

export interface ATRResult {
  timestamp: Date;
  value: number;
}

export interface VWAPResult {
  timestamp: Date;
  value: number;
}

// ============================================================================
// MOVING AVERAGES
// ============================================================================

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }

    result.push(sum / period);
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    if (i >= data.length) {
      return result;
    }
    sum += data[i];
    result.push(NaN);
  }

  const firstEMA = sum / period;
  result[period - 1] = firstEMA;

  // Subsequent EMAs use the multiplier
  for (let i = period; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate EMA with timestamps
 */
export function calculateEMAWithTimestamps(
  ohlcv: OHLCV[],
  period: number,
  priceField: 'close' | 'high' | 'low' | 'open' = 'close'
): EMAResult[] {
  const prices = ohlcv.map(d => d[priceField]);
  const emaValues = calculateEMA(prices, period);

  return ohlcv.map((candle, i) => ({
    timestamp: candle.timestamp,
    value: emaValues[i]
  }));
}

// ============================================================================
// MOMENTUM INDICATORS
// ============================================================================

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // First RSI uses simple average
  result.push(NaN); // No RSI for first data point

  for (let i = 0; i < period - 1; i++) {
    result.push(NaN);
  }

  if (gains.length < period) {
    return result;
  }

  // Calculate first average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  result.push(rsi);

  // Subsequent RSIs use smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }

  return result;
}

/**
 * Calculate RSI with timestamps
 */
export function calculateRSIWithTimestamps(
  ohlcv: OHLCV[],
  period: number = 14
): RSIResult[] {
  const closes = ohlcv.map(d => d.close);
  const rsiValues = calculateRSI(closes, period);

  return ohlcv.map((candle, i) => ({
    timestamp: candle.timestamp,
    value: rsiValues[i]
  }));
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macdLine: number[] = fastEMA.map((fast, i) => fast - slowEMA[i]);

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  const result: MACDResult[] = [];
  for (let i = 0; i < data.length; i++) {
    result.push({
      timestamp: new Date(), // Placeholder, will be filled by wrapper function
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: macdLine[i] - signalLine[i]
    });
  }

  return result;
}

/**
 * Calculate MACD with timestamps
 */
export function calculateMACDWithTimestamps(
  ohlcv: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult[] {
  const closes = ohlcv.map(d => d.close);
  const macdValues = calculateMACD(closes, fastPeriod, slowPeriod, signalPeriod);

  return ohlcv.map((candle, i) => ({
    timestamp: candle.timestamp,
    macd: macdValues[i].macd,
    signal: macdValues[i].signal,
    histogram: macdValues[i].histogram
  }));
}

// ============================================================================
// VOLATILITY INDICATORS
// ============================================================================

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(ohlcv: OHLCV[], period: number = 14): ATRResult[] {
  const trueRanges: number[] = [];

  // Calculate True Range for each period
  for (let i = 1; i < ohlcv.length; i++) {
    const high = ohlcv[i].high;
    const low = ohlcv[i].low;
    const prevClose = ohlcv[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate ATR (smoothed average of True Range)
  const atrValues = calculateEMA([0, ...trueRanges], period);

  return ohlcv.map((candle, i) => ({
    timestamp: candle.timestamp,
    value: i === 0 ? NaN : atrValues[i]
  }));
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult[] {
  const result: BollingerBandsResult[] = [];
  const sma = calculateSMA(data, period);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({
        timestamp: new Date(), // Placeholder
        upper: NaN,
        middle: NaN,
        lower: NaN
      });
      continue;
    }

    // Calculate standard deviation
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i];
    const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    result.push({
      timestamp: new Date(), // Placeholder
      upper: mean + (stdDev * standardDeviation),
      middle: mean,
      lower: mean - (stdDev * standardDeviation)
    });
  }

  return result;
}

/**
 * Calculate Bollinger Bands with timestamps
 */
export function calculateBollingerBandsWithTimestamps(
  ohlcv: OHLCV[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult[] {
  const closes = ohlcv.map(d => d.close);
  const bbValues = calculateBollingerBands(closes, period, stdDev);

  return ohlcv.map((candle, i) => ({
    timestamp: candle.timestamp,
    upper: bbValues[i].upper,
    middle: bbValues[i].middle,
    lower: bbValues[i].lower
  }));
}

// ============================================================================
// VOLUME INDICATORS
// ============================================================================

/**
 * Calculate Volume-Weighted Average Price (VWAP)
 */
export function calculateVWAP(ohlcv: OHLCV[]): VWAPResult[] {
  const result: VWAPResult[] = [];
  let cumulativeTPV = 0; // Total Price * Volume
  let cumulativeVolume = 0;

  for (let i = 0; i < ohlcv.length; i++) {
    const typicalPrice = (ohlcv[i].high + ohlcv[i].low + ohlcv[i].close) / 3;
    const volume = ohlcv[i].volume;

    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;

    const vwap = cumulativeVolume === 0 ? NaN : cumulativeTPV / cumulativeVolume;

    result.push({
      timestamp: ohlcv[i].timestamp,
      value: vwap
    });
  }

  return result;
}

/**
 * Calculate Volume SMA
 */
export function calculateVolumeSMA(ohlcv: OHLCV[], period: number = 20): number[] {
  const volumes = ohlcv.map(d => d.volume);
  return calculateSMA(volumes, period);
}

/**
 * Calculate Volume Ratio (current volume / average volume)
 */
export function calculateVolumeRatio(ohlcv: OHLCV[], period: number = 20): number[] {
  const volumeSMA = calculateVolumeSMA(ohlcv, period);

  return ohlcv.map((candle, i) => {
    if (isNaN(volumeSMA[i]) || volumeSMA[i] === 0) {
      return NaN;
    }
    return candle.volume / volumeSMA[i];
  });
}

// ============================================================================
// TREND INDICATORS
// ============================================================================

/**
 * Calculate Average Directional Index (ADX)
 */
export function calculateADX(ohlcv: OHLCV[], period: number = 14): number[] {
  const result: number[] = [];

  // Calculate +DM and -DM
  const plusDM: number[] = [0]; // No DM for first candle
  const minusDM: number[] = [0];

  for (let i = 1; i < ohlcv.length; i++) {
    const highDiff = ohlcv[i].high - ohlcv[i - 1].high;
    const lowDiff = ohlcv[i - 1].low - ohlcv[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
  }

  // Calculate ATR
  const atrValues = calculateATR(ohlcv, period).map(a => a.value);

  // Smooth +DM and -DM
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);

  // Calculate +DI and -DI
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < ohlcv.length; i++) {
    if (isNaN(atrValues[i]) || atrValues[i] === 0) {
      plusDI.push(NaN);
      minusDI.push(NaN);
    } else {
      plusDI.push((smoothedPlusDM[i] / atrValues[i]) * 100);
      minusDI.push((smoothedMinusDM[i] / atrValues[i]) * 100);
    }
  }

  // Calculate DX
  const dx: number[] = [];
  for (let i = 0; i < ohlcv.length; i++) {
    if (isNaN(plusDI[i]) || isNaN(minusDI[i])) {
      dx.push(NaN);
    } else {
      const diSum = plusDI[i] + minusDI[i];
      const diDiff = Math.abs(plusDI[i] - minusDI[i]);
      dx.push(diSum === 0 ? NaN : (diDiff / diSum) * 100);
    }
  }

  // Calculate ADX (smoothed DX)
  const adx = calculateEMA(dx, period);

  return adx;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Prisma MarketDataOhlcv to OHLCV interface
 */
export function convertPrismaToOHLCV(data: MarketDataOhlcv[]): OHLCV[] {
  return data.map(d => ({
    timestamp: d.timestamp,
    open: parseFloat(d.open.toString()),
    high: parseFloat(d.high.toString()),
    low: parseFloat(d.low.toString()),
    close: parseFloat(d.close.toString()),
    volume: parseFloat(d.volume.toString())
  }));
}

/**
 * Validate OHLCV data quality
 */
export function validateOHLCVData(ohlcv: OHLCV[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (ohlcv.length === 0) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  for (let i = 0; i < ohlcv.length; i++) {
    const candle = ohlcv[i];

    // Check for missing or invalid values
    if (candle.high < candle.low) {
      errors.push(`Invalid candle at index ${i}: high < low`);
    }

    if (candle.close > candle.high || candle.close < candle.low) {
      errors.push(`Invalid candle at index ${i}: close outside high/low range`);
    }

    if (candle.open > candle.high || candle.open < candle.low) {
      errors.push(`Invalid candle at index ${i}: open outside high/low range`);
    }

    if (candle.volume < 0) {
      errors.push(`Invalid candle at index ${i}: negative volume`);
    }

    // Check for chronological order
    if (i > 0 && candle.timestamp <= ohlcv[i - 1].timestamp) {
      errors.push(`Invalid timestamp at index ${i}: not chronological`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Calculate returns array from price data
 */
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [0]; // First period has no return

  for (let i = 1; i < prices.length; i++) {
    const returnPct = calculatePercentageChange(prices[i - 1], prices[i]) / 100;
    returns.push(returnPct);
  }

  return returns;
}

// ============================================================================
// COMPOSITE INDICATORS (STRATEGY-SPECIFIC)
// ============================================================================

/**
 * Check if price is in bullish trend (EMA crossover)
 */
export function isBullishTrend(
  shortEMA: number[],
  longEMA: number[],
  index: number
): boolean {
  if (index < 1) return false;
  if (isNaN(shortEMA[index]) || isNaN(longEMA[index])) return false;

  // Current: short EMA > long EMA
  // Previous: short EMA <= long EMA
  return (
    shortEMA[index] > longEMA[index] &&
    shortEMA[index - 1] <= longEMA[index - 1]
  );
}

/**
 * Check if RSI indicates oversold condition
 */
export function isRSIOversold(rsi: number, threshold: number = 30): boolean {
  return !isNaN(rsi) && rsi < threshold;
}

/**
 * Check if RSI indicates overbought condition
 */
export function isRSIOverbought(rsi: number, threshold: number = 70): boolean {
  return !isNaN(rsi) && rsi > threshold;
}

/**
 * Check for MACD bullish crossover
 */
export function isMACDBullishCrossover(macd: MACDResult[], index: number): boolean {
  if (index < 1) return false;

  const current = macd[index];
  const previous = macd[index - 1];

  if (isNaN(current.macd) || isNaN(previous.macd)) return false;

  return (
    current.histogram > 0 &&
    previous.histogram <= 0
  );
}

/**
 * Check for MACD bearish crossover
 */
export function isMACDBearishCrossover(macd: MACDResult[], index: number): boolean {
  if (index < 1) return false;

  const current = macd[index];
  const previous = macd[index - 1];

  if (isNaN(current.macd) || isNaN(previous.macd)) return false;

  return (
    current.histogram < 0 &&
    previous.histogram >= 0
  );
}

/**
 * Calculate volatility (standard deviation of returns)
 */
export function calculateVolatility(prices: number[], period: number = 20): number[] {
  const returns = calculateReturns(prices);
  const result: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(NaN);
      continue;
    }

    const slice = returns.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const volatility = Math.sqrt(variance);

    result.push(volatility);
  }

  return result;
}
