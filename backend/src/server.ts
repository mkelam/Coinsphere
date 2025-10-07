import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

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

// API Routes (to be implemented)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/portfolios', portfolioRoutes);
// app.use('/api/v1/holdings', holdingsRoutes);
// app.use('/api/v1/alerts', alertsRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.env}`);
});

export default app;
