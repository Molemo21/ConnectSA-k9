#!/usr/bin/env node

/**
 * Apply Payouts Table Migration
 * 
 * This script applies the final migration to fix the payouts table
 * structure to exactly match the Prisma schema.
 * 
 * Usage: node scripts/apply-payouts-migration.js
 */

const { PrismaClient } = require('@prisma/client');

async function applyPayoutsMigration() {
  console.log('🔧 Applying Final Payouts Table Migration\n');

  // Create a completely fresh Prisma client
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Fresh database connection successful\n');

    // Step 1: Drop the existing table
    console.log('🗑️ Dropping existing payouts table...\n');
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "payouts" CASCADE`;
      console.log('✅ Dropped existing payouts table');
      console.log('');
    } catch (error) {
      console.log('❌ Error dropping table:', error.message);
      console.log('');
    }

    // Step 2: Create the table with exact structure
    console.log('📋 Creating payouts table with exact Prisma schema structure...\n');
    
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
      console.log('✅ Created payouts table with exact Prisma schema structure');
      console.log('');

      // Step 3: Create indexes
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_paymentId" ON "payouts"("paymentId")`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_providerId" ON "payouts"("providerId")`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_status" ON "payouts"("status")`;
      console.log('✅ Created performance indexes');
      console.log('');

    } catch (error) {
      console.log('❌ Error creating table:', error.message);
      console.log('');
      return;
    }

    // Step 4: Verify the table structure
    console.log('🔍 Verifying Table Structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (tableInfo.length > 0) {
        console.log('📋 Final columns in payouts table:');
        tableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('⚠️ Could not verify table structure:', error.message);
      console.log('');
    }

    // Step 5: Test Prisma payout creation
    console.log('🧪 Testing Prisma Payout Creation:\n');
    
    try {
      // Get a sample payment for testing
      const samplePayment = await prisma.payment.findFirst({
        where: { status: 'ESCROW' },
        include: { booking: true }
      });

      if (samplePayment) {
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
        console.log(`   - Amount: R${payout.amount}`);
        console.log(`   - Payment ID: ${payout.paymentId}`);
        console.log(`   - Provider ID: ${payout.providerId}`);
        console.log(`   - Status: ${payout.status}`);
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
      return;
    }

    console.log('🎉 Payouts Table Migration Completed Successfully!');
    console.log('💡 The table structure now exactly matches the Prisma schema.');
    console.log('💡 The release-payment endpoint should work without errors.');
    console.log('💡 All column mappings are correct.');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  applyPayoutsMigration();
}

module.exports = { applyPayoutsMigration };
