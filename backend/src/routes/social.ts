/**
 * Social Sentiment Routes - LunarCrush Integration
 * Provides social metrics, Galaxy Score, and trending coins
 */

import { Router, Request, Response } from 'express';
import { lunarcrushService } from '../services/lunarcrushService.js';
import { lunarcrushMcpService } from '../services/lunarcrushMcpService.js';
import { logger } from '../utils/logger.js';
import { cache } from '../middleware/cache.js';

const router = Router();

// Feature flag to enable MCP mode
const USE_MCP = process.env.LUNARCRUSH_USE_MCP === 'true';

/**
 * @swagger
 * /social/{symbol}:
 *   get:
 *     summary: Get social sentiment metrics for a cryptocurrency
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol (e.g., BTC, ETH)
 *     responses:
 *       200:
 *         description: Social metrics retrieved successfully (cached 15 min)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     galaxyScore:
 *                       type: number
 *                       description: LunarCrush Galaxy Score (0-100)
 *                     altRank:
 *                       type: number
 *                       description: Alternative rank
 *                     socialDominance:
 *                       type: number
 *                       description: Social dominance percentage
 *                     socialVolume:
 *                       type: number
 *                       description: Total social mentions
 *                     tweets24h:
 *                       type: number
 *                       description: Twitter mentions in last 24h
 *                     redditPosts24h:
 *                       type: number
 *                       description: Reddit posts in last 24h
 *                     sentiment:
 *                       type: number
 *                       description: Sentiment score (-1 to 1)
 *                     sentimentAbsolute:
 *                       type: number
 *                       description: Absolute sentiment (0-100)
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:symbol', cache({ ttl: 900, prefix: 'social' }), async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    // Use MCP service if enabled, otherwise fall back to REST
    const service = USE_MCP ? lunarcrushMcpService : lunarcrushService;
    const metrics = await service.getCoinData(symbol);

    if (!metrics) {
      return res.status(404).json({
        error: 'Social data not found',
        message: `No LunarCrush data available for ${symbol}`,
      });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      metrics,
      timestamp: new Date().toISOString(),
      source: USE_MCP ? 'LunarCrush MCP' : 'LunarCrush REST',
      mode: USE_MCP ? 'SSE' : 'REST',
    });
  } catch (error) {
    logger.error('Error fetching social metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /social/trending:
 *   get:
 *     summary: Get trending cryptocurrencies based on social metrics
 *     tags: [Social]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of trending coins to return
 *     responses:
 *       200:
 *         description: Trending coins retrieved successfully (cached 15 min)
 */
router.get('/trending/coins', cache({ ttl: 900, prefix: 'social-trending' }), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 50);

    const trending = await lunarcrushService.getTrendingCoins(limit);

    res.json({
      trending,
      count: trending.length,
      timestamp: new Date().toISOString(),
      source: 'LunarCrush',
    });
  } catch (error) {
    logger.error('Error fetching trending coins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /social/{symbol}/sentiment-score:
 *   get:
 *     summary: Get simplified sentiment score (0-100) for predictions/risk
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sentiment score retrieved successfully
 */
router.get('/:symbol/sentiment-score', cache({ ttl: 900, prefix: 'sentiment-score' }), async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    const score = await lunarcrushService.getSentimentScore(symbol);

    // Interpret the score
    let interpretation: string;
    let level: string;

    if (score >= 75) {
      interpretation = 'Very Positive';
      level = 'bullish';
    } else if (score >= 60) {
      interpretation = 'Positive';
      level = 'slightly_bullish';
    } else if (score >= 40) {
      interpretation = 'Neutral';
      level = 'neutral';
    } else if (score >= 25) {
      interpretation = 'Negative';
      level = 'slightly_bearish';
    } else {
      interpretation = 'Very Negative';
      level = 'bearish';
    }

    res.json({
      symbol: symbol.toUpperCase(),
      sentimentScore: score,
      interpretation,
      level,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error calculating sentiment score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /social/batch:
 *   post:
 *     summary: Get sentiment scores for multiple symbols
 *     tags: [Social]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Batch sentiment scores retrieved
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'symbols array is required',
      });
    }

    if (symbols.length > 20) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Maximum 20 symbols allowed per request',
      });
    }

    const sentimentMap = await lunarcrushService.getBatchSentiment(symbols);

    const results = symbols.map((symbol) => ({
      symbol: symbol.toUpperCase(),
      sentiment: sentimentMap.get(symbol.toUpperCase()) || 0,
    }));

    res.json({
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching batch sentiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /social/health:
 *   get:
 *     summary: Check LunarCrush API health
 *     tags: [Social]
 *     responses:
 *       200:
 *         description: API health status
 */
router.get('/health/check', async (req: Request, res: Response) => {
  try {
    const isHealthy = await lunarcrushService.ping();

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'LunarCrush',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error checking LunarCrush health:', error);
    res.status(503).json({
      status: 'error',
      service: 'LunarCrush',
      error: 'Service unavailable',
    });
  }
});

/**
 * @swagger
 * /social/mcp/status:
 *   get:
 *     summary: Check LunarCrush MCP SSE connection status
 *     tags: [Social]
 *     responses:
 *       200:
 *         description: MCP connection status
 */
router.get('/mcp/status', async (req: Request, res: Response) => {
  try {
    const mcpHealthy = lunarcrushMcpService.isHealthy();
    const restHealthy = await lunarcrushService.ping();

    res.json({
      mcp: {
        enabled: USE_MCP,
        connected: mcpHealthy,
        status: mcpHealthy ? 'connected' : 'disconnected',
      },
      rest: {
        available: restHealthy,
        status: restHealthy ? 'available' : 'unavailable',
      },
      activeMode: USE_MCP ? 'MCP (SSE)' : 'REST',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error checking MCP status:', error);
    res.status(500).json({
      error: 'Failed to check MCP status',
    });
  }
});

export default router;
