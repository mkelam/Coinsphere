/**
 * Alert Evaluation Cron Job
 * Sprint 5: Alerts & Notifications
 *
 * Runs every 5 minutes to evaluate all active alerts
 * Sends notifications when alert conditions are met
 */

import cron from 'node-cron';
import { alertEvaluationService } from '../services/alertEvaluationService';
import logger from '../utils/logger';

// Run every 5 minutes
const CRON_SCHEDULE = '*/5 * * * *';

let isRunning = false;

/**
 * Alert evaluation cron job
 * Runs every 5 minutes to check all active alerts
 */
export const alertEvaluationCron = cron.schedule(
  CRON_SCHEDULE,
  async () => {
    // Prevent concurrent runs
    if (isRunning) {
      logger.warn('Alert evaluation already running, skipping this cycle');
      return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting alert evaluation cron job');

      const result = await alertEvaluationService.evaluateAllAlerts();

      const duration = Date.now() - startTime;

      logger.info('Alert evaluation cron job completed', {
        evaluated: result.evaluated,
        triggered: result.triggered,
        errors: result.errors,
        duration: `${duration}ms`,
      });
    } catch (error) {
      logger.error('Alert evaluation cron job failed:', error);
    } finally {
      isRunning = false;
    }
  },
  {
    timezone: 'UTC',
  } as any // Type workaround for node-cron
);

/**
 * Start the alert evaluation cron job
 */
export function startAlertEvaluationCron() {
  alertEvaluationCron.start();
  logger.info(`Alert evaluation cron job started (schedule: ${CRON_SCHEDULE})`);
}

/**
 * Stop the alert evaluation cron job
 */
export function stopAlertEvaluationCron() {
  alertEvaluationCron.stop();
  logger.info('Alert evaluation cron job stopped');
}

/**
 * Get cron job status
 */
export function getAlertEvaluationCronStatus() {
  return {
    running: isRunning,
    schedule: CRON_SCHEDULE,
  };
}
