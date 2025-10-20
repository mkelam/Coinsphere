/**
 * Price Update Scheduler
 *
 * Automatically updates cryptocurrency price data on a daily schedule
 * Runs the populate-historical-data script to fetch latest prices from CoinGecko
 */

import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Schedule configuration
 * Default: Run daily at 2:00 AM
 */
const SCHEDULE_CRON = process.env.PRICE_UPDATE_SCHEDULE || '0 2 * * *';
const ENABLE_PRICE_SCHEDULER = process.env.ENABLE_PRICE_SCHEDULER !== 'false';

/**
 * Run the price population script
 */
async function runPriceUpdate(): Promise<void> {
  logger.info('Starting automated price data update...');

  const startTime = Date.now();

  try {
    // Run the populate script
    const { stdout, stderr } = await execAsync('npm run populate:prices', {
      cwd: process.cwd(),
      timeout: 600000, // 10 minute timeout
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.info('Price data update completed successfully', {
      duration: `${duration}s`,
      output: stdout.substring(0, 500), // Log first 500 chars
    });

    if (stderr && !stderr.includes('WARNING')) {
      logger.warn('Price update had warnings:', { stderr });
    }

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.error('Price data update failed', {
      duration: `${duration}s`,
      error: error.message,
      stdout: error.stdout?.substring(0, 500),
      stderr: error.stderr?.substring(0, 500),
    });

    // Don't throw - we don't want to crash the server
    // The next scheduled run will try again
  }
}

/**
 * Initialize the price update scheduler
 */
export function initializePriceScheduler(): void {
  if (!ENABLE_PRICE_SCHEDULER) {
    logger.info('Price update scheduler is disabled');
    return;
  }

  logger.info('Initializing price update scheduler', {
    schedule: SCHEDULE_CRON,
    enabled: ENABLE_PRICE_SCHEDULER,
  });

  // Schedule the cron job
  const task = cron.schedule(SCHEDULE_CRON, async () => {
    logger.info('Scheduled price update triggered');
    await runPriceUpdate();
  }, {
    scheduled: true,
    timezone: 'UTC', // Run in UTC to avoid timezone issues
  });

  logger.info('✅ Price update scheduler started successfully', {
    schedule: SCHEDULE_CRON,
  });
}

/**
 * Stop the price update scheduler
 */
export function stopPriceScheduler(): void {
  logger.info('Price update scheduler stopped');
  // Cron tasks are automatically stopped when the process exits
}

/**
 * Manually trigger a price update (for testing or manual refresh)
 */
export async function triggerManualUpdate(): Promise<void> {
  logger.info('Manual price update triggered');
  await runPriceUpdate();
}
