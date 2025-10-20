/**
 * Run Backtests for Untested Nansen Strategies
 *
 * Tests:
 * 1. Token Unlock Front-Running (Score: 87)
 * 2. Fresh Wallet Accumulation (Score: 84)
 *
 * With multiple coins: SOL, AVAX, MATIC, LINK, BTC, ETH
 */

import fetch from 'node-fetch';

interface BacktestConfig {
  strategyId: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  timeframe: string;
  initialCapital: number;
  positionSize: number;
}

interface BacktestResult {
  success: boolean;
  data?: {
    backtestId: string;
    status: string;
  };
  error?: string;
}

const API_BASE = 'http://localhost:3001/api/v1/backtesting';

// Strategy configurations
const strategies = [
  {
    id: 'cf2e274c-127f-4355-a756-067fbf8def49',
    name: 'Token Unlock Front-Running',
    score: 87,
    bestCoins: ['SOL', 'AVAX', 'MATIC'] // Newer chains with token unlocks
  },
  {
    id: '3c16b97b-25a9-410d-aa42-000ecbee3cd9',
    name: 'Fresh Wallet Accumulation',
    score: 84,
    bestCoins: ['ETH', 'SOL', 'AVAX'] // High fresh wallet activity
  }
];

async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  try {
    const response = await fetch(`${API_BASE}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const result = await response.json() as BacktestResult;
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function waitForCompletion(backtestId: string, maxWaitSeconds = 120): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const response = await fetch(`${API_BASE}/results/${backtestId}`);
      const result = await response.json();

      if (result.success && result.data.status === 'completed') {
        return true;
      }

      if (result.data.status === 'failed') {
        console.log(`     ❌ Backtest failed`);
        return false;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Continue waiting
    }
  }

  return false;
}

async function getBacktestResults(backtestId: string) {
  try {
    const response = await fetch(`${API_BASE}/results/${backtestId}`);
    const result = await response.json();

    if (result.success && result.data.metrics) {
      const metrics = result.data.metrics;
      return {
        totalReturn: (metrics.total_return_pct * 100).toFixed(2),
        sharpe: metrics.sharpe_ratio?.toFixed(2) || 'N/A',
        winRate: (metrics.win_rate * 100).toFixed(1),
        totalTrades: metrics.total_trades,
        profitFactor: metrics.profit_factor?.toFixed(2) || 'N/A'
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function runAllBacktests() {
  console.log('🚀 Running Backtests for Untested Nansen Strategies\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Period: Jan 1 - Jun 15, 2024 (166 days)');
  console.log('Timeframe: 4h');
  console.log('Initial Capital: $10,000');
  console.log('Position Size: 20% per trade');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: any[] = [];

  for (const strategy of strategies) {
    console.log(`\n📊 Testing: ${strategy.name} (Score: ${strategy.score})`);
    console.log(`   Best suited for: ${strategy.bestCoins.join(', ')}\n`);

    for (const symbol of strategy.bestCoins) {
      console.log(`   Testing with ${symbol}...`);

      const config: BacktestConfig = {
        strategyId: strategy.id,
        symbols: [symbol],
        startDate: '2024-01-01',
        endDate: '2024-06-15',
        timeframe: '4h',
        initialCapital: 10000,
        positionSize: 20
      };

      const result = await runBacktest(config);

      if (result.success && result.data?.backtestId) {
        process.stdout.write(`     ⏳ Running backtest (ID: ${result.data.backtestId.substring(0, 8)}...)...`);

        const completed = await waitForCompletion(result.data.backtestId);

        if (completed) {
          const metrics = await getBacktestResults(result.data.backtestId);

          if (metrics) {
            console.log(' ✅ Complete');
            console.log(`     📈 Return: ${metrics.totalReturn}% | Sharpe: ${metrics.sharpe} | Win Rate: ${metrics.winRate}%`);
            console.log(`     📊 Trades: ${metrics.totalTrades} | Profit Factor: ${metrics.profitFactor}\n`);

            results.push({
              strategy: strategy.name,
              symbol,
              ...metrics,
              backtestId: result.data.backtestId
            });
          }
        } else {
          console.log(' ❌ Failed or timed out\n');
        }
      } else {
        console.log(`     ❌ Error: ${result.error}\n`);
      }
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ BACKTEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.length > 0) {
    console.log('Completed Backtests:\n');

    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.strategy} - ${r.symbol}`);
      console.log(`   Return: ${r.totalReturn}% | Sharpe: ${r.sharpe} | Win Rate: ${r.winRate}%`);
      console.log(`   Trades: ${r.totalTrades} | Profit Factor: ${r.profitFactor}`);
      console.log(`   Backtest ID: ${r.backtestId}\n`);
    });

    // Best performers
    const bestReturn = results.reduce((max, r) =>
      parseFloat(r.totalReturn) > parseFloat(max.totalReturn) ? r : max
    );

    const bestSharpe = results.filter(r => r.sharpe !== 'N/A').reduce((max, r) =>
      parseFloat(r.sharpe) > parseFloat(max.sharpe) ? r : max
    , results[0]);

    console.log('🏆 Best Performers:');
    console.log(`   Highest Return: ${bestReturn.strategy} - ${bestReturn.symbol} (${bestReturn.totalReturn}%)`);
    if (bestSharpe && bestSharpe.sharpe !== 'N/A') {
      console.log(`   Best Sharpe: ${bestSharpe.strategy} - ${bestSharpe.symbol} (${bestSharpe.sharpe})`);
    }

    console.log(`\n📊 Total Backtests Completed: ${results.length}`);
    console.log(`✅ Success Rate: ${((results.length / (strategies.length * 3)) * 100).toFixed(0)}%`);
  } else {
    console.log('❌ No backtests completed successfully');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 View detailed results in the Backtesting Dashboard');
  console.log('   http://localhost:5175 (or your frontend port)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runAllBacktests()
  .then(() => {
    console.log('\n✨ Backtesting complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error running backtests:', error);
    process.exit(1);
  });
