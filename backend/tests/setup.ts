import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma.js';

// Setup before all tests
beforeAll(async () => {
  // Ensure test database is ready
  await prisma.$connect();
});

// Cleanup after each test
beforeEach(async () => {
  // Clean up database tables in correct order (respecting foreign keys)
  await prisma.priceData.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.token.deleteMany();
  await prisma.user.deleteMany();
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
