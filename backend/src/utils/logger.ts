import winston from 'winston';
import { config } from '../config/index.js';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Create Winston logger
const winstonLogger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'coinsphere-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: config.env === 'production' ? logFormat : consoleFormat,
    }),
  ],
});

// Add file transports in production
if (config.env === 'production') {
  // Error logs
  winstonLogger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );

  // Combined logs
  winstonLogger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 14, // 14 days retention
    })
  );
}

// Export logger interface compatible with existing code
export const logger = {
  info: (message: string, meta?: any) => {
    winstonLogger.info(message, meta);
  },

  error: (message: string, meta?: any) => {
    winstonLogger.error(message, meta);
  },

  warn: (message: string, meta?: any) => {
    winstonLogger.warn(message, meta);
  },

  debug: (message: string, meta?: any) => {
    winstonLogger.debug(message, meta);
  },

  http: (message: string, meta?: any) => {
    winstonLogger.http(message, meta);
  },
};

export default logger;
