#!/usr/bin/env node

/**
 * Test script to simulate the actual API call that the frontend makes
 */

const { PrismaClient } = require('@prisma/client');

// Structured logging utility
const createLogger = (context) => ({
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

const logger = createLogger('ProviderAPICallTest');

async function simulateProviderAPICall() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Simulating provider API call');

    // Step 1: Get a provider user (simulating authentication)
    const providerUser = await prisma.user.findFirst({
      where: { 
        role: 'PROVIDER',
        provider: {
          isNot: null
        }
      },
      include: {
        provider: true
      }
    });

    if (!providerUser) {
      logger.warn('No provider user found');
      return;
    }

    logger.info('Found provider user', {
      userId: providerUser.id,
      userEmail: providerUser.email,
      userRole: providerUser.role,
      providerId: providerUser.provider?.id,
      businessName: providerUser.provider?.businessName
    });

    // Step 2: Simulate the exact API logic from /api/provider/bookings/route.ts
    logger.info('Simulating API logic');

    // Check if user is provider
    if (providerUser.role !== "PROVIDER") {
      logger.error('User is not a provider', { userRole: providerUser.role });
      return;
    }

    const provider = providerUser.provider;
    if (!provider) {
      logger.error('Provider profile not found', { userId: providerUser.id });
      return;
    }

    // Fetch bookings with the exact query from the API
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: {
          in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
        },
      },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { scheduledDate: "asc" },
    });

    logger.info('Bookings fetched successfully', {
      providerId: provider.id,
      bookingCount: bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        status: b.status,
        serviceName: b.service?.name,
        clientName: b.client?.name
      }))
    });

    // Calculate stats
    const pendingJobs = bookings.filter(b => b.status === "PENDING").length
    const confirmedJobs = bookings.filter(b => b.status === "CONFIRMED").length
    const pendingExecutionJobs = bookings.filter(b => b.status === "PENDING_EXECUTION").length
    const inProgressJobs = bookings.filter(b => b.status === "IN_PROGRESS").length
    const completedJobs = bookings.filter(b => b.status === "COMPLETED").length

    const totalEarnings = bookings
      .filter(b => b.payment && b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
    
    const thisMonthEarnings = bookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return b.payment && 
               b.status === "COMPLETED" &&
               bookingDate.getMonth() === now.getMonth() &&
               bookingDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

    const reviews = bookings.filter(b => b.review)
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / reviews.length 
      : 0

    const stats = {
      pendingJobs,
      confirmedJobs,
      pendingExecutionJobs,
      inProgressJobs,
      completedJobs,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews: reviews.length
    };

    logger.info('Stats calculated', { stats });

    // Simulate the API response
    const apiResponse = {
      bookings,
      stats,
      providerId: provider.id
    };

    logger.info('API response would be successful', {
      hasBookings: bookings.length > 0,
      hasStats: !!stats,
      hasProviderId: !!provider.id,
      responseSize: JSON.stringify(apiResponse).length
    });

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error simulating provider API call', error);
    await prisma.$disconnect();
  }
}

async function testAuthenticationFlow() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing authentication flow');

    // Test 1: Find users with different roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        provider: {
          select: {
            id: true,
            businessName: true,
            status: true
          }
        }
      },
      take: 5
    });

    logger.info('Sample users', {
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        hasProvider: !!u.provider,
        providerId: u.provider?.id,
        businessName: u.provider?.businessName,
        providerStatus: u.provider?.status
      }))
    });

    // Test 2: Find providers with different statuses
    const providers = await prisma.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      take: 5
    });

    logger.info('Sample providers', {
      providers: providers.map(p => ({
        id: p.id,
        businessName: p.businessName,
        status: p.status,
        userEmail: p.user.email,
        userRole: p.user.role
      }))
    });

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing authentication flow', error);
    await prisma.$disconnect();
  }
}

async function runTests() {
  console.log('🧪 PROVIDER API CALL SIMULATION');
  console.log('=================================');
  
  try {
    // Test 1: Authentication flow
    console.log('\n🔐 Testing Authentication Flow...');
    await testAuthenticationFlow();
    
    // Test 2: Provider API call simulation
    console.log('\n📞 Simulating Provider API Call...');
    await simulateProviderAPICall();
    
    console.log('\n✅ SIMULATION COMPLETE');
    console.log('========================');
    
  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('❌ Simulation failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch((error) => {
    logger.error('Test execution failed', error);
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  simulateProviderAPICall,
  testAuthenticationFlow,
  runTests
};
