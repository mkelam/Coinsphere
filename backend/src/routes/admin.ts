import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { logger } from '../utils/logger.js';
import { priceUpdaterService } from '../services/priceUpdater.js';
import { priceHistoryService } from '../services/priceHistoryService.js';
import { auditLogService } from '../services/auditLog.js';
import { triggerManualUpdate } from '../services/priceUpdateScheduler.js';

const router = Router();

/**
 * @swagger
 * /admin/backfill-history:
 *   post:
 *     summary: Backfill historical price data for all tokens (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: number
 *                 description: Number of days to backfill
 *                 default: 365
 *               tokenId:
 *                 type: string
 *                 description: Optional - backfill specific token only
 *     responses:
 *       200:
 *         description: Backfill started successfully
 *       403:
 *         description: Admin access required
 */
router.post('/backfill-history', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      days: z.number().min(1).max(2000).optional().default(365),
      tokenId: z.string().optional(),
    });

    const { days, tokenId } = schema.parse(req.body);

    logger.info(`Admin ${req.user!.email} initiated backfill: ${days} days ${tokenId ? `for token ${tokenId}` : 'for all tokens'}`);

    // Audit log
    auditLogService.logAdmin({
      action: 'token_update',
      userId: req.user!.id,
      resourceId: tokenId || 'all',
      status: 'success',
      req,
      metadata: { days, tokenId, operation: 'price_history_backfill' },
    }).catch((err) => logger.error('Failed to log backfill audit:', err));

    if (tokenId) {
      // Backfill single token
      const count = await priceHistoryService.backfillTokenHistory(tokenId, days, 'day');
      res.json({
        success: true,
        message: `Backfilled ${count} candles for token ${tokenId}`,
        candlesInserted: count,
      });
    } else {
      // Backfill all tokens (async - don't wait)
      priceUpdaterService.backfillAllHistory(days).then(() => {
        logger.info(`Backfill complete for all tokens`);
      }).catch((err) => {
        logger.error('Backfill failed:', err);
      });

      res.json({
        success: true,
        message: `Backfill started for all tokens (${days} days). Check logs for progress.`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error in backfill endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/update-history:
 *   post:
 *     summary: Update recent historical data for all tokens (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hours:
 *                 type: number
 *                 description: Number of hours to update
 *                 default: 24
 *     responses:
 *       200:
 *         description: Update started successfully
 *       403:
 *         description: Admin access required
 */
router.post('/update-history', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      hours: z.number().min(1).max(168).optional().default(24), // max 1 week
    });

    const { hours } = schema.parse(req.body);

    logger.info(`Admin ${req.user!.email} initiated history update: ${hours} hours`);

    // Audit log
    auditLogService.logAdmin({
      action: 'token_update',
      userId: req.user!.id,
      status: 'success',
      req,
      metadata: { hours, operation: 'price_history_update' },
    }).catch((err) => logger.error('Failed to log update audit:', err));

    // Run async
    priceHistoryService.updateAllRecentHistory(hours).then((result) => {
      logger.info(`History update complete: ${result.success} success, ${result.failed} failed`);
    }).catch((err) => {
      logger.error('History update failed:', err);
    });

    res.json({
      success: true,
      message: `History update started for all tokens (${hours} hours). Check logs for progress.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error('Error in update history endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/trigger-price-update:
 *   post:
 *     summary: Manually trigger automated price data update (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Price update triggered successfully
 *       403:
 *         description: Admin access required
 */
router.post('/trigger-price-update', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    logger.info(`Admin ${req.user!.email} manually triggered price data update`);

    // Audit log
    auditLogService.logAdmin({
      action: 'system_update',
      userId: req.user!.id,
      status: 'success',
      req,
      metadata: { operation: 'manual_price_update_trigger' },
    }).catch((err) => logger.error('Failed to log trigger audit:', err));

    // Trigger update async
    triggerManualUpdate().then(() => {
      logger.info('Manual price update completed successfully');
    }).catch((err) => {
      logger.error('Manual price update failed:', err);
    });

    res.json({
      success: true,
      message: 'Price data update triggered successfully. This will fetch latest data from CoinGecko for all configured symbols. Check logs for progress.',
    });
  } catch (error) {
    logger.error('Error in trigger-price-update endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /admin/data-status:
 *   get:
 *     summary: Get historical data status for all tokens (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data status retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/data-status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { prisma } = await import('../lib/prisma.js');

    const tokens = await prisma.token.findMany({
      select: {
        id: true,
        symbol: true,
        name: true,
      },
    });

    const statusPromises = tokens.map(async (token) => {
      const freshness = await priceHistoryService.getDataFreshness(token.id);
      const hasData = await priceHistoryService.hasHistoricalData(token.id, 7);

      return {
        symbol: token.symbol,
        name: token.name,
        latestDataTime: freshness.latestDataTime,
        hoursOld: freshness.hoursOld,
        needsUpdate: freshness.needsUpdate,
        hasWeekData: hasData,
      };
    });

    const statuses = await Promise.all(statusPromises);

    const summary = {
      total: statuses.length,
      upToDate: statuses.filter((s) => !s.needsUpdate).length,
      needsUpdate: statuses.filter((s) => s.needsUpdate).length,
      hasWeekData: statuses.filter((s) => s.hasWeekData).length,
      noData: statuses.filter((s) => !s.latestDataTime).length,
    };

    res.json({
      summary,
      tokens: statuses,
    });
  } catch (error) {
    logger.error('Error in data status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
