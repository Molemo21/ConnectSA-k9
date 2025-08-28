const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPaymentsStatus() {
  try {
    console.log('🔧 Fixing Payments Status Column...\n');

    // First, let's check what's in the payments table
    console.log('📋 Checking current payments table...');
    try {
      const payments = await prisma.payment.findMany({
        take: 3,
        select: {
          id: true,
          status: true,
          amount: true,
        }
      });
      
      console.log(`📊 Found ${payments.length} payments`);
      payments.forEach(payment => {
        console.log(`  ID: ${payment.id}, Status: ${payment.status}, Amount: ${payment.amount}`);
      });
    } catch (error) {
      console.log('⚠️ Error checking payments:', error.message);
    }

    // Now try to update the column type
    console.log('\n📋 Updating payments.status column type...');
    try {
      // First, let's see what the current column type is
      const columnInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
      `;
      
      console.log('📋 Current column info:');
      columnInfo.forEach(col => {
        console.log(`  Column: ${col.column_name}, Type: ${col.data_type}, UDT: ${col.udt_name}`);
      });

      // Try to update the column type
      if (columnInfo.length > 0 && columnInfo[0].data_type === 'text') {
        console.log('\n🔄 Converting text status values to enum...');
        
        // Update existing status values to valid enum values
        await prisma.$executeRaw`
          UPDATE "payments" 
          SET status = 'PENDING' 
          WHERE status NOT IN ('PENDING', 'ESCROW', 'PROCESSING_RELEASE', 'RELEASED', 'REFUNDED', 'FAILED')
        `;
        
        console.log('✅ Updated invalid status values');
        
        // Now change the column type
        await prisma.$executeRaw`
          ALTER TABLE "payments" 
          ALTER COLUMN "status" TYPE "PaymentStatus" 
          USING status::"PaymentStatus"
        `;
        
        console.log('✅ Column type updated to PaymentStatus enum');
      } else {
        console.log('ℹ️ Column type is already correct or column not found');
      }

    } catch (error) {
      console.log('⚠️ Error updating column type:', error.message);
      
      // If the above fails, try a different approach
      console.log('\n🔄 Trying alternative approach...');
      try {
        // Create a new column with the correct type
        await prisma.$executeRaw`
          ALTER TABLE "payments" 
          ADD COLUMN "status_new" "PaymentStatus" DEFAULT 'PENDING'
        `;
        console.log('✅ Added new status column');
        
        // Copy data
        await prisma.$executeRaw`
          UPDATE "payments" 
          SET "status_new" = CASE 
            WHEN status = 'pending' THEN 'PENDING'::"PaymentStatus"
            WHEN status = 'escrow' THEN 'ESCROW'::"PaymentStatus"
            WHEN status = 'released' THEN 'RELEASED'::"PaymentStatus"
            WHEN status = 'refunded' THEN 'REFUNDED'::"PaymentStatus"
            WHEN status = 'failed' THEN 'FAILED'::"PaymentStatus"
            ELSE 'PENDING'::"PaymentStatus"
          END
        `;
        console.log('✅ Copied data to new column');
        
        // Drop old column and rename new one
        await prisma.$executeRaw`
          ALTER TABLE "payments" DROP COLUMN "status"
        `;
        await prisma.$executeRaw`
          ALTER TABLE "payments" RENAME COLUMN "status_new" TO "status"
        `;
        console.log('✅ Replaced old column with new one');
        
      } catch (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    try {
      const finalCheck = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'status'
      `;
      
      console.log('📋 Final column info:');
      finalCheck.forEach(col => {
        console.log(`  Column: ${col.column_name}, Type: ${col.data_type}, UDT: ${col.udt_name}`);
      });

      // Test if we can query payments
      const testPayments = await prisma.payment.findMany({
        take: 1,
        select: { id: true, status: true }
      });
      
      if (testPayments.length > 0) {
        console.log('✅ Successfully queried payments table');
        console.log(`   Sample: ID: ${testPayments[0].id}, Status: ${testPayments[0].status}`);
      }

    } catch (verifyError) {
      console.log('⚠️ Error in final verification:', verifyError.message);
    }

    console.log('\n🎉 Payments status column should now be fixed!');
    console.log('✅ Try the payment API again');

  } catch (error) {
    console.error('❌ Error fixing payments status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPaymentsStatus();
