import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPaymentMethodEnum() {
  try {
    console.log('🔧 Fixing PaymentMethod enum to include CASH...\n');

    // Add CASH to PaymentMethod enum
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Check if CASH exists in PaymentMethod enum, if not add it
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'CASH' 
              AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')
          ) THEN
              ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';
              RAISE NOTICE 'Added CASH to PaymentMethod enum';
          ELSE
              RAISE NOTICE 'CASH already exists in PaymentMethod enum';
          END IF;
      END $$;
    `;

    console.log('✅ PaymentMethod enum updated\n');

    // Verify the fix
    const enumValues = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"PaymentMethod")) AS payment_method_value;
    ` as any[];

    console.log('📊 Current PaymentMethod enum values:');
    enumValues.forEach(row => {
      console.log(`  - ${row.payment_method_value}`);
    });

    console.log('\n✅ Fix completed successfully!');
    console.log('💡 Now try your booking again - CASH should work now.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaymentMethodEnum();







