#!/usr/bin/env node

/**
 * Fix Payment Status Direct SQL Script
 * 
 * This script directly executes SQL to fix payment status issues
 * without going through Prisma's prepared statements.
 * 
 * Usage: node scripts/fix-payment-direct.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPaymentStatusDirect() {
  console.log('🔧 Fixing Payment Status Directly\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // First, let's see the current status of the problematic booking
    console.log('🔍 Current Status of Problematic Booking:\n');
    
    try {
      const currentStatus = await prisma.$queryRaw`
        SELECT 
          b.id as booking_id,
          b.status as booking_status,
          p.id as payment_id,
          p.status as payment_status,
          p.amount,
          p."paystackRef",
          p."createdAt"
        FROM bookings b
        JOIN payments p ON b.id = p."bookingId"
        WHERE b.id = 'cmeicsny20001s7bslnapppkp'
      `;

      if (currentStatus.length > 0) {
        const status = currentStatus[0];
        console.log('📋 Current Status:');
        console.log(`   Booking ID: ${status.booking_id}`);
        console.log(`   Booking Status: ${status.booking_status}`);
        console.log(`   Payment ID: ${status.payment_id}`);
        console.log(`   Payment Status: ${status.payment_status}`);
        console.log(`   Amount: R${status.amount}`);
        console.log(`   Paystack Ref: ${status.paystackRef}`);
        console.log(`   Created: ${status.createdAt}`);
        console.log('');
      } else {
        console.log('❌ Booking not found');
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check current status:', error.message);
      console.log('');
    }

    // Fix the specific booking's payment status
    console.log('🔧 Fixing Payment Status...\n');
    
    try {
      const updateResult = await prisma.$executeRaw`
        UPDATE payments 
        SET 
          status = 'ESCROW',
          "paidAt" = NOW()
        WHERE "bookingId" = 'cmeicsny20001s7bslnapppkp' 
        AND status = 'PENDING'
      `;

      console.log(`✅ Updated ${updateResult} payment record(s)`);
      console.log('   - Status: PENDING → ESCROW');
      console.log('   - Added paidAt timestamp');
      console.log('');

    } catch (error) {
      console.log('❌ Error updating payment status:', error.message);
      console.log('');
    }

    // Fix all other pending payments that should be in escrow
    console.log('🔧 Fixing All Similar Payment Issues...\n');
    
    try {
      const bulkUpdateResult = await prisma.$executeRaw`
        UPDATE payments 
        SET 
          status = 'ESCROW',
          "paidAt" = NOW()
        WHERE status = 'PENDING' 
        AND EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.id = payments."bookingId" 
          AND b.status IN ('PENDING_EXECUTION', 'AWAITING_CONFIRMATION')
        )
      `;

      console.log(`✅ Updated ${bulkUpdateResult} additional payment record(s)`);
      console.log('   - Fixed all payments for bookings in PENDING_EXECUTION or AWAITING_CONFIRMATION');
      console.log('');

    } catch (error) {
      console.log('❌ Error bulk updating payments:', error.message);
      console.log('');
    }

    // Show final status summary
    console.log('📊 Final Payment Status Summary:\n');
    
    try {
      const finalStatus = await prisma.$queryRaw`
        SELECT 
          p.status as payment_status,
          COUNT(*) as count
        FROM payments p
        GROUP BY p.status
        ORDER BY p.status
      `;

      finalStatus.forEach(status => {
        console.log(`   ${status.payment_status}: ${status.count} payment(s)`);
      });
      console.log('');

    } catch (error) {
      console.log('⚠️ Could not get final status summary:', error.message);
    }

    // Verify the specific booking is fixed
    console.log('🔍 Verifying Fix for Problematic Booking:\n');
    
    try {
      const verifyStatus = await prisma.$queryRaw`
        SELECT 
          b.id as booking_id,
          b.status as booking_status,
          p.id as payment_id,
          p.status as payment_status,
          p.amount,
          p."paystackRef",
          p."paidAt"
        FROM bookings b
        JOIN payments p ON b.id = p."bookingId"
        WHERE b.id = 'cmeicsny20001s7bslnapppkp'
      `;

      if (verifyStatus.length > 0) {
        const status = verifyStatus[0];
        console.log('✅ Verification Complete:');
        console.log(`   Booking ID: ${status.booking_id}`);
        console.log(`   Booking Status: ${status.booking_status}`);
        console.log(`   Payment ID: ${status.payment_id}`);
        console.log(`   Payment Status: ${status.payment_status}`);
        console.log(`   Amount: R${status.amount}`);
        console.log(`   Paystack Ref: ${status.paystackRef}`);
        console.log(`   Paid At: ${status.paidAt ? status.paidAt.toISOString() : 'Not set'}`);
        console.log('');
        
        if (status.payment_status === 'ESCROW') {
          console.log('🎉 SUCCESS! The payment status has been fixed.');
          console.log('💡 The client can now confirm completion and release payment.');
          console.log('💡 The provider can now start the job if it\'s in PENDING_EXECUTION status.');
        } else {
          console.log('⚠️ Payment status is still not correct. Manual intervention may be needed.');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not verify fix:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Error during payment status fix:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixPaymentStatusDirect();
}

module.exports = { fixPaymentStatusDirect };
