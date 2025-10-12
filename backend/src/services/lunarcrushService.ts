/**
 * LunarCrush Service - Social Sentiment & Galaxy Score
 * Integrates with LunarCrush API v4 for social metrics
 */

import axios from 'axios';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

const redisClient = getRedisClient();

const LUNARCRUSH_API_BASE = 'https://lunarcrush.com/api4/public';
const CACHE_TTL = 900; // 15 minutes (LunarCrush updates every 15 min)

interface LunarCrushCoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  price_btc: number;
  market_cap: number;
  volume_24h: number;
  galaxy_score: number;
  alt_rank: number;
  social_dominance: number;
  social_volume: number;
  social_volume_24h_percent_change: number;
  social_contributors: number;
  social_contributors_24h_percent_change: number;
  tweets_24h: number;
  tweets_24h_percent_change: number;
  reddit_posts_24h: number;
  reddit_posts_24h_percent_change: number;
  sentiment: number;
  sentiment_absolute: number;
  url_shares: number;
  categories: string[];
}

interface LunarCrushInsight {
  symbol: string;
  name: string;
  galaxy_score: number;
  social_volume: number;
  sentiment: number;
  tweets_24h: number;
  trending_rank: number;
}

interface SocialMetrics {
  galaxyScore: number;
  altRank: number;
  socialDominance: number;
  socialVolume: number;
  socialVolume24hChange: number;
  socialContributors: number;
  tweets24h: number;
  tweets24hChange: number;
  redditPosts24h: number;
  redditPosts24hChange: number;
  sentiment: number; // -1 to 1
  sentimentAbsolute: number; // 0 to 100
  urlShares: number;
  categories: string[];
}

class LunarCrushService {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.api.lunarcrush;
  }

  /**
   * Make authenticated request to LunarCrush API
   */
  private async makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await axios.get(`${LUNARCRUSH_API_BASE}${endpoint}`, {
        params,
        headers: this.apiKey ? {
          'Authorization': `Bearer ${this.apiKey}`,
        } : {},
        timeout: 10000,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn('LunarCrush rate limit exceeded');
        throw new Error('Rate limit exceeded');
      } else if (error.response?.status === 401) {
        logger.error('LunarCrush authentication failed - check API key');
        throw new Error('Authentication failed');
      }

      logger.error('LunarCrush API error:', error.message);
      throw error;
    }
  }

  /**
   * Get social metrics for a specific coin
   */
  async getCoinData(symbol: string): Promise<SocialMetrics | null> {
    try {
      const cacheKey = `lunarcrush:coin:${symbol.toLowerCase()}`;

      // Try to check cache first (graceful degradation if Redis unavailable)
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`LunarCrush cache hit for ${symbol}`);
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, fetching directly from API');
      }

      // Fetch from API
      const data = await this.makeRequest<{ data: LunarCrushCoinData }>(
        `/coins/${symbol.toLowerCase()}/v1`
      );

      if (!data.data) {
        logger.warn(`No LunarCrush data found for ${symbol}`);
        return null;
      }

      const coin = data.data;

      const metrics: SocialMetrics = {
        galaxyScore: coin.galaxy_score || 0,
        altRank: coin.alt_rank || 0,
        socialDominance: coin.social_dominance || 0,
        socialVolume: coin.social_volume || 0,
        socialVolume24hChange: coin.social_volume_24h_percent_change || 0,
        socialContributors: coin.social_contributors || 0,
        tweets24h: coin.tweets_24h || 0,
        tweets24hChange: coin.tweets_24h_percent_change || 0,
        redditPosts24h: coin.reddit_posts_24h || 0,
        redditPosts24hChange: coin.reddit_posts_24h_percent_change || 0,
        sentiment: coin.sentiment || 0,
        sentimentAbsolute: coin.sentiment_absolute || 0,
        urlShares: coin.url_shares || 0,
        categories: coin.categories || [],
      };

      // Try to cache for 15 minutes (graceful degradation if Redis unavailable)
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      logger.info(`Fetched LunarCrush data for ${symbol}`, {
        galaxyScore: metrics.galaxyScore,
        sentiment: metrics.sentiment,
      });

      return metrics;
    } catch (error) {
      logger.error(`Error fetching LunarCrush data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get trending coins based on social metrics
   */
  async getTrendingCoins(limit: number = 10): Promise<LunarCrushInsight[]> {
    try {
      const cacheKey = `lunarcrush:trending:${limit}`;

      // Try to check cache first (graceful degradation if Redis unavailable)
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug('LunarCrush trending cache hit');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, fetching directly from API');
      }

      // Fetch from API (using coins list sorted by galaxy score)
      const data = await this.makeRequest<{ data: LunarCrushCoinData[] }>(
        '/coins/list/v2',
        {
          sort: 'galaxy_score',
          limit,
        }
      );

      if (!data.data || data.data.length === 0) {
        logger.warn('No trending coins from LunarCrush');
        return [];
      }

      const insights: LunarCrushInsight[] = data.data.map((coin, index) => ({
        symbol: coin.symbol,
        name: coin.name,
        galaxy_score: coin.galaxy_score || 0,
        social_volume: coin.social_volume || 0,
        sentiment: coin.sentiment || 0,
        tweets_24h: coin.tweets_24h || 0,
        trending_rank: index + 1,
      }));

      // Try to cache for 15 minutes (graceful degradation if Redis unavailable)
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(insights));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      logger.info(`Fetched ${insights.length} trending coins from LunarCrush`);

      return insights;
    } catch (error) {
      logger.error('Error fetching trending coins from LunarCrush:', error);
      return [];
    }
  }

  /**
   * Get social sentiment score for multiple symbols
   */
  async getBatchSentiment(symbols: string[]): Promise<Map<string, number>> {
    const sentimentMap = new Map<string, number>();

    try {
      // Process in parallel with rate limiting
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          const metrics = await this.getCoinData(symbol);
          return { symbol, sentiment: metrics?.sentiment || 0 };
        })
      );

      results.forEach(({ symbol, sentiment }) => {
        sentimentMap.set(symbol.toUpperCase(), sentiment);
      });

      logger.info(`Fetched sentiment for ${sentimentMap.size} symbols`);

      return sentimentMap;
    } catch (error) {
      logger.error('Error fetching batch sentiment:', error);
      return sentimentMap;
    }
  }

  /**
   * Calculate social sentiment factor for risk/prediction engines
   * Returns a score from 0 to 100 (higher = more positive sentiment)
   */
  async getSentimentScore(symbol: string): Promise<number> {
    try {
      const metrics = await this.getCoinData(symbol);

      if (!metrics) {
        // Neutral score if no data
        return 50;
      }

      // Convert sentiment (-1 to 1) to 0-100 scale
      // Also factor in social volume and galaxy score
      const sentimentScore = ((metrics.sentiment + 1) / 2) * 100; // -1→0, 0→50, 1→100
      const galaxyScore = metrics.galaxyScore || 50;

      // Weighted average: 70% sentiment, 30% galaxy score
      const combinedScore = (sentimentScore * 0.7) + (galaxyScore * 0.3);

      return Math.round(combinedScore);
    } catch (error) {
      logger.error(`Error calculating sentiment score for ${symbol}:`, error);
      return 50; // Neutral score on error
    }
  }

  /**
   * Check if LunarCrush API is accessible
   */
  async ping(): Promise<boolean> {
    try {
      // Try to fetch Bitcoin data as health check
      const data = await this.makeRequest<any>('/coins/bitcoin/v1');
      return !!data.data;
    } catch (error) {
      logger.error('LunarCrush ping failed:', error);
      return false;
    }
  }

  /**
   * Get social contributors (influencers) for a coin
   */
  async getTopContributors(symbol: string, limit: number = 10): Promise<any[]> {
    try {
      const cacheKey = `lunarcrush:contributors:${symbol.toLowerCase()}:${limit}`;

      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Note: This endpoint may require higher tier API access
      // For now, return empty array - can be implemented when needed
      logger.info(`Top contributors endpoint not yet implemented for ${symbol}`);
      return [];
    } catch (error) {
      logger.error(`Error fetching contributors for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Clear cache for a specific symbol or all LunarCrush cache
   */
  async clearCache(symbol?: string): Promise<void> {
    try {
      if (symbol) {
        const key = `lunarcrush:coin:${symbol.toLowerCase()}`;
        await redisClient.del(key);
        logger.info(`Cleared LunarCrush cache for ${symbol}`);
      } else {
        const keys = await redisClient.keys('lunarcrush:*');
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.info(`Cleared ${keys.length} LunarCrush cache keys`);
        }
      }
    } catch (error) {
      logger.error('Error clearing LunarCrush cache:', error);
    }
  }
}

// Export singleton instance
export const lunarcrushService = new LunarCrushService();

// Export types
export type { SocialMetrics, LunarCrushInsight };
