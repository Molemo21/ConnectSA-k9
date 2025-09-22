#!/usr/bin/env node

/**
 * Comprehensive validation script for payment system fixes
 * Tests all components without requiring a running server
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

const logger = createLogger('PaymentValidation');

async function validateDatabaseSchema() {
  logger.info('Validating database schema');
  
  const prisma = new PrismaClient();
  const results = {
    paymentsTable: false,
    requiredFields: false,
    indexes: false,
    constraints: false
  };

  try {
    await prisma.$connect();
    logger.info('✅ Database connection successful');

    // Check if payments table exists and has required fields
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position;
    `;

    const columns = tableInfo.map(col => col.column_name);
    const requiredFields = [
      'id', 'bookingId', 'user_id', 'amount', 'paystackRef', 'status',
      'escrow_amount', 'platform_fee', 'currency', 'transaction_id',
      'authorization_url', 'access_code', 'error_message', 'provider_response',
      'paidAt', 'createdAt', 'updatedAt'
    ];

    const missingFields = requiredFields.filter(field => !columns.includes(field));
    
    if (missingFields.length === 0) {
      results.paymentsTable = true;
      results.requiredFields = true;
      logger.info('✅ Payments table has all required fields');
    } else {
      logger.warn('❌ Missing fields in payments table', { missingFields });
    }

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'payments';
    `;

    const hasUserIdIndex = indexes.some(idx => idx.indexname.includes('user_id'));
    const hasStatusIndex = indexes.some(idx => idx.indexname.includes('status'));
    const hasCreatedAtIndex = indexes.some(idx => idx.indexname.includes('created_at'));

    if (hasUserIdIndex && hasStatusIndex) {
      results.indexes = true;
      logger.info('✅ Required indexes exist');
    } else {
      logger.warn('❌ Missing required indexes', { 
        hasUserIdIndex, 
        hasStatusIndex, 
        hasCreatedAtIndex 
      });
    }

    // Check constraints
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'payments';
    `;

    const hasAmountConstraint = constraints.some(c => c.constraint_name.includes('amount_positive'));
    const hasForeignKeyConstraint = constraints.some(c => c.constraint_type === 'FOREIGN KEY');

    if (hasAmountConstraint && hasForeignKeyConstraint) {
      results.constraints = true;
      logger.info('✅ Required constraints exist');
    } else {
      logger.warn('❌ Missing required constraints', { 
        hasAmountConstraint, 
        hasForeignKeyConstraint 
      });
    }

    await prisma.$disconnect();
    return results;

  } catch (error) {
    logger.error('Database schema validation failed', error);
    await prisma.$disconnect();
    return results;
  }
}

async function validatePaystackClient() {
  logger.info('Validating Paystack client');
  
  const results = {
    singleton: false,
    initialization: false,
    methods: false
  };

  try {
    // Test singleton pattern
    const { paystackClient } = require('../lib/paystack.ts');
    const { PaystackClient } = require('../lib/paystack.ts');
    
    // Check if it's a singleton
    const instance1 = paystackClient;
    const instance2 = PaystackClient.getInstance();
    
    if (instance1 === instance2) {
      results.singleton = true;
      logger.info('✅ Paystack client singleton pattern working');
    } else {
      logger.warn('❌ Paystack client singleton pattern failed');
    }

    // Test initialization
    try {
      const publicKey = instance1.getPublicKey();
      if (publicKey && publicKey !== 'dummy-key') {
        results.initialization = true;
        logger.info('✅ Paystack client initialization successful');
      } else {
        logger.warn('❌ Paystack client initialization failed or using dummy key');
      }
    } catch (error) {
      logger.warn('❌ Paystack client initialization error', { error: error.message });
    }

    // Test methods exist
    const requiredMethods = [
      'initializePayment',
      'verifyPayment',
      'createTransfer',
      'createRecipient',
      'processRefund',
      'getPublicKey',
      'healthCheck'
    ];

    const missingMethods = requiredMethods.filter(method => 
      typeof instance1[method] !== 'function'
    );

    if (missingMethods.length === 0) {
      results.methods = true;
      logger.info('✅ All required Paystack client methods exist');
    } else {
      logger.warn('❌ Missing Paystack client methods', { missingMethods });
    }

    return results;

  } catch (error) {
    logger.error('Paystack client validation failed', error);
    return results;
  }
}

async function validatePaymentProcessor() {
  logger.info('Validating payment processor');
  
  const results = {
    instance: false,
    methods: false,
    calculations: false
  };

  try {
    const { paymentProcessor } = require('../lib/paystack.ts');

    // Test instance
    if (paymentProcessor) {
      results.instance = true;
      logger.info('✅ Payment processor instance exists');
    } else {
      logger.warn('❌ Payment processor instance missing');
    }

    // Test methods
    const requiredMethods = [
      'calculatePaymentBreakdown',
      'generateReference',
      'validateWebhookSignature'
    ];

    const missingMethods = requiredMethods.filter(method => 
      typeof paymentProcessor[method] !== 'function'
    );

    if (missingMethods.length === 0) {
      results.methods = true;
      logger.info('✅ All required payment processor methods exist');
    } else {
      logger.warn('❌ Missing payment processor methods', { missingMethods });
    }

    // Test calculations
    try {
      const breakdown = paymentProcessor.calculatePaymentBreakdown(100);
      const reference = paymentProcessor.generateReference();
      
      if (breakdown && breakdown.totalAmount === 100 && breakdown.platformFee > 0) {
        results.calculations = true;
        logger.info('✅ Payment calculations working correctly', { breakdown });
      } else {
        logger.warn('❌ Payment calculations incorrect', { breakdown });
      }
    } catch (error) {
      logger.warn('❌ Payment calculation error', { error: error.message });
    }

    return results;

  } catch (error) {
    logger.error('Payment processor validation failed', error);
    return results;
  }
}

async function validateEnvironmentVariables() {
  logger.info('Validating environment variables');
  
  const results = {
    paystackSecret: false,
    paystackPublic: false,
    databaseUrl: false,
    directUrl: false
  };

  const requiredVars = {
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  };

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      // Map to the expected result keys
      const resultKey = key.toLowerCase().replace(/_/g, '');
      results[resultKey] = true;
      logger.info(`✅ ${key} is set`);
    } else {
      logger.warn(`❌ ${key} is missing`);
    }
  });

  return results;
}

async function validateFileStructure() {
  logger.info('Validating file structure');
  
  const fs = require('fs');
  const path = require('path');
  
  const results = {
    paystackLib: false,
    paymentRoute: false,
    verifyRoute: false,
    paymentButton: false,
    integrationTest: false
  };

  const requiredFiles = [
    { path: 'lib/paystack.ts', key: 'paystackLib' },
    { path: 'app/api/book-service/[id]/pay/route.ts', key: 'paymentRoute' },
    { path: 'app/api/payment/verify/route.ts', key: 'verifyRoute' },
    { path: 'components/ui/payment-button.tsx', key: 'paymentButton' },
    { path: 'scripts/test-init-payment.js', key: 'integrationTest' }
  ];

  requiredFiles.forEach(({ path: filePath, key }) => {
    if (fs.existsSync(filePath)) {
      results[key] = true;
      logger.info(`✅ ${filePath} exists`);
    } else {
      logger.warn(`❌ ${filePath} missing`);
    }
  });

  return results;
}

async function runValidation() {
  logger.info('Starting comprehensive payment system validation');

  const results = {
    databaseSchema: await validateDatabaseSchema(),
    paystackClient: await validatePaystackClient(),
    paymentProcessor: await validatePaymentProcessor(),
    environment: await validateEnvironmentVariables(),
    fileStructure: await validateFileStructure()
  };

  // Calculate overall results
  const overallResults = {
    databaseSchema: Object.values(results.databaseSchema).every(Boolean),
    paystackClient: Object.values(results.paystackClient).every(Boolean),
    paymentProcessor: Object.values(results.paymentProcessor).every(Boolean),
    environment: Object.values(results.environment).every(Boolean),
    fileStructure: Object.values(results.fileStructure).every(Boolean)
  };

  const allPassed = Object.values(overallResults).every(Boolean);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('🔍 PAYMENT SYSTEM VALIDATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n📊 Component Results:');
  console.log(`  1. Database Schema: ${overallResults.databaseSchema ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  2. Paystack Client: ${overallResults.paystackClient ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  3. Payment Processor: ${overallResults.paymentProcessor ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  4. Environment Variables: ${overallResults.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  5. File Structure: ${overallResults.fileStructure ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📋 Detailed Results:');
  
  // Database Schema Details
  console.log('\n  🗄️  Database Schema:');
  Object.entries(results.databaseSchema).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // Paystack Client Details
  console.log('\n  🔧 Paystack Client:');
  Object.entries(results.paystackClient).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // Payment Processor Details
  console.log('\n  💰 Payment Processor:');
  Object.entries(results.paymentProcessor).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // Environment Details
  console.log('\n  🌍 Environment Variables:');
  Object.entries(results.environment).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // File Structure Details
  console.log('\n  📁 File Structure:');
  Object.entries(results.fileStructure).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 Overall Result: ${allPassed ? '✅ ALL VALIDATIONS PASSED' : '❌ SOME VALIDATIONS FAILED'}`);
  console.log('='.repeat(80));
  
  if (!allPassed) {
    console.log('\n❌ Failed Components:');
    Object.entries(overallResults).forEach(([component, passed]) => {
      if (!passed) {
        console.log(`  - ${component}`);
      }
    });
  }
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  runValidation().catch((error) => {
    logger.error('Validation execution failed', error);
    console.error('Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  validateDatabaseSchema,
  validatePaystackClient,
  validatePaymentProcessor,
  validateEnvironmentVariables,
  validateFileStructure,
  runValidation
};
