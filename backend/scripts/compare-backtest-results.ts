import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function compareBacktestResults() {
  console.log('📊 Comparing Simulated vs Real Data Backtest Results\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all completed backtests with their details
  const allBacktests = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    strategy_name: string;
    start_date: Date;
    end_date: Date;
    total_return_pct: number;
    sharpe_ratio: number | null;
    win_rate: number | null;
    total_trades: number | null;
    created_at: Date;
  }>>`
    SELECT
      bc.id,
      bc.name,
      ts.name as strategy_name,
      bc.start_date,
      bc.end_date,
      bc.total_return_pct::float,
      bc.sharpe_ratio::float,
      bc.win_rate::float,
      bc.total_trades,
      bc.created_at
    FROM backtest_configs bc
    JOIN trading_strategies ts ON bc.strategy_id = ts.id
    WHERE bc.status = 'completed'
    ORDER BY bc.created_at ASC
  `;

  console.log(`Found ${allBacktests.length} completed backtests\n`);

  // Categorize by data source (simulated vs real)
  const simulatedBacktests = allBacktests.filter(bt => {
    const startDate = new Date(bt.start_date);
    return startDate.getFullYear() === 2024 && startDate.getMonth() === 0; // Jan 2024 = simulated
  });

  const realDataBacktests = allBacktests.filter(bt => {
    const startDate = new Date(bt.start_date);
    return startDate.getFullYear() === 2024 && startDate.getMonth() === 9; // Oct 2024 = real
  });

  console.log(`📉 Simulated Data: ${simulatedBacktests.length} backtests (Jan-Jun 2024)`);
  console.log(`📈 Real Data: ${realDataBacktests.length} backtests (Oct 2024-Oct 2025)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 OVERALL PERFORMANCE COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Calculate averages
  const avgSimulated = {
    return: simulatedBacktests.reduce((sum, bt) => sum + (bt.total_return_pct || 0), 0) / (simulatedBacktests.length || 1),
    sharpe: simulatedBacktests.filter(bt => bt.sharpe_ratio !== null).reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / (simulatedBacktests.filter(bt => bt.sharpe_ratio !== null).length || 1),
    winRate: simulatedBacktests.filter(bt => bt.win_rate !== null).reduce((sum, bt) => sum + (bt.win_rate || 0), 0) / (simulatedBacktests.filter(bt => bt.win_rate !== null).length || 1),
    trades: simulatedBacktests.reduce((sum, bt) => sum + (bt.total_trades || 0), 0) / (simulatedBacktests.length || 1)
  };

  const avgReal = {
    return: realDataBacktests.reduce((sum, bt) => sum + (bt.total_return_pct || 0), 0) / (realDataBacktests.length || 1),
    sharpe: realDataBacktests.filter(bt => bt.sharpe_ratio !== null).reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / (realDataBacktests.filter(bt => bt.sharpe_ratio !== null).length || 1),
    winRate: realDataBacktests.filter(bt => bt.win_rate !== null).reduce((sum, bt) => sum + (bt.win_rate || 0), 0) / (realDataBacktests.filter(bt => bt.win_rate !== null).length || 1),
    trades: realDataBacktests.reduce((sum, bt) => sum + (bt.total_trades || 0), 0) / (realDataBacktests.length || 1)
  };

  console.log('Simulated Data (Jan-Jun 2024):');
  console.log(`  📈 Avg Return: ${(avgSimulated.return * 100).toFixed(2)}%`);
  console.log(`  📊 Avg Sharpe: ${avgSimulated.sharpe.toFixed(2)}`);
  console.log(`  🎯 Avg Win Rate: ${(avgSimulated.winRate * 100).toFixed(1)}%`);
  console.log(`  💼 Avg Trades: ${avgSimulated.trades.toFixed(1)}`);

  console.log('\nReal Market Data (Oct 2024-Oct 2025):');
  console.log(`  📈 Avg Return: ${(avgReal.return * 100).toFixed(2)}%`);
  console.log(`  📊 Avg Sharpe: ${avgReal.sharpe.toFixed(2)}`);
  console.log(`  🎯 Avg Win Rate: ${(avgReal.winRate * 100).toFixed(1)}%`);
  console.log(`  💼 Avg Trades: ${avgReal.trades.toFixed(1)}`);

  const returnDiff = ((avgReal.return - avgSimulated.return) * 100);
  const sharpeDiff = (avgReal.sharpe - avgSimulated.sharpe);
  const winRateDiff = ((avgReal.winRate - avgSimulated.winRate) * 100);

  console.log('\n📊 Difference (Real vs Simulated):');
  console.log(`  ${returnDiff > 0 ? '📈' : '📉'} Return: ${returnDiff > 0 ? '+' : ''}${returnDiff.toFixed(2)}%`);
  console.log(`  ${sharpeDiff > 0 ? '📈' : '📉'} Sharpe: ${sharpeDiff > 0 ? '+' : ''}${sharpeDiff.toFixed(2)}`);
  console.log(`  ${winRateDiff > 0 ? '📈' : '📉'} Win Rate: ${winRateDiff > 0 ? '+' : ''}${winRateDiff.toFixed(1)}%`);

  // Strategy-by-strategy comparison
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 STRATEGY-BY-STRATEGY COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get unique strategies
  const strategies = [...new Set(allBacktests.map(bt => bt.strategy_name))];

  for (const strategy of strategies) {
    const simulated = simulatedBacktests.filter(bt => bt.strategy_name === strategy);
    const real = realDataBacktests.filter(bt => bt.strategy_name === strategy);

    if (simulated.length === 0 && real.length === 0) continue;

    console.log(`\n📈 ${strategy}`);
    console.log(`   Simulated: ${simulated.length} backtests | Real: ${real.length} backtests`);

    if (simulated.length > 0) {
      const avgSim = {
        return: simulated.reduce((sum, bt) => sum + (bt.total_return_pct || 0), 0) / simulated.length,
        sharpe: simulated.filter(bt => bt.sharpe_ratio !== null).reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / (simulated.filter(bt => bt.sharpe_ratio !== null).length || 1),
        winRate: simulated.filter(bt => bt.win_rate !== null).reduce((sum, bt) => sum + (bt.win_rate || 0), 0) / (simulated.filter(bt => bt.win_rate !== null).length || 1)
      };

      console.log(`   📉 Simulated Avg: Return ${(avgSim.return * 100).toFixed(2)}% | Sharpe ${avgSim.sharpe.toFixed(2)} | Win ${(avgSim.winRate * 100).toFixed(1)}%`);
    }

    if (real.length > 0) {
      const avgRl = {
        return: real.reduce((sum, bt) => sum + (bt.total_return_pct || 0), 0) / real.length,
        sharpe: real.filter(bt => bt.sharpe_ratio !== null).reduce((sum, bt) => sum + (bt.sharpe_ratio || 0), 0) / (real.filter(bt => bt.sharpe_ratio !== null).length || 1),
        winRate: real.filter(bt => bt.win_rate !== null).reduce((sum, bt) => sum + (bt.win_rate || 0), 0) / (real.filter(bt => bt.win_rate !== null).length || 1)
      };

      console.log(`   📈 Real Avg: Return ${(avgRl.return * 100).toFixed(2)}% | Sharpe ${avgRl.sharpe.toFixed(2)} | Win ${(avgRl.winRate * 100).toFixed(1)}%`);
    }
  }

  // Data characteristics
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 DATA CHARACTERISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Simulated Data:');
  console.log('  📅 Period: January 1 - June 15, 2024 (166 days)');
  console.log('  📊 Records: 6,000 (1,000 per coin × 6 coins)');
  console.log('  🔧 Type: Artificially generated with trends & volatility');
  console.log('  ⏰ Timeframe: 4-hour candles');

  console.log('\nReal Market Data:');
  console.log('  📅 Period: October 20, 2024 - October 19, 2025 (92 days)');
  console.log('  📊 Records: 3,312 (552 per coin × 6 coins)');
  console.log('  🔗 Source: CoinGecko API');
  console.log('  ⏰ Timeframe: 4-hour candles');
  console.log('  ✅ Type: Real market OHLCV data');

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 KEY INSIGHTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (realDataBacktests.length > 0) {
    if (avgReal.return > avgSimulated.return) {
      console.log('✅ Strategies perform BETTER with real data');
      console.log(`   Real data shows ${returnDiff.toFixed(2)}% higher returns`);
    } else {
      console.log('⚠️  Strategies perform WORSE with real data');
      console.log(`   Real data shows ${Math.abs(returnDiff).toFixed(2)}% lower returns`);
      console.log('   This is normal - real markets are harder to predict');
    }

    if (avgReal.sharpe > avgSimulated.sharpe) {
      console.log('\n✅ Better risk-adjusted returns with real data');
    } else {
      console.log('\n⚠️  Lower risk-adjusted returns with real data');
    }

    if (avgReal.winRate > avgSimulated.winRate) {
      console.log('✅ Higher win rate with real data');
    } else {
      console.log('⚠️  Lower win rate with real data');
    }
  } else {
    console.log('⚠️  No real data backtests completed yet');
    console.log('   Run backtests with the extended 92-day dataset to compare');
  }

  console.log('\n✨ Comparison complete!\n');
}

compareBacktestResults()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
