/**
 * LunarCrush MCP (Model Context Protocol) Service
 * Real-time SSE (Server-Sent Events) streaming from LunarCrush
 */

import { createRequire } from 'module';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { getRedisClient } from '../lib/redis.js';

// Use CommonJS require for EventSource (ESM not supported)
const require = createRequire(import.meta.url);
const EventSourceModule = require('eventsource');
const EventSource = EventSourceModule.EventSource;

const LUNARCRUSH_SSE_URL = 'https://lunarcrush.ai/sse';
const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY || '';
const CACHE_TTL = 900; // 15 minutes

interface LunarCrushMcpMessage {
  type: 'coin_update' | 'trending_update' | 'market_update' | 'session_info';
  data: any;
  timestamp: number;
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

/**
 * LunarCrush MCP Service with SSE streaming
 */
class LunarCrushMcpService {
  private eventSource: EventSource | null = null;
  private sessionEndpoint: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private isConnected = false;

  /**
   * Initialize SSE connection to LunarCrush
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('LunarCrush MCP already connected');
      return;
    }

    try {
      const url = `${LUNARCRUSH_SSE_URL}?key=${LUNARCRUSH_API_KEY}`;
      logger.info('Connecting to LunarCrush MCP via SSE', {
        url: LUNARCRUSH_SSE_URL,
        hasApiKey: !!LUNARCRUSH_API_KEY,
        apiKeyLength: LUNARCRUSH_API_KEY?.length
      });

      // Create EventSource instance
      logger.debug('Creating EventSource instance', {
        EventSourceType: typeof EventSource,
        EventSourceConstructor: EventSource?.name || 'unknown'
      });

      this.eventSource = new EventSource(url);

      logger.debug('EventSource instance created', {
        readyState: this.eventSource.readyState,
        url: LUNARCRUSH_SSE_URL,
        readyStateConst: {
          CONNECTING: 0,
          OPEN: 1,
          CLOSED: 2
        }
      });

      // Handle open event
      this.eventSource.onopen = (event: any) => {
        logger.info('SSE connection opened', {
          readyState: this.eventSource?.readyState,
          type: event?.type,
          timestamp: new Date().toISOString()
        });
      };

      // Handle session endpoint event
      this.eventSource.addEventListener('endpoint', (event: any) => {
        logger.info('Received endpoint event from LunarCrush', {
          data: event.data,
          type: event.type,
          lastEventId: event.lastEventId,
          origin: event.origin
        });

        this.sessionEndpoint = event.data;
        logger.info('LunarCrush MCP session established', {
          endpoint: this.sessionEndpoint,
          readyState: this.eventSource?.readyState
        });

        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      // Handle message events (generic)
      this.eventSource.onmessage = (event: any) => {
        logger.debug('Received generic SSE message', {
          data: event.data,
          type: event.type,
          lastEventId: event.lastEventId
        });
        this.handleMessage(event.data);
      };

      // Handle error event
      this.eventSource.onerror = (error: any) => {
        logger.error('LunarCrush MCP connection error', {
          error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorKeys: error ? Object.keys(error) : [],
          errorString: error ? String(error) : 'null',
          errorJSON: error ? JSON.stringify(error) : 'null',
          readyState: this.eventSource?.readyState,
          connected: this.isConnected,
          message: error?.message,
          type: error?.type,
          target: error?.target?.url
        });

        this.isConnected = false;

        // Close the connection
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        this.handleReconnect();
      };

      // Add timeout to detect if 'endpoint' event never arrives
      setTimeout(() => {
        if (!this.isConnected && this.eventSource) {
          logger.warn('SSE connection timeout - no endpoint event received within 15s', {
            readyState: this.eventSource?.readyState,
            url: LUNARCRUSH_SSE_URL
          });

          // Close and retry
          this.eventSource.close();
          this.eventSource = null;
          this.handleReconnect();
        }
      }, 15000);

    } catch (error) {
      logger.error('Failed to connect to LunarCrush MCP', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      this.handleReconnect();
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached for LunarCrush MCP');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Reconnecting to LunarCrush MCP (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
      delay: this.reconnectDelay
    });

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * Handle incoming SSE message
   */
  private async handleMessage(data: string): Promise<void> {
    try {
      const message: LunarCrushMcpMessage = JSON.parse(data);

      logger.debug('LunarCrush MCP message received', {
        type: message.type,
        timestamp: message.timestamp
      });

      // Cache the data based on message type
      await this.cacheMessage(message);

    } catch (error) {
      logger.error('Error handling LunarCrush MCP message', { error, data });
    }
  }

  /**
   * Cache message data in Redis
   */
  private async cacheMessage(message: LunarCrushMcpMessage): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const key = `lunarcrush:mcp:${message.type}`;

      await redisClient.setex(key, CACHE_TTL, JSON.stringify(message));
      logger.debug('Cached LunarCrush MCP message', { type: message.type });
    } catch (error) {
      logger.debug('Redis cache unavailable, skipping MCP cache write');
    }
  }

  /**
   * Send a query to LunarCrush MCP session
   */
  async query(queryText: string): Promise<any> {
    if (!this.sessionEndpoint) {
      logger.warn('LunarCrush MCP session not established, using fallback API');
      return this.fallbackQuery(queryText);
    }

    try {
      const response = await axios.post(this.sessionEndpoint, {
        query: queryText
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      logger.error('LunarCrush MCP query failed', {
        error: error.message,
        query: queryText
      });
      return this.fallbackQuery(queryText);
    }
  }

  /**
   * Fallback to REST API if MCP unavailable
   */
  private async fallbackQuery(queryText: string): Promise<any> {
    try {
      // Parse query to determine what to fetch
      const symbolMatch = queryText.match(/\b([A-Z]{2,5})\b/);
      if (symbolMatch) {
        const symbol = symbolMatch[1];
        return this.getCoinDataREST(symbol);
      }

      return { error: 'Could not parse query', query: queryText };
    } catch (error) {
      logger.error('Fallback query failed', { error, query: queryText });
      return null;
    }
  }

  /**
   * Get coin data using REST API (fallback)
   */
  private async getCoinDataREST(symbol: string): Promise<SocialMetrics | null> {
    try {
      const redisClient = getRedisClient();
      const cacheKey = `lunarcrush:coin:${symbol.toLowerCase()}`;

      // Try cache first
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug(`LunarCrush REST cache hit for ${symbol}`);
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, fetching from API');
      }

      // Fetch from REST API
      const response = await axios.get(
        `https://lunarcrush.com/api4/public/coins/${symbol.toLowerCase()}/v1`,
        {
          headers: {
            'Authorization': `Bearer ${LUNARCRUSH_API_KEY}`
          },
          timeout: 10000
        }
      );

      if (!response.data?.data) {
        return null;
      }

      const coin = response.data.data;
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

      // Cache the result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      return metrics;
    } catch (error: any) {
      logger.error(`Error fetching coin data via REST for ${symbol}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get coin data (MCP or fallback)
   */
  async getCoinData(symbol: string): Promise<SocialMetrics | null> {
    // If MCP connected, use it
    if (this.isConnected && this.sessionEndpoint) {
      const result = await this.query(`Get social metrics for ${symbol}`);
      if (result && !result.error) {
        return result as SocialMetrics;
      }
    }

    // Fallback to REST API
    return this.getCoinDataREST(symbol);
  }

  /**
   * Get sentiment score (0-100)
   */
  async getSentimentScore(symbol: string): Promise<number> {
    const metrics = await this.getCoinData(symbol);
    if (!metrics) return 50; // Neutral default

    // Convert sentiment (-1 to 1) to 0-100 scale
    const sentimentScore = ((metrics.sentiment + 1) / 2) * 100;
    const galaxyScore = metrics.galaxyScore || 50;

    // Weighted: 70% sentiment, 30% galaxy score
    return Math.round((sentimentScore * 0.7) + (galaxyScore * 0.3));
  }

  /**
   * Check connection status
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.sessionEndpoint = null;
      logger.info('LunarCrush MCP disconnected');
    }
  }

  /**
   * Ping LunarCrush API
   */
  async ping(): Promise<boolean> {
    try {
      const response = await axios.get(
        `https://lunarcrush.com/api4/public/health`,
        { timeout: 5000 }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const lunarcrushMcpService = new LunarCrushMcpService();

// Auto-connect on service initialization
if (LUNARCRUSH_API_KEY) {
  lunarcrushMcpService.connect().catch((error) => {
    logger.error('Failed to auto-connect LunarCrush MCP', { error });
  });
} else {
  logger.warn('LUNARCRUSH_API_KEY not configured, MCP service disabled');
}
