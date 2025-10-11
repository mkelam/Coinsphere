/**
 * Price Service - Token Price Fetching & Caching
 * Integrates with CoinGecko API for real-time USD prices
 */

import axios from 'axios';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const redisClient = getRedisClient();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE_TTL = 300; // 5 minutes

// Token symbol to CoinGecko ID mapping
const COINGECKO_IDS: Record<string, string> = {
  // Major tokens
  'ETH': 'ethereum',
  'WETH': 'weth',
  'BTC': 'bitcoin',
  'WBTC': 'wrapped-bitcoin',

  // Stablecoins
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'BUSD': 'binance-usd',
  'FRAX': 'frax',
  'LUSD': 'liquity-usd',
  'MIM': 'magic-internet-money',

  // DeFi tokens
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'COMP': 'compound-governance-token',
  'CRV': 'curve-dao-token',
  'LDO': 'lido-dao',
  'RPL': 'rocket-pool',
  'YFI': 'yearn-finance',
  'CVX': 'convex-finance',
  'BAL': 'balancer',
  'SUSHI': 'sushi',

  // Layer 1/2 tokens
  'BNB': 'binancecoin',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'SOL': 'solana',
  'FTM': 'fantom',
  'ARB': 'arbitrum',
  'OP': 'optimism',

  // Other popular tokens
  'LINK': 'chainlink',
  'MKR': 'maker',
  'SNX': 'havven',
  'GRT': 'the-graph',
  '1INCH': '1inch',
  'ENS': 'ethereum-name-service',
  'GMX': 'gmx',
};

// Stablecoins always return $1.00
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX', 'LUSD', 'MIM', 'TUSD', 'USDP', 'GUSD'];

/**
 * Get current USD price for a token symbol
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  const upperSymbol = symbol.toUpperCase();

  // Stablecoin handling - always $1.00
  if (STABLECOINS.includes(upperSymbol)) {
    return 1.00;
  }

  // Check Redis cache first
  const cacheKey = `price:${symbol.toLowerCase()}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for ${symbol}: ${cached}`);
      return parseFloat(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache read error for ${symbol}:`, error);
  }

  // Get CoinGecko ID
  const coingeckoId = COINGECKO_IDS[upperSymbol];
  if (!coingeckoId) {
    logger.warn(`No CoinGecko ID mapping for token: ${symbol}`);
    return 0;
  }

  // Fetch from CoinGecko API
  try {
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: coingeckoId,
        vs_currencies: 'usd',
      },
      timeout: 5000,
    });

    const price = response.data[coingeckoId]?.usd || 0;

    if (price > 0) {
      // Cache the price for 5 minutes
      try {
        await redisClient.setex(cacheKey, PRICE_CACHE_TTL, price.toString());
        logger.debug(`Cached price for ${symbol}: $${price}`);
      } catch (error) {
        logger.warn(`Redis cache write error for ${symbol}:`, error);
      }
    }

    return price;
  } catch (error: any) {
    logger.error(`Error fetching price for ${symbol} from CoinGecko:`, {
      error: error.message,
      status: error.response?.status,
    });
    return 0;
  }
}

/**
 * Get prices for multiple tokens in a single API call (more efficient)
 */
export async function getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  const symbolsToFetch: string[] = [];
  const coingeckoIds: string[] = [];

  // Separate stablecoins and tokens to fetch
  for (const symbol of symbols) {
    const upperSymbol = symbol.toUpperCase();

    // Stablecoins
    if (STABLECOINS.includes(upperSymbol)) {
      prices[symbol] = 1.00;
      continue;
    }

    // Check cache
    const cacheKey = `price:${symbol.toLowerCase()}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        prices[symbol] = parseFloat(cached);
        continue;
      }
    } catch (error) {
      logger.warn(`Redis cache read error for ${symbol}:`, error);
    }

    // Add to fetch list
    const coingeckoId = COINGECKO_IDS[upperSymbol];
    if (coingeckoId) {
      symbolsToFetch.push(symbol);
      coingeckoIds.push(coingeckoId);
    } else {
      logger.warn(`No CoinGecko ID mapping for token: ${symbol}`);
      prices[symbol] = 0;
    }
  }

  // Fetch prices from CoinGecko (batch)
  if (coingeckoIds.length > 0) {
    try {
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: coingeckoIds.join(','),
          vs_currencies: 'usd',
        },
        timeout: 10000,
      });

      // Map results back to symbols
      for (let i = 0; i < symbolsToFetch.length; i++) {
        const symbol = symbolsToFetch[i];
        const coingeckoId = coingeckoIds[i];
        const price = response.data[coingeckoId]?.usd || 0;

        prices[symbol] = price;

        // Cache the price
        if (price > 0) {
          try {
            const cacheKey = `price:${symbol.toLowerCase()}`;
            await redisClient.setex(cacheKey, PRICE_CACHE_TTL, price.toString());
          } catch (error) {
            logger.warn(`Redis cache write error for ${symbol}:`, error);
          }
        }
      }

      logger.info(`Fetched prices for ${symbolsToFetch.length} tokens from CoinGecko`);
    } catch (error: any) {
      logger.error('Error fetching batch prices from CoinGecko:', {
        error: error.message,
        status: error.response?.status,
      });

      // Set remaining prices to 0
      for (const symbol of symbolsToFetch) {
        if (!(symbol in prices)) {
          prices[symbol] = 0;
        }
      }
    }
  }

  return prices;
}

/**
 * Clear price cache (useful for testing or manual refresh)
 */
export async function clearPriceCache(symbol?: string): Promise<void> {
  try {
    if (symbol) {
      const cacheKey = `price:${symbol.toLowerCase()}`;
      await redisClient.del(cacheKey);
      logger.info(`Cleared price cache for ${symbol}`);
    } else {
      // Clear all price caches
      const keys = await redisClient.keys('price:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Cleared ${keys.length} price caches`);
      }
    }
  } catch (error) {
    logger.error('Error clearing price cache:', error);
  }
}

/**
 * Get historical price for a token at a specific timestamp (for P&L calculations)
 * Note: This requires CoinGecko Pro API or uses current price as fallback
 */
export async function getHistoricalPrice(
  symbol: string,
  timestamp: Date
): Promise<number> {
  // For MVP, we'll use current price as fallback
  // TODO: Implement historical price fetching with CoinGecko Pro API
  logger.warn(`Historical price requested for ${symbol} at ${timestamp}, using current price as fallback`);
  return await getTokenPrice(symbol);
}

/**
 * Add new token to CoinGecko ID mapping
 */
export function addTokenMapping(symbol: string, coingeckoId: string): void {
  COINGECKO_IDS[symbol.toUpperCase()] = coingeckoId;
  logger.info(`Added token mapping: ${symbol} -> ${coingeckoId}`);
}

/**
 * Get all supported token symbols
 */
export function getSupportedTokens(): string[] {
  return Object.keys(COINGECKO_IDS);
}

/**
 * Check if a token symbol is supported
 */
export function isTokenSupported(symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  return STABLECOINS.includes(upperSymbol) || upperSymbol in COINGECKO_IDS;
}
