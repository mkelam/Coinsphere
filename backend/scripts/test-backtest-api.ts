/**
 * Test Backtest Results API
 */

import { prisma } from '../src/lib/prisma.js';
import axios from 'axios';

async function main() {
  try {
    // Get latest backtest
    const latestBacktest = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM backtest_configs
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!latestBacktest || latestBacktest.length === 0) {
      console.log('No backtests found in database');
      return;
    }

    const backtestId = latestBacktest[0].id;
    console.log(`Testing API with backtest ID: ${backtestId}`);
    console.log();

    // Test the results endpoint
    const url = `http://localhost:3001/api/v1/backtesting/results/${backtestId}`;
    console.log(`GET ${url}`);
    console.log();

    const response = await axios.get(url);

    if (response.data.success) {
      console.log('✅ API SUCCESSFUL');
      console.log();
      console.log('Response structure:');
      console.log('- config:', Object.keys(response.data.data.config));
      console.log('- performance:', Object.keys(response.data.data.performance));
      console.log('- metrics:', Object.keys(response.data.data.metrics));
      console.log('- trades:', Object.keys(response.data.data.trades));
      console.log('- equity:', response.data.data.equity.length, 'data points');
      console.log();
      console.log('Key metrics:');
      console.log(`- Total Return: ${(response.data.data.performance.totalReturnPct * 100).toFixed(2)}%`);
      console.log(`- Sharpe Ratio: ${response.data.data.metrics.sharpeRatio?.toFixed(2) || 'N/A'}`);
      console.log(`- Sortino Ratio: ${response.data.data.metrics.sortinoRatio?.toFixed(2) || 'N/A'}`);
      console.log(`- Kelly Criterion: ${(response.data.data.metrics.kellyCriterion * 100).toFixed(1)}%`);
      console.log(`- Total Trades: ${response.data.data.trades.totalTrades}`);
      console.log(`- Win Rate: ${(response.data.data.trades.winRate * 100).toFixed(1)}%`);
      console.log(`- Expectancy: $${response.data.data.metrics.expectancy.toFixed(2)}`);
    } else {
      console.log('❌ API FAILED:', response.data.error);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

main();
