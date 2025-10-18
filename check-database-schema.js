/**
 * Database Schema Check Script
 * 
 * This script checks the current BookingStatus enum values in the production database
 * to verify if PENDING_EXECUTION exists or needs to be added.
 */

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
    }
  },
  log: ['error'],
  errorFormat: 'pretty'
});

async function checkDatabaseSchema() {
  console.log('🔍 Checking Production Database Schema');
  console.log('=====================================');
  
  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    console.log('');
    
    // Check BookingStatus enum values
    console.log('📋 Checking BookingStatus enum values...');
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Current BookingStatus enum values:');
    enumValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.booking_status_values}`);
    });
    
    // Check if PENDING_EXECUTION exists
    const hasPendingExecution = enumValues.some(row => 
      row.booking_status_values === 'PENDING_EXECUTION'
    );
    
    console.log('');
    if (hasPendingExecution) {
      console.log('✅ PENDING_EXECUTION enum value EXISTS in production database');
      console.log('🎯 The provider discovery API should work correctly');
    } else {
      console.log('❌ PENDING_EXECUTION enum value MISSING from production database');
      console.log('🔧 This is causing the provider discovery 500 error');
      console.log('');
      console.log('📋 Solution: Run the SQL migration script:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Open SQL Editor');
      console.log('   3. Run the contents of fix-pending-execution-enum.sql');
      console.log('   4. Or run this command:');
      console.log('      ALTER TYPE "BookingStatus" ADD VALUE \'PENDING_EXECUTION\';');
    }
    
    // Test a simple booking query to see what happens
    console.log('');
    console.log('🧪 Testing booking query...');
    try {
      const bookings = await prisma.booking.findMany({
        take: 1,
        select: {
          id: true,
          status: true
        }
      });
      console.log('✅ Booking query successful');
      if (bookings.length > 0) {
        console.log(`📊 Sample booking status: ${bookings[0].status}`);
      }
    } catch (bookingError) {
      console.log('❌ Booking query failed:', bookingError.message);
      if (bookingError.message.includes('PENDING_EXECUTION')) {
        console.log('🎯 Confirmed: PENDING_EXECUTION enum issue is causing the problem');
      }
    }
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    console.log('🔍 This might be a network connectivity issue');
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If PENDING_EXECUTION exists: Test the provider discovery API');
  console.log('2. If PENDING_EXECUTION missing: Run the SQL migration');
  console.log('3. After migration: Test the provider discovery API again');
}

// Run the check
checkDatabaseSchema().catch(console.error);
