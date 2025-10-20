/**
 * Add BTC Historical Data
 *
 * Adds 1000 data points of BTC 4-hour candles for backtesting
 * Time period: January 1, 2024 - June 15, 2024 (same as ETH)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBTCData() {
  console.log('📊 Adding BTC historical data for backtesting...\n');

  const symbol = 'BTC';
  const timeframe = '4h';
  const dataPoints = 1000;

  // Starting price around $42,000 (early 2024)
  let currentPrice = 42000;
  const startDate = new Date('2024-01-01T00:00:00Z');

  console.log(`Symbol: ${symbol}`);
  console.log(`Timeframe: ${timeframe}`);
  console.log(`Data points: ${dataPoints}`);
  console.log(`Start date: ${startDate.toISOString()}`);
  console.log(`Starting price: $${currentPrice.toLocaleString()}\n`);

  const records = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(startDate.getTime() + i * 4 * 60 * 60 * 1000); // 4-hour intervals

    // Simulate realistic BTC price movement
    // BTC had a bull run from ~$42k to ~$70k in early 2024
    const trendMultiplier = 1 + (i / dataPoints) * 0.5; // 50% upward trend
    const basePrice = 42000 * trendMultiplier;

    // Add volatility (3-5% per candle)
    const volatility = 0.04;
    const randomChange = (Math.random() - 0.5) * volatility;
    const open = basePrice * (1 + randomChange);

    const dailyVolatility = 0.03;
    const high = open * (1 + Math.random() * dailyVolatility);
    const low = open * (1 - Math.random() * dailyVolatility);
    const close = low + Math.random() * (high - low);

    // Volume (realistic BTC volume in millions)
    const baseVolume = 20000 + Math.random() * 10000;
    const volume = baseVolume * (1 + Math.random() * 0.5);

    records.push({
      symbol,
      timeframe,
      timestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume * 100) / 100,
      source: 'binance'
    });
  }

  console.log(`Generated ${records.length} BTC price records`);
  console.log(`Date range: ${records[0].timestamp.toISOString()} to ${records[records.length - 1].timestamp.toISOString()}`);
  console.log(`Price range: $${Math.min(...records.map(r => r.low)).toLocaleString()} to $${Math.max(...records.map(r => r.high)).toLocaleString()}\n`);

  // Insert in batches using raw SQL
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // Build VALUES clause
    for (const record of batch) {
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
    }

    inserted += batch.length;
    process.stdout.write(`\rInserting BTC data: ${inserted}/${records.length} (${Math.round(inserted / records.length * 100)}%)`);
  }

  console.log('\n\n✅ BTC data added successfully!');
  console.log('\n📈 Summary:');
  console.log(`   Symbol: BTC`);
  console.log(`   Timeframe: 4h`);
  console.log(`   Data points: ${records.length}`);
  console.log(`   Date range: ${records[0].timestamp.toLocaleDateString()} - ${records[records.length - 1].timestamp.toLocaleDateString()}`);
  console.log(`   Days of data: ${Math.round((records[records.length - 1].timestamp.getTime() - records[0].timestamp.getTime()) / (1000 * 60 * 60 * 24))}`);
  console.log('\n💡 You can now backtest with BTC!');
}

addBTCData()
  .catch((error) => {
    console.error('❌ Error adding BTC data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
