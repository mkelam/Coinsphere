import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { ExchangeService, SUPPORTED_EXCHANGES } from '../services/exchangeService';
import { scheduleSyncJob, removeScheduledSync, triggerImmediateSync } from '../services/exchangeSyncQueue';

const router = Router();
const prisma = new PrismaClient();

/**
 * Validation schemas
 */
const ConnectExchangeSchema = z.object({
  exchange: z.enum(SUPPORTED_EXCHANGES as any),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
  passphrase: z.string().optional(),
  label: z.string().optional()
});

const TestConnectionSchema = z.object({
  exchange: z.enum(SUPPORTED_EXCHANGES as any),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  passphrase: z.string().optional()
});

/**
 * GET /api/v1/exchanges/supported
 * Get list of supported exchanges
 */
router.get('/supported', (req, res) => {
  res.json({
    exchanges: SUPPORTED_EXCHANGES.map(ex => ({
      id: ex,
      name: ex.charAt(0).toUpperCase() + ex.slice(1),
      requiresPassphrase: ['coinbase', 'kucoin'].includes(ex)
    }))
  });
});

/**
 * POST /api/v1/exchanges/test
 * Test exchange connection without saving
 */
router.post('/test', async (req, res) => {
  try {
    const body = TestConnectionSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const result = await ExchangeService.testConnection(body.exchange, {
      apiKey: body.apiKey,
      apiSecret: body.apiSecret,
      passphrase: body.passphrase
    });

    res.json(result);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Test failed'
    });
  }
});

/**
 * POST /api/v1/exchanges/connect
 * Connect user's exchange account
 */
router.post('/connect', async (req, res) => {
  try {
    const body = ConnectExchangeSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const result = await ExchangeService.connectExchange(
      userId,
      body.exchange,
      {
        apiKey: body.apiKey,
        apiSecret: body.apiSecret,
        passphrase: body.passphrase
      },
      body.label
    );

    if (result.success && result.connectionId) {
      // Schedule automatic sync job
      const connection = await prisma.exchangeConnection.findUnique({
        where: { id: result.connectionId },
        select: { syncInterval: true, autoSync: true }
      });

      if (connection && connection.autoSync) {
        await scheduleSyncJob(result.connectionId, userId, connection.syncInterval);
      }

      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect exchange'
    });
  }
});

/**
 * GET /api/v1/exchanges/connections
 * Get all user's exchange connections
 */
router.get('/connections', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const connections = await ExchangeService.getUserConnections(userId);

    res.json({ connections });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch connections'
    });
  }
});

/**
 * POST /api/v1/exchanges/connections/:id/sync
 * Manually trigger sync for a connection
 */
router.post('/connections/:id/sync', async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = (req as any).user.userId;

    // Trigger immediate high-priority sync via queue
    await triggerImmediateSync(connectionId, userId);

    res.json({
      success: true,
      message: 'Sync queued'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Sync failed'
    });
  }
});

/**
 * DELETE /api/v1/exchanges/connections/:id
 * Disconnect exchange
 */
router.delete('/connections/:id', async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = (req as any).user.userId;

    // Remove scheduled sync job first
    await removeScheduledSync(connectionId);

    const result = await ExchangeService.disconnectExchange(userId, connectionId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to disconnect exchange'
    });
  }
});

/**
 * POST /api/v1/exchanges/sync-all
 * Sync all user's connections
 */
router.post('/sync-all', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    await ExchangeService.syncAllUserConnections(userId);

    res.json({
      success: true,
      message: 'All connections synced'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Sync failed'
    });
  }
});

export default router;
