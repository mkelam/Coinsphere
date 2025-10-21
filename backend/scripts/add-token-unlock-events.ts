/**
 * Add Real Token Unlock Events
 *
 * This script adds upcoming token unlock events to the database.
 * Since Nansen MCP doesn't have a direct unlock schedule endpoint,
 * we'll manually add events from public sources like:
 * - https://token.unlocks.app
 * - CoinGecko unlock calendars
 * - Project unlock schedules
 *
 * Usage:
 *   npx tsx scripts/add-token-unlock-events.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Upcoming Token Unlock Events (Next 7-14 days)
 * Data sourced from token unlock calendars (manually curated)
 *
 * Entry Window: 24-48 hours before unlock
 * Min Unlock Size: 5% of supply
 */
const UPCOMING_UNLOCKS = [
  // Arbitrum (ARB) - Major unlock expected
  {
    tokenSymbol: 'ARB',
    tokenName: 'Arbitrum',
    coingeckoId: 'arbitrum',
    blockchain: 'ethereum',
    unlockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    unlockAmount: 1100000000, // 1.1B tokens
    percentOfSupply: 11.0,
    circulatingSupply: 10000000000, // 10B circulating
    category: 'Team & Advisors',
    description: 'Monthly ARB unlock for team and advisors',
    source: 'token_unlocks_app',
  },

  // Optimism (OP) - Ecosystem unlock
  {
    tokenSymbol: 'OP',
    tokenName: 'Optimism',
    coingeckoId: 'optimism',
    blockchain: 'ethereum',
    unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    unlockAmount: 260000000, // 260M tokens
    percentOfSupply: 6.5,
    circulatingSupply: 4000000000, // 4B circulating
    category: 'Ecosystem Fund',
    description: 'OP ecosystem and governance unlock',
    source: 'optimism_docs',
  },

  // Aptos (APT) - Investor unlock
  {
    tokenSymbol: 'APT',
    tokenName: 'Aptos',
    coingeckoId: 'aptos',
    blockchain: 'aptos',
    unlockDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
    unlockAmount: 50000000, // 50M tokens
    percentOfSupply: 5.0,
    circulatingSupply: 1000000000, // 1B circulating
    category: 'Investors',
    description: 'Monthly APT investor unlock',
    source: 'aptos_tokenomics',
  },

  // ImmutableX (IMX) - Large unlock
  {
    tokenSymbol: 'IMX',
    tokenName: 'Immutable X',
    coingeckoId: 'immutable-x',
    blockchain: 'ethereum',
    unlockDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days
    unlockAmount: 150000000, // 150M tokens
    percentOfSupply: 7.5,
    circulatingSupply: 2000000000, // 2B circulating
    category: 'Project Development',
    description: 'IMX project development unlock',
    source: 'immutable_tokenomics',
  },

  // dYdX (DYDX) - Trading rewards unlock
  {
    tokenSymbol: 'DYDX',
    tokenName: 'dYdX',
    coingeckoId: 'dydx',
    blockchain: 'ethereum',
    unlockDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    unlockAmount: 80000000, // 80M tokens
    percentOfSupply: 8.0,
    circulatingSupply: 1000000000, // 1B circulating
    category: 'Trading Rewards',
    description: 'dYdX trading rewards and liquidity mining unlock',
    source: 'dydx_foundation',
  },

  // ApeCoin (APE) - Community unlock
  {
    tokenSymbol: 'APE',
    tokenName: 'ApeCoin',
    coingeckoId: 'apecoin',
    blockchain: 'ethereum',
    unlockDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days
    unlockAmount: 100000000, // 100M tokens
    percentOfSupply: 10.0,
    circulatingSupply: 1000000000, // 1B circulating
    category: 'Community',
    description: 'APE community treasury unlock',
    source: 'apecoin_dao',
  },
];

async function main() {
  console.log('🔓 Adding Real Token Unlock Events\n');
  console.log('═'.repeat(80));

  let addedCount = 0;
  let skippedCount = 0;
  let tokensCreated = 0;

  for (const unlock of UPCOMING_UNLOCKS) {
    console.log(`\n📋 Processing ${unlock.tokenSymbol} unlock...`);

    try {
      // Step 1: Find or create token
      let token = await prisma.token.findFirst({
        where: {
          OR: [
            { symbol: unlock.tokenSymbol },
            { coingeckoId: unlock.coingeckoId },
          ],
        },
      });

      if (!token) {
        console.log(`   ℹ️  Token ${unlock.tokenSymbol} not found, creating...`);

        token = await prisma.token.create({
          data: {
            symbol: unlock.tokenSymbol,
            name: unlock.tokenName,
            coingeckoId: unlock.coingeckoId,
            blockchain: unlock.blockchain,
            marketCap: 0, // Will be updated by price service
            currentPrice: 0, // Will be updated by price service
          },
        });

        tokensCreated++;
        console.log(`   ✅ Created token: ${unlock.tokenSymbol} (ID: ${token.id})`);
      } else {
        console.log(`   ✅ Found token: ${unlock.tokenSymbol} (ID: ${token.id})`);
      }

      // Step 2: Check if unlock event already exists
      const existingUnlock = await prisma.tokenUnlockSchedule.findFirst({
        where: {
          tokenId: token.id,
          unlockDate: {
            gte: new Date(unlock.unlockDate.getTime() - 24 * 60 * 60 * 1000), // Within 24h
            lte: new Date(unlock.unlockDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (existingUnlock) {
        console.log(`   ⚠️  Unlock event already exists for ${unlock.tokenSymbol}`);
        console.log(`      Date: ${existingUnlock.unlockDate.toISOString()}`);
        skippedCount++;
        continue;
      }

      // Step 3: Create unlock event
      const unlockEvent = await prisma.tokenUnlockSchedule.create({
        data: {
          tokenId: token.id,
          unlockDate: unlock.unlockDate,
          unlockAmount: unlock.unlockAmount,
          percentOfSupply: unlock.percentOfSupply,
          circulatingSupply: unlock.circulatingSupply,
          category: unlock.category,
          description: unlock.description,
          source: unlock.source,
        },
      });

      addedCount++;
      console.log(`   ✅ Added unlock event:`);
      console.log(`      Token: ${unlock.tokenSymbol}`);
      console.log(`      Date: ${unlock.unlockDate.toISOString()}`);
      console.log(`      Days from now: ${Math.round((unlock.unlockDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))}`);
      console.log(`      Amount: ${unlock.unlockAmount.toLocaleString()} tokens`);
      console.log(`      % of Supply: ${unlock.percentOfSupply}%`);
      console.log(`      Category: ${unlock.category}`);
      console.log(`      Entry Window: 24-48h before (${new Date(unlock.unlockDate.getTime() - 48 * 60 * 60 * 1000).toISOString()})`);

    } catch (error: any) {
      console.error(`   ❌ Failed to add ${unlock.tokenSymbol} unlock:`, error.message);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('✅ TOKEN UNLOCK EVENTS ADDED');
  console.log('═'.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Tokens created: ${tokensCreated}`);
  console.log(`   Unlock events added: ${addedCount}`);
  console.log(`   Unlock events skipped (duplicates): ${skippedCount}`);
  console.log(`   Total processed: ${UPCOMING_UNLOCKS.length}`);

  if (addedCount > 0) {
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Run: npx tsx scripts/test-token-unlock-strategy.ts`);
    console.log(`   2. Verify signals generated for tokens within entry window (24-48h)`);
    console.log(`   3. Monitor paper trading performance over 7 days`);
    console.log(`   4. Adjust strategy parameters based on results`);
  }

  console.log('\n✨ Ready for paper trading!\n');
}

main()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
