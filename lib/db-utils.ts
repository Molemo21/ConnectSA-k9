import prisma from './prisma';

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
  
  // Retry on "Engine is not yet connected" errors (common with pooler)
  if (message.includes('Engine is not yet connected')) {
    return true;
  }
  
  // Retry on prepared statement errors (Supabase connection issues)
  if (message.includes('prepared statement') || message.includes('does not exist')) {
    return true;
  }
  
  // Retry on connection errors
  if (code === 'P1001' || code === 'P1008' || code === 'P1017') {
    return true;
  }
  
  // Retry on timeout errors
  if (code === 'P2024' || message.includes('timeout') || message.includes('connection pool')) {
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
      
      // For connection errors, try to refresh the connection
      if (error.message && (error.message.includes('prepared statement') || error.message.includes('Engine is not yet connected') || error.message.includes('connection pool'))) {
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
        count: () => Promise.resolve(0),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        create: () => Promise.resolve(null)
      },
      provider: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        upsert: () => Promise.resolve(null),
      },
      booking: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        aggregate: () => Promise.resolve({ _sum: { totalAmount: 0 }, _avg: { totalAmount: 0 } }),
      },
      payment: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0), 
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        aggregate: () => Promise.resolve({ _sum: { amount: 0 }, _avg: { rating: 0 } }) 
      },
      notification: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0), 
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        updateMany: () => Promise.resolve({ count: 0 }),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 }),
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
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null)
      },
      service: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0) 
      },
      serviceCategory: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null)
      },
      providerService: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        createMany: () => Promise.resolve({ count: 0 }),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 })
      },
      adminAuditLog: { 
        findFirst: () => Promise.resolve(null), 
        findMany: () => Promise.resolve([]), 
        findUnique: () => Promise.resolve(null), 
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null)
      },
      verificationToken: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 }),
      },
      passwordResetToken: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 }),
      },
      bookingDraft: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 }),
      },
      notification: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        updateMany: () => Promise.resolve({ count: 0 }),
        delete: () => Promise.resolve(null),
        deleteMany: () => Promise.resolve({ count: 0 }),
      },
      $transaction: (callback: any) => Promise.resolve(callback({})),
      $queryRaw: () => Promise.resolve([]),
      $executeRaw: () => Promise.resolve(0),
      $disconnect: () => Promise.resolve(),
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
      update: (args: any) => withRetry(() => prisma.user.update(args), 'user.update'),
      delete: (args: any) => withRetry(() => prisma.user.delete(args), 'user.delete'),
      create: (args: any) => withRetry(() => prisma.user.create(args), 'user.create'),
    },
    
    // Provider operations
    provider: {
      findFirst: (args: any) => withRetry(() => prisma.provider.findFirst(args), 'provider.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.provider.findMany(args), 'provider.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.provider.findUnique(args), 'provider.findUnique'),
      count: (args: any) => withRetry(() => prisma.provider.count(args), 'provider.count'),
      create: (args: any) => withRetry(() => prisma.provider.create(args), 'provider.create'),
      update: (args: any) => withRetry(() => prisma.provider.update(args), 'provider.update'),
      delete: (args: any) => withRetry(() => prisma.provider.delete(args), 'provider.delete'),
      upsert: (args: any) => withRetry(() => prisma.provider.upsert(args), 'provider.upsert'),
    },
    
    // Booking operations
    booking: {
      findFirst: (args: any) => withRetry(() => prisma.booking.findFirst(args), 'booking.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.booking.findMany(args), 'booking.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.booking.findUnique(args), 'booking.findUnique'),
      count: (args: any) => withRetry(() => prisma.booking.count(args), 'booking.count'),
      create: (args: any) => withRetry(() => prisma.booking.create(args), 'booking.create'),
      update: (args: any) => withRetry(() => prisma.booking.update(args), 'booking.update'),
      aggregate: (args: any) => withRetry(() => prisma.booking.aggregate(args), 'booking.aggregate'),
    },
    
    // Payment operations
    payment: {
      findFirst: (args: any) => withRetry(() => prisma.payment.findFirst(args), 'payment.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.payment.findMany(args), 'payment.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.payment.findUnique(args), 'payment.findUnique'),
      count: (args: any) => withRetry(() => prisma.payment.count(args), 'payment.count'),
      create: (args: any) => withRetry(() => prisma.payment.create(args), 'payment.create'),
      update: (args: any) => withRetry(() => prisma.payment.update(args), 'payment.update'),
      delete: (args: any) => withRetry(() => prisma.payment.delete(args), 'payment.delete'),
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
      create: (args: any) => withRetry(() => prisma.payout.create(args), 'payout.create'),
      update: (args: any) => withRetry(() => prisma.payout.update(args), 'payout.update'),
      delete: (args: any) => withRetry(() => prisma.payout.delete(args), 'payout.delete'),
    },
    
    // Service operations
    service: {
      findFirst: (args: any) => withRetry(() => prisma.service.findFirst(args), 'service.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.service.findMany(args), 'service.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.service.findUnique(args), 'service.findUnique'),
      count: (args: any) => withRetry(() => prisma.service.count(args), 'service.count'),
    },

    // ServiceCategory operations
    serviceCategory: {
      findFirst: (args: any) => withRetry(() => prisma.serviceCategory.findFirst(args), 'serviceCategory.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.serviceCategory.findMany(args), 'serviceCategory.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.serviceCategory.findUnique(args), 'serviceCategory.findUnique'),
      count: (args: any) => withRetry(() => prisma.serviceCategory.count(args), 'serviceCategory.count'),
      create: (args: any) => withRetry(() => prisma.serviceCategory.create(args), 'serviceCategory.create'),
      update: (args: any) => withRetry(() => prisma.serviceCategory.update(args), 'serviceCategory.update'),
      delete: (args: any) => withRetry(() => prisma.serviceCategory.delete(args), 'serviceCategory.delete'),
    },

    // ProviderService operations
    providerService: {
      findFirst: (args: any) => withRetry(() => prisma.providerService.findFirst(args), 'providerService.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.providerService.findMany(args), 'providerService.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.providerService.findUnique(args), 'providerService.findUnique'),
      count: (args: any) => withRetry(() => prisma.providerService.count(args), 'providerService.count'),
      create: (args: any) => withRetry(() => prisma.providerService.create(args), 'providerService.create'),
      createMany: (args: any) => withRetry(() => prisma.providerService.createMany(args), 'providerService.createMany'),
      update: (args: any) => withRetry(() => prisma.providerService.update(args), 'providerService.update'),
      delete: (args: any) => withRetry(() => prisma.providerService.delete(args), 'providerService.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.providerService.deleteMany(args), 'providerService.deleteMany'),
    },
    
    // AdminAuditLog operations
    adminAuditLog: {
      findFirst: (args: any) => withRetry(() => prisma.adminAuditLog.findFirst(args), 'adminAuditLog.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.adminAuditLog.findMany(args), 'adminAuditLog.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.adminAuditLog.findUnique(args), 'adminAuditLog.findUnique'),
      count: (args: any) => withRetry(() => prisma.adminAuditLog.count(args), 'adminAuditLog.count'),
      create: (args: any) => withRetry(() => prisma.adminAuditLog.create(args), 'adminAuditLog.create'),
    },

    // VerificationToken operations
    verificationToken: {
      findFirst: (args: any) => withRetry(() => prisma.verificationToken.findFirst(args), 'verificationToken.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.verificationToken.findMany(args), 'verificationToken.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.verificationToken.findUnique(args), 'verificationToken.findUnique'),
      count: (args: any) => withRetry(() => prisma.verificationToken.count(args), 'verificationToken.count'),
      create: (args: any) => withRetry(() => prisma.verificationToken.create(args), 'verificationToken.create'),
      delete: (args: any) => withRetry(() => prisma.verificationToken.delete(args), 'verificationToken.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.verificationToken.deleteMany(args), 'verificationToken.deleteMany'),
    },

    // PasswordResetToken operations
    passwordResetToken: {
      findFirst: (args: any) => withRetry(() => prisma.passwordResetToken.findFirst(args), 'passwordResetToken.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.passwordResetToken.findMany(args), 'passwordResetToken.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.passwordResetToken.findUnique(args), 'passwordResetToken.findUnique'),
      count: (args: any) => withRetry(() => prisma.passwordResetToken.count(args), 'passwordResetToken.count'),
      create: (args: any) => withRetry(() => prisma.passwordResetToken.create(args), 'passwordResetToken.create'),
      delete: (args: any) => withRetry(() => prisma.passwordResetToken.delete(args), 'passwordResetToken.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.passwordResetToken.deleteMany(args), 'passwordResetToken.deleteMany'),
    },

    // BookingDraft operations
    bookingDraft: {
      findFirst: (args: any) => withRetry(() => prisma.bookingDraft.findFirst(args), 'bookingDraft.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.bookingDraft.findMany(args), 'bookingDraft.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.bookingDraft.findUnique(args), 'bookingDraft.findUnique'),
      count: (args: any) => withRetry(() => prisma.bookingDraft.count(args), 'bookingDraft.count'),
      create: (args: any) => withRetry(() => prisma.bookingDraft.create(args), 'bookingDraft.create'),
      update: (args: any) => withRetry(() => prisma.bookingDraft.update(args), 'bookingDraft.update'),
      delete: (args: any) => withRetry(() => prisma.bookingDraft.delete(args), 'bookingDraft.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.bookingDraft.deleteMany(args), 'bookingDraft.deleteMany'),
    },
    
    // Transaction operations
    $transaction: async (callback: any) => {
      // For transactions, we need to handle retries differently
      // because the callback needs to receive the transaction object
      let lastError: any;
      
      for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
        try {
          return await prisma.$transaction(callback);
        } catch (error) {
          lastError = error;
          
          if (attempt === RETRY_CONFIG.maxAttempts || !isRetryableError(error)) {
            console.error(`❌ db.$transaction failed after ${attempt} attempts:`, error);
            throw error;
          }
          
          console.warn(`⚠️ db.$transaction failed (attempt ${attempt}/${RETRY_CONFIG.maxAttempts}), retrying...`, error);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, getDelay(attempt)));
          
          // For connection errors, try to refresh the connection
          if (error.message && (error.message.includes('prepared statement') || error.message.includes('Engine is not yet connected') || error.message.includes('connection pool'))) {
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
    },
    
    // Raw query operations
    $queryRaw: (args: any) => withRetry(() => prisma.$queryRaw(args), 'db.$queryRaw'),
    $executeRaw: (args: any) => withRetry(() => prisma.$executeRaw(args), 'db.$executeRaw'),
    $disconnect: () => prisma.$disconnect(),
  };
};

// Create and export the database wrapper
export const db = createDbWrapper();