import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService.js';

interface CryptoComparePrice {
  [currency: string]: number;
}

interface CryptoComparePriceFull {
  RAW: {
    [symbol: string]: {
      [currency: string]: {
        TYPE: string;
        MARKET: string;
        FROMSYMBOL: string;
        TOSYMBOL: string;
        PRICE: number;
        LASTUPDATE: number;
        LASTVOLUME: number;
        LASTVOLUMETO: number;
        VOLUMEHOUR: number;
        VOLUMEHOURTO: number;
        OPENHOUR: number;
        HIGHHOUR: number;
        LOWHOUR: number;
        VOLUMEDAY: number;
        VOLUMEDAYTO: number;
        OPENDAY: number;
        HIGHDAY: number;
        LOWDAY: number;
        VOLUME24HOUR: number;
        VOLUME24HOURTO: number;
        OPEN24HOUR: number;
        HIGH24HOUR: number;
        LOW24HOUR: number;
        CHANGE24HOUR: number;
        CHANGEPCT24HOUR: number;
        CHANGEDAY: number;
        CHANGEPCTDAY: number;
        CHANGEHOUR: number;
        CHANGEPCTHOUR: number;
        MKTCAP: number;
        SUPPLY: number;
        CIRCULATINGSUPPLY: number;
        TOTALVOLUME24H: number;
        TOTALVOLUME24HTO: number;
      };
    };
  };
  DISPLAY: {
    [symbol: string]: {
      [currency: string]: {
        FROMSYMBOL: string;
        TOSYMBOL: string;
        PRICE: string;
        CHANGE24HOUR: string;
        CHANGEPCT24HOUR: string;
        MKTCAP: string;
        VOLUME24HOURTO: string;
        [key: string]: string;
      };
    };
  };
}

interface CryptoCompareOHLCV {
  time: number;
  close: number;
  high: number;
  low: number;
  open: number;
  volumefrom: number;
  volumeto: number;
}

class CryptoCompareService {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://min-api.cryptocompare.com/data';
  private readonly requestDelay = 50; // Very generous rate limit on free tier

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        ...(config.api.cryptocompare && {
          'Authorization': `Apikey ${config.api.cryptocompare}`,
        }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('CryptoCompare rate limit exceeded');
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        logger.error('CryptoCompare API error:', error.message);
        throw error;
      }
    );
  }

  /**
   * Get simple price for quick lookups
   */
  async getSimplePrice(
    symbols: string[],
    currencies: string[] = ['USD']
  ): Promise<{ [symbol: string]: CryptoComparePrice }> {
    const cacheKey = CACHE_KEYS.CRYPTOCOMPARE_PRICES(
      symbols.sort().join(','),
      currencies.join(',')
    );

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_PRICES,
      async () => {
        try {
          const response = await this.client.get('/price', {
            params: {
              fsym: symbols.join(','),
              tsyms: currencies.join(','),
            },
          });

          logger.info(`Fetched CryptoCompare price for ${symbols.length} symbols`);
          return response.data;
        } catch (error) {
          logger.error('Error fetching CryptoCompare price:', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get comprehensive price data with market stats
   */
  async getPriceFull(
    symbols: string[],
    currencies: string[] = ['USD']
  ): Promise<CryptoComparePriceFull> {
    const cacheKey = CACHE_KEYS.CRYPTOCOMPARE_MARKET_DATA(
      symbols.sort().join(','),
      currencies.join(',')
    );

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_MARKET_DATA,
      async () => {
        try {
          const response = await this.client.get('/pricemultifull', {
            params: {
              fsyms: symbols.join(','),
              tsyms: currencies.join(','),
            },
          });

          logger.info(`Fetched CryptoCompare full data for ${symbols.length} symbols`);
          return response.data;
        } catch (error) {
          logger.error('Error fetching CryptoCompare full data:', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get single coin price (optimized for single lookups)
   */
  async getSinglePrice(symbol: string, currency: string = 'USD'): Promise<number> {
    try {
      const response = await this.client.get('/price', {
        params: {
          fsym: symbol.toUpperCase(),
          tsyms: currency.toUpperCase(),
        },
      });

      return response.data[currency.toUpperCase()];
    } catch (error) {
      logger.error(`Error fetching price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get OHLCV historical data
   */
  async getHistoricalData(
    symbol: string,
    currency: string = 'USD',
    limit: number = 100,
    interval: 'day' | 'hour' | 'minute' = 'hour'
  ): Promise<CryptoCompareOHLCV[]> {
    const cacheKey = CACHE_KEYS.CRYPTOCOMPARE_OHLCV(symbol, currency, interval, limit);

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_OHLCV,
      async () => {
        try {
          const endpoint =
            interval === 'day' ? '/v2/histoday' :
            interval === 'hour' ? '/v2/histohour' :
            '/v2/histominute';

          const response = await this.client.get(endpoint, {
            params: {
              fsym: symbol.toUpperCase(),
              tsym: currency.toUpperCase(),
              limit,
            },
          });

          if (response.data.Response === 'Error') {
            throw new Error(response.data.Message || 'CryptoCompare API error');
          }

          logger.info(`Fetched ${response.data.Data.Data.length} ${interval} candles for ${symbol}`);
          return response.data.Data.Data;
        } catch (error) {
          logger.error(`Error fetching OHLCV for ${symbol}:`, error);
          throw error;
        }
      }
    );
  }

  /**
   * Get multiple coins with detailed market data
   */
  async getMarketData(symbols: string[]): Promise<any[]> {
    try {
      const fullData = await this.getPriceFull(symbols);

      const marketData = symbols.map(symbol => {
        const symbolUpper = symbol.toUpperCase();
        const raw = fullData.RAW?.[symbolUpper]?.USD;
        const display = fullData.DISPLAY?.[symbolUpper]?.USD;

        if (!raw || !display) {
          logger.warn(`No data found for ${symbol}`);
          return null;
        }

        return {
          symbol: symbolUpper,
          price: raw.PRICE,
          priceDisplay: display.PRICE,
          change24h: raw.CHANGE24HOUR,
          changePct24h: raw.CHANGEPCT24HOUR,
          marketCap: raw.MKTCAP,
          marketCapDisplay: display.MKTCAP,
          volume24h: raw.VOLUME24HOURTO,
          volume24hDisplay: display.VOLUME24HOURTO,
          supply: raw.SUPPLY,
          circulatingSupply: raw.CIRCULATINGSUPPLY,
          high24h: raw.HIGH24HOUR,
          low24h: raw.LOW24HOUR,
          open24h: raw.OPEN24HOUR,
          lastUpdate: raw.LASTUPDATE,
        };
      }).filter(Boolean);

      return marketData;
    } catch (error) {
      logger.error('Error fetching market data:', error);
      throw error;
    }
  }

  /**
   * Get top coins by market cap
   */
  async getTopCoins(limit: number = 10, currency: string = 'USD'): Promise<any[]> {
    const cacheKey = `cryptocompare:top:${limit}:${currency}`;

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_MARKET_DATA,
      async () => {
        try {
          const response = await this.client.get('/top/mktcapfull', {
            params: {
              limit,
              tsym: currency.toUpperCase(),
            },
          });

          logger.info(`Fetched top ${limit} coins by market cap`);
          return response.data.Data;
        } catch (error) {
          logger.error('Error fetching top coins:', error);
          throw error;
        }
      }
    );
  }

  /**
   * Ping API to check status
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/price', {
        params: {
          fsym: 'BTC',
          tsyms: 'USD',
        },
      });
      return !!response.data?.USD;
    } catch (error) {
      logger.error('CryptoCompare ping failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cryptocompareService = new CryptoCompareService();
