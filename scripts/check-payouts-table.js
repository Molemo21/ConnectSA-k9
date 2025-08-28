#!/usr/bin/env node

/**
 * Check Payouts Table Structure
 * 
 * This script checks the current payouts table structure
 * to identify any mismatches with the Prisma schema.
 * 
 * Usage: node scripts/check-payouts-table.js
 */

const { PrismaClient } = require('@prisma/client');

async function checkPayoutsTable() {
  console.log('🔍 Checking Payouts Table Structure\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check table structure
    console.log('📋 Current Payouts Table Structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (tableInfo.length > 0) {
        console.log('Columns found:');
        tableInfo.forEach(col => {
          console.log(`   ${col.ordinal_position}. ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
        });
        console.log('');
        
        // Check for specific columns
        const hasCreatedAt = tableInfo.some(col => col.column_name === 'created_at');
        const hasUpdatedAt = tableInfo.some(col => col.column_name === 'updated_at');
        const hasPaymentId = tableInfo.some(col => col.column_name === 'paymentId');
        const hasProviderId = tableInfo.some(col => col.column_name === 'providerId');
        
        console.log('🔍 Column Analysis:');
        console.log(`   - created_at: ${hasCreatedAt ? '✅ Present' : '❌ Missing'}`);
        console.log(`   - updated_at: ${hasUpdatedAt ? '✅ Present' : '❌ Missing'}`);
        console.log(`   - paymentId: ${hasPaymentId ? '✅ Present' : '❌ Missing'}`);
        console.log(`   - providerId: ${hasProviderId ? '✅ Present' : '❌ Missing'}`);
        console.log('');
        
      } else {
        console.log('❌ No payouts table found!');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
      console.log('');
    }

    // Test Prisma payout creation
    console.log('🧪 Testing Prisma Payout Creation:\n');
    
    try {
      // Get a sample payment for testing
      const samplePayment = await prisma.payment.findFirst({
        where: { status: 'ESCROW' },
        include: { booking: true }
      });

      if (samplePayment) {
        console.log('📋 Sample payment found:');
        console.log(`   - Payment ID: ${samplePayment.id}`);
        console.log(`   - Amount: R${samplePayment.escrowAmount}`);
        console.log(`   - Provider ID: ${samplePayment.booking.providerId}`);
        console.log('');

        const payout = await prisma.payout.create({
          data: {
            paymentId: samplePayment.id,
            providerId: samplePayment.booking.providerId,
            amount: samplePayment.escrowAmount,
            paystackRef: `TEST_${Date.now()}`,
            status: 'PENDING'
          }
        });
        
        console.log('✅ Prisma payout creation successful!');
        console.log(`   - Payout ID: ${payout.id}`);
        console.log(`   - Created At: ${payout.createdAt}`);
        console.log(`   - Updated At: ${payout.updatedAt}`);
        console.log('');
        
        // Clean up test data
        await prisma.payout.delete({ where: { id: payout.id } });
        console.log('🧹 Test payout cleaned up');
        console.log('');
        
      } else {
        console.log('⚠️ No sample payment available for testing');
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ Error testing Prisma payout creation:', error.message);
      console.log('');
      
      // Show detailed error info
      if (error.code === 'P2022') {
        console.log('🔍 This is a column mismatch error (P2022)');
        console.log('💡 The Prisma schema expects columns that don\'t exist in the database');
        console.log('💡 Solution: Regenerate Prisma client or fix database schema');
      }
    }

  } catch (error) {
    console.error('\n❌ Error during check:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  checkPayoutsTable();
}

module.exports = { checkPayoutsTable };
