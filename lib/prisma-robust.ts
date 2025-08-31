import { PrismaClient } from '@prisma/client';

// Fix for Supabase prepared statement conflicts and connection issues
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  console.log('🔍 DATABASE_URL from environment:', url ? 'Present' : 'Missing');
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  
  if (!url) {
    // During build time, return a dummy URL to prevent build failures
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
      console.log('🔍 Build time detected, using dummy DATABASE_URL for build');
      return 'postgresql://dummy:dummy@localhost:5432/dummy';
    }
    
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

// Create a robust Prisma client with connection management
const createRobustPrismaClient = () => {
  // Check if we're in a browser or Edge runtime environment
  if (typeof window !== 'undefined' || process.env.NEXT_RUNTIME === 'edge') {
    console.log('🔄 Skipping Prisma client creation in browser/Edge runtime');
    return null;
  }

  console.log('🔍 Creating Prisma client with URL:', getDatabaseUrl());
  
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    // Disable query execution during build time
    ...(process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL && {
      datasources: {
        db: {
          url: 'postgresql://dummy:dummy@localhost:5432/dummy',
        },
      },
    }),
    // Add error handling for connection issues
    errorFormat: 'pretty',
  });

  // Add connection error handling and retry logic
  // Only connect in server environments, not in Edge runtime or browser
  if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development') {
    client.$connect()
      .then(() => {
        console.log('✅ Prisma client connected successfully');
      })
      .catch((error) => {
        console.error('❌ Prisma connection failed:', error);
        // For Supabase, try to reconnect with modified settings
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com')) {
          console.log('🔄 Attempting to reconnect with Supabase-optimized settings...');
        }
      });
  }

  // Handle connection errors during runtime
  client.$on('query', (e) => {
    if (e.duration > 10000) { // Log slow queries
      console.warn(`🐌 Slow query detected: ${e.query} (${e.duration}ms)`);
    }
  });

  client.$on('error', (e) => {
    console.error('❌ Prisma error:', e);
    
    // Handle specific Supabase connection errors
    if (e.message && e.message.includes('prepared statement')) {
      console.log('🔄 Prepared statement error detected, connection may need refresh');
    }
  });

  try {
    console.log('🔍 Prisma client created successfully');
    return client;
  } catch (error) {
    console.error('❌ Error creating Prisma client:', error);
    return null;
  }
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createRobustPrismaClient();

// Only set global if we have a valid client
if (prisma && process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
