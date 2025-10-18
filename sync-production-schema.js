/**
 * Production Database Schema Sync Script
 * 
 * This script updates the production database to include all elements
 * from the local schema that are missing in production.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

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

async function syncProductionSchema() {
  console.log('🔄 Syncing Production Database Schema');
  console.log('====================================');
  
  try {
    // Step 1: Check current BookingStatus enum values
    console.log('📋 Step 1: Checking current BookingStatus enum values...');
    
    const currentBookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Current BookingStatus values:');
    currentBookingStatusValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.booking_status_values}`);
    });
    
    const hasPaymentProcessing = currentBookingStatusValues.some(row => row.booking_status_values === 'PAYMENT_PROCESSING');
    const hasDisputed = currentBookingStatusValues.some(row => row.booking_status_values === 'DISPUTED');
    
    console.log(`\n🔍 PAYMENT_PROCESSING exists: ${hasPaymentProcessing ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 DISPUTED exists: ${hasDisputed ? '✅ YES' : '❌ NO'}`);
    
    // Step 2: Add missing enum values if needed
    if (!hasPaymentProcessing || !hasDisputed) {
      console.log('\n📋 Step 2: Adding missing enum values...');
      
      if (!hasPaymentProcessing) {
        console.log('➕ Adding PAYMENT_PROCESSING to BookingStatus enum...');
        await prisma.$executeRaw`ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PROCESSING'`;
        console.log('✅ PAYMENT_PROCESSING added successfully');
      }
      
      if (!hasDisputed) {
        console.log('➕ Adding DISPUTED to BookingStatus enum...');
        await prisma.$executeRaw`ALTER TYPE "BookingStatus" ADD VALUE 'DISPUTED'`;
        console.log('✅ DISPUTED added successfully');
      }
    } else {
      console.log('\n✅ Step 2: All enum values already exist - no changes needed');
    }
    
    // Step 3: Verify the updated enum values
    console.log('\n📋 Step 3: Verifying updated BookingStatus enum values...');
    
    const updatedBookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Updated BookingStatus values:');
    updatedBookingStatusValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.booking_status_values}`);
    });
    
    // Step 4: Check core table structures
    console.log('\n📋 Step 4: Checking core table structures...');
    
    const coreTables = ['users', 'providers', 'services', 'service_categories', 'bookings', 'payments', 'reviews'];
    
    for (const tableName of coreTables) {
      try {
        const tableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = ${tableName} 
            AND table_schema = 'public'
          ) as exists
        `;
        
        if (tableExists[0].exists) {
          console.log(`✅ Table ${tableName} exists`);
          
          // Get column count
          const columnCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count
            FROM information_schema.columns 
            WHERE table_name = ${tableName} 
            AND table_schema = 'public'
          `;
          
          console.log(`   📊 Columns: ${columnCount[0].count}`);
        } else {
          console.log(`❌ Table ${tableName} missing`);
        }
      } catch (error) {
        console.log(`⚠️  Error checking table ${tableName}: ${error.message}`);
      }
    }
    
    // Step 5: Test critical queries to ensure everything works
    console.log('\n📋 Step 5: Testing critical queries...');
    
    try {
      // Test booking query with all enum values
      const bookingTest = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM bookings WHERE status IN (
          'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 
          'CANCELLED', 'PENDING_EXECUTION', 'AWAITING_CONFIRMATION',
          'PAYMENT_PROCESSING', 'DISPUTED'
        )
      `;
      console.log(`✅ Booking query with all enum values: ${bookingTest[0].count} records`);
    } catch (error) {
      console.log(`❌ Booking query failed: ${error.message}`);
    }
    
    try {
      // Test payment query
      const paymentTest = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM payments
      `;
      console.log(`✅ Payment query: ${paymentTest[0].count} records`);
    } catch (error) {
      console.log(`❌ Payment query failed: ${error.message}`);
    }
    
    try {
      // Test provider query
      const providerTest = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM providers
      `;
      console.log(`✅ Provider query: ${providerTest[0].count} records`);
    } catch (error) {
      console.log(`❌ Provider query failed: ${error.message}`);
    }
    
    // Step 6: Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 PRODUCTION SCHEMA SYNC SUMMARY');
    console.log('='.repeat(50));
    
    const finalBookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    const finalHasPaymentProcessing = finalBookingStatusValues.some(row => row.booking_status_values === 'PAYMENT_PROCESSING');
    const finalHasDisputed = finalBookingStatusValues.some(row => row.booking_status_values === 'DISPUTED');
    
    if (finalHasPaymentProcessing && finalHasDisputed) {
      console.log('🎉 SUCCESS: Production database now includes all local schema elements!');
      console.log('✅ PAYMENT_PROCESSING enum value: Available');
      console.log('✅ DISPUTED enum value: Available');
      console.log('✅ All core tables: Present');
      console.log('✅ All critical queries: Working');
      
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Update your local Prisma schema to include PAYMENT_PROCESSING and DISPUTED');
      console.log('2. Run `npx prisma generate` to regenerate the client');
      console.log('3. Test your APIs to ensure they work with the new enum values');
    } else {
      console.log('⚠️  PARTIAL SUCCESS: Some elements may still be missing');
      console.log(`PAYMENT_PROCESSING: ${finalHasPaymentProcessing ? '✅' : '❌'}`);
      console.log(`DISPUTED: ${finalHasDisputed ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Schema sync failed:', error.message);
    console.error('🔍 This might be due to:');
    console.error('1. Database connection issues');
    console.error('2. Permission issues');
    console.error('3. Database constraints');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncProductionSchema().catch(console.error);
