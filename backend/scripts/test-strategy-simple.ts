/**
 * Simple Strategy Test - Tests activation without unlock events
 * This validates the trading infrastructure is working
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { exchangeManager } from '../src/services/exchange/ExchangeManager';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Trading Infrastructure\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Check exchange connection
    console.log('\n📋 Step 1: Testing exchange connection...');

    const exchanges = exchangeManager.getExchanges();
    console.log(`✅ Connected exchanges: ${exchanges.length}`);

    if (exchanges.length === 0) {
      console.log('⚠️  No exchanges connected. Adding Binance...');
      await exchangeManager.addExchange({
        name: 'binance',
        credentials: {
          apiKey: process.env.BINANCE_API_KEY!,
          secret: process.env.BINANCE_SECRET!,
        },
        testnet: process.env.BINANCE_TESTNET === 'true',
      });
      console.log('✅ Binance exchange added');
    }

    // Step 2: Test market data
    console.log('\n📋 Step 2: Testing market data access...');

    const ticker = await exchangeManager.fetchTicker('BTC/USDT', 'binance');
    console.log('✅ Market data retrieved:');
    console.log(`   Symbol: BTC/USDT`);
    console.log(`   Price: $${ticker.last.toFixed(2)}`);
    console.log(`   Bid: $${ticker.bid?.toFixed(2) || 'N/A'}`);
    console.log(`   Ask: $${ticker.ask?.toFixed(2) || 'N/A'}`);

    // Step 3: Check database
    console.log('\n📋 Step 3: Checking database connection...');

    const tokenCount = await prisma.token.count();
    const strategyCount = await prisma.tradingStrategy.count();

    console.log('✅ Database connected:');
    console.log(`   Tokens: ${tokenCount}`);
    console.log(`   Strategies: ${strategyCount}`);

    // Step 4: Find or create a test strategy
    console.log('\n📋 Step 4: Setting up test strategy...');

    let strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Test', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      console.log('⚠️  No test strategy found. Creating one...');
      strategy = await prisma.tradingStrategy.create({
        data: {
          name: 'Simple Test Strategy',
          archetype: 'Momentum',
          description: 'Basic momentum trading strategy for testing',
          timeframe: '1h',
          avgHoldTime: '4h',
          winRate: 0.5000,
          riskRewardRatio: 1.50,
          entryConditions: ['Price > MA20'],
          exitConditions: ['Stop-loss hit', 'Take-profit hit'],
          technicalIndicators: ['MA20'],
          onChainMetrics: [],
          socialSignals: [],
          sourceWalletIds: [],
          sourceTraderIds: [],
          sourceResearchIds: [],
          evidenceCount: 1,
          performanceScore: 50,
          practicalityScore: 80,
          verifiabilityScore: 70,
          totalScore: 65,
          status: 'active',
          priority: 1,
        },
      });
      console.log(`✅ Created test strategy: ${strategy.name}`);
    } else {
      console.log(`✅ Found test strategy: ${strategy.name}`);
    }

    // Step 5: Test token exists
    console.log('\n📋 Step 5: Checking for test tokens...');

    let btcToken = await prisma.token.findFirst({
      where: { symbol: 'BTC' },
    });

    if (!btcToken) {
      console.log('⚠️  BTC token not found. Creating...');
      btcToken = await prisma.token.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          coingeckoId: 'bitcoin',
          blockchain: 'bitcoin',
          currentPrice: ticker.last,
        },
      });
      console.log('✅ Created BTC token');
    } else {
      console.log('✅ BTC token exists');
    }

    // Final summary
    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL INFRASTRUCTURE TESTS PASSED');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Exchange: Connected (Binance ${process.env.BINANCE_TESTNET === 'true' ? 'Testnet' : 'Live'})`);
    console.log(`   Market Data: Working (BTC: $${ticker.last.toFixed(2)})`);
    console.log(`   Database: Connected (${tokenCount} tokens, ${strategyCount} strategies)`);
    console.log(`   Test Strategy: Ready (${strategy.name})`);

    console.log('\n💡 Next steps:');
    console.log('   1. ✅ Exchange connection validated');
    console.log('   2. ✅ Database working');
    console.log('   3. ⏳ Create unlock schedule table for Token Unlock strategy');
    console.log('   4. ⏳ Add Nansen MCP data for real unlock events');
    console.log('\n✨ Trading infrastructure is ready!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
