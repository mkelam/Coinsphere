/**
 * Accuracy Calculation Scheduler
 *
 * Periodically evaluates completed predictions and calculates accuracy
 */

import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { predictionTrackingService } from './predictionTrackingService.js';

// Run every hour to check for predictions that need evaluation
const SCHEDULE_CRON = process.env.ACCURACY_CALC_SCHEDULE || '0 * * * *'; // Every hour at minute 0

let task: cron.ScheduledTask | null = null;

/**
 * Initialize the accuracy calculation scheduler
 */
export function initializeAccuracyScheduler(): void {
  logger.info('Initializing accuracy calculation scheduler', {
    schedule: SCHEDULE_CRON,
  });

  task = cron.schedule(
    SCHEDULE_CRON,
    async () => {
      logger.info('Scheduled accuracy calculation triggered');
      await runAccuracyCalculation();
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  logger.info('✅ Accuracy calculation scheduler started successfully', {
    nextRun: task.nextDate()?.toISOString(),
  });
}

/**
 * Stop the accuracy calculation scheduler
 */
export function stopAccuracyScheduler(): void {
  if (task) {
    task.stop();
    logger.info('Accuracy calculation scheduler stopped');
  }
}

/**
 * Execute accuracy calculation
 */
async function runAccuracyCalculation(): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info('Starting accuracy calculation...');

    await predictionTrackingService.calculatePredictionAccuracy();

    const duration = Date.now() - startTime;
    logger.info(`✅ Accuracy calculation completed`, {
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Accuracy calculation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });
  }
}

/**
 * Manually trigger accuracy calculation (for testing or admin API)
 */
export async function triggerManualAccuracyCalc(): Promise<void> {
  logger.info('Manual accuracy calculation triggered');
  await runAccuracyCalculation();
}
