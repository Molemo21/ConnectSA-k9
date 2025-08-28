#!/usr/bin/env node

/**
 * Payment Status Diagnostic Script
 * 
 * This script helps diagnose payment status issues by checking
 * the current state of payments and bookings.
 * 
 * Usage: node scripts/diagnose-payment-status.js [bookingId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosePaymentStatus(bookingId = null) {
  console.log('🔍 Payment Status Diagnostic Tool\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    if (bookingId) {
      // Diagnose specific booking
      console.log(`🔍 Diagnosing specific booking: ${bookingId}\n`);
      await diagnoseSpecificBooking(bookingId);
    } else {
      // Show overview of all payments
      console.log('📊 Payment Status Overview\n');
      await showPaymentOverview();
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

async function diagnoseSpecificBooking(bookingId) {
  try {
    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        provider: true,
        client: true,
        service: true
      }
    });

    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return;
    }

    console.log('📋 Booking Details:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Client: ${booking.client?.name || 'Unknown'} (${booking.client?.email || 'Unknown'})`);
    console.log(`   Provider: ${booking.provider?.name || 'Unknown'} (${booking.provider?.email || 'Unknown'})`);
    console.log(`   Service: ${booking.service?.name || 'Unknown'}`);
    console.log(`   Amount: R${booking.totalAmount}`);
    console.log(`   Scheduled: ${booking.scheduledDate.toISOString()}`);
    console.log('');

    if (booking.payment) {
      console.log('💰 Payment Details:');
      console.log(`   ID: ${booking.payment.id}`);
      console.log(`   Status: ${booking.payment.status}`);
      console.log(`   Amount: R${booking.payment.amount}`);
      console.log(`   Escrow Amount: R${booking.payment.escrowAmount}`);
      console.log(`   Platform Fee: R${booking.payment.platformFee}`);
      console.log(`   Paystack Ref: ${booking.payment.paystackRef}`);
      console.log(`   Created: ${booking.payment.createdAt.toISOString()}`);
      console.log(`   Paid At: ${booking.payment.paidAt ? booking.payment.paidAt.toISOString() : 'Not paid yet'}`);
      console.log('');

      // Check if payment status is valid for release
      const canRelease = booking.payment.status === 'ESCROW' && booking.status === 'AWAITING_CONFIRMATION';
      console.log('🔍 Release Eligibility:');
      console.log(`   Payment Status Valid: ${booking.payment.status === 'ESCROW' ? '✅' : '❌'} (${booking.payment.status})`);
      console.log(`   Booking Status Valid: ${booking.status === 'AWAITING_CONFIRMATION' ? '✅' : '❌'} (${booking.status})`);
      console.log(`   Can Release Payment: ${canRelease ? '✅' : '❌'}`);
      console.log('');

      if (!canRelease) {
        console.log('⚠️ Issues Found:');
        if (booking.payment.status !== 'ESCROW') {
          console.log(`   - Payment status should be 'ESCROW' but is '${booking.payment.status}'`);
          
          // Suggest fixes based on current status
          switch (booking.payment.status) {
            case 'PENDING':
              console.log('   💡 Fix: Wait for payment confirmation or check webhook processing');
              break;
            case 'HELD_IN_ESCROW':
              console.log('   💡 Fix: Payment is held but not in correct status. Check webhook processing.');
              break;
            case 'PROCESSING_RELEASE':
              console.log('   💡 Fix: Payment is already being processed. Wait for completion.');
              break;
            case 'RELEASED':
              console.log('   💡 Fix: Payment already released. Check payout records.');
              break;
            case 'REFUNDED':
              console.log('   💡 Fix: Payment was refunded. Cannot release.');
              break;
            case 'FAILED':
              console.log('   💡 Fix: Payment failed. Check payment logs.');
              break;
            default:
              console.log(`   💡 Fix: Unknown status '${booking.payment.status}'. Check database.`);
          }
        }
        
        if (booking.status !== 'AWAITING_CONFIRMATION') {
          console.log(`   - Booking status should be 'AWAITING_CONFIRMATION' but is '${booking.status}'`);
          
          // Suggest fixes based on current status
          switch (booking.status) {
            case 'PENDING':
              console.log('   💡 Fix: Provider needs to accept the booking first');
              break;
            case 'CONFIRMED':
              console.log('   💡 Fix: Client needs to make payment first');
              break;
            case 'PENDING_EXECUTION':
              console.log('   💡 Fix: Provider needs to start the job first');
              break;
            case 'IN_PROGRESS':
              console.log('   💡 Fix: Provider needs to complete the job first');
              break;
            case 'COMPLETED':
              console.log('   💡 Fix: Payment already processed. Check payout records.');
              break;
            default:
              console.log(`   💡 Fix: Unknown status '${booking.status}'. Check database.`);
          }
        }
      } else {
        console.log('✅ All checks passed! Payment can be released.');
      }

    } else {
      console.log('❌ No payment found for this booking');
      console.log('💡 This usually means:');
      console.log('   - Payment was never created');
      console.log('   - Payment record was deleted');
      console.log('   - Database relationship issue');
    }

  } catch (error) {
    console.error(`❌ Error diagnosing booking ${bookingId}:`, error.message);
  }
}

async function showPaymentOverview() {
  try {
    // Get all payments with their status
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            service: true,
            client: true,
            provider: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${payments.length} payments:\n`);

    // Group by status
    const statusGroups = {};
    payments.forEach(payment => {
      const status = payment.status;
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(payment);
    });

    Object.keys(statusGroups).forEach(status => {
      const count = statusGroups[status].length;
      console.log(`${status}: ${count} payment(s)`);
      
      // Show first few examples
      statusGroups[status].slice(0, 3).forEach(payment => {
        const serviceName = payment.booking.service?.name || 'Unknown Service';
        const clientName = payment.booking.client?.name || 'Unknown Client';
        console.log(`   - ${serviceName} (${clientName}) - R${payment.amount}`);
      });
      
      if (statusGroups[status].length > 3) {
        console.log(`   ... and ${statusGroups[status].length - 3} more`);
      }
      console.log('');
    });

    // Show potential issues
    console.log('🔍 Potential Issues:');
    
    const pendingPayments = statusGroups['PENDING'] || [];
    if (pendingPayments.length > 0) {
      console.log(`   ⚠️ ${pendingPayments.length} payment(s) still pending - check webhook processing`);
    }
    
    const escrowPayments = statusGroups['ESCROW'] || [];
    if (escrowPayments.length > 0) {
      console.log(`   ✅ ${escrowPayments.length} payment(s) in escrow - ready for job completion`);
    }
    
    const heldPayments = statusGroups['HELD_IN_ESCROW'] || [];
    if (heldPayments.length > 0) {
      console.log(`   ⚠️ ${heldPayments.length} payment(s) held in escrow - check status consistency`);
    }

  } catch (error) {
    console.error('❌ Error showing payment overview:', error.message);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const bookingId = args[0] || null;

// Run the diagnosis
if (require.main === module) {
  diagnosePaymentStatus(bookingId);
}

module.exports = { diagnosePaymentStatus };
