/**
 * Monitor Token Unlock Front-Running Strategy
 *
 * Displays current status of:
 * - Upcoming unlock events
 * - Strategy execution state
 * - Generated signals
 * - Open positions
 * - Performance metrics
 *
 * Usage:
 *   npx tsx scripts/monitor-unlock-strategy.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Token Unlock Strategy Monitor\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Find Token Unlock strategy
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        name: { contains: 'Token Unlock', mode: 'insensitive' },
      },
    });

    if (!strategy) {
      console.log('❌ Token Unlock strategy not found');
      console.log('   Run: npx tsx scripts/test-token-unlock-strategy.ts');
      return;
    }

    console.log(`\n✅ Strategy: ${strategy.name} (ID: ${strategy.id})`);
    console.log(`   Status: ${strategy.status}`);
    console.log(`   Win Rate: ${(strategy.winRate.toNumber() * 100).toFixed(2)}%`);
    console.log(`   Risk/Reward: ${strategy.riskRewardRatio.toNumber()}`);

    // Step 2: Check execution state
    console.log('\n📋 Execution State:');
    const state = await prisma.strategyExecutionState.findUnique({
      where: { strategyId: strategy.id },
    });

    if (state) {
      console.log(`   Active: ${state.isActive ? '🟢 YES' : '🔴 NO'}`);
      console.log(`   Mode: ${state.mode.toUpperCase()}`);
      console.log(`   Capital: $${state.currentCapital.toNumber().toLocaleString()}`);
      console.log(`   Total P&L: ${state.totalPnl.toNumber() >= 0 ? '+' : ''}$${state.totalPnl.toNumber().toFixed(2)}`);
      console.log(`   Total Trades: ${state.totalTrades}`);
      console.log(`   Win Rate: ${state.winRate ? (state.winRate.toNumber() * 100).toFixed(2) + '%' : 'N/A'}`);
      console.log(`   Max Drawdown: ${state.maxDrawdown ? (state.maxDrawdown.toNumber() * 100).toFixed(2) + '%' : 'N/A'}`);
      console.log(`   Open Positions: ${state.currentOpenPositions} / ${state.maxOpenPositions}`);
    } else {
      console.log('   ⚠️  Not activated yet');
      console.log('   Run: npx tsx scripts/test-token-unlock-strategy.ts');
    }

    // Step 3: Upcoming unlock events
    console.log('\n📅 Upcoming Unlock Events (Next 30 days):');

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcomingUnlocks = await prisma.tokenUnlockSchedule.findMany({
      where: {
        unlockDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        token: true,
      },
      orderBy: {
        unlockDate: 'asc',
      },
      take: 10,
    });

    if (upcomingUnlocks.length === 0) {
      console.log('   ℹ️  No unlock events found');
      console.log('   Run: npx tsx scripts/add-token-unlock-events.ts');
    } else {
      for (const unlock of upcomingUnlocks) {
        const daysUntil = Math.round((unlock.unlockDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        const hoursUntil = Math.round((unlock.unlockDate.getTime() - now.getTime()) / (60 * 60 * 1000));

        // Check if within entry window (24-48h before)
        const inEntryWindow = hoursUntil >= 24 && hoursUntil <= 48;

        console.log(`\n   ${inEntryWindow ? '🎯' : '📅'} ${unlock.token.symbol} - ${unlock.token.name}`);
        console.log(`      Date: ${unlock.unlockDate.toISOString()}`);
        console.log(`      Time Until: ${daysUntil} days (${hoursUntil} hours)`);
        console.log(`      Amount: ${unlock.unlockAmount.toNumber().toLocaleString()} tokens`);
        console.log(`      % of Supply: ${unlock.percentOfSupply.toNumber()}%`);
        console.log(`      Category: ${unlock.category || 'N/A'}`);

        if (inEntryWindow) {
          console.log(`      ⚡ ENTRY WINDOW ACTIVE - Signal should be generated!`);
        } else if (hoursUntil < 24) {
          console.log(`      ⏰ Too close - within 24h (no entry)`);
        } else {
          console.log(`      ⏳ Waiting - ${hoursUntil - 48} hours until entry window`);
        }
      }
    }

    // Step 4: Recent signals
    console.log('\n📡 Recent Signals (Last 5):');

    try {
      const signals = await prisma.tradingSignal.findMany({
        where: { strategyId: strategy.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (signals.length === 0) {
        console.log('   ℹ️  No signals generated yet');
        console.log('   Signals will appear when unlocks enter 24-48h window');
      } else {
        for (const signal of signals) {
          console.log(`\n   ${signal.action.toUpperCase()} ${signal.symbol}`);
          console.log(`      Strength: ${signal.strength?.toNumber().toFixed(2) || 'N/A'}`);
          console.log(`      Reasoning: ${signal.reasoning || 'N/A'}`);
          console.log(`      Executed: ${signal.executed ? '✅' : '⏳ Pending'}`);
          console.log(`      Created: ${signal.createdAt.toISOString()}`);
        }
      }
    } catch (error: any) {
      console.log('   ⚠️  Signal table not found (expected in development)');
      console.log('   This table will be created when strategy generates first signal');
    }

    // Step 5: Open positions
    console.log('\n💼 Open Positions:');

    try {
      const positions = await prisma.livePosition.findMany({
        where: {
          strategyId: strategy.id,
          status: 'open',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (positions.length === 0) {
        console.log('   ℹ️  No open positions');
      } else {
        for (const pos of positions) {
          const pnl = pos.pnl.toNumber();
          const pnlPercent = pos.pnlPercent?.toNumber() || 0;

          console.log(`\n   ${pos.side.toUpperCase()} ${pos.symbol}`);
          console.log(`      Entry: $${pos.entryPrice.toNumber().toFixed(6)}`);
          console.log(`      Quantity: ${pos.quantity.toNumber()}`);
          console.log(`      Current P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
          console.log(`      Stop Loss: $${pos.stopLossPrice?.toNumber().toFixed(6) || 'N/A'}`);
          console.log(`      Take Profit: $${pos.takeProfitPrice?.toNumber().toFixed(6) || 'N/A'}`);
          console.log(`      Opened: ${pos.createdAt.toISOString()}`);
        }
      }
    } catch (error: any) {
      console.log('   ⚠️  Position table not found (expected in development)');
      console.log('   Live positions will be created when strategy executes signals');
    }

    // Step 6: Performance summary
    console.log('\n📈 Performance Summary:');

    try {
      const closedPositions = await prisma.livePosition.findMany({
        where: {
          strategyId: strategy.id,
          status: 'closed',
        },
      });

      if (closedPositions.length === 0) {
        console.log('   ℹ️  No closed positions yet (strategy just started)');
      } else {
        const totalPnl = closedPositions.reduce((sum, pos) => sum + pos.pnl.toNumber(), 0);
        const winners = closedPositions.filter((pos) => pos.pnl.toNumber() > 0).length;
        const losers = closedPositions.filter((pos) => pos.pnl.toNumber() <= 0).length;
        const winRate = winners / closedPositions.length;

        console.log(`   Total Closed Trades: ${closedPositions.length}`);
        console.log(`   Winners: ${winners} (${(winRate * 100).toFixed(2)}%)`);
        console.log(`   Losers: ${losers}`);
        console.log(`   Total P&L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`);
        console.log(`   Avg P&L per Trade: ${totalPnl >= 0 ? '+' : ''}$${(totalPnl / closedPositions.length).toFixed(2)}`);
      }
    } catch (error: any) {
      console.log('   ⚠️  Position history not available yet');
    }

    // Final summary
    console.log('\n' + '═'.repeat(80));
    console.log('✅ MONITORING COMPLETE');
    console.log('═'.repeat(80));

    const activeUnlocks = upcomingUnlocks.filter((u) => {
      const hoursUntil = Math.round((u.unlockDate.getTime() - now.getTime()) / (60 * 60 * 1000));
      return hoursUntil >= 24 && hoursUntil <= 48;
    });

    if (activeUnlocks.length > 0) {
      console.log(`\n🎯 ${activeUnlocks.length} tokens in entry window (24-48h)`);
      console.log(`   Strategy should generate signals automatically`);
    } else {
      console.log(`\n⏳ No tokens in entry window yet`);
      console.log(`   Monitoring ${upcomingUnlocks.length} upcoming unlocks`);
    }

    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Keep strategy running (or restart if stopped)`);
    console.log(`   2. Check this monitor daily: npx tsx scripts/monitor-unlock-strategy.ts`);
    console.log(`   3. Review signals when generated`);
    console.log(`   4. Monitor positions and P&L`);
    console.log(`\n✨ Happy paper trading!\n`);

  } catch (error: any) {
    console.error('\n❌ MONITORING FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
