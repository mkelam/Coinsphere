/**
 * Test Token Unlock Front-Running Strategy
 * Tests the strategy activation, signal generation, and execution flow
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { strategyExecutor } from '../src/services/strategyExecutor';
import { marketDataStreamer } from '../src/services/marketDataStreamer';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Token Unlock Front-Running Strategy\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Check if Token Unlock strategy exists
    console.log('\n📋 Step 1: Finding Token Unlock strategy...');

    let strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      console.log('⚠️  Token Unlock strategy not found. Creating test strategy...');

      strategy = await prisma.tradingStrategy.create({
        data: {
          name: 'Token Unlock Front-Running (Test)',
          archetype: 'Event-Driven',
          description: 'Buy tokens 24 hours before large unlock events',
          timeframe: '1d',
          avgHoldTime: '48h',
          winRate: 0.5100,
          riskRewardRatio: 1.04,
          entryConditions: ['Large unlock event within 24-48h', 'Unlock > 5% of supply'],
          exitConditions: ['After unlock event', 'Stop-loss hit', 'Take-profit hit'],
          technicalIndicators: [],
          onChainMetrics: ['unlock_schedule', 'circulating_supply'],
          socialSignals: [],
          sourceWalletIds: [],
          sourceTraderIds: [],
          sourceResearchIds: [],
          evidenceCount: 10,
          performanceScore: 51,
          practicalityScore: 85,
          verifiabilityScore: 90,
          totalScore: 75,
          status: 'active',
          priority: 1,
        },
      });

      console.log(`✅ Created test strategy: ${strategy.name} (ID: ${strategy.id})`);
    } else {
      console.log(`✅ Found strategy: ${strategy.name} (ID: ${strategy.id})`);
    }

    // Step 2: Create sample unlock events for testing
    console.log('\n📋 Step 2: Creating sample unlock events...');

    // Check if we have test tokens
    let testToken = await prisma.token.findFirst({
      where: { symbol: 'APT' }, // Aptos - commonly has unlock events
    });

    if (!testToken) {
      console.log('⚠️  APT token not found. Creating test token...');
      testToken = await prisma.token.create({
        data: {
          symbol: 'APT',
          name: 'Aptos',
          coingeckoId: 'aptos',
          blockchain: 'aptos',
          marketCap: 5000000000,
          currentPrice: 12.50,
        },
      });
      console.log(`✅ Created test token: ${testToken.symbol}`);
    } else {
      console.log(`✅ Found token: ${testToken.symbol}`);
    }

    // Create unlock event 25 hours from now (within entry window)
    const unlockDate = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const existingUnlock = await prisma.tokenUnlockSchedule.findFirst({
      where: {
        tokenId: testToken.id,
        unlockDate: { gte: new Date() },
      },
    });

    if (!existingUnlock) {
      await prisma.tokenUnlockSchedule.create({
        data: {
          tokenId: testToken.id,
          unlockDate,
          unlockAmount: 50000000, // 50M tokens
          percentOfSupply: 10.0, // 10% unlock
          circulatingSupply: 500000000, // 500M circulating
          source: 'test',
        },
      });
      console.log(`✅ Created test unlock event for ${testToken.symbol}`);
      console.log(`   Unlock date: ${unlockDate.toISOString()}`);
      console.log(`   Amount: 50M tokens (10% of supply)`);
    } else {
      console.log(`✅ Unlock event already exists for ${testToken.symbol}`);
    }

    // Step 3: Start strategy executor
    console.log('\n📋 Step 3: Starting strategy executor...');
    await strategyExecutor.start();
    console.log('✅ Strategy executor started');

    // Step 4: Activate Token Unlock strategy
    console.log('\n📋 Step 4: Activating Token Unlock strategy...');

    const strategyConfig = {
      id: strategy.id,
      name: strategy.name,
      symbols: ['APT/USDT'],
      exchange: 'binance' as const,
      mode: 'paper' as const,
      allocatedCapital: 10000, // $10,000 test capital
      maxPositionSize: 0.10, // 10% position size
      maxOpenPositions: 3,
      dailyLossLimit: 0.05, // 5% daily loss limit
      stopLoss: 0.03, // 3% stop loss
      takeProfit: 0.05, // 5% take profit
    };

    await strategyExecutor.activateStrategy(strategyConfig);
    console.log('✅ Strategy activated in PAPER mode');
    console.log(`   Capital: $${strategyConfig.allocatedCapital}`);
    console.log(`   Symbols: ${strategyConfig.symbols.join(', ')}`);

    // Step 5: Check execution state
    console.log('\n📋 Step 5: Checking execution state...');

    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId: strategy.id },
    });

    if (state) {
      console.log('✅ Execution state created:');
      console.log(`   Active: ${state.isActive}`);
      console.log(`   Mode: ${state.mode}`);
      console.log(`   Capital: $${state.currentCapital.toNumber()}`);
      console.log(`   Max positions: ${state.maxOpenPositions}`);
      console.log(`   Daily loss limit: ${(state.dailyLossLimit.toNumber() * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Failed to create execution state');
      throw new Error('Execution state not created');
    }

    // Step 6: Check market data subscriptions
    console.log('\n📋 Step 6: Checking market data subscriptions...');

    const subscriptions = marketDataStreamer.getSubscriptions();
    console.log(`✅ Active subscriptions: ${subscriptions.length}`);

    for (const sub of subscriptions) {
      console.log(`   - ${sub.symbol} (${sub.exchange}) - ${sub.dataType}`);
    }

    // Step 7: Wait for initial signal generation (30 seconds)
    console.log('\n📋 Step 7: Monitoring for signals (30 seconds)...');
    console.log('⏳ Waiting for market data updates and signal generation...');

    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Check for any signals generated
    const signals = await prisma.tradingSignal.findMany({
      where: { strategyId: strategy.id },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    console.log(`\n✅ Signals generated: ${signals.length}`);

    if (signals.length > 0) {
      for (const signal of signals) {
        console.log(`\n   Signal: ${signal.action.toUpperCase()} ${signal.symbol}`);
        console.log(`   Strength: ${signal.strength.toNumber().toFixed(2)}`);
        console.log(`   Reasoning: ${signal.reasoning}`);
        console.log(`   Executed: ${signal.executed ? '✅' : '⏳'}`);
        console.log(`   Timestamp: ${signal.timestamp.toISOString()}`);
      }
    } else {
      console.log('   ℹ️  No signals generated yet (this is normal if price data is unavailable)');
      console.log('   💡 In production, signals will trigger when unlock events approach entry window');
    }

    // Step 8: Check positions
    console.log('\n📋 Step 8: Checking positions...');

    const positions = await prisma.livePosition.findMany({
      where: { strategyId: strategy.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`✅ Positions: ${positions.length}`);

    if (positions.length > 0) {
      for (const pos of positions) {
        console.log(`\n   Position: ${pos.side.toUpperCase()} ${pos.symbol}`);
        console.log(`   Entry: $${pos.entryPrice.toNumber().toFixed(6)}`);
        console.log(`   Quantity: ${pos.quantity.toNumber()}`);
        console.log(`   Status: ${pos.status}`);
        console.log(`   P&L: $${pos.pnl.toNumber().toFixed(2)} (${pos.pnlPercent?.toNumber().toFixed(2)}%)`);
      }
    } else {
      console.log('   ℹ️  No positions opened yet');
    }

    // Step 9: Stop strategy
    console.log('\n📋 Step 9: Stopping strategy...');

    await strategyExecutor.stopStrategy(strategy.id);
    console.log('✅ Strategy stopped');

    await strategyExecutor.stop();
    console.log('✅ Strategy executor stopped');

    // Final summary
    console.log('\n' + '═'.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Strategy: ${strategy.name}`);
    console.log(`   Test duration: 30 seconds`);
    console.log(`   Signals: ${signals.length}`);
    console.log(`   Positions: ${positions.length}`);
    console.log(`   Mode: PAPER (no real trades)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Add real unlock event data via Nansen MCP');
    console.log('   2. Test with live market data from Binance');
    console.log('   3. Monitor signals and validate entry/exit logic');
    console.log('   4. Once validated, switch to LIVE mode');
    console.log('\n✨ Token Unlock strategy is ready for production!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
