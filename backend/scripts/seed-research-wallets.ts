/**
 * Seed Research Wallets - Test Data for Phase 0
 *
 * Populates the database with realistic sample wallet data
 * to demonstrate the Week 1-4 research workflow.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample Smart Money wallets (based on real Nansen Smart Money addresses)
const SAMPLE_WALLETS = [
  {
    address: '0x8EB8a3b98659Cce290402893d0123abb75E3ab28',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 247,
    winRate: 0.64,
    avgHoldTimeDays: 6.2,
    avgPositionSizeUsd: 125000,
    totalProfitUsd: 2400000,
    sharpeRatio: 2.8,
    primaryTokens: ['ETH', 'UNI', 'AAVE', 'LINK'],
    tradingFrequency: 'swing_trading'
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 189,
    winRate: 0.72,
    avgHoldTimeDays: 3.5,
    avgPositionSizeUsd: 85000,
    totalProfitUsd: 1800000,
    sharpeRatio: 3.2,
    primaryTokens: ['ETH', 'CRV', 'CVX', 'FXS'],
    tradingFrequency: 'swing_trading'
  },
  {
    address: '0x7F5E1E8fC2B8A7C4999f3B6c8D9aD5f5c1E9B2a3',
    nansenLabel: 'Smart NFT Trader',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 156,
    winRate: 0.58,
    avgHoldTimeDays: 12.4,
    avgPositionSizeUsd: 95000,
    totalProfitUsd: 980000,
    sharpeRatio: 1.9,
    primaryTokens: ['ETH', 'BLUR', 'APE', 'LOOKS'],
    tradingFrequency: 'position_trading'
  },
  {
    address: '0x9aB3C4D5e6F7890aBcDe12345678901234567890',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'arbitrum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 312,
    winRate: 0.69,
    avgHoldTimeDays: 4.8,
    avgPositionSizeUsd: 65000,
    totalProfitUsd: 1200000,
    sharpeRatio: 2.5,
    primaryTokens: ['ETH', 'ARB', 'GMX', 'GNS'],
    tradingFrequency: 'swing_trading'
  },
  {
    address: '0xDef123456789aBcDef123456789aBcDef123456',
    nansenLabel: 'Smart LP',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 98,
    winRate: 0.75,
    avgHoldTimeDays: 15.2,
    avgPositionSizeUsd: 150000,
    totalProfitUsd: 850000,
    sharpeRatio: 2.1,
    primaryTokens: ['ETH', 'USDC', 'DAI', 'FRAX'],
    tradingFrequency: 'position_trading'
  },
  {
    address: '0x1234567890aBcDef1234567890aBcDef12345678',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'solana',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 428,
    winRate: 0.62,
    avgHoldTimeDays: 2.3,
    avgPositionSizeUsd: 45000,
    totalProfitUsd: 720000,
    sharpeRatio: 2.3,
    primaryTokens: ['SOL', 'JUP', 'JTO', 'RNDR'],
    tradingFrequency: 'day_trading'
  },
  {
    address: '0xFedCba9876543210FedCba9876543210FedCba98',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 203,
    winRate: 0.68,
    avgHoldTimeDays: 5.9,
    avgPositionSizeUsd: 110000,
    totalProfitUsd: 1500000,
    sharpeRatio: 2.7,
    primaryTokens: ['ETH', 'MKR', 'COMP', 'LIDO'],
    tradingFrequency: 'swing_trading'
  },
  {
    address: '0xaBcDef1234567890aBcDef1234567890aBcDef12',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'bsc',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 267,
    winRate: 0.66,
    avgHoldTimeDays: 3.8,
    avgPositionSizeUsd: 52000,
    totalProfitUsd: 610000,
    sharpeRatio: 2.2,
    primaryTokens: ['BNB', 'CAKE', 'ALPACA', 'BELT'],
    tradingFrequency: 'swing_trading'
  },
  {
    address: '0x98765432109876543210987654321098765432210',
    nansenLabel: 'Smart NFT Trader',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 134,
    winRate: 0.55,
    avgHoldTimeDays: 18.6,
    avgPositionSizeUsd: 120000,
    totalProfitUsd: 750000,
    sharpeRatio: 1.6,
    primaryTokens: ['ETH', 'NFTX', 'SUDO', 'LOOKS'],
    tradingFrequency: 'position_trading'
  },
  {
    address: '0x456789aBcDef0123456789aBcDef0123456789ab',
    nansenLabel: 'Smart Money - DeFi',
    blockchain: 'ethereum',
    discoverySource: 'nansen',
    totalTradesAnalyzed: 361,
    winRate: 0.71,
    avgHoldTimeDays: 4.2,
    avgPositionSizeUsd: 78000,
    totalProfitUsd: 1350000,
    sharpeRatio: 2.9,
    primaryTokens: ['ETH', 'SNX', 'PERP', 'LYRA'],
    tradingFrequency: 'swing_trading'
  }
];

/**
 * Seed the database with sample wallets
 */
async function seedWallets() {
  console.log('🌱 Seeding Phase 0 research wallets...');

  let created = 0;
  let updated = 0;

  for (const walletData of SAMPLE_WALLETS) {
    const wallet = await prisma.verifiedWallet.upsert({
      where: { address: walletData.address },
      update: {
        ...walletData,
        verificationDate: new Date(),
        researchPhase: 'week_1',
        verificationStatus: 'pending',
        monitorActive: true,
        updatedAt: new Date()
      },
      create: {
        ...walletData,
        verificationDate: new Date(),
        researchPhase: 'week_1',
        verificationStatus: 'pending',
        monitorActive: true
      }
    });

    if (wallet.createdAt.getTime() === wallet.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }

    console.log(`  ✓ ${wallet.address.substring(0, 10)}... (${wallet.nansenLabel})`);
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created} wallets`);
  console.log(`   Updated: ${updated} wallets`);
  console.log(`   Total:   ${SAMPLE_WALLETS.length} wallets`);
}

/**
 * Calculate social leading scores for seeded wallets
 */
async function calculateSocialScores() {
  console.log('\n🧮 Calculating social leading scores...');

  const wallets = await prisma.verifiedWallet.findMany({
    where: { researchPhase: 'week_1' }
  });

  for (const wallet of wallets) {
    // Generate random but realistic social leading scores
    // Leading indicators: 0.5-0.9
    // Mixed: 0.3-0.5
    // Followers: 0.1-0.3
    const randomScore = Math.random();
    let socialLeadingScore: number;
    let behaviorType: string;

    if (wallet.winRate && wallet.winRate > 0.68) {
      // High win rate wallets are more likely to be leading indicators
      socialLeadingScore = 0.5 + (Math.random() * 0.35); // 0.5-0.85
      behaviorType = 'leading_indicator';
    } else if (wallet.winRate && wallet.winRate > 0.60) {
      // Medium win rate wallets are mixed
      socialLeadingScore = 0.35 + (Math.random() * 0.25); // 0.35-0.6
      behaviorType = randomScore > 0.3 ? 'mixed' : 'leading_indicator';
    } else {
      // Lower win rate wallets might be followers or mixed
      socialLeadingScore = 0.2 + (Math.random() * 0.35); // 0.2-0.55
      behaviorType = randomScore > 0.6 ? 'mixed' : 'follower';
    }

    await prisma.verifiedWallet.update({
      where: { id: wallet.id },
      data: {
        socialLeadingScore,
        behaviorType,
        avgSocialVolumeAtEntry: 1500 + Math.random() * 3000,
        avgSocialVolumeAtPeak: 7000 + Math.random() * 5000,
        sentimentCorrelation: 0.4 + Math.random() * 0.4
      }
    });

    console.log(`  ✓ ${wallet.address.substring(0, 10)}... - ${behaviorType} (${(socialLeadingScore * 100).toFixed(1)}%)`);
  }

  console.log('✅ Social scores calculated!');
}

/**
 * Calculate verification scores for seeded wallets
 */
async function calculateVerificationScores() {
  console.log('\n🔍 Calculating verification scores...');

  const wallets = await prisma.verifiedWallet.findMany({
    where: { researchPhase: 'week_1' }
  });

  for (const wallet of wallets) {
    // Authenticity Score (0-10)
    let authenticityScore = 0;
    if (wallet.discoverySource === 'nansen') authenticityScore += 5;
    if (wallet.avgHoldTimeDays && wallet.avgHoldTimeDays > 0) authenticityScore += 3;
    if (wallet.totalTradesAnalyzed && wallet.totalTradesAnalyzed >= 10) authenticityScore += 2;

    // Transparency Score (0-10)
    let transparencyScore = 4; // Public wallet
    if (wallet.totalTradesAnalyzed && wallet.totalTradesAnalyzed > 0) transparencyScore += 4;
    if (wallet.tradingFrequency) transparencyScore += 2;

    // Skin in Game Score (0-10)
    let skinInGameScore = 0;
    if (wallet.avgPositionSizeUsd && wallet.avgPositionSizeUsd * (wallet.totalTradesAnalyzed || 1) >= 100000) {
      skinInGameScore += 4;
    }
    if (wallet.totalTradesAnalyzed && wallet.totalTradesAnalyzed >= 30) skinInGameScore += 3;
    if (wallet.totalProfitUsd && wallet.totalProfitUsd > 0) skinInGameScore += 3;

    const totalScore = authenticityScore + transparencyScore + skinInGameScore;
    const verificationStatus = totalScore >= 15 ? 'verified' : 'disqualified';

    await prisma.verifiedWallet.update({
      where: { id: wallet.id },
      data: {
        authenticityScore,
        transparencyScore,
        skinInGameScore,
        totalVerificationScore: totalScore,
        verificationStatus,
        researchPhase: 'week_2'
      }
    });

    console.log(`  ✓ ${wallet.address.substring(0, 10)}... - ${verificationStatus} (${totalScore}/30)`);
  }

  console.log('✅ Verification scores calculated!');
}

/**
 * Main seeding function
 */
async function main() {
  try {
    await seedWallets();
    await calculateSocialScores();
    await calculateVerificationScores();

    // Print summary
    console.log('\n📊 Research Progress Summary:');
    const progress = await getProgress();
    console.log(JSON.stringify(progress, null, 2));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get research progress
 */
async function getProgress() {
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
    totalTrades
  };
}

// Run the seeder
main();
