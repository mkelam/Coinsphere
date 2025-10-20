/**
 * Backtest Execution Engine
 * Phase 1 - Backtesting Infrastructure
 *
 * Orchestrates the entire backtesting process:
 * 1. Load historical data
 * 2. Initialize strategy
 * 3. Simulate trading day-by-day
 * 4. Track performance metrics
 * 5. Generate results
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { BaseStrategy } from '../strategies/BaseStrategy.js';
import { DefiDerivativesMomentumStrategy } from '../strategies/DefiDerivativesMomentumStrategy.js';
import { PositionManager, PositionManagerConfig } from './positionManager.js';
import { MarketDataOhlcv, OnchainMetric, SocialMetric } from '@prisma/client';
import { calculatePerformanceMetrics, PerformanceMetrics } from '../utils/performanceMetrics.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BacktestConfig {
  strategyId: string;
  strategyName: string;
  symbols: string[];
  startDate: Date;
  endDate: Date;
  timeframe: string;
  initialCapital: number;

  // Position sizing
  positionSizePct: number; // % of capital per trade
  maxPortfolioHeat: number; // Max % at risk
  maxPositions: number;

  // Costs
  makerFee: number;
  takerFee: number;
  slippagePct: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  performance: {
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    totalReturnPct: number;
    maxDrawdown: number;
    maxDrawdownPct: number;
    peakValue: number;
  };
  trades: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgPnL: number;
    avgWinner: number;
    avgLoser: number;
    largestWin: number;
    largestLoss: number;
    profitFactor: number;
    avgHoldTimeHours: number;
  };
  metrics: PerformanceMetrics;
  equity: Array<{
    timestamp: Date;
    value: number;
    drawdown: number;
  }>;
  executionTime: number; // milliseconds
}

// ============================================================================
// BACKTEST ENGINE CLASS
// ============================================================================

export class BacktestEngine {
  private strategy: BaseStrategy;
  private positionManager: PositionManager;
  private config: BacktestConfig;

  constructor(config: BacktestConfig) {
    this.config = config;

    // Initialize position manager
    const pmConfig: PositionManagerConfig = {
      initialCapital: config.initialCapital,
      maxPortfolioHeat: config.maxPortfolioHeat,
      maxPositionsCount: config.maxPositions,
      makerFee: config.makerFee,
      takerFee: config.takerFee,
      slippagePct: config.slippagePct
    };

    this.positionManager = new PositionManager(pmConfig);

    // Initialize strategy
    this.strategy = this.createStrategy(config.strategyId);

    logger.info('Backtest Engine initialized', {
      strategy: config.strategyName,
      symbols: config.symbols,
      period: `${config.startDate.toISOString().split('T')[0]} to ${config.endDate.toISOString().split('T')[0]}`,
      initialCapital: config.initialCapital
    });
  }

  // ========================================================================
  // MAIN EXECUTION
  // ========================================================================

  /**
   * Run the backtest
   */
  public async run(): Promise<BacktestResult> {
    const startTime = Date.now();

    logger.info('🚀 Starting backtest execution', {
      strategy: this.config.strategyName,
      period: `${this.config.startDate.toISOString().split('T')[0]} to ${this.config.endDate.toISOString().split('T')[0]}`
    });

    try {
      // Load historical data for all symbols
      const marketData = await this.loadMarketData();

      if (marketData.length === 0) {
        throw new Error('No market data available for backtest period');
      }

      logger.info('Market data loaded', {
        candles: marketData.length,
        symbols: this.config.symbols.length
      });

      // Run simulation
      const equityCurve = await this.simulate(marketData);

      // Calculate final metrics
      const performance = this.positionManager.getPerformanceSummary();
      const tradeStats = this.positionManager.getTradeStatistics();
      const closedTrades = this.positionManager.getClosedTrades();

      // Calculate advanced performance metrics
      const advancedMetrics = calculatePerformanceMetrics(
        closedTrades,
        equityCurve,
        this.config.initialCapital
      );

      const executionTime = Date.now() - startTime;

      logger.info('✅ Backtest completed', {
        trades: tradeStats.totalTrades,
        winRate: (tradeStats.winRate * 100).toFixed(1) + '%',
        totalReturn: (performance.totalReturnPct * 100).toFixed(2) + '%',
        sharpeRatio: advancedMetrics.sharpeRatio?.toFixed(2) || 'N/A',
        sortinoRatio: advancedMetrics.sortinoRatio?.toFixed(2) || 'N/A',
        executionTime: executionTime + 'ms'
      });

      return {
        config: this.config,
        performance: {
          initialCapital: performance.initialCapital,
          finalCapital: performance.currentCapital,
          totalReturn: performance.totalReturn,
          totalReturnPct: performance.totalReturnPct,
          maxDrawdown: performance.maxDrawdown,
          maxDrawdownPct: performance.maxDrawdownPct,
          peakValue: performance.peakValue
        },
        trades: tradeStats,
        metrics: advancedMetrics,
        equity: equityCurve,
        executionTime
      };

    } catch (error: any) {
      logger.error('❌ Backtest failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // ========================================================================
  // SIMULATION
  // ========================================================================

  /**
   * Simulate trading day by day
   */
  private async simulate(
    marketData: Map<string, MarketDataOhlcv[]>
  ): Promise<Array<{ timestamp: Date; value: number; drawdown: number }>> {
    const equityCurve: Array<{ timestamp: Date; value: number; drawdown: number }> = [];

    // Get the symbol with most data points to use as time reference
    const referenceSymbol = this.config.symbols[0];
    const referenceData = marketData.get(referenceSymbol);

    if (!referenceData) {
      throw new Error(`No data for reference symbol ${referenceSymbol}`);
    }

    logger.info('Starting simulation', {
      candles: referenceData.length,
      symbols: this.config.symbols.length
    });

    // Initialize strategy with first symbol's data (for indicator calculation)
    this.strategy.initialize(referenceData);

    // Iterate through each time period
    for (let i = 0; i < referenceData.length; i++) {
      const currentTime = referenceData[i].timestamp;
      const currentPrices = new Map<string, number>();

      // Collect current prices for all symbols
      for (const symbol of this.config.symbols) {
        const symbolData = marketData.get(symbol);
        if (symbolData && symbolData[i]) {
          currentPrices.set(symbol, parseFloat(symbolData[i].close.toString()));
        }
      }

      // Check exit signals for open positions
      await this.checkExits(marketData, i, currentTime);

      // Check entry signals for new positions
      await this.checkEntries(marketData, i, currentTime);

      // Record portfolio state
      const portfolioState = this.positionManager.getPortfolioState(
        currentPrices,
        currentTime
      );

      equityCurve.push({
        timestamp: currentTime,
        value: portfolioState.totalCapital,
        drawdown: portfolioState.drawdownPct
      });

      // Log progress every 100 candles
      if ((i + 1) % 100 === 0) {
        logger.debug('Simulation progress', {
          candle: i + 1,
          total: referenceData.length,
          progress: ((i + 1) / referenceData.length * 100).toFixed(1) + '%',
          capital: portfolioState.totalCapital.toFixed(2),
          openPositions: portfolioState.openPositions.length
        });
      }
    }

    // Close any remaining open positions at the end
    await this.closeAllPositions(marketData, referenceData.length - 1);

    return equityCurve;
  }

  /**
   * Check for entry signals
   */
  private async checkEntries(
    marketData: Map<string, MarketDataOhlcv[]>,
    currentIndex: number,
    currentTime: Date
  ): Promise<void> {
    // Check each symbol for entry opportunities
    for (const symbol of this.config.symbols) {
      // Skip if already have position
      if (this.positionManager.hasPosition(symbol)) {
        continue;
      }

      const symbolData = marketData.get(symbol);
      if (!symbolData || currentIndex >= symbolData.length) {
        continue;
      }

      // Get data up to current point (avoid look-ahead bias)
      const historicalData = symbolData.slice(0, currentIndex + 1);

      // Generate entry signal
      const signal = this.strategy.generateEntrySignal(
        symbol,
        historicalData,
        currentIndex,
        undefined, // No on-chain data for now
        undefined  // No social data for now
      );

      if (!signal) {
        continue;
      }

      // Check if we can open position
      const availableCash = this.positionManager.getAvailableBuyingPower();
      const positionSize = availableCash * this.config.positionSizePct;

      const canOpen = this.positionManager.canOpenPosition(positionSize);

      if (!canOpen.canOpen) {
        logger.debug('Cannot open position', {
          symbol,
          reason: canOpen.reason
        });
        continue;
      }

      // Open position
      const result = this.positionManager.openPosition(
        symbol,
        signal.price,
        positionSize,
        currentTime,
        signal.stopLoss,
        signal.takeProfit,
        signal.reason
      );

      if (result.success && result.position) {
        logger.info('📈 ENTRY', {
          symbol,
          price: signal.price.toFixed(4),
          size: positionSize.toFixed(2),
          stopLoss: signal.stopLoss.toFixed(4),
          takeProfit: signal.takeProfit.toFixed(4),
          confidence: signal.strength.confidence,
          score: signal.strength.score
        });
      }
    }
  }

  /**
   * Check for exit signals
   */
  private async checkExits(
    marketData: Map<string, MarketDataOhlcv[]>,
    currentIndex: number,
    currentTime: Date
  ): Promise<void> {
    const openPositions = this.positionManager.getOpenPositions();

    for (const position of openPositions) {
      const symbolData = marketData.get(position.symbol);
      if (!symbolData || currentIndex >= symbolData.length) {
        continue;
      }

      const currentCandle = symbolData[currentIndex];
      const currentPrice = parseFloat(currentCandle.close.toString());

      // Check stop loss
      if (currentPrice <= position.stopLoss) {
        const result = this.positionManager.closePosition(
          position.symbol,
          position.stopLoss, // Use stop loss price
          currentTime,
          'stop_loss'
        );

        if (result.success && result.trade) {
          logger.info('🛑 EXIT (Stop Loss)', {
            symbol: position.symbol,
            entryPrice: position.entryPrice.toFixed(4),
            exitPrice: position.stopLoss.toFixed(4),
            pnl: result.trade.pnlUsd.toFixed(2),
            pnlPct: (result.trade.pnlPct * 100).toFixed(2) + '%'
          });
        }
        continue;
      }

      // Check take profit
      if (currentPrice >= position.takeProfit) {
        const result = this.positionManager.closePosition(
          position.symbol,
          position.takeProfit, // Use take profit price
          currentTime,
          'take_profit'
        );

        if (result.success && result.trade) {
          logger.info('🎯 EXIT (Take Profit)', {
            symbol: position.symbol,
            entryPrice: position.entryPrice.toFixed(4),
            exitPrice: position.takeProfit.toFixed(4),
            pnl: result.trade.pnlUsd.toFixed(2),
            pnlPct: (result.trade.pnlPct * 100).toFixed(2) + '%'
          });
        }
        continue;
      }

      // Get historical data up to current point
      const historicalData = symbolData.slice(0, currentIndex + 1);

      // Check strategy exit signal
      const exitSignal = this.strategy.generateExitSignal(
        position,
        historicalData,
        currentIndex,
        undefined,
        undefined
      );

      if (exitSignal) {
        const result = this.positionManager.closePosition(
          position.symbol,
          exitSignal.price,
          currentTime,
          exitSignal.reason
        );

        if (result.success && result.trade) {
          logger.info('📉 EXIT (Strategy)', {
            symbol: position.symbol,
            reason: exitSignal.reason,
            entryPrice: position.entryPrice.toFixed(4),
            exitPrice: exitSignal.price.toFixed(4),
            pnl: result.trade.pnlUsd.toFixed(2),
            pnlPct: (result.trade.pnlPct * 100).toFixed(2) + '%'
          });
        }
      }
    }
  }

  /**
   * Close all open positions at end of backtest
   */
  private async closeAllPositions(
    marketData: Map<string, MarketDataOhlcv[]>,
    finalIndex: number
  ): Promise<void> {
    const openPositions = this.positionManager.getOpenPositions();

    for (const position of openPositions) {
      const symbolData = marketData.get(position.symbol);
      if (!symbolData) continue;

      const finalCandle = symbolData[finalIndex];
      const finalPrice = parseFloat(finalCandle.close.toString());

      const result = this.positionManager.closePosition(
        position.symbol,
        finalPrice,
        finalCandle.timestamp,
        'max_hold_time'
      );

      if (result.success && result.trade) {
        logger.info('⏰ EXIT (Backtest End)', {
          symbol: position.symbol,
          entryPrice: position.entryPrice.toFixed(4),
          exitPrice: finalPrice.toFixed(4),
          pnl: result.trade.pnlUsd.toFixed(2)
        });
      }
    }
  }

  // ========================================================================
  // DATA LOADING
  // ========================================================================

  /**
   * Load historical market data for all symbols
   */
  private async loadMarketData(): Promise<Map<string, MarketDataOhlcv[]>> {
    const marketData = new Map<string, MarketDataOhlcv[]>();

    for (const symbol of this.config.symbols) {
      logger.debug('Loading market data', { symbol });

      const data = await prisma.marketDataOhlcv.findMany({
        where: {
          symbol,
          timeframe: this.config.timeframe,
          timestamp: {
            gte: this.config.startDate,
            lte: this.config.endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      if (data.length === 0) {
        logger.warn('No data found for symbol', { symbol });
        continue;
      }

      marketData.set(symbol, data);

      logger.debug('Market data loaded', {
        symbol,
        candles: data.length,
        from: data[0].timestamp.toISOString().split('T')[0],
        to: data[data.length - 1].timestamp.toISOString().split('T')[0]
      });
    }

    return marketData;
  }

  // ========================================================================
  // STRATEGY FACTORY
  // ========================================================================

  /**
   * Create strategy instance based on ID
   */
  private createStrategy(strategyId: string): BaseStrategy {
    // For now, we only have one strategy implemented
    // In the future, this will be a factory that creates different strategies
    return new DefiDerivativesMomentumStrategy({
      strategyId,
      name: this.config.strategyName,
      symbols: this.config.symbols,
      timeframe: this.config.timeframe,
      positionSizePct: this.config.positionSizePct,
      maxPortfolioHeat: this.config.maxPortfolioHeat,
      riskRewardRatio: 2.5,
      stopLossPct: 0.17,
      minHoldTimeHours: 12,
      maxHoldTimeHours: 144
    });
  }

  // ========================================================================
  // DATABASE PERSISTENCE
  // ========================================================================

  /**
   * Save backtest results to database
   */
  public async saveResults(result: BacktestResult): Promise<string> {
    logger.info('💾 Saving backtest results to database');

    try {
      // Create backtest config record with all advanced metrics
      const backtestConfig = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO backtest_configs (
          id, strategy_id, name, description,
          start_date, end_date, timeframe,
          initial_capital, position_size_pct, max_portfolio_heat, max_drawdown_limit,
          maker_fee, taker_fee, slippage_pct, latency_ms,
          status, total_return_pct,

          -- Risk-adjusted metrics
          sharpe_ratio, sortino_ratio, calmar_ratio, ulcer_index,

          -- Position sizing & expectancy
          kelly_criterion, expectancy, payoff_ratio,

          -- Drawdown metrics
          max_drawdown_pct, avg_drawdown_pct, max_drawdown_duration,

          -- Trade quality
          profit_factor, recovery_factor,

          -- Consistency
          consecutive_wins, consecutive_losses, win_streak_avg, lose_streak_avg,

          total_trades, win_rate,
          started_at, completed_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${this.config.strategyId}::uuid,
          ${`Backtest - ${this.config.strategyName} - ${new Date().toISOString().split('T')[0]}`},
          ${`Backtest of ${this.config.strategyName} strategy on ${this.config.symbols.join(', ')} from ${this.config.startDate.toISOString().split('T')[0]} to ${this.config.endDate.toISOString().split('T')[0]}`},
          ${this.config.startDate},
          ${this.config.endDate},
          ${this.config.timeframe},
          ${this.config.initialCapital},
          ${this.config.positionSizePct},
          ${this.config.maxPortfolioHeat},
          ${0.20},
          ${this.config.makerFee},
          ${this.config.takerFee},
          ${this.config.slippagePct},
          ${100},
          'completed',
          ${result.performance.totalReturnPct},

          -- Risk-adjusted metrics
          ${result.metrics.sharpeRatio},
          ${result.metrics.sortinoRatio},
          ${result.metrics.calmarRatio},
          ${result.metrics.ulcerIndex},

          -- Position sizing & expectancy
          ${result.metrics.kellyCriterion},
          ${result.metrics.expectancy},
          ${result.metrics.payoffRatio},

          -- Drawdown metrics
          ${result.performance.maxDrawdownPct},
          ${result.metrics.avgDrawdownPct},
          ${result.metrics.maxDrawdownDuration},

          -- Trade quality
          ${result.trades.profitFactor},
          ${result.metrics.recoveryFactor},

          -- Consistency
          ${result.metrics.consecutiveWins},
          ${result.metrics.consecutiveLosses},
          ${result.metrics.winStreakAvg},
          ${result.metrics.loseStreakAvg},

          ${result.trades.totalTrades},
          ${result.trades.winRate},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING id
      `;

      const backtestId = backtestConfig[0].id;

      // Save all trades
      const closedTrades = this.positionManager.getClosedTrades();

      for (let i = 0; i < closedTrades.length; i++) {
        const trade = closedTrades[i];

        // Ensure all required fields are present
        if (!trade.positionSize || !trade.entryValue) {
          logger.warn('Skipping trade with missing required fields', {
            symbol: trade.symbol,
            positionSize: trade.positionSize,
            entryValue: trade.entryValue
          });
          continue;
        }

        // Using Prisma create for better type safety
        await prisma.backtestTrade.create({
          data: {
            backtestId: backtestId,
            tradeNumber: i + 1,
            symbol: trade.symbol,
            entryTime: trade.entryTime,
            entryPrice: trade.entryPrice,
            entryReason: 'strategy_signal', // Default value since not tracked in TradeResult
            positionSize: trade.positionSize,
            positionValueUsd: trade.entryValue,
            exitTime: trade.exitTime,
            exitPrice: trade.exitPrice,
            exitReason: trade.exitReason,
            pnlUsd: trade.pnlUsd,
            pnlPct: trade.pnlPct,
            feesPaid: trade.feesPaid,
            slippageCost: trade.slippageCost,
            holdTimeHours: trade.holdTimeHours,
            status: 'closed'
          }
        });
      }

      // TODO: Save equity curve to backtest_metrics table
      // Skipping for now due to schema mismatch - will implement in next iteration
      logger.debug('Skipping equity curve save - schema mismatch to be fixed');
      const sampledEquity = result.equity.filter((_, i) => i % 10 === 0 || i === result.equity.length - 1);
      logger.debug(`Would have saved ${sampledEquity.length} equity curve points`);

      logger.info('✅ Backtest results saved successfully', {
        backtestId,
        trades: closedTrades.length,
        equityPoints: sampledEquity.length
      });

      return backtestId;

    } catch (error: any) {
      logger.error('❌ Failed to save backtest results', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Run backtest and save results
   */
  public async runAndSave(): Promise<{ result: BacktestResult; backtestId: string }> {
    const result = await this.run();
    const backtestId = await this.saveResults(result);

    return { result, backtestId };
  }
}
