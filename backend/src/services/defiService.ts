/**
 * DeFi Service - The Graph Integration
 * Tracks user positions across DeFi protocols using The Graph subgraphs
 */

import { GraphQLClient, gql } from 'graphql-request';
import { prisma } from '../lib/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { getTokenPrice, getTokenPrices } from './priceService.js';

// The Graph endpoints for major DeFi protocols
// Organized by blockchain for multi-chain support
const SUBGRAPH_ENDPOINTS: Record<string, Record<string, string>> = {
  // ===== ETHEREUM MAINNET =====
  ethereum: {
    'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    'uniswap-v2': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    'aave-v3': 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    'aave-v2': 'https://api.thegraph.com/subgraphs/name/aave/protocol-v2',
    'compound-v2': 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
    'curve': 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools',
    'lido': 'https://api.thegraph.com/subgraphs/name/lidofinance/lido',
    'rocket-pool': 'https://api.thegraph.com/subgraphs/name/rocket-pool/rocketpool',
    'yearn-v2': 'https://api.thegraph.com/subgraphs/name/messari/yearn-v2-ethereum',
    'convex': 'https://api.thegraph.com/subgraphs/name/convex-community/convex',
    'balancer-v2': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
    'sushiswap': 'https://api.thegraph.com/subgraphs/name/sushi-v2/sushiswap-ethereum',
  },

  // ===== POLYGON =====
  polygon: {
    'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
    'aave-v3': 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon',
    'sushiswap': 'https://api.thegraph.com/subgraphs/name/sushiswap/matic-exchange',
    'curve': 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools-polygon',
    'balancer-v2': 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
    'quickswap': 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06',
  },

  // ===== OPTIMISM =====
  optimism: {
    'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
    'aave-v3': 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-optimism',
    'synthetix': 'https://api.thegraph.com/subgraphs/name/synthetix-perps/perps',
    'velodrome': 'https://api.thegraph.com/subgraphs/name/velodrome-finance/velodrome',
  },

  // ===== ARBITRUM =====
  arbitrum: {
    'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one',
    'aave-v3': 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
    'gmx': 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats',
    'sushiswap': 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange',
    'camelot': 'https://api.thegraph.com/subgraphs/name/camelotlabs/camelot-amm',
  },

  // ===== BASE =====
  base: {
    'uniswap-v3': 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-base',
    'aerodrome': 'https://api.thegraph.com/subgraphs/name/aerodrome-finance/aerodrome',
  },

  // ===== BSC (Binance Smart Chain) =====
  bsc: {
    'pancakeswap': 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v2',
    'venus': 'https://api.thegraph.com/subgraphs/name/venusprotocol/venus-subgraph',
    'biswap': 'https://api.thegraph.com/subgraphs/name/biswap-dex/exchange5',
  },
};

// Helper function to get subgraph endpoint for a protocol on a specific chain
function getSubgraphEndpoint(blockchain: string, protocol: string): string | null {
  return SUBGRAPH_ENDPOINTS[blockchain]?.[protocol] || null;
}

interface UniswapV3Position {
  id: string;
  owner: string;
  pool: {
    token0: {
      symbol: string;
      decimals: string;
    };
    token1: {
      symbol: string;
      decimals: string;
    };
  };
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
}

interface AavePosition {
  id: string;
  user: string;
  reserve: {
    symbol: string;
    decimals: number;
  };
  currentATokenBalance: string;
  currentStableDebt: string;
  currentVariableDebt: string;
}

interface CompoundPosition {
  id: string;
  account: string;
  market: {
    symbol: string;
    underlyingSymbol: string;
  };
  cTokenBalance: string;
  borrowBalance: string;
  supplyBalanceUnderlying: string;
}

interface CurvePosition {
  id: string;
  user: string;
  pool: {
    name: string;
    coins: string[];
  };
  balance: string;
  gaugeBalance: string;
}

interface LidoPosition {
  id: string;
  user: string;
  shares: string;
  totalPooledEther: string;
  totalShares: string;
}

interface RocketPoolPosition {
  id: string;
  user: string;
  rethBalance: string;
}

interface YearnPosition {
  id: string;
  account: string;
  vault: {
    symbol: string;
    token: {
      symbol: string;
      decimals: string;
    };
  };
  balanceShares: string;
  balanceTokens: string;
}

interface ConvexPosition {
  id: string;
  user: string;
  pool: {
    lpToken: {
      symbol: string;
    };
  };
  balance: string;
}

interface BalancerPosition {
  id: string;
  userAddress: {
    id: string;
  };
  poolId: {
    tokens: Array<{
      symbol: string;
      decimals: number;
    }>;
  };
  balance: string;
}

interface SushiswapPosition {
  id: string;
  user: string;
  pair: {
    token0: {
      symbol: string;
      decimals: string;
    };
    token1: {
      symbol: string;
      decimals: string;
    };
  };
  liquidityTokenBalance: string;
}

/**
 * Fetch Uniswap V3 liquidity positions for a wallet address
 */
export async function fetchUniswapV3Positions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<UniswapV3Position[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'uniswap-v3');
  if (!endpoint) {
    console.log(`Uniswap V3 not available on ${blockchain}, skipping...`);
    return [];
  }

  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetPositions($owner: String!) {
      positions(where: { owner: $owner, liquidity_gt: "0" }) {
        id
        owner
        pool {
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
        }
        liquidity
        depositedToken0
        depositedToken1
        withdrawnToken0
        withdrawnToken1
        collectedFeesToken0
        collectedFeesToken1
      }
    }
  `;

  try {
    const data = await client.request<{ positions: UniswapV3Position[] }>(query, {
      owner: walletAddress.toLowerCase(),
    });
    return data.positions;
  } catch (error) {
    console.error('Error fetching Uniswap V3 positions:', error);
    return [];
  }
}

/**
 * Fetch Aave V3 positions (lending/borrowing) for a wallet address
 */
export async function fetchAaveV3Positions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<AavePosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'aave-v3');
  if (!endpoint) {
    console.log(`Aave V3 not available on ${blockchain}, skipping...`);
    return [];
  }

  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetUserReserves($user: String!) {
      userReserves(where: { user: $user }) {
        id
        user
        reserve {
          symbol
          decimals
        }
        currentATokenBalance
        currentStableDebt
        currentVariableDebt
      }
    }
  `;

  try {
    const data = await client.request<{ userReserves: AavePosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.userReserves;
  } catch (error) {
    console.error('Error fetching Aave V3 positions:', error);
    return [];
  }
}

/**
 * Fetch Compound positions for a wallet address
 */
export async function fetchCompoundPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<CompoundPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'compound-v2');
  if (!endpoint) {
    console.log(`Compound V2 not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetAccountCTokens($account: String!) {
      accountCTokens(where: { account: $account }) {
        id
        account
        market {
          symbol
          underlyingSymbol
        }
        cTokenBalance
        borrowBalance
        supplyBalanceUnderlying
      }
    }
  `;

  try {
    const data = await client.request<{ accountCTokens: CompoundPosition[] }>(query, {
      account: walletAddress.toLowerCase(),
    });
    return data.accountCTokens;
  } catch (error) {
    console.error('Error fetching Compound positions:', error);
    return [];
  }
}

/**
 * Fetch Curve liquidity positions for a wallet address
 */
export async function fetchCurvePositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<CurvePosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'curve');
  if (!endpoint) {
    console.log(`Curve not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetLiquidityPositions($user: String!) {
      liquidityPositions(where: { user: $user, balance_gt: "0" }) {
        id
        user
        pool {
          name
          coins
        }
        balance
        gaugeBalance
      }
    }
  `;

  try {
    const data = await client.request<{ liquidityPositions: CurvePosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.liquidityPositions;
  } catch (error) {
    console.error('Error fetching Curve positions:', error);
    return [];
  }
}

/**
 * Fetch Lido staking positions for a wallet address
 */
export async function fetchLidoPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<LidoPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'lido');
  if (!endpoint) {
    console.log(`Lido not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetShares($user: String!) {
      shares(where: { user: $user }) {
        id
        user
        shares
        totalPooledEther
        totalShares
      }
    }
  `;

  try {
    const data = await client.request<{ shares: LidoPosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.shares;
  } catch (error) {
    console.error('Error fetching Lido positions:', error);
    return [];
  }
}

/**
 * Fetch Rocket Pool staking positions for a wallet address
 */
export async function fetchRocketPoolPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<RocketPoolPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'rocket-pool');
  if (!endpoint) {
    console.log(`Rocket Pool not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetUserBalances($user: String!) {
      userBalances(where: { user: $user, rethBalance_gt: "0" }) {
        id
        user
        rethBalance
      }
    }
  `;

  try {
    const data = await client.request<{ userBalances: RocketPoolPosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.userBalances;
  } catch (error) {
    console.error('Error fetching Rocket Pool positions:', error);
    return [];
  }
}

/**
 * Fetch Yearn vault positions for a wallet address
 */
export async function fetchYearnPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<YearnPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'yearn-v2');
  if (!endpoint) {
    console.log(`Yearn V2 not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetAccountVaultPositions($account: String!) {
      accountVaultPositions(where: { account: $account, balanceShares_gt: "0" }) {
        id
        account
        vault {
          symbol
          token {
            symbol
            decimals
          }
        }
        balanceShares
        balanceTokens
      }
    }
  `;

  try {
    const data = await client.request<{ accountVaultPositions: YearnPosition[] }>(query, {
      account: walletAddress.toLowerCase(),
    });
    return data.accountVaultPositions;
  } catch (error) {
    console.error('Error fetching Yearn positions:', error);
    return [];
  }
}

/**
 * Fetch Convex staking positions for a wallet address
 */
export async function fetchConvexPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<ConvexPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'convex');
  if (!endpoint) {
    console.log(`Convex not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetUserPoolBalances($user: String!) {
      userPoolBalances(where: { user: $user, balance_gt: "0" }) {
        id
        user
        pool {
          lpToken {
            symbol
          }
        }
        balance
      }
    }
  `;

  try {
    const data = await client.request<{ userPoolBalances: ConvexPosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.userPoolBalances;
  } catch (error) {
    console.error('Error fetching Convex positions:', error);
    return [];
  }
}

/**
 * Fetch Balancer V2 liquidity positions for a wallet address
 */
export async function fetchBalancerPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<BalancerPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'balancer-v2');
  if (!endpoint) {
    console.log(`Balancer V2 not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetPoolShares($userAddress: String!) {
      poolShares(where: { userAddress: $userAddress, balance_gt: "0" }) {
        id
        userAddress {
          id
        }
        poolId {
          tokens {
            symbol
            decimals
          }
        }
        balance
      }
    }
  `;

  try {
    const data = await client.request<{ poolShares: BalancerPosition[] }>(query, {
      userAddress: walletAddress.toLowerCase(),
    });
    return data.poolShares;
  } catch (error) {
    console.error('Error fetching Balancer positions:', error);
    return [];
  }
}

/**
 * Fetch SushiSwap liquidity positions for a wallet address
 */
export async function fetchSushiswapPositions(
  walletAddress: string,
  blockchain: string = 'ethereum'
): Promise<SushiswapPosition[]> {
  const endpoint = getSubgraphEndpoint(blockchain, 'sushiswap');
  if (!endpoint) {
    console.log(`SushiSwap not available on ${blockchain}, skipping...`);
    return [];
  }
  const client = new GraphQLClient(endpoint);

  const query = gql`
    query GetLiquidityPositions($user: String!) {
      liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: "0" }) {
        id
        user
        pair {
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
        }
        liquidityTokenBalance
      }
    }
  `;

  try {
    const data = await client.request<{ liquidityPositions: SushiswapPosition[] }>(query, {
      user: walletAddress.toLowerCase(),
    });
    return data.liquidityPositions;
  } catch (error) {
    console.error('Error fetching SushiSwap positions:', error);
    return [];
  }
}

/**
 * Sync DeFi positions for a user across all supported protocols and blockchains
 */
export async function syncDefiPositions(
  userId: string,
  walletAddress: string,
  blockchains: string[] = ['ethereum']
): Promise<void> {
  console.log(`Syncing DeFi positions for user ${userId}, wallet ${walletAddress} across ${blockchains.length} blockchain(s)...`);

  // Loop through each blockchain
  for (const blockchain of blockchains) {
    console.log(`\n🔗 Syncing ${blockchain} positions...`);

    // Fetch positions from all protocols on this blockchain
    const [
      uniswapPositions,
      aavePositions,
      compoundPositions,
      curvePositions,
      lidoPositions,
      rocketPoolPositions,
      yearnPositions,
      convexPositions,
      balancerPositions,
      sushiswapPositions,
    ] = await Promise.all([
      fetchUniswapV3Positions(walletAddress, blockchain),
      fetchAaveV3Positions(walletAddress, blockchain),
      fetchCompoundPositions(walletAddress, blockchain),
      fetchCurvePositions(walletAddress, blockchain),
      fetchLidoPositions(walletAddress, blockchain),
      fetchRocketPoolPositions(walletAddress, blockchain),
      fetchYearnPositions(walletAddress, blockchain),
      fetchConvexPositions(walletAddress, blockchain),
      fetchBalancerPositions(walletAddress, blockchain),
      fetchSushiswapPositions(walletAddress, blockchain),
    ]);

    // Process Uniswap V3 positions
    for (const position of uniswapPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'uniswap-v3' },
      });

      if (!protocol) continue;

      const token0Amount = new Decimal(position.depositedToken0)
        .minus(new Decimal(position.withdrawnToken0))
        .div(new Decimal(10).pow(parseInt(position.pool.token0.decimals)));

      const token1Amount = new Decimal(position.depositedToken1)
        .minus(new Decimal(position.withdrawnToken1))
        .div(new Decimal(10).pow(parseInt(position.pool.token1.decimals)));

      // Store both tokens as separate positions
      if (token0Amount.gt(0)) {
        // Get token price
        const token0Price = await getTokenPrice(position.pool.token0.symbol);
        const valueUsd = token0Amount.times(new Decimal(token0Price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: position.pool.token0.symbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'liquidity',
            tokenSymbol: position.pool.token0.symbol,
            amount: token0Amount,
            valueUsd,
            metadata: {
              positionId: position.id,
              pairToken: position.pool.token1.symbol,
            },
          },
          update: {
            amount: token0Amount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }

      if (token1Amount.gt(0)) {
        // Get token price
        const token1Price = await getTokenPrice(position.pool.token1.symbol);
        const valueUsd = token1Amount.times(new Decimal(token1Price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: position.pool.token1.symbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'liquidity',
            tokenSymbol: position.pool.token1.symbol,
            amount: token1Amount,
            valueUsd,
            metadata: {
              positionId: position.id,
              pairToken: position.pool.token0.symbol,
            },
          },
          update: {
            amount: token1Amount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Aave V3 positions
    for (const position of aavePositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'aave-v3' },
      });

      if (!protocol) continue;

      const lendingAmount = new Decimal(position.currentATokenBalance)
        .div(new Decimal(10).pow(position.reserve.decimals));

      const borrowingAmount = new Decimal(position.currentStableDebt)
        .plus(new Decimal(position.currentVariableDebt))
        .div(new Decimal(10).pow(position.reserve.decimals));

      // Store lending position
      if (lendingAmount.gt(0)) {
        const price = await getTokenPrice(position.reserve.symbol);
        const valueUsd = lendingAmount.times(new Decimal(price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: position.reserve.symbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'lending',
            tokenSymbol: position.reserve.symbol,
            amount: lendingAmount,
            valueUsd,
          },
          update: {
            amount: lendingAmount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }

      // Store borrowing position (if any)
      if (borrowingAmount.gt(0)) {
        const price = await getTokenPrice(position.reserve.symbol);
        const valueUsd = borrowingAmount.times(new Decimal(price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: `${position.reserve.symbol}-BORROW`,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'borrowing',
            tokenSymbol: position.reserve.symbol,
            amount: borrowingAmount,
            valueUsd,
          },
          update: {
            amount: borrowingAmount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Compound positions
    for (const position of compoundPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'compound-v2' },
      });

      if (!protocol) continue;

      const supplyAmount = new Decimal(position.supplyBalanceUnderlying);
      const borrowAmount = new Decimal(position.borrowBalance);

      // Store supply position
      if (supplyAmount.gt(0)) {
        const price = await getTokenPrice(position.market.underlyingSymbol);
        const valueUsd = supplyAmount.times(new Decimal(price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: position.market.underlyingSymbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'lending',
            tokenSymbol: position.market.underlyingSymbol,
            amount: supplyAmount,
            valueUsd,
          },
          update: {
            amount: supplyAmount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }

      // Store borrow position
      if (borrowAmount.gt(0)) {
        const price = await getTokenPrice(position.market.underlyingSymbol);
        const valueUsd = borrowAmount.times(new Decimal(price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: `${position.market.underlyingSymbol}-BORROW`,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'borrowing',
            tokenSymbol: position.market.underlyingSymbol,
            amount: borrowAmount,
            valueUsd,
          },
          update: {
            amount: borrowAmount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Curve positions
    for (const position of curvePositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'curve' },
      });

      if (!protocol) continue;

      const balance = new Decimal(position.balance || position.gaugeBalance);
      if (balance.gt(0)) {
        // Curve positions are LP tokens - use pool name as symbol
        const poolName = position.pool.name;
        const price = 1; // Placeholder - would need to calculate from pool composition

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: poolName,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'liquidity',
            tokenSymbol: poolName,
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
          },
          update: {
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Lido positions (stETH)
    for (const position of lidoPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'lido' },
      });

      if (!protocol) continue;

      // Calculate stETH amount from shares
      const shares = new Decimal(position.shares);
      const totalPooledEther = new Decimal(position.totalPooledEther);
      const totalShares = new Decimal(position.totalShares);
      const stethAmount = shares.times(totalPooledEther).div(totalShares);

      if (stethAmount.gt(0)) {
        const ethPrice = await getTokenPrice('ETH');
        const valueUsd = stethAmount.times(new Decimal(ethPrice));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: 'stETH',
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'staking',
            tokenSymbol: 'stETH',
            amount: stethAmount,
            valueUsd,
          },
          update: {
            amount: stethAmount,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Rocket Pool positions (rETH)
    for (const position of rocketPoolPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'rocket-pool' },
      });

      if (!protocol) continue;

      const rethBalance = new Decimal(position.rethBalance).div(new Decimal(10).pow(18));

      if (rethBalance.gt(0)) {
        const ethPrice = await getTokenPrice('ETH');
        // rETH typically trades at slight premium to ETH
        const valueUsd = rethBalance.times(new Decimal(ethPrice)).times(new Decimal(1.05));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: 'rETH',
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'staking',
            tokenSymbol: 'rETH',
            amount: rethBalance,
            valueUsd,
          },
          update: {
            amount: rethBalance,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Yearn positions
    for (const position of yearnPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'yearn-v2' },
      });

      if (!protocol) continue;

      const balanceTokens = new Decimal(position.balanceTokens).div(
        new Decimal(10).pow(parseInt(position.vault.token.decimals))
      );

      if (balanceTokens.gt(0)) {
        const tokenSymbol = position.vault.token.symbol;
        const price = await getTokenPrice(tokenSymbol);
        const valueUsd = balanceTokens.times(new Decimal(price));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: position.vault.symbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'yield',
            tokenSymbol: tokenSymbol,
            amount: balanceTokens,
            valueUsd,
          },
          update: {
            amount: balanceTokens,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Convex positions
    for (const position of convexPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'convex' },
      });

      if (!protocol) continue;

      const balance = new Decimal(position.balance);

      if (balance.gt(0)) {
        const lpTokenSymbol = position.pool.lpToken.symbol;
        const price = 1; // Placeholder - would need to calculate from underlying pool

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: lpTokenSymbol,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'yield',
            tokenSymbol: lpTokenSymbol,
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
          },
          update: {
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process Balancer positions
    for (const position of balancerPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'balancer-v2' },
      });

      if (!protocol) continue;

      const balance = new Decimal(position.balance);

      if (balance.gt(0) && position.poolId.tokens.length > 0) {
        // Use first token symbol as reference
        const firstToken = position.poolId.tokens[0];
        const tokenSymbol = firstToken.symbol;
        const price = await getTokenPrice(tokenSymbol);

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: `BPT-${tokenSymbol}`,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'liquidity',
            tokenSymbol: tokenSymbol,
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
          },
          update: {
            amount: balance,
            valueUsd: balance.times(new Decimal(price)),
            lastSyncAt: new Date(),
          },
        });
      }
    }

    // Process SushiSwap positions
    for (const position of sushiswapPositions) {
      const protocol = await prisma.defiProtocol.findUnique({
        where: { slug: 'sushiswap' },
      });

      if (!protocol) continue;

      const lpBalance = new Decimal(position.liquidityTokenBalance);

      if (lpBalance.gt(0)) {
        const token0Symbol = position.pair.token0.symbol;
        const token1Symbol = position.pair.token1.symbol;
        const price0 = await getTokenPrice(token0Symbol);
        const price1 = await getTokenPrice(token1Symbol);

        // Simplified: use average of both token prices
        const avgPrice = (price0 + price1) / 2;
        const valueUsd = lpBalance.times(new Decimal(avgPrice));

        await prisma.defiPosition.upsert({
          where: {
            userId_protocolId_walletAddress_tokenSymbol: {
              userId,
              protocolId: protocol.id,
              walletAddress,
              tokenSymbol: `SLP-${token0Symbol}-${token1Symbol}`,
            },
          },
          create: {
            userId,
            protocolId: protocol.id,
            walletAddress,
            positionType: 'liquidity',
            tokenSymbol: token0Symbol,
            amount: lpBalance,
            valueUsd,
            metadata: {
              pairToken: token1Symbol,
            },
          },
          update: {
            amount: lpBalance,
            valueUsd,
            lastSyncAt: new Date(),
          },
        });
      }
    }

  console.log(`✅ ${blockchain} sync complete!`);
  } // End blockchain loop

  console.log(`\n✅ DeFi sync complete for user ${userId} across all blockchains!`);
}

/**
 * Get all DeFi positions for a user
 */
export async function getUserDefiPositions(userId: string) {
  return await prisma.defiPosition.findMany({
    where: { userId },
    include: {
      protocol: true,
    },
    orderBy: {
      valueUsd: 'desc',
    },
  });
}

/**
 * Get total DeFi portfolio value for a user
 */
export async function getUserDefiValue(userId: string): Promise<Decimal> {
  const positions = await prisma.defiPosition.findMany({
    where: { userId },
  });

  return positions.reduce(
    (total, position) => total.plus(position.valueUsd),
    new Decimal(0)
  );
}

/**
 * Get supported DeFi protocols
 */
export async function getSupportedProtocols() {
  return await prisma.defiProtocol.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

