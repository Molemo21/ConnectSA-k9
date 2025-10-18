/**
 * Database Schema Comparison Script
 * 
 * This script compares the local Prisma schema with the production database
 * to identify schema synchronization issues, specifically for the Payment model.
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

async function compareSchema() {
  console.log('🔍 Database Schema Comparison');
  console.log('============================');
  
  try {
    // Check Payment table structure in production
    console.log('📋 Checking Payment table structure in production...');
    
    const paymentTableInfo = await prisma.$queryRaw`
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
    
    console.log('📊 Production Payment table columns:');
    paymentTableInfo.forEach((column, index) => {
      console.log(`  ${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`);
    });
    
    // Check if userId column exists
    const hasUserId = paymentTableInfo.some(col => col.column_name === 'userId');
    console.log(`\n🔍 userId column exists: ${hasUserId ? '✅ YES' : '❌ NO'}`);
    
    // Check PaymentStatus enum values
    console.log('\n📋 Checking PaymentStatus enum values...');
    const paymentStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as payment_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Production PaymentStatus enum values:');
    paymentStatusValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.payment_status_values}`);
    });
    
    // Check if there are any payments in the database
    console.log('\n📋 Checking existing payments...');
    try {
      const paymentCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM payments`;
      console.log(`📊 Total payments in database: ${paymentCount[0].count}`);
      
      if (paymentCount[0].count > 0) {
        // Try to get a sample payment
        const samplePayment = await prisma.$queryRaw`
          SELECT * FROM payments LIMIT 1
        `;
        console.log('📊 Sample payment structure:');
        console.log(JSON.stringify(samplePayment[0], null, 2));
      }
    } catch (paymentError) {
      console.log('❌ Error querying payments:', paymentError.message);
    }
    
    // Check BookingStatus enum values (for reference)
    console.log('\n📋 Checking BookingStatus enum values...');
    const bookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Production BookingStatus enum values:');
    bookingStatusValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.booking_status_values}`);
    });
    
    // Check if PAYMENT_PROCESSING and DISPUTED exist in BookingStatus
    const hasPaymentProcessing = bookingStatusValues.some(row => row.booking_status_values === 'PAYMENT_PROCESSING');
    const hasDisputed = bookingStatusValues.some(row => row.booking_status_values === 'DISPUTED');
    
    console.log(`\n🔍 PAYMENT_PROCESSING in BookingStatus: ${hasPaymentProcessing ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 DISPUTED in BookingStatus: ${hasDisputed ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.log('❌ Schema comparison failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n📋 Summary:');
  console.log('This will show the exact structure of the production Payment table');
  console.log('and help identify what columns are missing or different from the local schema.');
}

// Run the comparison
compareSchema().catch(console.error);
