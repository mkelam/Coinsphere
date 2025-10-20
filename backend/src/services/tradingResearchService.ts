/**
 * Trading Research Service - Phase 0 Implementation
 *
 * Coordinates Week 1-4 research activities:
 * - Week 1: Data Collection (Nansen + LunarCrush + Public Traders)
 * - Week 2: Verification & Disqualification
 * - Week 3: Pattern Extraction
 * - Week 4: Strategy Scoring & Selection
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { nansenMcpService } from './nansenMcpService.js';
import { lunarcrushMcpService } from './lunarcrushMcpService.js';

/**
 * Week 1 Day 1-2: Nansen Smart Money Discovery
 */
export async function discoverSmartMoneyWallets(
  minPortfolioValue: number = 100000,
  minActiveMonths: number = 12
): Promise<void> {
  logger.info('Starting Phase 0 Week 1 Day 1-2: Smart Money Wallet Discovery');

  try {
    // Query Nansen for Smart Money wallets
    const result = await nansenMcpService.discoverSmartMoneyWallets({
      minPortfolioValue,
      minActiveMonths,
      minProfitability: true
    });

    logger.info('Nansen discovery complete', {
      walletsFound: result.totalFound,
      criteria: result.filterCriteria
    });

    // Save each wallet to database
    for (const wallet of result.wallets) {
      await prisma.verifiedWallet.upsert({
        where: { address: wallet.address },
        update: {
          // Update existing wallet data
          nansenLabel: wallet.label,
          blockchain: wallet.blockchain,
          totalTradesAnalyzed: wallet.totalTradesAnalyzed,
          avgHoldTimeDays: wallet.avgHoldTime,
          totalProfitUsd: wallet.profitLoss,
          primaryTokens: wallet.topTokens,
          discoverySource: 'nansen',
          researchPhase: 'week_1',
          updatedAt: new Date()
        },
        create: {
          address: wallet.address,
          nansenLabel: wallet.label,
          blockchain: wallet.blockchain,
          discoverySource: 'nansen',
          verificationDate: new Date(),
          researchPhase: 'week_1',
          totalTradesAnalyzed: wallet.totalTradesAnalyzed,
          avgHoldTimeDays: wallet.avgHoldTime,
          totalProfitUsd: wallet.profitLoss,
          primaryTokens: wallet.topTokens,
          monitorActive: true,
          verificationStatus: 'pending'
        }
      });
    }

    logger.info('Smart Money wallets saved to database', {
      count: result.totalFound
    });

  } catch (error: any) {
    logger.error('Smart Money discovery failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Week 1 Day 1-2: Fetch detailed wallet data
 */
export async function enrichWalletData(walletAddress: string): Promise<void> {
  logger.info('Enriching wallet data', { address: walletAddress });

  try {
    // Get wallet from database
    const wallet = await prisma.verifiedWallet.findUnique({
      where: { address: walletAddress }
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletAddress} not found in database`);
    }

    // Fetch detailed profile from Nansen
    const profile = await nansenMcpService.getWalletProfile(walletAddress);

    if (profile) {
      // Update wallet with detailed metrics
      await prisma.verifiedWallet.update({
        where: { address: walletAddress },
        data: {
          totalTradesAnalyzed: profile.totalTradesAnalyzed,
          avgHoldTimeDays: profile.avgHoldTime,
          totalProfitUsd: profile.profitLoss,
          primaryTokens: profile.topTokens,
          avgPositionSizeUsd: profile.portfolioValue / Math.max(profile.totalTradesAnalyzed, 1),
          updatedAt: new Date()
        }
      });

      logger.info('Wallet data enriched', { address: walletAddress });
    }

    // Fetch transaction history
    const trades = await nansenMcpService.getWalletTrades(walletAddress, 50);

    if (trades.length > 0) {
      // Save trades to database
      for (const trade of trades) {
        await prisma.walletTrade.upsert({
          where: { txHash: trade.txHash },
          update: {
            // Update if exists
            priceUsd: trade.priceUsd,
            valueUsd: trade.valueUsd
          },
          create: {
            walletId: wallet.id,
            txHash: trade.txHash,
            blockchain: trade.blockchain,
            timestamp: new Date(trade.timestamp),
            action: trade.action,
            tokenSymbol: trade.tokenSymbol,
            tokenAddress: trade.tokenAddress,
            amount: trade.amount,
            priceUsd: trade.priceUsd,
            valueUsd: trade.valueUsd,
            gasFeesUsd: trade.gasFeesUsd
          }
        });
      }

      logger.info('Wallet trades saved', {
        address: walletAddress,
        tradesCount: trades.length
      });
    }

  } catch (error: any) {
    logger.error('Wallet enrichment failed', {
      error: error.message,
      address: walletAddress
    });
    throw error;
  }
}

/**
 * Week 1 Day 1-2: Calculate Social Leading Score
 *
 * For wallet's last 20 trades:
 * - Count trades BEFORE social spike (3-7 days): X
 * - Count trades DURING social spike: Y
 * - Count trades AFTER social peak: Z
 * - Calculate: Leading Score = X / (X + Y + Z)
 *
 * Leading Score >0.5 = Leading Indicator (PRIORITY)
 * Leading Score 0.3-0.5 = Mixed (SECONDARY)
 * Leading Score <0.3 = Follower (TERTIARY)
 */
export async function calculateSocialLeadingScore(walletAddress: string): Promise<number> {
  logger.info('Calculating social leading score', { address: walletAddress });

  try {
    // Get wallet from database
    const wallet = await prisma.verifiedWallet.findUnique({
      where: { address: walletAddress },
      include: {
        trades: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });

    if (!wallet || wallet.trades.length === 0) {
      logger.warn('No trades found for wallet', { address: walletAddress });
      return 0;
    }

    let beforeSpikeCount = 0;
    let duringSpikeCount = 0;
    let afterPeakCount = 0;

    // Analyze each trade's social timing
    for (const trade of wallet.trades) {
      // Get social volume data around trade timestamp
      // (This requires LunarCrush historical data)

      // Placeholder logic - implement with real LunarCrush data
      const socialTiming = await determineSocialTiming(
        trade.tokenSymbol,
        trade.timestamp
      );

      if (socialTiming === 'before_spike') {
        beforeSpikeCount++;
      } else if (socialTiming === 'during_spike') {
        duringSpikeCount++;
      } else if (socialTiming === 'after_peak') {
        afterPeakCount++;
      }

      // Update trade with social context
      await prisma.walletTrade.update({
        where: { id: trade.id },
        data: { socialTiming }
      });
    }

    const total = beforeSpikeCount + duringSpikeCount + afterPeakCount;
    const leadingScore = total > 0 ? beforeSpikeCount / total : 0;

    // Determine behavior type
    let behaviorType = 'uncorrelated';
    if (leadingScore > 0.5) {
      behaviorType = 'leading_indicator';
    } else if (leadingScore >= 0.3) {
      behaviorType = 'mixed';
    } else if (total > 0) {
      behaviorType = 'follower';
    }

    // Update wallet with social metrics
    await prisma.verifiedWallet.update({
      where: { address: walletAddress },
      data: {
        socialLeadingScore: leadingScore,
        behaviorType,
        updatedAt: new Date()
      }
    });

    logger.info('Social leading score calculated', {
      address: walletAddress,
      score: leadingScore,
      behaviorType,
      beforeSpike: beforeSpikeCount,
      duringSpike: duringSpikeCount,
      afterPeak: afterPeakCount
    });

    return leadingScore;

  } catch (error: any) {
    logger.error('Social leading score calculation failed', {
      error: error.message,
      address: walletAddress
    });
    return 0;
  }
}

/**
 * Determine if a trade occurred before/during/after social spike
 */
async function determineSocialTiming(
  tokenSymbol: string,
  tradeTimestamp: Date
): Promise<'before_spike' | 'during_spike' | 'after_peak' | 'uncorrelated'> {
  // TODO: Implement with LunarCrush historical data
  // This is a placeholder implementation

  try {
    // Get social volume data 7 days before and after trade
    const startDate = new Date(tradeTimestamp);
    startDate.setDate(startDate.getDate() - 7);

    const endDate = new Date(tradeTimestamp);
    endDate.setDate(endDate.getDate() + 7);

    // Query LunarCrush for historical social volume
    // (Requires LunarCrush Pro API or stored historical data)

    // For now, return uncorrelated
    return 'uncorrelated';

  } catch (error) {
    logger.debug('Social timing determination failed', { tokenSymbol, tradeTimestamp });
    return 'uncorrelated';
  }
}

/**
 * Week 2: Calculate Verification Scores
 *
 * Authenticity Score (0-10):
 * - On-chain verified: +5
 * - 12+ months history: +3
 * - Consistent activity: +2
 *
 * Transparency Score (0-10):
 * - Public wallet address: +4
 * - Detailed trade history: +4
 * - Strategy signals clear: +2
 *
 * Skin in Game Score (0-10):
 * - Portfolio >$100K: +4
 * - Active trading (30+ trades): +3
 * - Profitable (>0% returns): +3
 */
export async function calculateVerificationScores(walletAddress: string): Promise<void> {
  logger.info('Calculating verification scores', { address: walletAddress });

  try {
    const wallet = await prisma.verifiedWallet.findUnique({
      where: { address: walletAddress },
      include: {
        trades: true
      }
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletAddress} not found`);
    }

    // Authenticity Score (0-10)
    let authenticityScore = 0;
    if (wallet.discoverySource === 'nansen') authenticityScore += 5; // On-chain verified
    if (wallet.avgHoldTimeDays && wallet.avgHoldTimeDays > 0) authenticityScore += 3; // Has history
    if (wallet.trades.length >= 10) authenticityScore += 2; // Consistent activity

    // Transparency Score (0-10)
    let transparencyScore = 0;
    transparencyScore += 4; // Public wallet address
    if (wallet.trades.length > 0) transparencyScore += 4; // Trade history
    if (wallet.strategyType) transparencyScore += 2; // Strategy identified

    // Skin in Game Score (0-10)
    let skinInGameScore = 0;
    if (wallet.avgPositionSizeUsd && wallet.avgPositionSizeUsd * wallet.totalTradesAnalyzed! >= 100000) {
      skinInGameScore += 4; // Portfolio >$100K
    }
    if (wallet.totalTradesAnalyzed && wallet.totalTradesAnalyzed >= 30) skinInGameScore += 3; // Active
    if (wallet.totalProfitUsd && wallet.totalProfitUsd > 0) skinInGameScore += 3; // Profitable

    const totalScore = authenticityScore + transparencyScore + skinInGameScore;

    // Determine verification status
    const verificationStatus = totalScore >= 15 ? 'verified' : 'disqualified';

    // Update wallet
    await prisma.verifiedWallet.update({
      where: { address: walletAddress },
      data: {
        authenticityScore,
        transparencyScore,
        skinInGameScore,
        totalVerificationScore: totalScore,
        verificationStatus,
        researchPhase: 'week_2',
        updatedAt: new Date()
      }
    });

    logger.info('Verification scores calculated', {
      address: walletAddress,
      authenticityScore,
      transparencyScore,
      skinInGameScore,
      totalScore,
      status: verificationStatus
    });

  } catch (error: any) {
    logger.error('Verification score calculation failed', {
      error: error.message,
      address: walletAddress
    });
    throw error;
  }
}

/**
 * Week 1-2 Summary: Get research progress
 */
export async function getResearchProgress(): Promise<any> {
  const [
    totalWallets,
    week1Wallets,
    week2Wallets,
    verifiedWallets,
    disqualifiedWallets,
    leadingIndicators,
    totalTrades
  ] = await Promise.all([
    prisma.verifiedWallet.count(),
    prisma.verifiedWallet.count({ where: { researchPhase: 'week_1' } }),
    prisma.verifiedWallet.count({ where: { researchPhase: 'week_2' } }),
    prisma.verifiedWallet.count({ where: { verificationStatus: 'verified' } }),
    prisma.verifiedWallet.count({ where: { verificationStatus: 'disqualified' } }),
    prisma.verifiedWallet.count({ where: { behaviorType: 'leading_indicator' } }),
    prisma.walletTrade.count()
  ]);

  return {
    totalWallets,
    byPhase: {
      week_1: week1Wallets,
      week_2: week2Wallets
    },
    byStatus: {
      verified: verifiedWallets,
      disqualified: disqualifiedWallets,
      pending: totalWallets - verifiedWallets - disqualifiedWallets
    },
    leadingIndicators,
    totalTrades,
    timestamp: new Date().toISOString()
  };
}
