import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { logger } from '../utils/logger.js';
import { cache, invalidateCache } from '../middleware/cache.js';
import { auditLogService } from '../services/auditLog.js';

const router = Router();

/**
 * @swagger
 * /tokens:
 *   get:
 *     summary: List all cryptocurrency tokens
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens retrieved successfully (cached 30s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Token'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', authenticate, cache({ ttl: 30, prefix: 'tokens' }), async (req: AuthRequest, res: Response) => {
  try {
    const tokens = await prisma.token.findMany({
      select: {
        id: true,
        symbol: true,
        name: true,
        blockchain: true,
        logoUrl: true,
        currentPrice: true,
        marketCap: true,
        volume24h: true,
        priceChange24h: true,
      },
      orderBy: {
        marketCap: 'desc',
      },
      take: 100,
    });

    res.json({ tokens });
  } catch (error) {
    logger.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tokens/{symbol}/history:
 *   get:
 *     summary: Get price history for a token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 1y]
 *           default: 7d
 *         description: Timeframe for price history
 *     responses:
 *       200:
 *         description: Price history retrieved successfully (cached 60s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                 timeframe:
 *                   type: string
 *                 priceHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: number
 *                         description: Unix timestamp
 *                       price:
 *                         type: number
 *                       open:
 *                         type: number
 *                       high:
 *                         type: number
 *                       low:
 *                         type: number
 *                       volume:
 *                         type: number
 *                 currentPrice:
 *                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:symbol/history', authenticate, cache({ ttl: 60, prefix: 'token-history', varyBy: ['timeframe'] }), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '7d' } = req.query;

    const token = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Calculate time range based on timeframe
    const now = new Date();
    let startTime: Date;
    let interval: number; // in minutes

    switch (timeframe) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = 60; // 1 hour intervals
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 4 * 60; // 4 hour intervals
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = 24 * 60; // 1 day intervals
        break;
      case '1y':
        startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = 7 * 24 * 60; // 1 week intervals
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 4 * 60;
    }

    // Fetch price data from TimescaleDB
    const priceData = await prisma.priceData.findMany({
      where: {
        tokenId: token.id,
        time: {
          gte: startTime,
        },
      },
      orderBy: {
        time: 'asc',
      },
    });

    // Format data for frontend
    const priceHistory = priceData.map((data) => ({
      time: data.time.getTime(),
      price: data.close,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
    }));

    res.json({
      symbol: token.symbol,
      timeframe,
      priceHistory,
      currentPrice: token.currentPrice,
    });
  } catch (error) {
    logger.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /tokens/{symbol}:
 *   get:
 *     summary: Get specific token by symbol
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol (e.g., BTC, ETH)
 *     responses:
 *       200:
 *         description: Token retrieved successfully (cached 30s)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   $ref: '#/components/schemas/Token'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:symbol', authenticate, cache({ ttl: 30, prefix: 'token' }), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;

    const token = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token });
  } catch (error) {
    logger.error('Error fetching token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/tokens - Create token (admin only)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tokenSchema = z.object({
      symbol: z.string(),
      name: z.string(),
      blockchain: z.string(),
      coingeckoId: z.string().optional(),
      contractAddress: z.string().optional(),
      decimals: z.number().optional(),
      logoUrl: z.string().optional(),
    });

    const data = tokenSchema.parse(req.body);

    const token = await prisma.token.create({
      data: {
        ...data,
        symbol: data.symbol.toUpperCase(),
      },
    });

    logger.info(`Token created: ${token.symbol}`);

    // Audit log token creation
    auditLogService.logAdmin({
      action: 'token_create',
      userId: req.user!.id,
      resourceId: token.id,
      status: 'success',
      req,
      metadata: { symbol: token.symbol, name: token.name },
    }).catch((err) => logger.error('Failed to log token creation audit:', err));

    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error creating token:', error);

    // Audit log error
    if (req.user?.id) {
      auditLogService.logAdmin({
        action: 'token_create',
        userId: req.user.id,
        status: 'failure',
        req,
        errorMessage: error instanceof Error ? error.message : 'Token creation failed',
      }).catch((err) => logger.error('Failed to log token creation failure audit:', err));
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
