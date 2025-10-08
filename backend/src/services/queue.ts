import Queue from 'bull';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { emailService } from './emailService.js';
import { priceUpdaterService } from './priceUpdater.js';

// Queue configurations
const queueOptions = {
  redis: {
    host: config.redis.url.includes('://')
      ? new URL(config.redis.url).hostname
      : config.redis.url.split(':')[0],
    port: config.redis.url.includes('://')
      ? parseInt(new URL(config.redis.url).port || '6379')
      : parseInt(config.redis.url.split(':')[1] || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
};

// Email queue for async email sending
export const emailQueue = new Queue('email', queueOptions);

// Price update queue for token price updates
export const priceUpdateQueue = new Queue('price-update', queueOptions);

// Notification queue for user alerts
export const notificationQueue = new Queue('notification', queueOptions);

// Email queue processor
emailQueue.process(async (job) => {
  const { type, data } = job.data;

  logger.info(`Processing email job: ${type}`, { jobId: job.id });

  try {
    switch (type) {
      case 'verification':
        await emailService.sendVerificationEmail(data.email, data.token);
        break;

      case 'password-reset':
        await emailService.sendPasswordResetEmail(data.email, data.token);
        break;

      case 'welcome':
        await emailService.sendWelcomeEmail(data.email, data.firstName);
        break;

      case 'price-alert':
        await emailService.sendPriceAlert(data.email, data.alertData);
        break;

      case 'prediction-alert':
        await emailService.sendPredictionAlert(data.email, data.predictionData);
        break;

      case 'risk-alert':
        await emailService.sendRiskAlert(data.email, data.riskData);
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    logger.info(`Email job completed: ${type}`, { jobId: job.id });
  } catch (error) {
    logger.error(`Email job failed: ${type}`, { jobId: job.id, error });
    throw error; // Will trigger retry
  }
});

// Price update queue processor
priceUpdateQueue.process(async (job) => {
  const { type, tokenId } = job.data;

  logger.info(`Processing price update job: ${type}`, { jobId: job.id });

  try {
    if (type === 'single') {
      await priceUpdaterService.updateTokenPrice(tokenId);
    } else if (type === 'all') {
      await priceUpdaterService.updateAllTokenPrices();
    }

    logger.info(`Price update job completed: ${type}`, { jobId: job.id });
  } catch (error) {
    logger.error(`Price update job failed: ${type}`, { jobId: job.id, error });
    throw error;
  }
});

// Notification queue processor
notificationQueue.process(async (job) => {
  const { type, userId, data } = job.data;

  logger.info(`Processing notification job: ${type}`, { jobId: job.id, userId });

  // Placeholder for future notification logic (WebSocket, push notifications, etc.)
  try {
    // TODO: Implement notification delivery logic
    logger.info(`Notification job completed: ${type}`, { jobId: job.id });
  } catch (error) {
    logger.error(`Notification job failed: ${type}`, { jobId: job.id, error });
    throw error;
  }
});

// Queue event handlers
const setupQueueEvents = (queue: Queue.Queue, name: string) => {
  queue.on('completed', (job) => {
    logger.debug(`${name} job completed`, { jobId: job.id });
  });

  queue.on('failed', (job, err) => {
    logger.error(`${name} job failed`, {
      jobId: job.id,
      error: err.message,
      attempts: job.attemptsMade,
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`${name} job stalled`, { jobId: job.id });
  });

  queue.on('error', (error) => {
    logger.error(`${name} queue error`, { error });
  });
};

setupQueueEvents(emailQueue, 'Email');
setupQueueEvents(priceUpdateQueue, 'Price Update');
setupQueueEvents(notificationQueue, 'Notification');

// Helper functions to add jobs to queues
export const queueEmail = async (type: string, data: any, options?: Queue.JobOptions) => {
  return emailQueue.add({ type, data }, options);
};

export const queuePriceUpdate = async (type: 'single' | 'all', tokenId?: string, options?: Queue.JobOptions) => {
  return priceUpdateQueue.add({ type, tokenId }, options);
};

export const queueNotification = async (type: string, userId: string, data: any, options?: Queue.JobOptions) => {
  return notificationQueue.add({ type, userId, data }, options);
};

// Graceful shutdown
export const closeQueues = async () => {
  logger.info('Closing Bull queues...');
  await Promise.all([
    emailQueue.close(),
    priceUpdateQueue.close(),
    notificationQueue.close(),
  ]);
  logger.info('Bull queues closed');
};

// Clean up old jobs periodically
export const cleanupOldJobs = async () => {
  const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

  await Promise.all([
    emailQueue.clean(gracePeriod, 'completed'),
    emailQueue.clean(gracePeriod, 'failed'),
    priceUpdateQueue.clean(gracePeriod, 'completed'),
    priceUpdateQueue.clean(gracePeriod, 'failed'),
    notificationQueue.clean(gracePeriod, 'completed'),
    notificationQueue.clean(gracePeriod, 'failed'),
  ]);

  logger.info('Old jobs cleaned up');
};

logger.info('Bull queues initialized');
