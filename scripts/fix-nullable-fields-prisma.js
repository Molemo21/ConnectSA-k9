#!/usr/bin/env node

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function fixNullableFields() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting nullable fields fix using Prisma methods...');
    
    // First, let's check what we're working with
    console.log('📊 Checking current data...');
    
    const paymentsWithNullEscrow = await prisma.payment.findMany({
      where: { escrowAmount: null },
      select: { id: true, escrowAmount: true }
    });
    
    const paymentsWithNullPlatformFee = await prisma.payment.findMany({
      where: { platformFee: null },
      select: { id: true, platformFee: true }
    });
    
    const bookingsWithNullPlatformFee = await prisma.booking.findMany({
      where: { platformFee: null },
      select: { id: true, platformFee: true }
    });
    
    const bookingsWithNullTotalAmount = await prisma.booking.findMany({
      where: { totalAmount: null },
      select: { id: true, totalAmount: true }
    });
    
    console.log(`Found ${paymentsWithNullEscrow.length} payments with null escrowAmount`);
    console.log(`Found ${paymentsWithNullPlatformFee.length} payments with null platformFee`);
    console.log(`Found ${bookingsWithNullPlatformFee.length} bookings with null platformFee`);
    console.log(`Found ${bookingsWithNullTotalAmount.length} bookings with null totalAmount`);
    
    // Fix payments with null escrowAmount
    if (paymentsWithNullEscrow.length > 0) {
      console.log('🔄 Fixing payments with null escrowAmount...');
      for (const payment of paymentsWithNullEscrow) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { escrowAmount: 0.0 }
        });
      }
      console.log(`✅ Fixed ${paymentsWithNullEscrow.length} payments`);
    }
    
    // Fix payments with null platformFee
    if (paymentsWithNullPlatformFee.length > 0) {
      console.log('🔄 Fixing payments with null platformFee...');
      for (const payment of paymentsWithNullPlatformFee) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { platformFee: 0.0 }
        });
      }
      console.log(`✅ Fixed ${paymentsWithNullPlatformFee.length} payments`);
    }
    
    // Fix bookings with null platformFee
    if (bookingsWithNullPlatformFee.length > 0) {
      console.log('🔄 Fixing bookings with null platformFee...');
      for (const booking of bookingsWithNullPlatformFee) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { platformFee: 0.0 }
        });
      }
      console.log(`✅ Fixed ${bookingsWithNullPlatformFee.length} bookings`);
    }
    
    // Fix bookings with null totalAmount
    if (bookingsWithNullTotalAmount.length > 0) {
      console.log('🔄 Fixing bookings with null totalAmount...');
      for (const booking of bookingsWithNullTotalAmount) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { totalAmount: 0.0 }
        });
      }
      console.log(`✅ Fixed ${bookingsWithNullTotalAmount.length} bookings`);
    }
    
    // Verify all fixes
    console.log('🔍 Verifying fixes...');
    
    const remainingNullEscrow = await prisma.payment.count({
      where: { escrowAmount: null }
    });
    
    const remainingNullPaymentPlatformFee = await prisma.payment.count({
      where: { platformFee: null }
    });
    
    const remainingNullBookingPlatformFee = await prisma.booking.count({
      where: { platformFee: null }
    });
    
    const remainingNullTotalAmount = await prisma.booking.count({
      where: { totalAmount: null }
    });
    
    console.log('📊 Remaining null values:');
    console.log(`  payments.escrowAmount: ${remainingNullEscrow}`);
    console.log(`  payments.platformFee: ${remainingNullPaymentPlatformFee}`);
    console.log(`  bookings.platformFee: ${remainingNullBookingPlatformFee}`);
    console.log(`  bookings.totalAmount: ${remainingNullTotalAmount}`);
    
    // Test the API query
    console.log('🧪 Testing API query...');
    const testBookings = await prisma.booking.findMany({
      take: 1,
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
    });
    
    console.log('✅ Test query successful! Found', testBookings.length, 'bookings');
    
    // Test with a larger query
    console.log('🧪 Testing larger query...');
    const testBookingsLarge = await prisma.booking.findMany({
      take: 10,
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
    
    console.log('✅ Large query successful! Found', testBookingsLarge.length, 'bookings');
    
    console.log('🎉 All fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixNullableFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
