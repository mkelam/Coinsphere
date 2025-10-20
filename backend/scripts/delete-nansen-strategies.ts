import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteNansenStrategies() {
  try {
    console.log('🗑️  Deleting Nansen strategies with invalid IDs...\n');

    const result = await prisma.$executeRaw`
      DELETE FROM trading_strategies
      WHERE id LIKE 'nansen-%'
    `;

    console.log(`✅ Deleted ${result} Nansen strategies\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteNansenStrategies();
