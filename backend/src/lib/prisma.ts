import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Connection pool configuration
const connectionPoolConfig = {
  // Maximum number of database connections in the pool
  connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10', 10),
  // Connection timeout in seconds
  connect_timeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '30', 10),
  // Pool timeout in seconds (time to wait for connection from pool)
  pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10', 10),
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
        ? `${process.env.DATABASE_URL}?connection_limit=${connectionPoolConfig.connection_limit}&connect_timeout=${connectionPoolConfig.connect_timeout}&pool_timeout=${connectionPoolConfig.pool_timeout}`
        : undefined,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
