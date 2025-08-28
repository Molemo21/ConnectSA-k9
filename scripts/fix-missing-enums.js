const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixMissingEnums() {
  try {
    console.log('🔧 Fixing Missing Enum Types...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-missing-enums.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 SQL content loaded, executing...\n');

    // Execute the SQL file
    const result = await prisma.$executeRawUnsafe(sqlContent);
    console.log('✅ SQL executed successfully');

    // Verify the enums were created
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
    
    if (error.message.includes('duplicate_object')) {
      console.log('ℹ️ Some enum types already exist, this is fine');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingEnums();
