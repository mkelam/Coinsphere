/**
 * Position Manager
 * Manages live trading positions, tracks P&L, and handles position lifecycle
 */

import { PrismaClient } from '@prisma/client';
import { exchangeManager } from './exchange/ExchangeManager';
import { ExchangeName, Order, Ticker } from './exchange/types';

const prisma = new PrismaClient();

export interface Position {
  id: string;
  strategyId: string;
  strategyName: string;
  exchange: ExchangeName;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  currentPrice?: number;
  status: 'open' | 'partial' | 'closed';
  pnl?: number;
  pnlPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
  entryOrderId?: string;
  exitOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface PositionSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export class PositionManager {
  /**
   * Open a new position
   */
  async openPosition(params: {
    strategyId: string;
    exchange: ExchangeName;
    symbol: string;
    side: 'long' | 'short';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<Position> {
    const { strategyId, exchange, symbol, side, quantity, stopLoss, takeProfit } = params;

    try {
      // Get current market price
      const ticker = await exchangeManager.fetchTicker(symbol, exchange);
      const entryPrice = ticker.last;

      // Execute market order to enter position
      const order = await exchangeManager.createOrder({
        symbol,
        type: 'market',
        side: side === 'long' ? 'buy' : 'sell',
        amount: quantity,
      }, exchange);

      // Get strategy name
      const strategy = await prisma.tradingStrategy.findUnique({
        where: { id: strategyId },
        select: { name: true },
      });

      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }

      // Create position record in database
      const position = await prisma.livePosition.create({
        data: {
          strategyId,
          exchange,
          symbol,
          side,
          entryPrice,
          quantity,
          status: 'open',
          stopLoss,
          takeProfit,
          entryOrderId: order.id,
          pnl: 0,
          pnlPercent: 0,
        },
      });

      console.log(`✅ Position opened: ${symbol} ${side} ${quantity} @ ${entryPrice}`);

      return this.mapToPosition(position, strategy.name, ticker.last);
    } catch (error: any) {
      console.error(`❌ Failed to open position:`, error.message);
      throw error;
    }
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string, reason?: string): Promise<Position> {
    try {
      // Get position from database
      const dbPosition = await prisma.livePosition.findUnique({
        where: { id: positionId },
        include: {
          strategy: {
            select: { name: true },
          },
        },
      });

      if (!dbPosition) {
        throw new Error(`Position ${positionId} not found`);
      }

      if (dbPosition.status === 'closed') {
        throw new Error(`Position ${positionId} is already closed`);
      }

      // Get current market price
      const ticker = await exchangeManager.fetchTicker(dbPosition.symbol, dbPosition.exchange as ExchangeName);
      const exitPrice = ticker.last;

      // Calculate P&L
      const pnl = this.calculatePnL(
        dbPosition.side,
        dbPosition.entryPrice.toNumber(),
        exitPrice,
        dbPosition.quantity.toNumber()
      );
      const pnlPercent = (pnl / (dbPosition.entryPrice.toNumber() * dbPosition.quantity.toNumber())) * 100;

      // Execute market order to exit position
      const order = await exchangeManager.createOrder({
        symbol: dbPosition.symbol,
        type: 'market',
        side: dbPosition.side === 'long' ? 'sell' : 'buy',
        amount: dbPosition.quantity.toNumber(),
      }, dbPosition.exchange as ExchangeName);

      // Update position in database
      const updatedPosition = await prisma.livePosition.update({
        where: { id: positionId },
        data: {
          status: 'closed',
          pnl,
          pnlPercent,
          exitOrderId: order.id,
          closedAt: new Date(),
          closeReason: reason,
        },
        include: {
          strategy: {
            select: { name: true },
          },
        },
      });

      console.log(`✅ Position closed: ${dbPosition.symbol} P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);

      return this.mapToPosition(updatedPosition, updatedPosition.strategy.name, exitPrice);
    } catch (error: any) {
      console.error(`❌ Failed to close position:`, error.message);
      throw error;
    }
  }

  /**
   * Update position P&L with current market price
   */
  async updatePositionPnL(positionId: string): Promise<Position> {
    try {
      const dbPosition = await prisma.livePosition.findUnique({
        where: { id: positionId },
        include: {
          strategy: {
            select: { name: true },
          },
        },
      });

      if (!dbPosition) {
        throw new Error(`Position ${positionId} not found`);
      }

      if (dbPosition.status === 'closed') {
        return this.mapToPosition(dbPosition, dbPosition.strategy.name);
      }

      // Get current market price
      const ticker = await exchangeManager.fetchTicker(dbPosition.symbol, dbPosition.exchange as ExchangeName);
      const currentPrice = ticker.last;

      // Calculate unrealized P&L
      const pnl = this.calculatePnL(
        dbPosition.side,
        dbPosition.entryPrice.toNumber(),
        currentPrice,
        dbPosition.quantity.toNumber()
      );
      const pnlPercent = (pnl / (dbPosition.entryPrice.toNumber() * dbPosition.quantity.toNumber())) * 100;

      // Update position in database
      const updatedPosition = await prisma.livePosition.update({
        where: { id: positionId },
        data: { pnl, pnlPercent },
        include: {
          strategy: {
            select: { name: true },
          },
        },
      });

      return this.mapToPosition(updatedPosition, updatedPosition.strategy.name, currentPrice);
    } catch (error: any) {
      console.error(`❌ Failed to update position P&L:`, error.message);
      throw error;
    }
  }

  /**
   * Update all open positions P&L
   */
  async updateAllPositionsPnL(): Promise<void> {
    try {
      const openPositions = await prisma.livePosition.findMany({
        where: {
          status: { in: ['open', 'partial'] },
        },
      });

      console.log(`🔄 Updating P&L for ${openPositions.length} open positions...`);

      for (const position of openPositions) {
        try {
          await this.updatePositionPnL(position.id);
        } catch (error: any) {
          console.error(`Failed to update P&L for position ${position.id}:`, error.message);
        }
      }

      console.log(`✅ P&L update complete`);
    } catch (error: any) {
      console.error(`❌ Failed to update positions P&L:`, error.message);
      throw error;
    }
  }

  /**
   * Check stop loss and take profit for all open positions
   */
  async checkStopLossAndTakeProfit(): Promise<void> {
    try {
      const openPositions = await prisma.livePosition.findMany({
        where: {
          status: { in: ['open', 'partial'] },
          OR: [
            { stopLoss: { not: null } },
            { takeProfit: { not: null } },
          ],
        },
      });

      for (const position of openPositions) {
        try {
          // Get current market price
          const ticker = await exchangeManager.fetchTicker(position.symbol, position.exchange as ExchangeName);
          const currentPrice = ticker.last;

          const stopLoss = position.stopLoss?.toNumber();
          const takeProfit = position.takeProfit?.toNumber();

          // Check stop loss
          if (stopLoss) {
            const shouldStopLoss = position.side === 'long'
              ? currentPrice <= stopLoss
              : currentPrice >= stopLoss;

            if (shouldStopLoss) {
              await this.closePosition(position.id, 'stop_loss');
              console.log(`🛑 Stop loss triggered for ${position.symbol}`);
              continue;
            }
          }

          // Check take profit
          if (takeProfit) {
            const shouldTakeProfit = position.side === 'long'
              ? currentPrice >= takeProfit
              : currentPrice <= takeProfit;

            if (shouldTakeProfit) {
              await this.closePosition(position.id, 'take_profit');
              console.log(`💰 Take profit triggered for ${position.symbol}`);
            }
          }
        } catch (error: any) {
          console.error(`Failed to check SL/TP for position ${position.id}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error(`❌ Failed to check stop loss/take profit:`, error.message);
    }
  }

  /**
   * Get position by ID
   */
  async getPosition(positionId: string): Promise<Position | null> {
    const dbPosition = await prisma.livePosition.findUnique({
      where: { id: positionId },
      include: {
        strategy: {
          select: { name: true },
          },
        },
    });

    if (!dbPosition) return null;

    // Get current price if position is open
    let currentPrice: number | undefined;
    if (dbPosition.status !== 'closed') {
      try {
        const ticker = await exchangeManager.fetchTicker(dbPosition.symbol, dbPosition.exchange as ExchangeName);
        currentPrice = ticker.last;
      } catch (error) {
        console.error(`Failed to fetch current price for ${dbPosition.symbol}`);
      }
    }

    return this.mapToPosition(dbPosition, dbPosition.strategy.name, currentPrice);
  }

  /**
   * Get all positions (optionally filtered by status or strategy)
   */
  async getPositions(filters?: {
    status?: 'open' | 'partial' | 'closed';
    strategyId?: string;
    exchange?: ExchangeName;
    symbol?: string;
  }): Promise<Position[]> {
    const dbPositions = await prisma.livePosition.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.strategyId && { strategyId: filters.strategyId }),
        ...(filters?.exchange && { exchange: filters.exchange }),
        ...(filters?.symbol && { symbol: filters.symbol }),
      },
      include: {
        strategy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      dbPositions.map(async (pos) => {
        let currentPrice: number | undefined;
        if (pos.status !== 'closed') {
          try {
            const ticker = await exchangeManager.fetchTicker(pos.symbol, pos.exchange as ExchangeName);
            currentPrice = ticker.last;
          } catch (error) {
            // Ignore price fetch errors
          }
        }
        return this.mapToPosition(pos, pos.strategy.name, currentPrice);
      })
    );
  }

  /**
   * Get position summary statistics
   */
  async getPositionSummary(strategyId?: string): Promise<PositionSummary> {
    const allPositions = await prisma.livePosition.findMany({
      where: strategyId ? { strategyId } : undefined,
    });

    const openPositions = allPositions.filter(p => p.status === 'open' || p.status === 'partial');
    const closedPositions = allPositions.filter(p => p.status === 'closed');

    const realizedPnL = closedPositions.reduce((sum, p) => sum + p.pnl.toNumber(), 0);
    const unrealizedPnL = openPositions.reduce((sum, p) => sum + p.pnl.toNumber(), 0);
    const totalPnL = realizedPnL + unrealizedPnL;

    const wins = closedPositions.filter(p => p.pnl.toNumber() > 0);
    const losses = closedPositions.filter(p => p.pnl.toNumber() <= 0);

    const winRate = closedPositions.length > 0
      ? (wins.length / closedPositions.length) * 100
      : 0;

    const avgWin = wins.length > 0
      ? wins.reduce((sum, p) => sum + p.pnl.toNumber(), 0) / wins.length
      : 0;

    const avgLoss = losses.length > 0
      ? losses.reduce((sum, p) => sum + p.pnl.toNumber(), 0) / losses.length
      : 0;

    return {
      totalPositions: allPositions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPnL,
      realizedPnL,
      unrealizedPnL,
      winRate,
      avgWin,
      avgLoss,
    };
  }

  /**
   * Calculate P&L for a position
   */
  private calculatePnL(
    side: string,
    entryPrice: number,
    exitPrice: number,
    quantity: number
  ): number {
    if (side === 'long') {
      return (exitPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - exitPrice) * quantity;
    }
  }

  /**
   * Map database position to Position interface
   */
  private mapToPosition(dbPosition: any, strategyName: string, currentPrice?: number): Position {
    return {
      id: dbPosition.id,
      strategyId: dbPosition.strategyId,
      strategyName,
      exchange: dbPosition.exchange as ExchangeName,
      symbol: dbPosition.symbol,
      side: dbPosition.side,
      entryPrice: dbPosition.entryPrice.toNumber(),
      quantity: dbPosition.quantity.toNumber(),
      currentPrice,
      status: dbPosition.status,
      pnl: dbPosition.pnl?.toNumber(),
      pnlPercent: dbPosition.pnlPercent?.toNumber(),
      stopLoss: dbPosition.stopLoss?.toNumber(),
      takeProfit: dbPosition.takeProfit?.toNumber(),
      entryOrderId: dbPosition.entryOrderId,
      exitOrderId: dbPosition.exitOrderId,
      createdAt: dbPosition.createdAt,
      updatedAt: dbPosition.updatedAt,
      closedAt: dbPosition.closedAt,
    };
  }
}

// Singleton instance
export const positionManager = new PositionManager();
