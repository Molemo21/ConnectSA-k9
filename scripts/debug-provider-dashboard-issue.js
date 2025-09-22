#!/usr/bin/env node

/**
 * Comprehensive diagnostic script to debug provider dashboard issue
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

const logger = createLogger('ProviderDashboardDebug');

async function debugProviderDashboardIssue() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Starting provider dashboard debug');

    // Step 1: Check all providers and their booking counts
    const providers = await prisma.provider.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        },
        bookings: {
          include: {
            service: true,
            client: true
          }
        }
      }
    });

    logger.info('All providers and their bookings', {
      providerCount: providers.length,
      providers: providers.map(p => ({
        id: p.id,
        businessName: p.businessName,
        status: p.status,
        userEmail: p.user.email,
        userName: p.user.name,
        totalBookings: p.bookings.length,
        bookingStatuses: p.bookings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {})
      }))
    });

    // Step 2: Check which providers have bookings in the correct statuses
    const activeProviders = providers.filter(p => 
      p.bookings.some(b => 
        ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"].includes(b.status)
      )
    );

    logger.info('Providers with active bookings', {
      activeProviderCount: activeProviders.length,
      activeProviders: activeProviders.map(p => ({
        id: p.id,
        businessName: p.businessName,
        userEmail: p.user.email,
        activeBookings: p.bookings.filter(b => 
          ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"].includes(b.status)
        ).length
      }))
    });

    // Step 3: Test the exact API query for each provider
    for (const provider of providers.slice(0, 3)) { // Test first 3 providers
      logger.info('Testing API query for provider', {
        providerId: provider.id,
        businessName: provider.businessName,
        userEmail: provider.user.email
      });

      try {
        const apiBookings = await prisma.booking.findMany({
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

        logger.info('API query result', {
          providerId: provider.id,
          bookingCount: apiBookings.length,
          bookings: apiBookings.map(b => ({
            id: b.id,
            status: b.status,
            serviceName: b.service?.name,
            clientName: b.client?.name
          }))
        });

      } catch (error) {
        logger.error('API query failed for provider', error, {
          providerId: provider.id,
          userEmail: provider.user.email
        });
      }
    }

    // Step 4: Check for potential authentication issues
    const providerUsers = await prisma.user.findMany({
      where: { role: 'PROVIDER' },
      include: {
        provider: true
      }
    });

    logger.info('Provider users authentication check', {
      providerUserCount: providerUsers.length,
      providerUsers: providerUsers.map(u => ({
        userId: u.id,
        email: u.email,
        name: u.name,
        hasProviderProfile: !!u.provider,
        providerId: u.provider?.id,
        providerStatus: u.provider?.status
      }))
    });

    // Step 5: Check for users without provider profiles
    const usersWithoutProvider = providerUsers.filter(u => !u.provider);
    if (usersWithoutProvider.length > 0) {
      logger.warn('Users with PROVIDER role but no provider profile', {
        count: usersWithoutProvider.length,
        users: usersWithoutProvider.map(u => ({
          userId: u.id,
          email: u.email,
          name: u.name
        }))
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error during provider dashboard debug', error);
    await prisma.$disconnect();
  }
}

async function testSpecificProvider() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing specific provider with bookings');

    // Find the provider with the most bookings
    const providerWithMostBookings = await prisma.provider.findFirst({
      where: {
        bookings: {
          some: {}
        }
      },
      include: {
        user: true,
        bookings: {
          include: {
            service: true,
            client: true,
            payment: true,
            review: true
          }
        }
      },
      orderBy: {
        bookings: {
          _count: 'desc'
        }
      }
    });

    if (providerWithMostBookings) {
      logger.info('Testing provider with most bookings', {
        providerId: providerWithMostBookings.id,
        businessName: providerWithMostBookings.businessName,
        userEmail: providerWithMostBookings.user.email,
        totalBookings: providerWithMostBookings.bookings.length
      });

      // Simulate the exact API call
      const apiBookings = await prisma.booking.findMany({
        where: {
          providerId: providerWithMostBookings.id,
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

      // Calculate stats
      const stats = {
        pendingJobs: apiBookings.filter(b => b.status === "PENDING").length,
        confirmedJobs: apiBookings.filter(b => b.status === "CONFIRMED").length,
        pendingExecutionJobs: apiBookings.filter(b => b.status === "PENDING_EXECUTION").length,
        inProgressJobs: apiBookings.filter(b => b.status === "IN_PROGRESS").length,
        completedJobs: apiBookings.filter(b => b.status === "COMPLETED").length,
        totalEarnings: apiBookings
          .filter(b => b.payment && b.status === "COMPLETED")
          .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
        thisMonthEarnings: apiBookings
          .filter(b => {
            const bookingDate = new Date(b.scheduledDate)
            const now = new Date()
            return b.payment && 
                   b.status === "COMPLETED" &&
                   bookingDate.getMonth() === now.getMonth() &&
                   bookingDate.getFullYear() === now.getFullYear()
          })
          .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
        averageRating: apiBookings
          .filter(b => b.review?.rating)
          .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0),
        totalReviews: apiBookings.filter(b => b.review).length
      };

      logger.info('API response simulation for provider with bookings', {
        providerId: providerWithMostBookings.id,
        apiBookingCount: apiBookings.length,
        stats,
        responseSize: JSON.stringify({ bookings: apiBookings, stats, providerId: providerWithMostBookings.id }).length
      });

    } else {
      logger.warn('No provider with bookings found');
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing specific provider', error);
    await prisma.$disconnect();
  }
}

async function runDebug() {
  console.log('🔍 PROVIDER DASHBOARD ISSUE DEBUG');
  console.log('==================================');
  
  try {
    // Debug 1: General provider dashboard issue
    console.log('\n📊 Debugging Provider Dashboard Issue...');
    await debugProviderDashboardIssue();
    
    // Debug 2: Test specific provider
    console.log('\n🎯 Testing Specific Provider...');
    await testSpecificProvider();
    
    console.log('\n✅ DEBUG COMPLETE');
    console.log('==================');
    
    console.log('\n📋 POSSIBLE CAUSES:');
    console.log('1. User logged in as provider with no bookings assigned');
    console.log('2. Provider profile exists but status is not APPROVED');
    console.log('3. Authentication issue - user not properly authenticated');
    console.log('4. API endpoint returning error due to database connection issue');
    console.log('5. Frontend calling wrong API endpoint or with wrong parameters');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check browser console for specific error messages');
    console.log('2. Check Vercel function logs for API errors');
    console.log('3. Verify which provider user is logged in');
    console.log('4. Test with a provider that has bookings');
    
  } catch (error) {
    logger.error('Debug execution failed', error);
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runDebug().catch((error) => {
    logger.error('Debug execution failed', error);
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  debugProviderDashboardIssue,
  testSpecificProvider,
  runDebug
};
