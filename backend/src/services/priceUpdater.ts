import { prisma } from '../lib/prisma.js';
import { priceAggregatorService } from './priceAggregatorService.js';
import { priceHistoryService } from './priceHistoryService.js';
import { logger } from '../utils/logger.js';
import { invalidateCache } from '../middleware/cache.js';

class PriceUpdaterService {
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY_MS = 60000; // 1 minute

  /**
   * Start periodic price updates
   */
  start() {
    if (this.updateInterval) {
      logger.warn('Price updater already running');
      return;
    }

    logger.info('Starting price updater service');

    // Run immediately on start
    this.updateAllTokenPrices();

    // Then run periodically
    this.updateInterval = setInterval(() => {
      this.updateAllTokenPrices();
    }, this.UPDATE_FREQUENCY_MS);
  }

  /**
   * Stop periodic updates
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Price updater service stopped');
    }
  }

  /**
   * Update prices for all tokens in database
   * Uses price aggregator service (CryptoCompare primary, CoinGecko fallback)
   */
  async updateAllTokenPrices(): Promise<void> {
    try {
      // Get all tokens
      const tokens = await prisma.token.findMany({
        select: {
          id: true,
          symbol: true,
        },
      });

      if (tokens.length === 0) {
        logger.warn('No tokens found');
        return;
      }

      logger.info(`Updating prices for ${tokens.length} tokens`);

      // Get prices using price aggregator (CryptoCompare/CoinGecko)
      const symbols = tokens.map((t) => t.symbol);
      const priceResults = await priceAggregatorService.getPrices(symbols);

      // Update each token in database
      const updatePromises = priceResults.map(async (priceData) => {
        const token = tokens.find((t) => t.symbol === priceData.symbol);
        if (!token) return;

        try {
          await prisma.token.update({
            where: { id: token.id },
            data: {
              currentPrice: priceData.price,
            },
          });

          logger.debug(`Updated ${token.symbol}: $${priceData.price} (source: ${priceData.source})`);
        } catch (error) {
          logger.error(`Error updating token ${token.symbol}:`, error);
        }
      });

      await Promise.all(updatePromises);
      logger.info(`Successfully updated prices for ${priceResults.length} tokens`);

      // Invalidate cache for token data
      await invalidateCache('tokens:*');
      await invalidateCache('token:*');
    } catch (error) {
      logger.error('Error in updateAllTokenPrices:', error);
    }
  }

  /**
   * Update historical data for all tokens (hourly job)
   * Fetches last 24 hours of OHLCV data
   */
  async updateAllHistoricalData(): Promise<void> {
    try {
      logger.info('Starting historical data update for all tokens');

      const result = await priceHistoryService.updateAllRecentHistory(24);

      logger.info(`Historical data update complete: ${result.success} success, ${result.failed} failed`);

      // Invalidate cache for historical data
      await invalidateCache('token-history:*');
    } catch (error) {
      logger.error('Error in updateAllHistoricalData:', error);
    }
  }

  /**
   * Update price for a single token
   */
  async updateTokenPrice(tokenId: string): Promise<void> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
        select: {
          id: true,
          symbol: true,
        },
      });

      if (!token) {
        logger.warn(`Token ${tokenId} not found`);
        return;
      }

      // Get price using price aggregator
      const priceData = await priceAggregatorService.getPrice(token.symbol);

      await prisma.token.update({
        where: { id: token.id },
        data: {
          currentPrice: priceData.price,
        },
      });

      logger.info(`Updated ${token.symbol}: $${priceData.price} (source: ${priceData.source})`);
    } catch (error) {
      logger.error(`Error updating token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch and store OHLC data for a token
   * Uses price history service with CryptoCompare
   */
  async fetchOHLCData(tokenId: string, days: number = 1): Promise<void> {
    try {
      const count = await priceHistoryService.backfillTokenHistory(
        tokenId,
        days,
        days === 1 ? 'hour' : 'day'
      );

      logger.info(`Stored ${count} OHLC candles for token ${tokenId}`);
    } catch (error) {
      logger.error(`Error fetching OHLC data for ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Backfill all historical data (initial setup)
   * Run this once to populate historical data for all tokens
   */
  async backfillAllHistory(days: number = 365): Promise<void> {
    try {
      logger.info(`Starting backfill of ${days} days for all tokens`);

      const result = await priceHistoryService.backfillAllTokens(days, 'day');

      logger.info(`Backfill complete: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      logger.error('Error in backfillAllHistory:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const priceUpdaterService = new PriceUpdaterService();
