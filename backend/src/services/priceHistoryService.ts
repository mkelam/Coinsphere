import { prisma } from '../lib/prisma.js';
import { cryptocompareService } from './cryptocompare.js';
import { priceAggregatorService } from './priceAggregatorService.js';
import { logger } from '../utils/logger.js';
import { invalidateCache } from '../middleware/cache.js';

/**
 * Price History Aggregation Service
 * Handles historical OHLCV data fetching, storage, and backfilling
 */
class PriceHistoryService {
  /**
   * Backfill historical data for a token
   * Fetches complete OHLCV history and stores in TimescaleDB
   */
  async backfillTokenHistory(
    tokenId: string,
    days: number = 365,
    interval: 'day' | 'hour' | 'minute' = 'day'
  ): Promise<number> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
        select: { id: true, symbol: true },
      });

      if (!token) {
        throw new Error(`Token ${tokenId} not found`);
      }

      logger.info(`Backfilling ${days} days of ${interval} data for ${token.symbol}`);

      // Calculate limit based on interval
      let limit: number;
      switch (interval) {
        case 'minute':
          limit = Math.min(days * 24 * 60, 2000); // Max 2000 for API
          break;
        case 'hour':
          limit = Math.min(days * 24, 2000);
          break;
        case 'day':
        default:
          limit = Math.min(days, 2000);
          break;
      }

      // Fetch historical data from CryptoCompare
      const historicalData = await cryptocompareService.getHistoricalData(
        token.symbol,
        'USD',
        limit,
        interval
      );

      if (historicalData.length === 0) {
        logger.warn(`No historical data found for ${token.symbol}`);
        return 0;
      }

      // Batch insert OHLCV data
      const insertPromises = historicalData.map((candle) =>
        prisma.priceData.upsert({
          where: {
            time_tokenId: {
              time: new Date(candle.time * 1000), // Convert Unix to Date
              tokenId: token.id,
            },
          },
          update: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volumefrom || 0,
          },
          create: {
            tokenId: token.id,
            time: new Date(candle.time * 1000),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volumefrom || 0,
          },
        })
      );

      await Promise.all(insertPromises);

      logger.info(`Backfilled ${historicalData.length} ${interval} candles for ${token.symbol}`);

      // Update token's current price from latest candle
      const latestCandle = historicalData[historicalData.length - 1];
      await prisma.token.update({
        where: { id: token.id },
        data: {
          currentPrice: latestCandle.close,
        },
      });

      // Invalidate cache
      await invalidateCache(`token-history:${token.symbol}:*`);

      return historicalData.length;
    } catch (error) {
      logger.error(`Error backfilling history for token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Backfill historical data for all tokens
   * Used for initial data population
   */
  async backfillAllTokens(
    days: number = 365,
    interval: 'day' | 'hour' | 'minute' = 'day'
  ): Promise<{ success: number; failed: number }> {
    try {
      const tokens = await prisma.token.findMany({
        select: { id: true, symbol: true },
      });

      logger.info(`Starting backfill for ${tokens.length} tokens (${days} days, ${interval} interval)`);

      let success = 0;
      let failed = 0;

      // Process tokens sequentially to avoid rate limiting
      for (const token of tokens) {
        try {
          await this.backfillTokenHistory(token.id, days, interval);
          success++;

          // Rate limiting: wait 250ms between tokens (4 tokens/sec)
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (error) {
          logger.error(`Failed to backfill ${token.symbol}:`, error);
          failed++;
        }
      }

      logger.info(`Backfill complete: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      logger.error('Error in backfillAllTokens:', error);
      throw error;
    }
  }

  /**
   * Update latest OHLCV data for a token (incremental update)
   * Fetches only recent data since last update
   */
  async updateRecentHistory(
    tokenId: string,
    hours: number = 24
  ): Promise<number> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
        select: { id: true, symbol: true },
      });

      if (!token) {
        throw new Error(`Token ${tokenId} not found`);
      }

      // Fetch recent hourly data
      const recentData = await cryptocompareService.getHistoricalData(
        token.symbol,
        'USD',
        hours,
        'hour'
      );

      if (recentData.length === 0) {
        return 0;
      }

      // Upsert recent candles
      const upsertPromises = recentData.map((candle) =>
        prisma.priceData.upsert({
          where: {
            time_tokenId: {
              time: new Date(candle.time * 1000),
              tokenId: token.id,
            },
          },
          update: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volumefrom || 0,
          },
          create: {
            tokenId: token.id,
            time: new Date(candle.time * 1000),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volumefrom || 0,
          },
        })
      );

      await Promise.all(upsertPromises);

      logger.debug(`Updated ${recentData.length} recent candles for ${token.symbol}`);

      // Invalidate cache
      await invalidateCache(`token-history:${token.symbol}:*`);

      return recentData.length;
    } catch (error) {
      logger.error(`Error updating recent history for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Update recent history for all tokens
   * Should be run periodically (e.g., every hour)
   */
  async updateAllRecentHistory(hours: number = 24): Promise<{ success: number; failed: number }> {
    try {
      const tokens = await prisma.token.findMany({
        select: { id: true, symbol: true },
      });

      logger.info(`Updating recent history for ${tokens.length} tokens (${hours} hours)`);

      let success = 0;
      let failed = 0;

      // Process in parallel with controlled concurrency (5 at a time)
      const BATCH_SIZE = 5;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((token) => this.updateRecentHistory(token.id, hours))
        );

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            success++;
          } else {
            logger.error(`Failed to update ${batch[idx].symbol}:`, result.reason);
            failed++;
          }
        });

        // Rate limiting between batches
        if (i + BATCH_SIZE < tokens.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Recent history update complete: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      logger.error('Error in updateAllRecentHistory:', error);
      throw error;
    }
  }

  /**
   * Get aggregated price data for a token
   * Returns data suitable for charting
   */
  async getAggregatedHistory(
    tokenId: string,
    timeframe: '24h' | '7d' | '30d' | '1y' = '7d'
  ): Promise<Array<{
    time: number;
    price: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  }>> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
        select: { id: true, symbol: true },
      });

      if (!token) {
        throw new Error(`Token ${tokenId} not found`);
      }

      // Calculate time range
      const now = new Date();
      let startTime: Date;
      let intervalMinutes: number;

      switch (timeframe) {
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          intervalMinutes = 60; // 1 hour
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          intervalMinutes = 4 * 60; // 4 hours
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          intervalMinutes = 24 * 60; // 1 day
          break;
        case '1y':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          intervalMinutes = 7 * 24 * 60; // 1 week
          break;
        default:
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          intervalMinutes = 4 * 60;
      }

      // Fetch raw data from TimescaleDB
      const priceData = await prisma.priceData.findMany({
        where: {
          tokenId: token.id,
          time: {
            gte: startTime,
          },
        },
        orderBy: {
          time: 'asc',
        },
      });

      // If we have data, return it
      if (priceData.length > 0) {
        return priceData.map((data) => ({
          time: data.time.getTime(),
          price: Number(data.close),
          open: Number(data.open),
          high: Number(data.high),
          low: Number(data.low),
          volume: Number(data.volume),
        }));
      }

      // If no data in database, fetch from API and store
      logger.warn(`No historical data in DB for ${token.symbol}, fetching from API`);

      const days = Math.ceil((now.getTime() - startTime.getTime()) / (24 * 60 * 60 * 1000));
      await this.backfillTokenHistory(token.id, days, timeframe === '24h' ? 'hour' : 'day');

      // Retry query
      const newData = await prisma.priceData.findMany({
        where: {
          tokenId: token.id,
          time: {
            gte: startTime,
          },
        },
        orderBy: {
          time: 'asc',
        },
      });

      return newData.map((data) => ({
        time: data.time.getTime(),
        price: Number(data.close),
        open: Number(data.open),
        high: Number(data.high),
        low: Number(data.low),
        volume: Number(data.volume),
      }));
    } catch (error) {
      logger.error(`Error getting aggregated history for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a token has sufficient historical data
   */
  async hasHistoricalData(tokenId: string, minDays: number = 7): Promise<boolean> {
    try {
      const startTime = new Date(Date.now() - minDays * 24 * 60 * 60 * 1000);

      const count = await prisma.priceData.count({
        where: {
          tokenId,
          time: {
            gte: startTime,
          },
        },
      });

      // Should have at least minDays data points
      return count >= minDays;
    } catch (error) {
      logger.error(`Error checking historical data for ${tokenId}:`, error);
      return false;
    }
  }

  /**
   * Get data freshness status for a token
   */
  async getDataFreshness(tokenId: string): Promise<{
    latestDataTime: Date | null;
    hoursOld: number | null;
    needsUpdate: boolean;
  }> {
    try {
      const latestData = await prisma.priceData.findFirst({
        where: { tokenId },
        orderBy: { time: 'desc' },
        select: { time: true },
      });

      if (!latestData) {
        return {
          latestDataTime: null,
          hoursOld: null,
          needsUpdate: true,
        };
      }

      const hoursOld = (Date.now() - latestData.time.getTime()) / (1000 * 60 * 60);
      const needsUpdate = hoursOld > 2; // Update if data is more than 2 hours old

      return {
        latestDataTime: latestData.time,
        hoursOld,
        needsUpdate,
      };
    } catch (error) {
      logger.error(`Error getting data freshness for ${tokenId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const priceHistoryService = new PriceHistoryService();
