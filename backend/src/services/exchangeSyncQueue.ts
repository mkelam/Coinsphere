import Bull from 'bull';
import { PrismaClient } from '@prisma/client';
import { ExchangeService } from './exchangeService';
import { logger } from '../utils/logger';
import { redis } from '../lib/redis';

const prisma = new PrismaClient();

/**
 * Exchange Sync Queue
 * Handles automatic syncing of exchange connections using Bull queues
 */

// Create queue for exchange syncing
export const exchangeSyncQueue = new Bull('exchange-sync', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Start with 5 second delay
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

/**
 * Job data interface
 */
interface SyncJob {
  connectionId: string;
  userId: string;
}

/**
 * Process sync jobs
 */
exchangeSyncQueue.process(async (job: Bull.Job<SyncJob>) => {
  const { connectionId, userId } = job.data;

  logger.info(`Processing exchange sync for connection ${connectionId}`, {
    userId,
    connectionId,
    attemptNumber: job.attemptsMade + 1,
  });

  try {
    await ExchangeService.syncExchangeHoldings(connectionId);

    logger.info(`Exchange sync completed for connection ${connectionId}`, {
      userId,
      connectionId,
    });

    return { success: true, connectionId };
  } catch (error: any) {
    logger.error(`Exchange sync failed for connection ${connectionId}`, {
      userId,
      connectionId,
      error: error.message,
      attemptNumber: job.attemptsMade + 1,
    });

    throw error; // Throw to trigger retry mechanism
  }
});

/**
 * Event listeners
 */
exchangeSyncQueue.on('completed', (job, result) => {
  logger.debug(`Sync job ${job.id} completed`, { result });
});

exchangeSyncQueue.on('failed', (job, error) => {
  logger.error(`Sync job ${job.id} failed`, {
    error: error.message,
    attemptsMade: job.attemptsMade,
    data: job.data,
  });
});

exchangeSyncQueue.on('stalled', (job) => {
  logger.warn(`Sync job ${job.id} stalled`, { data: job.data });
});

/**
 * Schedule sync for a connection
 */
export async function scheduleSyncJob(
  connectionId: string,
  userId: string,
  intervalSeconds: number = 300
): Promise<void> {
  // Remove any existing jobs for this connection
  await removeScheduledSync(connectionId);

  // Add recurring job
  await exchangeSyncQueue.add(
    { connectionId, userId },
    {
      repeat: {
        every: intervalSeconds * 1000, // Convert to milliseconds
      },
      jobId: `sync-${connectionId}`, // Unique ID for this connection's sync job
    }
  );

  logger.info(`Scheduled recurring sync for connection ${connectionId}`, {
    intervalSeconds,
    userId,
  });
}

/**
 * Remove scheduled sync for a connection
 */
export async function removeScheduledSync(connectionId: string): Promise<void> {
  const jobId = `sync-${connectionId}`;

  // Find and remove the repeatable job
  const repeatableJobs = await exchangeSyncQueue.getRepeatableJobs();
  const job = repeatableJobs.find((j) => j.id === jobId);

  if (job) {
    await exchangeSyncQueue.removeRepeatableByKey(job.key);
    logger.info(`Removed scheduled sync for connection ${connectionId}`);
  }
}

/**
 * Trigger immediate sync (non-recurring)
 */
export async function triggerImmediateSync(
  connectionId: string,
  userId: string
): Promise<Bull.Job<SyncJob>> {
  return exchangeSyncQueue.add(
    { connectionId, userId },
    {
      priority: 1, // High priority for manual syncs
    }
  );
}

/**
 * Initialize sync jobs for all active connections
 * Called on server startup
 */
export async function initializeExchangeSyncJobs(): Promise<void> {
  try {
    logger.info('Initializing exchange sync jobs...');

    const activeConnections = await prisma.exchangeConnection.findMany({
      where: {
        status: 'active',
        autoSync: true,
      },
      select: {
        id: true,
        userId: true,
        syncInterval: true,
      },
    });

    logger.info(`Found ${activeConnections.length} active connections to sync`);

    for (const connection of activeConnections) {
      await scheduleSyncJob(
        connection.id,
        connection.userId,
        connection.syncInterval
      );
    }

    logger.info('Exchange sync jobs initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize exchange sync jobs', { error });
  }
}

/**
 * Cleanup - stop all jobs
 */
export async function stopExchangeSyncQueue(): Promise<void> {
  logger.info('Stopping exchange sync queue...');
  await exchangeSyncQueue.close();
  logger.info('Exchange sync queue stopped');
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    exchangeSyncQueue.getWaitingCount(),
    exchangeSyncQueue.getActiveCount(),
    exchangeSyncQueue.getCompletedCount(),
    exchangeSyncQueue.getFailedCount(),
    exchangeSyncQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}
