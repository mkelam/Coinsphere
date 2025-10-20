import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import * as Sentry from '@sentry/node';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter, apiLimiter } from './middleware/rateLimit.js';
import { getCsrfToken, validateCsrfToken } from './middleware/csrf.js';
import { authenticate } from './middleware/auth.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { priceUpdaterService } from './services/priceUpdater.js';
import { websocketService } from './services/websocket.js';
import { checkRedisHealth, closeRedisConnection } from './lib/redis.js';
import { initializeExchangeSyncJobs, stopExchangeSyncQueue } from './services/exchangeSyncQueue.js';

// Import routes
import authRoutes from './routes/auth.js';
import twoFactorRoutes from './routes/twoFactor.js';
import tokensRoutes from './routes/tokens.js';
import portfoliosRoutes from './routes/portfolios.js';
import holdingsRoutes from './routes/holdings.js';
import predictionsRoutes from './routes/predictions.js';
import riskRoutes from './routes/risk.js';
import alertsRoutes from './routes/alerts.js';
import transactionsRoutes from './routes/transactions.js';
import paymentsRoutes from './routes/payments.js';
import exchangesRoutes from './routes/exchanges.js';
import defiRoutes from './routes/defi.js';
import socialRoutes from './routes/social.js';
import marketsRoutes from './routes/markets.js';
import adminRoutes from './routes/admin.js';
import tradingResearchRoutes from './routes/tradingResearch.js';
import backtestingRoutes from './routes/backtesting.js';
import exchangeRoutes from './routes/exchange.js';
import marketDataRoutes from './routes/marketData.js';
import strategiesRoutes from './routes/strategies.js';

const app = express();
const server = http.createServer(app);

// Initialize Sentry for error monitoring
if (process.env.SENTRY_DSN && config.env === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.env,
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });

  // Sentry request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  // Sentry tracing middleware
  app.use(Sentry.Handlers.tracingHandler());

  logger.info('Sentry monitoring initialized');
}

// Middleware - Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.appUrl,  // Production frontend URL
      'http://localhost:5173',  // Vite dev server
      'http://localhost:5174',  // Vite dev server (port conflict)
      'http://localhost:5175',  // Vite dev server (port conflict)
      'http://localhost:5176',  // Vite dev server (port conflict)
      'http://localhost:5177',  // Vite dev server (port conflict)
      'http://localhost:5178',  // Vite dev server (port conflict)
      'http://localhost:5179',  // Vite dev server (port conflict)
      'http://localhost:3000',  // Alternative dev server
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,  // 24 hours
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));  // Add size limit
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization (XSS and SQL injection prevention)
app.use(sanitizeInput);

// Health check with Redis status
app.get('/health', async (req, res) => {
  const redisHealth = await checkRedisHealth();

  res.json({
    status: redisHealth.status === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      redis: redisHealth.status,
    },
  });
});

// API Documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Coinsphere API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// CSRF token endpoint (requires authentication)
app.get('/api/v1/csrf-token', authenticate, getCsrfToken);

// API Routes with Rate Limiting and CSRF Protection
app.use('/api/v1/auth', authLimiter, authRoutes); // Strict rate limit for auth (no CSRF on login/signup)
app.use('/api/v1/2fa', authenticate, validateCsrfToken, authLimiter, twoFactorRoutes); // 2FA routes require authentication
app.use('/api/v1/tokens', apiLimiter, tokensRoutes); // Public read-only, auth required for mutations (handled in routes)
app.use('/api/v1/predictions', apiLimiter, predictionsRoutes); // Public read-only ML predictions
app.use('/api/v1/risk', apiLimiter, riskRoutes); // Public read-only risk scores
app.use('/api/v1/markets', apiLimiter, marketsRoutes); // Public read-only market data (CryptoCompare)
app.use('/api/v1/social', apiLimiter, socialRoutes); // Public read-only social sentiment (LunarCrush)
app.use('/api/v1/portfolios', authenticate, validateCsrfToken, apiLimiter, portfoliosRoutes);
app.use('/api/v1/holdings', authenticate, validateCsrfToken, apiLimiter, holdingsRoutes);
app.use('/api/v1/alerts', authenticate, validateCsrfToken, apiLimiter, alertsRoutes);
app.use('/api/v1/transactions', authenticate, validateCsrfToken, apiLimiter, transactionsRoutes);
app.use('/api/v1/payments', apiLimiter, paymentsRoutes); // PayFast webhook doesn't need CSRF
app.use('/api/v1/exchanges', authenticate, validateCsrfToken, apiLimiter, exchangesRoutes);
app.use('/api/v1/defi', apiLimiter, defiRoutes); // DeFi routes (auth required for user positions)
app.use('/api/v1/trading-research', apiLimiter, tradingResearchRoutes); // Phase 0 Trading Research (public read, admin write)
app.use('/api/v1/backtesting', apiLimiter, backtestingRoutes); // Phase 1 Backtesting Dashboard (public read, admin write)
app.use('/api/v1/exchange', authenticate, validateCsrfToken, apiLimiter, exchangeRoutes); // Phase 2 Live Trading Exchange API
app.use('/api/v1/market-data', authenticate, validateCsrfToken, apiLimiter, marketDataRoutes); // Phase 2 Market Data Streaming
app.use('/api/v1/strategies', authenticate, validateCsrfToken, apiLimiter, strategiesRoutes); // Phase 2 Strategy Execution & Management
app.use('/api/v1/admin', authenticate, validateCsrfToken, apiLimiter, adminRoutes); // Admin only routes

// Sentry error handler must be before custom error handlers
if (process.env.SENTRY_DSN && config.env === 'production') {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;
server.listen(PORT, async () => {
  logger.info(`🚀 Coinsphere API Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.env}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
  logger.info(`📡 WebSocket endpoint: ws://localhost:${PORT}/api/v1/ws`);

  // Start price updater service
  priceUpdaterService.start();
  logger.info(`💰 Price updater service started`);

  // Initialize WebSocket service
  websocketService.initialize(server);
  logger.info(`🔌 WebSocket service started`);

  // Initialize exchange sync jobs
  initializeExchangeSyncJobs();
  logger.info(`🔄 Exchange sync jobs initialized`);

  // Initialize price update scheduler
  const { initializePriceScheduler } = await import('./services/priceUpdateScheduler.js');
  initializePriceScheduler();
  logger.info(`⏰ Price update scheduler initialized`);

  // Initialize accuracy calculation scheduler
  const { initializeAccuracyScheduler } = await import('./services/accuracyScheduler.js');
  initializeAccuracyScheduler();
  logger.info(`📊 Accuracy calculation scheduler initialized`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    priceUpdaterService.stop();
    websocketService.stop();
    await stopExchangeSyncQueue();

    // Stop price scheduler
    const { stopPriceScheduler } = await import('./services/priceUpdateScheduler.js');
    stopPriceScheduler();

    // Stop accuracy scheduler
    const { stopAccuracyScheduler } = await import('./services/accuracyScheduler.js');
    stopAccuracyScheduler();

    await closeRedisConnection();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    priceUpdaterService.stop();
    websocketService.stop();
    await stopExchangeSyncQueue();

    // Stop price scheduler
    const { stopPriceScheduler } = await import('./services/priceUpdateScheduler.js');
    stopPriceScheduler();

    // Stop accuracy scheduler
    const { stopAccuracyScheduler } = await import('./services/accuracyScheduler.js');
    stopAccuracyScheduler();

    await closeRedisConnection();
    process.exit(0);
  });
});

export default app;
