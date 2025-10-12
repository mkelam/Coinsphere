/**
 * MCP Performance Metrics Service
 * Tracks uptime, latency, reconnections, and performance metrics for LunarCrush MCP
 */

import { logger } from '../utils/logger.js';
import { getRedisClient } from '../lib/redis.js';

interface MetricDataPoint {
  timestamp: number;
  value: number;
}

interface ConnectionEvent {
  timestamp: number;
  event: 'connected' | 'disconnected' | 'reconnect_attempt' | 'reconnect_success' | 'reconnect_failed';
  details?: string;
}

interface PerformanceMetrics {
  uptime: {
    totalSeconds: number;
    percentage: number;
    lastConnected: number | null;
    lastDisconnected: number | null;
  };
  latency: {
    current: number;
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  reconnections: {
    total: number;
    successful: number;
    failed: number;
    lastAttempt: number | null;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    mcpCount: number;
    restCount: number;
  };
  history: {
    latency: MetricDataPoint[];
    connections: ConnectionEvent[];
  };
}

class McpMetricsService {
  private metrics: PerformanceMetrics;
  private serviceStartTime: number;
  private connectionStartTime: number | null = null;
  private totalUptime: number = 0;
  private isCurrentlyConnected: boolean = false;

  constructor() {
    this.serviceStartTime = Date.now();
    this.metrics = {
      uptime: {
        totalSeconds: 0,
        percentage: 0,
        lastConnected: null,
        lastDisconnected: null,
      },
      latency: {
        current: 0,
        average: 0,
        min: Infinity,
        max: 0,
        samples: 0,
      },
      reconnections: {
        total: 0,
        successful: 0,
        failed: 0,
        lastAttempt: null,
      },
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        mcpCount: 0,
        restCount: 0,
      },
      history: {
        latency: [],
        connections: [],
      },
    };

    // Load persisted metrics from Redis
    this.loadMetrics();

    // Periodically persist metrics to Redis
    setInterval(() => {
      this.persistMetrics();
    }, 60000); // Every minute
  }

  /**
   * Load metrics from Redis
   */
  private async loadMetrics(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const cached = await redisClient.get('mcp:metrics');
      if (cached) {
        const loaded = JSON.parse(cached);
        // Merge with current metrics (preserve in-memory state)
        this.metrics = {
          ...loaded,
          history: {
            latency: loaded.history?.latency || [],
            connections: loaded.history?.connections || [],
          },
        };
        logger.debug('Loaded MCP metrics from Redis');
      }
    } catch (error) {
      logger.debug('Redis unavailable, starting with fresh metrics');
    }
  }

  /**
   * Persist metrics to Redis
   */
  private async persistMetrics(): Promise<void> {
    try {
      const redisClient = getRedisClient();

      // Calculate current uptime before persisting
      this.calculateUptime();

      await redisClient.setex('mcp:metrics', 86400, JSON.stringify(this.metrics)); // 24h TTL
      logger.debug('Persisted MCP metrics to Redis');
    } catch (error) {
      logger.debug('Redis unavailable, skipping metrics persistence');
    }
  }

  /**
   * Calculate current uptime
   */
  private calculateUptime(): void {
    const totalElapsed = (Date.now() - this.serviceStartTime) / 1000;

    // If currently connected, add time since last connection
    if (this.isCurrentlyConnected && this.connectionStartTime) {
      const currentSessionUptime = (Date.now() - this.connectionStartTime) / 1000;
      this.metrics.uptime.totalSeconds = this.totalUptime + currentSessionUptime;
    } else {
      this.metrics.uptime.totalSeconds = this.totalUptime;
    }

    // Calculate uptime percentage
    this.metrics.uptime.percentage = (this.metrics.uptime.totalSeconds / totalElapsed) * 100;
  }

  /**
   * Record connection event
   */
  recordConnection(): void {
    const now = Date.now();
    this.connectionStartTime = now;
    this.isCurrentlyConnected = true;
    this.metrics.uptime.lastConnected = now;

    // Add to connection history
    this.metrics.history.connections.push({
      timestamp: now,
      event: 'connected',
    });

    // Keep only last 100 connection events
    if (this.metrics.history.connections.length > 100) {
      this.metrics.history.connections = this.metrics.history.connections.slice(-100);
    }

    logger.info('MCP connection recorded in metrics');
  }

  /**
   * Record disconnection event
   */
  recordDisconnection(): void {
    const now = Date.now();

    // Add uptime from this session
    if (this.connectionStartTime && this.isCurrentlyConnected) {
      const sessionUptime = (now - this.connectionStartTime) / 1000;
      this.totalUptime += sessionUptime;
    }

    this.connectionStartTime = null;
    this.isCurrentlyConnected = false;
    this.metrics.uptime.lastDisconnected = now;

    // Add to connection history
    this.metrics.history.connections.push({
      timestamp: now,
      event: 'disconnected',
    });

    // Keep only last 100 connection events
    if (this.metrics.history.connections.length > 100) {
      this.metrics.history.connections = this.metrics.history.connections.slice(-100);
    }

    logger.info('MCP disconnection recorded in metrics');
  }

  /**
   * Record reconnection attempt
   */
  recordReconnectionAttempt(attempt: number, maxAttempts: number): void {
    this.metrics.reconnections.total++;
    this.metrics.reconnections.lastAttempt = Date.now();

    this.metrics.history.connections.push({
      timestamp: Date.now(),
      event: 'reconnect_attempt',
      details: `Attempt ${attempt}/${maxAttempts}`,
    });

    // Keep only last 100 connection events
    if (this.metrics.history.connections.length > 100) {
      this.metrics.history.connections = this.metrics.history.connections.slice(-100);
    }

    logger.debug(`MCP reconnection attempt ${attempt}/${maxAttempts} recorded`);
  }

  /**
   * Record successful reconnection
   */
  recordReconnectionSuccess(): void {
    this.metrics.reconnections.successful++;

    this.metrics.history.connections.push({
      timestamp: Date.now(),
      event: 'reconnect_success',
    });

    // Keep only last 100 connection events
    if (this.metrics.history.connections.length > 100) {
      this.metrics.history.connections = this.metrics.history.connections.slice(-100);
    }

    logger.info('MCP reconnection success recorded');
  }

  /**
   * Record failed reconnection
   */
  recordReconnectionFailure(): void {
    this.metrics.reconnections.failed++;

    this.metrics.history.connections.push({
      timestamp: Date.now(),
      event: 'reconnect_failed',
    });

    // Keep only last 100 connection events
    if (this.metrics.history.connections.length > 100) {
      this.metrics.history.connections = this.metrics.history.connections.slice(-100);
    }

    logger.warn('MCP reconnection failure recorded');
  }

  /**
   * Record API request latency
   */
  recordLatency(latencyMs: number): void {
    this.metrics.latency.current = latencyMs;
    this.metrics.latency.min = Math.min(this.metrics.latency.min, latencyMs);
    this.metrics.latency.max = Math.max(this.metrics.latency.max, latencyMs);

    // Update rolling average
    const totalLatency = this.metrics.latency.average * this.metrics.latency.samples;
    this.metrics.latency.samples++;
    this.metrics.latency.average = (totalLatency + latencyMs) / this.metrics.latency.samples;

    // Add to latency history
    this.metrics.history.latency.push({
      timestamp: Date.now(),
      value: latencyMs,
    });

    // Keep only last 100 latency samples
    if (this.metrics.history.latency.length > 100) {
      this.metrics.history.latency = this.metrics.history.latency.slice(-100);
    }
  }

  /**
   * Record API request (MCP or REST)
   */
  recordRequest(mode: 'mcp' | 'rest', success: boolean): void {
    this.metrics.requests.total++;

    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    if (mode === 'mcp') {
      this.metrics.requests.mcpCount++;
    } else {
      this.metrics.requests.restCount++;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    // Calculate current uptime before returning
    this.calculateUptime();

    return {
      ...this.metrics,
      // Return only last 50 points for efficiency
      history: {
        latency: this.metrics.history.latency.slice(-50),
        connections: this.metrics.history.connections.slice(-50),
      },
    };
  }

  /**
   * Reset metrics
   */
  async resetMetrics(): Promise<void> {
    this.serviceStartTime = Date.now();
    this.connectionStartTime = null;
    this.totalUptime = 0;
    this.isCurrentlyConnected = false;

    this.metrics = {
      uptime: {
        totalSeconds: 0,
        percentage: 0,
        lastConnected: null,
        lastDisconnected: null,
      },
      latency: {
        current: 0,
        average: 0,
        min: Infinity,
        max: 0,
        samples: 0,
      },
      reconnections: {
        total: 0,
        successful: 0,
        failed: 0,
        lastAttempt: null,
      },
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        mcpCount: 0,
        restCount: 0,
      },
      history: {
        latency: [],
        connections: [],
      },
    };

    // Clear from Redis
    try {
      const redisClient = getRedisClient();
      await redisClient.del('mcp:metrics');
      logger.info('MCP metrics reset');
    } catch (error) {
      logger.debug('Redis unavailable, metrics reset in memory only');
    }
  }
}

// Export singleton instance
export const mcpMetricsService = new McpMetricsService();
