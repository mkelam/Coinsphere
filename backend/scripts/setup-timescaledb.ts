/**
 * TimescaleDB Hypertable Setup Script
 *
 * This script configures TimescaleDB hypertables for time-series data
 * Run this after Prisma migrations to enable hypertable functionality
 *
 * Usage:
 *   npx tsx scripts/setup-timescaledb.ts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function setupTimescaleDB() {
  try {
    logger.info('Starting TimescaleDB hypertable setup...');

    // 1. Create hypertable for price_data (if table exists and is not already a hypertable)
    logger.info('Setting up price_data hypertable...');

    try {
      await prisma.$executeRaw`
        SELECT create_hypertable(
          'price_data',
          'timestamp',
          if_not_exists => TRUE,
          migrate_data => TRUE
        );
      `;
      logger.info('✅ price_data hypertable created');
    } catch (error: any) {
      if (error.message?.includes('already a hypertable')) {
        logger.info('ℹ️  price_data is already a hypertable');
      } else {
        throw error;
      }
    }

    // 2. Add compression policy (compress data older than 7 days)
    logger.info('Setting up compression policy for price_data...');

    try {
      await prisma.$executeRaw`
        SELECT add_compression_policy(
          'price_data',
          INTERVAL '7 days',
          if_not_exists => TRUE
        );
      `;
      logger.info('✅ Compression policy added (data older than 7 days will be compressed)');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info('ℹ️  Compression policy already exists');
      } else {
        throw error;
      }
    }

    // 3. Add retention policy (delete data older than 1 year)
    logger.info('Setting up retention policy for price_data...');

    try {
      await prisma.$executeRaw`
        SELECT add_retention_policy(
          'price_data',
          INTERVAL '1 year',
          if_not_exists => TRUE
        );
      `;
      logger.info('✅ Retention policy added (data older than 1 year will be deleted)');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info('ℹ️  Retention policy already exists');
      } else {
        throw error;
      }
    }

    // 4. Create continuous aggregate for hourly price data (performance optimization)
    logger.info('Creating continuous aggregate for hourly price data...');

    try {
      await prisma.$executeRaw`
        CREATE MATERIALIZED VIEW IF NOT EXISTS price_data_hourly
        WITH (timescaledb.continuous) AS
        SELECT
          token_id,
          time_bucket('1 hour', timestamp) AS hour,
          first(open, timestamp) AS open,
          max(high) AS high,
          min(low) AS low,
          last(close, timestamp) AS close,
          sum(volume) AS volume,
          count(*) AS data_points
        FROM price_data
        GROUP BY token_id, hour
        WITH NO DATA;
      `;
      logger.info('✅ Continuous aggregate view created');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info('ℹ️  Continuous aggregate already exists');
      } else {
        throw error;
      }
    }

    // 5. Add refresh policy for continuous aggregate
    logger.info('Setting up refresh policy for continuous aggregate...');

    try {
      await prisma.$executeRaw`
        SELECT add_continuous_aggregate_policy(
          'price_data_hourly',
          start_offset => INTERVAL '3 days',
          end_offset => INTERVAL '1 hour',
          schedule_interval => INTERVAL '1 hour',
          if_not_exists => TRUE
        );
      `;
      logger.info('✅ Continuous aggregate refresh policy added');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info('ℹ️  Refresh policy already exists');
      } else {
        throw error;
      }
    }

    // 6. Create indexes for common queries
    logger.info('Creating performance indexes...');

    try {
      // Index on token_id for filtering by specific tokens
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_price_data_token_id_timestamp
        ON price_data (token_id, timestamp DESC);
      `;

      // Index for recent price queries
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_price_data_timestamp_desc
        ON price_data (timestamp DESC);
      `;

      logger.info('✅ Performance indexes created');
    } catch (error: any) {
      logger.warn('Index creation warning:', error.message);
    }

    // 7. Verify TimescaleDB version and configuration
    logger.info('\nVerifying TimescaleDB configuration...');

    const version = await prisma.$queryRaw<[{ version: string }]>`
      SELECT extversion AS version
      FROM pg_extension
      WHERE extname = 'timescaledb';
    `;

    if (version.length > 0) {
      logger.info(`✅ TimescaleDB version: ${version[0].version}`);
    }

    // Check hypertable info
    const hypertableInfo = await prisma.$queryRaw<any[]>`
      SELECT hypertable_name, num_chunks, compression_enabled
      FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'price_data';
    `;

    if (hypertableInfo.length > 0) {
      const info = hypertableInfo[0];
      logger.info(`\nHypertable Status:`);
      logger.info(`  Name: ${info.hypertable_name}`);
      logger.info(`  Chunks: ${info.num_chunks}`);
      logger.info(`  Compression Enabled: ${info.compression_enabled}`);
    }

    logger.info('\n🎉 TimescaleDB setup completed successfully!\n');
    logger.info('Performance Optimizations Applied:');
    logger.info('  ✅ Hypertable partitioning by timestamp');
    logger.info('  ✅ Compression for data older than 7 days');
    logger.info('  ✅ Retention policy (1 year)');
    logger.info('  ✅ Continuous aggregates for hourly data');
    logger.info('  ✅ Optimized indexes for common queries');

  } catch (error) {
    logger.error('Error setting up TimescaleDB:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupTimescaleDB()
  .then(() => {
    logger.info('TimescaleDB setup script finished');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('TimescaleDB setup failed:', error);
    process.exit(1);
  });
