/**
 * Data Ingestion Service - Phase 1
 *
 * Fetches and caches historical OHLCV data for backtesting
 * Supports CoinGecko API and Binance API as data sources
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

export interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
}

export interface IngestionParams {
  symbol: string;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d', '1w'
  startDate: Date;
  endDate: Date;
  dataSource?: 'coingecko' | 'binance';
}

/**
 * Ingest historical OHLCV data from external APIs
 */
export async function ingestOHLCVData(params: IngestionParams): Promise<number> {
  const { symbol, timeframe, startDate, endDate, dataSource = 'coingecko' } = params;

  logger.info('Starting OHLCV data ingestion', {
    symbol,
    timeframe,
    startDate,
    endDate,
    dataSource
  });

  try {
    // Check if data already exists
    const existingCount = await prisma.$queryRaw<Array<{ count: BigInt }>>`
      SELECT COUNT(*) as count
      FROM market_data_ohlcv
      WHERE symbol = ${symbol}
        AND timeframe = ${timeframe}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
    `;

    const count = Number(existingCount[0]?.count || 0);

    if (count > 0) {
      logger.info(`Found ${count} existing OHLCV records, skipping ingestion`, { symbol, timeframe });
      return count;
    }

    // Fetch data based on source
    let ohlcvData: OHLCVData[];

    if (dataSource === 'binance') {
      ohlcvData = await fetchBinanceOHLCV(symbol, timeframe, startDate, endDate);
    } else {
      ohlcvData = await fetchCoinGeckoOHLCV(symbol, timeframe, startDate, endDate);
    }

    // Batch insert into database using Prisma createMany
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < ohlcvData.length; i += batchSize) {
      const batch = ohlcvData.slice(i, i + batchSize);

      // Use Prisma's createMany with skipDuplicates
      const result = await prisma.marketDataOhlcv.createMany({
        data: batch.map(d => ({
          symbol,
          timeframe,
          timestamp: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          quoteVolume: d.quoteVolume || null,
          dataSource,
        })),
        skipDuplicates: true,
      });

      inserted += result.count;
      logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}`, { inserted });
    }

    logger.info('OHLCV data ingestion completed', { symbol, timeframe, inserted });
    return inserted;

  } catch (error: any) {
    logger.error('OHLCV data ingestion failed', { error: error.message, symbol, timeframe });
    throw error;
  }
}

/**
 * Fetch OHLCV data from CoinGecko Pro API
 */
async function fetchCoinGeckoOHLCV(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date
): Promise<OHLCVData[]> {
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!apiKey) {
    throw new Error('COINGECKO_API_KEY not configured');
  }

  // Map symbol to CoinGecko ID
  const coinId = await getCoinGeckoId(symbol);

  // Convert timeframe to CoinGecko interval
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  try {
    const response = await axios.get(
      `https://pro-api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days,
          interval: mapTimeframeToInterval(timeframe)
        },
        headers: {
          'X-Cg-Pro-Api-Key': apiKey
        }
      }
    );

    // CoinGecko returns: prices, market_caps, total_volumes as [timestamp, value]
    const { prices, total_volumes } = response.data;

    // Convert to OHLCV format (using close prices for all OHLC since CoinGecko doesn't provide OHLC in free tier)
    const ohlcvData: OHLCVData[] = prices.map((price: [number, number], index: number) => {
      const timestamp = new Date(price[0]);
      const close = price[1];
      const volume = total_volumes[index]?.[1] || 0;

      return {
        timestamp,
        open: close, // Approximation - CoinGecko Pro API required for true OHLC
        high: close,
        low: close,
        close,
        volume,
        quoteVolume: volume * close
      };
    });

    return ohlcvData.filter(d => d.timestamp >= startDate && d.timestamp <= endDate);

  } catch (error: any) {
    logger.error('CoinGecko API request failed', { error: error.message, symbol });
    throw new Error(`CoinGecko API failed: ${error.message}`);
  }
}

/**
 * Fetch OHLCV data from Binance API
 */
async function fetchBinanceOHLCV(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date
): Promise<OHLCVData[]> {
  // Convert symbol to Binance format (e.g., ETH -> ETHUSDT)
  const binanceSymbol = `${symbol}USDT`;

  // Convert timeframe to Binance interval
  const interval = mapTimeframeToBinance(timeframe);

  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol: binanceSymbol,
        interval,
        startTime,
        endTime,
        limit: 1000
      }
    });

    // Binance klines format: [time, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore]
    const ohlcvData: OHLCVData[] = response.data.map((kline: any[]) => ({
      timestamp: new Date(kline[0]),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      quoteVolume: parseFloat(kline[7])
    }));

    logger.info(`Fetched ${ohlcvData.length} candles from Binance`, { symbol, timeframe });
    return ohlcvData;

  } catch (error: any) {
    logger.error('Binance API request failed', { error: error.message, symbol });
    throw new Error(`Binance API failed: ${error.message}`);
  }
}

/**
 * Get cached OHLCV data from database
 */
export async function getCachedOHLCV(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date
): Promise<OHLCVData[]> {
  const results = await prisma.$queryRaw<Array<{
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    quote_volume: number | null;
  }>>`
    SELECT timestamp, open, high, low, close, volume, quote_volume
    FROM market_data_ohlcv
    WHERE symbol = ${symbol}
      AND timeframe = ${timeframe}
      AND timestamp >= ${startDate}
      AND timestamp <= ${endDate}
    ORDER BY timestamp ASC
  `;

  return results.map(r => ({
    timestamp: r.timestamp,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
    quoteVolume: r.quote_volume ? Number(r.quote_volume) : undefined
  }));
}

/**
 * Map symbol to CoinGecko coin ID
 */
async function getCoinGeckoId(symbol: string): Promise<string> {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'AVAX': 'avalanche-2',
    'SNX': 'synthetix-network-token',
    'PERP': 'perpetual-protocol',
    'GMX': 'gmx',
    'LYRA': 'lyra-finance',
    'GNS': 'gains-network',
    'USDC': 'usd-coin',
    'DAI': 'dai',
    'FRAX': 'frax',
    'CRV': 'curve-dao-token',
    'CVX': 'convex-finance',
    'FXS': 'frax-share',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'AAVE': 'aave',
    'COMP': 'compound-governance-token',
    'MKR': 'maker'
  };

  const coinId = mapping[symbol.toUpperCase()];

  if (!coinId) {
    throw new Error(`Unknown symbol: ${symbol}. Please add to CoinGecko mapping.`);
  }

  return coinId;
}

/**
 * Map timeframe to CoinGecko interval
 */
function mapTimeframeToInterval(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': 'minutely',
    '5m': 'minutely',
    '15m': 'minutely',
    '1h': 'hourly',
    '4h': 'hourly',
    '1d': 'daily',
    '1w': 'daily'
  };

  return mapping[timeframe] || 'daily';
}

/**
 * Map timeframe to Binance interval
 */
function mapTimeframeToBinance(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w'
  };

  return mapping[timeframe] || '1d';
}

/**
 * Ingest data for multiple symbols in parallel
 */
export async function ingestMultipleSymbols(
  symbols: string[],
  timeframe: string,
  startDate: Date,
  endDate: Date,
  dataSource?: 'coingecko' | 'binance'
): Promise<Record<string, number>> {
  logger.info(`Ingesting data for ${symbols.length} symbols`, { timeframe, dataSource });

  const results = await Promise.allSettled(
    symbols.map(symbol =>
      ingestOHLCVData({ symbol, timeframe, startDate, endDate, dataSource })
    )
  );

  const summary: Record<string, number> = {};

  results.forEach((result, index) => {
    const symbol = symbols[index];
    if (result.status === 'fulfilled') {
      summary[symbol] = result.value;
    } else {
      logger.error(`Failed to ingest ${symbol}`, { error: result.reason });
      summary[symbol] = 0;
    }
  });

  logger.info('Bulk ingestion completed', { summary });
  return summary;
}
