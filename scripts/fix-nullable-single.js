#!/usr/bin/env node

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function fixNullableFields() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting nullable fields fix with single SQL statement...');
    
    // Use a single SQL statement to fix all issues at once
    const fixResult = await prisma.$executeRaw`
      UPDATE payments 
      SET 
        escrow_amount = COALESCE(escrow_amount, 0.0),
        platform_fee = COALESCE(platform_fee, 0.0)
      WHERE escrow_amount IS NULL OR platform_fee IS NULL;
    `;
    
    console.log(`✅ Updated ${fixResult} payment records`);
    
    const fixBookingsResult = await prisma.$executeRaw`
      UPDATE bookings 
      SET 
        platform_fee = COALESCE(platform_fee, 0.0),
        total_amount = COALESCE(total_amount, 0.0)
      WHERE platform_fee IS NULL OR total_amount IS NULL;
    `;
    
    console.log(`✅ Updated ${fixBookingsResult} booking records`);
    
    // Verify the fixes
    console.log('🔍 Verifying fixes...');
    
    const nullCounts = await prisma.$queryRaw`
      SELECT 
        'payments.escrow_amount' as field,
        COUNT(*) as null_count
      FROM payments 
      WHERE escrow_amount IS NULL
      UNION ALL
      SELECT 
        'payments.platform_fee' as field,
        COUNT(*) as null_count
      FROM payments 
      WHERE platform_fee IS NULL
      UNION ALL
      SELECT 
        'bookings.platform_fee' as field,
        COUNT(*) as null_count
      FROM bookings 
      WHERE platform_fee IS NULL
      UNION ALL
      SELECT 
        'bookings.total_amount' as field,
        COUNT(*) as null_count
      FROM bookings 
      WHERE total_amount IS NULL
    `;
    
    console.log('📊 Remaining null values:');
    nullCounts.forEach(row => {
      console.log(`  ${row.field}: ${row.null_count}`);
    });
    
    // Test the API query
    console.log('🧪 Testing API query...');
    const testBookings = await prisma.booking.findMany({
      take: 1,
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
    });
    
    console.log('✅ Test query successful! Found', testBookings.length, 'bookings');
    
    console.log('🎉 All fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixNullableFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
