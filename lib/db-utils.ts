import { prisma } from './prisma';

// Retry configuration for database operations
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
};

// Exponential backoff delay
const getDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const message = error.message || '';
  const code = error.code || '';
  
  // Retry on prepared statement errors (Supabase connection issues)
  if (message.includes('prepared statement') || message.includes('does not exist')) {
    return true;
  }
  
  // Retry on connection errors
  if (code === 'P1001' || code === 'P1008' || code === 'P1017') {
    return true;
  }
  
  // Retry on timeout errors
  if (code === 'P2024' || message.includes('timeout')) {
    return true;
  }
  
  return false;
};

// Generic retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  // Check if Prisma client is available
  if (!prisma) {
    throw new Error(`Cannot execute ${context} - Prisma client not available in this environment`);
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === RETRY_CONFIG.maxAttempts || !isRetryableError(error)) {
        console.error(`❌ ${context} failed after ${attempt} attempts:`, error);
        throw error;
      }
      
      console.warn(`⚠️ ${context} failed (attempt ${attempt}/${RETRY_CONFIG.maxAttempts}), retrying...`, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, getDelay(attempt)));
      
      // For prepared statement errors, try to refresh the connection
      if (error.message && error.message.includes('prepared statement')) {
        console.log('🔄 Attempting to refresh Prisma connection...');
        try {
          await prisma.$disconnect();
          await prisma.$connect();
          console.log('✅ Prisma connection refreshed');
        } catch (refreshError) {
          console.warn('⚠️ Failed to refresh Prisma connection:', refreshError);
        }
      }
    }
  }
  
  throw lastError;
}

// Create database operations wrapper
const createDbWrapper = () => {
  if (!prisma) {
    console.warn('⚠️ Prisma client not available - running in browser/Edge runtime');
    // Return dummy db object for build-time compatibility
    return {
      user: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
      provider: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
      booking: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
      payment: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0), 
        aggregate: () => Promise.resolve({ _sum: { amount: 0 }, _avg: { rating: 0 } }) 
      },
      review: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0), 
        aggregate: () => Promise.resolve({ _sum: { amount: 0 }, _avg: { rating: 0 } }) 
      },
      payout: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
      service: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
    };
  }

  // Return real db wrapper with retry logic
  return {
    // User operations
    user: {
      findFirst: (args: any) => withRetry(() => prisma.user.findFirst(args), 'user.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.user.findMany(args), 'user.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.user.findUnique(args), 'user.findUnique'),
      count: (args: any) => withRetry(() => prisma.user.count(args), 'user.count'),
    },
    
    // Provider operations
    provider: {
      findFirst: (args: any) => withRetry(() => prisma.provider.findFirst(args), 'provider.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.provider.findMany(args), 'provider.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.provider.findUnique(args), 'provider.findUnique'),
      count: (args: any) => withRetry(() => prisma.provider.count(args), 'provider.count'),
    },
    
    // Booking operations
    booking: {
      findFirst: (args: any) => withRetry(() => prisma.booking.findFirst(args), 'booking.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.booking.findMany(args), 'booking.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.booking.findUnique(args), 'booking.findUnique'),
      count: (args: any) => withRetry(() => prisma.booking.count(args), 'booking.count'),
    },
    
    // Payment operations
    payment: {
      findFirst: (args: any) => withRetry(() => prisma.payment.findFirst(args), 'payment.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.payment.findMany(args), 'payment.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.payment.findUnique(args), 'payment.findUnique'),
      count: (args: any) => withRetry(() => prisma.payment.count(args), 'payment.count'),
      aggregate: (args: any) => withRetry(() => prisma.payment.aggregate(args), 'payment.aggregate'),
    },
    
    // Review operations
    review: {
      findFirst: (args: any) => withRetry(() => prisma.review.findFirst(args), 'review.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.review.findMany(args), 'review.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.review.findUnique(args), 'review.findUnique'),
      count: (args: any) => withRetry(() => prisma.review.count(args), 'review.count'),
      aggregate: (args: any) => withRetry(() => prisma.review.aggregate(args), 'review.aggregate'),
    },
    
    // Payout operations
    payout: {
      findFirst: (args: any) => withRetry(() => prisma.payout.findFirst(args), 'payout.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.payout.findMany(args), 'payout.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.payout.findUnique(args), 'payout.findUnique'),
      count: (args: any) => withRetry(() => prisma.payout.count(args), 'payout.count'),
    },
    
    // Service operations
    service: {
      findFirst: (args: any) => withRetry(() => prisma.service.findFirst(args), 'service.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.service.findMany(args), 'service.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.service.findUnique(args), 'service.findUnique'),
      count: (args: any) => withRetry(() => prisma.service.count(args), 'service.count'),
    },
  };
};

// Export the database wrapper
export const db = createDbWrapper();

// Export the original prisma client for operations not covered by the wrapper
// Note: prisma might be null in browser/Edge runtime environments
export { prisma };
