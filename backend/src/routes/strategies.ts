/**
 * Strategy Management API Routes
 * Manage trading strategies activation, configuration, and monitoring
 */

import { Router } from 'express';
import { z } from 'zod';
import { strategyExecutor, StrategyConfig } from '../services/strategyExecutor';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const ActivateStrategySchema = z.object({
  strategyId: z.string().uuid(),
  symbols: z.array(z.string()).min(1),
  exchange: z.enum(['binance', 'coinbase', 'kraken']),
  mode: z.enum(['paper', 'live']),
  allocatedCapital: z.number().min(100).max(1000000),
  maxPositionSize: z.number().min(0.01).max(0.50).optional(), // 1-50%
  maxOpenPositions: z.number().min(1).max(20).optional(),
  dailyLossLimit: z.number().min(0.01).max(0.20).optional(), // 1-20%
  stopLoss: z.number().min(0.01).max(0.10).optional(), // 1-10%
  takeProfit: z.number().min(0.01).max(0.50).optional(), // 1-50%
});

/**
 * GET /api/v1/strategies/executor/status
 * Get strategy executor status
 */
router.get('/executor/status', async (req, res, next) => {
  try {
    const isActive = strategyExecutor.isActive();
    const activeStrategies = strategyExecutor.getActiveStrategies();

    res.json({
      success: true,
      data: {
        isActive,
        activeStrategyCount: activeStrategies.length,
        strategies: activeStrategies,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/strategies/executor/start
 * Start the strategy executor
 */
router.post('/executor/start', async (req, res, next) => {
  try {
    await strategyExecutor.start();

    res.json({
      success: true,
      message: 'Strategy executor started',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/strategies/executor/stop
 * Stop the strategy executor
 */
router.post('/executor/stop', async (req, res, next) => {
  try {
    await strategyExecutor.stop();

    res.json({
      success: true,
      message: 'Strategy executor stopped',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/strategies/activate
 * Activate a trading strategy
 */
router.post('/activate', async (req, res, next) => {
  try {
    const params = ActivateStrategySchema.parse(req.body);

    // Get strategy from database
    const strategy = await prisma.tradingStrategy.findUnique({
      where: { id: params.strategyId },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Create strategy configuration
    const config: StrategyConfig = {
      id: strategy.id,
      name: strategy.name,
      symbols: params.symbols,
      exchange: params.exchange,
      mode: params.mode,
      allocatedCapital: params.allocatedCapital,
      maxPositionSize: params.maxPositionSize || 0.10, // 10% default
      maxOpenPositions: params.maxOpenPositions || 5,
      dailyLossLimit: params.dailyLossLimit || 0.05, // 5% default
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
    };

    // Start executor if not running
    if (!strategyExecutor.isActive()) {
      await strategyExecutor.start();
    }

    // Activate strategy
    await strategyExecutor.activateStrategy(config);

    res.json({
      success: true,
      message: `Strategy "${strategy.name}" activated in ${params.mode} mode`,
      data: config,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/strategies/:id/deactivate
 * Deactivate a trading strategy
 */
router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;

    await strategyExecutor.stopStrategy(id);

    res.json({
      success: true,
      message: 'Strategy deactivated',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/strategies/:id/status
 * Get strategy execution status and performance
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get strategy config
    const config = strategyExecutor.getStrategy(id);

    // Get execution state from database
    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId: id },
      include: {
        strategy: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Strategy execution state not found',
      });
    }

    // Get positions
    const positions = await prisma.livePosition.findMany({
      where: { strategyId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent signals
    const signals = await prisma.tradingSignal.findMany({
      where: { strategyId: id },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: {
        isActive: config !== undefined,
        config,
        state: {
          id: state.id,
          isActive: state.isActive,
          mode: state.mode,
          currentCapital: state.currentCapital.toNumber(),
          allocatedCapital: state.allocatedCapital.toNumber(),
          totalPnl: state.totalPnl.toNumber(),
          realizedPnl: state.realizedPnl.toNumber(),
          unrealizedPnl: state.unrealizedPnl.toNumber(),
          totalTrades: state.totalTrades,
          winningTrades: state.winningTrades,
          losingTrades: state.losingTrades,
          winRate: state.winRate?.toNumber() || 0,
          currentOpenPositions: state.currentOpenPositions,
          maxOpenPositions: state.maxOpenPositions,
          dailyLossCurrent: state.dailyLossCurrent.toNumber(),
          dailyLossLimit: state.dailyLossLimit.toNumber(),
          emergencyStopTriggered: state.emergencyStopTriggered,
          stopReason: state.stopReason,
        },
        strategy: state.strategy,
        recentPositions: positions.map((p) => ({
          id: p.id,
          symbol: p.symbol,
          side: p.side,
          entryPrice: p.entryPrice.toNumber(),
          quantity: p.quantity.toNumber(),
          status: p.status,
          pnl: p.pnl.toNumber(),
          pnlPercent: p.pnlPercent?.toNumber() || 0,
          createdAt: p.createdAt,
          closedAt: p.closedAt,
        })),
        recentSignals: signals.map((s) => ({
          id: s.id,
          symbol: s.symbol,
          action: s.action,
          strength: s.strength.toNumber(),
          reasoning: s.reasoning,
          executed: s.executed,
          timestamp: s.timestamp,
          executedAt: s.executedAt,
        })),
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/strategies/available
 * Get all available strategies from database
 */
router.get('/available', async (req, res, next) => {
  try {
    const strategies = await prisma.tradingStrategy.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        strategyType: true,
        avgReturn: true,
        winRate: true,
        backtestCount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        avgReturn: 'desc',
      },
    });

    res.json({
      success: true,
      data: strategies.map((s) => ({
        ...s,
        avgReturn: s.avgReturn?.toNumber() || 0,
        winRate: s.winRate?.toNumber() || 0,
      })),
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/strategies/:id/signals
 * Get trading signals for a strategy
 */
router.get('/:id/signals', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, executed } = req.query;

    const signals = await prisma.tradingSignal.findMany({
      where: {
        strategyId: id,
        ...(executed !== undefined && { executed: executed === 'true' }),
      },
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: signals.map((s) => ({
        id: s.id,
        symbol: s.symbol,
        signalType: s.signalType,
        action: s.action,
        strength: s.strength.toNumber(),
        entryPrice: s.entryPrice?.toNumber(),
        stopLoss: s.stopLoss?.toNumber(),
        takeProfit: s.takeProfit?.toNumber(),
        positionSize: s.positionSize?.toNumber(),
        reasoning: s.reasoning,
        metadata: s.metadata,
        executed: s.executed,
        timestamp: s.timestamp,
        executedAt: s.executedAt,
        positionId: s.positionId,
      })),
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/strategies/:id/positions
 * Get positions for a strategy
 */
router.get('/:id/positions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, limit = 50 } = req.query;

    const positions = await prisma.livePosition.findMany({
      where: {
        strategyId: id,
        ...(status && { status: status as string }),
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: positions.map((p) => ({
        id: p.id,
        exchange: p.exchange,
        symbol: p.symbol,
        side: p.side,
        entryPrice: p.entryPrice.toNumber(),
        quantity: p.quantity.toNumber(),
        status: p.status,
        pnl: p.pnl.toNumber(),
        pnlPercent: p.pnlPercent?.toNumber() || 0,
        stopLoss: p.stopLoss?.toNumber(),
        takeProfit: p.takeProfit?.toNumber(),
        entryOrderId: p.entryOrderId,
        exitOrderId: p.exitOrderId,
        closeReason: p.closeReason,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        closedAt: p.closedAt,
      })),
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/strategies/:id/performance
 * Get strategy performance metrics
 */
router.get('/:id/performance', async (req, res, next) => {
  try {
    const { id } = req.params;

    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId: id },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'Strategy execution state not found',
      });
    }

    const positions = await prisma.livePosition.findMany({
      where: { strategyId: id, status: 'closed' },
    });

    const totalReturn = state.totalPnl.toNumber();
    const returnPercent = (totalReturn / state.allocatedCapital.toNumber()) * 100;
    const avgWin =
      state.winningTrades > 0
        ? positions
            .filter((p) => p.pnl.toNumber() > 0)
            .reduce((sum, p) => sum + p.pnl.toNumber(), 0) / state.winningTrades
        : 0;
    const avgLoss =
      state.losingTrades > 0
        ? positions
            .filter((p) => p.pnl.toNumber() <= 0)
            .reduce((sum, p) => sum + p.pnl.toNumber(), 0) / state.losingTrades
        : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    res.json({
      success: true,
      data: {
        totalReturn,
        returnPercent,
        realizedPnl: state.realizedPnl.toNumber(),
        unrealizedPnl: state.unrealizedPnl.toNumber(),
        totalTrades: state.totalTrades,
        winningTrades: state.winningTrades,
        losingTrades: state.losingTrades,
        winRate: state.winRate?.toNumber() || 0,
        avgWin,
        avgLoss,
        profitFactor,
        currentCapital: state.currentCapital.toNumber(),
        allocatedCapital: state.allocatedCapital.toNumber(),
        currentOpenPositions: state.currentOpenPositions,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
