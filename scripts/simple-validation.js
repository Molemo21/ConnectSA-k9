#!/usr/bin/env node

/**
 * Simple validation script for payment system fixes
 * Tests components without importing TypeScript modules
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

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

const logger = createLogger('SimpleValidation');

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

    if (hasUserIdIndex && hasStatusIndex) {
      results.indexes = true;
      logger.info('✅ Required indexes exist');
    } else {
      logger.warn('❌ Missing required indexes', { 
        hasUserIdIndex, 
        hasStatusIndex
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

function validateFileStructure() {
  logger.info('Validating file structure');
  
  const results = {
    paystackLib: false,
    paymentRoute: false,
    verifyRoute: false,
    paymentButton: false,
    integrationTest: false,
    validationScript: false
  };

  const requiredFiles = [
    { path: 'lib/paystack.ts', key: 'paystackLib' },
    { path: 'app/api/book-service/[id]/pay/route.ts', key: 'paymentRoute' },
    { path: 'app/api/payment/verify/route.ts', key: 'verifyRoute' },
    { path: 'components/ui/payment-button.tsx', key: 'paymentButton' },
    { path: 'scripts/test-init-payment.js', key: 'integrationTest' },
    { path: 'scripts/validate-payment-fixes.js', key: 'validationScript' }
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

function validateEnvironmentVariables() {
  logger.info('Validating environment variables');
  
  const results = {
    paystacksecretkey: false,
    paystackpublickey: false,
    databaseurl: false,
    directurl: false
  };

  const requiredVars = {
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  };

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      const resultKey = key.toLowerCase().replace(/_/g, '');
      results[resultKey] = true;
      logger.info(`✅ ${key} is set`);
    } else {
      logger.warn(`❌ ${key} is missing`);
    }
  });

  return results;
}

function validateCodeStructure() {
  logger.info('Validating code structure');
  
  const results = {
    paystackSingleton: false,
    structuredLogging: false,
    errorHandling: false,
    paymentValidation: false
  };

  try {
    // Check if Paystack client has singleton pattern
    const paystackContent = fs.readFileSync('lib/paystack.ts', 'utf8');
    
    if (paystackContent.includes('getInstance()') && paystackContent.includes('static instance')) {
      results.paystackSingleton = true;
      logger.info('✅ Paystack client singleton pattern found');
    } else {
      logger.warn('❌ Paystack client singleton pattern not found');
    }

    // Check for structured logging
    if (paystackContent.includes('createLogger') && paystackContent.includes('JSON.stringify')) {
      results.structuredLogging = true;
      logger.info('✅ Structured logging found in Paystack client');
    } else {
      logger.warn('❌ Structured logging not found in Paystack client');
    }

    // Check for error handling
    if (paystackContent.includes('try {') && paystackContent.includes('catch')) {
      results.errorHandling = true;
      logger.info('✅ Error handling found in Paystack client');
    } else {
      logger.warn('❌ Error handling not found in Paystack client');
    }

    // Check payment route for validation
    const paymentRouteContent = fs.readFileSync('app/api/book-service/[id]/pay/route.ts', 'utf8');
    
    if (paymentRouteContent.includes('z.object') && paymentRouteContent.includes('parse')) {
      results.paymentValidation = true;
      logger.info('✅ Payment validation found in route');
    } else {
      logger.warn('❌ Payment validation not found in route');
    }

  } catch (error) {
    logger.error('Code structure validation failed', error);
  }

  return results;
}

async function runValidation() {
  logger.info('Starting simple payment system validation');

  const results = {
    databaseSchema: await validateDatabaseSchema(),
    fileStructure: validateFileStructure(),
    environment: validateEnvironmentVariables(),
    codeStructure: validateCodeStructure()
  };

  // Calculate overall results
  const overallResults = {
    databaseSchema: Object.values(results.databaseSchema).every(Boolean),
    fileStructure: Object.values(results.fileStructure).every(Boolean),
    environment: Object.values(results.environment).every(Boolean),
    codeStructure: Object.values(results.codeStructure).every(Boolean)
  };

  const allPassed = Object.values(overallResults).every(Boolean);

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SIMPLE PAYMENT SYSTEM VALIDATION SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n📊 Component Results:');
  console.log(`  1. Database Schema: ${overallResults.databaseSchema ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  2. File Structure: ${overallResults.fileStructure ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  3. Environment Variables: ${overallResults.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  4. Code Structure: ${overallResults.codeStructure ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n📋 Detailed Results:');
  
  // Database Schema Details
  console.log('\n  🗄️  Database Schema:');
  Object.entries(results.databaseSchema).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // File Structure Details
  console.log('\n  📁 File Structure:');
  Object.entries(results.fileStructure).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // Environment Details
  console.log('\n  🌍 Environment Variables:');
  Object.entries(results.environment).forEach(([key, value]) => {
    console.log(`     ${key}: ${value ? '✅' : '❌'}`);
  });
  
  // Code Structure Details
  console.log('\n  🔧 Code Structure:');
  Object.entries(results.codeStructure).forEach(([key, value]) => {
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
  validateFileStructure,
  validateEnvironmentVariables,
  validateCodeStructure,
  runValidation
};
