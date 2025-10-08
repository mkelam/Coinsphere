/**
 * Holdings Routes
 * RESTful API endpoints for managing portfolio holdings
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types/express.js';
import { holdingsService } from '../services/holdingsService.js';
import { auditLogService } from '../services/auditLog.js';
import logger from '../utils/logger.js';

const router = Router();

// Validation schemas
const createHoldingSchema = z.object({
  portfolioId: z.string().uuid(),
  tokenSymbol: z.string().min(1).max(20),
  amount: z.number().positive(),
  averageBuyPrice: z.number().positive().optional(),
  source: z.enum(['exchange', 'wallet', 'manual']).optional(),
  sourceId: z.string().optional(),
});

const updateHoldingSchema = z.object({
  amount: z.number().positive().optional(),
  averageBuyPrice: z.number().positive().optional(),
  source: z.enum(['exchange', 'wallet', 'manual']).optional(),
  sourceId: z.string().optional(),
});

const topPerformersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * POST /api/v1/holdings
 * Add a new holding to a portfolio
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = createHoldingSchema.parse(req.body);

    const holding = await holdingsService.addHolding(data, userId);

    if (holding === null) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'holding_create',
      resource: 'holding',
      resourceId: holding.id,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      metadata: {
        portfolioId: data.portfolioId,
        tokenSymbol: data.tokenSymbol,
        amount: data.amount,
      },
    });

    res.status(201).json({ holding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Error creating holding:', error);

    await auditLogService.log({
      userId: req.user!.userId,
      action: 'holding_create',
      resource: 'holding',
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message.includes('Token not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to create holding' });
  }
});

/**
 * GET /api/v1/holdings/:id
 * Get a specific holding by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const holdingId = req.params.id;

    const holding = await holdingsService.getHoldingById(holdingId, userId);

    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    res.json({ holding });
  } catch (error) {
    logger.error('Error fetching holding:', error);
    res.status(500).json({ error: 'Failed to fetch holding' });
  }
});

/**
 * GET /api/v1/holdings/portfolio/:portfolioId
 * Get all holdings for a specific portfolio
 */
router.get('/portfolio/:portfolioId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.portfolioId;

    const holdings = await holdingsService.getPortfolioHoldings(portfolioId, userId);

    if (holdings === null) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({
      holdings,
      count: holdings.length,
    });
  } catch (error) {
    logger.error('Error fetching portfolio holdings:', error);
    res.status(500).json({ error: 'Failed to fetch holdings' });
  }
});

/**
 * PUT /api/v1/holdings/:id
 * Update a holding
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const holdingId = req.params.id;
    const data = updateHoldingSchema.parse(req.body);

    const holding = await holdingsService.updateHolding(holdingId, userId, data);

    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'holding_update',
      resource: 'holding',
      resourceId: holdingId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      metadata: data,
    });

    res.json({ holding });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Error updating holding:', error);

    await auditLogService.log({
      userId: req.user!.userId,
      action: 'holding_update',
      resource: 'holding',
      resourceId: req.params.id,
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to update holding' });
  }
});

/**
 * DELETE /api/v1/holdings/:id
 * Delete a holding
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const holdingId = req.params.id;

    const result = await holdingsService.deleteHolding(holdingId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Audit log
    await auditLogService.log({
      userId,
      action: 'holding_delete',
      resource: 'holding',
      resourceId: holdingId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
    });

    res.json({ message: 'Holding deleted successfully' });
  } catch (error) {
    logger.error('Error deleting holding:', error);

    await auditLogService.log({
      userId: req.user!.userId,
      action: 'holding_delete',
      resource: 'holding',
      resourceId: req.params.id,
      status: 'error',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Failed to delete holding' });
  }
});

/**
 * GET /api/v1/holdings/summary/all
 * Get aggregated holdings summary across all portfolios
 */
router.get('/summary/all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const summary = await holdingsService.getUserHoldingsSummary(userId);

    res.json(summary);
  } catch (error) {
    logger.error('Error fetching holdings summary:', error);
    res.status(500).json({ error: 'Failed to fetch holdings summary' });
  }
});

/**
 * GET /api/v1/holdings/top-performers
 * Get top performing holdings across all portfolios
 */
router.get('/top-performers', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { limit } = topPerformersQuerySchema.parse(req.query);

    const topPerformers = await holdingsService.getTopPerformingHoldings(userId, limit);

    res.json({
      holdings: topPerformers,
      count: topPerformers.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
    }

    logger.error('Error fetching top performers:', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

export default router;
