/**
 * Trading Research API Routes - Phase 0
 *
 * Endpoints for Week 1-4 research activities
 */

import { Router } from 'express';
import { logger } from '../utils/logger.js';
import {
  discoverSmartMoneyWallets,
  enrichWalletData,
  calculateSocialLeadingScore,
  calculateVerificationScores,
  getResearchProgress
} from '../services/tradingResearchService.js';
import {
  extractStrategyArchetypes,
  getStrategyArchetypes,
  getStrategyByName
} from '../services/strategyExtractionService.js';
import {
  scoreAllStrategies,
  scoreStrategy,
  selectTopStrategies,
  getScoringReport
} from '../services/strategyScoringService.js';
import { prisma } from '../lib/prisma.js';
import { nansenMcpService } from '../services/nansenMcpService.js';

const router = Router();

/**
 * GET /api/v1/trading-research/progress
 * Get Phase 0 research progress summary
 */
router.get('/progress', async (req, res) => {
  try {
    const progress = await getResearchProgress();

    res.json({
      success: true,
      data: progress
    });
  } catch (error: any) {
    logger.error('Failed to get research progress', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve research progress'
    });
  }
});

/**
 * POST /api/v1/trading-research/discover-wallets
 * Week 1 Day 1-2: Discover Smart Money wallets via Nansen
 *
 * Body:
 * {
 *   "minPortfolioValue": 100000,
 *   "minActiveMonths": 12
 * }
 */
router.post('/discover-wallets', async (req, res) => {
  try {
    const { minPortfolioValue = 100000, minActiveMonths = 12 } = req.body;

    logger.info('Starting Smart Money wallet discovery', {
      minPortfolioValue,
      minActiveMonths
    });

    // Start discovery (runs async)
    discoverSmartMoneyWallets(minPortfolioValue, minActiveMonths)
      .then(() => {
        logger.info('Wallet discovery completed successfully');
      })
      .catch((error) => {
        logger.error('Wallet discovery failed', { error: error.message });
      });

    res.json({
      success: true,
      message: 'Wallet discovery initiated',
      criteria: {
        minPortfolioValue,
        minActiveMonths
      }
    });
  } catch (error: any) {
    logger.error('Failed to initiate wallet discovery', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start wallet discovery'
    });
  }
});

/**
 * GET /api/v1/trading-research/wallets
 * List all discovered wallets with filters
 *
 * Query params:
 * - phase: week_1, week_2, week_3, week_4
 * - status: pending, verified, disqualified
 * - behaviorType: leading_indicator, mixed, follower
 * - limit: number (default 50)
 */
router.get('/wallets', async (req, res) => {
  try {
    const {
      phase,
      status,
      behaviorType,
      limit = 50
    } = req.query;

    const where: any = {};

    if (phase) where.researchPhase = phase;
    if (status) where.verificationStatus = status;
    if (behaviorType) where.behaviorType = behaviorType;

    const wallets = await prisma.verifiedWallet.findMany({
      where,
      take: Number(limit),
      orderBy: [
        { socialLeadingScore: 'desc' },
        { totalVerificationScore: 'desc' }
      ],
      include: {
        _count: {
          select: {
            trades: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        wallets,
        count: wallets.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to list wallets', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallets'
    });
  }
});

/**
 * GET /api/v1/trading-research/wallets/:address
 * Get detailed wallet data
 */
router.get('/wallets/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const wallet = await prisma.verifiedWallet.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        trades: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        socialSignals: {
          orderBy: { timestamp: 'desc' },
          take: 30
        }
      }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error: any) {
    logger.error('Failed to get wallet details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallet details'
    });
  }
});

/**
 * POST /api/v1/trading-research/wallets/:address/enrich
 * Enrich wallet with detailed Nansen data
 */
router.post('/wallets/:address/enrich', async (req, res) => {
  try {
    const { address } = req.params;

    logger.info('Enriching wallet data', { address });

    // Start enrichment (runs async)
    enrichWalletData(address)
      .then(() => {
        logger.info('Wallet enrichment completed', { address });
      })
      .catch((error) => {
        logger.error('Wallet enrichment failed', { address, error: error.message });
      });

    res.json({
      success: true,
      message: 'Wallet enrichment initiated',
      address
    });
  } catch (error: any) {
    logger.error('Failed to initiate wallet enrichment', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start wallet enrichment'
    });
  }
});

/**
 * POST /api/v1/trading-research/wallets/:address/social-score
 * Calculate social leading score
 */
router.post('/wallets/:address/social-score', async (req, res) => {
  try {
    const { address } = req.params;

    logger.info('Calculating social leading score', { address });

    const score = await calculateSocialLeadingScore(address);

    res.json({
      success: true,
      data: {
        address,
        socialLeadingScore: score
      }
    });
  } catch (error: any) {
    logger.error('Failed to calculate social score', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate social leading score'
    });
  }
});

/**
 * POST /api/v1/trading-research/wallets/:address/verify
 * Week 2: Calculate verification scores
 */
router.post('/wallets/:address/verify', async (req, res) => {
  try {
    const { address } = req.params;

    logger.info('Calculating verification scores', { address });

    await calculateVerificationScores(address);

    // Return updated wallet
    const wallet = await prisma.verifiedWallet.findUnique({
      where: { address: address.toLowerCase() }
    });

    res.json({
      success: true,
      data: wallet
    });
  } catch (error: any) {
    logger.error('Failed to calculate verification scores', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate verification scores'
    });
  }
});

/**
 * GET /api/v1/trading-research/nansen/health
 * Check Nansen MCP health
 */
router.get('/nansen/health', async (req, res) => {
  try {
    const isHealthy = await nansenMcpService.ping();

    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        service: 'Nansen MCP'
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      data: {
        healthy: false,
        service: 'Nansen MCP',
        error: error.message
      }
    });
  }
});

/**
 * POST /api/v1/trading-research/extract-strategies
 * Week 3: Extract strategy archetypes from verified wallets
 */
router.post('/extract-strategies', async (req, res) => {
  try {
    logger.info('Starting strategy archetype extraction (Week 3)');

    // Start extraction (runs async)
    extractStrategyArchetypes()
      .then(() => {
        logger.info('Strategy archetype extraction completed successfully');
      })
      .catch((error) => {
        logger.error('Strategy extraction failed', { error: error.message });
      });

    res.json({
      success: true,
      message: 'Strategy archetype extraction initiated'
    });
  } catch (error: any) {
    logger.error('Failed to initiate strategy extraction', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start strategy extraction'
    });
  }
});

/**
 * GET /api/v1/trading-research/strategies
 * List all extracted strategy archetypes
 *
 * Query params:
 * - status: identified, scoring, validated, selected
 */
router.get('/strategies', async (req, res) => {
  try {
    const { status } = req.query;

    const strategies = await getStrategyArchetypes(status as string);

    res.json({
      success: true,
      data: {
        strategies,
        count: strategies.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to list strategies', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve strategies'
    });
  }
});

/**
 * GET /api/v1/trading-research/strategies/:name
 * Get detailed strategy archetype data
 */
router.get('/strategies/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const strategy = await getStrategyByName(name);

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    res.json({
      success: true,
      data: strategy
    });
  } catch (error: any) {
    logger.error('Failed to get strategy details', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve strategy details'
    });
  }
});

/**
 * POST /api/v1/trading-research/score-strategies
 * Week 4: Score all identified strategy archetypes
 */
router.post('/score-strategies', async (req, res) => {
  try {
    logger.info('Starting strategy archetype scoring (Week 4)');

    // Start scoring (runs async)
    scoreAllStrategies()
      .then(() => {
        logger.info('Strategy archetype scoring completed successfully');
      })
      .catch((error) => {
        logger.error('Strategy scoring failed', { error: error.message });
      });

    res.json({
      success: true,
      message: 'Strategy archetype scoring initiated'
    });
  } catch (error: any) {
    logger.error('Failed to initiate strategy scoring', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to start strategy scoring'
    });
  }
});

/**
 * POST /api/v1/trading-research/strategies/:id/score
 * Score a specific strategy archetype
 */
router.post('/strategies/:id/score', async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Scoring strategy archetype', { strategyId: id });

    const scores = await scoreStrategy(id);

    res.json({
      success: true,
      data: scores
    });
  } catch (error: any) {
    logger.error('Failed to score strategy', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to score strategy'
    });
  }
});

/**
 * POST /api/v1/trading-research/select-strategies
 * Week 4: Select top 5 strategies for Phase 1
 *
 * Query params:
 * - minScore: minimum total score (default 60)
 */
router.post('/select-strategies', async (req, res) => {
  try {
    const { minScore = 60 } = req.body;

    logger.info('Selecting top strategies for Phase 1', { minScore });

    const selectedStrategies = await selectTopStrategies(minScore);

    res.json({
      success: true,
      data: {
        strategies: selectedStrategies,
        count: selectedStrategies.length
      }
    });
  } catch (error: any) {
    logger.error('Failed to select strategies', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to select strategies'
    });
  }
});

/**
 * GET /api/v1/trading-research/scoring-report
 * Get comprehensive scoring report for all strategies
 */
router.get('/scoring-report', async (req, res) => {
  try {
    const report = await getScoringReport();

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Failed to get scoring report', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scoring report'
    });
  }
});

export default router;
