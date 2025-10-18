/**
 * Check for PENDING_EXECUTION bookings in production database
 * 
 * This script checks if there are any bookings with PENDING_EXECUTION status
 * that might be causing the Prisma validation error.
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

async function checkPendingExecutionBookings() {
  console.log('🔍 Checking for PENDING_EXECUTION bookings in production database');
  console.log('================================================================');
  
  try {
    // Test 1: Check if we can query bookings at all
    console.log('🧪 Test 1: Basic booking query...');
    const allBookings = await prisma.booking.findMany({
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${allBookings.length} bookings`);
    allBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Created: ${booking.createdAt}`);
    });
    console.log('');
    
    // Test 2: Check for PENDING_EXECUTION bookings specifically
    console.log('🧪 Test 2: Checking for PENDING_EXECUTION bookings...');
    try {
      const pendingExecutionBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING_EXECUTION'
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          scheduledDate: true
        }
      });
      
      console.log(`📊 Found ${pendingExecutionBookings.length} bookings with PENDING_EXECUTION status`);
      if (pendingExecutionBookings.length > 0) {
        console.log('📋 PENDING_EXECUTION bookings:');
        pendingExecutionBookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. ID: ${booking.id}, Created: ${booking.createdAt}, Scheduled: ${booking.scheduledDate}`);
        });
      }
    } catch (pendingError) {
      console.log('❌ Failed to query PENDING_EXECUTION bookings:', pendingError.message);
      if (pendingError.message.includes('PENDING_EXECUTION')) {
        console.log('🎯 CONFIRMED: PENDING_EXECUTION enum validation is failing');
      }
    }
    console.log('');
    
    // Test 3: Check the exact query that's failing in the API
    console.log('🧪 Test 3: Testing the exact query from discover-providers API...');
    try {
      const providers = await prisma.provider.findMany({
        where: {
          available: true,
          status: "APPROVED",
        },
        include: {
          bookings: {
            where: { status: { not: "CANCELLED" } },
            select: {
              id: true,
              scheduledDate: true,
              status: true,
            }
          },
        },
        take: 1
      });
      
      console.log(`✅ Provider query successful - found ${providers.length} providers`);
      if (providers.length > 0) {
        const provider = providers[0];
        console.log(`📊 Provider: ${provider.businessName || 'Unknown'}`);
        console.log(`📊 Bookings: ${provider.bookings.length}`);
        provider.bookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. Booking ID: ${booking.id}, Status: ${booking.status}`);
        });
      }
    } catch (providerError) {
      console.log('❌ Provider query failed:', providerError.message);
      if (providerError.message.includes('PENDING_EXECUTION')) {
        console.log('🎯 CONFIRMED: The discover-providers API query is failing due to PENDING_EXECUTION enum validation');
        console.log('');
        console.log('🔍 ROOT CAUSE IDENTIFIED:');
        console.log('The issue is that there are bookings with PENDING_EXECUTION status in the database,');
        console.log('but the Prisma client being used by the API cannot validate this enum value.');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('1. The API is using a different Prisma client instance than our diagnostic script');
        console.log('2. The API Prisma client needs to be regenerated or updated');
        console.log('3. Or we need to exclude PENDING_EXECUTION bookings from the query');
      }
    }
    console.log('');
    
    // Test 4: Check what happens if we exclude PENDING_EXECUTION from the query
    console.log('🧪 Test 4: Testing query without PENDING_EXECUTION bookings...');
    try {
      const providersWithoutPendingExecution = await prisma.provider.findMany({
        where: {
          available: true,
          status: "APPROVED",
        },
        include: {
          bookings: {
            where: { 
              status: { 
                notIn: ["CANCELLED", "PENDING_EXECUTION"] 
              } 
            },
            select: {
              id: true,
              scheduledDate: true,
              status: true,
            }
          },
        },
        take: 1
      });
      
      console.log(`✅ Query without PENDING_EXECUTION successful - found ${providersWithoutPendingExecution.length} providers`);
    } catch (excludeError) {
      console.log('❌ Query without PENDING_EXECUTION failed:', excludeError.message);
    }
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('');
  console.log('📋 Summary:');
  console.log('If Test 3 fails with PENDING_EXECUTION error, the issue is confirmed.');
  console.log('The solution is to either:');
  console.log('1. Update the Prisma client in the API to recognize PENDING_EXECUTION');
  console.log('2. Exclude PENDING_EXECUTION bookings from the query');
  console.log('3. Update the database schema to ensure consistency');
}

// Run the check
checkPendingExecutionBookings().catch(console.error);
