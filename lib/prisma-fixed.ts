import { PrismaClient } from '@prisma/client';

// Fix for Supabase prepared statement conflicts
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // If using Supabase pooler, switch to direct connection
  if (url.includes('pooler.supabase.com:6543')) {
    return url
      .replace(':6543/', ':5432/')
      .replace('?pgbouncer=true', '')
      .replace('&connection_limit=1', '')
      .replace('&pool_timeout=20', '');
  }
  
  return url;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma; 