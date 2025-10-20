/**
 * Base Strategy Class
 * Phase 1 - Backtesting Infrastructure
 *
 * Abstract base class that all trading strategies must extend.
 * Provides common functionality for signal generation, position management,
 * and performance tracking.
 */

import { MarketDataOhlcv, OnchainMetric, SocialMetric } from '@prisma/client';
import {
  OHLCV,
  convertPrismaToOHLCV,
  calculateEMAWithTimestamps,
  calculateRSIWithTimestamps,
  calculateATR,
  calculateVWAP,
  calculateVolumeSMA,
  isBullishTrend,
  isRSIOverbought,
  EMAResult,
  RSIResult,
  ATRResult,
  VWAPResult
} from '../utils/technicalIndicators.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StrategyConfig {
  strategyId: string;
  name: string;
  archetype: string;
  timeframe: string;
  symbols: string[]; // Tokens this strategy trades

  // Risk parameters
  positionSizePct: number; // % of capital per trade (e.g., 0.05 = 5%)
  maxPortfolioHeat: number; // Max % of capital at risk (e.g., 0.25 = 25%)
  riskRewardRatio: number; // Target R:R (e.g., 2.5)
  stopLossPct: number; // Stop loss % (e.g., 0.17 = 17% below entry)

  // Holding time limits
  minHoldTimeHours: number;
  maxHoldTimeHours: number;
}

export interface MarketContext {
  ohlcv: OHLCV[];
  onchainMetrics?: OnchainMetric[];
  socialMetrics?: SocialMetric[];
  currentIndex: number; // Current candle index in the backtest
}

export interface SignalStrength {
  score: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface EntrySignal {
  timestamp: Date;
  symbol: string;
  price: number;
  strength: SignalStrength;
  stopLoss: number;
  takeProfit: number;
  positionSize: number; // USD value
  reason: string; // Human-readable entry reason
}

export interface ExitSignal {
  timestamp: Date;
  reason: 'take_profit' | 'stop_loss' | 'max_hold_time' | 'strategy_exit' | 'trailing_stop';
  price: number;
  strength?: SignalStrength;
}

export interface Position {
  symbol: string;
  entryTime: Date;
  entryPrice: number;
  positionSize: number; // Number of tokens
  positionValueUsd: number; // USD value at entry
  stopLoss: number;
  takeProfit: number;
  entryReason: string;
}

// ============================================================================
// BASE STRATEGY CLASS
// ============================================================================

export abstract class BaseStrategy {
  protected config: StrategyConfig;
  protected openPositions: Map<string, Position> = new Map();

  // Cached indicators (populated by subclasses)
  protected ema20: EMAResult[] = [];
  protected ema50: EMAResult[] = [];
  protected rsi14: RSIResult[] = [];
  protected atr14: ATRResult[] = [];
  protected vwap: VWAPResult[] = [];
  protected volumeSMA20: number[] = [];

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  // ========================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ========================================================================

  /**
   * Calculate all technical indicators needed for this strategy
   */
  protected abstract calculateIndicators(ohlcv: OHLCV[]): void;

  /**
   * Check if entry conditions are met
   */
  protected abstract checkEntryConditions(
    context: MarketContext
  ): EntrySignal | null;

  /**
   * Check if exit conditions are met for an open position
   */
  protected abstract checkExitConditions(
    position: Position,
    context: MarketContext
  ): ExitSignal | null;

  /**
   * Calculate position size based on strategy-specific logic
   */
  protected abstract calculatePositionSize(
    signal: EntrySignal,
    availableCapital: number
  ): number;

  // ========================================================================
  // PUBLIC API METHODS
  // ========================================================================

  /**
   * Initialize strategy with historical data
   */
  public initialize(ohlcv: MarketDataOhlcv[]): void {
    const convertedData = convertPrismaToOHLCV(ohlcv);
    this.calculateIndicators(convertedData);
  }

  /**
   * Generate entry signal for a specific candle
   */
  public generateEntrySignal(
    symbol: string,
    ohlcv: MarketDataOhlcv[],
    currentIndex: number,
    onchainMetrics?: OnchainMetric[],
    socialMetrics?: SocialMetric[]
  ): EntrySignal | null {
    // Convert to OHLCV interface
    const convertedData = convertPrismaToOHLCV(ohlcv);

    // Create market context
    const context: MarketContext = {
      ohlcv: convertedData,
      onchainMetrics,
      socialMetrics,
      currentIndex
    };

    // Calculate indicators if not already done
    if (this.ema20.length === 0) {
      this.calculateIndicators(convertedData);
    }

    // Check if we already have an open position for this symbol
    if (this.openPositions.has(symbol)) {
      return null;
    }

    // Check entry conditions
    return this.checkEntryConditions(context);
  }

  /**
   * Generate exit signal for an open position
   */
  public generateExitSignal(
    position: Position,
    ohlcv: MarketDataOhlcv[],
    currentIndex: number,
    onchainMetrics?: OnchainMetric[],
    socialMetrics?: SocialMetric[]
  ): ExitSignal | null {
    const convertedData = convertPrismaToOHLCV(ohlcv);

    const context: MarketContext = {
      ohlcv: convertedData,
      onchainMetrics,
      socialMetrics,
      currentIndex
    };

    return this.checkExitConditions(position, context);
  }

  /**
   * Open a new position
   */
  public openPosition(signal: EntrySignal, availableCapital: number): Position {
    const positionSize = this.calculatePositionSize(signal, availableCapital);

    const position: Position = {
      symbol: signal.symbol,
      entryTime: signal.timestamp,
      entryPrice: signal.price,
      positionSize: positionSize / signal.price, // Convert USD to tokens
      positionValueUsd: positionSize,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      entryReason: signal.reason
    };

    this.openPositions.set(signal.symbol, position);
    return position;
  }

  /**
   * Close a position
   */
  public closePosition(symbol: string): void {
    this.openPositions.delete(symbol);
  }

  /**
   * Get current open positions
   */
  public getOpenPositions(): Position[] {
    return Array.from(this.openPositions.values());
  }

  /**
   * Check if symbol is in open position
   */
  public hasOpenPosition(symbol: string): boolean {
    return this.openPositions.has(symbol);
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Calculate stop loss price
   */
  protected calculateStopLoss(entryPrice: number): number {
    return entryPrice * (1 - this.config.stopLossPct);
  }

  /**
   * Calculate take profit price
   */
  protected calculateTakeProfit(entryPrice: number, stopLoss: number): number {
    const riskAmount = entryPrice - stopLoss;
    return entryPrice + (riskAmount * this.config.riskRewardRatio);
  }

  /**
   * Check if max hold time exceeded
   */
  protected isMaxHoldTimeExceeded(
    entryTime: Date,
    currentTime: Date
  ): boolean {
    const holdTimeHours =
      (currentTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    return holdTimeHours >= this.config.maxHoldTimeHours;
  }

  /**
   * Check if min hold time met
   */
  protected isMinHoldTimeMet(
    entryTime: Date,
    currentTime: Date
  ): boolean {
    const holdTimeHours =
      (currentTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
    return holdTimeHours >= this.config.minHoldTimeHours;
  }

  /**
   * Calculate current unrealized P&L for a position
   */
  protected calculateUnrealizedPnL(
    position: Position,
    currentPrice: number
  ): number {
    const currentValue = position.positionSize * currentPrice;
    return currentValue - position.positionValueUsd;
  }

  /**
   * Calculate current P&L percentage
   */
  protected calculatePnLPct(
    position: Position,
    currentPrice: number
  ): number {
    return (currentPrice - position.entryPrice) / position.entryPrice;
  }

  /**
   * Check if price hit stop loss
   */
  protected isStopLossHit(position: Position, currentPrice: number): boolean {
    return currentPrice <= position.stopLoss;
  }

  /**
   * Check if price hit take profit
   */
  protected isTakeProfitHit(position: Position, currentPrice: number): boolean {
    return currentPrice >= position.takeProfit;
  }

  /**
   * Get indicator value at specific index with validation
   */
  protected getIndicatorValue(
    indicator: any[],
    index: number
  ): number | null {
    if (index < 0 || index >= indicator.length) {
      return null;
    }

    const value = indicator[index];

    // Handle different indicator formats
    if (typeof value === 'object' && value !== null && 'value' in value) {
      return isNaN(value.value) ? null : value.value;
    }

    return typeof value === 'number' && !isNaN(value) ? value : null;
  }

  /**
   * Get config
   */
  public getConfig(): StrategyConfig {
    return this.config;
  }
}
