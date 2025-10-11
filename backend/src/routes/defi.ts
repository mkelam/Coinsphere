/**
 * DeFi Routes - API endpoints for DeFi protocol integration
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  syncDefiPositions,
  getUserDefiPositions,
  getUserDefiValue,
  getSupportedProtocols,
} from '../services/defiService.js';
import { updateAllPositionApy, clearApyCache } from '../services/apyService.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

/**
 * GET /api/v1/defi/protocols
 * Get list of supported DeFi protocols
 */
router.get('/protocols', async (req, res) => {
  try {
    const protocols = await getSupportedProtocols();

    res.json({
      success: true,
      data: protocols,
      count: protocols.length,
    });
  } catch (error: any) {
    console.error('Error fetching DeFi protocols:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi protocols',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/defi/positions
 * Get user's DeFi positions across all protocols
 */
router.get('/positions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const positions = await getUserDefiPositions(userId);
    const totalValue = await getUserDefiValue(userId);

    res.json({
      success: true,
      data: {
        positions,
        totalValue: totalValue.toString(),
        count: positions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching DeFi positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi positions',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/defi/sync
 * Manually trigger sync of DeFi positions for connected wallets
 *
 * Body (optional):
 * {
 *   "blockchains": ["ethereum", "polygon", "arbitrum"] // Defaults to ["ethereum"]
 * }
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { blockchains = ['ethereum'] } = req.body;

    // Validate blockchains parameter
    const validBlockchains = ['ethereum', 'polygon', 'optimism', 'arbitrum', 'base', 'bsc'];
    const invalidChains = blockchains.filter((chain: string) => !validBlockchains.includes(chain));

    if (invalidChains.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid blockchains',
        message: `Invalid blockchain(s): ${invalidChains.join(', ')}. Valid options: ${validBlockchains.join(', ')}`,
      });
    }

    // Get all connected wallets for the user
    const wallets = await prisma.walletConnection.findMany({
      where: {
        userId,
        status: 'active',
        autoSync: true,
      },
    });

    if (wallets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active wallet connections found',
        message: 'Please connect a wallet first',
      });
    }

    // Sync positions for all wallets across specified blockchains
    const syncResults = [];
    for (const wallet of wallets) {
      try {
        await syncDefiPositions(userId, wallet.address, blockchains);
        syncResults.push({
          wallet: wallet.address,
          blockchain: wallet.blockchain,
          syncedChains: blockchains,
          status: 'success',
        });
      } catch (error: any) {
        console.error(`Error syncing wallet ${wallet.address}:`, error);
        syncResults.push({
          wallet: wallet.address,
          blockchain: wallet.blockchain,
          syncedChains: blockchains,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Update last sync time for wallets
    await prisma.walletConnection.updateMany({
      where: {
        userId,
        status: 'active',
      },
      data: {
        lastSyncAt: new Date(),
      },
    });

    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;

    res.json({
      success: true,
      message: `Synced ${successCount} wallet(s) successfully`,
      data: {
        results: syncResults,
        summary: {
          total: wallets.length,
          success: successCount,
          errors: errorCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Error syncing DeFi positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync DeFi positions',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/defi/protocols/:protocolId/positions
 * Get user's positions for a specific protocol
 */
router.get('/protocols/:protocolId/positions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { protocolId } = req.params;

    // Verify protocol exists
    const protocol = await prisma.defiProtocol.findUnique({
      where: { id: protocolId },
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found',
      });
    }

    const positions = await prisma.defiPosition.findMany({
      where: {
        userId,
        protocolId,
        status: 'active',
      },
      include: {
        protocol: true,
      },
      orderBy: {
        valueUsd: 'desc',
      },
    });

    const totalValue = positions.reduce(
      (sum, position) => sum.plus(position.valueUsd),
      new (require('@prisma/client/runtime/library').Decimal)(0)
    );

    res.json({
      success: true,
      data: {
        protocol,
        positions,
        totalValue: totalValue.toString(),
        count: positions.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching protocol positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol positions',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/defi/stats
 * Get user's DeFi portfolio statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const positions = await prisma.defiPosition.findMany({
      where: {
        userId,
        status: 'active',
      },
      include: {
        protocol: true,
      },
    });

    // Calculate statistics
    const totalValue = positions.reduce(
      (sum, pos) => sum.plus(pos.valueUsd),
      new (require('@prisma/client/runtime/library').Decimal)(0)
    );

    const protocolCount = new Set(positions.map(p => p.protocolId)).size;

    const positionsByType = positions.reduce((acc, pos) => {
      acc[pos.positionType] = (acc[pos.positionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgApy = positions
      .filter(p => p.apy !== null)
      .reduce((sum, pos) => sum.plus(pos.apy!), new (require('@prisma/client/runtime/library').Decimal)(0))
      .div(positions.filter(p => p.apy !== null).length || 1);

    res.json({
      success: true,
      data: {
        totalValue: totalValue.toString(),
        totalPositions: positions.length,
        protocolCount,
        positionsByType,
        averageApy: avgApy.toString(),
        lastSync: positions.length > 0
          ? positions.reduce((latest, pos) => pos.lastSyncAt > latest ? pos.lastSyncAt : latest, positions[0].lastSyncAt)
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching DeFi stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/defi/apy/update
 * Manually trigger APY update for all positions
 * (Admin endpoint - should be restricted in production)
 */
router.post('/apy/update', authenticate, async (req, res) => {
  try {
    console.log('Starting manual APY update...');
    const result = await updateAllPositionApy();

    res.json({
      success: true,
      message: 'APY update complete',
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating APY:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update APY',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/defi/apy/cache
 * Clear APY cache to force refresh
 * (Admin endpoint - should be restricted in production)
 */
router.delete('/apy/cache', authenticate, async (req, res) => {
  try {
    await clearApyCache();

    res.json({
      success: true,
      message: 'APY cache cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing APY cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear APY cache',
      message: error.message,
    });
  }
});

export default router;
