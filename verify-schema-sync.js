/**
 * Schema Synchronization Verification Script
 * 
 * This script verifies that the local Prisma schema and production database
 * are now properly synchronized after the updates.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

// Read and parse local Prisma schema
function parseLocalSchema() {
  try {
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract BookingStatus enum values
    const bookingStatusMatch = schemaContent.match(/enum BookingStatus \{[^}]+\}/s);
    if (bookingStatusMatch) {
      const enumBody = bookingStatusMatch[0];
      const values = enumBody.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.includes('enum BookingStatus') && !line.includes('{') && !line.includes('}'))
        .map(line => line.trim());
      
      return values;
    }
    return [];
  } catch (error) {
    console.error('❌ Error reading local schema:', error.message);
    return [];
  }
}

async function verifySchemaSync() {
  console.log('🔍 Schema Synchronization Verification');
  console.log('======================================');
  
  try {
    // Step 1: Get local schema enum values
    console.log('📋 Step 1: Reading local Prisma schema...');
    const localBookingStatusValues = parseLocalSchema();
    console.log('📊 Local BookingStatus values:');
    localBookingStatusValues.forEach((value, index) => {
      console.log(`  ${index + 1}. ${value}`);
    });
    
    // Step 2: Get production database enum values
    console.log('\n📋 Step 2: Reading production database schema...');
    const productionBookingStatusValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    const productionValues = productionBookingStatusValues.map(row => row.booking_status_values);
    console.log('📊 Production BookingStatus values:');
    productionValues.forEach((value, index) => {
      console.log(`  ${index + 1}. ${value}`);
    });
    
    // Step 3: Compare the values
    console.log('\n📋 Step 3: Comparing local vs production...');
    
    const missingInProduction = localBookingStatusValues.filter(val => !productionValues.includes(val));
    const missingInLocal = productionValues.filter(val => !localBookingStatusValues.includes(val));
    const commonValues = localBookingStatusValues.filter(val => productionValues.includes(val));
    
    console.log(`📊 Common values: ${commonValues.length}`);
    console.log(`📊 Missing in production: ${missingInProduction.length}`);
    console.log(`📊 Missing in local: ${missingInLocal.length}`);
    
    if (missingInProduction.length > 0) {
      console.log('❌ Missing in production:', missingInProduction.join(', '));
    }
    
    if (missingInLocal.length > 0) {
      console.log('❌ Missing in local:', missingInLocal.join(', '));
    }
    
    // Step 4: Test critical API functionality
    console.log('\n📋 Step 4: Testing critical API functionality...');
    
    // Test 1: Provider discovery with all enum values
    try {
      console.log('🧪 Test 1: Provider discovery API...');
      const providers = await prisma.provider.findMany({
        where: {
          available: true,
          status: "APPROVED",
        },
        include: {
          bookings: {
            where: { 
              status: { 
                in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "AWAITING_CONFIRMATION", "PENDING_EXECUTION", "PAYMENT_PROCESSING", "DISPUTED"] 
              } 
            },
            take: 1
          }
        },
        take: 1
      });
      
      console.log(`✅ Provider discovery query: Found ${providers.length} providers`);
    } catch (error) {
      console.log(`❌ Provider discovery query failed: ${error.message}`);
    }
    
    // Test 2: Payment queries
    try {
      console.log('🧪 Test 2: Payment queries...');
      const payments = await prisma.payment.findMany({
        take: 3,
        select: {
          id: true,
          bookingId: true,
          amount: true,
          status: true,
          userId: true
        }
      });
      
      console.log(`✅ Payment queries: Found ${payments.length} payments`);
      payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. Payment ${payment.id}: R${payment.amount}, Status: ${payment.status}, UserId: ${payment.userId || 'null'}`);
      });
    } catch (error) {
      console.log(`❌ Payment queries failed: ${error.message}`);
    }
    
    // Test 3: Booking queries with all statuses
    try {
      console.log('🧪 Test 3: Booking queries with all statuses...');
      const bookings = await prisma.booking.findMany({
        where: {
          status: {
            in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "PENDING_EXECUTION", "AWAITING_CONFIRMATION", "PAYMENT_PROCESSING", "DISPUTED"]
          }
        },
        take: 5,
        select: {
          id: true,
          status: true,
          totalAmount: true
        }
      });
      
      console.log(`✅ Booking queries: Found ${bookings.length} bookings`);
      bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. Booking ${booking.id}: ${booking.status}, R${booking.totalAmount}`);
      });
    } catch (error) {
      console.log(`❌ Booking queries failed: ${error.message}`);
    }
    
    // Step 5: Final verification
    console.log('\n' + '='.repeat(50));
    console.log('📊 SYNCHRONIZATION VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    const isFullySynchronized = missingInProduction.length === 0 && missingInLocal.length === 0;
    
    if (isFullySynchronized) {
      console.log('🎉 PERFECT SYNCHRONIZATION ACHIEVED!');
      console.log('✅ Local schema matches production database exactly');
      console.log('✅ All enum values are synchronized');
      console.log('✅ All critical queries are working');
      console.log('✅ APIs should now work without schema errors');
      
      console.log('\n🔧 RECOMMENDED NEXT STEPS:');
      console.log('1. Run `npx prisma generate` to regenerate the Prisma client');
      console.log('2. Test your APIs in production');
      console.log('3. Deploy your updated schema to production');
      console.log('4. Monitor for any remaining schema-related errors');
    } else {
      console.log('⚠️  PARTIAL SYNCHRONIZATION:');
      if (missingInProduction.length > 0) {
        console.log(`❌ ${missingInProduction.length} values missing in production: ${missingInProduction.join(', ')}`);
      }
      if (missingInLocal.length > 0) {
        console.log(`❌ ${missingInLocal.length} values missing in local: ${missingInLocal.join(', ')}`);
      }
      
      console.log('\n🔧 ADDITIONAL ACTIONS NEEDED:');
      if (missingInProduction.length > 0) {
        console.log('1. Add missing values to production database');
      }
      if (missingInLocal.length > 0) {
        console.log('2. Add missing values to local schema');
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifySchemaSync().catch(console.error);
