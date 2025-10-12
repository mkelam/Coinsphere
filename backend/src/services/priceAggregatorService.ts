import { cryptocompareService } from './cryptocompare.js';
import { coingeckoService } from './coingecko.js';
import { logger } from '../utils/logger.js';

/**
 * Multi-source price aggregation service
 * Primary: CryptoCompare (faster, more detailed)
 * Fallback: CoinGecko (backup)
 */
class PriceAggregatorService {
  private readonly symbolMap: { [key: string]: string } = {
    // Add any symbol mappings if needed
    // Example: 'BTC': 'bitcoin'
  };

  /**
   * Get price from multiple sources with fallback
   */
  async getPrice(
    symbol: string,
    currency: string = 'USD'
  ): Promise<{ price: number; source: string; timestamp: number }> {
    const startTime = Date.now();

    try {
      // Primary: CryptoCompare
      const price = await cryptocompareService.getSinglePrice(symbol, currency);
      const responseTime = Date.now() - startTime;

      logger.info(`Price fetched from CryptoCompare for ${symbol}`, {
        price,
        responseTime: `${responseTime}ms`,
      });

      return {
        price,
        source: 'cryptocompare',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.warn(`CryptoCompare failed for ${symbol}, falling back to CoinGecko`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      try {
        // Fallback: CoinGecko
        const coinId = this.symbolMap[symbol] || symbol.toLowerCase();
        const result = await coingeckoService.getSimplePrice([coinId], [currency.toLowerCase()]);
        const price = result[coinId][currency.toLowerCase()];
        const responseTime = Date.now() - startTime;

        logger.info(`Price fetched from CoinGecko (fallback) for ${symbol}`, {
          price,
          responseTime: `${responseTime}ms`,
        });

        return {
          price,
          source: 'coingecko',
          timestamp: Date.now(),
        };
      } catch (fallbackError) {
        logger.error(`Both price sources failed for ${symbol}`, {
          primary: error instanceof Error ? error.message : 'Unknown error',
          fallback: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        });
        throw new Error(`Failed to fetch price for ${symbol} from all sources`);
      }
    }
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(
    symbols: string[],
    currency: string = 'USD'
  ): Promise<Array<{ symbol: string; price: number; source: string; timestamp: number }>> {
    try {
      // Try CryptoCompare first for all symbols
      const prices = await Promise.all(
        symbols.map(symbol => this.getPrice(symbol, currency))
      );

      return symbols.map((symbol, index) => ({
        symbol,
        ...prices[index],
      }));
    } catch (error) {
      logger.error('Error fetching multiple prices:', error);
      throw error;
    }
  }

  /**
   * Get detailed market data from best available source
   */
  async getMarketData(symbols: string[]) {
    try {
      // Primary: CryptoCompare (more detailed)
      const data = await cryptocompareService.getMarketData(symbols);

      logger.info(`Market data fetched from CryptoCompare for ${symbols.length} symbols`);

      return data.map(item => ({
        ...item,
        source: 'cryptocompare',
      }));
    } catch (error) {
      logger.warn('CryptoCompare market data failed, falling back to CoinGecko', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      try {
        // Fallback: CoinGecko
        const coinIds = symbols.map(s => this.symbolMap[s] || s.toLowerCase());
        const data = await coingeckoService.getMarketData(coinIds);

        logger.info(`Market data fetched from CoinGecko (fallback) for ${symbols.length} symbols`);

        return data.map((item: any) => ({
          symbol: item.symbol.toUpperCase(),
          price: item.current_price,
          priceDisplay: `$${item.current_price.toLocaleString()}`,
          change24h: item.price_change_24h,
          changePct24h: item.price_change_percentage_24h,
          marketCap: item.market_cap,
          marketCapDisplay: `$${(item.market_cap / 1e9).toFixed(2)}B`,
          volume24h: item.total_volume,
          volume24hDisplay: `$${(item.total_volume / 1e9).toFixed(2)}B`,
          high24h: item.high_24h,
          low24h: item.low_24h,
          lastUpdate: new Date(item.last_updated).getTime() / 1000,
          source: 'coingecko',
        }));
      } catch (fallbackError) {
        logger.error('Both market data sources failed', {
          primary: error instanceof Error ? error.message : 'Unknown error',
          fallback: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        });
        throw new Error('Failed to fetch market data from all sources');
      }
    }
  }

  /**
   * Get historical OHLCV data
   */
  async getHistoricalData(
    symbol: string,
    interval: 'day' | 'hour' | 'minute' = 'hour',
    limit: number = 100
  ) {
    try {
      // Primary: CryptoCompare
      const data = await cryptocompareService.getHistoricalData(symbol, 'USD', limit, interval);

      logger.info(`Historical data fetched from CryptoCompare for ${symbol}`);

      return data.map((candle: any) => ({
        timestamp: candle.time * 1000,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volumeto,
        source: 'cryptocompare',
      }));
    } catch (error) {
      logger.warn('CryptoCompare historical data failed, falling back to CoinGecko', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      try {
        // Fallback: CoinGecko
        const coinId = this.symbolMap[symbol] || symbol.toLowerCase();
        const days = interval === 'day' ? limit : Math.ceil(limit / 24);
        const data = await coingeckoService.getOHLC(coinId, days);

        logger.info(`Historical data fetched from CoinGecko (fallback) for ${symbol}`);

        return data.map((candle: any) => ({
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0,
          source: 'coingecko',
        }));
      } catch (fallbackError) {
        logger.error('Both historical data sources failed', {
          primary: error instanceof Error ? error.message : 'Unknown error',
          fallback: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        });
        throw new Error(`Failed to fetch historical data for ${symbol} from all sources`);
      }
    }
  }

  /**
   * Health check - tests both services
   */
  async healthCheck(): Promise<{
    cryptocompare: boolean;
    coingecko: boolean;
    overall: boolean;
  }> {
    const [cryptocompareHealth, coingeckoHealth] = await Promise.all([
      cryptocompareService.ping().catch(() => false),
      coingeckoService.ping().catch(() => false),
    ]);

    const overall = cryptocompareHealth || coingeckoHealth;

    logger.info('Price aggregator health check', {
      cryptocompare: cryptocompareHealth,
      coingecko: coingeckoHealth,
      overall,
    });

    return {
      cryptocompare: cryptocompareHealth,
      coingecko: coingeckoHealth,
      overall,
    };
  }
}

// Export singleton instance
export const priceAggregatorService = new PriceAggregatorService();
