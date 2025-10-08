import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/transactions
 * Get all transactions for the authenticated user's portfolios
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { portfolioId, limit = '50', offset = '0' } = req.query;

    const where: any = {
      portfolio: {
        userId,
      },
    };

    if (portfolioId) {
      where.portfolioId = portfolioId as string;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        token: {
          select: {
            symbol: true,
            name: true,
            logoUrl: true,
          },
        },
        portfolio: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/transactions/:id
 * Get a specific transaction
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
      include: {
        token: {
          select: {
            symbol: true,
            name: true,
            logoUrl: true,
            currentPrice: true,
          },
        },
        portfolio: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/transactions
 * Create a new transaction
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      portfolioId,
      tokenSymbol,
      type,
      amount,
      price,
      fee = 0,
      notes,
      timestamp,
    } = req.body;

    // Validate required fields
    if (!portfolioId || !tokenSymbol || !type || !amount || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate transaction type
    if (!['buy', 'sell', 'transfer_in', 'transfer_out'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Verify portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Find token
    const token = await prisma.token.findFirst({
      where: { symbol: tokenSymbol.toUpperCase() },
    });

    if (!token) {
      return res.status(404).json({ error: `Token ${tokenSymbol} not found` });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        portfolioId,
        tokenId: token.id,
        type,
        amount: parseFloat(amount),
        price: parseFloat(price),
        fee: parseFloat(fee || '0'),
        notes,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
      include: {
        token: {
          select: {
            symbol: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    logger.info(
      `Created ${type} transaction for user ${userId}: ${amount} ${tokenSymbol} @ $${price}`
    );

    res.status(201).json({ transaction });
  } catch (error) {
    logger.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/transactions/:id
 * Update a transaction
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { type, amount, price, fee, notes, timestamp } = req.body;

    // Find transaction and verify ownership
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Validate transaction type if provided
    if (type && !['buy', 'sell', 'transfer_in', 'transfer_out'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(fee !== undefined && { fee: parseFloat(fee) }),
        ...(notes !== undefined && { notes }),
        ...(timestamp && { timestamp: new Date(timestamp) }),
      },
      include: {
        token: {
          select: {
            symbol: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    logger.info(`Updated transaction ${id} for user ${userId}`);

    res.json({ transaction });
  } catch (error) {
    logger.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/transactions/:id
 * Delete a transaction
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    // Find transaction and verify ownership
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        portfolio: {
          userId,
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await prisma.transaction.delete({ where: { id } });

    logger.info(`Deleted transaction ${id} for user ${userId}`);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/transactions/bulk
 * Create multiple transactions at once (bulk import)
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { portfolioId, transactions } = req.body;

    if (!portfolioId || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Process transactions
    const createdTransactions = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      try {
        // Find token
        const token = await prisma.token.findFirst({
          where: { symbol: tx.tokenSymbol.toUpperCase() },
        });

        if (!token) {
          errors.push({ index: i, error: `Token ${tx.tokenSymbol} not found` });
          continue;
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            portfolioId,
            tokenId: token.id,
            type: tx.type,
            amount: parseFloat(tx.amount),
            price: parseFloat(tx.price),
            fee: parseFloat(tx.fee || '0'),
            notes: tx.notes,
            timestamp: tx.timestamp ? new Date(tx.timestamp) : new Date(),
          },
        });

        createdTransactions.push(transaction);
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message });
      }
    }

    logger.info(
      `Bulk created ${createdTransactions.length} transactions for user ${userId} (${errors.length} errors)`
    );

    res.status(201).json({
      success: createdTransactions.length,
      errors,
      transactions: createdTransactions,
    });
  } catch (error) {
    logger.error('Error bulk creating transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
