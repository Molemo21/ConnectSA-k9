#!/usr/bin/env node

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function testAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing API query that was previously failing...');
    
    // Test the exact query that was failing in the API
    const testBookings = await prisma.booking.findMany({
      take: 5,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('✅ API query successful!');
    console.log(`Found ${testBookings.length} bookings`);
    
    if (testBookings.length > 0) {
      console.log('\n📊 Sample booking data:');
      const sample = testBookings[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Total Amount: ${sample.totalAmount}`);
      console.log(`  Platform Fee: ${sample.platformFee}`);
      if (sample.payment) {
        console.log(`  Payment Escrow Amount: ${sample.payment.escrowAmount}`);
        console.log(`  Payment Platform Fee: ${sample.payment.platformFee}`);
      }
    }
    
    // Test with a larger limit
    console.log('\n🧪 Testing with larger query...');
    const testBookingsLarge = await prisma.booking.findMany({
      take: 20,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Large query successful! Found ${testBookingsLarge.length} bookings`);
    
    console.log('\n🎉 All tests passed! The nullable field issue has been resolved.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAPI()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
