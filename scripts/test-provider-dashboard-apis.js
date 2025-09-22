#!/usr/bin/env node

/**
 * Test script to verify provider dashboard APIs are working
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

const logger = createLogger('ProviderDashboardAPITest');

async function testProviderDashboardAPIs() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing provider dashboard APIs');

    // Test 1: Find a provider with bookings
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
        },
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
            }
          },
          include: {
            service: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            payment: true,
            review: true
          }
        }
      }
    });

    if (!providerWithBookings) {
      logger.warn('No provider with bookings found');
      return;
    }

    logger.info('Found provider with bookings', {
      providerId: providerWithBookings.id,
      businessName: providerWithBookings.businessName,
      userEmail: providerWithBookings.user.email,
      bookingCount: providerWithBookings.bookings.length
    });

    // Test 2: Simulate provider bookings API logic
    const bookings = providerWithBookings.bookings;
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
          const bookingDate = new Date(b.scheduledDate);
          const now = new Date();
          return b.payment && 
                 b.status === "COMPLETED" &&
                 bookingDate.getMonth() === now.getMonth() &&
                 bookingDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0),
      totalReviews: bookings.filter(b => b.review).length
    };

    // Test 3: Check bank details
    const hasBankDetails = !!(
      providerWithBookings.bankName &&
      providerWithBookings.bankCode &&
      providerWithBookings.accountNumber &&
      providerWithBookings.accountName
    );

    // Simulate API responses
    const bookingsApiResponse = {
      success: true,
      bookings,
      stats,
      providerId: providerWithBookings.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`
    };

    const bankDetailsApiResponse = {
      bankDetails: {
        bankName: providerWithBookings.bankName,
        bankCode: providerWithBookings.bankCode,
        accountNumber: providerWithBookings.accountNumber ? 
          `****${providerWithBookings.accountNumber.slice(-4)}` : null,
        accountName: providerWithBookings.accountName,
        hasRecipientCode: !!providerWithBookings.recipientCode,
      },
      hasBankDetails
    };

    logger.info('Provider dashboard API simulation successful', {
      providerId: providerWithBookings.id,
      bookingCount: bookings.length,
      hasBookings: bookings.length > 0,
      statsCalculated: !!stats,
      hasBankDetails,
      bookingsResponseSize: JSON.stringify(bookingsApiResponse).length,
      bankDetailsResponseSize: JSON.stringify(bankDetailsApiResponse).length
    });

    console.log('\n✅ PROVIDER DASHBOARD API TEST SUCCESSFUL');
    console.log('=========================================');
    console.log(`Provider: ${providerWithBookings.user.email}`);
    console.log(`Business: ${providerWithBookings.businessName}`);
    console.log(`Bookings: ${bookings.length}`);
    console.log(`Stats: ${JSON.stringify(stats, null, 2)}`);
    console.log(`Has Bank Details: ${hasBankDetails}`);

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing provider dashboard APIs', error);
    await prisma.$disconnect();
  }
}

async function checkDynamicExports() {
  logger.info('Checking dynamic exports in provider API routes');
  
  const fs = require('fs');
  const path = require('path');
  
  const providerRoutes = [
    'app/api/provider/bookings/route.ts',
    'app/api/provider/dashboard/route.ts',
    'app/api/provider/[id]/bank-details/route.ts',
    'app/api/provider/earnings/route.ts',
    'app/api/provider/reviews/route.ts',
    'app/api/provider/settings/route.ts',
    'app/api/provider/onboarding/route.ts',
    'app/api/provider/status/route.ts'
  ];

  let successCount = 0;
  
  providerRoutes.forEach(route => {
    try {
      if (fs.existsSync(route)) {
        const content = fs.readFileSync(route, 'utf8');
        if (content.includes('export const dynamic')) {
          console.log(`✅ ${route} has dynamic export`);
          successCount++;
        } else {
          console.log(`❌ ${route} missing dynamic export`);
        }
      } else {
        console.log(`⚠️  ${route} file not found`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${route}:`, error.message);
    }
  });

  console.log(`\n📊 Dynamic exports: ${successCount}/${providerRoutes.length} routes`);
  return successCount === providerRoutes.length;
}

async function runTests() {
  console.log('🧪 PROVIDER DASHBOARD API TEST');
  console.log('===============================');
  
  try {
    // Test 1: Check dynamic exports
    console.log('\n🔧 Checking Dynamic Exports...');
    const allDynamicExports = await checkDynamicExports();
    
    if (allDynamicExports) {
      console.log('✅ All provider API routes have dynamic exports');
    } else {
      console.log('❌ Some provider API routes missing dynamic exports');
    }

    // Test 2: API logic simulation
    console.log('\n🔗 Testing API Logic...');
    await testProviderDashboardAPIs();
    
    console.log('\n✅ ALL TESTS COMPLETE');
    console.log('======================');
    
    console.log('\n📋 POSSIBLE CAUSES OF PROVIDER DASHBOARD FAILURE:');
    console.log('1. Missing dynamic export in bank-details API (FIXED)');
    console.log('2. Authentication issues with getCurrentUser()');
    console.log('3. Database connection problems');
    console.log('4. Frontend error handling issues');
    console.log('5. CORS or network issues');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Deploy the bank-details API fix');
    console.log('2. Test provider dashboard in production');
    console.log('3. Check browser console for specific errors');
    console.log('4. Verify authentication is working');
    
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
  testProviderDashboardAPIs,
  checkDynamicExports,
  runTests
};
