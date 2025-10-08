import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { logger } from '../utils/logger.js';
import { cache, invalidateCache } from '../middleware/cache.js';
import { auditLogService } from '../services/auditLog.js';

const router = Router();

// GET /api/v1/tokens - List all tokens (cached for 30 seconds)
router.get('/', cache({ ttl: 30, prefix: 'tokens' }), async (req: AuthRequest, res: Response) => {
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

// GET /api/v1/tokens/:symbol/history - Get price history for token (cached for 60 seconds, vary by timeframe)
router.get('/:symbol/history', cache({ ttl: 60, prefix: 'token-history', varyBy: ['timeframe'] }), async (req: AuthRequest, res: Response) => {
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

// GET /api/v1/tokens/:symbol - Get specific token (cached for 30 seconds)
router.get('/:symbol', cache({ ttl: 30, prefix: 'token' }), async (req: AuthRequest, res: Response) => {
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
      userId: req.user!.userId,
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
    if (req.user?.userId) {
      auditLogService.logAdmin({
        action: 'token_create',
        userId: req.user.userId,
        status: 'failure',
        req,
        errorMessage: error instanceof Error ? error.message : 'Token creation failed',
      }).catch((err) => logger.error('Failed to log token creation failure audit:', err));
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
