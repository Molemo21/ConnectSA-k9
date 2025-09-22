#!/usr/bin/env node

/**
 * Test script to debug provider bookings API issue
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

const logger = createLogger('ProviderBookingsTest');

async function testProviderBookingsAPI() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing provider bookings API logic');

    // Test 1: Find a provider with bookings
    const providerWithBookings = await prisma.provider.findFirst({
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
      }
    });

    if (providerWithBookings) {
      logger.info('Found provider with bookings', {
        providerId: providerWithBookings.id,
        businessName: providerWithBookings.businessName,
        userEmail: providerWithBookings.user.email,
        bookingCount: providerWithBookings.bookings.length
      });

      // Test 2: Simulate the exact query from the API
      const apiBookings = await prisma.booking.findMany({
        where: {
          providerId: providerWithBookings.id,
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

      logger.info('API query results', {
        providerId: providerWithBookings.id,
        filteredBookingCount: apiBookings.length,
        bookings: apiBookings.map(b => ({
          id: b.id,
          status: b.status,
          serviceName: b.service?.name,
          clientName: b.client?.name,
          hasPayment: !!b.payment,
          hasReview: !!b.review
        }))
      });

      // Test 3: Calculate stats like the API does
      const pendingJobs = apiBookings.filter(b => b.status === "PENDING").length
      const confirmedJobs = apiBookings.filter(b => b.status === "CONFIRMED").length
      const pendingExecutionJobs = apiBookings.filter(b => b.status === "PENDING_EXECUTION").length
      const inProgressJobs = apiBookings.filter(b => b.status === "IN_PROGRESS").length
      const completedJobs = apiBookings.filter(b => b.status === "COMPLETED").length

      const totalEarnings = apiBookings
        .filter(b => b.payment && b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
      
      const thisMonthEarnings = apiBookings
        .filter(b => {
          const bookingDate = new Date(b.scheduledDate)
          const now = new Date()
          return b.payment && 
                 b.status === "COMPLETED" &&
                 bookingDate.getMonth() === now.getMonth() &&
                 bookingDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

      const reviews = apiBookings.filter(b => b.review)
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

      logger.info('Calculated stats', { stats });

      // Test 4: Simulate the API response
      const apiResponse = {
        bookings: apiBookings,
        stats: stats,
        providerId: providerWithBookings.id
      };

      logger.info('API response simulation', {
        responseSize: JSON.stringify(apiResponse).length,
        hasBookings: apiBookings.length > 0,
        hasStats: !!stats,
        hasProviderId: !!providerWithBookings.id
      });

    } else {
      logger.warn('No provider with bookings found');
    }

    // Test 5: Test providers without bookings
    const providerWithoutBookings = await prisma.provider.findFirst({
      where: {
        bookings: {
          none: {}
        }
      },
      include: {
        user: true,
        bookings: true
      }
    });

    if (providerWithoutBookings) {
      logger.info('Found provider without bookings', {
        providerId: providerWithoutBookings.id,
        businessName: providerWithoutBookings.businessName,
        userEmail: providerWithoutBookings.user.email,
        bookingCount: providerWithoutBookings.bookings.length
      });

      // Test API query for provider without bookings
      const emptyApiBookings = await prisma.booking.findMany({
        where: {
          providerId: providerWithoutBookings.id,
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

      logger.info('Empty provider API query results', {
        providerId: providerWithoutBookings.id,
        bookingCount: emptyApiBookings.length
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing provider bookings API', error);
    await prisma.$disconnect();
  }
}

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing database connection');

    // Test basic connection
    const userCount = await prisma.user.count();
    logger.info('Database connection test', { userCount });

    // Test provider count
    const providerCount = await prisma.provider.count();
    logger.info('Provider count test', { providerCount });

    // Test booking count
    const bookingCount = await prisma.booking.count();
    logger.info('Booking count test', { bookingCount });

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Database connection test failed', error);
    await prisma.$disconnect();
  }
}

async function runTests() {
  console.log('🧪 PROVIDER BOOKINGS API DEBUG');
  console.log('===============================');
  
  try {
    // Test 1: Database connection
    console.log('\n📊 Testing Database Connection...');
    await testDatabaseConnection();
    
    // Test 2: Provider bookings API logic
    console.log('\n🔗 Testing Provider Bookings API Logic...');
    await testProviderBookingsAPI();
    
    console.log('\n✅ DEBUG COMPLETE');
    console.log('==================');
    
  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('❌ Debug failed:', error.message);
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
  testProviderBookingsAPI,
  testDatabaseConnection,
  runTests
};
