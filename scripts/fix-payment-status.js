#!/usr/bin/env node

/**
 * Fix Payment Status Script
 * 
 * This script manually fixes payment status for bookings that are stuck
 * in PENDING status due to webhook processing issues.
 * 
 * Usage: node scripts/fix-payment-status.js [bookingId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPaymentStatus(bookingId = null) {
  console.log('🔧 Fix Payment Status Tool\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    if (bookingId) {
      // Fix specific booking
      console.log(`🔧 Fixing payment status for booking: ${bookingId}\n`);
      await fixSpecificBooking(bookingId);
    } else {
      // Show all pending payments and offer to fix them
      console.log('📊 All Pending Payments:\n');
      await showAndFixAllPendingPayments();
    }

  } catch (error) {
    console.error('\n❌ Error during payment status fix:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

async function fixSpecificBooking(bookingId) {
  try {
    // Get booking with payment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: true,
        client: true
      }
    });

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return;
    }

    console.log('📋 Booking Details:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Service: ${booking.service?.name || 'Unknown'}`);
    console.log(`   Client: ${booking.client?.name || 'Unknown'}`);
    console.log(`   Amount: R${booking.totalAmount}`);
    console.log('');

    if (!booking.payment) {
      console.log('❌ No payment found for this booking');
      return;
    }

    console.log('💰 Current Payment Status:');
    console.log(`   Payment ID: ${booking.payment.id}`);
    console.log(`   Status: ${booking.payment.status}`);
    console.log(`   Amount: R${booking.payment.amount}`);
    console.log(`   Paystack Ref: ${booking.payment.paystackRef}`);
    console.log('');

    if (booking.payment.status === 'PENDING') {
      console.log('⚠️ Payment is stuck in PENDING status');
      console.log('💡 This usually means the webhook was not processed');
      console.log('');
      
      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Do you want to manually update this payment to ESCROW status? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          try {
            // Update payment status to ESCROW
            await prisma.payment.update({
              where: { id: booking.payment.id },
              data: {
                status: 'ESCROW',
                paidAt: new Date()
              }
            });

            // Update booking status to PENDING_EXECUTION
            await prisma.booking.update({
              where: { id: bookingId },
              data: { status: 'PENDING_EXECUTION' }
            });

            console.log('✅ Payment status updated successfully!');
            console.log('   - Payment: PENDING → ESCROW');
            console.log('   - Booking: Current → PENDING_EXECUTION');
            console.log('');
            console.log('💡 The provider can now start the job!');
            
          } catch (updateError) {
            console.error('❌ Error updating payment status:', updateError.message);
          }
        } else {
          console.log('❌ Payment status update cancelled');
        }
        
        rl.close();
        await prisma.$disconnect();
        process.exit(0);
      });

    } else {
      console.log(`✅ Payment is already in ${booking.payment.status} status`);
      console.log('💡 No action needed');
    }

  } catch (error) {
    console.error(`❌ Error fixing booking ${bookingId}:`, error.message);
  }
}

async function showAndFixAllPendingPayments() {
  try {
    // Get all payments with PENDING status
    const pendingPayments = await prisma.$queryRaw`
      SELECT 
        p.id as payment_id,
        p.status as payment_status,
        p.amount,
        p."paystackRef",
        p."createdAt",
        b.id as booking_id,
        b.status as booking_status,
        b."totalAmount"
      FROM payments p
      JOIN bookings b ON p."bookingId" = b.id
      WHERE p.status = 'PENDING'
      ORDER BY p."createdAt" DESC
    `;

    if (pendingPayments.length === 0) {
      console.log('✅ No pending payments found');
      return;
    }

    console.log(`Found ${pendingPayments.length} pending payments:\n`);

    pendingPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Payment ${payment.payment_id}`);
      console.log(`   Amount: R${payment.amount}`);
      console.log(`   Paystack Ref: ${payment.paystackRef}`);
      console.log(`   Created: ${payment.createdAt.toISOString()}`);
      console.log(`   Booking: ${payment.booking_id} (${payment.booking_status})`);
      console.log('');
    });

    console.log('💡 To fix a specific payment, run:');
    console.log(`   node scripts/fix-payment-status.js <booking_id>`);
    console.log('');
    console.log('💡 To fix all pending payments at once, run:');
    console.log(`   node scripts/fix-all-pending-payments.js`);

  } catch (error) {
    console.error('❌ Error showing pending payments:', error.message);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const bookingId = args[0] || null;

// Run the script
if (require.main === module) {
  fixPaymentStatus(bookingId);
}

module.exports = { fixPaymentStatus };
