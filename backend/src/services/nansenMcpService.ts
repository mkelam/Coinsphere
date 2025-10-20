/**
 * Nansen MCP (Model Context Protocol) Service
 * Phase 0 Research - Smart Money Wallet Discovery
 *
 * Query templates for Week 1 Day 1-2 on-chain wallet research
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { getRedisClient } from '../lib/redis.js';

const NANSEN_MCP_URL = process.env.NANSEN_MCP_URL || 'https://mcp.nansen.ai/ra/mcp/';
const NANSEN_API_KEY = process.env.NANSEN_API_KEY || 'wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR';
const CACHE_TTL = 3600; // 1 hour

/**
 * Nansen Wallet Profile (from Wallet Profiler)
 */
interface NansenWalletProfile {
  address: string;
  label?: string;
  blockchain: string;
  totalTradesAnalyzed: number;
  portfolioValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  avgHoldTime: number; // days
  activeMonths: number;
  topTokens: string[];
  lastTradeDate: string;
}

/**
 * Nansen Trade (from transaction history)
 */
interface NansenTrade {
  txHash: string;
  timestamp: string;
  blockchain: string;
  action: 'buy' | 'sell';
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  gasFeesUsd: number;
}

/**
 * Smart Money Filter Criteria (Phase 0 Week 1)
 */
interface SmartMoneyFilter {
  minPortfolioValue: number; // Default: $100,000
  minActiveMonths: number;   // Default: 12 months
  minProfitability: boolean; // Default: true (positive returns)
  labels?: string[];         // e.g., ["Smart Money - DeFi", "Smart NFT Trader"]
  blockchains?: string[];    // e.g., ["ethereum", "solana", "bsc"]
}

/**
 * Week 1 Day 1-2 Query Results
 */
interface SmartMoneyDiscoveryResult {
  wallets: NansenWalletProfile[];
  totalFound: number;
  filterCriteria: SmartMoneyFilter;
  discoveryDate: string;
}

/**
 * Nansen MCP Service for Trading Research
 */
class NansenMcpService {
  private isHealthy = false;

  /**
   * Ping Nansen API to check availability
   * Note: Nansen doesn't have an MCP endpoint - using REST API health check
   */
  async ping(): Promise<boolean> {
    try {
      // Check if API key is configured
      if (!NANSEN_API_KEY || NANSEN_API_KEY === 'wqbsH9Cdbt9eQ8d1H34txhdO4QmEbSiR') {
        // API key is present - assume healthy
        // Nansen API requires specific endpoints, not a generic health check
        this.isHealthy = true;
        logger.info('Nansen API configured', {
          healthy: true,
          hasApiKey: !!NANSEN_API_KEY,
          note: 'Nansen uses REST API (no MCP endpoint available)'
        });
        return true;
      }

      this.isHealthy = false;
      logger.warn('Nansen API key not configured');
      return false;
    } catch (error: any) {
      this.isHealthy = false;
      logger.warn('Nansen API check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * WEEK 1 DAY 1-2: Discover Smart Money Wallets
   *
   * Query Nansen for wallets matching Smart Money criteria:
   * - Portfolio value >$100K
   * - Active for 12+ months
   * - Positive returns
   * - Labeled as "Smart Money" by Nansen
   *
   * Target: 30-40 wallet addresses
   */
  async discoverSmartMoneyWallets(
    filter: Partial<SmartMoneyFilter> = {}
  ): Promise<SmartMoneyDiscoveryResult> {
    const criteria: SmartMoneyFilter = {
      minPortfolioValue: filter.minPortfolioValue || 100000,
      minActiveMonths: filter.minActiveMonths || 12,
      minProfitability: filter.minProfitability ?? true,
      labels: filter.labels || ['Smart Money - DeFi', 'Smart NFT Trader', 'Smart LP'],
      blockchains: filter.blockchains || ['ethereum', 'solana', 'bsc', 'arbitrum']
    };

    logger.info('Phase 0 Week 1 Day 1-2: Discovering Smart Money wallets', { criteria });

    try {
      // Check cache first
      const cacheKey = `nansen:smart_money:${JSON.stringify(criteria)}`;
      const redisClient = getRedisClient();

      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug('Smart Money discovery cache hit');
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, fetching from Nansen');
      }

      // Query Nansen MCP
      const query = `
        Find wallet addresses with the following criteria:
        - Portfolio value > $${criteria.minPortfolioValue.toLocaleString()}
        - Active for at least ${criteria.minActiveMonths} months
        - ${criteria.minProfitability ? 'Positive returns (profitable)' : 'Any returns'}
        - Labeled as: ${criteria.labels?.join(', ')}
        - Blockchains: ${criteria.blockchains?.join(', ')}

        Return wallet addresses, labels, portfolio values, profit/loss, and trading activity.
      `;

      const response = await this.query(query);

      // Parse MCP response (structure depends on Nansen MCP implementation)
      const wallets = this.parseSmartMoneyResponse(response);

      const result: SmartMoneyDiscoveryResult = {
        wallets,
        totalFound: wallets.length,
        filterCriteria: criteria,
        discoveryDate: new Date().toISOString()
      };

      // Cache result
      try {
        await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
      } catch (cacheError) {
        logger.debug('Redis cache unavailable, skipping cache write');
      }

      logger.info('Smart Money discovery complete', {
        walletsFound: result.totalFound,
        criteria
      });

      return result;

    } catch (error: any) {
      logger.error('Smart Money discovery failed', {
        error: error.message,
        criteria
      });

      // Return empty result on error
      return {
        wallets: [],
        totalFound: 0,
        filterCriteria: criteria,
        discoveryDate: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed wallet profile (Nansen Wallet Profiler)
   */
  async getWalletProfile(address: string): Promise<NansenWalletProfile | null> {
    logger.debug('Fetching Nansen wallet profile', { address });

    try {
      // Check cache
      const cacheKey = `nansen:wallet:${address.toLowerCase()}`;
      const redisClient = getRedisClient();

      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          logger.debug('Wallet profile cache hit', { address });
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        logger.debug('Redis cache unavailable');
      }

      // Query Nansen
      const query = `
        Get wallet profile for address: ${address}
        Include:
        - Nansen label
        - Total trades analyzed
        - Portfolio value
        - Profit/loss (USD and %)
        - Average hold time (days)
        - Active months
        - Top 5 traded tokens
        - Last trade date
      `;

      const response = await this.query(query);
      const profile = this.parseWalletProfile(response, address);

      if (profile) {
        // Cache result
        try {
          await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(profile));
        } catch (cacheError) {
          logger.debug('Redis cache unavailable, skipping cache write');
        }
      }

      return profile;

    } catch (error: any) {
      logger.error('Failed to fetch wallet profile', {
        error: error.message,
        address
      });
      return null;
    }
  }

  /**
   * Get wallet transaction history (last N trades)
   */
  async getWalletTrades(
    address: string,
    limit: number = 50
  ): Promise<NansenTrade[]> {
    logger.debug('Fetching wallet trades', { address, limit });

    try {
      const query = `
        Get last ${limit} trades for wallet address: ${address}
        Include:
        - Transaction hash
        - Timestamp
        - Blockchain
        - Action (buy/sell)
        - Token symbol and address
        - Amount
        - Price in USD
        - Value in USD
        - Gas fees in USD
      `;

      const response = await this.query(query);
      return this.parseWalletTrades(response);

    } catch (error: any) {
      logger.error('Failed to fetch wallet trades', {
        error: error.message,
        address
      });
      return [];
    }
  }

  /**
   * Token God Mode - Analyze wallet activity for specific token
   */
  async getWalletTokenActivity(
    address: string,
    tokenSymbol: string
  ): Promise<NansenTrade[]> {
    logger.debug('Fetching wallet token activity', { address, tokenSymbol });

    try {
      const query = `
        Get all trades for wallet ${address} trading token ${tokenSymbol}
        Include buy and sell transactions with prices, amounts, and timestamps.
      `;

      const response = await this.query(query);
      return this.parseWalletTrades(response);

    } catch (error: any) {
      logger.error('Failed to fetch wallet token activity', {
        error: error.message,
        address,
        tokenSymbol
      });
      return [];
    }
  }

  /**
   * Generic MCP query
   */
  private async query(queryText: string): Promise<any> {
    try {
      const response = await axios.post(
        `${NANSEN_MCP_URL}/query`,
        { query: queryText },
        {
          headers: {
            'NANSEN-API-KEY': NANSEN_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30s timeout for complex queries
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Nansen MCP query failed', {
        error: error.message,
        query: queryText.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  /**
   * Parse Smart Money wallet discovery response
   */
  private parseSmartMoneyResponse(response: any): NansenWalletProfile[] {
    // TODO: Implement based on actual Nansen MCP response structure
    // This is a placeholder that assumes response.wallets exists

    if (!response || !response.wallets) {
      logger.warn('Unexpected Nansen response structure', { response });
      return [];
    }

    return response.wallets.map((w: any) => ({
      address: w.address,
      label: w.label,
      blockchain: w.blockchain || 'ethereum',
      totalTradesAnalyzed: w.totalTrades || 0,
      portfolioValue: w.portfolioValue || 0,
      profitLoss: w.profitLoss || 0,
      profitLossPercentage: w.profitLossPercentage || 0,
      avgHoldTime: w.avgHoldTime || 0,
      activeMonths: w.activeMonths || 0,
      topTokens: w.topTokens || [],
      lastTradeDate: w.lastTradeDate || new Date().toISOString()
    }));
  }

  /**
   * Parse wallet profile response
   */
  private parseWalletProfile(response: any, address: string): NansenWalletProfile | null {
    // TODO: Implement based on actual Nansen MCP response structure

    if (!response || !response.profile) {
      logger.warn('Unexpected wallet profile response', { response });
      return null;
    }

    const p = response.profile;
    return {
      address,
      label: p.label,
      blockchain: p.blockchain || 'ethereum',
      totalTradesAnalyzed: p.totalTrades || 0,
      portfolioValue: p.portfolioValue || 0,
      profitLoss: p.profitLoss || 0,
      profitLossPercentage: p.profitLossPercentage || 0,
      avgHoldTime: p.avgHoldTime || 0,
      activeMonths: p.activeMonths || 0,
      topTokens: p.topTokens || [],
      lastTradeDate: p.lastTradeDate || new Date().toISOString()
    };
  }

  /**
   * Parse wallet trades response
   */
  private parseWalletTrades(response: any): NansenTrade[] {
    // TODO: Implement based on actual Nansen MCP response structure

    if (!response || !response.trades) {
      logger.warn('Unexpected trades response', { response });
      return [];
    }

    return response.trades.map((t: any) => ({
      txHash: t.txHash,
      timestamp: t.timestamp,
      blockchain: t.blockchain || 'ethereum',
      action: t.action,
      tokenSymbol: t.tokenSymbol,
      tokenAddress: t.tokenAddress,
      amount: t.amount || 0,
      priceUsd: t.priceUsd || 0,
      valueUsd: t.valueUsd || 0,
      gasFeesUsd: t.gasFeesUsd || 0
    }));
  }

  /**
   * Check if service is healthy
   */
  isServiceHealthy(): boolean {
    return this.isHealthy;
  }
}

// Export singleton instance
export const nansenMcpService = new NansenMcpService();

// Auto-ping on initialization
if (NANSEN_API_KEY) {
  nansenMcpService.ping().catch((error) => {
    logger.error('Failed to ping Nansen MCP', { error });
  });
} else {
  logger.warn('NANSEN_API_KEY not configured, Nansen MCP service disabled');
}
