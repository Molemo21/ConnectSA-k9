import { PrismaClient } from '@prisma/client';

// Fix for Supabase prepared statement conflicts
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  console.log('🔍 DATABASE_URL from environment:', url ? 'Present' : 'Missing');
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  
  if (!url) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // If using Supabase pooler, switch to direct connection
  if (url.includes('pooler.supabase.com:6543')) {
    const modifiedUrl = url
      .replace(':6543/', ':5432/')
      .replace('?pgbouncer=true', '')
      .replace('&connection_limit=1', '')
      .replace('&pool_timeout=20', '');
    
    console.log('🔍 Modified Supabase URL for direct connection');
    return modifiedUrl;
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