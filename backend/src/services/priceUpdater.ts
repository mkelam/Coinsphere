import { prisma } from '../lib/prisma.js';
import { coingeckoService } from './coingecko.js';
import { logger } from '../utils/logger.js';

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
   */
  async updateAllTokenPrices(): Promise<void> {
    try {
      // Get all tokens with CoinGecko IDs
      const tokens = await prisma.token.findMany({
        where: {
          coingeckoId: {
            not: null,
          },
        },
        select: {
          id: true,
          symbol: true,
          coingeckoId: true,
        },
      });

      if (tokens.length === 0) {
        logger.warn('No tokens with CoinGecko IDs found');
        return;
      }

      const coinIds = tokens
        .map((t) => t.coingeckoId)
        .filter((id): id is string => id !== null);

      logger.info(`Updating prices for ${coinIds.length} tokens`);

      // Fetch market data from CoinGecko
      const marketData = await coingeckoService.getMarketData(coinIds);

      // Update each token in database
      const updatePromises = marketData.map(async (coinData) => {
        const token = tokens.find((t) => t.coingeckoId === coinData.id);
        if (!token) return;

        try {
          await prisma.token.update({
            where: { id: token.id },
            data: {
              currentPrice: coinData.current_price,
              marketCap: coinData.market_cap,
              volume24h: coinData.total_volume,
              priceChange24h: coinData.price_change_percentage_24h,
            },
          });

          // Also store historical price data (upsert to avoid duplicates)
          const priceTime = new Date(coinData.last_updated);
          await prisma.priceData.upsert({
            where: {
              time_tokenId: {
                time: priceTime,
                tokenId: token.id,
              },
            },
            update: {
              open: coinData.current_price,
              high: coinData.current_price,
              low: coinData.current_price,
              close: coinData.current_price,
              volume: coinData.total_volume,
            },
            create: {
              tokenId: token.id,
              time: priceTime,
              open: coinData.current_price,
              high: coinData.current_price,
              low: coinData.current_price,
              close: coinData.current_price,
              volume: coinData.total_volume,
            },
          });

          logger.debug(`Updated ${token.symbol}: $${coinData.current_price}`);
        } catch (error) {
          logger.error(`Error updating token ${token.symbol}:`, error);
        }
      });

      await Promise.all(updatePromises);
      logger.info(`Successfully updated prices for ${marketData.length} tokens`);
    } catch (error) {
      logger.error('Error in updateAllTokenPrices:', error);
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
          coingeckoId: true,
        },
      });

      if (!token || !token.coingeckoId) {
        logger.warn(`Token ${tokenId} not found or missing CoinGecko ID`);
        return;
      }

      const marketData = await coingeckoService.getMarketData([token.coingeckoId]);

      if (marketData.length === 0) {
        logger.warn(`No market data found for ${token.symbol}`);
        return;
      }

      const coinData = marketData[0];

      await prisma.token.update({
        where: { id: token.id },
        data: {
          currentPrice: coinData.current_price,
          marketCap: coinData.market_cap,
          volume24h: coinData.total_volume,
          priceChange24h: coinData.price_change_percentage_24h,
        },
      });

      await prisma.priceData.create({
        data: {
          tokenId: token.id,
          time: new Date(coinData.last_updated),
          open: coinData.current_price,
          high: coinData.current_price,
          low: coinData.current_price,
          close: coinData.current_price,
          volume: coinData.total_volume,
        },
      });

      logger.info(`Updated ${token.symbol}: $${coinData.current_price}`);
    } catch (error) {
      logger.error(`Error updating token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch and store OHLC data for a token
   */
  async fetchOHLCData(tokenId: string, days: number = 1): Promise<void> {
    try {
      const token = await prisma.token.findUnique({
        where: { id: tokenId },
        select: { id: true, symbol: true, coingeckoId: true },
      });

      if (!token || !token.coingeckoId) {
        logger.warn(`Token ${tokenId} not found or missing CoinGecko ID`);
        return;
      }

      const ohlcData = await coingeckoService.getOHLC(token.coingeckoId, days);

      const insertPromises = ohlcData.map((candle) =>
        prisma.priceData.upsert({
          where: {
            time_tokenId: {
              time: new Date(candle.timestamp),
              tokenId: token.id,
            },
          },
          update: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
          },
          create: {
            tokenId: token.id,
            time: new Date(candle.timestamp),
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
          },
        })
      );

      await Promise.all(insertPromises);
      logger.info(`Stored ${ohlcData.length} OHLC candles for ${token.symbol}`);
    } catch (error) {
      logger.error(`Error fetching OHLC data for ${tokenId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const priceUpdaterService = new PriceUpdaterService();
