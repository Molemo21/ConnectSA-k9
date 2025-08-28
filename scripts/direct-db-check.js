#!/usr/bin/env node

/**
 * Direct Database Check
 * 
 * This script uses a direct database connection to check
 * the payouts table structure without Prisma.
 * 
 * Usage: node scripts/direct-db-check.js
 */

const { Client } = require('pg');

async function directDbCheck() {
  console.log('🔍 Direct Database Check\n');

  // Create a direct PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Direct database connection successful\n');

    // Check table structure
    console.log('📋 Checking Payouts Table Structure:\n');
    
    try {
      const tableQuery = `
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
      
      const tableResult = await client.query(tableQuery);
      
      if (tableResult.rows.length > 0) {
        console.log('Columns found in payouts table:');
        tableResult.rows.forEach(col => {
          console.log(`   ${col.ordinal_position}. ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
        });
        console.log('');
        
        // Check for critical columns
        const hasCreatedAt = tableResult.rows.some(col => col.column_name === 'created_at');
        const hasUpdatedAt = tableResult.rows.some(col => col.column_name === 'updated_at');
        const hasPaymentId = tableResult.rows.some(col => col.column_name === 'paymentId');
        const hasProviderId = tableResult.rows.some(col => col.column_name === 'providerId');
        
        console.log('🔍 Critical Column Analysis:');
        console.log(`   - created_at: ${hasCreatedAt ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - updated_at: ${hasUpdatedAt ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - paymentId: ${hasPaymentId ? '✅ Present' : '❌ MISSING'}`);
        console.log(`   - providerId: ${hasProviderId ? '✅ Present' : '❌ MISSING'}`);
        console.log('');
        
        if (!hasCreatedAt || !hasUpdatedAt) {
          console.log('⚠️ CRITICAL ISSUE: Missing timestamp columns!');
          console.log('💡 This explains the "createdAt does not exist" error');
          console.log('💡 The table structure is incomplete');
        }
        
      } else {
        console.log('❌ No payouts table found!');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking table structure:', error.message);
      console.log('');
    }

    // Test direct SQL payout creation
    console.log('🧪 Testing Direct SQL Payout Creation:\n');
    
    try {
      const testPayoutId = `test_payout_${Date.now()}`;
      const testPaymentId = 'test_payment_123';
      const testProviderId = 'test_provider_456';
      
      const insertQuery = `
        INSERT INTO "payouts" (
          "id", "paymentId", "providerId", "amount", "paystack_ref", "status"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const insertResult = await client.query(insertQuery, [
        testPayoutId,
        testPaymentId,
        testProviderId,
        25.00,
        'TEST_REF_001',
        'PENDING'
      ]);
      
      console.log('✅ Direct SQL payout creation successful!');
      console.log(`   - Inserted ${insertResult.rowCount} row(s)`);
      console.log('');
      
      // Verify the inserted data
      const verifyQuery = `SELECT * FROM "payouts" WHERE "id" = $1`;
      const verifyResult = await client.query(verifyQuery, [testPayoutId]);
      
      if (verifyResult.rows.length > 0) {
        const payout = verifyResult.rows[0];
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
      const deleteQuery = `DELETE FROM "payouts" WHERE "id" = $1`;
      await client.query(deleteQuery, [testPayoutId]);
      console.log('🧹 Test payout cleaned up');
      console.log('');
      
    } catch (error) {
      console.log('❌ Error testing direct SQL payout creation:', error.message);
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error during direct database check:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  directDbCheck();
}

module.exports = { directDbCheck };
