const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPaymentsStatusFinal() {
  try {
    console.log('🔧 Final Fix for Payments Status Column...\n');

    // 1. Check current column type
    console.log('📋 Checking current payments.status column type...');
    const columnInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'status'
    `;
    
    console.log('📊 Current column info:');
    columnInfo.forEach(col => {
      console.log(`  Column: ${col.column_name}, Type: ${col.data_type}, UDT: ${col.udt_name}`);
    });

    if (columnInfo.length === 0) {
      console.log('❌ payments.status column not found');
      return;
    }

    const currentType = columnInfo[0].data_type;
    const currentUdt = columnInfo[0].udt_name;

    if (currentUdt === 'PaymentStatus') {
      console.log('✅ Column is already PaymentStatus enum type');
      return;
    }

    // 2. Update existing data to valid enum values
    console.log('\n📋 Updating existing status values...');
    try {
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET status = CASE 
          WHEN status = 'pending' THEN 'PENDING'
          WHEN status = 'escrow' THEN 'ESCROW'
          WHEN status = 'released' THEN 'RELEASED'
          WHEN status = 'refunded' THEN 'REFUNDED'
          WHEN status = 'failed' THEN 'FAILED'
          WHEN status = 'paid' THEN 'ESCROW'
          WHEN status = 'completed' THEN 'ESCROW'
          ELSE 'PENDING'
        END
      `;
      console.log('✅ Updated existing status values');
    } catch (error) {
      console.log('⚠️ Error updating status values:', error.message);
    }

    // 3. Change column type to enum
    console.log('\n📋 Changing column type to PaymentStatus enum...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "payments" 
        ALTER COLUMN "status" TYPE "PaymentStatus" 
        USING status::"PaymentStatus"
      `;
      console.log('✅ Column type changed to PaymentStatus enum');
    } catch (error) {
      console.log('❌ Error changing column type:', error.message);
      
      // Try alternative approach
      console.log('\n🔄 Trying alternative approach...');
      try {
        // Add new column
        await prisma.$executeRaw`
          ALTER TABLE "payments" 
          ADD COLUMN "status_new" "PaymentStatus" DEFAULT 'PENDING'
        `;
        console.log('✅ Added new status column');
        
        // Copy data
        await prisma.$executeRaw`
          UPDATE "payments" 
          SET "status_new" = CASE 
            WHEN status = 'PENDING' THEN 'PENDING'::"PaymentStatus"
            WHEN status = 'ESCROW' THEN 'ESCROW'::"PaymentStatus"
            WHEN status = 'RELEASED' THEN 'RELEASED'::"PaymentStatus"
            WHEN status = 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus"
            WHEN status = 'FAILED' THEN 'FAILED'::"PaymentStatus"
            ELSE 'PENDING'::"PaymentStatus"
          END
        `;
        console.log('✅ Copied data to new column');
        
        // Drop old column and rename new one
        await prisma.$executeRaw`ALTER TABLE "payments" DROP COLUMN "status"`;
        await prisma.$executeRaw`ALTER TABLE "payments" RENAME COLUMN "status_new" TO "status"`;
        console.log('✅ Replaced old column with new one');
        
      } catch (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
        return;
      }
    }

    // 4. Verify the fix
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
    console.log('✅ Try the webhook test again');

  } catch (error) {
    console.error('❌ Error fixing payments status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPaymentsStatusFinal();
