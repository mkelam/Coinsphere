/**
 * Paper Trading Dashboard API Routes
 * Provides data for Token Unlock Front-Running strategy monitoring
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/paper-trading/overview
 * Returns strategy status, capital, P&L, and performance metrics
 */
router.get('/overview', async (req, res) => {
  try {
    // Find Token Unlock strategy
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Token Unlock strategy not found',
      });
    }

    // Get execution state
    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId: strategy.id },
    });

    res.json({
      success: true,
      data: {
        strategy: {
          id: strategy.id,
          name: strategy.name,
          status: strategy.status,
          winRate: strategy.winRate,
          riskRewardRatio: strategy.riskRewardRatio,
          avgHoldTime: strategy.avgHoldTime,
        },
        executionState: state
          ? {
              isActive: state.isActive,
              mode: state.mode,
              currentCapital: state.currentCapital,
              allocatedCapital: state.allocatedCapital,
              totalPnl: state.totalPnl,
              realizedPnl: state.realizedPnl,
              unrealizedPnl: state.unrealizedPnl,
              totalTrades: state.totalTrades,
              winningTrades: state.winningTrades,
              losingTrades: state.losingTrades,
              winRate: state.winRate,
              sharpeRatio: state.sharpeRatio,
              maxDrawdown: state.maxDrawdown,
              currentOpenPositions: state.currentOpenPositions,
              maxOpenPositions: state.maxOpenPositions,
              dailyLossLimit: state.dailyLossLimit,
              dailyLossCurrent: state.dailyLossCurrent,
              lastTradeAt: state.lastTradeAt,
              startedAt: state.startedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch paper trading overview', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview',
    });
  }
});

/**
 * GET /api/v1/paper-trading/unlocks
 * Returns upcoming token unlock events
 */
router.get('/unlocks', async (req, res) => {
  try {
    const now = new Date();
    const daysAhead = parseInt(req.query.days as string) || 30;
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const unlocks = await prisma.tokenUnlockSchedule.findMany({
      where: {
        unlockDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        token: {
          select: {
            id: true,
            symbol: true,
            name: true,
            currentPrice: true,
            marketCap: true,
          },
        },
      },
      orderBy: {
        unlockDate: 'asc',
      },
    });

    // Calculate time until unlock and entry window status
    const enrichedUnlocks = unlocks.map((unlock) => {
      const msUntil = unlock.unlockDate.getTime() - now.getTime();
      const hoursUntil = Math.round(msUntil / (60 * 60 * 1000));
      const daysUntil = Math.round(hoursUntil / 24);

      const inEntryWindow = hoursUntil >= 24 && hoursUntil <= 48;
      const tooClose = hoursUntil < 24 && hoursUntil >= 0;
      const passed = hoursUntil < 0;

      return {
        id: unlock.id,
        token: unlock.token,
        unlockDate: unlock.unlockDate,
        unlockAmount: unlock.unlockAmount,
        percentOfSupply: unlock.percentOfSupply,
        circulatingSupply: unlock.circulatingSupply,
        category: unlock.category,
        description: unlock.description,
        source: unlock.source,
        timeUntil: {
          hours: hoursUntil,
          days: daysUntil,
        },
        status: passed
          ? 'passed'
          : inEntryWindow
            ? 'entry_window'
            : tooClose
              ? 'too_close'
              : 'waiting',
      };
    });

    res.json({
      success: true,
      data: enrichedUnlocks,
    });
  } catch (error: any) {
    logger.error('Failed to fetch unlock events', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unlock events',
    });
  }
});

/**
 * GET /api/v1/paper-trading/signals
 * Returns recent trading signals
 */
router.get('/signals', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Find Token Unlock strategy
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Try to fetch signals (table may not exist)
    try {
      const signals = await prisma.tradingSignal.findMany({
        where: { strategyId: strategy.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        success: true,
        data: signals,
      });
    } catch (error: any) {
      // Table doesn't exist yet
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        res.json({
          success: true,
          data: [],
          message: 'Signals table not created yet',
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    logger.error('Failed to fetch signals', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signals',
    });
  }
});

/**
 * GET /api/v1/paper-trading/positions
 * Returns recent positions (open and closed)
 */
router.get('/positions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string; // 'open', 'closed', or undefined (all)

    // Find Token Unlock strategy
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Try to fetch positions (table may not exist)
    try {
      const positions = await prisma.livePosition.findMany({
        where: {
          strategyId: strategy.id,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        success: true,
        data: positions,
      });
    } catch (error: any) {
      // Table doesn't exist yet
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        res.json({
          success: true,
          data: [],
          message: 'Positions table not created yet',
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    logger.error('Failed to fetch positions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions',
    });
  }
});

/**
 * GET /api/v1/paper-trading/performance
 * Returns detailed performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    // Find Token Unlock strategy
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Try to fetch closed positions for performance calc
    try {
      const closedPositions = await prisma.livePosition.findMany({
        where: {
          strategyId: strategy.id,
          status: 'closed',
        },
        orderBy: { closedAt: 'desc' },
      });

      const totalTrades = closedPositions.length;
      const winners = closedPositions.filter((p) => parseFloat(p.pnl.toString()) > 0);
      const losers = closedPositions.filter((p) => parseFloat(p.pnl.toString()) <= 0);

      const totalPnl = closedPositions.reduce((sum, p) => sum + parseFloat(p.pnl.toString()), 0);
      const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
      const winRate = totalTrades > 0 ? winners.length / totalTrades : 0;

      // Calculate profit factor (total wins / total losses)
      const totalWins = winners.reduce((sum, p) => sum + parseFloat(p.pnl.toString()), 0);
      const totalLosses = Math.abs(
        losers.reduce((sum, p) => sum + parseFloat(p.pnl.toString()), 0)
      );
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

      res.json({
        success: true,
        data: {
          totalTrades,
          winners: winners.length,
          losers: losers.length,
          winRate,
          totalPnl,
          avgPnl,
          profitFactor,
          recentTrades: closedPositions.slice(0, 5).map((p) => ({
            symbol: p.symbol,
            side: p.side,
            pnl: p.pnl,
            pnlPercent: p.pnlPercent,
            closedAt: p.closedAt,
          })),
        },
      });
    } catch (error: any) {
      // Table doesn't exist yet
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        res.json({
          success: true,
          data: {
            totalTrades: 0,
            winners: 0,
            losers: 0,
            winRate: 0,
            totalPnl: 0,
            avgPnl: 0,
            profitFactor: 0,
            recentTrades: [],
          },
          message: 'Positions table not created yet',
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    logger.error('Failed to fetch performance metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance',
    });
  }
});

export default router;
