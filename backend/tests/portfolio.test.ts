import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { prisma } from '../src/lib/prisma.js';

describe('Portfolio API', () => {
  let authToken: string;
  let userId: string;
  let tokenId: string;

  beforeEach(async () => {
    // Register and login a user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@coinsphere.app',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create a test token
    const token = await prisma.token.create({
      data: {
        symbol: 'BTC',
        name: 'Bitcoin',
        blockchain: 'Bitcoin',
        coingeckoId: 'bitcoin',
        decimals: 8,
        currentPrice: 67000,
        marketCap: 1300000000000,
        volume24h: 35000000000,
        priceChange24h: 2.5,
      },
    });
    tokenId = token.id;
  });

  describe('POST /api/v1/portfolios', () => {
    it('should create a new portfolio', async () => {
      const response = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My Main Portfolio',
          description: 'Primary crypto holdings',
        });

      expect(response.status).toBe(201);
      expect(response.body.portfolio.name).toBe('My Main Portfolio');
      expect(response.body.portfolio.description).toBe('Primary crypto holdings');
      expect(response.body.portfolio.userId).toBe(userId);
    });

    it('should reject portfolio creation without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/portfolios')
        .send({
          name: 'My Portfolio',
        });

      expect(response.status).toBe(401);
    });

    it('should reject portfolio creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 123, // Invalid: should be string
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/portfolios', () => {
    beforeEach(async () => {
      // Create two portfolios
      await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Portfolio 1' });

      await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Portfolio 2' });
    });

    it('should get all user portfolios', async () => {
      const response = await request(app)
        .get('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.portfolios).toHaveLength(2);
      expect(response.body.portfolios[0].name).toBe('Portfolio 1');
      expect(response.body.portfolios[1].name).toBe('Portfolio 2');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app).get('/api/v1/portfolios');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/portfolios/:id/holdings', () => {
    let portfolioId: string;

    beforeEach(async () => {
      // Create a portfolio
      const portfolioResponse = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Portfolio' });

      portfolioId = portfolioResponse.body.portfolio.id;
    });

    it('should add a holding to portfolio', async () => {
      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenSymbol: 'BTC',
          amount: 0.5,
          averageBuyPrice: 65000,
          source: 'Binance',
        });

      expect(response.status).toBe(201);
      expect(response.body.holding.amount).toBe(0.5);
      expect(response.body.holding.averageBuyPrice).toBe(65000);
      expect(response.body.holding.source).toBe('Binance');
      expect(response.body.holding.token.symbol).toBe('BTC');
    });

    it('should reject holding with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenSymbol: 'INVALID',
          amount: 1.0,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Token not found');
    });

    it('should reject holding with negative amount', async () => {
      const response = await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenSymbol: 'BTC',
          amount: -0.5,
        });

      expect(response.status).toBe(400);
    });

    it('should reject holding to non-existent portfolio', async () => {
      const fakePortfolioId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post(`/api/v1/portfolios/${fakePortfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenSymbol: 'BTC',
          amount: 0.5,
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Portfolio not found');
    });
  });

  describe('GET /api/v1/portfolios with holdings', () => {
    it('should get portfolios with holdings populated', async () => {
      // Create portfolio
      const portfolioResponse = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Portfolio' });

      const portfolioId = portfolioResponse.body.portfolio.id;

      // Add holding
      await request(app)
        .post(`/api/v1/portfolios/${portfolioId}/holdings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tokenSymbol: 'BTC',
          amount: 0.5,
          averageBuyPrice: 65000,
        });

      // Get portfolios
      const response = await request(app)
        .get('/api/v1/portfolios')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.portfolios).toHaveLength(1);
      expect(response.body.portfolios[0].holdings).toHaveLength(1);
      expect(response.body.portfolios[0].holdings[0].amount).toBe(0.5);
      expect(response.body.portfolios[0].holdings[0].token.symbol).toBe('BTC');
    });
  });
});
