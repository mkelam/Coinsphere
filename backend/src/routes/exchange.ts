/**
 * Exchange API Routes
 * Provides REST endpoints for exchange operations
 */

import { Router } from 'express';
import { z } from 'zod';
import { exchangeManager } from '../services/exchange/ExchangeManager';
import { ExchangeConfig, OrderRequest } from '../services/exchange/types';

const router = Router();

// Validation schemas
const OrderRequestSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
  side: z.enum(['buy', 'sell']),
  amount: z.number().positive(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  params: z.record(z.any()).optional(),
});

const ExchangeConfigSchema = z.object({
  name: z.enum(['binance', 'coinbase', 'kraken']),
  credentials: z.object({
    apiKey: z.string(),
    secret: z.string(),
  }),
  testnet: z.boolean().optional(),
  enableRateLimit: z.boolean().optional(),
  rateLimit: z.number().optional(),
  timeout: z.number().optional(),
});

/**
 * GET /api/v1/exchange/status
 * Get status of all connected exchanges
 */
router.get('/status', async (req, res, next) => {
  try {
    const statuses = await exchangeManager.getAllStatuses();
    res.json({
      success: true,
      data: statuses,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/connected
 * Get list of connected exchanges
 */
router.get('/connected', async (req, res, next) => {
  try {
    const exchanges = exchangeManager.getConnectedExchanges();
    res.json({
      success: true,
      data: { exchanges },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/exchange/connect
 * Add and connect to an exchange
 */
router.post('/connect', async (req, res, next) => {
  try {
    const config = ExchangeConfigSchema.parse(req.body);
    await exchangeManager.addExchange(config);

    res.json({
      success: true,
      message: `Successfully connected to ${config.name}`,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/v1/exchange/:name
 * Disconnect from an exchange
 */
router.delete('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;
    await exchangeManager.removeExchange(name as any);

    res.json({
      success: true,
      message: `Disconnected from ${name}`,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/balance
 * Get account balance from exchange
 */
router.get('/balance', async (req, res, next) => {
  try {
    const { exchange } = req.query;
    const balance = await exchangeManager.fetchBalance(exchange as any);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/account
 * Get complete account info with USD value
 */
router.get('/account', async (req, res, next) => {
  try {
    const { exchange } = req.query;
    const connector = exchangeManager.getExchange(exchange as any);
    const accountInfo = await connector.fetchAccountInfo();

    res.json({
      success: true,
      data: accountInfo,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/portfolio
 * Get total portfolio value across all exchanges
 */
router.get('/portfolio', async (req, res, next) => {
  try {
    const totalValue = await exchangeManager.getTotalPortfolioValue();
    const accounts = await exchangeManager.getAllAccounts();

    res.json({
      success: true,
      data: {
        totalUSDValue: totalValue,
        accounts,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/ticker/:symbol
 * Get current ticker for a symbol
 */
router.get('/ticker/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;

    const ticker = await exchangeManager.fetchTicker(symbol, exchange as any);

    res.json({
      success: true,
      data: ticker,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/ohlcv/:symbol
 * Get OHLCV candles for a symbol
 */
router.get('/ohlcv/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { exchange, timeframe = '4h', since, limit } = req.query;

    const ohlcv = await exchangeManager.fetchOHLCV(
      symbol,
      timeframe as string,
      since ? parseInt(since as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      exchange as any
    );

    res.json({
      success: true,
      data: ohlcv,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/orderbook/:symbol
 * Get order book for a symbol
 */
router.get('/orderbook/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { exchange, limit = '20' } = req.query;

    const orderbook = await exchangeManager.fetchOrderBook(
      symbol,
      parseInt(limit as string),
      exchange as any
    );

    res.json({
      success: true,
      data: orderbook,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/v1/exchange/order
 * Create a new order
 */
router.post('/order', async (req, res, next) => {
  try {
    const orderRequest = OrderRequestSchema.parse(req.body);
    const { exchange } = req.query;

    const order = await exchangeManager.createOrder(orderRequest, exchange as any);

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * DELETE /api/v1/exchange/order/:orderId
 * Cancel an order
 */
router.delete('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { symbol, exchange } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const order = await exchangeManager.cancelOrder(
      orderId,
      symbol as string,
      exchange as any
    );

    res.json({
      success: true,
      message: 'Order canceled successfully',
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/orders/open
 * Get all open orders
 */
router.get('/orders/open', async (req, res, next) => {
  try {
    const { symbol, exchange } = req.query;

    const orders = await exchangeManager.fetchOpenOrders(
      symbol as string | undefined,
      exchange as any
    );

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/orders/closed
 * Get closed orders
 */
router.get('/orders/closed', async (req, res, next) => {
  try {
    const { symbol, since, limit, exchange } = req.query;

    const orders = await exchangeManager.fetchClosedOrders(
      symbol as string | undefined,
      since ? parseInt(since as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      exchange as any
    );

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/trades
 * Get my trades
 */
router.get('/trades', async (req, res, next) => {
  try {
    const { symbol, since, limit, exchange } = req.query;

    const trades = await exchangeManager.fetchMyTrades(
      symbol as string | undefined,
      since ? parseInt(since as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      exchange as any
    );

    res.json({
      success: true,
      data: trades,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/market/:symbol
 * Get market info for a symbol
 */
router.get('/market/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;

    const market = await exchangeManager.fetchMarket(symbol, exchange as any);

    res.json({
      success: true,
      data: market,
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/v1/exchange/markets
 * Get all available markets
 */
router.get('/markets', async (req, res, next) => {
  try {
    const { exchange } = req.query;

    const markets = await exchangeManager.fetchMarkets(exchange as any);

    res.json({
      success: true,
      data: markets,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
