import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { riskEngine } from '../services/riskEngine.js';

const router = Router();

/**
 * GET /api/v1/risk/:symbol
 * Get Degen Risk Score for a specific token
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    const token = await prisma.token.findFirst({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Try to get cached score first
    let riskScore = await riskEngine.getCachedRiskScore(token.id);

    // If no cached score or expired, calculate new one
    if (!riskScore) {
      riskScore = await riskEngine.calculateRiskScore(token.id);
    }

    logger.info(`Risk score for ${symbol}: ${riskScore.overallScore}/100 (${riskScore.riskLevel})`);

    res.json({
      symbol: token.symbol,
      name: token.name,
      riskScore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching risk score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/risk/batch
 * Get risk scores for multiple tokens
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }

    const tokens = await prisma.token.findMany({
      where: {
        symbol: { in: symbols.map((s: string) => s.toUpperCase()) },
      },
    });

    const riskScores = await Promise.all(
      tokens.map(async (token) => {
        let score = await riskEngine.getCachedRiskScore(token.id);
        if (!score) {
          score = await riskEngine.calculateRiskScore(token.id);
        }
        return {
          symbol: token.symbol,
          name: token.name,
          riskScore: score,
        };
      })
    );

    res.json({
      scores: riskScores,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching batch risk scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
