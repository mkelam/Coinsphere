/**
 * Holdings Service
 * Manages portfolio holdings (individual token positions)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { toDecimal, weightedAverage, add } from '../utils/decimal.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreateHoldingData {
  portfolioId: string;
  tokenSymbol: string;
  amount: number;
  averageBuyPrice?: number;
  source?: string;
  sourceId?: string;
}

export interface UpdateHoldingData {
  amount?: number;
  averageBuyPrice?: number;
  source?: string;
  sourceId?: string;
}

class HoldingsService {
  /**
   * Add a new holding to a portfolio
   */
  async addHolding(data: CreateHoldingData, userId: string) {
    try {
      // Verify portfolio belongs to user
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: data.portfolioId,
          userId,
        },
      });

      if (!portfolio) {
        return null;
      }

      // Find token by symbol
      const token = await prisma.token.findUnique({
        where: { symbol: data.tokenSymbol.toUpperCase() },
      });

      if (!token) {
        throw new Error(`Token not found: ${data.tokenSymbol}`);
      }

      // Check if holding already exists for this token
      const existingHolding = await prisma.holding.findFirst({
        where: {
          portfolioId: data.portfolioId,
          tokenId: token.id,
        },
      });

      if (existingHolding) {
        // Update existing holding - add to amount and recalculate average using Decimal for precision
        const newAmount = add(existingHolding.amount, data.amount);
        let newAverageBuyPrice: Prisma.Decimal | null = existingHolding.averageBuyPrice;

        if (data.averageBuyPrice && existingHolding.averageBuyPrice) {
          // Weighted average: (old_amount * old_price + new_amount * new_price) / total_amount
          // Use Decimal to avoid floating-point precision errors
          newAverageBuyPrice = new Prisma.Decimal(
            weightedAverage(
              existingHolding.averageBuyPrice,
              existingHolding.amount,
              data.averageBuyPrice,
              data.amount
            ).toString()
          );
        } else if (data.averageBuyPrice) {
          newAverageBuyPrice = new Prisma.Decimal(data.averageBuyPrice);
        }

        const holding = await prisma.holding.update({
          where: { id: existingHolding.id },
          data: {
            amount: newAmount.toString(),
            averageBuyPrice: newAverageBuyPrice?.toString(),
            source: data.source || existingHolding.source,
            sourceId: data.sourceId || existingHolding.sourceId,
          },
          include: {
            token: {
              select: {
                symbol: true,
                name: true,
                currentPrice: true,
                priceChange24h: true,
                logoUrl: true,
              },
            },
          },
        });

        logger.info('Holding updated (added to existing)', {
          holdingId: holding.id,
          portfolioId: data.portfolioId,
          tokenSymbol: token.symbol,
          newAmount,
        });

        return holding;
      }

      // Create new holding
      const holding = await prisma.holding.create({
        data: {
          portfolioId: data.portfolioId,
          tokenId: token.id,
          amount: data.amount,
          averageBuyPrice: data.averageBuyPrice || null,
          source: data.source || null,
          sourceId: data.sourceId || null,
        },
        include: {
          token: {
            select: {
              symbol: true,
              name: true,
              currentPrice: true,
              priceChange24h: true,
              logoUrl: true,
            },
          },
        },
      });

      logger.info('Holding created', {
        holdingId: holding.id,
        portfolioId: data.portfolioId,
        tokenSymbol: token.symbol,
        amount: data.amount,
      });

      return holding;
    } catch (error) {
      logger.error('Failed to add holding:', error);
      throw error;
    }
  }

  /**
   * Get a specific holding by ID
   */
  async getHoldingById(holdingId: string, userId: string) {
    try {
      const holding = await prisma.holding.findFirst({
        where: {
          id: holdingId,
          portfolio: {
            userId,
          },
        },
        include: {
          token: {
            select: {
              id: true,
              symbol: true,
              name: true,
              currentPrice: true,
              priceChange24h: true,
              logoUrl: true,
              marketCap: true,
              volume24h: true,
            },
          },
          portfolio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return holding;
    } catch (error) {
      logger.error('Failed to get holding:', error);
      throw new Error('Failed to fetch holding');
    }
  }

  /**
   * Get all holdings for a portfolio
   */
  async getPortfolioHoldings(portfolioId: string, userId: string) {
    try {
      // Verify portfolio belongs to user
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId,
        },
      });

      if (!portfolio) {
        return null;
      }

      const holdings = await prisma.holding.findMany({
        where: { portfolioId },
        include: {
          token: {
            select: {
              id: true,
              symbol: true,
              name: true,
              currentPrice: true,
              priceChange24h: true,
              logoUrl: true,
              marketCap: true,
              volume24h: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate value and P&L for each holding
      const enrichedHoldings = holdings.map((holding) => {
        const currentPrice = Number(holding.token.currentPrice || 0);
        const amount = Number(holding.amount);
        const avgBuyPrice = Number(holding.averageBuyPrice || 0);

        const currentValue = currentPrice * amount;
        const costBasis = avgBuyPrice * amount;
        const unrealizedPnL = currentValue - costBasis;
        const unrealizedPnLPercentage = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

        return {
          ...holding,
          currentValue: Math.round(currentValue * 100) / 100,
          costBasis: Math.round(costBasis * 100) / 100,
          unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
          unrealizedPnLPercentage: Math.round(unrealizedPnLPercentage * 100) / 100,
        };
      });

      return enrichedHoldings;
    } catch (error) {
      logger.error('Failed to get portfolio holdings:', error);
      throw new Error('Failed to fetch holdings');
    }
  }

  /**
   * Update a holding
   */
  async updateHolding(holdingId: string, userId: string, data: UpdateHoldingData) {
    try {
      // Verify holding belongs to user's portfolio
      const existingHolding = await prisma.holding.findFirst({
        where: {
          id: holdingId,
          portfolio: {
            userId,
          },
        },
      });

      if (!existingHolding) {
        return null;
      }

      const holding = await prisma.holding.update({
        where: { id: holdingId },
        data: {
          amount: data.amount,
          averageBuyPrice: data.averageBuyPrice,
          source: data.source,
          sourceId: data.sourceId,
        },
        include: {
          token: {
            select: {
              symbol: true,
              name: true,
              currentPrice: true,
              priceChange24h: true,
              logoUrl: true,
            },
          },
        },
      });

      logger.info('Holding updated', { holdingId, userId });
      return holding;
    } catch (error) {
      logger.error('Failed to update holding:', error);
      throw new Error('Failed to update holding');
    }
  }

  /**
   * Delete a holding
   */
  async deleteHolding(holdingId: string, userId: string) {
    try {
      // Verify holding belongs to user's portfolio
      const existingHolding = await prisma.holding.findFirst({
        where: {
          id: holdingId,
          portfolio: {
            userId,
          },
        },
      });

      if (!existingHolding) {
        return null;
      }

      await prisma.holding.delete({
        where: { id: holdingId },
      });

      logger.info('Holding deleted', { holdingId, userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete holding:', error);
      throw new Error('Failed to delete holding');
    }
  }

  /**
   * Get top performing holdings across all user's portfolios
   */
  async getTopPerformingHoldings(userId: string, limit: number = 10) {
    try {
      const holdings = await prisma.holding.findMany({
        where: {
          portfolio: {
            userId,
          },
        },
        include: {
          token: {
            select: {
              symbol: true,
              name: true,
              currentPrice: true,
              priceChange24h: true,
              logoUrl: true,
            },
          },
          portfolio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Calculate P&L for each holding
      const holdingsWithPnL = holdings
        .map((holding) => {
          const currentPrice = Number(holding.token.currentPrice || 0);
          const amount = Number(holding.amount);
          const avgBuyPrice = Number(holding.averageBuyPrice || 0);

          const currentValue = currentPrice * amount;
          const costBasis = avgBuyPrice * amount;
          const unrealizedPnL = currentValue - costBasis;
          const unrealizedPnLPercentage = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

          return {
            ...holding,
            currentValue,
            costBasis,
            unrealizedPnL,
            unrealizedPnLPercentage,
          };
        })
        .filter((h) => h.costBasis > 0) // Only holdings with cost basis
        .sort((a, b) => b.unrealizedPnLPercentage - a.unrealizedPnLPercentage)
        .slice(0, limit);

      return holdingsWithPnL;
    } catch (error) {
      logger.error('Failed to get top performing holdings:', error);
      throw new Error('Failed to fetch top performers');
    }
  }

  /**
   * Get holdings summary for a user (aggregated across all portfolios)
   */
  async getUserHoldingsSummary(userId: string) {
    try {
      const holdings = await prisma.holding.findMany({
        where: {
          portfolio: {
            userId,
          },
        },
        include: {
          token: {
            select: {
              symbol: true,
              currentPrice: true,
            },
          },
        },
      });

      let totalValue = 0;
      let totalCost = 0;
      const uniqueTokens = new Set<string>();

      for (const holding of holdings) {
        const currentPrice = Number(holding.token.currentPrice || 0);
        const amount = Number(holding.amount);
        const avgBuyPrice = Number(holding.averageBuyPrice || 0);

        totalValue += currentPrice * amount;
        totalCost += avgBuyPrice * amount;
        uniqueTokens.add(holding.token.symbol);
      }

      const unrealizedPnL = totalValue - totalCost;
      const unrealizedPnLPercentage = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      return {
        totalValue: Math.round(totalValue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
        unrealizedPnLPercentage: Math.round(unrealizedPnLPercentage * 100) / 100,
        totalHoldings: holdings.length,
        uniqueTokens: uniqueTokens.size,
      };
    } catch (error) {
      logger.error('Failed to get user holdings summary:', error);
      throw new Error('Failed to fetch holdings summary');
    }
  }
}

export const holdingsService = new HoldingsService();
