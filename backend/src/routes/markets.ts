import { Router, Request, Response } from 'express';
import { cryptocompareService } from '../services/cryptocompare.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/v1/markets
 * Get top N cryptocurrencies by market cap from CryptoCompare
 * Query params:
 * - limit: number of coins to fetch (default: 100, max: 1000)
 * - currency: target currency (default: USD)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const currency = (req.query.currency as string)?.toUpperCase() || 'USD';

    logger.info(`Fetching top ${limit} coins from CryptoCompare`);

    const coins = await cryptocompareService.getTopCoinsMarketData(limit, currency);

    res.json({
      data: coins,
      count: coins.length,
      source: 'CryptoCompare',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error fetching markets data:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/markets/health
 * Check if CryptoCompare API is accessible
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await cryptocompareService.ping();

    res.json({
      status: isHealthy ? 'ok' : 'error',
      service: 'CryptoCompare',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('CryptoCompare health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'CryptoCompare',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
