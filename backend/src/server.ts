import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { priceUpdaterService } from './services/priceUpdater.js';
import { websocketService } from './services/websocket.js';

// Import routes
import authRoutes from './routes/auth.js';
import tokensRoutes from './routes/tokens.js';
import portfoliosRoutes from './routes/portfolios.js';
import predictionsRoutes from './routes/predictions.js';
import riskRoutes from './routes/risk.js';
import alertsRoutes from './routes/alerts.js';
import transactionsRoutes from './routes/transactions.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tokens', tokensRoutes);
app.use('/api/v1/portfolios', portfoliosRoutes);
app.use('/api/v1/predictions', predictionsRoutes);
app.use('/api/v1/risk', riskRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/transactions', transactionsRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;
server.listen(PORT, () => {
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
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    priceUpdaterService.stop();
    websocketService.stop();
  });
});

export default app;
