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

interface CryptoCompareSocialStats {
  Data: {
    General: {
      Name: string;
      CoinName: string;
      Points: number; // Overall score (0-100+)
    };
    CryptoCompare: {
      Points: number;
      Followers: number;
      Posts: number;
      Comments: number;
      PageViews: number;
    };
    Twitter: {
      Points: number;
      followers: number;
      statuses: number;
      favourites: number;
      lists: number;
    };
    Reddit: {
      Points: number;
      subscribers: number;
      active_users: number;
      posts_per_hour: number;
      comments_per_hour: number;
    };
    Facebook?: {
      Points: number;
      likes: number;
      talking_about: number;
    };
  };
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
   * Get top N coins with comprehensive market data
   * CryptoCompare /top/mktcapfull supports limit up to 100 per request
   * For larger requests, frontend should fall back to CoinGecko
   */
  async getTopCoinsMarketData(limit: number = 100, currency: string = 'USD'): Promise<any[]> {
    const cacheKey = `cryptocompare:markets:${limit}:${currency}`;

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_MARKET_DATA, // 60s cache
      async () => {
        try {
          // CryptoCompare's /top/mktcapfull endpoint only supports limit up to 100
          // For requests > 100, we throw an error so frontend falls back to CoinGecko
          const requestLimit = Math.min(limit, 100);

          if (limit > 100) {
            logger.warn(`CryptoCompare only supports limit up to 100. Requested: ${limit}. Throwing error for fallback to CoinGecko.`);
            throw new Error(`CryptoCompare only supports limit up to 100 coins`);
          }

          logger.info(`Fetching top ${requestLimit} coins from CryptoCompare...`);

          const response = await this.client.get('/top/mktcapfull', {
            params: {
              limit: requestLimit,
              tsym: currency.toUpperCase(),
            },
          });

          const coins = response.data?.Data || [];

          if (!Array.isArray(coins)) {
            logger.error(`Expected array but got ${typeof coins}`);
            throw new Error('Invalid response format from CryptoCompare');
          }

          logger.debug(`Received ${coins.length} coins from CryptoCompare`);

          // Transform to match CoinGecko format for frontend compatibility
          const transformedCoins = coins.map((coin: any, index: number) => {
            const raw = coin.RAW?.[currency.toUpperCase()];
            const coinInfo = coin.CoinInfo;

            if (!raw || !coinInfo) {
              logger.debug(`Skipping coin ${index} - missing RAW or CoinInfo data`);
              return null;
            }

            return {
              id: coinInfo.Name?.toLowerCase() || coinInfo.Id?.toString(),
              symbol: coinInfo.Name || coinInfo.Internal || '',
              name: coinInfo.FullName || coinInfo.Name || '',
              image: coinInfo.ImageUrl ? `https://www.cryptocompare.com${coinInfo.ImageUrl}` : '',
              current_price: raw.PRICE || 0,
              market_cap: raw.MKTCAP || 0,
              market_cap_rank: index + 1,
              total_volume: raw.TOTALVOLUME24H || raw.VOLUME24HOURTO || 0,
              price_change_percentage_24h: raw.CHANGEPCT24HOUR || 0,
              price_change_percentage_7d: 0, // CryptoCompare doesn't provide 7d change in this endpoint
              circulating_supply: raw.CIRCULATINGSUPPLY || 0,
              total_supply: raw.SUPPLY || null,
              high_24h: raw.HIGH24HOUR || 0,
              low_24h: raw.LOW24HOUR || 0,
            };
          }).filter(Boolean);

          logger.info(`Successfully fetched ${transformedCoins.length} coins from CryptoCompare`);
          return transformedCoins;
        } catch (error) {
          logger.error('Error fetching top coins market data:', error);
          throw error;
        }
      }
    );
  }

  /**
   * Get social stats for a coin (similar to LunarCrush Galaxy Score)
   * Returns a normalized score 0-100
   */
  async getSocialStats(coinId: number): Promise<number> {
    const cacheKey = `cryptocompare:social:${coinId}`;

    return cacheService.getOrSet(
      cacheKey,
      CACHE_TTL.CRYPTOCOMPARE_MARKET_DATA, // 5 min cache
      async () => {
        try {
          const response = await this.client.get<CryptoCompareSocialStats>('/social/coin/latest', {
            params: {
              coinId,
            },
          });

          if (!response.data?.Data) {
            logger.warn(`No social data found for coin ID ${coinId}`);
            return 50; // Return neutral score
          }

          const data = response.data.Data;

          // Calculate a Galaxy Score-like metric from CryptoCompare social data
          // Normalize points to 0-100 range with safe property access
          const generalPoints = Math.min(100, (data.General?.Points || 0) / 10); // General points can be 0-1000+
          const cryptoComparePoints = Math.min(100, (data.CryptoCompare?.Points || 0) / 5);
          const twitterPoints = Math.min(100, (data.Twitter?.Points || 0) / 5);
          const redditPoints = Math.min(100, (data.Reddit?.Points || 0) / 5);

          // Weighted average (similar to Galaxy Score calculation)
          const galaxyScore = Math.round(
            (generalPoints * 0.4) +
            (cryptoComparePoints * 0.2) +
            (twitterPoints * 0.2) +
            (redditPoints * 0.2)
          );

          logger.info(`Social score for coin ${coinId}: ${galaxyScore}`);
          return Math.max(15, Math.min(98, galaxyScore)); // Clamp to realistic range
        } catch (error: any) {
          logger.error(`Error fetching social stats for coin ${coinId}:`, error.message);
          return 50; // Return neutral on error
        }
      }
    );
  }

  /**
   * Get comprehensive social stats for a coin (for risk scoring)
   * Returns Galaxy Score + social sentiment metrics
   */
  async getSocialStatsDetailed(symbol: string): Promise<{
    galaxy_score: number;
    sentiment: number;
    social_volume: number;
    tweets_24h: number;
  }> {
    try {
      // First, get coin ID from symbol
      const coinListResponse = await this.client.get('/all/coinlist');
      const coinList = coinListResponse.data?.Data || {};
      const symbolUpper = symbol.toUpperCase();
      const coinInfo = coinList[symbolUpper];

      if (!coinInfo?.Id) {
        logger.debug(`Coin ID not found for ${symbol}, using defaults`);
        return {
          galaxy_score: 50,
          sentiment: 0,
          social_volume: 0,
          tweets_24h: 0,
        };
      }

      // Get social stats
      const response = await this.client.get<CryptoCompareSocialStats>('/social/coin/latest', {
        params: { coinId: coinInfo.Id },
      });

      if (!response.data?.Data) {
        return {
          galaxy_score: 50,
          sentiment: 0,
          social_volume: 0,
          tweets_24h: 0,
        };
      }

      const data = response.data.Data;

      // Calculate Galaxy Score
      const generalPoints = Math.min(100, (data.General?.Points || 0) / 10);
      const cryptoComparePoints = Math.min(100, (data.CryptoCompare?.Points || 0) / 5);
      const twitterPoints = Math.min(100, (data.Twitter?.Points || 0) / 5);
      const redditPoints = Math.min(100, (data.Reddit?.Points || 0) / 5);

      const galaxyScore = Math.round(
        (generalPoints * 0.4) +
        (cryptoComparePoints * 0.2) +
        (twitterPoints * 0.2) +
        (redditPoints * 0.2)
      );

      // Calculate sentiment (-1 to 1 based on positive vs negative activity)
      const twitterFollowers = data.Twitter?.followers || 0;
      const redditSubscribers = data.Reddit?.subscribers || 0;
      const totalSocial = twitterFollowers + redditSubscribers;
      const sentiment = totalSocial > 10000 ? 0.3 : totalSocial > 1000 ? 0.1 : -0.1;

      // Social volume (total mentions across platforms)
      const socialVolume = (data.CryptoCompare?.PageViews || 0) + twitterFollowers + redditSubscribers;

      // Twitter activity (tweets approximation)
      const tweets24h = data.Twitter?.statuses || 0;

      return {
        galaxy_score: Math.max(15, Math.min(98, galaxyScore)),
        sentiment,
        social_volume: socialVolume,
        tweets_24h: tweets24h,
      };
    } catch (error: any) {
      logger.error(`Error fetching detailed social stats for ${symbol}:`, error.message);
      return {
        galaxy_score: 50,
        sentiment: 0,
        social_volume: 0,
        tweets_24h: 0,
      };
    }
  }

  /**
   * Get batch social scores for multiple symbols
   */
  async getBatchSocialScores(symbols: string[]): Promise<Map<string, number>> {
    const scoresMap = new Map<string, number>();

    try {
      // First, get coin list to map symbols to coin IDs
      const coinListResponse = await this.client.get('/all/coinlist');
      const coinList = coinListResponse.data?.Data || {};

      // Process symbols in batches to respect rate limits
      for (const symbol of symbols) {
        const symbolUpper = symbol.toUpperCase();
        const coinInfo = coinList[symbolUpper];

        if (!coinInfo?.Id) {
          logger.debug(`Coin ID not found for ${symbol}, using default score`);
          scoresMap.set(symbol.toUpperCase(), 50);
          continue;
        }

        try {
          const score = await this.getSocialStats(coinInfo.Id);
          scoresMap.set(symbol.toUpperCase(), score);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, this.requestDelay));
        } catch (error) {
          logger.warn(`Failed to get social score for ${symbol}, using default`);
          scoresMap.set(symbol.toUpperCase(), 50);
        }
      }

      return scoresMap;
    } catch (error) {
      logger.error('Error fetching batch social scores:', error);
      // Return default scores for all symbols
      symbols.forEach(symbol => scoresMap.set(symbol.toUpperCase(), 50));
      return scoresMap;
    }
  }

  /**
   * Get trending coins based on market activity and social scores
   * CryptoCompare alternative to LunarCrush trending
   */
  async getTrendingCoins(limit: number = 10): Promise<any[]> {
    // TEMPORARY: Return mock trending data while debugging API issue
    // TODO: Fix CryptoCompare API response parsing
    logger.info(`[CryptoCompare] Returning mock trending coins (limit: ${limit})`);

    const mockTrending = [
      { symbol: 'BTC', name: 'Bitcoin', galaxy_score: 98, social_volume: 721845, sentiment: 0.38, tweets_24h: 216554, trending_rank: 1 },
      { symbol: 'ETH', name: 'Ethereum', galaxy_score: 95, social_volume: 361886, sentiment: 0.35, tweets_24h: 108566, trending_rank: 2 },
      { symbol: 'SOL', name: 'Solana', galaxy_score: 92, social_volume: 134233, sentiment: 0.42, tweets_24h: 40270, trending_rank: 3 },
      { symbol: 'XRP', name: 'XRP', galaxy_score: 89, social_volume: 95282, sentiment: 0.28, tweets_24h: 28585, trending_rank: 4 },
      { symbol: 'BNB', name: 'Binance Coin', galaxy_score: 87, social_volume: 1969, sentiment: 0.31, tweets_24h: 591, trending_rank: 5 },
      { symbol: 'ADA', name: 'Cardano', galaxy_score: 84, social_volume: 45123, sentiment: 0.25, tweets_24h: 13537, trending_rank: 6 },
      { symbol: 'DOGE', name: 'Dogecoin', galaxy_score: 82, social_volume: 78456, sentiment: 0.45, tweets_24h: 23537, trending_rank: 7 },
      { symbol: 'AVAX', name: 'Avalanche', galaxy_score: 79, social_volume: 32456, sentiment: 0.22, tweets_24h: 9737, trending_rank: 8 },
      { symbol: 'DOT', name: 'Polkadot', galaxy_score: 76, social_volume: 28945, sentiment: 0.18, tweets_24h: 8684, trending_rank: 9 },
      { symbol: 'MATIC', name: 'Polygon', galaxy_score: 73, social_volume: 41234, sentiment: 0.29, tweets_24h: 12370, trending_rank: 10 },
    ];

    return mockTrending.slice(0, limit);
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
