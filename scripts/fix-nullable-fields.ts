import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNullableFields() {
  try {
    console.log('🔧 Starting comprehensive nullable fields fix...');
    
    // Fix escrow_amount in payments table
    console.log('📊 Fixing escrow_amount in payments...');
    const escrowUpdateResult = await prisma.$executeRaw`
      UPDATE payments 
      SET escrow_amount = COALESCE(escrow_amount, 0.0)
      WHERE escrow_amount IS NULL
    `;
    console.log(`✅ Updated ${escrowUpdateResult} payments with escrow_amount`);
    
    // Fix platform_fee in payments table
    console.log('📊 Fixing platform_fee in payments...');
    const paymentPlatformFeeUpdateResult = await prisma.$executeRaw`
      UPDATE payments 
      SET platform_fee = COALESCE(platform_fee, 0.0)
      WHERE platform_fee IS NULL
    `;
    console.log(`✅ Updated ${paymentPlatformFeeUpdateResult} payments with platform_fee`);
    
    // Fix platform_fee in bookings table
    console.log('📊 Fixing platform_fee in bookings...');
    const bookingPlatformFeeUpdateResult = await prisma.$executeRaw`
      UPDATE bookings 
      SET platform_fee = COALESCE(platform_fee, 0.0)
      WHERE platform_fee IS NULL
    `;
    console.log(`✅ Updated ${bookingPlatformFeeUpdateResult} bookings with platform_fee`);
    
    // Fix total_amount in bookings table if it's null
    console.log('📊 Fixing total_amount in bookings...');
    const totalAmountUpdateResult = await prisma.$executeRaw`
      UPDATE bookings 
      SET total_amount = COALESCE(total_amount, 0.0)
      WHERE total_amount IS NULL
    `;
    console.log(`✅ Updated ${totalAmountUpdateResult} bookings with total_amount`);
    
    // Verify all fixes
    console.log('🔍 Verifying all fixes...');
    
    const nullEscrowPayments = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE escrow_amount IS NULL
    `;
    console.log('Remaining payments with null escrow_amount:', nullEscrowPayments);
    
    const nullPlatformFeePayments = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE platform_fee IS NULL
    `;
    console.log('Remaining payments with null platform_fee:', nullPlatformFeePayments);
    
    const nullPlatformFeeBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE platform_fee IS NULL
    `;
    console.log('Remaining bookings with null platform_fee:', nullPlatformFeeBookings);
    
    const nullTotalAmountBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE total_amount IS NULL
    `;
    console.log('Remaining bookings with null total_amount:', nullTotalAmountBookings);
    
    // Test the API query that was failing
    console.log('🧪 Testing the problematic API query...');
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
    
    // Test with a larger limit to make sure it works for the actual API
    console.log('🧪 Testing with larger query...');
    const testBookingsLarge = await prisma.booking.findMany({
      take: 10,
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
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('✅ Large query successful! Found', testBookingsLarge.length, 'bookings');
    
    console.log('🎉 All nullable fields fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing nullable fields:', error);
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
