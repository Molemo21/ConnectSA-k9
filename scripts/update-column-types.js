const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateColumnTypes() {
  try {
    console.log('🔧 Updating Column Types to Use Enums...\n');

    // 1. Update payments.status column to use PaymentStatus enum
    console.log('📋 Updating payments.status column...');
    try {
      await prisma.$executeRaw`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus" USING status::"PaymentStatus"`;
      console.log('✅ payments.status column updated to PaymentStatus enum');
    } catch (error) {
      console.log('⚠️ Error updating payments.status:', error.message);
    }

    // 2. Check if payouts table exists and update its status column
    console.log('\n📋 Checking payouts table...');
    try {
      const payoutsExist = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'payouts'
        )
      `;
      
      if (payoutsExist[0].exists) {
        console.log('📋 Updating payouts.status column...');
        try {
          await prisma.$executeRaw`ALTER TABLE "payouts" ALTER COLUMN "status" TYPE "PayoutStatus" USING status::"PayoutStatus"`;
          console.log('✅ payouts.status column updated to PayoutStatus enum');
        } catch (error) {
          console.log('⚠️ Error updating payouts.status:', error.message);
        }
      } else {
        console.log('ℹ️ payouts table does not exist yet');
      }
    } catch (error) {
      console.log('⚠️ Error checking payouts table:', error.message);
    }

    // 3. Check if disputes table exists and update its status column
    console.log('\n📋 Checking disputes table...');
    try {
      const disputesExist = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'disputes'
        )
      `;
      
      if (disputesExist[0].exists) {
        console.log('📋 Updating disputes.status column...');
        try {
          await prisma.$executeRaw`ALTER TABLE "disputes" ALTER COLUMN "status" TYPE "DisputeStatus" USING status::"DisputeStatus"`;
          console.log('✅ disputes.status column updated to DisputeStatus enum');
        } catch (error) {
          console.log('⚠️ Error updating disputes.status:', error.message);
        }
      } else {
        console.log('ℹ️ disputes table does not exist yet');
      }
    } catch (error) {
      console.log('⚠️ Error checking disputes table:', error.message);
    }

    // 4. Verify the column types were updated
    console.log('\n🔍 Verifying column type updates...');
    try {
      const columnCheck = await prisma.$queryRaw`
        SELECT 
          table_name,
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns 
        WHERE table_name IN ('payments', 'payouts', 'disputes')
        AND column_name = 'status'
        ORDER BY table_name
      `;

      console.log('📋 Status column types:');
      columnCheck.forEach(col => {
        console.log(`  ${col.table_name}.${col.column_name}: ${col.data_type} (${col.udt_name})`);
      });

    } catch (verifyError) {
      console.log('⚠️ Error verifying column types:', verifyError.message);
    }

    console.log('\n🎉 Column types should now be updated!');
    console.log('✅ Try the payment API again');

  } catch (error) {
    console.error('❌ Error updating column types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateColumnTypes();
