/**
 * DeFi Derivatives Momentum Strategy
 * Phase 1 - Backtesting Infrastructure
 *
 * Score: 83/100 (Highest performing strategy)
 * Archetype: Swing Trading
 * Timeframe: 4h
 * Target Tokens: SNX, PERP, GMX, LYRA, GNS
 * Win Rate: 71%
 * Risk/Reward: 2.5:1
 * Avg Hold: 4-6 days
 *
 * Entry Conditions:
 * - Protocol trading volume increases >25% week-over-week
 * - Revenue to token holders grows (fees, buybacks)
 * - Price breaks above consolidation range with volume
 * - Open interest on the protocol increases
 * - Social volume rising BEFORE price move (leading indicator)
 *
 * Exit Conditions:
 * - Price reaches 2.5x risk target
 * - Protocol volume begins declining
 * - RSI(14) >75 with bearish divergence
 * - Hold time exceeds 6 days
 * - Stop loss at 0.83x entry (17% below)
 */

import { OnchainMetric, SocialMetric } from '@prisma/client';
import {
  BaseStrategy,
  StrategyConfig,
  MarketContext,
  EntrySignal,
  ExitSignal,
  Position,
  SignalStrength
} from './BaseStrategy.js';
import {
  OHLCV,
  calculateEMAWithTimestamps,
  calculateRSIWithTimestamps,
  calculateATR,
  calculateVWAP,
  calculateVolumeSMA,
  calculateVolumeRatio
} from '../utils/technicalIndicators.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// STRATEGY CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: StrategyConfig = {
  strategyId: '7d2a7645-d0be-4b25-b143-d2409a1ea0e7', // From database
  name: 'DeFi Derivatives Momentum',
  archetype: 'swing_trading',
  timeframe: '4h',
  symbols: ['SNX', 'PERP', 'GMX', 'LYRA', 'GNS'],

  // Risk parameters
  positionSizePct: 0.05, // 5% of capital per trade
  maxPortfolioHeat: 0.25, // Max 25% of capital at risk
  riskRewardRatio: 2.5, // 2.5:1 R:R
  stopLossPct: 0.17, // 17% stop loss (0.83x entry)

  // Holding time limits
  minHoldTimeHours: 12, // Min 12 hours (3 candles at 4h)
  maxHoldTimeHours: 144 // Max 6 days
};

// Strategy-specific thresholds
const VOLUME_INCREASE_THRESHOLD = 0.25; // 25% WoW increase
const RSI_OVERBOUGHT_THRESHOLD = 75;
const RSI_OVERSOLD_THRESHOLD = 30;
const SOCIAL_VOLUME_LEADING_THRESHOLD = 1.5; // 50% above average
const MIN_VOLUME_RATIO = 1.2; // 20% above average volume

// ============================================================================
// DEFI DERIVATIVES MOMENTUM STRATEGY CLASS
// ============================================================================

export class DefiDerivativesMomentumStrategy extends BaseStrategy {
  // Additional indicators specific to this strategy
  private volumeRatio: number[] = [];

  constructor(config?: Partial<StrategyConfig>) {
    super({ ...DEFAULT_CONFIG, ...config });
  }

  // ========================================================================
  // INDICATOR CALCULATION
  // ========================================================================

  protected calculateIndicators(ohlcv: OHLCV[]): void {
    logger.debug('Calculating indicators for DeFi Derivatives Momentum', {
      candles: ohlcv.length
    });

    // Moving averages
    this.ema20 = calculateEMAWithTimestamps(ohlcv, 20, 'close');
    this.ema50 = calculateEMAWithTimestamps(ohlcv, 50, 'close');

    // Momentum
    this.rsi14 = calculateRSIWithTimestamps(ohlcv, 14);

    // Volatility
    this.atr14 = calculateATR(ohlcv, 14);

    // Volume
    this.vwap = calculateVWAP(ohlcv);
    this.volumeSMA20 = calculateVolumeSMA(ohlcv, 20);
    this.volumeRatio = calculateVolumeRatio(ohlcv, 20);

    logger.debug('Indicators calculated successfully', {
      ema20Length: this.ema20.length,
      rsi14Length: this.rsi14.length,
      atr14Length: this.atr14.length
    });
  }

  // ========================================================================
  // ENTRY SIGNAL GENERATION
  // ========================================================================

  protected checkEntryConditions(context: MarketContext): EntrySignal | null {
    const { ohlcv, onchainMetrics, socialMetrics, currentIndex } = context;

    // Need enough data for indicators
    if (currentIndex < 50) {
      return null;
    }

    const currentCandle = ohlcv[currentIndex];
    const currentPrice = currentCandle.close;

    // Build signal strength
    const signalStrength: SignalStrength = {
      score: 0,
      confidence: 'low',
      reasons: []
    };

    // ====================================================================
    // CONDITION 1: Price breakout above consolidation with volume
    // ====================================================================
    const priceBreakout = this.checkPriceBreakout(ohlcv, currentIndex);
    if (priceBreakout.isBreakout) {
      signalStrength.score += 20;
      signalStrength.reasons.push(priceBreakout.reason);
    } else {
      return null; // No entry without breakout
    }

    // ====================================================================
    // CONDITION 2: Volume expansion (>20% above average)
    // ====================================================================
    const volumeExpansion = this.checkVolumeExpansion(currentIndex);
    if (volumeExpansion.hasExpansion) {
      signalStrength.score += 20;
      signalStrength.reasons.push(volumeExpansion.reason);
    } else {
      return null; // No entry without volume
    }

    // ====================================================================
    // CONDITION 3: EMA trend alignment (EMA20 > EMA50)
    // ====================================================================
    const emaTrend = this.checkEMATrend(currentIndex);
    if (emaTrend.isBullish) {
      signalStrength.score += 15;
      signalStrength.reasons.push(emaTrend.reason);
    }

    // ====================================================================
    // CONDITION 4: RSI not overbought
    // ====================================================================
    const rsiValue = this.getIndicatorValue(this.rsi14, currentIndex);
    if (rsiValue && rsiValue < RSI_OVERBOUGHT_THRESHOLD) {
      signalStrength.score += 10;
      signalStrength.reasons.push(`RSI at ${rsiValue.toFixed(1)} (not overbought)`);
    } else {
      // Reduce score if overbought
      signalStrength.score -= 10;
      signalStrength.reasons.push(`RSI at ${rsiValue?.toFixed(1)} (overbought - caution)`);
    }

    // ====================================================================
    // CONDITION 5: On-chain metrics (protocol volume growth)
    // ====================================================================
    if (onchainMetrics && onchainMetrics.length > 0) {
      const volumeGrowth = this.checkProtocolVolumeGrowth(
        onchainMetrics,
        currentCandle.timestamp
      );

      if (volumeGrowth.hasGrowth) {
        signalStrength.score += 20;
        signalStrength.reasons.push(volumeGrowth.reason);
      }
    }

    // ====================================================================
    // CONDITION 6: Social signals (leading indicator)
    // ====================================================================
    if (socialMetrics && socialMetrics.length > 0) {
      const socialSignal = this.checkSocialLeadingIndicator(
        socialMetrics,
        currentCandle.timestamp
      );

      if (socialSignal.isLeading) {
        signalStrength.score += 15;
        signalStrength.reasons.push(socialSignal.reason);
      }
    }

    // ====================================================================
    // EVALUATE SIGNAL STRENGTH
    // ====================================================================

    // Minimum score required: 50
    if (signalStrength.score < 50) {
      logger.debug('Signal strength too weak', {
        score: signalStrength.score,
        threshold: 50
      });
      return null;
    }

    // Set confidence level
    if (signalStrength.score >= 80) {
      signalStrength.confidence = 'high';
    } else if (signalStrength.score >= 60) {
      signalStrength.confidence = 'medium';
    } else {
      signalStrength.confidence = 'low';
    }

    // Calculate stop loss and take profit
    const stopLoss = this.calculateStopLoss(currentPrice);
    const takeProfit = this.calculateTakeProfit(currentPrice, stopLoss);

    // Calculate position size (will be refined in calculatePositionSize)
    const positionSize = this.config.positionSizePct * 10000; // Placeholder

    logger.info('✅ Entry signal generated', {
      strategy: this.config.name,
      price: currentPrice,
      score: signalStrength.score,
      confidence: signalStrength.confidence,
      reasons: signalStrength.reasons.length
    });

    return {
      timestamp: currentCandle.timestamp,
      symbol: 'SYMBOL', // Will be set by caller
      price: currentPrice,
      strength: signalStrength,
      stopLoss,
      takeProfit,
      positionSize,
      reason: signalStrength.reasons.join(' | ')
    };
  }

  // ========================================================================
  // EXIT SIGNAL GENERATION
  // ========================================================================

  protected checkExitConditions(
    position: Position,
    context: MarketContext
  ): ExitSignal | null {
    const { ohlcv, onchainMetrics, currentIndex } = context;
    const currentCandle = ohlcv[currentIndex];
    const currentPrice = currentCandle.close;

    // ====================================================================
    // EXIT 1: Take profit hit
    // ====================================================================
    if (this.isTakeProfitHit(position, currentPrice)) {
      logger.info('🎯 Take profit hit', {
        symbol: position.symbol,
        entryPrice: position.entryPrice,
        currentPrice,
        target: position.takeProfit
      });

      return {
        timestamp: currentCandle.timestamp,
        reason: 'take_profit',
        price: currentPrice
      };
    }

    // ====================================================================
    // EXIT 2: Stop loss hit
    // ====================================================================
    if (this.isStopLossHit(position, currentPrice)) {
      logger.info('🛑 Stop loss hit', {
        symbol: position.symbol,
        entryPrice: position.entryPrice,
        currentPrice,
        stopLoss: position.stopLoss
      });

      return {
        timestamp: currentCandle.timestamp,
        reason: 'stop_loss',
        price: currentPrice
      };
    }

    // ====================================================================
    // EXIT 3: Max hold time exceeded (6 days)
    // ====================================================================
    if (this.isMaxHoldTimeExceeded(position.entryTime, currentCandle.timestamp)) {
      logger.info('⏰ Max hold time exceeded', {
        symbol: position.symbol,
        holdTimeHours:
          (currentCandle.timestamp.getTime() - position.entryTime.getTime()) /
          (1000 * 60 * 60)
      });

      return {
        timestamp: currentCandle.timestamp,
        reason: 'max_hold_time',
        price: currentPrice
      };
    }

    // ====================================================================
    // EXIT 4: RSI overbought with bearish divergence
    // ====================================================================
    const rsiValue = this.getIndicatorValue(this.rsi14, currentIndex);
    if (rsiValue && rsiValue > RSI_OVERBOUGHT_THRESHOLD) {
      // Check if we're profitable and RSI is very high
      const pnlPct = this.calculatePnLPct(position, currentPrice);

      if (pnlPct > 0.15 && rsiValue > 80) {
        // 15% profit and RSI > 80
        logger.info('📈 RSI extreme overbought - taking profits', {
          symbol: position.symbol,
          rsi: rsiValue,
          pnlPct: pnlPct * 100
        });

        return {
          timestamp: currentCandle.timestamp,
          reason: 'strategy_exit',
          price: currentPrice
        };
      }
    }

    // ====================================================================
    // EXIT 5: Protocol volume declining
    // ====================================================================
    if (onchainMetrics && onchainMetrics.length > 0) {
      const volumeDecline = this.checkProtocolVolumeDecline(
        onchainMetrics,
        currentCandle.timestamp
      );

      if (volumeDecline.isDeclining) {
        // Only exit if we're at least breakeven
        const pnlPct = this.calculatePnLPct(position, currentPrice);

        if (pnlPct >= -0.05) {
          // Within 5% of breakeven
          logger.info('📉 Protocol volume declining - exiting', {
            symbol: position.symbol,
            pnlPct: pnlPct * 100
          });

          return {
            timestamp: currentCandle.timestamp,
            reason: 'strategy_exit',
            price: currentPrice
          };
        }
      }
    }

    // No exit signal
    return null;
  }

  // ========================================================================
  // POSITION SIZING
  // ========================================================================

  protected calculatePositionSize(
    signal: EntrySignal,
    availableCapital: number
  ): number {
    // Base position size: 5% of available capital
    let positionSize = availableCapital * this.config.positionSizePct;

    // Adjust based on signal strength
    if (signal.strength.confidence === 'high') {
      positionSize *= 1.2; // Increase by 20%
    } else if (signal.strength.confidence === 'low') {
      positionSize *= 0.8; // Decrease by 20%
    }

    // Ensure we don't exceed max portfolio heat (25%)
    const maxPositionSize = availableCapital * this.config.maxPortfolioHeat;
    positionSize = Math.min(positionSize, maxPositionSize);

    logger.debug('Position size calculated', {
      availableCapital,
      positionSize,
      percentage: (positionSize / availableCapital) * 100
    });

    return positionSize;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Check for price breakout above consolidation
   */
  private checkPriceBreakout(
    ohlcv: OHLCV[],
    currentIndex: number
  ): { isBreakout: boolean; reason: string } {
    const currentPrice = ohlcv[currentIndex].close;
    const ema20Value = this.getIndicatorValue(this.ema20, currentIndex);
    const ema50Value = this.getIndicatorValue(this.ema50, currentIndex);

    if (!ema20Value || !ema50Value) {
      return { isBreakout: false, reason: '' };
    }

    // Price must be above both EMAs
    if (currentPrice > ema20Value && currentPrice > ema50Value) {
      // Check if price recently broke above EMA20
      const prevPrice = ohlcv[currentIndex - 1]?.close;
      const prevEMA20 = this.getIndicatorValue(this.ema20, currentIndex - 1);

      if (prevPrice && prevEMA20 && prevPrice <= prevEMA20) {
        return {
          isBreakout: true,
          reason: 'Price breakout above EMA(20) with support from EMA(50)'
        };
      }

      // Or if price is trending above both EMAs
      if (ema20Value > ema50Value) {
        return {
          isBreakout: true,
          reason: 'Price above EMAs in bullish trend (EMA20 > EMA50)'
        };
      }
    }

    return { isBreakout: false, reason: '' };
  }

  /**
   * Check for volume expansion
   */
  private checkVolumeExpansion(
    currentIndex: number
  ): { hasExpansion: boolean; reason: string } {
    const volumeRatioValue = this.volumeRatio[currentIndex];

    if (volumeRatioValue && volumeRatioValue >= MIN_VOLUME_RATIO) {
      return {
        hasExpansion: true,
        reason: `Volume ${(volumeRatioValue * 100 - 100).toFixed(0)}% above average`
      };
    }

    return { hasExpansion: false, reason: '' };
  }

  /**
   * Check EMA trend
   */
  private checkEMATrend(
    currentIndex: number
  ): { isBullish: boolean; reason: string } {
    const ema20Value = this.getIndicatorValue(this.ema20, currentIndex);
    const ema50Value = this.getIndicatorValue(this.ema50, currentIndex);

    if (ema20Value && ema50Value && ema20Value > ema50Value) {
      return {
        isBullish: true,
        reason: 'Bullish trend: EMA(20) > EMA(50)'
      };
    }

    return { isBullish: false, reason: '' };
  }

  /**
   * Check protocol volume growth from on-chain metrics
   */
  private checkProtocolVolumeGrowth(
    onchainMetrics: OnchainMetric[],
    currentTime: Date
  ): { hasGrowth: boolean; reason: string } {
    // Find metrics within last 7 days
    const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(currentTime.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentMetrics = onchainMetrics.filter(
      m => m.timestamp >= sevenDaysAgo && m.timestamp <= currentTime
    );

    const previousMetrics = onchainMetrics.filter(
      m => m.timestamp >= fourteenDaysAgo && m.timestamp < sevenDaysAgo
    );

    if (recentMetrics.length === 0 || previousMetrics.length === 0) {
      return { hasGrowth: false, reason: '' };
    }

    // Calculate average volumes
    const recentAvgVolume =
      recentMetrics.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      recentMetrics.length;

    const previousAvgVolume =
      previousMetrics.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      previousMetrics.length;

    // Check for >25% growth
    const growthPct = (recentAvgVolume - previousAvgVolume) / previousAvgVolume;

    if (growthPct >= VOLUME_INCREASE_THRESHOLD) {
      return {
        hasGrowth: true,
        reason: `Protocol volume up ${(growthPct * 100).toFixed(0)}% WoW`
      };
    }

    return { hasGrowth: false, reason: '' };
  }

  /**
   * Check for declining protocol volume (exit condition)
   */
  private checkProtocolVolumeDecline(
    onchainMetrics: OnchainMetric[],
    currentTime: Date
  ): { isDeclining: boolean } {
    // Similar to growth check, but looking for decline
    const threeDaysAgo = new Date(currentTime.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(currentTime.getTime() - 6 * 24 * 60 * 60 * 1000);

    const recentMetrics = onchainMetrics.filter(
      m => m.timestamp >= threeDaysAgo && m.timestamp <= currentTime
    );

    const previousMetrics = onchainMetrics.filter(
      m => m.timestamp >= sixDaysAgo && m.timestamp < threeDaysAgo
    );

    if (recentMetrics.length === 0 || previousMetrics.length === 0) {
      return { isDeclining: false };
    }

    const recentAvgVolume =
      recentMetrics.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      recentMetrics.length;

    const previousAvgVolume =
      previousMetrics.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      previousMetrics.length;

    // Decline of >15%
    const declinePct = (previousAvgVolume - recentAvgVolume) / previousAvgVolume;

    return { isDeclining: declinePct > 0.15 };
  }

  /**
   * Check social volume leading indicator
   */
  private checkSocialLeadingIndicator(
    socialMetrics: SocialMetric[],
    currentTime: Date
  ): { isLeading: boolean; reason: string } {
    // Find recent social volume
    const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSocial = socialMetrics.filter(
      m => m.timestamp >= twentyFourHoursAgo && m.timestamp <= currentTime
    );

    const previousSocial = socialMetrics.filter(
      m => m.timestamp >= sevenDaysAgo && m.timestamp < twentyFourHoursAgo
    );

    if (recentSocial.length === 0 || previousSocial.length === 0) {
      return { isLeading: false, reason: '' };
    }

    // Calculate average social volume
    const recentAvgSocial =
      recentSocial.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      recentSocial.length;

    const previousAvgSocial =
      previousSocial.reduce((sum, m) => sum + parseFloat(m.value.toString()), 0) /
      previousSocial.length;

    // Check if social volume is increasing (leading indicator)
    const socialRatio = recentAvgSocial / previousAvgSocial;

    if (socialRatio >= SOCIAL_VOLUME_LEADING_THRESHOLD) {
      return {
        isLeading: true,
        reason: `Social volume up ${((socialRatio - 1) * 100).toFixed(0)}% (leading indicator)`
      };
    }

    return { isLeading: false, reason: '' };
  }
}
