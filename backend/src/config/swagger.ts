import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

/**
 * Swagger/OpenAPI Configuration
 *
 * Generates API documentation from JSDoc comments in route files
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Coinsphere API',
    version: '0.1.0',
    description: 'AI-powered crypto portfolio tracker with market predictions and risk scoring',
    contact: {
      name: 'Coinsphere Team',
      url: 'https://coinsphere.app',
      email: 'api@coinsphere.app',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: config.env === 'production' ? 'https://api.coinsphere.app/v1' : 'http://localhost:3001/api/v1',
      description: config.env === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User unique identifier',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
          },
          subscriptionTier: {
            type: 'string',
            enum: ['free', 'plus', 'pro', 'power'],
            description: 'User subscription tier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
          },
        },
      },
      Token: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          symbol: {
            type: 'string',
            description: 'Token symbol (e.g., BTC, ETH)',
          },
          name: {
            type: 'string',
            description: 'Token full name',
          },
          blockchain: {
            type: 'string',
            description: 'Native blockchain',
          },
          logoUrl: {
            type: 'string',
            format: 'uri',
            description: 'Token logo image URL',
          },
          currentPrice: {
            type: 'number',
            description: 'Current price in USD',
          },
          marketCap: {
            type: 'number',
            description: 'Market capitalization in USD',
          },
          volume24h: {
            type: 'number',
            description: '24-hour trading volume',
          },
          priceChange24h: {
            type: 'number',
            description: '24-hour price change percentage',
          },
        },
      },
      Portfolio: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            description: 'Portfolio name',
          },
          totalValue: {
            type: 'number',
            description: 'Total portfolio value in USD',
          },
          totalGainLoss: {
            type: 'number',
            description: 'Total gain/loss in USD',
          },
          totalGainLossPercentage: {
            type: 'number',
            description: 'Total gain/loss percentage',
          },
          riskScore: {
            type: 'number',
            description: 'Portfolio risk score (0-100)',
          },
          holdings: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Holding',
            },
          },
        },
      },
      Holding: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          tokenId: {
            type: 'string',
            format: 'uuid',
          },
          symbol: {
            type: 'string',
          },
          amount: {
            type: 'number',
            description: 'Token amount held',
          },
          averageBuyPrice: {
            type: 'number',
            description: 'Average purchase price',
          },
          currentValue: {
            type: 'number',
            description: 'Current holding value in USD',
          },
          gainLoss: {
            type: 'number',
            description: 'Gain/loss in USD',
          },
          gainLossPercentage: {
            type: 'number',
            description: 'Gain/loss percentage',
          },
        },
      },
      Prediction: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Token symbol',
          },
          currentPrice: {
            type: 'number',
            description: 'Current price',
          },
          predictedPrice: {
            type: 'number',
            description: 'Predicted price',
          },
          priceChange: {
            type: 'number',
            description: 'Predicted price change',
          },
          priceChangePercentage: {
            type: 'number',
            description: 'Predicted price change percentage',
          },
          confidence: {
            type: 'number',
            description: 'Prediction confidence (0-1)',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication credentials are missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions to access resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and account management',
    },
    {
      name: 'Tokens',
      description: 'Cryptocurrency token data',
    },
    {
      name: 'Portfolios',
      description: 'User portfolio management',
    },
    {
      name: 'Holdings',
      description: 'Portfolio holding operations',
    },
    {
      name: 'Predictions',
      description: 'AI price predictions',
    },
    {
      name: 'Risk',
      description: 'Risk scoring and analysis',
    },
    {
      name: 'Alerts',
      description: 'Price and risk alerts',
    },
    {
      name: 'Transactions',
      description: 'Transaction history',
    },
    {
      name: 'Exchanges',
      description: 'Exchange integrations',
    },
    {
      name: 'DeFi',
      description: 'DeFi protocol integrations',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
