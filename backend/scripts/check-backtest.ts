import { prisma } from '../src/lib/prisma.js';

async function main() {
  try {
    const id = 'd85f61ba-a856-4eba-8c73-3aa925725c9c';

    console.log(`Checking for backtest ID: ${id}`);

    const result = await prisma.$queryRaw<Array<any>>`
      SELECT id, name, status, total_return_pct, sharpe_ratio, created_at
      FROM backtest_configs
      WHERE id = ${id}::uuid
    `;

    console.log('\nBacktest config found:', result.length > 0 ? 'YES' : 'NO');

    if (result.length > 0) {
      console.log('\nBacktest details:');
      console.log(JSON.stringify(result[0], null, 2));

      // Check trades
      const trades = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM backtest_trades
        WHERE backtest_id = ${id}::uuid
      `;

      console.log(`\nTrades count: ${trades[0].count}`);

      // Check metrics
      const metrics = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM backtest_metrics
        WHERE backtest_id = ${id}::uuid
      `;

      console.log(`Metrics count: ${metrics[0].count}`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
