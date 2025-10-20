/**
 * Run First Backtest - Test Script
 *
 * Tests the DeFi Derivatives Momentum strategy with ETH data
 */

import { BacktestEngine } from '../src/services/backtestEngine.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 RUNNING FIRST BACKTEST - DeFi Derivatives Momentum Strategy');
  console.log('='.repeat(80));
  console.log();

  try {
    // Configure backtest
    const config = {
      strategyId: '7d2a7645-d0be-4b25-b143-d2409a1ea0e7',
      strategyName: 'DeFi Derivatives Momentum',
      symbols: ['ETH'], // Start with just ETH
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      timeframe: '4h',
      initialCapital: 10000,

      // Position sizing
      positionSizePct: 0.05, // 5% per trade
      maxPortfolioHeat: 0.25, // Max 25% at risk
      maxPositions: 3,

      // Costs
      makerFee: 0.001, // 0.1%
      takerFee: 0.001, // 0.1%
      slippagePct: 0.005 // 0.5%
    };

    console.log('📋 Backtest Configuration:');
    console.log(`   Strategy: ${config.strategyName}`);
    console.log(`   Symbols: ${config.symbols.join(', ')}`);
    console.log(`   Period: ${config.startDate.toISOString().split('T')[0]} to ${config.endDate.toISOString().split('T')[0]}`);
    console.log(`   Initial Capital: $${config.initialCapital.toLocaleString()}`);
    console.log(`   Position Size: ${config.positionSizePct * 100}% per trade`);
    console.log(`   Max Positions: ${config.maxPositions}`);
    console.log();

    // Create and run backtest with database persistence
    const engine = new BacktestEngine(config);
    const { result, backtestId } = await engine.runAndSave();

    // Display results
    console.log();
    console.log('='.repeat(80));
    console.log('📊 BACKTEST RESULTS');
    console.log('='.repeat(80));
    console.log();
    console.log(`🆔 Backtest ID: ${backtestId}`);
    console.log();

    console.log('💰 PERFORMANCE:');
    console.log(`   Initial Capital: $${result.performance.initialCapital.toLocaleString()}`);
    console.log(`   Final Capital: $${result.performance.finalCapital.toLocaleString()}`);
    console.log(`   Total Return: $${result.performance.totalReturn.toFixed(2)} (${(result.performance.totalReturnPct * 100).toFixed(2)}%)`);
    console.log(`   Peak Value: $${result.performance.peakValue.toLocaleString()}`);
    console.log(`   Max Drawdown: $${result.performance.maxDrawdown.toFixed(2)} (${(result.performance.maxDrawdownPct * 100).toFixed(2)}%)`);
    console.log();

    console.log('📈 TRADES:');
    console.log(`   Total Trades: ${result.trades.totalTrades}`);
    console.log(`   Winning Trades: ${result.trades.winningTrades}`);
    console.log(`   Losing Trades: ${result.trades.losingTrades}`);
    console.log(`   Win Rate: ${(result.trades.winRate * 100).toFixed(1)}%`);
    console.log(`   Avg P&L: $${result.trades.avgPnL.toFixed(2)}`);
    console.log(`   Avg Winner: $${result.trades.avgWinner.toFixed(2)}`);
    console.log(`   Avg Loser: $${result.trades.avgLoser.toFixed(2)}`);
    console.log(`   Largest Win: $${result.trades.largestWin.toFixed(2)}`);
    console.log(`   Largest Loss: $${result.trades.largestLoss.toFixed(2)}`);
    console.log(`   Profit Factor: ${result.trades.profitFactor.toFixed(2)}`);
    console.log(`   Avg Hold Time: ${result.trades.avgHoldTimeHours.toFixed(1)} hours`);
    console.log();

    console.log('📊 RISK-ADJUSTED METRICS:');
    console.log(`   Sharpe Ratio: ${result.metrics.sharpeRatio?.toFixed(2) || 'N/A'}`);
    console.log(`   Sortino Ratio: ${result.metrics.sortinoRatio?.toFixed(2) || 'N/A'}`);
    console.log(`   Calmar Ratio: ${result.metrics.calmarRatio?.toFixed(2) || 'N/A'}`);
    console.log(`   Ulcer Index: ${result.metrics.ulcerIndex?.toFixed(2) || 'N/A'}`);
    console.log();

    console.log('💡 EXPECTANCY & RISK:');
    console.log(`   Expectancy: $${result.metrics.expectancy.toFixed(2)}`);
    console.log(`   Kelly Criterion: ${(result.metrics.kellyCriterion * 100).toFixed(1)}%`);
    console.log(`   Payoff Ratio: ${result.metrics.payoffRatio.toFixed(2)}`);
    console.log(`   Recovery Factor: ${result.metrics.recoveryFactor.toFixed(2)}`);
    console.log();

    console.log('📉 DRAWDOWN ANALYSIS:');
    console.log(`   Max Drawdown: ${(result.metrics.maxDrawdownPct * 100).toFixed(2)}%`);
    console.log(`   Avg Drawdown: ${(result.metrics.avgDrawdownPct * 100).toFixed(2)}%`);
    console.log(`   Max DD Duration: ${result.metrics.maxDrawdownDuration.toFixed(0)} days`);
    console.log();

    console.log('🎯 CONSISTENCY:');
    console.log(`   Consecutive Wins: ${result.metrics.consecutiveWins}`);
    console.log(`   Consecutive Losses: ${result.metrics.consecutiveLosses}`);
    console.log(`   Avg Win Streak: ${result.metrics.winStreakAvg.toFixed(1)}`);
    console.log(`   Avg Lose Streak: ${result.metrics.loseStreakAvg.toFixed(1)}`);
    console.log();

    console.log('⏱️  EXECUTION:');
    console.log(`   Time: ${result.executionTime}ms`);
    console.log();

    console.log('='.repeat(80));
    console.log('✅ BACKTEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

    process.exit(0);

  } catch (error: any) {
    console.error();
    console.error('='.repeat(80));
    console.error('❌ BACKTEST FAILED');
    console.error('='.repeat(80));
    console.error();
    console.error('Error:', error.message);
    console.error();
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
