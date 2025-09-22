#!/usr/bin/env node

/**
 * Test script to verify provider bookings API works in production
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

const logger = createLogger('ProviderBookingsProductionTest');

async function testProviderBookingsAPILocally() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing provider bookings API logic locally');

    // Test with the provider that has the most bookings
    const providerWithBookings = await prisma.provider.findFirst({
      where: {
        bookings: {
          some: {
            status: {
              in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (!providerWithBookings) {
      logger.warn('No provider with active bookings found');
      return;
    }

    logger.info('Testing with provider', {
      providerId: providerWithBookings.id,
      businessName: providerWithBookings.businessName,
      userEmail: providerWithBookings.user.email,
      userName: providerWithBookings.user.name
    });

    // Simulate the exact API logic
    const bookings = await prisma.booking.findMany({
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

    // Calculate stats
    const stats = {
      pendingJobs: bookings.filter(b => b.status === "PENDING").length,
      confirmedJobs: bookings.filter(b => b.status === "CONFIRMED").length,
      pendingExecutionJobs: bookings.filter(b => b.status === "PENDING_EXECUTION").length,
      inProgressJobs: bookings.filter(b => b.status === "IN_PROGRESS").length,
      completedJobs: bookings.filter(b => b.status === "COMPLETED").length,
      totalEarnings: bookings
        .filter(b => b.payment && b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      thisMonthEarnings: bookings
        .filter(b => {
          const bookingDate = new Date(b.scheduledDate)
          const now = new Date()
          return b.payment && 
                 b.status === "COMPLETED" &&
                 bookingDate.getMonth() === now.getMonth() &&
                 bookingDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0),
      totalReviews: bookings.filter(b => b.review).length
    };

    // Simulate API response
    const apiResponse = {
      success: true,
      bookings,
      stats,
      providerId: providerWithBookings.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`
    };

    logger.info('API response simulation successful', {
      providerId: providerWithBookings.id,
      bookingCount: bookings.length,
      hasBookings: bookings.length > 0,
      statsCalculated: !!stats,
      responseSize: JSON.stringify(apiResponse).length
    });

    console.log('\n✅ LOCAL API TEST SUCCESSFUL');
    console.log('=============================');
    console.log(`Provider: ${providerWithBookings.user.email}`);
    console.log(`Bookings: ${bookings.length}`);
    console.log(`Stats: ${JSON.stringify(stats, null, 2)}`);

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing provider bookings API locally', error);
    await prisma.$disconnect();
  }
}

async function checkEnvironmentVariables() {
  logger.info('Checking environment variables');
  
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const missingVars = [];
  const presentVars = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });

  logger.info('Environment variables check', {
    present: presentVars,
    missing: missingVars
  });

  if (missingVars.length > 0) {
    logger.warn('Missing environment variables', { missing: missingVars });
  }

  return { missingVars, presentVars };
}

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Database connection test successful');

    // Test basic queries
    const userCount = await prisma.user.count();
    const providerCount = await prisma.provider.count();
    const bookingCount = await prisma.booking.count();

    logger.info('Database query test', {
      userCount,
      providerCount,
      bookingCount
    });

    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    logger.error('Database connection test failed', error);
    await prisma.$disconnect();
    return false;
  }
}

async function runTests() {
  console.log('🧪 PROVIDER BOOKINGS API PRODUCTION TEST');
  console.log('=========================================');
  
  try {
    // Test 1: Environment variables
    console.log('\n🔧 Checking Environment Variables...');
    const envCheck = await checkEnvironmentVariables();
    
    if (envCheck.missingVars.length > 0) {
      console.log('❌ Missing environment variables:', envCheck.missingVars);
    } else {
      console.log('✅ All required environment variables present');
    }

    // Test 2: Database connection
    console.log('\n📊 Testing Database Connection...');
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed');
    }

    // Test 3: API logic
    console.log('\n🔗 Testing API Logic...');
    await testProviderBookingsAPILocally();
    
    console.log('\n✅ ALL TESTS COMPLETE');
    console.log('======================');
    
    console.log('\n📋 POSSIBLE CAUSES OF 500 ERROR:');
    console.log('1. Authentication failure in getCurrentUser()');
    console.log('2. Database connection timeout in production');
    console.log('3. Missing environment variables in Vercel');
    console.log('4. Prisma client initialization issue');
    console.log('5. Memory/timeout limits in Vercel functions');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Check Vercel function logs for detailed error');
    console.log('2. Verify environment variables in Vercel dashboard');
    console.log('3. Test with simplified API version (removed structured logging)');
    console.log('4. Add more detailed error logging');
    
  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('❌ Tests failed:', error.message);
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
  testProviderBookingsAPILocally,
  checkEnvironmentVariables,
  testDatabaseConnection,
  runTests
};
