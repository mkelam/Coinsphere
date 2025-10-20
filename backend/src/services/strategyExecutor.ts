/**
 * Strategy Execution Engine
 * Connects market data events to trading strategy logic
 * Manages automated signal generation and order execution
 */

import EventEmitter from 'events';
import { PrismaClient } from '@prisma/client';
import { marketDataStreamer, MarketDataUpdate } from './marketDataStreamer';
import { positionManager } from './positionManager';
import { exchangeManager } from './exchange/ExchangeManager';
import { ExchangeName } from './exchange/types';
import { TokenUnlockStrategy } from '../strategies/TokenUnlockStrategy';

const prisma = new PrismaClient();

export interface StrategyConfig {
  id: string;
  name: string;
  symbols: string[];
  exchange: ExchangeName;
  mode: 'paper' | 'live';
  allocatedCapital: number;
  maxPositionSize: number; // percentage (0.20 = 20%)
  maxOpenPositions: number;
  dailyLossLimit: number; // percentage (0.05 = 5%)
  stopLoss?: number; // percentage (0.02 = 2%)
  takeProfit?: number; // percentage (0.05 = 5%)
}

export interface TradingSignal {
  strategyId: string;
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number; // percentage
  reasoning: string;
  metadata?: any;
}

export interface StrategyState {
  id: string;
  strategyId: string;
  isActive: boolean;
  mode: 'paper' | 'live';
  currentCapital: number;
  allocatedCapital: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  currentOpenPositions: number;
  maxOpenPositions: number;
  dailyLossCurrent: number;
  dailyLossLimit: number;
  emergencyStopTriggered: boolean;
}

/**
 * Strategy Executor
 * Manages strategy lifecycle and execution
 */
export class StrategyExecutor extends EventEmitter {
  private activeStrategies: Map<string, StrategyConfig> = new Map();
  private marketDataSubscriptions: Map<string, string[]> = new Map(); // strategyId -> subscriptionIds
  private strategyInstances: Map<string, TokenUnlockStrategy> = new Map(); // strategyId -> strategy instance
  private isRunning: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Start the strategy executor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Strategy executor already running');
      return;
    }

    this.isRunning = true;

    // Start market data streamer
    if (!marketDataStreamer.isActive()) {
      marketDataStreamer.start();
    }

    console.log('🚀 Strategy executor started');
    this.emit('started');
  }

  /**
   * Stop the strategy executor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️  Strategy executor not running');
      return;
    }

    // Stop all active strategies
    for (const [strategyId] of this.activeStrategies) {
      await this.stopStrategy(strategyId);
    }

    this.isRunning = false;
    console.log('🛑 Strategy executor stopped');
    this.emit('stopped');
  }

  /**
   * Activate a trading strategy
   */
  async activateStrategy(config: StrategyConfig): Promise<void> {
    if (this.activeStrategies.has(config.id)) {
      console.log(`⚠️  Strategy ${config.name} is already active`);
      return;
    }

    try {
      // Initialize or load strategy execution state
      let state = await this.getStrategyState(config.id);

      if (!state) {
        // Create new execution state
        state = await prisma.strategyExecutionState.create({
          data: {
            strategyId: config.id,
            isActive: true,
            mode: config.mode,
            currentCapital: config.allocatedCapital,
            allocatedCapital: config.allocatedCapital,
            totalPnl: 0,
            realizedPnl: 0,
            unrealizedPnl: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            currentOpenPositions: 0,
            maxOpenPositions: config.maxOpenPositions,
            dailyLossCurrent: 0,
            dailyLossLimit: config.dailyLossLimit,
            maxPositionSize: config.maxPositionSize,
            emergencyStopTriggered: false,
          },
        });
      } else {
        // Update existing state
        state = await prisma.strategyExecutionState.update({
          where: { id: state.id },
          data: { isActive: true },
        });
      }

      // Store strategy config
      this.activeStrategies.set(config.id, config);

      // Initialize Token Unlock strategy instance
      const strategyInstance = new TokenUnlockStrategy({
        positionSizePercent: config.maxPositionSize * 100,
        stopLossPercent: config.stopLoss ? config.stopLoss * 100 : -3,
        takeProfitPercent: config.takeProfit ? config.takeProfit * 100 : 5,
      });

      await strategyInstance.initialize();
      this.strategyInstances.set(config.id, strategyInstance);

      // Subscribe to market data for all symbols
      const subscriptionIds: string[] = [];
      for (const symbol of config.symbols) {
        const tickerId = marketDataStreamer.subscribeTicker(
          symbol,
          config.exchange,
          1000 // 1 second updates
        );
        subscriptionIds.push(tickerId);

        // Listen for ticker updates
        const eventName = `ticker:${symbol}:${config.exchange}`;
        marketDataStreamer.on(eventName, (update: MarketDataUpdate) => {
          this.handleMarketDataUpdate(config.id, update);
        });
      }

      this.marketDataSubscriptions.set(config.id, subscriptionIds);

      // Check stop-loss/take-profit every 5 seconds
      const checkInterval = setInterval(async () => {
        if (!this.activeStrategies.has(config.id)) {
          clearInterval(checkInterval);
          return;
        }
        await positionManager.checkStopLossAndTakeProfit();
        await this.updateStrategyPnL(config.id);
        await this.checkRiskLimits(config.id);
      }, 5000);

      console.log(`✅ Strategy activated: ${config.name} (${config.mode} mode)`);
      console.log(`   Symbols: ${config.symbols.join(', ')}`);
      console.log(`   Capital: $${config.allocatedCapital}`);
      console.log(`   Max positions: ${config.maxOpenPositions}`);

      this.emit('strategy-activated', { strategyId: config.id, config });
    } catch (error: any) {
      console.error(`❌ Failed to activate strategy:`, error.message);
      throw error;
    }
  }

  /**
   * Deactivate a trading strategy
   */
  async stopStrategy(strategyId: string): Promise<void> {
    const config = this.activeStrategies.get(strategyId);
    if (!config) {
      console.log(`⚠️  Strategy ${strategyId} is not active`);
      return;
    }

    try {
      // Unsubscribe from market data
      const subscriptionIds = this.marketDataSubscriptions.get(strategyId) || [];
      for (const subId of subscriptionIds) {
        marketDataStreamer.unsubscribe(subId);
      }
      this.marketDataSubscriptions.delete(strategyId);

      // Close all open positions
      const openPositions = await positionManager.getPositions({
        strategyId,
        status: 'open',
      });

      for (const position of openPositions) {
        await positionManager.closePosition(position.id, 'strategy_stopped');
      }

      // Update execution state
      await prisma.strategyExecutionState.update({
        where: { strategyId },
        data: { isActive: false },
      });

      // Remove from active strategies
      this.activeStrategies.delete(strategyId);

      console.log(`✅ Strategy stopped: ${config.name}`);
      this.emit('strategy-stopped', { strategyId });
    } catch (error: any) {
      console.error(`❌ Failed to stop strategy:`, error.message);
      throw error;
    }
  }

  /**
   * Handle incoming market data update
   */
  private async handleMarketDataUpdate(
    strategyId: string,
    update: MarketDataUpdate
  ): Promise<void> {
    const config = this.activeStrategies.get(strategyId);
    if (!config) return;

    try {
      // Generate trading signal based on strategy logic
      const signal = await this.generateSignal(strategyId, update);

      if (signal && signal.action !== 'hold') {
        // Check if we can execute this signal
        const canExecute = await this.validateSignal(strategyId, signal);

        if (canExecute) {
          await this.executeSignal(strategyId, signal);
        }
      }
    } catch (error: any) {
      console.error(`Error handling market data for ${config.name}:`, error.message);
      this.emit('error', { strategyId, error });
    }
  }

  /**
   * Generate trading signal using Token Unlock strategy
   */
  protected async generateSignal(
    strategyId: string,
    update: MarketDataUpdate
  ): Promise<TradingSignal | null> {
    const strategyInstance = this.strategyInstances.get(strategyId);
    if (!strategyInstance) {
      console.error(`Strategy instance not found for ${strategyId}`);
      return null;
    }

    // Delegate signal generation to Token Unlock strategy
    return await strategyInstance.generateSignal(strategyId, update);
  }

  /**
   * Validate if signal can be executed
   */
  private async validateSignal(
    strategyId: string,
    signal: TradingSignal
  ): Promise<boolean> {
    const state = await this.getStrategyState(strategyId);
    if (!state) return false;

    // Check if strategy is active
    if (!state.isActive) {
      console.log(`⚠️  Strategy ${strategyId} is not active`);
      return false;
    }

    // Check emergency stop
    if (state.emergencyStopTriggered) {
      console.log(`🛑 Emergency stop triggered for ${strategyId}`);
      return false;
    }

    // Check daily loss limit
    if (state.dailyLossCurrent <= -state.dailyLossLimit * state.allocatedCapital) {
      console.log(`🛑 Daily loss limit reached for ${strategyId}`);
      await this.triggerEmergencyStop(strategyId, 'daily_loss_limit');
      return false;
    }

    // Check max open positions
    if (signal.action === 'buy' && state.currentOpenPositions >= state.maxOpenPositions) {
      console.log(`⚠️  Max open positions reached for ${strategyId}`);
      return false;
    }

    // Check available capital
    const positionValue = state.currentCapital * (signal.positionSize || 0.05);
    if (positionValue > state.currentCapital) {
      console.log(`⚠️  Insufficient capital for ${strategyId}`);
      return false;
    }

    return true;
  }

  /**
   * Execute a trading signal
   */
  private async executeSignal(
    strategyId: string,
    signal: TradingSignal
  ): Promise<void> {
    const config = this.activeStrategies.get(strategyId);
    if (!config) return;

    const state = await this.getStrategyState(strategyId);
    if (!state) return;

    try {
      // Save signal to database
      const signalRecord = await prisma.tradingSignal.create({
        data: {
          strategyId,
          symbol: signal.symbol,
          signalType: 'market',
          action: signal.action,
          strength: signal.strength,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          positionSize: signal.positionSize,
          reasoning: signal.reasoning,
          metadata: signal.metadata || {},
          executed: false,
        },
      });

      if (signal.action === 'buy') {
        // Calculate position size
        const positionValue = state.currentCapital * (signal.positionSize || config.maxPositionSize);
        const quantity = positionValue / (signal.entryPrice || 0);

        // Open position
        const position = await positionManager.openPosition({
          strategyId,
          exchange: config.exchange,
          symbol: signal.symbol,
          side: 'long',
          quantity,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
        });

        // Update signal as executed
        await prisma.tradingSignal.update({
          where: { id: signalRecord.id },
          data: {
            executed: true,
            executedAt: new Date(),
            positionId: position.id,
          },
        });

        // Notify strategy instance of position opened
        const strategyInstance = this.strategyInstances.get(strategyId);
        if (strategyInstance) {
          strategyInstance.onPositionOpened(signal.symbol, position.entryPrice);
        }

        // Update strategy state
        await this.updateStrategyState(strategyId, {
          currentOpenPositions: state.currentOpenPositions + 1,
          totalTrades: state.totalTrades + 1,
        });

        console.log(`✅ Signal executed: ${signal.action} ${signal.symbol} @ ${signal.entryPrice}`);
        this.emit('signal-executed', { strategyId, signal, position });
      } else if (signal.action === 'sell') {
        // Find open position to close
        const openPositions = await positionManager.getPositions({
          strategyId,
          symbol: signal.symbol,
          status: 'open',
        });

        if (openPositions.length > 0) {
          const position = openPositions[0];
          await positionManager.closePosition(position.id, 'signal');

          // Notify strategy instance of position closed
          const strategyInstance = this.strategyInstances.get(strategyId);
          if (strategyInstance) {
            strategyInstance.onPositionClosed(signal.symbol);
          }

          // Update signal as executed
          await prisma.tradingSignal.update({
            where: { id: signalRecord.id },
            data: {
              executed: true,
              executedAt: new Date(),
              positionId: position.id,
            },
          });

          console.log(`✅ Position closed: ${signal.symbol} (signal)`);
          this.emit('signal-executed', { strategyId, signal, position });
        }
      }
    } catch (error: any) {
      console.error(`❌ Failed to execute signal:`, error.message);
      this.emit('execution-error', { strategyId, signal, error });
    }
  }

  /**
   * Update strategy P&L
   */
  private async updateStrategyPnL(strategyId: string): Promise<void> {
    try {
      const summary = await positionManager.getPositionSummary(strategyId);

      await prisma.strategyExecutionState.update({
        where: { strategyId },
        data: {
          totalPnl: summary.totalPnL,
          realizedPnl: summary.realizedPnL,
          unrealizedPnl: summary.unrealizedPnL,
          totalTrades: summary.totalPositions,
          winningTrades: summary.closedPositions > 0
            ? Math.round(summary.closedPositions * (summary.winRate / 100))
            : 0,
          losingTrades: summary.closedPositions > 0
            ? summary.closedPositions - Math.round(summary.closedPositions * (summary.winRate / 100))
            : 0,
          winRate: summary.winRate / 100,
          currentOpenPositions: summary.openPositions,
          lastPnlUpdateAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error(`Failed to update P&L for ${strategyId}:`, error.message);
    }
  }

  /**
   * Check risk limits
   */
  private async checkRiskLimits(strategyId: string): Promise<void> {
    const state = await this.getStrategyState(strategyId);
    if (!state) return;

    // Check daily loss limit
    if (state.dailyLossCurrent <= -state.dailyLossLimit * state.allocatedCapital) {
      await this.triggerEmergencyStop(strategyId, 'daily_loss_limit_exceeded');
      return;
    }

    // Check max drawdown
    if (state.totalPnl <= -0.20 * state.allocatedCapital) {
      await this.triggerEmergencyStop(strategyId, 'max_drawdown_exceeded');
      return;
    }
  }

  /**
   * Trigger emergency stop
   */
  private async triggerEmergencyStop(strategyId: string, reason: string): Promise<void> {
    console.log(`🚨 EMERGENCY STOP: ${strategyId} - ${reason}`);

    await prisma.strategyExecutionState.update({
      where: { strategyId },
      data: {
        emergencyStopTriggered: true,
        stopReason: reason,
        isActive: false,
      },
    });

    await this.stopStrategy(strategyId);

    this.emit('emergency-stop', { strategyId, reason });
  }

  /**
   * Get strategy execution state
   */
  private async getStrategyState(strategyId: string): Promise<StrategyState | null> {
    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId },
    });

    if (!state) return null;

    return {
      id: state.id,
      strategyId: state.strategyId,
      isActive: state.isActive,
      mode: state.mode as 'paper' | 'live',
      currentCapital: state.currentCapital.toNumber(),
      allocatedCapital: state.allocatedCapital.toNumber(),
      totalPnl: state.totalPnl.toNumber(),
      realizedPnl: state.realizedPnl.toNumber(),
      unrealizedPnl: state.unrealizedPnl.toNumber(),
      totalTrades: state.totalTrades,
      winningTrades: state.winningTrades,
      losingTrades: state.losingTrades,
      currentOpenPositions: state.currentOpenPositions,
      maxOpenPositions: state.maxOpenPositions,
      dailyLossCurrent: state.dailyLossCurrent.toNumber(),
      dailyLossLimit: state.dailyLossLimit.toNumber(),
      emergencyStopTriggered: state.emergencyStopTriggered,
    };
  }

  /**
   * Update strategy state
   */
  private async updateStrategyState(
    strategyId: string,
    updates: Partial<StrategyState>
  ): Promise<void> {
    await prisma.strategyExecutionState.update({
      where: { strategyId },
      data: updates as any,
    });
  }

  /**
   * Get all active strategies
   */
  getActiveStrategies(): StrategyConfig[] {
    return Array.from(this.activeStrategies.values());
  }

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId: string): StrategyConfig | undefined {
    return this.activeStrategies.get(strategyId);
  }

  /**
   * Check if executor is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const strategyExecutor = new StrategyExecutor();
