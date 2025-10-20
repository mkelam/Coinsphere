/**
 * Nansen Direct API Service
 *
 * Fallback service for querying Nansen data directly via REST API
 * when MCP is not available or for backend automation.
 *
 * API Docs: https://docs.nansen.ai/
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { getRedisClient } from '../lib/redis.js';

const NANSEN_API_URL = process.env.NANSEN_API_URL || 'https://api.nansen.ai/api/v1';
const NANSEN_API_KEY = process.env.NANSEN_API_KEY || 'wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR';
const CACHE_TTL = 3600; // 1 hour

/**
 * Nansen Address PnL Response
 */
interface NansenAddressPnL {
  address: string;
  chain: string;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  roiPercentage: number;
  totalInvested: number;
  currentValue: number;
  tokenCount: number;
  tradeCount: number;
}

/**
 * Nansen Trade Performance
 */
interface NansenTradePerformance {
  address: string;
  chain: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgHoldingPeriod: number; // days
  bestTrade: {
    token: string;
    pnl: number;
    roi: number;
  };
  worstTrade: {
    token: string;
    pnl: number;
    roi: number;
  };
}

/**
 * Smart Money Filter
 */
interface SmartMoneyQuery {
  chain?: string;
  minPortfolioValue?: number;
  minTradeCount?: number;
  labels?: string[];
}

/**
 * Nansen Direct API Service
 */
class NansenApiService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: NANSEN_API_URL,
      headers: {
        'X-API-KEY': NANSEN_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Get wallet PnL and performance data
   */
  async getWalletPnL(address: string, chain: string = 'ethereum'): Promise<NansenAddressPnL | null> {
    const cacheKey = `nansen:pnl:${chain}:${address.toLowerCase()}`;

    try {
      // Check cache
      const redisClient = getRedisClient();
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug('Nansen PnL cache hit', { address, chain });
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable');
      }

      // Call Nansen API
      logger.info('Fetching wallet PnL from Nansen API', { address, chain });

      const response = await this.axiosInstance.post('/profiler/address/pnl-summary', {
        address,
        chain
      });

      if (!response.data) {
        logger.warn('No PnL data returned from Nansen', { address, chain });
        return null;
      }

      const pnlData: NansenAddressPnL = {
        address,
        chain,
        realizedPnl: response.data.realized_pnl || 0,
        unrealizedPnl: response.data.unrealized_pnl || 0,
        totalPnl: response.data.total_pnl || 0,
        roiPercentage: response.data.roi_percentage || 0,
        totalInvested: response.data.total_invested || 0,
        currentValue: response.data.current_value || 0,
        tokenCount: response.data.token_count || 0,
        tradeCount: response.data.trade_count || 0
      };

      // Cache result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(pnlData));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      logger.info('Wallet PnL fetched successfully', {
        address,
        totalPnl: pnlData.totalPnl,
        roi: pnlData.roiPercentage
      });

      return pnlData;

    } catch (error: any) {
      logger.error('Failed to fetch wallet PnL from Nansen', {
        error: error.message,
        address,
        chain,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      return null;
    }
  }

  /**
   * Get wallet trade performance
   */
  async getTradePerformance(address: string, chain: string = 'ethereum'): Promise<NansenTradePerformance | null> {
    const cacheKey = `nansen:performance:${chain}:${address.toLowerCase()}`;

    try {
      // Check cache
      const redisClient = getRedisClient();
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug('Nansen performance cache hit', { address, chain });
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable');
      }

      // Call Nansen API
      logger.info('Fetching trade performance from Nansen API', { address, chain });

      const response = await this.axiosInstance.post('/profiler/address/trade-performance', {
        address,
        chain
      });

      if (!response.data) {
        logger.warn('No trade performance data from Nansen', { address, chain });
        return null;
      }

      const performance: NansenTradePerformance = {
        address,
        chain,
        totalTrades: response.data.total_trades || 0,
        winningTrades: response.data.winning_trades || 0,
        losingTrades: response.data.losing_trades || 0,
        winRate: response.data.win_rate || 0,
        avgHoldingPeriod: response.data.avg_holding_period || 0,
        bestTrade: response.data.best_trade || { token: '', pnl: 0, roi: 0 },
        worstTrade: response.data.worst_trade || { token: '', pnl: 0, roi: 0 }
      };

      // Cache result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(performance));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      logger.info('Trade performance fetched successfully', {
        address,
        winRate: performance.winRate,
        totalTrades: performance.totalTrades
      });

      return performance;

    } catch (error: any) {
      logger.error('Failed to fetch trade performance from Nansen', {
        error: error.message,
        address,
        chain,
        status: error.response?.status
      });
      return null;
    }
  }

  /**
   * Get wallet label from Nansen
   */
  async getWalletLabel(address: string, chain: string = 'ethereum'): Promise<string | null> {
    try {
      const response = await this.axiosInstance.get('/labels/address', {
        params: { address, chain }
      });

      return response.data?.label || null;
    } catch (error: any) {
      logger.debug('Failed to fetch wallet label', {
        error: error.message,
        address
      });
      return null;
    }
  }

  /**
   * Search for Smart Money wallets
   *
   * Note: This endpoint may not be directly available in Nansen API.
   * This is a placeholder that would need to be adapted based on
   * actual Nansen API capabilities.
   */
  async searchSmartMoney(query: SmartMoneyQuery): Promise<string[]> {
    logger.warn('Smart Money search not yet implemented via direct API', { query });

    // TODO: Implement when Nansen provides search endpoint
    // For now, return empty array
    return [];
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.debug('Nansen API health check failed');
      return false;
    }
  }
}

// Export singleton instance
export const nansenApiService = new NansenApiService();
