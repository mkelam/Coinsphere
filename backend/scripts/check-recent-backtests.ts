import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentBacktests() {
  console.log('📊 Checking recent backtests for Nansen strategies...\n');

  const backtests = await prisma.backtestConfig.findMany({
    where: {
      trading_strategies: {
        name: {
          in: ['Token Unlock Front-Running', 'Fresh Wallet Accumulation']
        }
      }
    },
    include: {
      trading_strategies: {
        select: { name: true, totalScore: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log(`Total backtests found: ${backtests.length}\n`);

  // Group by strategy
  const byStrategy = backtests.reduce((acc, bt) => {
    const strategyName = bt.trading_strategies?.name || 'Unknown';
    if (!acc[strategyName]) {
      acc[strategyName] = [];
    }
    acc[strategyName].push(bt);
    return acc;
  }, {} as Record<string, typeof backtests>);

  for (const [strategyName, tests] of Object.entries(byStrategy)) {
    console.log(`\n━━━ ${strategyName} (${tests.length} backtests) ━━━`);

    for (const test of tests) {
      const symbols = test.symbols as string[] | undefined;
      const symbolsStr = symbols && Array.isArray(symbols) ? symbols.join(', ') : 'N/A';
      console.log(`  • ${test.id.substring(0, 8)}... | ${symbolsStr} | ${test.status} | ${test.createdAt?.toISOString() || 'N/A'}`);
    }
  }

  // Check total count
  const totalCount = await prisma.backtestConfig.count();
  console.log(`\n📈 Total backtests in database: ${totalCount}`);
}

checkRecentBacktests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
