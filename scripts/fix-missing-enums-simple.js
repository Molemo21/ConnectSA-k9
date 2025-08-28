const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingEnumsSimple() {
  try {
    console.log('🔧 Fixing Missing Enum Types (Simple Method)...\n');

    // 1. Create PaymentStatus enum
    console.log('📋 Creating PaymentStatus enum...');
    try {
      await prisma.$executeRaw`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'ESCROW', 'PROCESSING_RELEASE', 'RELEASED', 'REFUNDED', 'FAILED')`;
      console.log('✅ PaymentStatus enum created');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate_object')) {
        console.log('ℹ️ PaymentStatus enum already exists');
      } else {
        console.log('⚠️ Error creating PaymentStatus enum:', error.message);
      }
    }

    // 2. Create PayoutStatus enum
    console.log('\n📋 Creating PayoutStatus enum...');
    try {
      await prisma.$executeRaw`CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`;
      console.log('✅ PayoutStatus enum created');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate_object')) {
        console.log('ℹ️ PayoutStatus enum already exists');
      } else {
        console.log('⚠️ Error creating PayoutStatus enum:', error.message);
      }
    }

    // 3. Create DisputeStatus enum
    console.log('\n📋 Creating DisputeStatus enum...');
    try {
      await prisma.$executeRaw`CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'RESOLVED', 'ESCALATED')`;
      console.log('✅ DisputeStatus enum created');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate_object')) {
        console.log('ℹ️ DisputeStatus enum already exists');
      } else {
        console.log('⚠️ Error creating DisputeStatus enum:', error.message);
      }
    }

    // 4. Verify the enums were created
    console.log('\n🔍 Verifying enum creation...');
    try {
      const enumCheck = await prisma.$queryRaw`
        SELECT 
          typname as enum_name,
          enumlabel as enum_value
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE typname IN ('PaymentStatus', 'PayoutStatus', 'DisputeStatus')
        ORDER BY typname, enumsortorder
      `;
      
      console.log('📊 Enum types found:');
      enumCheck.forEach(enumType => {
        console.log(`  ${enumType.enum_name}: ${enumType.enum_value}`);
      });

      // Check payments table status column
      const columnCheck = await prisma.$queryRaw`
        SELECT 
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'status'
      `;

      console.log('\n📋 Payments table status column:');
      columnCheck.forEach(col => {
        console.log(`  Column: ${col.column_name}, Type: ${col.data_type}, UDT: ${col.udt_name}`);
      });

    } catch (verifyError) {
      console.log('⚠️ Error verifying enums:', verifyError.message);
    }

    console.log('\n🎉 Enum types should now be available!');
    console.log('✅ Try the payment API again');

  } catch (error) {
    console.error('❌ Error fixing missing enums:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingEnumsSimple();
