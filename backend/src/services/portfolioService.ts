/**
 * Portfolio Service
 * Handles all portfolio CRUD operations and analytics
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { toDecimal, multiply, add, subtract, percentage, toNumber } from '../utils/decimal.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

export interface CreatePortfolioData {
  userId: string;
  name: string;
  description?: string;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
}

export interface PortfolioWithStats {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  holdings: {
    id: string;
    amount: number;
    averageBuyPrice: number | null;
    token: {
      symbol: string;
      name: string;
      currentPrice: number | null;
    };
  }[];
  stats: {
    totalValue: number;
    totalCost: number;
    profitLoss: number;
    profitLossPercentage: number;
    holdingsCount: number;
  };
}

class PortfolioService {
  /**
   * Create a new portfolio for a user
   */
  async createPortfolio(data: CreatePortfolioData) {
    try {
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: data.userId,
          name: data.name,
          description: data.description || null,
        },
        include: {
          holdings: {
            include: {
              token: true,
            },
          },
        },
      });

      logger.info('Portfolio created', { portfolioId: portfolio.id, userId: data.userId, name: data.name });
      return portfolio;
    } catch (error) {
      logger.error('Failed to create portfolio:', error);
      throw new Error('Failed to create portfolio');
    }
  }

  /**
   * Get a portfolio by ID with full holdings details
   */
  async getPortfolioById(portfolioId: string, userId: string) {
    try {
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId: userId, // Ensure user owns this portfolio
        },
        include: {
          holdings: {
            include: {
              token: {
                select: {
                  id: true,
                  symbol: true,
                  name: true,
                  currentPrice: true,
                  priceChange24h: true,
                  logoUrl: true,
                },
              },
            },
          },
          transactions: {
            include: {
              token: {
                select: {
                  symbol: true,
                  name: true,
                },
              },
            },
            orderBy: {
              timestamp: 'desc',
            },
            take: 10, // Last 10 transactions
          },
        },
      });

      if (!portfolio) {
        return null;
      }

      // Calculate portfolio statistics
      const stats = this.calculatePortfolioStats(portfolio);

      return {
        ...portfolio,
        stats,
      };
    } catch (error) {
      logger.error('Failed to get portfolio:', error);
      throw new Error('Failed to fetch portfolio');
    }
  }

  /**
   * Get all portfolios for a user with basic stats
   */
  async getUserPortfolios(userId: string) {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: { userId },
        include: {
          holdings: {
            include: {
              token: {
                select: {
                  symbol: true,
                  name: true,
                  currentPrice: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate stats for each portfolio
      const portfoliosWithStats = portfolios.map((portfolio) => ({
        ...portfolio,
        stats: this.calculatePortfolioStats(portfolio),
      }));

      return portfoliosWithStats;
    } catch (error) {
      logger.error('Failed to get user portfolios:', error);
      throw new Error('Failed to fetch portfolios');
    }
  }

  /**
   * Update a portfolio
   */
  async updatePortfolio(portfolioId: string, userId: string, data: UpdatePortfolioData) {
    try {
      // Verify ownership
      const existing = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId },
      });

      if (!existing) {
        return null;
      }

      const portfolio = await prisma.portfolio.update({
        where: { id: portfolioId },
        data: {
          name: data.name,
          description: data.description,
        },
        include: {
          holdings: {
            include: {
              token: true,
            },
          },
        },
      });

      logger.info('Portfolio updated', { portfolioId, userId });
      return portfolio;
    } catch (error) {
      logger.error('Failed to update portfolio:', error);
      throw new Error('Failed to update portfolio');
    }
  }

  /**
   * Delete a portfolio (cascade deletes holdings and transactions)
   */
  async deletePortfolio(portfolioId: string, userId: string) {
    try {
      // Verify ownership
      const existing = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId },
      });

      if (!existing) {
        return null;
      }

      await prisma.portfolio.delete({
        where: { id: portfolioId },
      });

      logger.info('Portfolio deleted', { portfolioId, userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete portfolio:', error);
      throw new Error('Failed to delete portfolio');
    }
  }

  /**
   * Calculate portfolio statistics using Decimal for precision
   */
  private calculatePortfolioStats(portfolio: any) {
    let totalValue = new Decimal(0);
    let totalCost = new Decimal(0);
    let holdingsCount = 0;

    for (const holding of portfolio.holdings) {
      holdingsCount++;

      const currentPrice = toDecimal(holding.token.currentPrice);
      const averageBuyPrice = toDecimal(holding.averageBuyPrice);
      const amount = toDecimal(holding.amount);

      // Use precise Decimal multiplication and addition
      totalValue = totalValue.plus(multiply(currentPrice, amount));
      totalCost = totalCost.plus(multiply(averageBuyPrice, amount));
    }

    const profitLoss = subtract(totalValue, totalCost);
    const profitLossPercentage = totalCost.greaterThan(0)
      ? percentage(profitLoss, totalCost)
      : new Decimal(0);

    return {
      totalValue: toNumber(totalValue, 2),
      totalCost: toNumber(totalCost, 2),
      profitLoss: toNumber(profitLoss, 2),
      profitLossPercentage: toNumber(profitLossPercentage, 2),
      holdingsCount,
    };
  }

  /**
   * Get portfolio performance over time
   */
  async getPortfolioPerformance(portfolioId: string, userId: string, days: number = 30) {
    try {
      // Verify ownership
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId },
      });

      if (!portfolio) {
        return null;
      }

      // Get all transactions for this portfolio in the time range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const transactions = await prisma.transaction.findMany({
        where: {
          portfolioId,
          timestamp: {
            gte: startDate,
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
        orderBy: {
          timestamp: 'asc',
        },
      });

      logger.info('Portfolio performance fetched', { portfolioId, days, transactionCount: transactions.length });
      return transactions;
    } catch (error) {
      logger.error('Failed to get portfolio performance:', error);
      throw new Error('Failed to fetch portfolio performance');
    }
  }

  /**
   * Get portfolio allocation breakdown by token
   */
  async getPortfolioAllocation(portfolioId: string, userId: string) {
    try {
      const portfolio = await prisma.portfolio.findFirst({
        where: { id: portfolioId, userId },
        include: {
          holdings: {
            include: {
              token: {
                select: {
                  symbol: true,
                  name: true,
                  currentPrice: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!portfolio) {
        return null;
      }

      // Calculate total portfolio value using Decimal for precision
      let totalValue = new Decimal(0);
      const allocations: Array<{
        symbol: string;
        name: string;
        logoUrl: string | null;
        amount: number;
        value: number;
        percentage: number;
      }> = [];

      for (const holding of portfolio.holdings) {
        const currentPrice = toDecimal(holding.token.currentPrice);
        const amount = toDecimal(holding.amount);
        const value = multiply(currentPrice, amount);
        totalValue = totalValue.plus(value);
      }

      // Calculate percentages
      for (const holding of portfolio.holdings) {
        const currentPrice = toDecimal(holding.token.currentPrice);
        const amount = toDecimal(holding.amount);
        const value = multiply(currentPrice, amount);
        const pct = totalValue.greaterThan(0)
          ? percentage(value, totalValue)
          : new Decimal(0);

        allocations.push({
          symbol: holding.token.symbol,
          name: holding.token.name,
          logoUrl: holding.token.logoUrl,
          amount: toNumber(amount, 8),
          value: toNumber(value, 2),
          percentage: toNumber(pct, 2),
        });
      }

      // Sort by value descending
      allocations.sort((a, b) => b.value - a.value);

      return {
        totalValue: toNumber(totalValue, 2),
        allocations,
      };
    } catch (error) {
      logger.error('Failed to get portfolio allocation:', error);
      throw new Error('Failed to fetch portfolio allocation');
    }
  }
}

export const portfolioService = new PortfolioService();
