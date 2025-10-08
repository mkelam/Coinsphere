import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

interface CoinGeckoOHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class CoinGeckoService {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly requestDelay = 1100; // Rate limit: ~60 requests/min on free tier
  private lastRequestTime = 0;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        ...(config.api.coingecko && {
          'x-cg-pro-api-key': config.api.coingecko,
        }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          logger.warn('CoinGecko rate limit exceeded');
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        logger.error('CoinGecko API error:', error.message);
        throw error;
      }
    );
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      const delay = this.requestDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get current market data for multiple coins
   */
  async getMarketData(coinIds: string[]): Promise<CoinGeckoPrice[]> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });

      logger.info(`Fetched market data for ${response.data.length} coins`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching market data:', error);
      throw error;
    }
  }

  /**
   * Get single coin details
   */
  async getCoinDetails(coinId: string) {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching coin details for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Get OHLC data for a coin (historical candles)
   */
  async getOHLC(coinId: string, days: number = 1): Promise<CoinGeckoOHLCV[]> {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get(`/coins/${coinId}/ohlc`, {
        params: {
          vs_currency: 'usd',
          days,
        },
      });

      // CoinGecko returns [timestamp, open, high, low, close]
      const ohlcData = response.data.map((candle: number[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0, // Volume not included in basic OHLC endpoint
      }));

      logger.info(`Fetched ${ohlcData.length} OHLC candles for ${coinId}`);
      return ohlcData;
    } catch (error) {
      logger.error(`Error fetching OHLC for ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Get simple price for quick lookups
   */
  async getSimplePrice(coinIds: string[], vsCurrencies: string[] = ['usd']) {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get('/simple/price', {
        params: {
          ids: coinIds.join(','),
          vs_currencies: vsCurrencies.join(','),
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching simple price:', error);
      throw error;
    }
  }

  /**
   * Search for coins by query
   */
  async searchCoins(query: string) {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get('/search', {
        params: { query },
      });

      return response.data.coins;
    } catch (error) {
      logger.error('Error searching coins:', error);
      throw error;
    }
  }

  /**
   * Get list of all supported coins
   */
  async getCoinsList() {
    await this.enforceRateLimit();

    try {
      const response = await this.client.get('/coins/list');
      return response.data;
    } catch (error) {
      logger.error('Error fetching coins list:', error);
      throw error;
    }
  }

  /**
   * Ping API to check status
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.get('/ping');
      return response.data?.gecko_says === '(V3) To the Moon!';
    } catch (error) {
      logger.error('CoinGecko ping failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const coingeckoService = new CoinGeckoService();
