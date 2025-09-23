#!/usr/bin/env node

/**
 * Fix database issue with null userId in bookings/payments table
 */

const { PrismaClient } = require('@prisma/client');

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

const logger = createLogger('FixBookingUserIdNullIssue');

async function diagnoseDatabaseIssue() {
  logger.info('Diagnosing database userId null issue');
  
  try {
    // Check for null userId values in payments table
    const paymentsWithNullUserId = await prisma.$queryRaw`
      SELECT id, booking_id, user_id, amount, paystack_ref 
      FROM payments 
      WHERE user_id IS NULL
    `;
    
    logger.info('Payments with null userId found:', { count: paymentsWithNullUserId.length });
    
    if (paymentsWithNullUserId.length > 0) {
      console.log('Payments with null userId:');
      paymentsWithNullUserId.forEach(payment => {
        console.log(`  - Payment ID: ${payment.id}, Booking ID: ${payment.booking_id}, Amount: ${payment.amount}`);
      });
    }
    
    // Check for bookings without corresponding users
    const bookingsWithoutUsers = await prisma.$queryRaw`
      SELECT b.id, b.client_id, b.provider_id, b.status
      FROM bookings b
      LEFT JOIN users u ON b.client_id = u.id
      WHERE u.id IS NULL
    `;
    
    logger.info('Bookings without valid client users found:', { count: bookingsWithoutUsers.length });
    
    if (bookingsWithoutUsers.length > 0) {
      console.log('Bookings without valid client users:');
      bookingsWithoutUsers.forEach(booking => {
        console.log(`  - Booking ID: ${booking.id}, Client ID: ${booking.client_id}, Status: ${booking.status}`);
      });
    }
    
    // Check for payments without corresponding bookings
    const paymentsWithoutBookings = await prisma.$queryRaw`
      SELECT p.id, p.booking_id, p.user_id, p.amount
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE b.id IS NULL
    `;
    
    logger.info('Payments without valid bookings found:', { count: paymentsWithoutBookings.length });
    
    if (paymentsWithoutBookings.length > 0) {
      console.log('Payments without valid bookings:');
      paymentsWithoutBookings.forEach(payment => {
        console.log(`  - Payment ID: ${payment.id}, Booking ID: ${payment.booking_id}, User ID: ${payment.user_id}`);
      });
    }
    
    return {
      paymentsWithNullUserId: paymentsWithNullUserId.length,
      bookingsWithoutUsers: bookingsWithoutUsers.length,
      paymentsWithoutBookings: paymentsWithoutBookings.length
    };
    
  } catch (error) {
    logger.error('Error diagnosing database issue', error);
    throw error;
  }
}

async function fixDatabaseIssues() {
  logger.info('Fixing database issues');
  
  try {
    let fixedCount = 0;
    
    // Fix 1: Update payments with null userId by getting userId from the booking's client
    logger.info('Fixing payments with null userId...');
    
    const paymentsFixed = await prisma.$executeRaw`
      UPDATE payments 
      SET user_id = b.client_id
      FROM bookings b
      WHERE payments.booking_id = b.id 
      AND payments.user_id IS NULL
      AND b.client_id IS NOT NULL
    `;
    
    logger.info('Payments fixed with userId from booking client:', { count: paymentsFixed });
    fixedCount += paymentsFixed;
    
    // Fix 2: Delete orphaned payments (payments without valid bookings)
    logger.info('Deleting orphaned payments...');
    
    const orphanedPaymentsDeleted = await prisma.$executeRaw`
      DELETE FROM payments 
      WHERE booking_id NOT IN (
        SELECT id FROM bookings
      )
    `;
    
    logger.info('Orphaned payments deleted:', { count: orphanedPaymentsDeleted });
    fixedCount += orphanedPaymentsDeleted;
    
    // Fix 3: Delete orphaned bookings (bookings without valid client users)
    logger.info('Deleting orphaned bookings...');
    
    const orphanedBookingsDeleted = await prisma.$executeRaw`
      DELETE FROM bookings 
      WHERE client_id NOT IN (
        SELECT id FROM users
      )
    `;
    
    logger.info('Orphaned bookings deleted:', { count: orphanedBookingsDeleted });
    fixedCount += orphanedBookingsDeleted;
    
    return fixedCount;
    
  } catch (error) {
    logger.error('Error fixing database issues', error);
    throw error;
  }
}

async function updatePrismaSchema() {
  logger.info('Updating Prisma schema to handle nullable userId');
  
  try {
    const schemaPath = 'prisma/schema.prisma';
    const fs = require('fs');
    
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Check if userId in Payment model is already nullable
    const paymentModelMatch = schemaContent.match(/model Payment\s*\{[^}]+userId\s+String[^}]*\}/s);
    
    if (paymentModelMatch) {
      // Make userId nullable in Payment model
      schemaContent = schemaContent.replace(
        /userId\s+String\s+@map\("user_id"\)/,
        'userId    String?   @map("user_id")'
      );
      
      fs.writeFileSync(schemaPath, schemaContent);
      logger.info('Updated Prisma schema to make userId nullable in Payment model');
      
      // Generate Prisma client
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });
      logger.info('Generated new Prisma client');
      
      return true;
    } else {
      logger.warn('Payment model userId field not found or already nullable');
      return false;
    }
    
  } catch (error) {
    logger.error('Error updating Prisma schema', error);
    throw error;
  }
}

async function verifyFix() {
  logger.info('Verifying database fix');
  
  try {
    // Check if there are still any null userId values
    const remainingNullUserIds = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM payments WHERE user_id IS NULL
    `;
    
    const nullCount = parseInt(remainingNullUserIds[0].count);
    
    if (nullCount === 0) {
      logger.info('✅ All userId null issues have been resolved');
      return true;
    } else {
      logger.warn(`⚠️ Still ${nullCount} payments with null userId remaining`);
      return false;
    }
    
  } catch (error) {
    logger.error('Error verifying fix', error);
    throw error;
  }
}

async function testProviderBookingsAPI() {
  logger.info('Testing provider bookings API functionality');
  
  try {
    // Get a provider to test with
    const provider = await prisma.provider.findFirst({
      where: { status: 'APPROVED' },
      include: { user: true }
    });
    
    if (!provider) {
      logger.warn('No approved provider found for testing');
      return false;
    }
    
    // Test the same query that's failing in the API
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
    
    logger.info('✅ Provider bookings query successful', {
      providerId: provider.id,
      bookingCount: bookings.length
    });
    
    return true;
    
  } catch (error) {
    logger.error('❌ Provider bookings query failed', error);
    return false;
  }
}

async function main() {
  console.log('🔧 FIXING BOOKING USERID NULL ISSUE');
  console.log('==================================');
  
  try {
    // Step 1: Diagnose the issue
    console.log('\n1. Diagnosing database issue...');
    const diagnosis = await diagnoseDatabaseIssue();
    
    console.log('\n📊 DIAGNOSIS RESULTS:');
    console.log(`   - Payments with null userId: ${diagnosis.paymentsWithNullUserId}`);
    console.log(`   - Bookings without valid users: ${diagnosis.bookingsWithoutUsers}`);
    console.log(`   - Payments without valid bookings: ${diagnosis.paymentsWithoutBookings}`);
    
    if (diagnosis.paymentsWithNullUserId === 0 && 
        diagnosis.bookingsWithoutUsers === 0 && 
        diagnosis.paymentsWithoutBookings === 0) {
      console.log('\n✅ No database issues found. The problem might be elsewhere.');
      return;
    }
    
    // Step 2: Fix database issues
    console.log('\n2. Fixing database issues...');
    const fixedCount = await fixDatabaseIssues();
    console.log(`✅ Fixed ${fixedCount} database records`);
    
    // Step 3: Update Prisma schema
    console.log('\n3. Updating Prisma schema...');
    const schemaUpdated = await updatePrismaSchema();
    if (schemaUpdated) {
      console.log('✅ Prisma schema updated');
    }
    
    // Step 4: Verify the fix
    console.log('\n4. Verifying fix...');
    const fixVerified = await verifyFix();
    if (!fixVerified) {
      console.log('❌ Fix verification failed');
      return;
    }
    
    // Step 5: Test the API functionality
    console.log('\n5. Testing provider bookings API...');
    const apiTestPassed = await testProviderBookingsAPI();
    if (apiTestPassed) {
      console.log('✅ Provider bookings API test passed');
    } else {
      console.log('❌ Provider bookings API test failed');
      return;
    }
    
    console.log('\n🎉 ALL FIXES COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('The provider dashboard should now work correctly.');
    console.log('Please test the dashboard in production.');
    
  } catch (error) {
    logger.error('Error in main fix process', error);
    console.error(`❌ Fix failed: ${error.message}`);
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
  diagnoseDatabaseIssue,
  fixDatabaseIssues,
  updatePrismaSchema,
  verifyFix,
  testProviderBookingsAPI,
  main
};
