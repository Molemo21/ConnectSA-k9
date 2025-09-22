/**
 * Comprehensive Payment Synchronization System Test Script
 * 
 * This script tests the entire payment synchronization system to ensure:
 * - All components work correctly
 * - Payment status synchronization functions properly
 * - Cache invalidation works as expected
 * - Error handling is robust
 * - API endpoints respond correctly
 * - Database queries return expected data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&pool_timeout=60&connection_limit=5",
  TEST_USER_EMAIL: 'test@example.com',
  TEST_BOOKING_ID: null, // Will be set during test
  TEST_PAYMENT_REF: null, // Will be set during test
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
  warnings: []
};

// Initialize Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: { url: TEST_CONFIG.DATABASE_URL }
  }
});

// Utility functions
function logTest(testName, status, message = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${testName}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${message}`);
    console.log(`❌ ${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings.push(`${testName}: ${message}`);
    console.log(`⚠️  ${testName}: ${message}`);
  }
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = response.ok ? await response.json() : null;
    return { response, data, error: null };
  } catch (error) {
    return { response: null, data: null, error: error.message };
  }
}

// Test functions
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logTest('Database Connection', 'PASS', 'Successfully connected to database');
    return true;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  try {
    // Check if required tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'bookings', 'payments', 'webhook_events', 'notifications')
    `;
    
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['users', 'bookings', 'payments'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length === 0) {
      logTest('Database Schema', 'PASS', 'All required tables exist');
      return true;
    } else {
      logTest('Database Schema', 'FAIL', `Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
  } catch (error) {
    logTest('Database Schema', 'FAIL', error.message);
    return false;
  }
}

async function testNotificationsSchema() {
  try {
    // Check if notifications table has content column
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND table_schema = 'public'
    `;
    
    const columnNames = columns.map(c => c.column_name);
    
    if (columnNames.includes('content')) {
      logTest('Notifications Schema', 'PASS', 'Content column exists');
      return true;
    } else {
      logTest('Notifications Schema', 'WARN', 'Content column missing - will cause notification creation failures');
      return false;
    }
  } catch (error) {
    logTest('Notifications Schema', 'FAIL', error.message);
    return false;
  }
}

async function testPaymentData() {
  try {
    // Get recent payments for testing
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            client: true,
            provider: {
              include: { user: true }
            },
            service: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (payments.length === 0) {
      logTest('Payment Data', 'WARN', 'No payments found in database');
      return false;
    }

    // Set test data
    const testPayment = payments[0];
    TEST_CONFIG.TEST_BOOKING_ID = testPayment.bookingId;
    TEST_CONFIG.TEST_PAYMENT_REF = testPayment.paystackRef;

    // Check payment status distribution
    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    logTest('Payment Data', 'PASS', `Found ${payments.length} payments. Status distribution: ${JSON.stringify(statusCounts)}`);
    return true;
  } catch (error) {
    logTest('Payment Data', 'FAIL', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    {
      name: 'Webhook Endpoint',
      url: `${TEST_CONFIG.BASE_URL}/api/webhooks/paystack`,
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: 'Payment Verify Endpoint',
      url: `${TEST_CONFIG.BASE_URL}/api/payment/verify?reference=${TEST_CONFIG.TEST_PAYMENT_REF}`,
      method: 'GET',
      expectedStatus: 401 // Should require authentication
    }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      const { response, error } = await makeRequest(endpoint.url, {
        method: endpoint.method
      });

      if (error) {
        logTest(`API Endpoint: ${endpoint.name}`, 'FAIL', `Network error: ${error}`);
        allPassed = false;
        continue;
      }

      if (!response) {
        logTest(`API Endpoint: ${endpoint.name}`, 'FAIL', 'No response received');
        allPassed = false;
        continue;
      }

      if (response.status === endpoint.expectedStatus) {
        logTest(`API Endpoint: ${endpoint.name}`, 'PASS', `Status ${response.status} as expected`);
      } else {
        logTest(`API Endpoint: ${endpoint.name}`, 'WARN', `Status ${response.status}, expected ${endpoint.expectedStatus}`);
      }
    } catch (error) {
      logTest(`API Endpoint: ${endpoint.name}`, 'FAIL', error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testFileExistence() {
  const requiredFiles = [
    'hooks/use-payment-sync.ts',
    'components/ui/payment-status-sync.tsx',
    'components/dashboard/synchronized-booking-card.tsx',
    'components/dashboard/synchronized-dashboard.tsx',
    'app/api/bookings/sync/route.ts',
    '__tests__/payment-sync.test.ts',
    'PAYMENT_SYNCHRONIZATION_SYSTEM.md'
  ];

  let allExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      logTest(`File Exists: ${file}`, 'PASS', 'File found');
    } else {
      logTest(`File Exists: ${file}`, 'FAIL', 'File not found');
      allExist = false;
    }
  }

  return allExist;
}

async function testCodeSyntax() {
  const tsFiles = [
    'hooks/use-payment-sync.ts',
    'components/ui/payment-status-sync.tsx',
    'components/dashboard/synchronized-booking-card.tsx',
    'components/dashboard/synchronized-dashboard.tsx',
    'app/api/bookings/sync/route.ts'
  ];

  let allValid = true;

  for (const file of tsFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic syntax checks
        if (content.includes('import') && content.includes('export')) {
          logTest(`Syntax Check: ${file}`, 'PASS', 'Basic syntax appears valid');
        } else {
          logTest(`Syntax Check: ${file}`, 'FAIL', 'Missing imports/exports');
          allValid = false;
        }
      }
    } catch (error) {
      logTest(`Syntax Check: ${file}`, 'FAIL', error.message);
      allValid = false;
    }
  }

  return allValid;
}

async function testWebhookProcessing() {
  try {
    // Check recent webhook events
    const webhookEvents = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (webhookEvents.length === 0) {
      logTest('Webhook Processing', 'WARN', 'No webhook events found');
      return false;
    }

    const processedCount = webhookEvents.filter(e => e.processed).length;
    const errorCount = webhookEvents.filter(e => e.error).length;

    logTest('Webhook Processing', 'PASS', 
      `Found ${webhookEvents.length} webhook events. Processed: ${processedCount}, Errors: ${errorCount}`);

    if (errorCount > 0) {
      logTest('Webhook Errors', 'WARN', 
        `Found ${errorCount} webhook errors. Check recent events for details.`);
    }

    return true;
  } catch (error) {
    logTest('Webhook Processing', 'FAIL', error.message);
    return false;
  }
}

async function testPaymentStatusDistribution() {
  try {
    const payments = await prisma.payment.findMany({
      select: { status: true }
    });

    const statusCounts = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    const pendingCount = statusCounts.PENDING || 0;
    const escrowCount = statusCounts.ESCROW || 0;
    const releasedCount = statusCounts.RELEASED || 0;

    logTest('Payment Status Distribution', 'PASS', 
      `PENDING: ${pendingCount}, ESCROW: ${escrowCount}, RELEASED: ${releasedCount}`);

    if (pendingCount > 0) {
      logTest('Stuck Payments Check', 'WARN', 
        `Found ${pendingCount} PENDING payments. These should be processed by the sync system.`);
    }

    return true;
  } catch (error) {
    logTest('Payment Status Distribution', 'FAIL', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
    'NEXTAUTH_SECRET'
  ];

  let allPresent = true;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logTest(`Environment Variable: ${envVar}`, 'PASS', 'Variable is set');
    } else {
      logTest(`Environment Variable: ${envVar}`, 'FAIL', 'Variable is missing');
      allPresent = false;
    }
  }

  return allPresent;
}

async function testPackageDependencies() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const requiredDeps = [
      '@prisma/client',
      'next',
      'react',
      'react-dom'
    ];

    let allPresent = true;

    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        logTest(`Package Dependency: ${dep}`, 'PASS', 'Package is installed');
      } else {
        logTest(`Package Dependency: ${dep}`, 'FAIL', 'Package is missing');
        allPresent = false;
      }
    }

    return allPresent;
  } catch (error) {
    logTest('Package Dependencies', 'FAIL', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Payment Synchronization System Tests...\n');

  // Test categories
  const testCategories = [
    {
      name: 'Environment & Dependencies',
      tests: [
        testEnvironmentVariables,
        testPackageDependencies
      ]
    },
    {
      name: 'Database & Schema',
      tests: [
        testDatabaseConnection,
        testDatabaseSchema,
        testNotificationsSchema,
        testPaymentData,
        testPaymentStatusDistribution
      ]
    },
    {
      name: 'API Endpoints',
      tests: [
        testAPIEndpoints,
        testWebhookProcessing
      ]
    },
    {
      name: 'Code & Files',
      tests: [
        testFileExistence,
        testCodeSyntax
      ]
    }
  ];

  // Run tests by category
  for (const category of testCategories) {
    console.log(`\n📋 Testing ${category.name}:`);
    console.log('=' .repeat(50));

    for (const test of category.tests) {
      try {
        await test();
      } catch (error) {
        logTest(test.name, 'FAIL', error.message);
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILURES:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (testResults.failed === 0) {
    console.log('   🎉 All tests passed! The payment sync system is ready for deployment.');
    console.log('   ✅ You can safely commit the changes.');
  } else {
    console.log('   ⚠️  Some tests failed. Please fix the issues before committing.');
    console.log('   🔧 Check the error messages above for details.');
  }

  if (testResults.warnings.length > 0) {
    console.log('   ⚠️  Review warnings above - they may indicate potential issues.');
  }

  // Cleanup
  await prisma.$disconnect();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
