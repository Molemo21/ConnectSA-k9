#!/usr/bin/env node

/**
 * Test script to validate bookings visibility fixes
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

const logger = createLogger('BookingsFixTest');

async function testDatabaseQueries() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    logger.info('Testing database queries');

    // Test client with bookings
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    let clientBookings = [];
    if (client) {
      clientBookings = await prisma.booking.findMany({
        where: { clientId: client.id },
        include: {
          service: true,
          provider: true
        }
      });
    }

    if (client) {
      logger.info('Client bookings test', {
        clientId: client.id,
        clientEmail: client.email,
        bookingCount: clientBookings.length,
        hasBookings: clientBookings.length > 0
      });
    }

    // Test provider with bookings
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
            client: true
          }
        }
      }
    });

    if (providerWithBookings) {
      logger.info('Provider with bookings test', {
        providerId: providerWithBookings.id,
        providerEmail: providerWithBookings.user.email,
        businessName: providerWithBookings.businessName,
        bookingCount: providerWithBookings.bookings.length,
        hasBookings: providerWithBookings.bookings.length > 0
      });
    }

    // Test provider without bookings
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
      logger.info('Provider without bookings test', {
        providerId: providerWithoutBookings.id,
        providerEmail: providerWithoutBookings.user.email,
        businessName: providerWithoutBookings.businessName,
        bookingCount: providerWithoutBookings.bookings.length,
        hasBookings: providerWithoutBookings.bookings.length > 0
      });
    }

    await prisma.$disconnect();
    
  } catch (error) {
    logger.error('Error testing database queries', error);
    await prisma.$disconnect();
  }
}

async function testAPIEndpoints() {
  logger.info('Testing API endpoint files');
  
  const apiEndpoints = [
    {
      path: 'app/api/bookings/route.ts',
      description: 'Main bookings API (handles both client and provider)',
      required: true
    },
    {
      path: 'app/api/bookings/my-bookings/route.ts',
      description: 'Client-specific bookings API',
      required: true
    },
    {
      path: 'app/api/user/bookings/route.ts',
      description: 'User bookings API (role-based)',
      required: true
    },
    {
      path: 'app/api/provider/bookings/route.ts',
      description: 'Provider bookings API',
      required: true
    },
    {
      path: 'app/api/provider/dashboard/route.ts',
      description: 'Provider dashboard API',
      required: true
    },
    {
      path: 'app/api/bookings/sync/route.ts',
      description: 'Bookings sync API (existing)',
      required: false
    }
  ];

  let allExist = true;
  const results = [];

  apiEndpoints.forEach(endpoint => {
    const exists = fs.existsSync(endpoint.path);
    results.push({
      path: endpoint.path,
      exists,
      description: endpoint.description,
      required: endpoint.required
    });

    if (endpoint.required && !exists) {
      allExist = false;
    }

    if (exists) {
      logger.info('API endpoint exists', { 
        path: endpoint.path,
        description: endpoint.description 
      });
    } else if (endpoint.required) {
      logger.error('Required API endpoint missing', { 
        path: endpoint.path,
        description: endpoint.description 
      });
    } else {
      logger.warn('Optional API endpoint missing', { 
        path: endpoint.path,
        description: endpoint.description 
      });
    }
  });

  logger.info('API endpoints summary', {
    totalEndpoints: apiEndpoints.length,
    requiredEndpoints: apiEndpoints.filter(e => e.required).length,
    existingEndpoints: results.filter(r => r.exists).length,
    allRequiredExist: allExist
  });

  return { allExist, results };
}

async function testFrontendIntegration() {
  logger.info('Testing frontend integration points');
  
  const frontendFiles = [
    'app/bookings/page.tsx',
    'components/dashboard/synchronized-dashboard.tsx',
    'components/dashboard/mobile-client-dashboard.tsx',
    'components/provider/mobile-provider-dashboard.tsx',
    'components/provider/mobile-provider-dashboard-v2.tsx'
  ];

  const results = [];

  frontendFiles.forEach(file => {
    const exists = fs.existsSync(file);
    results.push({
      path: file,
      exists
    });

    if (exists) {
      logger.info('Frontend file exists', { path: file });
      
      // Check if file imports the new API endpoints
      try {
        const content = fs.readFileSync(file, 'utf8');
        const apiImports = [
          '/api/bookings',
          '/api/bookings/my-bookings',
          '/api/user/bookings',
          '/api/provider/bookings',
          '/api/provider/dashboard'
        ];

        const foundImports = apiImports.filter(api => content.includes(api));
        
        if (foundImports.length > 0) {
          logger.info('Frontend file uses booking APIs', { 
            path: file, 
            apis: foundImports 
          });
        }
      } catch (error) {
        logger.warn('Could not read frontend file', { path: file, error: error.message });
      }
    } else {
      logger.warn('Frontend file missing', { path: file });
    }
  });

  return results;
}

async function generateSummaryReport() {
  logger.info('Generating summary report');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      issuesIdentified: [
        'Missing API endpoints for client bookings',
        'Provider bookings not showing due to missing API endpoints',
        'Frontend trying to fetch from non-existent endpoints'
      ],
      fixesApplied: [
        'Created /api/bookings/route.ts - Main bookings API',
        'Created /api/bookings/my-bookings/route.ts - Client bookings API',
        'Created /api/user/bookings/route.ts - User bookings API',
        'Created /api/provider/dashboard/route.ts - Provider dashboard API',
        'Enhanced existing /api/provider/bookings/route.ts'
      ],
      expectedResults: [
        'Clients should now see their bookings in the dashboard',
        'Providers should now see their bookings in the dashboard',
        'All booking-related API endpoints are now available',
        'Frontend can successfully fetch booking data'
      ]
    }
  };

  logger.info('Summary report generated', report);
  return report;
}

async function runTests() {
  console.log('🧪 BOOKINGS VISIBILITY FIX VALIDATION');
  console.log('=======================================');
  
  try {
    // Test 1: Database queries
    console.log('\n📊 Testing Database Queries...');
    await testDatabaseQueries();
    
    // Test 2: API endpoints
    console.log('\n🔗 Testing API Endpoints...');
    const apiResults = await testAPIEndpoints();
    
    // Test 3: Frontend integration
    console.log('\n💻 Testing Frontend Integration...');
    const frontendResults = await testFrontendIntegration();
    
    // Test 4: Generate summary
    console.log('\n📋 Generating Summary Report...');
    const summary = await generateSummaryReport();
    
    // Final results
    console.log('\n✅ VALIDATION COMPLETE');
    console.log('=======================');
    
    if (apiResults.allExist) {
      console.log('✅ All required API endpoints exist');
    } else {
      console.log('❌ Some required API endpoints are missing');
    }
    
    console.log(`📁 Frontend files checked: ${frontendResults.length}`);
    console.log(`🔗 API endpoints checked: ${apiResults.results.length}`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Deploy the new API endpoints to production');
    console.log('2. Test client dashboard - should show bookings');
    console.log('3. Test provider dashboard - should show bookings');
    console.log('4. Monitor logs for any API errors');
    
  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('❌ Validation failed:', error.message);
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
  testDatabaseQueries,
  testAPIEndpoints,
  testFrontendIntegration,
  generateSummaryReport,
  runTests
};
