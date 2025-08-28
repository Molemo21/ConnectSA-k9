#!/usr/bin/env node

/**
 * Test Payout Creation
 * 
 * This script tests payout creation to identify the exact issue.
 * 
 * Usage: node scripts/test-payout-creation.js
 */

const { PrismaClient } = require('@prisma/client');

async function testPayoutCreation() {
  console.log('🧪 Testing Payout Creation\n');

  // Create a fresh Prisma client
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 1: Check if we can query the table
    console.log('🔍 Test 1: Checking if payouts table exists\n');
    
    try {
      const count = await prisma.payout.count();
      console.log(`✅ Payouts table exists with ${count} records`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error counting payouts: ${error.message}`);
      console.log('');
      return;
    }

    // Test 2: Try to create a payout
    console.log('🔍 Test 2: Creating a test payout\n');
    
    try {
      // Get a sample payment
      const samplePayment = await prisma.payment.findFirst({
        where: { status: 'ESCROW' },
        include: { booking: true }
      });

      if (!samplePayment) {
        console.log('⚠️ No sample payment found for testing');
        return;
      }

      console.log('📋 Sample payment found:');
      console.log(`   - Payment ID: ${samplePayment.id}`);
      console.log(`   - Amount: R${samplePayment.escrowAmount}`);
      console.log(`   - Provider ID: ${samplePayment.booking.providerId}`);
      console.log('');

      // Try to create payout
      const payout = await prisma.payout.create({
        data: {
          paymentId: samplePayment.id,
          providerId: samplePayment.booking.providerId,
          amount: samplePayment.escrowAmount,
          paystackRef: `TEST_${Date.now()}`,
          status: 'PENDING'
        }
      });
      
      console.log('✅ Payout creation successful!');
      console.log(`   - Payout ID: ${payout.id}`);
      console.log(`   - Amount: R${payout.amount}`);
      console.log(`   - Created At: ${payout.createdAt}`);
      console.log(`   - Updated At: ${payout.updatedAt}`);
      console.log('');
      
      // Clean up
      await prisma.payout.delete({ where: { id: payout.id } });
      console.log('🧹 Test payout cleaned up');
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error creating payout: ${error.message}`);
      console.log(`   - Error code: ${error.code}`);
      console.log(`   - Error meta: ${JSON.stringify(error.meta)}`);
      console.log('');
      
      if (error.code === 'P2022') {
        console.log('🔍 This is a column mismatch error (P2022)');
        console.log('💡 The Prisma schema expects columns that don\'t exist in the database');
        console.log('💡 Solution: The database table structure needs to be fixed');
      }
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  testPayoutCreation();
}

module.exports = { testPayoutCreation };
