#!/usr/bin/env node

/**
 * Live test of provider dashboard API to identify the specific error
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

const logger = createLogger('ProviderDashboardLiveTest');

async function testProviderDashboardLive() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing provider dashboard live functionality');

    // Test 1: Find providers with active bookings
    const providersWithBookings = await prisma.provider.findMany({
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

    logger.info('Found providers with bookings', {
      providerCount: providersWithBookings.length,
      providers: providersWithBookings.map(p => ({
        id: p.id,
        businessName: p.businessName,
        userEmail: p.user.email,
        bookingCount: p.bookings.length
      }))
    });

    if (providersWithBookings.length === 0) {
      logger.warn('No providers with bookings found');
      
      // Check if there are any providers at all
      const allProviders = await prisma.provider.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          bookings: true
        }
      });
      
      logger.info('All providers in database', {
        totalProviders: allProviders.length,
        providers: allProviders.map(p => ({
          id: p.id,
          businessName: p.businessName,
          userEmail: p.user.email,
          totalBookings: p.bookings.length,
          status: p.status
        }))
      });
      
      return;
    }

    // Test 2: Simulate the exact API logic for each provider
    for (const provider of providersWithBookings) {
      logger.info('Testing provider API logic', {
        providerId: provider.id,
        businessName: provider.businessName,
        userEmail: provider.user.email
      });

      try {
        // Simulate the exact logic from app/api/provider/bookings/route.ts
        const bookings = provider.bookings;
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

        const apiResponse = {
          success: true,
          bookings,
          stats,
          providerId: provider.id,
          message: bookings.length === 0 
            ? "No active bookings found. Your bookings will appear here when clients book your services."
            : `Found ${bookings.length} active bookings`
        };

        logger.info('Provider API simulation successful', {
          providerId: provider.id,
          bookingCount: bookings.length,
          hasBookings: bookings.length > 0,
          statsCalculated: !!stats,
          responseSize: JSON.stringify(apiResponse).length
        });

        // Test 3: Check bank details
        const hasBankDetails = !!(
          provider.bankName &&
          provider.bankCode &&
          provider.accountNumber &&
          provider.accountName
        );

        logger.info('Provider bank details check', {
          providerId: provider.id,
          hasBankDetails,
          bankName: !!provider.bankName,
          bankCode: !!provider.bankCode,
          accountNumber: !!provider.accountNumber,
          accountName: !!provider.accountName
        });

      } catch (error) {
        logger.error('Error simulating provider API', error, {
          providerId: provider.id
        });
      }
    }

    // Test 4: Check for any potential issues
    logger.info('Checking for potential issues');

    // Check for providers without user records
    const providersWithoutUsers = await prisma.provider.findMany({
      where: {
        user: null
      }
    });

    if (providersWithoutUsers.length > 0) {
      logger.warn('Found providers without user records', {
        count: providersWithoutUsers.length,
        providerIds: providersWithoutUsers.map(p => p.id)
      });
    }

    // Check for users with PROVIDER role but no provider record
    const usersWithoutProvider = await prisma.user.findMany({
      where: {
        role: 'PROVIDER',
        provider: null
      }
    });

    if (usersWithoutProvider.length > 0) {
      logger.warn('Found users with PROVIDER role but no provider record', {
        count: usersWithoutProvider.length,
        userIds: usersWithoutProvider.map(u => u.id)
      });
    }

    console.log('\n✅ PROVIDER DASHBOARD LIVE TEST COMPLETE');
    console.log('==========================================');
    console.log(`Providers with bookings: ${providersWithBookings.length}`);
    
    if (providersWithBookings.length > 0) {
      console.log('\n📋 PROVIDER DETAILS:');
      providersWithBookings.forEach(provider => {
        console.log(`  • ${provider.user.email} (${provider.businessName})`);
        console.log(`    - Bookings: ${provider.bookings.length}`);
        console.log(`    - Status: ${provider.status}`);
        console.log(`    - Has bank details: ${!!(provider.bankName && provider.bankCode && provider.accountNumber && provider.accountName)}`);
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error in provider dashboard live test', error);
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  testProviderDashboardLive().catch((error) => {
    logger.error('Script execution failed', error);
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testProviderDashboardLive
};
