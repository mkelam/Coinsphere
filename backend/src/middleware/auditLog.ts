import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '../services/auditLog.js';
import { AuthRequest } from './auth.js';

/**
 * Middleware to automatically log API requests for security-sensitive endpoints
 *
 * Usage: Add this middleware to routes that need audit logging
 * Example: router.post('/admin/action', authenticate, auditLogMiddleware('admin_action'), handler)
 */
export function auditLogMiddleware(action: string, resource?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    // Capture the original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Determine status based on HTTP status code
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' :
                     res.statusCode >= 400 && res.statusCode < 500 ? 'failure' : 'error';

      // Extract resourceId from response if available
      const resourceId = body?.id || body?.data?.id || req.params.id;

      // Log the action (async, non-blocking)
      auditLogService.log({
        userId,
        action,
        resource,
        resourceId,
        status,
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        method: req.method,
        path: req.path,
        metadata: {
          statusCode: res.statusCode,
          hasError: !!body?.error,
        },
        errorMessage: body?.error || body?.message,
      }).catch((error) => {
        // Silently log error - audit logging should not break the app
        console.error('Audit log middleware error:', error);
      });

      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper function to extract IP address from request
 */
function getIpAddress(req: Request): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress
  );
}
