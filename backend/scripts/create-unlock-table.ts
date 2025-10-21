/**
 * Create TokenUnlockSchedule table directly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating token_unlock_schedules table...\n');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS token_unlock_schedules (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        token_id TEXT NOT NULL,
        unlock_date TIMESTAMP(3) NOT NULL,
        unlock_amount DECIMAL(24,8) NOT NULL,
        percent_of_supply DECIMAL(5,2) NOT NULL,
        circulating_supply DECIMAL(24,8) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        source VARCHAR(100) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Table token_unlock_schedules created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_token_unlock_schedule_token
      ON token_unlock_schedules(token_id);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_token_unlock_schedule_date
      ON token_unlock_schedules(unlock_date);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_token_unlock_schedule_percent
      ON token_unlock_schedules(percent_of_supply);
    `);

    console.log('✅ Indexes created');
    console.log('\n✨ Token unlock schedule table is ready!\n');

  } catch (error: any) {
    if (error.code === '42P07') {
      console.log('✅ Table already exists');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
