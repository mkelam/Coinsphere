/**
 * Add Multiple Cryptocurrency Historical Data
 *
 * Adds 1000 data points for multiple cryptocurrencies (4-hour candles)
 * Time period: January 1, 2024 - June 15, 2024
 *
 * Coins: SOL, AVAX, MATIC, LINK
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CoinConfig {
  symbol: string;
  startPrice: number;
  trendMultiplier: number; // How much price increases over the period
  volatility: number; // Daily volatility (0.02 = 2%)
  name: string;
}

const coins: CoinConfig[] = [
  {
    symbol: 'SOL',
    startPrice: 95,
    trendMultiplier: 0.8, // 80% increase (95 -> 171)
    volatility: 0.05,
    name: 'Solana'
  },
  {
    symbol: 'AVAX',
    startPrice: 35,
    trendMultiplier: 0.6, // 60% increase (35 -> 56)
    volatility: 0.04,
    name: 'Avalanche'
  },
  {
    symbol: 'MATIC',
    startPrice: 0.85,
    trendMultiplier: 0.3, // 30% increase (0.85 -> 1.11)
    volatility: 0.04,
    name: 'Polygon'
  },
  {
    symbol: 'LINK',
    startPrice: 14.5,
    trendMultiplier: 0.5, // 50% increase (14.5 -> 21.75)
    volatility: 0.035,
    name: 'Chainlink'
  }
];

async function generateCoinData(coin: CoinConfig) {
  const timeframe = '4h';
  const dataPoints = 1000;
  const startDate = new Date('2024-01-01T00:00:00Z');
  const decimals = coin.startPrice < 1 ? 4 : 2;

  console.log(`\n📊 Generating ${coin.name} (${coin.symbol}) data...`);
  console.log(`   Starting price: $${coin.startPrice.toLocaleString()}`);
  console.log(`   Trend: +${(coin.trendMultiplier * 100).toFixed(0)}%`);
  console.log(`   Volatility: ${(coin.volatility * 100).toFixed(1)}%`);

  const records = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(startDate.getTime() + i * 4 * 60 * 60 * 1000); // 4-hour intervals

    // Calculate trend-based price
    const trendProgress = i / dataPoints;
    const basePrice = coin.startPrice * (1 + trendProgress * coin.trendMultiplier);

    // Add volatility
    const randomChange = (Math.random() - 0.5) * coin.volatility;
    const open = basePrice * (1 + randomChange);

    const candleVolatility = coin.volatility * 0.7;
    const high = open * (1 + Math.random() * candleVolatility);
    const low = open * (1 - Math.random() * candleVolatility);
    const close = low + Math.random() * (high - low);

    // Volume (varies by coin market cap)
    const baseVolume = coin.startPrice < 1 ? 50000000 : coin.startPrice < 20 ? 10000000 : 5000000;
    const volume = baseVolume * (1 + Math.random() * 0.5);

    records.push({
      symbol: coin.symbol,
      timeframe,
      timestamp,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume: Math.round(volume * 100) / 100,
      source: 'binance'
    });
  }

  console.log(`   Generated ${records.length} records`);
  console.log(`   Price range: $${Math.min(...records.map(r => r.low)).toFixed(decimals)} to $${Math.max(...records.map(r => r.high)).toFixed(decimals)}`);

  return records;
}

async function insertRecords(records: any[]) {
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // Insert batch records
    for (const record of batch) {
      try {
        await prisma.$executeRaw`
          INSERT INTO market_data_ohlcv (symbol, timeframe, timestamp, open, high, low, close, volume, data_source)
          VALUES (
            ${record.symbol},
            ${record.timeframe},
            ${record.timestamp},
            ${record.open}::numeric,
            ${record.high}::numeric,
            ${record.low}::numeric,
            ${record.close}::numeric,
            ${record.volume}::numeric,
            ${record.source}
          )
          ON CONFLICT (symbol, timeframe, timestamp) DO NOTHING
        `;
      } catch (error: any) {
        // Silently skip conflicts
        if (!error.message.includes('duplicate key')) {
          console.error(`   ⚠️  Error inserting record:`, error.message);
        }
      }
    }

    inserted += batch.length;
    process.stdout.write(`\r   Inserting: ${inserted}/${records.length} (${Math.round(inserted / records.length * 100)}%)`);
  }

  console.log(''); // New line after progress
}

async function addMultiCoinData() {
  console.log('🚀 Adding Multiple Cryptocurrency Historical Data\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Timeframe: 4h');
  console.log('Period: Jan 1 - Jun 15, 2024 (166 days)');
  console.log('Data points per coin: 1000');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let totalInserted = 0;

  for (const coin of coins) {
    const records = await generateCoinData(coin);
    await insertRecords(records);
    totalInserted += records.length;
    console.log(`   ✅ ${coin.symbol} data added successfully!`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Summary:');
  console.log(`   Total coins added: ${coins.length}`);
  console.log(`   Total records: ${totalInserted.toLocaleString()}`);
  console.log(`   Coins: ${coins.map(c => c.symbol).join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 You can now backtest with 6 cryptocurrencies:');
  console.log('   BTC, ETH, SOL, AVAX, MATIC, LINK');
  console.log('\n🎯 Next: Test Nansen strategies with these new coins!');
}

addMultiCoinData()
  .catch((error) => {
    console.error('\n❌ Error adding multi-coin data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
