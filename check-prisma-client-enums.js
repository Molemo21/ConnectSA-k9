/**
 * Check Production Prisma Client Enum Values
 * 
 * This script checks what BookingStatus enum values the production
 * Prisma client actually recognizes.
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

async function checkPrismaClientEnums() {
  console.log('🔍 Checking Production Prisma Client Enum Values');
  console.log('===============================================');
  
  try {
    // Test each enum value individually to see which ones are recognized
    const enumValues = [
      'PENDING',
      'CONFIRMED', 
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'PENDING_EXECUTION',
      'AWAITING_CONFIRMATION',
      'PAYMENT_PROCESSING',
      'DISPUTED'
    ];
    
    console.log('🧪 Testing each enum value individually...');
    
    for (const enumValue of enumValues) {
      try {
        console.log(`\n🔍 Testing: ${enumValue}`);
        
        // Try to query with this specific enum value
        const result = await prisma.booking.findMany({
          where: {
            status: enumValue
          },
          take: 1,
          select: {
            id: true,
            status: true
          }
        });
        
        console.log(`✅ ${enumValue}: RECOGNIZED (found ${result.length} bookings)`);
        
      } catch (error) {
        if (error.message.includes('not found in enum')) {
          console.log(`❌ ${enumValue}: NOT RECOGNIZED by Prisma client`);
        } else {
          console.log(`⚠️  ${enumValue}: Error (${error.message})`);
        }
      }
    }
    
    console.log('\n🧪 Testing basic query without status filter...');
    try {
      const basicResult = await prisma.booking.findMany({
        take: 3,
        select: {
          id: true,
          status: true
        }
      });
      
      console.log(`✅ Basic query successful - found ${basicResult.length} bookings`);
      basicResult.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id}, Status: ${booking.status}`);
      });
      
    } catch (basicError) {
      console.log(`❌ Basic query failed: ${basicError.message}`);
    }
    
    console.log('\n🧪 Testing provider query without bookings...');
    try {
      const providerResult = await prisma.provider.findMany({
        where: {
          available: true,
          status: "APPROVED"
        },
        take: 1,
        select: {
          id: true,
          businessName: true,
          status: true
        }
      });
      
      console.log(`✅ Provider query successful - found ${providerResult.length} providers`);
      
    } catch (providerError) {
      console.log(`❌ Provider query failed: ${providerError.message}`);
    }
    
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n📋 Summary:');
  console.log('This will show which enum values the production Prisma client recognizes.');
  console.log('If most/all values are not recognized, the Prisma client needs to be regenerated.');
}

// Run the diagnostic
checkPrismaClientEnums().catch(console.error);
