/**
 * Alert Evaluation Service
 * Sprint 5: Alerts & Notifications
 *
 * Evaluates active alerts against current prices/risk scores
 * Triggers notifications when alert conditions are met
 * Runs as background job via Bull queue
 */

import { prisma } from '../lib/prisma';
import { sendAlertEmail } from './emailService';
import logger from '../utils/logger';
import Decimal from 'decimal.js';

export interface AlertEvaluationResult {
  alertId: string;
  triggered: boolean;
  currentValue: number;
  threshold: number;
  message?: string;
}

class AlertEvaluationService {
  /**
   * Evaluate all active alerts for all users
   * Called by cron job every 5 minutes
   */
  async evaluateAllAlerts(): Promise<{ evaluated: number; triggered: number; errors: number }> {
    const startTime = Date.now();
    let evaluated = 0;
    let triggered = 0;
    let errors = 0;

    try {
      // Fetch all active alerts
      const alerts = await prisma.alert.findMany({
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Evaluating ${alerts.length} active alerts`);

      for (const alert of alerts) {
        try {
          evaluated++;
          const result = await this.evaluateAlert(alert.id);

          if (result.triggered) {
            triggered++;

            // Send notification
            await this.sendAlertNotification(alert, result);

            // Update last triggered time and counter
            await prisma.alert.update({
              where: { id: alert.id },
              data: {
                lastTriggered: new Date(),
                triggerCount: { increment: 1 },
              },
            });

            logger.info(`Alert triggered`, {
              alertId: alert.id,
              userId: alert.userId,
              type: alert.alertType,
              symbol: alert.tokenSymbol,
              condition: alert.condition,
              threshold: result.threshold,
              currentValue: result.currentValue,
            });
          }
        } catch (error) {
          errors++;
          logger.error(`Error evaluating alert ${alert.id}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Alert evaluation completed`, { evaluated, triggered, errors, duration });

      return { evaluated, triggered, errors };
    } catch (error) {
      logger.error('Error in evaluateAllAlerts:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single alert
   */
  async evaluateAlert(alertId: string): Promise<AlertEvaluationResult> {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert || !alert.isActive) {
      return {
        alertId,
        triggered: false,
        currentValue: 0,
        threshold: 0,
        message: 'Alert not found or inactive',
      };
    }

    // Get current value based on alert type
    let currentValue: Decimal;

    switch (alert.alertType) {
      case 'price':
        currentValue = await this.getCurrentPrice(alert.tokenSymbol);
        break;

      case 'risk':
        currentValue = new Decimal(await this.getCurrentRiskScore(alert.tokenSymbol));
        break;

      case 'prediction':
        currentValue = await this.getCurrentPrediction(alert.tokenSymbol);
        break;

      default:
        throw new Error(`Unknown alert type: ${alert.alertType}`);
    }

    // Evaluate condition
    const threshold = alert.threshold;
    const triggered = this.evaluateCondition(currentValue, alert.condition, threshold);

    return {
      alertId,
      triggered,
      currentValue: currentValue.toNumber(),
      threshold: threshold.toNumber(),
      message: triggered
        ? `${alert.tokenSymbol} ${alert.alertType} ${alert.condition} ${threshold}`
        : undefined,
    };
  }

  /**
   * Get current price for a token
   */
  private async getCurrentPrice(symbol: string): Promise<Decimal> {
    const token = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { currentPrice: true },
    });

    if (!token || !token.currentPrice) {
      throw new Error(`Price not available for ${symbol}`);
    }

    return token.currentPrice;
  }

  /**
   * Get current risk score for a token
   */
  private async getCurrentRiskScore(symbol: string): Promise<number> {
    const token = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { id: true },
    });

    if (!token) {
      throw new Error(`Token not found: ${symbol}`);
    }

    // Get most recent risk score
    const riskScore = await prisma.riskScore.findFirst({
      where: { tokenId: token.id },
      orderBy: { createdAt: 'desc' },
      select: { overallScore: true },
    });

    if (!riskScore) {
      throw new Error(`Risk score not available for ${symbol}`);
    }

    return riskScore.overallScore;
  }

  /**
   * Get current prediction for a token
   */
  private async getCurrentPrediction(symbol: string): Promise<Decimal> {
    const token = await prisma.token.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { id: true },
    });

    if (!token) {
      throw new Error(`Token not found: ${symbol}`);
    }

    // Get most recent prediction
    const prediction = await prisma.prediction.findFirst({
      where: { tokenId: token.id },
      orderBy: { createdAt: 'desc' },
      select: { predictedPrice: true },
    });

    if (!prediction) {
      throw new Error(`Prediction not available for ${symbol}`);
    }

    return prediction.predictedPrice;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(currentValue: Decimal, condition: string, threshold: Decimal): boolean {
    switch (condition.toLowerCase()) {
      case 'above':
      case '>':
      case 'greater_than':
        return currentValue.greaterThan(threshold);

      case 'below':
      case '<':
      case 'less_than':
        return currentValue.lessThan(threshold);

      case 'equals':
      case '=':
      case '==':
        // For equals, use a small tolerance (0.1% difference)
        const tolerance = threshold.times(0.001);
        return currentValue.minus(threshold).abs().lessThanOrEqualTo(tolerance);

      case 'above_or_equal':
      case '>=':
        return currentValue.greaterThanOrEqualTo(threshold);

      case 'below_or_equal':
      case '<=':
        return currentValue.lessThanOrEqualTo(threshold);

      default:
        throw new Error(`Unknown condition: ${condition}`);
    }
  }

  /**
   * Send alert notification to user
   */
  private async sendAlertNotification(alert: any, result: AlertEvaluationResult): Promise<void> {
    try {
      // Email notification
      await sendAlertEmail({
        to: alert.user.email,
        name: alert.user.firstName || alert.user.email,
        alertType: alert.alertType,
        tokenSymbol: alert.tokenSymbol,
        condition: alert.condition,
        threshold: result.threshold,
        currentValue: result.currentValue,
      });

      // Could add push notifications here
      // await sendPushNotification(...)

      logger.info(`Alert notification sent`, {
        alertId: alert.id,
        userId: alert.userId,
        email: alert.user.email,
      });
    } catch (error) {
      logger.error(`Failed to send alert notification`, {
        alertId: alert.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Evaluate alerts for a specific user
   */
  async evaluateUserAlerts(userId: string): Promise<AlertEvaluationResult[]> {
    const alerts = await prisma.alert.findMany({
      where: { userId, isActive: true },
    });

    const results: AlertEvaluationResult[] = [];

    for (const alert of alerts) {
      try {
        const result = await this.evaluateAlert(alert.id);
        results.push(result);
      } catch (error) {
        logger.error(`Error evaluating user alert`, { userId, alertId: alert.id, error });
        results.push({
          alertId: alert.id,
          triggered: false,
          currentValue: 0,
          threshold: 0,
          message: error instanceof Error ? error.message : 'Evaluation failed',
        });
      }
    }

    return results;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    const [totalAlerts, activeAlerts, triggeredToday] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { isActive: true } }),
      prisma.alert.count({
        where: {
          lastTriggered: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    // Get most triggered alerts
    const mostTriggered = await prisma.alert.findMany({
      orderBy: { triggerCount: 'desc' },
      take: 5,
      select: {
        id: true,
        tokenSymbol: true,
        alertType: true,
        triggerCount: true,
        condition: true,
        threshold: true,
      },
    });

    return {
      totalAlerts,
      activeAlerts,
      triggeredToday,
      mostTriggered,
    };
  }
}

export const alertEvaluationService = new AlertEvaluationService();
