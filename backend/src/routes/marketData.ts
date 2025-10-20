/**
 * Market Data Streaming API Routes
 * Manage real-time market data subscriptions
 */

import { Router } from 'express';
import { z } from 'zod';
import { marketDataStreamer } from '../services/marketDataStreamer';

const router = Router();

// Validation schemas
const SubscribeTickerSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['binance', 'coinbase', 'kraken']).optional(),
  intervalMs: z.number().min(100).max(60000).optional(),
});

const SubscribeOHLCVSchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.string().optional(),
  exchange: z.enum(['binance', 'coinbase', 'kraken']).optional(),
  intervalMs: z.number().min(1000).max(300000).optional(),
});

const SubscribeOrderBookSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.enum(['binance', 'coinbase', 'kraken']).optional(),
  limit: z.number().min(5).max(100).optional(),
  intervalMs: z.number().min(100).max(10000).optional(),
});

/**
 * GET /api/v1/market-data/status
 * Get market data streamer status
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = {
      isActive: marketDataStreamer.isActive(),
      subscriptionCount: marketDataStreamer.getSubscriptionCount(),
      subscriptions: marketDataStreamer.getSubscriptions(),
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/market-data/ticker/subscribe
 * Subscribe to ticker updates
 */
router.post('/ticker/subscribe', async (req, res, next) => {
  try {
    const { symbol, exchange, intervalMs } = SubscribeTickerSchema.parse(req.body);

    // Start streamer if not running
    if (!marketDataStreamer.isActive()) {
      marketDataStreamer.start();
    }

    const subscriptionId = marketDataStreamer.subscribeTicker(
      symbol,
      exchange,
      intervalMs
    );

    res.json({
      success: true,
      message: 'Subscribed to ticker',
      data: {
        subscriptionId,
        symbol,
        exchange: exchange || 'binance',
        intervalMs: intervalMs || 1000,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/market-data/ohlcv/subscribe
 * Subscribe to OHLCV updates
 */
router.post('/ohlcv/subscribe', async (req, res, next) => {
  try {
    const { symbol, timeframe, exchange, intervalMs } = SubscribeOHLCVSchema.parse(req.body);

    // Start streamer if not running
    if (!marketDataStreamer.isActive()) {
      marketDataStreamer.start();
    }

    const subscriptionId = marketDataStreamer.subscribeOHLCV(
      symbol,
      timeframe,
      exchange,
      intervalMs
    );

    res.json({
      success: true,
      message: 'Subscribed to OHLCV',
      data: {
        subscriptionId,
        symbol,
        timeframe: timeframe || '1m',
        exchange: exchange || 'binance',
        intervalMs: intervalMs || 60000,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/market-data/orderbook/subscribe
 * Subscribe to order book updates
 */
router.post('/orderbook/subscribe', async (req, res, next) => {
  try {
    const { symbol, exchange, limit, intervalMs } = SubscribeOrderBookSchema.parse(req.body);

    // Start streamer if not running
    if (!marketDataStreamer.isActive()) {
      marketDataStreamer.start();
    }

    const subscriptionId = marketDataStreamer.subscribeOrderBook(
      symbol,
      exchange,
      limit,
      intervalMs
    );

    res.json({
      success: true,
      message: 'Subscribed to order book',
      data: {
        subscriptionId,
        symbol,
        exchange: exchange || 'binance',
        limit: limit || 20,
        intervalMs: intervalMs || 1000,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/v1/market-data/subscription/:id
 * Unsubscribe from a data stream
 */
router.delete('/subscription/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const success = marketDataStreamer.unsubscribe(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    res.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/v1/market-data/symbol/:symbol
 * Unsubscribe all streams for a symbol
 */
router.delete('/symbol/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;

    const count = marketDataStreamer.unsubscribeSymbol(symbol, exchange as any);

    res.json({
      success: true,
      message: `Unsubscribed ${count} streams for ${symbol}`,
      data: { count },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/market-data/subscriptions
 * Get all active subscriptions
 */
router.get('/subscriptions', async (req, res, next) => {
  try {
    const subscriptions = marketDataStreamer.getSubscriptions();

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/market-data/subscription/:id
 * Get subscription by ID
 */
router.get('/subscription/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = marketDataStreamer.getSubscription(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found',
      });
    }

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/market-data/start
 * Start the market data streamer
 */
router.post('/start', async (req, res, next) => {
  try {
    marketDataStreamer.start();

    res.json({
      success: true,
      message: 'Market data streamer started',
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/market-data/stop
 * Stop the market data streamer
 */
router.post('/stop', async (req, res, next) => {
  try {
    marketDataStreamer.stop();

    res.json({
      success: true,
      message: 'Market data streamer stopped',
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
