import { PrismaClient } from '@prisma/client';

// Build-safe Prisma client that won't fail during Vercel build
const createPrismaClient = () => {
  // During build time on Vercel, create a mock client
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    console.log('🔍 Build time detected, creating mock Prisma client');
    
    // Return a mock client that won't actually connect to the database
    return new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://dummy:dummy@localhost:5432/dummy',
        },
      },
      // Disable all logging during build
      log: [],
    });
  }

  // Normal client for runtime
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
