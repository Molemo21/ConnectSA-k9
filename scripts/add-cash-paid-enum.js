const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function addCashPaidEnum() {
  try {
    console.log('💰 Adding CASH_PAID to PaymentStatus enum...\n');

    const sql = `
      DO $$ 
      BEGIN
        -- Check if CASH_PAID already exists
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'CASH_PAID' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
        ) THEN
          ALTER TYPE "PaymentStatus" ADD VALUE 'CASH_PAID';
          RAISE NOTICE 'Added CASH_PAID to PaymentStatus enum';
        ELSE
          RAISE NOTICE 'CASH_PAID already exists in PaymentStatus enum';
        END IF;
      END $$;
    `;
    
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ CASH_PAID enum value added successfully!');
    
    // Verify the change
    const result = await prisma.$queryRawUnsafe(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentStatus')
      ORDER BY enumsortorder;
    `);
    
    console.log('\n📊 Current PaymentStatus enum values:');
    result.forEach(row => console.log(`   - ${row.enumlabel}`));
    
    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
addCashPaidEnum()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });


