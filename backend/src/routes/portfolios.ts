import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// GET /api/v1/portfolios - Get user's portfolios
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: {
            token: {
              select: {
                symbol: true,
                name: true,
                currentPrice: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    res.json({ portfolios });
  } catch (error) {
    logger.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/portfolios - Create portfolio
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const portfolioSchema = z.object({
      name: z.string(),
      description: z.string().optional(),
    });

    const data = portfolioSchema.parse(req.body);

    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
      },
    });

    logger.info(`Portfolio created for user ${userId}: ${portfolio.name}`);
    res.status(201).json({ portfolio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error creating portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/portfolios/:id/holdings - Add holding to portfolio
router.post('/:id/holdings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: portfolioId } = req.params;

    // Verify portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const holdingSchema = z.object({
      tokenSymbol: z.string(),
      amount: z.number().positive(),
      averageBuyPrice: z.number().positive().optional(),
      source: z.string().optional(),
    });

    const data = holdingSchema.parse(req.body);

    // Find token
    const token = await prisma.token.findUnique({
      where: { symbol: data.tokenSymbol.toUpperCase() },
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Create holding
    const holding = await prisma.holding.create({
      data: {
        portfolioId,
        tokenId: token.id,
        amount: data.amount,
        averageBuyPrice: data.averageBuyPrice,
        source: data.source,
      },
      include: {
        token: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });

    logger.info(`Holding added to portfolio ${portfolioId}: ${data.amount} ${token.symbol}`);
    res.status(201).json({ holding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error adding holding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
