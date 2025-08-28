#!/usr/bin/env node

/**
 * Detailed Payouts Table Check
 * 
 * This script performs a detailed check of the payouts table
 * to identify any schema mismatches.
 * 
 * Usage: node scripts/detailed-payouts-check.js
 */

const { PrismaClient } = require('@prisma/client');

async function detailedPayoutsCheck() {
  console.log('🔍 Detailed Payouts Table Check\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check table structure with more detail
    console.log('📋 Detailed Table Structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          ordinal_position,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (tableInfo.length > 0) {
        console.log('All columns in payouts table:');
        tableInfo.forEach(col => {
          console.log(`   ${col.ordinal_position}. ${col.column_name}: ${col.data_type} (${col.udt_name}) ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
        });
        console.log('');
        
        // Check for specific columns
        const hasCreatedAt = tableInfo.some(col => col.column_name === 'created_at');
        const hasUpdatedAt = tableInfo.some(col => col.column_name === 'updated_at');
        const hasPaymentId = tableInfo.some(col => col.column_name === 'paymentId');
        const hasProviderId = tableInfo.some(col => col.column_name === 'providerId');
        const hasPaystackRef = tableInfo.some(col => col.column_name === 'paystack_ref');
        
        console.log('🔍 Critical Column Check:');
        console.log(`   - created_at: ${hasCreatedAt ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - updated_at: ${hasUpdatedAt ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - paymentId: ${hasPaymentId ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - providerId: ${hasProviderId ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - paystack_ref: ${hasPaystackRef ? '✅ Present' : '❌ MISSING'}`);
        console.log('');
        
        if (!hasCreatedAt || !hasUpdatedAt) {
          console.log('⚠️ CRITICAL ISSUE: Missing timestamp columns!');
          console.log('💡 This explains the "createdAt does not exist" error');
          console.log('');
        }
        
      } else {
        console.log('❌ No payouts table found!');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
      console.log('');
    }

    // Test raw SQL payout creation
    console.log('🧪 Testing Raw SQL Payout Creation:\n');
    
    try {
      const testPayoutId = `test_payout_${Date.now()}`;
      const testPaymentId = 'test_payment_123';
      const testProviderId = 'test_provider_456';
      
      const insertResult = await prisma.$executeRaw`
        INSERT INTO "payouts" (
          "id", "paymentId", "providerId", "amount", "paystack_ref", "status"
        ) VALUES (
          ${testPayoutId},
          ${testPaymentId},
          ${testProviderId},
          25.00,
          'TEST_REF_001',
          'PENDING'
        )
      `;
      
      console.log('✅ Raw SQL payout creation successful!');
      console.log(`   - Inserted ${insertResult} row(s)`);
      console.log('');
      
      // Verify the inserted data
      const verifyResult = await prisma.$queryRaw`
        SELECT * FROM "payouts" WHERE "id" = ${testPayoutId}
      `;
      
      if (verifyResult.length > 0) {
        const payout = verifyResult[0];
        console.log('📋 Inserted payout data:');
        console.log(`   - ID: ${payout.id}`);
        console.log(`   - Payment ID: ${payout.paymentId}`);
        console.log(`   - Provider ID: ${payout.providerId}`);
        console.log(`   - Amount: R${payout.amount}`);
        console.log(`   - Status: ${payout.status}`);
        console.log(`   - Created At: ${payout.created_at || 'NULL'}`);
        console.log(`   - Updated At: ${payout.updated_at || 'NULL'}`);
        console.log('');
      }
      
      // Clean up test data
      await prisma.$executeRaw`DELETE FROM "payouts" WHERE "id" = ${testPayoutId}`;
      console.log('🧹 Test payout cleaned up');
      console.log('');
      
    } catch (error) {
      console.log('❌ Error testing raw SQL payout creation:', error.message);
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error during detailed check:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  detailedPayoutsCheck();
}

module.exports = { detailedPayoutsCheck };
