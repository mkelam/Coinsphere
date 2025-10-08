import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error details for debugging
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const statusCode = err.statusCode || 500;

  // In production, use generic error message for 500 errors
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        path: req.path,
      }),
    },
  });
};
