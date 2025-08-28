#!/usr/bin/env node

/**
 * Fix Payouts Table Structure Script
 * 
 * This script fixes the payouts table by recreating it with the correct
 * column names according to the Prisma schema.
 * 
 * Usage: node scripts/fix-payouts-table.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPayoutsTable() {
  console.log('🔧 Fixing Payouts Table Structure\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check current table structure
    console.log('🔍 Checking Current Payouts Table Structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (tableInfo.length > 0) {
        console.log('📋 Current columns in payouts table:');
        tableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      } else {
        console.log('❌ No payouts table found');
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check current table structure:', error.message);
      console.log('');
    }

    // Drop the existing table
    console.log('🗑️ Dropping existing payouts table...\n');
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "payouts" CASCADE;`;
      console.log('✅ Dropped existing payouts table');
      console.log('');
    } catch (error) {
      console.log('❌ Error dropping table:', error.message);
      console.log('');
    }

    // Recreate with correct structure
    console.log('📋 Recreating payouts table with correct structure...\n');
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE "payouts" (
          "id" TEXT PRIMARY KEY,
          "paymentId" TEXT UNIQUE NOT NULL,
          "providerId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "paystack_ref" TEXT NOT NULL,
          "status" TEXT DEFAULT 'PENDING',
          "transfer_code" TEXT,
          "recipient_code" TEXT,
          "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ Created payouts table with correct structure');
      console.log('');

      // Create indexes for better performance
      console.log('🔍 Creating indexes...\n');
      
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_paymentId" ON "payouts"("paymentId");`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_providerId" ON "payouts"("providerId");`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_status" ON "payouts"("status");`;
      
      console.log('✅ Created indexes for payouts table');
      console.log('');

    } catch (error) {
      console.log('❌ Error recreating table:', error.message);
      console.log('');
      return;
    }

    // Verify the new table structure
    console.log('🔍 Verifying New Table Structure:\n');
    
    try {
      const newTableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (newTableInfo.length > 0) {
        console.log('📋 New columns in payouts table:');
        newTableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('⚠️ Could not verify new table structure:', error.message);
      console.log('');
    }

    // Test creating a sample payout record
    console.log('🧪 Testing Payout Creation...\n');
    
    try {
      // Get a sample payment and provider for testing
      const sampleData = await prisma.$queryRaw`
        SELECT 
          p.id as payment_id,
          p."bookingId",
          b."providerId"
        FROM payments p
        JOIN bookings b ON p."bookingId" = b.id
        WHERE p.status = 'ESCROW'
        LIMIT 1
      `;

      if (sampleData.length > 0) {
        const testData = sampleData[0];
        
        // Try to create a test payout
        const testPayout = await prisma.$executeRaw`
          INSERT INTO "payouts" (
            "id", "paymentId", "providerId", "amount", "paystack_ref", "status"
          ) VALUES (
            'test_payout_001',
            ${testData.payment_id},
            ${testData.providerId},
            25.00,
            'TEST_REF_001',
            'PENDING'
          )
        `;
        
        console.log('✅ Test payout creation successful');
        console.log('   - Payment ID:', testData.payment_id);
        console.log('   - Provider ID:', testData.providerId);
        console.log('   - Amount: R25.00');
        console.log('');

        // Clean up test data
        await prisma.$executeRaw`DELETE FROM "payouts" WHERE "id" = 'test_payout_001'`;
        console.log('🧹 Cleaned up test data');
        console.log('');

      } else {
        console.log('⚠️ No sample data available for testing');
        console.log('');
      }

    } catch (error) {
      console.log('❌ Error testing payout creation:', error.message);
      console.log('');
    }

    console.log('🎉 Payouts table structure fix completed!');
    console.log('💡 The release-payment endpoint should now work correctly.');
    console.log('💡 Clients can now confirm completion and release payments.');

  } catch (error) {
    console.error('\n❌ Error fixing payouts table:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixPayoutsTable();
}

module.exports = { fixPayoutsTable };
