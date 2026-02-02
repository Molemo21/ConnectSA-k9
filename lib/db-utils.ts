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
// Ensure Prisma connection is established with timeout
async function ensureConnection(): Promise<void> {
  if (!prisma) {
    throw new Error('Prisma client not available in this environment');
  }

  // Check if custom connect method exists (PrismaWithRetry)
  if (typeof (prisma as any).connect === 'function') {
    try {
      // Add timeout to connection attempts (8 seconds max)
      const connectionTimeout = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000);
      });

      const connectPromise = (prisma as any).connect();
      await Promise.race([connectPromise, connectionTimeout]);
      return;
    } catch (error) {
      // If custom connect fails, try standard $connect
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout')) {
        console.warn('⚠️ Custom connect() timed out, trying $connect():', error);
      } else {
        console.warn('⚠️ Custom connect() failed, trying $connect():', error);
      }
    }
  }

  // Try standard Prisma $connect with timeout
  try {
    const connectionTimeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000);
    });

    const connectPromise = prisma.$connect();
    await Promise.race([connectPromise, connectionTimeout]);
  } catch (error) {
    // Connection might already be established
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('already connected') || errorMessage.includes('already been connected')) {
      // Connection is already established, this is fine
      return;
    }
    
    // If it's a timeout, we need to verify the connection is actually working
    if (errorMessage.includes('timeout')) {
      console.warn('⚠️ Connection attempt timed out, verifying connection...');
      // Try a simple query to verify connection
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Connection verified despite timeout');
        return;
      } catch (verifyError) {
        throw new Error(`Connection timeout and verification failed: ${verifyError}`);
      }
    }
    
    throw error;
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  // Check if Prisma client is available
  if (!prisma) {
    throw new Error(`Cannot execute ${context} - Prisma client not available in this environment`);
  }

  // Ensure connection before first attempt - this is critical
  try {
    await ensureConnection();
  } catch (connectError) {
    const errorMessage = connectError instanceof Error ? connectError.message : String(connectError);
    // If connection fails, try to verify with a simple query
    if (errorMessage.includes('timeout')) {
      console.warn(`⚠️ Connection check timed out for ${context}, verifying with test query...`);
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log(`✅ Connection verified for ${context}`);
      } catch (verifyError) {
        console.error(`❌ Connection verification failed for ${context}:`, verifyError);
        throw new Error(`Cannot execute ${context} - Prisma connection failed: ${errorMessage}`);
      }
    } else {
      console.warn(`⚠️ Connection check failed for ${context}, proceeding anyway:`, connectError);
    }
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('prepared statement') || errorMessage.includes('Engine is not yet connected') || errorMessage.includes('connection pool')) {
        console.log('🔄 Attempting to refresh Prisma connection...');
        try {
          // Try to disconnect first (ignore errors)
          try {
            await prisma.$disconnect();
          } catch (disconnectError) {
            // Ignore disconnect errors
          }
          
          // Reconnect using custom method if available
          await ensureConnection();
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
      },
      catalogueItem: {
        findFirst: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        create: () => Promise.resolve(null),
        update: () => Promise.resolve(null),
        delete: () => Promise.resolve(null),
        upsert: () => Promise.resolve(null),
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
      pushSubscription: {
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
    
    // Notification operations
    notification: {
      findFirst: (args: any) => withRetry(() => prisma.notification.findFirst(args), 'notification.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.notification.findMany(args), 'notification.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.notification.findUnique(args), 'notification.findUnique'),
      count: (args: any) => withRetry(() => prisma.notification.count(args), 'notification.count'),
      create: (args: any) => withRetry(() => prisma.notification.create(args), 'notification.create'),
      update: (args: any) => withRetry(() => prisma.notification.update(args), 'notification.update'),
      updateMany: (args: any) => withRetry(() => prisma.notification.updateMany(args), 'notification.updateMany'),
      delete: (args: any) => withRetry(() => prisma.notification.delete(args), 'notification.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.notification.deleteMany(args), 'notification.deleteMany'),
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
    
    // CatalogueItem operations
    catalogueItem: {
      findFirst: (args: any) => withRetry(() => prisma.catalogueItem.findFirst(args), 'catalogueItem.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.catalogueItem.findMany(args), 'catalogueItem.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.catalogueItem.findUnique(args), 'catalogueItem.findUnique'),
      count: (args: any) => withRetry(() => prisma.catalogueItem.count(args), 'catalogueItem.count'),
      create: (args: any) => withRetry(() => prisma.catalogueItem.create(args), 'catalogueItem.create'),
      update: (args: any) => withRetry(() => prisma.catalogueItem.update(args), 'catalogueItem.update'),
      delete: (args: any) => withRetry(() => prisma.catalogueItem.delete(args), 'catalogueItem.delete'),
      upsert: (args: any) => withRetry(() => prisma.catalogueItem.upsert(args), 'catalogueItem.upsert'),
    },

    // PushSubscription operations
    pushSubscription: {
      findFirst: (args: any) => withRetry(() => prisma.pushSubscription.findFirst(args), 'pushSubscription.findFirst'),
      findMany: (args: any) => withRetry(() => prisma.pushSubscription.findMany(args), 'pushSubscription.findMany'),
      findUnique: (args: any) => withRetry(() => prisma.pushSubscription.findUnique(args), 'pushSubscription.findUnique'),
      count: (args: any) => withRetry(() => prisma.pushSubscription.count(args), 'pushSubscription.count'),
      create: (args: any) => withRetry(() => prisma.pushSubscription.create(args), 'pushSubscription.create'),
      update: (args: any) => withRetry(() => prisma.pushSubscription.update(args), 'pushSubscription.update'),
      delete: (args: any) => withRetry(() => prisma.pushSubscription.delete(args), 'pushSubscription.delete'),
      deleteMany: (args: any) => withRetry(() => prisma.pushSubscription.deleteMany(args), 'pushSubscription.deleteMany'),
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