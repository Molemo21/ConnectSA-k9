#!/usr/bin/env node

/**
 * Fix Payouts Table with Fresh Connection
 * 
 * This script creates a fresh Prisma connection to avoid
 * prepared statement errors and fixes the payouts table.
 * 
 * Usage: node scripts/fix-payouts-fresh.js
 */

const { PrismaClient } = require('@prisma/client');

async function fixPayoutsFresh() {
  console.log('🔧 Fixing Payouts Table with Fresh Connection\n');

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

    // Drop the existing table
    console.log('🗑️ Dropping existing payouts table...\n');
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "payouts" CASCADE`;
      console.log('✅ Dropped existing payouts table');
      console.log('');
    } catch (error) {
      console.log('❌ Error dropping table:', error.message);
      console.log('');
    }

    // Create the table with correct structure
    console.log('📋 Creating payouts table with correct structure...\n');
    
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

      // Create indexes
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_paymentId" ON "payouts"("paymentId")`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_providerId" ON "payouts"("providerId")`;
      await prisma.$executeRaw`CREATE INDEX "idx_payouts_status" ON "payouts"("status")`;
      console.log('✅ Created indexes for payouts table');
      console.log('');

    } catch (error) {
      console.log('❌ Error creating table:', error.message);
      console.log('');
      return;
    }

    // Verify the table structure
    console.log('🔍 Verifying Table Structure:\n');
    
    try {
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'payouts'
        ORDER BY ordinal_position
      `;

      if (tableInfo.length > 0) {
        console.log('📋 Columns in payouts table:');
        tableInfo.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log('⚠️ Could not verify table structure:', error.message);
      console.log('');
    }

    // Test payout creation
    console.log('🧪 Testing Payout Creation:\n');
    
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
        
        console.log('✅ Test payout creation successful');
        console.log(`   - Payout ID: ${payout.id}`);
        console.log(`   - Amount: R${payout.amount}`);
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
      console.log('❌ Error testing payout creation:', error.message);
      console.log('');
    }

    console.log('🎉 Payouts table fix completed!');
    console.log('💡 The release-payment endpoint should now work correctly.');

  } catch (error) {
    console.error('\n❌ Error fixing payouts table:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixPayoutsFresh();
}

module.exports = { fixPayoutsFresh };
