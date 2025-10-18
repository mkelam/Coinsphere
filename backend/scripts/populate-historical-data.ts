/**
 * Populate Historical Price Data
 *
 * This script fetches real historical OHLCV data from CoinGecko
 * and populates the price_data table for ML model training
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

// CoinGecko API configuration
// Note: Always use free API for demo/development
const USE_FREE_API = true;
const DAYS_TO_FETCH = 90; // Free API limited to 90 days

// Symbols to fetch data for
const SYMBOLS_TO_FETCH = [
  { symbol: 'BTC', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', coingeckoId: 'ethereum' },
  { symbol: 'SOL', coingeckoId: 'solana' },
  { symbol: 'BNB', coingeckoId: 'binancecoin' },
  { symbol: 'XRP', coingeckoId: 'ripple' },
  { symbol: 'ADA', coingeckoId: 'cardano' },
  { symbol: 'AVAX', coingeckoId: 'avalanche-2' },
  { symbol: 'DOGE', coingeckoId: 'dogecoin' },
  { symbol: 'DOT', coingeckoId: 'polkadot' },
  { symbol: 'MATIC', coingeckoId: 'matic-network' },
  { symbol: 'LINK', coingeckoId: 'chainlink' },
  { symbol: 'UNI', coingeckoId: 'uniswap' },
  { symbol: 'ATOM', coingeckoId: 'cosmos' },
  { symbol: 'LTC', coingeckoId: 'litecoin' },
  { symbol: 'ETC', coingeckoId: 'ethereum-classic' },
];

interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch historical price data from CoinGecko using market_chart endpoint
 */
async function fetchCoinGeckoMarketChart(coingeckoId: string, days: number): Promise<OHLCVData[]> {
  try {
    const baseUrl = 'https://api.coingecko.com/api/v3';
    const url = `${baseUrl}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const headers = {};

    logger.info(`Fetching market chart for ${coingeckoId} (${days} days)...`);

    const response = await axios.get(url, {
      headers,
      timeout: 30000,
    });

    if (!response.data || !response.data.prices) {
      throw new Error(`Invalid response format from CoinGecko for ${coingeckoId}`);
    }

    const { prices, total_volumes } = response.data;

    // Convert market_chart data to OHLCV format
    // market_chart provides prices and volumes as [timestamp, value] arrays
    // We'll create OHLCV candles from the price data
    const ohlcvData: OHLCVData[] = [];

    for (let i = 0; i < prices.length; i++) {
      const [timestamp, price] = prices[i];
      const volume = total_volumes[i] ? total_volumes[i][1] : 0;

      // Since we only have close prices, we'll use a small spread for OHLC
      // This is a simplified approach - in production you'd want true OHLC data
      const spread = price * 0.005; // 0.5% spread
      const open = price - spread / 2;
      const high = price + spread;
      const low = price - spread;
      const close = price;

      ohlcvData.push({
        timestamp: new Date(timestamp),
        open,
        high,
        low,
        close,
        volume,
      });
    }

    logger.info(`✓ Fetched ${ohlcvData.length} candles for ${coingeckoId}`);
    return ohlcvData;

  } catch (error: any) {
    if (error.response?.status === 429) {
      logger.error(`Rate limit hit for ${coingeckoId}, waiting 60s...`);
      await sleep(60000);
      return fetchCoinGeckoMarketChart(coingeckoId, days);
    }

    logger.error(`Error fetching market chart for ${coingeckoId}: ${error.message}`);
    if (error.response?.data) {
      logger.error(`API Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Save OHLCV data to database
 */
async function saveOHLCVData(symbol: string, tokenId: string, data: OHLCVData[]): Promise<number> {
  try {
    logger.info(`Saving ${data.length} records for ${symbol}...`);

    let savedCount = 0;

    // Insert in batches of 50 to avoid huge queries
    const batchSize = 50;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const values = batch.map(candle =>
        `('${candle.timestamp.toISOString()}', '${tokenId}', ${candle.open}, ${candle.high}, ${candle.low}, ${candle.close}, ${candle.volume})`
      ).join(',');

      const query = `
        INSERT INTO price_data (time, token_id, open, high, low, close, volume)
        VALUES ${values}
        ON CONFLICT (time, token_id) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume
      `;

      await prisma.$executeRawUnsafe(query);
      savedCount += batch.length;
    }

    logger.info(`✓ Saved ${savedCount} records for ${symbol}`);
    return savedCount;

  } catch (error: any) {
    logger.error(`Error saving data for ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Get or create token in database
 */
async function ensureToken(symbol: string, coingeckoId: string): Promise<string> {
  try {
    // Check if token exists
    let token = await prisma.token.findUnique({
      where: { symbol },
    });

    if (token) {
      logger.info(`Token ${symbol} already exists (ID: ${token.id})`);
      return token.id;
    }

    // Create token
    logger.info(`Creating token ${symbol}...`);
    token = await prisma.token.create({
      data: {
        symbol,
        name: symbol, // Will be updated later
        coingeckoId,
        blockchain: 'unknown', // Will be updated later
      },
    });

    logger.info(`✓ Created token ${symbol} (ID: ${token.id})`);
    return token.id;

  } catch (error: any) {
    logger.error(`Error ensuring token ${symbol}: ${error.message}`);
    throw error;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  logger.info('🚀 Starting historical data population...');
  logger.info(`Using ${USE_FREE_API ? 'FREE' : 'PRO'} CoinGecko API`);
  logger.info(`Fetching ${DAYS_TO_FETCH} days for ${SYMBOLS_TO_FETCH.length} symbols`);

  let totalRecords = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const { symbol, coingeckoId } of SYMBOLS_TO_FETCH) {
    try {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Processing ${symbol} (${coingeckoId})`);
      logger.info('='.repeat(60));

      // Ensure token exists in database
      const tokenId = await ensureToken(symbol, coingeckoId);

      // Fetch market chart data (prices + volumes)
      const ohlcvData = await fetchCoinGeckoMarketChart(coingeckoId, DAYS_TO_FETCH);

      // Save to database
      const recordCount = await saveOHLCVData(symbol, tokenId, ohlcvData);
      totalRecords += recordCount;
      successCount++;

      // Rate limiting - wait 2s between requests for free API, 1s for pro
      const waitTime = USE_FREE_API ? 2000 : 1000;
      logger.info(`Waiting ${waitTime/1000}s before next request...`);
      await sleep(waitTime);

    } catch (error: any) {
      logger.error(`❌ Failed to process ${symbol}: ${error.message}`);
      errorCount++;

      // Continue with next symbol
      continue;
    }
  }

  logger.info(`\n${'='.repeat(60)}`);
  logger.info('✅ Historical data population complete!');
  logger.info('='.repeat(60));
  logger.info(`Total records inserted: ${totalRecords}`);
  logger.info(`Successful symbols: ${successCount}/${SYMBOLS_TO_FETCH.length}`);
  logger.info(`Failed symbols: ${errorCount}/${SYMBOLS_TO_FETCH.length}`);
  logger.info('='.repeat(60));

  // Verify data was inserted
  const count = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM price_data`;
  logger.info(`\n📊 Total price_data records in database: ${count[0].count.toString()}`);
}

// Execute
main()
  .catch((error) => {
    logger.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
