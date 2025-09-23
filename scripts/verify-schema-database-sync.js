#!/usr/bin/env node

/**
 * Verify Prisma schema is in sync with database using best practices
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

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

const logger = createLogger('VerifySchemaDatabaseSync');

async function checkDatabaseConnection() {
  logger.info('Checking database connection');
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database connection successful');
    
    // Get database info
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as version
    `;
    
    logger.info('Database information:', dbInfo[0]);
    return true;
    
  } catch (error) {
    logger.error('❌ Database connection failed', error);
    return false;
  }
}

async function verifyTableStructure() {
  logger.info('Verifying table structure against schema');
  
  try {
    // Check if payments table exists and get its structure
    const paymentsTableInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    logger.info('Payments table structure:', { columns: paymentsTableInfo });
    
    // Check for user_id column specifically
    const userIdColumn = paymentsTableInfo.find(col => col.column_name === 'user_id');
    
    if (!userIdColumn) {
      logger.error('❌ user_id column not found in payments table');
      return false;
    }
    
    logger.info('user_id column details:', userIdColumn);
    
    // Verify if user_id is nullable (should be YES after our fix)
    if (userIdColumn.is_nullable !== 'YES') {
      logger.warn('⚠️ user_id column is not nullable - this could cause issues');
      return false;
    }
    
    logger.info('✅ user_id column is properly nullable');
    return true;
    
  } catch (error) {
    logger.error('❌ Error verifying table structure', error);
    return false;
  }
}

async function checkDataIntegrity() {
  logger.info('Checking data integrity');
  
  try {
    // Count total payments
    const totalPayments = await prisma.payment.count();
    logger.info('Total payments in database:', { count: totalPayments });
    
    // Count payments with null userId
    const nullUserIdCount = await prisma.payment.count({
      where: { userId: null }
    });
    logger.info('Payments with null userId:', { count: nullUserIdCount });
    
    // Count payments with valid userId
    const validUserIdCount = await prisma.payment.count({
      where: { userId: { not: null } }
    });
    logger.info('Payments with valid userId:', { count: validUserIdCount });
    
    // Check if our schema can handle null userId values
    try {
      const paymentsWithNullUserId = await prisma.payment.findMany({
        where: { userId: null },
        take: 5,
        select: {
          id: true,
          bookingId: true,
          userId: true,
          amount: true,
          status: true
        }
      });
      
      logger.info('✅ Successfully queried payments with null userId:', {
        sampleCount: paymentsWithNullUserId.length,
        sampleData: paymentsWithNullUserId
      });
      
    } catch (queryError) {
      logger.error('❌ Failed to query payments with null userId', queryError);
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('❌ Error checking data integrity', error);
    return false;
  }
}

async function testProviderBookingsQuery() {
  logger.info('Testing provider bookings query that was failing');
  
  try {
    // Get a provider to test with
    const provider = await prisma.provider.findFirst({
      where: { status: 'APPROVED' },
      include: { user: true }
    });
    
    if (!provider) {
      logger.warn('No approved provider found - creating test scenario');
      
      // Create a test query without specific provider
      const testBookings = await prisma.booking.findMany({
        where: {
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
        take: 5, // Limit for testing
        orderBy: { scheduledDate: "desc" },
      });
      
      logger.info('✅ Provider bookings query successful (test mode):', {
        bookingCount: testBookings.length,
        bookingsWithPayments: testBookings.filter(b => b.payment).length,
        bookingsWithNullPaymentUserId: testBookings.filter(b => b.payment && !b.payment.userId).length
      });
      
    } else {
      // Test with actual provider
      const bookings = await prisma.booking.findMany({
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
        orderBy: { scheduledDate: "desc" },
      });
      
      logger.info('✅ Provider bookings query successful:', {
        providerId: provider.id,
        providerName: provider.user.name,
        bookingCount: bookings.length,
        bookingsWithPayments: bookings.filter(b => b.payment).length,
        bookingsWithNullPaymentUserId: bookings.filter(b => b.payment && !b.payment.userId).length
      });
    }
    
    return true;
    
  } catch (error) {
    logger.error('❌ Provider bookings query failed', error);
    return false;
  }
}

async function validatePrismaSchema() {
  logger.info('Validating Prisma schema file');
  
  try {
    const schemaPath = 'prisma/schema.prisma';
    
    if (!fs.existsSync(schemaPath)) {
      logger.error('❌ Prisma schema file not found');
      return false;
    }
    
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check if Payment model has nullable userId
    const paymentModelMatch = schemaContent.match(/model Payment\s*\{[\s\S]*?\n\s*@@map\("payments"\)/);
    
    if (!paymentModelMatch) {
      logger.error('❌ Payment model not found in schema');
      return false;
    }
    
    const paymentModel = paymentModelMatch[0];
    
    // Check for nullable userId field
    const userIdFieldMatch = paymentModel.match(/userId\s+String\?/);
    if (!userIdFieldMatch) {
      logger.error('❌ userId field is not nullable in Payment model');
      return false;
    }
    
    // Check for nullable user relation
    const userRelationMatch = paymentModel.match(/user\s+User\?/);
    if (!userRelationMatch) {
      logger.error('❌ user relation is not nullable in Payment model');
      return false;
    }
    
    logger.info('✅ Prisma schema validation passed');
    return true;
    
  } catch (error) {
    logger.error('❌ Error validating Prisma schema', error);
    return false;
  }
}

async function checkPrismaClientGeneration() {
  logger.info('Checking Prisma client generation');
  
  try {
    // Check if Prisma client is properly generated
    const { execSync } = require('child_process');
    
    try {
      execSync('npx prisma generate --dry-run', { stdio: 'pipe' });
      logger.info('✅ Prisma client generation check passed');
    } catch (generateError) {
      logger.warn('⚠️ Prisma client generation check failed, regenerating...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      logger.info('✅ Prisma client regenerated successfully');
    }
    
    return true;
    
  } catch (error) {
    logger.error('❌ Error checking Prisma client generation', error);
    return false;
  }
}

async function runComprehensiveSyncCheck() {
  logger.info('Running comprehensive schema-database sync check');
  
  try {
    const checks = [
      { name: 'Database Connection', fn: checkDatabaseConnection },
      { name: 'Table Structure', fn: verifyTableStructure },
      { name: 'Data Integrity', fn: checkDataIntegrity },
      { name: 'Provider Bookings Query', fn: testProviderBookingsQuery },
      { name: 'Prisma Schema Validation', fn: validatePrismaSchema },
      { name: 'Prisma Client Generation', fn: checkPrismaClientGeneration }
    ];
    
    const results = {};
    
    for (const check of checks) {
      console.log(`\n🔍 Running ${check.name}...`);
      try {
        results[check.name] = await check.fn();
      } catch (error) {
        logger.error(`Error in ${check.name}`, error);
        results[check.name] = false;
      }
    }
    
    return results;
    
  } catch (error) {
    logger.error('Error in comprehensive sync check', error);
    return {};
  }
}

async function main() {
  console.log('🔍 VERIFYING PRISMA SCHEMA-DATABASE SYNC');
  console.log('=========================================');
  
  try {
    const results = await runComprehensiveSyncCheck();
    
    console.log('\n📊 SYNCHRONIZATION RESULTS');
    console.log('===========================');
    
    let allPassed = true;
    Object.entries(results).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check}`);
      if (!passed) allPassed = false;
    });
    
    console.log('\n💡 SUMMARY');
    console.log('===========');
    
    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('✅ Prisma schema is properly synchronized with database');
      console.log('✅ The null userId issue has been resolved');
      console.log('✅ Provider dashboard should work correctly in production');
      console.log('\n🚀 Ready for production deployment!');
    } else {
      console.log('⚠️ SOME CHECKS FAILED');
      console.log('❌ Schema-database synchronization issues detected');
      console.log('🔧 Please review and fix the failing checks above');
      console.log('\n📋 Next steps:');
      console.log('1. Fix any failing checks');
      console.log('2. Re-run this verification script');
      console.log('3. Deploy only after all checks pass');
    }
    
  } catch (error) {
    logger.error('Error in main verification process', error);
    console.error(`❌ Verification failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabaseConnection,
  verifyTableStructure,
  checkDataIntegrity,
  testProviderBookingsQuery,
  validatePrismaSchema,
  checkPrismaClientGeneration,
  runComprehensiveSyncCheck,
  main
};
