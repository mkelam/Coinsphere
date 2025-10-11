import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  status: 'success' | 'failure' | 'error';
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

class AuditLogService {
  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          resource: data.resource || null,
          resourceId: data.resourceId || null,
          status: data.status,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          method: data.method || null,
          path: data.path || null,
          metadata: data.metadata || null,
          errorMessage: data.errorMessage || null,
        },
      });

      logger.debug('Audit log created', {
        action: data.action,
        userId: data.userId,
        status: data.status,
      });
    } catch (error) {
      // Don't throw - audit logging should not break the application
      logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(data: {
    action: 'login' | 'logout' | 'signup' | 'email_verification' | 'password_reset_request' | 'password_reset_complete' | 'profile_update' | 'change_password';
    userId?: string;
    email?: string;
    status: 'success' | 'failure';
    req: Request;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      userId: data.userId,
      action: data.action,
      resource: 'user',
      resourceId: data.userId,
      status: data.status,
      ipAddress: this.getIpAddress(data.req),
      userAgent: data.req.headers['user-agent'],
      method: data.req.method,
      path: data.req.path,
      metadata: data.email ? { email: data.email } : undefined,
      errorMessage: data.errorMessage,
    });
  }

  /**
   * Log admin actions
   */
  async logAdmin(data: {
    action: 'token_create' | 'token_update' | 'token_delete' | 'user_update' | 'user_delete';
    userId: string;
    resourceId?: string;
    status: 'success' | 'failure' | 'error';
    req: Request;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      userId: data.userId,
      action: data.action,
      resource: this.getResourceFromAction(data.action),
      resourceId: data.resourceId,
      status: data.status,
      ipAddress: this.getIpAddress(data.req),
      userAgent: data.req.headers['user-agent'],
      method: data.req.method,
      path: data.req.path,
      metadata: data.metadata,
      errorMessage: data.errorMessage,
    });
  }

  /**
   * Log portfolio/transaction actions
   */
  async logPortfolio(data: {
    action: 'portfolio_create' | 'portfolio_update' | 'portfolio_delete' | 'transaction_create' | 'transaction_update' | 'transaction_delete';
    userId: string;
    resourceId?: string;
    status: 'success' | 'failure' | 'error';
    req: Request;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      userId: data.userId,
      action: data.action,
      resource: this.getResourceFromAction(data.action),
      resourceId: data.resourceId,
      status: data.status,
      ipAddress: this.getIpAddress(data.req),
      userAgent: data.req.headers['user-agent'],
      method: data.req.method,
      path: data.req.path,
      metadata: data.metadata,
      errorMessage: data.errorMessage,
    });
  }

  /**
   * Query audit logs (for admin dashboard)
   */
  async queryLogs(params: {
    userId?: string;
    action?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      action,
      status,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = params;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
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
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  }

  /**
   * Get audit log statistics
   */
  async getStats(params: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { userId, startDate, endDate } = params;

    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      errorCount,
      actionCounts,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, status: 'success' } }),
      prisma.auditLog.count({ where: { ...where, status: 'failure' } }),
      prisma.auditLog.count({ where: { ...where, status: 'error' } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      errorCount,
      actionCounts: actionCounts.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
    };
  }

  /**
   * Helper: Extract IP address from request
   */
  private getIpAddress(req: Request): string | undefined {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress
    );
  }

  /**
   * Helper: Determine resource type from action
   */
  private getResourceFromAction(action: string): string {
    if (action.startsWith('token_')) return 'token';
    if (action.startsWith('user_')) return 'user';
    if (action.startsWith('portfolio_')) return 'portfolio';
    if (action.startsWith('transaction_')) return 'transaction';
    return 'unknown';
  }
}

export const auditLogService = new AuditLogService();
