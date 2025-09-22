#!/usr/bin/env node

/**
 * Script to fix empty provider dashboard issue
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

const logger = createLogger('EmptyProviderDashboardFix');

async function analyzeEmptyProviders() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Analyzing providers with empty dashboards');

    // Find providers with no bookings
    const providersWithNoBookings = await prisma.provider.findMany({
      where: {
        bookings: {
          none: {}
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    logger.info('Providers with no bookings', {
      count: providersWithNoBookings.length,
      providers: providersWithNoBookings.map(p => ({
        id: p.id,
        businessName: p.businessName,
        status: p.status,
        userEmail: p.user.email,
        userName: p.user.name
      }))
    });

    // Find providers with bookings but no active bookings
    const providersWithInactiveBookings = await prisma.provider.findMany({
      where: {
        bookings: {
          some: {
            status: {
              notIn: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        bookings: true
      }
    });

    logger.info('Providers with only inactive bookings', {
      count: providersWithInactiveBookings.length,
      providers: providersWithInactiveBookings.map(p => ({
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

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error analyzing empty providers', error);
    await prisma.$disconnect();
  }
}

async function suggestSolutions() {
  logger.info('Suggesting solutions for empty provider dashboard');
  
  console.log('\n🔧 SOLUTIONS FOR EMPTY PROVIDER DASHBOARD:');
  console.log('===========================================');
  
  console.log('\n1. 🎯 FRONTEND FIX - Handle Empty State Properly:');
  console.log('   - Update provider dashboard to show "No bookings yet" message');
  console.log('   - Add helpful text: "Your bookings will appear here once clients book your services"');
  console.log('   - Show provider profile completion status if INCOMPLETE');
  console.log('   - Add call-to-action to complete profile or promote services');
  
  console.log('\n2. 📊 BACKEND FIX - Improve API Response:');
  console.log('   - Return success response even with empty bookings array');
  console.log('   - Include provider status and completion info in response');
  console.log('   - Add helpful messages for different provider states');
  
  console.log('\n3. 🚀 BUSINESS FIX - Help Providers Get Bookings:');
  console.log('   - Assign some test bookings to providers with no bookings');
  console.log('   - Improve provider onboarding flow');
  console.log('   - Add provider profile completion incentives');
  
  console.log('\n4. 🔍 DEBUGGING FIX - Better Error Handling:');
  console.log('   - Distinguish between "no bookings" and "API error"');
  console.log('   - Add provider status indicators in dashboard');
  console.log('   - Show provider profile completion percentage');
  
  console.log('\n📋 IMMEDIATE ACTION ITEMS:');
  console.log('1. Check which provider user is currently logged in');
  console.log('2. If logged in as provider with no bookings, that explains the empty dashboard');
  console.log('3. Test with provider that has bookings (thabangnakin17@gmail.com)');
  console.log('4. Update frontend to handle empty state gracefully');
}

async function testProviderWithBookings() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing provider with bookings for comparison');

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
            name: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
            }
          }
        }
      }
    });

    if (providerWithBookings) {
      logger.info('Provider with bookings for testing', {
        providerId: providerWithBookings.id,
        businessName: providerWithBookings.businessName,
        userEmail: providerWithBookings.user.email,
        userName: providerWithBookings.user.name,
        activeBookings: providerWithBookings.bookings.length
      });

      console.log('\n✅ TEST ACCOUNT FOR PROVIDER DASHBOARD:');
      console.log(`   Email: ${providerWithBookings.user.email}`);
      console.log(`   Name: ${providerWithBookings.user.name}`);
      console.log(`   Business: ${providerWithBookings.businessName || 'N/A'}`);
      console.log(`   Active Bookings: ${providerWithBookings.bookings.length}`);
      console.log('   → This provider should see bookings in dashboard');
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing provider with bookings', error);
    await prisma.$disconnect();
  }
}

async function runFix() {
  console.log('🔧 EMPTY PROVIDER DASHBOARD FIX');
  console.log('================================');
  
  try {
    // Step 1: Analyze empty providers
    console.log('\n📊 Analyzing Empty Providers...');
    await analyzeEmptyProviders();
    
    // Step 2: Test provider with bookings
    console.log('\n🎯 Testing Provider With Bookings...');
    await testProviderWithBookings();
    
    // Step 3: Suggest solutions
    console.log('\n💡 Suggesting Solutions...');
    await suggestSolutions();
    
    console.log('\n✅ ANALYSIS COMPLETE');
    console.log('=====================');
    
  } catch (error) {
    logger.error('Fix execution failed', error);
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runFix().catch((error) => {
    logger.error('Fix execution failed', error);
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  analyzeEmptyProviders,
  suggestSolutions,
  testProviderWithBookings,
  runFix
};
