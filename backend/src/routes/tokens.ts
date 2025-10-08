import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GET /api/v1/tokens - List all tokens
router.get('/', async (req: AuthRequest, res: Response) => {
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

// GET /api/v1/tokens/:symbol - Get specific token
router.get('/:symbol', async (req: AuthRequest, res: Response) => {
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

// POST /api/v1/tokens - Create token (admin only, for now unprotected for seeding)
router.post('/', async (req: AuthRequest, res: Response) => {
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
    res.status(201).json({ token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error creating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
