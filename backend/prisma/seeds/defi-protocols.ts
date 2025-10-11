/**
 * Seed DeFi Protocols
 * Populates the database with supported DeFi protocols and their subgraph URLs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFI_PROTOCOLS = [
  // DEX (Decentralized Exchanges)
  {
    name: 'Uniswap V3',
    slug: 'uniswap-v3',
    category: 'dex',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    website: 'https://uniswap.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    isActive: true,
  },
  {
    name: 'Uniswap V2',
    slug: 'uniswap-v2',
    category: 'dex',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    website: 'https://uniswap.org',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
    isActive: true,
  },
  {
    name: 'SushiSwap',
    slug: 'sushiswap',
    category: 'dex',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
    website: 'https://sushi.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sushi-labs/sushiswap-ethereum',
    isActive: true,
  },
  {
    name: 'Curve Finance',
    slug: 'curve',
    category: 'dex',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
    website: 'https://curve.fi',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools',
    isActive: true,
  },
  {
    name: 'PancakeSwap V3',
    slug: 'pancakeswap-v3',
    category: 'dex',
    blockchain: 'bsc',
    logoUrl: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png',
    website: 'https://pancakeswap.finance',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
    isActive: true,
  },

  // Lending Protocols
  {
    name: 'Aave V3',
    slug: 'aave-v3',
    category: 'lending',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    website: 'https://aave.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    isActive: true,
  },
  {
    name: 'Aave V2',
    slug: 'aave-v2',
    category: 'lending',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    website: 'https://aave.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v2',
    isActive: true,
  },
  {
    name: 'Compound V2',
    slug: 'compound-v2',
    category: 'lending',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    website: 'https://compound.finance',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2',
    isActive: true,
  },
  {
    name: 'Compound V3',
    slug: 'compound-v3',
    category: 'lending',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/compound-comp-logo.png',
    website: 'https://compound.finance',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v3',
    isActive: true,
  },
  {
    name: 'MakerDAO',
    slug: 'makerdao',
    category: 'lending',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/maker-mkr-logo.png',
    website: 'https://makerdao.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/protofire/makerdao',
    isActive: true,
  },

  // Staking Protocols
  {
    name: 'Lido',
    slug: 'lido',
    category: 'staking',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
    website: 'https://lido.fi',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/lidofinance/lido',
    isActive: true,
  },
  {
    name: 'Rocket Pool',
    slug: 'rocketpool',
    category: 'staking',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png',
    website: 'https://rocketpool.net',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/rocket-pool/rocketpool',
    isActive: true,
  },

  // Yield Aggregators
  {
    name: 'Yearn Finance',
    slug: 'yearn',
    category: 'yield',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
    website: 'https://yearn.finance',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/yearn/yearn-vaults-v2-mainnet',
    isActive: true,
  },
  {
    name: 'Convex Finance',
    slug: 'convex',
    category: 'yield',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/convex-finance-cvx-logo.png',
    website: 'https://convexfinance.com',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/convex-community/convex',
    isActive: true,
  },

  // Derivatives
  {
    name: 'GMX',
    slug: 'gmx',
    category: 'derivatives',
    blockchain: 'arbitrum',
    logoUrl: 'https://cryptologos.cc/logos/gmx-gmx-logo.png',
    website: 'https://gmx.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/gmx-io/gmx-stats',
    isActive: true,
  },
  {
    name: 'Synthetix',
    slug: 'synthetix',
    category: 'derivatives',
    blockchain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/synthetix-snx-logo.png',
    website: 'https://synthetix.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/synthetix/synthetix',
    isActive: true,
  },
];

async function seedDefiProtocols() {
  console.log('🌱 Seeding DeFi protocols...');

  try {
    for (const protocol of DEFI_PROTOCOLS) {
      await prisma.defiProtocol.upsert({
        where: { slug: protocol.slug },
        update: protocol,
        create: protocol,
      });
      console.log(`✓ ${protocol.name} (${protocol.blockchain})`);
    }

    console.log(`\n✅ Seeded ${DEFI_PROTOCOLS.length} DeFi protocols successfully!`);

    // Summary by category
    const summary = DEFI_PROTOCOLS.reduce((acc, protocol) => {
      acc[protocol.category] = (acc[protocol.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Summary:');
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} protocols`);
    });
  } catch (error) {
    console.error('❌ Error seeding DeFi protocols:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDefiProtocols();

export { seedDefiProtocols };
