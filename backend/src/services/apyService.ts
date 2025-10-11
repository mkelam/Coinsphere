/**
 * APY Service - Fetch APY/yield data from DeFi Llama
 */

import axios from 'axios';
import { getRedisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const redisClient = getRedisClient();

const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi';
const APY_CACHE_TTL = 3600; // 1 hour (APY data updates hourly on DeFi Llama)

/**
 * Pool data structure from DeFi Llama
 */
interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
  predictions?: {
    predictedClass?: string;
    predictedProbability?: number;
    binnedConfidence?: number;
  };
  poolMeta?: string;
  mu?: number;
  sigma?: number;
  count?: number;
  outlier?: boolean;
  underlyingTokens?: string[];
  il7d?: number;
  apyBase7d?: number;
  apyMean30d?: number;
  volumeUsd1d?: number;
  volumeUsd7d?: number;
  apyBaseInception?: number;
}

/**
 * Protocol-to-DeFiLlama project name mapping
 */
const PROTOCOL_MAPPING: Record<string, string> = {
  'uniswap-v3': 'uniswap-v3',
  'aave-v3': 'aave-v3',
  'compound-v2': 'compound',
  'curve': 'curve-dex',
  'lido': 'lido',
  'rocket-pool': 'rocket-pool',
  'yearn-v2': 'yearn-finance',
  'convex': 'convex-finance',
  'balancer-v2': 'balancer-v2',
  'sushiswap': 'sushiswap',
};

/**
 * Blockchain name mapping (our format -> DeFi Llama format)
 */
const BLOCKCHAIN_MAPPING: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  optimism: 'Optimism',
  arbitrum: 'Arbitrum',
  base: 'Base',
  bsc: 'Binance',
};

/**
 * Fetch all pools data from DeFi Llama
 * Caches result for 1 hour
 */
async function fetchAllPools(): Promise<DefiLlamaPool[]> {
  const cacheKey = 'defillama:pools:all';

  // Check cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.debug('APY data cache hit');
    return JSON.parse(cached);
  }

  try {
    logger.info('Fetching pool data from DeFi Llama...');
    const response = await axios.get<{ status: string; data: DefiLlamaPool[] }>(
      `${DEFILLAMA_YIELDS_API}/pools`,
      {
        timeout: 30000, // 30 second timeout
      }
    );

    const pools = response.data.data || [];
    logger.info(`Fetched ${pools.length} pools from DeFi Llama`);

    // Cache for 1 hour
    await redisClient.setex(cacheKey, APY_CACHE_TTL, JSON.stringify(pools));

    return pools;
  } catch (error: any) {
    logger.error('Error fetching DeFi Llama pools:', {
      error: error.message,
      status: error.response?.status,
    });
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Get APY for a specific protocol and blockchain
 *
 * @param protocolSlug - Protocol slug (e.g., 'aave-v3', 'uniswap-v3')
 * @param blockchain - Blockchain name (e.g., 'ethereum', 'polygon')
 * @param tokenSymbol - Optional token symbol to filter by
 * @returns Average APY for the protocol on that blockchain
 */
export async function getProtocolApy(
  protocolSlug: string,
  blockchain: string,
  tokenSymbol?: string
): Promise<number | null> {
  try {
    const pools = await fetchAllPools();

    // Map protocol slug to DeFi Llama project name
    const project = PROTOCOL_MAPPING[protocolSlug];
    if (!project) {
      logger.warn(`No DeFi Llama mapping for protocol: ${protocolSlug}`);
      return null;
    }

    // Map blockchain name
    const chain = BLOCKCHAIN_MAPPING[blockchain] || blockchain;

    // Filter pools by project and chain
    let matchingPools = pools.filter(
      (pool) =>
        pool.project.toLowerCase() === project.toLowerCase() &&
        pool.chain === chain
    );

    // Further filter by token symbol if provided
    if (tokenSymbol) {
      matchingPools = matchingPools.filter((pool) =>
        pool.symbol.toLowerCase().includes(tokenSymbol.toLowerCase())
      );
    }

    if (matchingPools.length === 0) {
      logger.debug(`No pools found for ${project} on ${chain}`);
      return null;
    }

    // Calculate weighted average APY (weighted by TVL)
    const totalTvl = matchingPools.reduce((sum, pool) => sum + pool.tvlUsd, 0);

    if (totalTvl === 0) {
      // If no TVL data, use simple average
      const avgApy =
        matchingPools.reduce((sum, pool) => sum + pool.apy, 0) /
        matchingPools.length;
      return avgApy;
    }

    const weightedApy = matchingPools.reduce(
      (sum, pool) => sum + pool.apy * (pool.tvlUsd / totalTvl),
      0
    );

    logger.debug(`APY for ${project} on ${chain}: ${weightedApy.toFixed(2)}%`);
    return weightedApy;
  } catch (error: any) {
    logger.error('Error getting protocol APY:', error);
    return null;
  }
}

/**
 * Get APY for multiple protocols at once
 * More efficient than calling getProtocolApy multiple times
 *
 * @param protocols - Array of { protocolSlug, blockchain, tokenSymbol? }
 * @returns Map of protocol+blockchain to APY
 */
export async function getBatchProtocolApy(
  protocols: Array<{
    protocolSlug: string;
    blockchain: string;
    tokenSymbol?: string;
  }>
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  try {
    const pools = await fetchAllPools();

    for (const { protocolSlug, blockchain, tokenSymbol } of protocols) {
      const project = PROTOCOL_MAPPING[protocolSlug];
      if (!project) continue;

      const chain = BLOCKCHAIN_MAPPING[blockchain] || blockchain;
      const key = `${protocolSlug}:${blockchain}${tokenSymbol ? `:${tokenSymbol}` : ''}`;

      // Filter pools
      let matchingPools = pools.filter(
        (pool) =>
          pool.project.toLowerCase() === project.toLowerCase() &&
          pool.chain === chain
      );

      if (tokenSymbol) {
        matchingPools = matchingPools.filter((pool) =>
          pool.symbol.toLowerCase().includes(tokenSymbol.toLowerCase())
        );
      }

      if (matchingPools.length === 0) continue;

      // Calculate weighted average
      const totalTvl = matchingPools.reduce((sum, pool) => sum + pool.tvlUsd, 0);

      const apy =
        totalTvl === 0
          ? matchingPools.reduce((sum, pool) => sum + pool.apy, 0) /
            matchingPools.length
          : matchingPools.reduce(
              (sum, pool) => sum + pool.apy * (pool.tvlUsd / totalTvl),
              0
            );

      result.set(key, apy);
    }
  } catch (error: any) {
    logger.error('Error getting batch protocol APY:', error);
  }

  return result;
}

/**
 * Update APY for all DeFi positions in the database
 * Should be run periodically (e.g., every hour)
 */
export async function updateAllPositionApy(): Promise<{
  updated: number;
  errors: number;
}> {
  const { prisma } = await import('../lib/prisma.js');

  try {
    logger.info('Starting APY update for all positions...');

    // Get all unique protocol+blockchain combinations from active positions
    const positions = await prisma.defiPosition.findMany({
      where: { status: 'active' },
      select: {
        protocolId: true,
        blockchain: true,
        tokenSymbol: true,
      },
      distinct: ['protocolId', 'blockchain', 'tokenSymbol'],
    });

    // Get protocol slugs
    const protocolIds = Array.from(
      new Set(positions.map((p) => p.protocolId))
    );
    const protocols = await prisma.defiProtocol.findMany({
      where: { id: { in: protocolIds } },
      select: { id: true, slug: true },
    });

    const protocolMap = new Map(protocols.map((p) => [p.id, p.slug]));

    // Build batch request
    const batchRequest = positions
      .map((p) => ({
        protocolSlug: protocolMap.get(p.protocolId)!,
        blockchain: p.blockchain,
        tokenSymbol: p.tokenSymbol,
      }))
      .filter((p) => p.protocolSlug); // Remove any missing protocol mappings

    // Fetch APY data in batch
    const apyMap = await getBatchProtocolApy(batchRequest);

    // Update positions
    let updated = 0;
    let errors = 0;

    for (const position of positions) {
      const protocolSlug = protocolMap.get(position.protocolId);
      if (!protocolSlug) continue;

      const key = `${protocolSlug}:${position.blockchain}:${position.tokenSymbol}`;
      const apy = apyMap.get(key);

      if (apy !== undefined) {
        try {
          await prisma.defiPosition.updateMany({
            where: {
              protocolId: position.protocolId,
              blockchain: position.blockchain,
              tokenSymbol: position.tokenSymbol,
              status: 'active',
            },
            data: {
              apy: apy,
            },
          });
          updated++;
        } catch (error: any) {
          logger.error(`Error updating APY for ${key}:`, error);
          errors++;
        }
      }
    }

    logger.info(`APY update complete: ${updated} updated, ${errors} errors`);
    return { updated, errors };
  } catch (error: any) {
    logger.error('Error updating position APY:', error);
    return { updated: 0, errors: 1 };
  }
}

/**
 * Clear APY cache
 * Useful for debugging or forcing a refresh
 */
export async function clearApyCache(): Promise<void> {
  await redisClient.del('defillama:pools:all');
  logger.info('APY cache cleared');
}
