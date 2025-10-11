import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed tokens
  const tokens = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      blockchain: 'Bitcoin',
      coingeckoId: 'bitcoin',
      decimals: 8,
      logoUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      currentPrice: 67420.50,
      marketCap: 1320000000000,
      volume24h: 35000000000,
      priceChange24h: 2.45,
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      blockchain: 'Ethereum',
      coingeckoId: 'ethereum',
      decimals: 18,
      logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      currentPrice: 3542.80,
      marketCap: 425000000000,
      volume24h: 18000000000,
      priceChange24h: 3.12,
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      blockchain: 'Solana',
      coingeckoId: 'solana',
      decimals: 9,
      logoUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      currentPrice: 142.35,
      marketCap: 65000000000,
      volume24h: 3200000000,
      priceChange24h: 5.67,
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      blockchain: 'Ethereum',
      coingeckoId: 'usd-coin',
      contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
      currentPrice: 1.00,
      marketCap: 34000000000,
      volume24h: 8500000000,
      priceChange24h: 0.02,
    },
    {
      symbol: 'BNB',
      name: 'BNB',
      blockchain: 'BSC',
      coingeckoId: 'binancecoin',
      decimals: 18,
      logoUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
      currentPrice: 587.20,
      marketCap: 85000000000,
      volume24h: 1800000000,
      priceChange24h: 1.85,
    },
    {
      symbol: 'XRP',
      name: 'Ripple',
      blockchain: 'XRP Ledger',
      coingeckoId: 'ripple',
      decimals: 6,
      logoUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
      currentPrice: 0.52,
      marketCap: 28000000000,
      volume24h: 1200000000,
      priceChange24h: -0.85,
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      blockchain: 'Cardano',
      coingeckoId: 'cardano',
      decimals: 6,
      logoUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      currentPrice: 0.45,
      marketCap: 16000000000,
      volume24h: 420000000,
      priceChange24h: 2.15,
    },
    {
      symbol: 'DOGE',
      name: 'Dogecoin',
      blockchain: 'Dogecoin',
      coingeckoId: 'dogecoin',
      decimals: 8,
      logoUrl: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
      currentPrice: 0.12,
      marketCap: 17000000000,
      volume24h: 1100000000,
      priceChange24h: 8.42,
    },
    {
      symbol: 'AVAX',
      name: 'Avalanche',
      blockchain: 'Avalanche',
      coingeckoId: 'avalanche-2',
      decimals: 18,
      logoUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
      currentPrice: 34.25,
      marketCap: 13000000000,
      volume24h: 580000000,
      priceChange24h: 4.32,
    },
    {
      symbol: 'MATIC',
      name: 'Polygon',
      blockchain: 'Ethereum',
      coingeckoId: 'matic-network',
      contractAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      decimals: 18,
      logoUrl: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
      currentPrice: 0.68,
      marketCap: 6300000000,
      volume24h: 320000000,
      priceChange24h: 1.95,
    },
  ];

  for (const tokenData of tokens) {
    const token = await prisma.token.upsert({
      where: { symbol: tokenData.symbol },
      update: tokenData,
      create: tokenData,
    });
    console.log(`✓ Created/Updated token: ${token.symbol} - ${token.name}`);
  }

  // Seed DeFi protocols
  const defiProtocols = [
    {
      slug: 'uniswap-v3',
      name: 'Uniswap V3',
      category: 'DEX',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
      isActive: true,
    },
    {
      slug: 'aave-v3',
      name: 'Aave V3',
      category: 'Lending',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
      isActive: true,
    },
    {
      slug: 'compound-v2',
      name: 'Compound V2',
      category: 'Lending',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/compound-comp-logo.png',
      isActive: true,
    },
    {
      slug: 'curve',
      name: 'Curve Finance',
      category: 'DEX',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
      isActive: true,
    },
    {
      slug: 'lido',
      name: 'Lido',
      category: 'Staking',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
      isActive: true,
    },
    {
      slug: 'rocket-pool',
      name: 'Rocket Pool',
      category: 'Staking',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png',
      isActive: true,
    },
    {
      slug: 'yearn-v2',
      name: 'Yearn Finance V2',
      category: 'Yield',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
      isActive: true,
    },
    {
      slug: 'convex',
      name: 'Convex Finance',
      category: 'Yield',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/convex-finance-cvx-logo.png',
      isActive: true,
    },
    {
      slug: 'balancer-v2',
      name: 'Balancer V2',
      category: 'DEX',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/balancer-bal-logo.png',
      isActive: true,
    },
    {
      slug: 'sushiswap',
      name: 'SushiSwap',
      category: 'DEX',
      blockchain: 'Ethereum',
      logoUrl: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png',
      isActive: true,
    },
  ];

  for (const protocolData of defiProtocols) {
    const protocol = await prisma.defiProtocol.upsert({
      where: { slug: protocolData.slug },
      update: protocolData,
      create: protocolData,
    });
    console.log(`✓ Created/Updated DeFi protocol: ${protocol.name} (${protocol.category})`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
