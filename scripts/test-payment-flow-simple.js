#!/usr/bin/env node

/**
 * Simple Payment Flow Test
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentFlow() {
  console.log('🔍 Testing Payment Flow...');
  
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: 'AWAITING_CONFIRMATION' },
      include: {
        payment: true,
        provider: {
          select: {
            bankName: true,
            bankCode: true,
            accountNumber: true,
            accountName: true,
            recipientCode: true
          }
        }
      }
    });

    console.log(`Found ${bookings.length} bookings awaiting confirmation`);

    bookings.forEach((booking, i) => {
      console.log(`\nBooking ${i + 1}: ${booking.id}`);
      console.log(`  Payment Status: ${booking.payment?.status}`);
      console.log(`  Bank Details Complete: ${!!(booking.provider?.bankName && booking.provider?.bankCode && booking.provider?.accountNumber && booking.provider?.accountName)}`);
      console.log(`  Recipient Code: ${booking.provider?.recipientCode || 'Not set'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentFlow();
