/**
 * Token Unlock Front-Running Strategy
 *
 * Strategy: Buy tokens 24 hours before large unlock events
 * Backtest Results: +0.51% return, 51% win rate, 1.04 profit factor
 *
 * Entry Criteria:
 * - Large unlock event scheduled (>5% of circulating supply)
 * - 24 hours before unlock
 * - Token has sufficient liquidity (>$1M daily volume)
 * - Price not in extreme downtrend (>-20% in 7 days)
 *
 * Exit Criteria:
 * - Stop Loss: -3% from entry
 * - Take Profit: +5% from entry
 * - Time-based: 48 hours after unlock event
 */

import { MarketDataUpdate } from '../services/marketDataStreamer';
import { TradingSignal } from '../services/strategyExecutor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TokenUnlockEvent {
  tokenSymbol: string;
  unlockDate: Date;
  unlockAmount: number;
  percentOfSupply: number;
  circulatingSupply: number;
  tokenName: string;
  source: string;
}

export interface TokenUnlockConfig {
  minUnlockPercent: number; // Minimum unlock % of supply to trade (default: 5%)
  entryHoursBefore: number; // Hours before unlock to enter (default: 24)
  exitHoursAfter: number; // Hours after unlock to force exit (default: 48)
  stopLossPercent: number; // Stop loss % (default: -3%)
  takeProfitPercent: number; // Take profit % (default: +5%)
  minDailyVolume: number; // Minimum daily volume USD (default: $1M)
  maxPriceDecline7d: number; // Max 7-day price decline % (default: -20%)
  positionSizePercent: number; // Position size as % of capital (default: 10%)
}

export class TokenUnlockStrategy {
  private config: TokenUnlockConfig;
  private activeUnlocks: Map<string, TokenUnlockEvent> = new Map();
  private monitoredPositions: Map<string, { entryPrice: number; entryTime: Date; unlockEvent: TokenUnlockEvent }> = new Map();

  constructor(config?: Partial<TokenUnlockConfig>) {
    this.config = {
      minUnlockPercent: config?.minUnlockPercent || 5,
      entryHoursBefore: config?.entryHoursBefore || 24,
      exitHoursAfter: config?.exitHoursAfter || 48,
      stopLossPercent: config?.stopLossPercent || -3,
      takeProfitPercent: config?.takeProfitPercent || 5,
      minDailyVolume: config?.minDailyVolume || 1_000_000,
      maxPriceDecline7d: config?.maxPriceDecline7d || -20,
      positionSizePercent: config?.positionSizePercent || 10,
    };
  }

  /**
   * Initialize strategy - load upcoming unlock events
   */
  async initialize(): Promise<void> {
    console.log('🔓 Initializing Token Unlock Front-Running Strategy...');

    // Load upcoming unlock events from database
    const upcomingUnlocks = await this.loadUpcomingUnlocks();

    for (const unlock of upcomingUnlocks) {
      this.activeUnlocks.set(unlock.tokenSymbol, unlock);
    }

    console.log(`✅ Loaded ${upcomingUnlocks.length} upcoming unlock events`);
    this.logActiveUnlocks();
  }

  /**
   * Generate trading signal based on market data update
   */
  async generateSignal(
    strategyId: string,
    update: MarketDataUpdate
  ): Promise<TradingSignal | null> {
    const { symbol, data } = update;

    // Check if we have an unlock event for this token
    const unlockEvent = this.activeUnlocks.get(symbol);
    if (!unlockEvent) {
      return null; // No unlock event scheduled
    }

    // Check if we're already in a position
    const existingPosition = this.monitoredPositions.get(symbol);
    if (existingPosition) {
      return this.generateExitSignal(strategyId, symbol, update, existingPosition);
    }

    // Check entry criteria
    return this.generateEntrySignal(strategyId, symbol, update, unlockEvent);
  }

  /**
   * Generate entry signal - buy before unlock
   */
  private async generateEntrySignal(
    strategyId: string,
    symbol: string,
    update: MarketDataUpdate,
    unlockEvent: TokenUnlockEvent
  ): Promise<TradingSignal | null> {
    const ticker = update.data as any; // Ticker data
    const now = new Date();
    const hoursUntilUnlock = (unlockEvent.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Entry timing check: Enter 24 hours before unlock (±2 hour window)
    const entryWindowStart = this.config.entryHoursBefore + 2;
    const entryWindowEnd = this.config.entryHoursBefore - 2;

    if (hoursUntilUnlock > entryWindowStart || hoursUntilUnlock < entryWindowEnd) {
      return null; // Outside entry window
    }

    // Check unlock size threshold
    if (unlockEvent.percentOfSupply < this.config.minUnlockPercent) {
      console.log(`⚠️  ${symbol}: Unlock too small (${unlockEvent.percentOfSupply.toFixed(2)}% < ${this.config.minUnlockPercent}%)`);
      return null;
    }

    // Check liquidity
    const dailyVolume = ticker.baseVolume * ticker.last; // Approximate daily volume in USD
    if (dailyVolume < this.config.minDailyVolume) {
      console.log(`⚠️  ${symbol}: Insufficient liquidity ($${(dailyVolume / 1e6).toFixed(2)}M < $${this.config.minDailyVolume / 1e6}M)`);
      return null;
    }

    // Check 7-day price trend
    const priceChange7d = await this.getPriceChange7d(symbol);
    if (priceChange7d !== null && priceChange7d < this.config.maxPriceDecline7d) {
      console.log(`⚠️  ${symbol}: Price decline too steep (${priceChange7d.toFixed(2)}% < ${this.config.maxPriceDecline7d}%)`);
      return null;
    }

    // All criteria met - generate BUY signal
    const entryPrice = ticker.last;
    const stopLoss = entryPrice * (1 + this.config.stopLossPercent / 100);
    const takeProfit = entryPrice * (1 + this.config.takeProfitPercent / 100);

    console.log(`🎯 TOKEN UNLOCK ENTRY SIGNAL: ${symbol}`);
    console.log(`   Unlock: ${unlockEvent.unlockDate.toISOString()}`);
    console.log(`   Hours until unlock: ${hoursUntilUnlock.toFixed(1)}h`);
    console.log(`   Unlock size: ${unlockEvent.percentOfSupply.toFixed(2)}% of supply`);
    console.log(`   Entry price: $${entryPrice.toFixed(6)}`);
    console.log(`   Stop loss: $${stopLoss.toFixed(6)} (${this.config.stopLossPercent}%)`);
    console.log(`   Take profit: $${takeProfit.toFixed(6)} (+${this.config.takeProfitPercent}%)`);

    return {
      strategyId,
      symbol,
      action: 'buy',
      strength: this.calculateSignalStrength(unlockEvent, hoursUntilUnlock),
      entryPrice,
      stopLoss,
      takeProfit,
      positionSize: this.config.positionSizePercent / 100,
      reasoning: `Token Unlock Front-Run: ${unlockEvent.percentOfSupply.toFixed(2)}% unlock in ${hoursUntilUnlock.toFixed(1)}h`,
      metadata: {
        unlockDate: unlockEvent.unlockDate,
        unlockPercent: unlockEvent.percentOfSupply,
        unlockAmount: unlockEvent.unlockAmount,
        entryHoursBefore: hoursUntilUnlock,
      },
    };
  }

  /**
   * Generate exit signal - monitor position
   */
  private async generateExitSignal(
    strategyId: string,
    symbol: string,
    update: MarketDataUpdate,
    position: { entryPrice: number; entryTime: Date; unlockEvent: TokenUnlockEvent }
  ): Promise<TradingSignal | null> {
    const ticker = update.data as any;
    const currentPrice = ticker.last;
    const now = new Date();

    // Calculate time since entry
    const hoursSinceEntry = (now.getTime() - position.entryTime.getTime()) / (1000 * 60 * 60);
    const hoursAfterUnlock = (now.getTime() - position.unlockEvent.unlockDate.getTime()) / (1000 * 60 * 60);

    // Time-based exit: 48 hours after unlock
    if (hoursAfterUnlock > this.config.exitHoursAfter) {
      console.log(`⏰ TIME EXIT: ${symbol} - ${hoursAfterUnlock.toFixed(1)}h after unlock`);
      return {
        strategyId,
        symbol,
        action: 'sell',
        strength: 1.0,
        entryPrice: currentPrice,
        reasoning: `Time-based exit: ${hoursAfterUnlock.toFixed(1)}h after unlock`,
        metadata: {
          exitReason: 'time_based',
          hoursAfterUnlock,
          pnlPercent: ((currentPrice - position.entryPrice) / position.entryPrice) * 100,
        },
      };
    }

    // Stop-loss check (handled by PositionManager, but log here)
    const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    if (pnlPercent <= this.config.stopLossPercent) {
      console.log(`🛑 STOP LOSS APPROACHING: ${symbol} - ${pnlPercent.toFixed(2)}%`);
    }

    // Take-profit check (handled by PositionManager, but log here)
    if (pnlPercent >= this.config.takeProfitPercent) {
      console.log(`💰 TAKE PROFIT APPROACHING: ${symbol} - ${pnlPercent.toFixed(2)}%`);
    }

    return null; // Let PositionManager handle SL/TP
  }

  /**
   * Calculate signal strength (0-1) based on unlock characteristics
   */
  private calculateSignalStrength(unlockEvent: TokenUnlockEvent, hoursUntilUnlock: number): number {
    let strength = 0.5; // Base strength

    // Larger unlocks = stronger signal (up to +0.3)
    const unlockFactor = Math.min(unlockEvent.percentOfSupply / 20, 1); // Max at 20%
    strength += unlockFactor * 0.3;

    // Optimal timing = stronger signal (up to +0.2)
    const timingDeviation = Math.abs(hoursUntilUnlock - this.config.entryHoursBefore);
    const timingFactor = 1 - Math.min(timingDeviation / 12, 1); // Max deviation 12h
    strength += timingFactor * 0.2;

    return Math.min(Math.max(strength, 0), 1); // Clamp to [0, 1]
  }

  /**
   * Track position entry
   */
  onPositionOpened(symbol: string, entryPrice: number): void {
    const unlockEvent = this.activeUnlocks.get(symbol);
    if (unlockEvent) {
      this.monitoredPositions.set(symbol, {
        entryPrice,
        entryTime: new Date(),
        unlockEvent,
      });
      console.log(`✅ Position tracked: ${symbol} @ $${entryPrice.toFixed(6)}`);
    }
  }

  /**
   * Track position exit
   */
  onPositionClosed(symbol: string): void {
    this.monitoredPositions.delete(symbol);
    console.log(`✅ Position untracked: ${symbol}`);
  }

  /**
   * Load upcoming unlock events from database
   */
  private async loadUpcomingUnlocks(): Promise<TokenUnlockEvent[]> {
    // Query TokenUnlockSchedule table for upcoming unlocks
    const now = new Date();
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Next 30 days

    const unlocks = await prisma.tokenUnlockSchedule.findMany({
      where: {
        unlockDate: {
          gte: now,
          lte: maxDate,
        },
        percentOfSupply: {
          gte: this.config.minUnlockPercent,
        },
      },
      include: {
        token: true,
      },
      orderBy: {
        unlockDate: 'asc',
      },
    });

    return unlocks.map((unlock) => ({
      tokenSymbol: unlock.token.symbol,
      unlockDate: unlock.unlockDate,
      unlockAmount: unlock.unlockAmount.toNumber(),
      percentOfSupply: unlock.percentOfSupply.toNumber(),
      circulatingSupply: unlock.circulatingSupply.toNumber(),
      tokenName: unlock.token.name,
      source: unlock.source,
    }));
  }

  /**
   * Get 7-day price change for a token
   */
  private async getPriceChange7d(symbol: string): Promise<number | null> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const priceData = await prisma.priceData.findMany({
        where: {
          token: { symbol },
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 1, // Oldest price
      });

      const latestPrice = await prisma.priceData.findFirst({
        where: {
          token: { symbol },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1,
      });

      if (priceData.length === 0 || !latestPrice) {
        return null;
      }

      const oldPrice = priceData[0].close.toNumber();
      const newPrice = latestPrice.close.toNumber();

      return ((newPrice - oldPrice) / oldPrice) * 100;
    } catch (error) {
      console.error(`Failed to get 7d price change for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Log active unlock events
   */
  private logActiveUnlocks(): void {
    if (this.activeUnlocks.size === 0) {
      console.log('⚠️  No upcoming unlock events found');
      return;
    }

    console.log('\n📅 Upcoming Token Unlock Events:');
    console.log('═'.repeat(80));

    const sortedUnlocks = Array.from(this.activeUnlocks.values()).sort(
      (a, b) => a.unlockDate.getTime() - b.unlockDate.getTime()
    );

    for (const unlock of sortedUnlocks) {
      const now = new Date();
      const hoursUntil = (unlock.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const daysUntil = hoursUntil / 24;

      console.log(`${unlock.tokenSymbol.padEnd(10)} | ${unlock.unlockDate.toISOString().split('T')[0]} (${daysUntil.toFixed(1)}d) | ${unlock.percentOfSupply.toFixed(2)}% unlock`);
    }

    console.log('═'.repeat(80) + '\n');
  }

  /**
   * Get configuration
   */
  getConfig(): TokenUnlockConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TokenUnlockConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Token Unlock strategy config updated:', this.config);
  }
}
