import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEscrowAmount() {
  try {
    console.log('🔧 Starting escrowAmount field fix...');
    
    // First, let's check the current state of the payments table
    console.log('📊 Checking current payments data...');
    const payments = await prisma.$queryRaw`
      SELECT id, escrow_amount, platform_fee, amount 
      FROM payments 
      WHERE escrow_amount IS NULL 
      LIMIT 10
    `;
    
    console.log('Found payments with null escrow_amount:', payments);
    
    // Update all payments with null escrow_amount to have a default value
    // We'll set it to 0 if it's null, or calculate it based on the booking amount
    console.log('🔄 Updating payments with null escrow_amount...');
    
    const updateResult = await prisma.$executeRaw`
      UPDATE payments 
      SET escrow_amount = COALESCE(escrow_amount, 0.0)
      WHERE escrow_amount IS NULL
    `;
    
    console.log(`✅ Updated ${updateResult} payments`);
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const nullPayments = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE escrow_amount IS NULL
    `;
    
    console.log('Remaining payments with null escrow_amount:', nullPayments);
    
    // Test a simple query to make sure the API works
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
    
    console.log('🎉 escrowAmount field fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing escrowAmount field:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixEscrowAmount()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
