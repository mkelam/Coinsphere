/**
 * Strategy Scoring Service - Week 4 of Phase 0
 *
 * Scores strategy archetypes on 3 dimensions:
 * - Performance (0-40 points): Sharpe ratio, win rate, risk/reward, consistency
 * - Practicality (0-30 points): Implementation feasibility, data availability, complexity
 * - Verifiability (0-30 points): Evidence quality, sample size, reproducibility
 *
 * Total Score: 0-100 points
 * Top 5 strategies (score ≥60) selected for Phase 1 implementation
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

interface StrategyScores {
  strategyId: string;
  strategyName: string;
  performanceScore: number;
  practicalityScore: number;
  verifiabilityScore: number;
  totalScore: number;
  priority: number; // 1-5 ranking (1 = highest priority)
  scoringNotes: string;
}

/**
 * Score all identified strategy archetypes
 */
export async function scoreAllStrategies(): Promise<StrategyScores[]> {
  logger.info('Starting Week 4 strategy scoring');

  try {
    const strategies = await prisma.tradingStrategy.findMany({
      where: { status: 'identified' }
    });

    logger.info(`Scoring ${strategies.length} strategy archetypes`);

    const scoredStrategies: StrategyScores[] = [];

    for (const strategy of strategies) {
      const scores = await scoreStrategy(strategy.id);
      scoredStrategies.push(scores);

      // Update database with scores
      await prisma.tradingStrategy.update({
        where: { id: strategy.id },
        data: {
          performanceScore: scores.performanceScore,
          practicalityScore: scores.practicalityScore,
          verifiabilityScore: scores.verifiabilityScore,
          totalScore: scores.totalScore,
          priority: scores.priority,
          status: scores.totalScore >= 60 ? 'validated' : 'scoring'
        }
      });

      logger.info(`✅ Scored strategy: ${strategy.name}`, {
        performanceScore: scores.performanceScore,
        practicalityScore: scores.practicalityScore,
        verifiabilityScore: scores.verifiabilityScore,
        totalScore: scores.totalScore,
        priority: scores.priority
      });
    }

    return scoredStrategies;
  } catch (error) {
    logger.error('Error scoring strategies', { error });
    throw error;
  }
}

/**
 * Score a single strategy archetype
 */
export async function scoreStrategy(strategyId: string): Promise<StrategyScores> {
  const strategy = await prisma.tradingStrategy.findUnique({
    where: { id: strategyId }
  });

  if (!strategy) {
    throw new Error(`Strategy not found: ${strategyId}`);
  }

  // 1. Performance Score (0-40 points)
  const performanceScore = calculatePerformanceScore(strategy);

  // 2. Practicality Score (0-30 points)
  const practicalityScore = calculatePracticalityScore(strategy);

  // 3. Verifiability Score (0-30 points)
  const verifiabilityScore = calculateVerifiabilityScore(strategy);

  // Total Score
  const totalScore = performanceScore + practicalityScore + verifiabilityScore;

  // Priority Assignment (1-5, where 1 is highest priority)
  let priority: number;
  if (totalScore >= 85) priority = 1; // Exceptional
  else if (totalScore >= 75) priority = 2; // High
  else if (totalScore >= 65) priority = 3; // Medium
  else if (totalScore >= 55) priority = 4; // Low
  else priority = 5; // Rejected

  const scoringNotes = generateScoringNotes(strategy, performanceScore, practicalityScore, verifiabilityScore);

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    performanceScore,
    practicalityScore,
    verifiabilityScore,
    totalScore,
    priority,
    scoringNotes
  };
}

/**
 * Calculate Performance Score (0-40 points)
 *
 * Breakdown:
 * - Win Rate (0-15 points): >70% = 15, 65-70% = 12, 60-65% = 9, <60% = 5
 * - Risk/Reward Ratio (0-10 points): >2.5 = 10, 2.0-2.5 = 8, 1.5-2.0 = 5, <1.5 = 2
 * - Sharpe Ratio Estimate (0-10 points): Based on wallet performance
 * - Consistency (0-5 points): Evidence from multiple wallets
 */
function calculatePerformanceScore(strategy: any): number {
  let score = 0;
  const notes: string[] = [];

  // 1. Win Rate (0-15 points)
  const winRate = parseFloat(strategy.winRate);
  if (winRate >= 0.75) {
    score += 15;
    notes.push('Win rate ≥75%: +15');
  } else if (winRate >= 0.70) {
    score += 13;
    notes.push('Win rate 70-75%: +13');
  } else if (winRate >= 0.65) {
    score += 10;
    notes.push('Win rate 65-70%: +10');
  } else if (winRate >= 0.60) {
    score += 7;
    notes.push('Win rate 60-65%: +7');
  } else {
    score += 4;
    notes.push('Win rate <60%: +4');
  }

  // 2. Risk/Reward Ratio (0-10 points)
  const rrRatio = parseFloat(strategy.riskRewardRatio);
  if (rrRatio >= 2.5) {
    score += 10;
    notes.push('R:R ≥2.5: +10');
  } else if (rrRatio >= 2.0) {
    score += 8;
    notes.push('R:R 2.0-2.5: +8');
  } else if (rrRatio >= 1.5) {
    score += 5;
    notes.push('R:R 1.5-2.0: +5');
  } else {
    score += 2;
    notes.push('R:R <1.5: +2');
  }

  // 3. Sharpe Ratio Estimate (0-10 points)
  // Estimate based on win rate and R:R
  const estimatedSharpe = (winRate - 0.5) * rrRatio * 4; // Rough approximation
  if (estimatedSharpe >= 2.5) {
    score += 10;
    notes.push('Estimated Sharpe ≥2.5: +10');
  } else if (estimatedSharpe >= 2.0) {
    score += 8;
    notes.push('Estimated Sharpe 2.0-2.5: +8');
  } else if (estimatedSharpe >= 1.5) {
    score += 6;
    notes.push('Estimated Sharpe 1.5-2.0: +6');
  } else {
    score += 3;
    notes.push('Estimated Sharpe <1.5: +3');
  }

  // 4. Consistency (0-5 points)
  const evidenceCount = strategy.evidenceCount || 0;
  if (evidenceCount >= 3) {
    score += 5;
    notes.push('Evidence from ≥3 wallets: +5');
  } else if (evidenceCount === 2) {
    score += 3;
    notes.push('Evidence from 2 wallets: +3');
  } else {
    score += 1;
    notes.push('Evidence from 1 wallet: +1');
  }

  logger.debug(`Performance score for ${strategy.name}: ${score}/40`, { breakdown: notes });
  return Math.min(score, 40); // Cap at 40
}

/**
 * Calculate Practicality Score (0-30 points)
 *
 * Breakdown:
 * - Data Availability (0-10 points): Technical indicators, on-chain data, social signals
 * - Implementation Complexity (0-10 points): Number of conditions, timeframe, automation feasibility
 * - Market Liquidity (0-5 points): Blue chip tokens vs. niche tokens
 * - Execution Risk (0-5 points): Slippage, gas fees, latency requirements
 */
function calculatePracticalityScore(strategy: any): number {
  let score = 0;
  const notes: string[] = [];

  // 1. Data Availability (0-10 points)
  const hasOnChainMetrics = strategy.onChainMetrics?.length > 0;
  const hasSocialSignals = strategy.socialSignals?.length > 0;
  const hasTechnicalIndicators = strategy.technicalIndicators?.length > 0;

  let dataScore = 0;
  if (hasTechnicalIndicators) {
    dataScore += 4;
    notes.push('Technical indicators available: +4');
  }
  if (hasOnChainMetrics) {
    dataScore += 3;
    notes.push('On-chain metrics available: +3');
  }
  if (hasSocialSignals) {
    dataScore += 3;
    notes.push('Social signals available: +3');
  }
  score += dataScore;

  // 2. Implementation Complexity (0-10 points)
  const entryConditionCount = strategy.entryConditions?.length || 0;
  const exitConditionCount = strategy.exitConditions?.length || 0;
  const totalConditions = entryConditionCount + exitConditionCount;

  if (totalConditions <= 8) {
    score += 10;
    notes.push('Simple conditions (≤8): +10');
  } else if (totalConditions <= 12) {
    score += 7;
    notes.push('Moderate conditions (9-12): +7');
  } else {
    score += 4;
    notes.push('Complex conditions (>12): +4');
  }

  // 3. Market Liquidity (0-5 points)
  const archetype = strategy.archetype || '';
  const description = strategy.description?.toLowerCase() || '';

  if (description.includes('blue chip') || description.includes('aave') || description.includes('uni')) {
    score += 5;
    notes.push('Blue chip tokens (high liquidity): +5');
  } else if (description.includes('stablecoin')) {
    score += 5;
    notes.push('Stablecoins (high liquidity): +5');
  } else if (description.includes('curve') || description.includes('convex')) {
    score += 4;
    notes.push('Established DeFi (good liquidity): +4');
  } else {
    score += 3;
    notes.push('Emerging tokens (moderate liquidity): +3');
  }

  // 4. Execution Risk (0-5 points)
  const timeframe = strategy.timeframe || '';

  if (timeframe === 'daily' || archetype === 'position_trading') {
    score += 5;
    notes.push('Low execution risk (daily/position): +5');
  } else if (timeframe === '4h' || archetype === 'swing_trading') {
    score += 4;
    notes.push('Moderate execution risk (4h/swing): +4');
  } else if (timeframe === '1h' || archetype === 'day_trading') {
    score += 2;
    notes.push('Higher execution risk (1h/day trading): +2');
  } else {
    score += 1;
    notes.push('Unknown execution risk: +1');
  }

  logger.debug(`Practicality score for ${strategy.name}: ${score}/30`, { breakdown: notes });
  return Math.min(score, 30); // Cap at 30
}

/**
 * Calculate Verifiability Score (0-30 points)
 *
 * Breakdown:
 * - Evidence Quality (0-10 points): Source wallet verification scores
 * - Sample Size (0-10 points): Number of wallets supporting the pattern
 * - Reproducibility (0-10 points): Clear rules, backtestable, documented
 */
function calculateVerifiabilityScore(strategy: any): number {
  let score = 0;
  const notes: string[] = [];

  // 1. Evidence Quality (0-10 points)
  // Assume all source wallets are verified (passed Week 2 verification)
  const sourceWalletIds = strategy.sourceWalletIds || [];
  if (sourceWalletIds.length > 0) {
    score += 10;
    notes.push('Source wallets are verified Smart Money: +10');
  } else {
    score += 5;
    notes.push('Limited wallet verification: +5');
  }

  // 2. Sample Size (0-10 points)
  const evidenceCount = strategy.evidenceCount || 0;
  if (evidenceCount >= 5) {
    score += 10;
    notes.push('Evidence from ≥5 wallets: +10');
  } else if (evidenceCount >= 3) {
    score += 8;
    notes.push('Evidence from 3-4 wallets: +8');
  } else if (evidenceCount === 2) {
    score += 5;
    notes.push('Evidence from 2 wallets: +5');
  } else {
    score += 3;
    notes.push('Evidence from 1 wallet: +3');
  }

  // 3. Reproducibility (0-10 points)
  const hasEntryConditions = (strategy.entryConditions?.length || 0) >= 4;
  const hasExitConditions = (strategy.exitConditions?.length || 0) >= 4;
  const hasTechnicalIndicators = (strategy.technicalIndicators?.length || 0) >= 3;
  const hasResearchNotes = (strategy.researchNotes?.length || 0) > 50;

  let reproducibilityScore = 0;
  if (hasEntryConditions) {
    reproducibilityScore += 3;
    notes.push('Clear entry conditions: +3');
  }
  if (hasExitConditions) {
    reproducibilityScore += 3;
    notes.push('Clear exit conditions: +3');
  }
  if (hasTechnicalIndicators) {
    reproducibilityScore += 2;
    notes.push('Technical indicators defined: +2');
  }
  if (hasResearchNotes) {
    reproducibilityScore += 2;
    notes.push('Documented research notes: +2');
  }
  score += reproducibilityScore;

  logger.debug(`Verifiability score for ${strategy.name}: ${score}/30`, { breakdown: notes });
  return Math.min(score, 30); // Cap at 30
}

/**
 * Generate detailed scoring notes
 */
function generateScoringNotes(
  strategy: any,
  performanceScore: number,
  practicalityScore: number,
  verifiabilityScore: number
): string {
  const totalScore = performanceScore + practicalityScore + verifiabilityScore;

  const priority = totalScore >= 85 ? 1 : totalScore >= 75 ? 2 : totalScore >= 65 ? 3 : totalScore >= 55 ? 4 : 5;

  const notes = [
    `## Scoring Breakdown for ${strategy.name}`,
    '',
    `**Performance Score:** ${performanceScore}/40`,
    `- Win Rate: ${(parseFloat(strategy.winRate) * 100).toFixed(1)}%`,
    `- Risk/Reward: ${strategy.riskRewardRatio}:1`,
    `- Evidence: ${strategy.evidenceCount} wallet(s)`,
    '',
    `**Practicality Score:** ${practicalityScore}/30`,
    `- Timeframe: ${strategy.timeframe}`,
    `- Archetype: ${strategy.archetype}`,
    `- Conditions: ${(strategy.entryConditions?.length || 0) + (strategy.exitConditions?.length || 0)} total`,
    '',
    `**Verifiability Score:** ${verifiabilityScore}/30`,
    `- Source Wallets: ${strategy.sourceWalletIds?.length || 0}`,
    `- Evidence Count: ${strategy.evidenceCount}`,
    `- Documentation: ${strategy.researchNotes ? 'Complete' : 'Partial'}`,
    '',
    `**Total Score:** ${totalScore}/100`,
    `**Priority:** ${priority}/5 (1 = highest)`,
    '',
    priority === 1 ? '✅ **PRIORITY 1 (EXCEPTIONAL)** - Immediate Phase 1 implementation' :
    priority === 2 ? '✅ **PRIORITY 2 (HIGH)** - Ready for Phase 1 implementation' :
    priority === 3 ? '⚠️ **PRIORITY 3 (MEDIUM)** - Consider for Phase 1 with refinements' :
    priority === 4 ? '⚠️ **PRIORITY 4 (LOW)** - Needs further validation' :
    '❌ **PRIORITY 5 (REJECTED)** - Insufficient score for Phase 1'
  ];

  return notes.join('\n');
}

/**
 * Select top 5 strategies for Phase 1
 */
export async function selectTopStrategies(minScore: number = 60): Promise<any[]> {
  try {
    const topStrategies = await prisma.tradingStrategy.findMany({
      where: {
        totalScore: { gte: minScore }
      },
      orderBy: [
        { totalScore: 'desc' },
        { performanceScore: 'desc' }
      ],
      take: 5
    });

    logger.info(`Selected ${topStrategies.length} strategies for Phase 1`, {
      strategies: topStrategies.map(s => ({
        name: s.name,
        score: s.totalScore,
        priority: s.priority
      }))
    });

    // Update status to 'selected'
    for (const strategy of topStrategies) {
      await prisma.tradingStrategy.update({
        where: { id: strategy.id },
        data: { status: 'selected' }
      });
    }

    return topStrategies;
  } catch (error) {
    logger.error('Error selecting top strategies', { error });
    throw error;
  }
}

/**
 * Get scoring report for all strategies
 */
export async function getScoringReport(): Promise<any> {
  try {
    const allStrategies = await prisma.tradingStrategy.findMany({
      orderBy: [
        { totalScore: 'desc' },
        { performanceScore: 'desc' }
      ]
    });

    const report = {
      totalStrategies: allStrategies.length,
      scoredStrategies: allStrategies.filter(s => s.totalScore !== null).length,
      selectedStrategies: allStrategies.filter(s => s.status === 'selected').length,
      strategies: allStrategies.map(s => ({
        name: s.name,
        archetype: s.archetype,
        winRate: s.winRate,
        riskRewardRatio: s.riskRewardRatio,
        performanceScore: s.performanceScore,
        practicalityScore: s.practicalityScore,
        verifiabilityScore: s.verifiabilityScore,
        totalScore: s.totalScore,
        priority: s.priority,
        status: s.status
      })),
      scoreDistribution: {
        high: allStrategies.filter(s => s.totalScore >= 80).length,
        medium: allStrategies.filter(s => s.totalScore >= 70 && s.totalScore < 80).length,
        low: allStrategies.filter(s => s.totalScore >= 60 && s.totalScore < 70).length,
        rejected: allStrategies.filter(s => s.totalScore < 60).length
      }
    };

    return report;
  } catch (error) {
    logger.error('Error generating scoring report', { error });
    throw error;
  }
}
