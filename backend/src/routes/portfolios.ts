import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { portfolioService } from '../services/portfolioService.js';
import { auditLogService } from '../services/auditLog.js';

const router = Router();

// All portfolio routes require authentication
router.use(authenticate);

// Validation schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

const performanceQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

// GET /api/v1/portfolios - Get user's portfolios with stats
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const portfolios = await portfolioService.getUserPortfolios(userId);

    res.json({
      portfolios,
      count: portfolios.length,
    });
  } catch (error) {
    logger.error('Error fetching portfolios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/portfolios - Create portfolio
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = createPortfolioSchema.parse(req.body);

    const portfolio = await portfolioService.createPortfolio({
      userId,
      name: data.name,
      description: data.description,
    });

    // Audit log
    await auditLogService.log({
      userId,
      action: 'portfolio_create',
      resource: 'portfolio',
      resourceId: portfolio.id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      metadata: { name: portfolio.name },
    });

    logger.info(`Portfolio created for user ${userId}: ${portfolio.name}`);
    res.status(201).json({ portfolio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    await auditLogService.log({
      userId: req.user!.userId,
      action: 'portfolio_create',
      resource: 'portfolio',
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

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

// GET /api/v1/portfolios/:id - Get specific portfolio with full details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id;

    const portfolio = await portfolioService.getPortfolioById(portfolioId, userId);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ portfolio });
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/portfolios/:id - Update portfolio
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id;
    const data = updatePortfolioSchema.parse(req.body);

    const portfolio = await portfolioService.updatePortfolio(portfolioId, userId, data);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'portfolio_update',
      resource: 'portfolio',
      resourceId: portfolioId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      metadata: data,
    });

    res.json({ portfolio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    await auditLogService.log({
      userId: req.user!.userId,
      action: 'portfolio_update',
      resource: 'portfolio',
      resourceId: req.params.id,
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    logger.error('Error updating portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/portfolios/:id - Delete portfolio
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id;

    const result = await portfolioService.deletePortfolio(portfolioId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'portfolio_delete',
      resource: 'portfolio',
      resourceId: portfolioId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
    });

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    await auditLogService.log({
      userId: req.user!.userId,
      action: 'portfolio_delete',
      resource: 'portfolio',
      resourceId: req.params.id,
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    logger.error('Error deleting portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/portfolios/:id/performance - Get portfolio performance
router.get('/:id/performance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id;
    const { days } = performanceQuerySchema.parse(req.query);

    const performance = await portfolioService.getPortfolioPerformance(portfolioId, userId, days);

    if (performance === null) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({
      portfolioId,
      days,
      transactions: performance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }

    logger.error('Error fetching portfolio performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/portfolios/:id/allocation - Get portfolio allocation
router.get('/:id/allocation', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id;

    const allocation = await portfolioService.getPortfolioAllocation(portfolioId, userId);

    if (!allocation) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json(allocation);
  } catch (error) {
    logger.error('Error fetching portfolio allocation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
