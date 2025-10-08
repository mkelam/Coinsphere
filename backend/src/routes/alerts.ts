import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/alerts
 * Get all alerts for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ alerts });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/alerts
 * Create a new alert
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { alertType, tokenSymbol, condition, threshold } = req.body;

    if (!alertType || !tokenSymbol || !condition || threshold === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        alertType,
        tokenSymbol: tokenSymbol.toUpperCase(),
        condition,
        threshold,
      },
    });

    logger.info(`Created alert for user ${userId}: ${tokenSymbol} ${condition} ${threshold}`);

    res.status(201).json({ alert });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/alerts/:id
 * Delete an alert
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const alert = await prisma.alert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await prisma.alert.delete({ where: { id } });

    logger.info(`Deleted alert ${id} for user ${userId}`);

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/v1/alerts/:id/toggle
 * Toggle alert active status
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const alert = await prisma.alert.findFirst({
      where: { id, userId },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { isActive: !alert.isActive },
    });

    res.json({ alert: updated });
  } catch (error) {
    logger.error('Error toggling alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
