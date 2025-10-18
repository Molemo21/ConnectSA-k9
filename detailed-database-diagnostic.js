/**
 * Detailed Database Diagnostic Script
 * 
 * This script performs comprehensive checks to identify why the API
 * is reporting PENDING_EXECUTION doesn't exist when it clearly does.
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

async function detailedDiagnostic() {
  console.log('🔍 Detailed Database Diagnostic');
  console.log('================================');
  
  try {
    // Test 1: Basic connection
    console.log('🔌 Test 1: Basic Connection');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection successful');
    console.log('');
    
    // Test 2: Check enum values
    console.log('📋 Test 2: BookingStatus Enum Values');
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    console.log('📊 Current enum values:');
    enumValues.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.booking_status_values}`);
    });
    
    const hasPendingExecution = enumValues.some(row => 
      row.booking_status_values === 'PENDING_EXECUTION'
    );
    console.log(`✅ PENDING_EXECUTION exists: ${hasPendingExecution}`);
    console.log('');
    
    // Test 3: Try to create a booking with PENDING_EXECUTION status
    console.log('🧪 Test 3: Create Booking with PENDING_EXECUTION Status');
    try {
      // First, get a valid service and provider
      const service = await prisma.service.findFirst();
      const provider = await prisma.provider.findFirst();
      
      if (service && provider) {
        console.log(`📋 Using service: ${service.name} (${service.id})`);
        console.log(`📋 Using provider: ${provider.businessName} (${provider.id})`);
        
        // Try to create a booking with PENDING_EXECUTION status
        const testBooking = await prisma.booking.create({
          data: {
            serviceId: service.id,
            providerId: provider.id,
            clientId: 'test-client-id', // This might fail, but we're testing the enum
            scheduledDate: new Date(),
            duration: 60,
            totalAmount: 100,
            address: 'Test Address',
            status: 'PENDING_EXECUTION' // This is what we're testing
          }
        });
        
        console.log('✅ Successfully created booking with PENDING_EXECUTION status');
        console.log(`📊 Booking ID: ${testBooking.id}`);
        
        // Clean up - delete the test booking
        await prisma.booking.delete({
          where: { id: testBooking.id }
        });
        console.log('🧹 Test booking cleaned up');
        
      } else {
        console.log('⚠️ No service or provider found for testing');
      }
    } catch (createError) {
      console.log('❌ Failed to create booking with PENDING_EXECUTION status');
      console.log(`💥 Error: ${createError.message}`);
      
      if (createError.message.includes('PENDING_EXECUTION')) {
        console.log('🎯 CONFIRMED: PENDING_EXECUTION enum issue exists');
      } else {
        console.log('🔍 Different error - might be clientId or other constraint');
      }
    }
    console.log('');
    
    // Test 4: Check if there are multiple database schemas
    console.log('🗄️ Test 4: Database Schema Information');
    const schemaInfo = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE tablename = 'Booking'
      ORDER BY schemaname
    `;
    
    console.log('📊 Booking table schemas:');
    schemaInfo.forEach((row, index) => {
      console.log(`  ${index + 1}. Schema: ${row.schemaname}, Table: ${row.tablename}, Owner: ${row.tableowner}`);
    });
    console.log('');
    
    // Test 5: Check current database name and connection info
    console.log('🔗 Test 5: Database Connection Information');
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_schema() as current_schema,
        current_user as current_user,
        version() as postgres_version
    `;
    
    console.log('📊 Database Info:');
    console.log(`  Database: ${dbInfo[0].database_name}`);
    console.log(`  Schema: ${dbInfo[0].current_schema}`);
    console.log(`  User: ${dbInfo[0].current_user}`);
    console.log(`  PostgreSQL Version: ${dbInfo[0].postgres_version.split(' ')[0]}`);
    console.log('');
    
    // Test 6: Check if there's a Prisma client cache issue
    console.log('🔄 Test 6: Prisma Client Cache Check');
    console.log('🔄 Disconnecting and reconnecting...');
    await prisma.$disconnect();
    await prisma.$connect();
    console.log('✅ Reconnected successfully');
    
    // Re-test enum values after reconnection
    const enumValuesAfterReconnect = await prisma.$queryRaw`
      SELECT enumlabel as booking_status_values 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
      ORDER BY enumsortorder
    `;
    
    const hasPendingExecutionAfterReconnect = enumValuesAfterReconnect.some(row => 
      row.booking_status_values === 'PENDING_EXECUTION'
    );
    
    console.log(`✅ PENDING_EXECUTION exists after reconnect: ${hasPendingExecutionAfterReconnect}`);
    
    if (hasPendingExecution && hasPendingExecutionAfterReconnect) {
      console.log('');
      console.log('🎯 CONCLUSION:');
      console.log('✅ PENDING_EXECUTION exists in the database');
      console.log('✅ Database connection is working');
      console.log('❌ But the API is still failing');
      console.log('');
      console.log('🔍 POSSIBLE CAUSES:');
      console.log('1. API is using a different database connection');
      console.log('2. API is using cached Prisma client');
      console.log('3. API is connecting to a different database instance');
      console.log('4. There might be a connection pool issue');
      console.log('');
      console.log('🔧 RECOMMENDED SOLUTIONS:');
      console.log('1. Check if the API is using the same database URL');
      console.log('2. Restart the Vercel deployment to clear any caches');
      console.log('3. Check if there are multiple database instances');
      console.log('4. Verify the API is using the correct Prisma client');
    }
    
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
    console.log('🔍 This might be a network connectivity issue');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
detailedDiagnostic().catch(console.error);
