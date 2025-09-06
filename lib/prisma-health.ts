import { prisma } from './prisma';

/**
 * Check if Prisma client is connected and healthy
 */
export async function checkPrismaHealth(): Promise<boolean> {
  try {
    if (!prisma) {
      console.log('❌ Prisma client is null');
      return false;
    }

    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Prisma connection is unhealthy:', error);
    return false;
  }
}

/**
 * Ensure Prisma client is connected before operations
 */
export async function ensurePrismaConnection(): Promise<boolean> {
  try {
    if (!prisma) {
      console.log('❌ Prisma client is null');
      return false;
    }

    // Try to connect if not already connected
    try {
      await prisma.$connect();
      console.log('✅ Prisma client connected');
    } catch (connectError) {
      console.log('⚠️ Prisma client connection attempt failed:', connectError);
    }

    // Test with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Prisma connection verified');
    return true;
  } catch (error) {
    console.error('❌ Failed to ensure Prisma connection:', error);
    return false;
  }
}

/**
 * Retry database operation with connection check
 */
export async function withConnectionRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  // First, ensure connection
  const isHealthy = await ensurePrismaConnection();
  if (!isHealthy) {
    throw new Error(`Cannot execute ${context} - Prisma connection is unhealthy`);
  }

  // Then execute the operation
  return await operation();
}
