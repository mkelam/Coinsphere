import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1/backtesting';

interface BacktestConfig {
  strategyId: string;
  strategyName: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  positionSizePct: number;
}

interface BacktestResult {
  success: boolean;
  data?: {
    id: string;
    status: string;
  };
}

const strategies = [
  {
    id: 'f5b24672-8334-4d2e-982a-08fb1644834e',
    name: 'Smart Money Momentum',
    score: 98,
    bestCoins: ['BTC', 'ETH', 'SOL']
  },
  {
    id: '46dc8ed4-6cb9-4c0c-8b66-6af7845bddde',
    name: 'Whale Accumulation Breakout',
    score: 90,
    bestCoins: ['BTC', 'ETH', 'AVAX']
  },
  {
    id: 'cf2e274c-127f-4355-a756-067fbf8def49',
    name: 'Token Unlock Front-Running',
    score: 87,
    bestCoins: ['SOL', 'AVAX', 'MATIC']
  },
  {
    id: '3c16b97b-25a9-410d-aa42-000ecbee3cd9',
    name: 'Fresh Wallet Accumulation',
    score: 84,
    bestCoins: ['ETH', 'SOL', 'AVAX']
  },
  {
    id: '7d2a7645-d0be-4b25-b143-d2409a1ea0e7',
    name: 'DeFi Derivatives Momentum',
    score: 83,
    bestCoins: ['ETH', 'LINK', 'AVAX']
  }
];

async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  console.log(`  🔄 Starting backtest...`);

  const backtestConfig = {
    strategyId: config.strategyId,
    name: `Backtest - ${config.strategyName} - ${new Date().toISOString().split('T')[0]}`,
    description: `Extended 92-day real data backtest for ${config.strategyName} on ${config.symbols.join(', ')}`,
    symbols: config.symbols,
    timeframe: '4h',
    startDate: config.startDate,
    endDate: config.endDate,
    initialCapital: config.initialCapital,
    positionSizePct: config.positionSizePct,
    maxPortfolioHeat: 0.30,
    maxDrawdownLimit: 0.20,
    makerFee: 0.001,
    takerFee: 0.001,
    slippagePct: 0.001
  };

  try {
    const response = await axios.post(`${API_BASE}/run`, backtestConfig, {
      timeout: 60000
    });

    return response.data as BacktestResult;
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    return { success: false };
  }
}

async function waitForCompletion(backtestId: string, maxWaitSeconds = 120): Promise<boolean> {
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const response = await axios.get(`${API_BASE}/results/${backtestId}`);
      const result = response.data;

      if (result.success && result.data.status === 'completed') {
        return true;
      }

      if (result.data.status === 'failed') {
        console.log(`  ❌ Backtest failed: ${result.data.error_message || 'Unknown error'}`);
        return false;
      }

      // Show progress if status changed
      if (result.data.status !== lastStatus) {
        console.log(`  ⏳ Status: ${result.data.status}`);
        lastStatus = result.data.status;
      }

    } catch (error: any) {
      // Ignore errors during polling (might be schema issues)
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`  ⏰ Timeout waiting for completion`);
  return false;
}

async function getBacktestResults(backtestId: string) {
  try {
    const response = await axios.get(`${API_BASE}/${backtestId}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('🚀 Re-running Backtests with Extended Real Data (92 Days)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📅 Period: Oct 20, 2024 - Oct 19, 2025 (92 days)');
  console.log('⏰ Timeframe: 4-hour candles');
  console.log('💰 Initial Capital: $10,000');
  console.log('📊 Position Size: 20% per trade');
  console.log('🔗 Data Source: CoinGecko (Real Market Data)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: Array<{
    strategy: string;
    symbol: string;
    success: boolean;
    backtestId?: string;
    metrics?: any;
  }> = [];

  let totalTests = 0;
  for (const strategy of strategies) {
    totalTests += strategy.bestCoins.length;
  }

  let completedTests = 0;

  for (const strategy of strategies) {
    console.log(`\n📊 Testing: ${strategy.name} (Score: ${strategy.score})`);
    console.log(`   Best suited for: ${strategy.bestCoins.join(', ')}\n`);

    for (const symbol of strategy.bestCoins) {
      completedTests++;
      console.log(`   [${completedTests}/${totalTests}] Testing with ${symbol}...`);

      const config: BacktestConfig = {
        strategyId: strategy.id,
        strategyName: strategy.name,
        symbols: [symbol],
        startDate: '2024-10-20T00:00:00Z',
        endDate: '2025-10-19T23:59:59Z',
        initialCapital: 10000,
        positionSizePct: 0.20
      };

      const result = await runBacktest(config);

      if (result.success && result.data?.id) {
        console.log(`  ✅ Backtest started (ID: ${result.data.id.substring(0, 8)}...)`);
        console.log(`  ⏳ Waiting for completion...`);

        const completed = await waitForCompletion(result.data.id, 120);

        if (completed) {
          const backtestData = await getBacktestResults(result.data.id);

          if (backtestData?.success) {
            const metrics = backtestData.data;
            console.log(`  ✅ Completed!`);
            console.log(`     📈 Return: ${(metrics.total_return_pct * 100).toFixed(2)}%`);
            console.log(`     📊 Win Rate: ${(metrics.win_rate * 100).toFixed(1)}%`);
            console.log(`     🎯 Sharpe: ${metrics.sharpe_ratio?.toFixed(2) || 'N/A'}`);
            console.log(`     💼 Trades: ${metrics.total_trades || 0}`);

            results.push({
              strategy: strategy.name,
              symbol,
              success: true,
              backtestId: result.data.id,
              metrics: {
                return: metrics.total_return_pct,
                winRate: metrics.win_rate,
                sharpe: metrics.sharpe_ratio,
                trades: metrics.total_trades
              }
            });
          } else {
            console.log(`  ⚠️  Completed but couldn't fetch results`);
            results.push({
              strategy: strategy.name,
              symbol,
              success: true,
              backtestId: result.data.id
            });
          }
        } else {
          console.log(`  ⚠️  Couldn't confirm completion`);
          results.push({
            strategy: strategy.name,
            symbol,
            success: false
          });
        }
      } else {
        console.log(`  ❌ Failed to start backtest`);
        results.push({
          strategy: strategy.name,
          symbol,
          success: false
        });
      }

      // Small delay between backtests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 BACKTEST RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Completed: ${successCount}/${totalTests} backtests\n`);

  // Group by strategy
  const byStrategy: Record<string, typeof results> = {};
  for (const result of results) {
    if (!byStrategy[result.strategy]) {
      byStrategy[result.strategy] = [];
    }
    byStrategy[result.strategy].push(result);
  }

  for (const [strategyName, strategyResults] of Object.entries(byStrategy)) {
    console.log(`\n📈 ${strategyName}:`);

    for (const result of strategyResults) {
      const status = result.success ? '✅' : '❌';
      const symbol = result.symbol.padEnd(6);

      if (result.metrics) {
        const returnPct = (result.metrics.return * 100).toFixed(2).padStart(7);
        const winRate = (result.metrics.winRate * 100).toFixed(1).padStart(5);
        const sharpe = result.metrics.sharpe?.toFixed(2).padStart(5) || '  N/A';
        const trades = String(result.metrics.trades || 0).padStart(3);

        console.log(`   ${status} ${symbol} | Return: ${returnPct}% | Win: ${winRate}% | Sharpe: ${sharpe} | Trades: ${trades}`);
      } else {
        console.log(`   ${status} ${symbol} | Status: ${result.success ? 'Completed' : 'Failed'}`);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 View detailed results in the Backtesting Dashboard');
  console.log('   http://localhost:5173 (or your frontend port)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✨ Backtesting with extended real data complete!\n');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
