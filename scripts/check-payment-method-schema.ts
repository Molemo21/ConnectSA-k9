import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema for paymentMethod...\n');

    // Check if column exists and its type
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'paymentMethod'
    ` as any[];

    console.log('📊 Column Info:', columnInfo);

    // Check for constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'bookings' 
      AND cc.constraint_name LIKE '%payment%'
    ` as any[];

    console.log('\n📋 Constraints:', constraints);

    // Try to insert a test value
    console.log('\n🧪 Testing insert...');
    
    const testBooking = await prisma.booking.findFirst({
      where: { paymentMethod: 'CASH' }
    });
    
    if (testBooking) {
      console.log('✅ CASH payment method exists in database');
    } else {
      console.log('❌ No CASH payment methods found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();







