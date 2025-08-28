const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRemainingIssues() {
  try {
    console.log('🔧 Fixing Remaining Issues...\n');

    // 1. Fix invalid booking statuses
    console.log('📋 Fixing invalid booking statuses...');
    
    try {
      // First, let's see what statuses we have
      const statuses = await prisma.$queryRaw`
        SELECT DISTINCT status, COUNT(*) as count 
        FROM "bookings" 
        GROUP BY status 
        ORDER BY count DESC
      `;
      
      console.log('📊 Current booking statuses:');
      statuses.forEach(status => {
        console.log(`  ${status.status}: ${status.count} bookings`);
      });

      // Fix any remaining invalid statuses
      await prisma.$executeRaw`
        UPDATE "bookings" 
        SET "status" = 'PENDING' 
        WHERE "status" NOT IN ('PENDING', 'CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'DISPUTED')
      `;
      console.log('✅ Invalid booking statuses fixed');
      
    } catch (error) {
      console.log('⚠️ Error fixing booking statuses:', error.message);
    }

    // 2. Fix null payment fields
    console.log('\n💳 Fixing null payment fields...');
    
    try {
      // Update any payments with null escrowAmount
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET "escrowAmount" = "amount" 
        WHERE "escrowAmount" IS NULL
      `;
      console.log('✅ Fixed null escrowAmount values');

      // Update any payments with null platformFee
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET "platformFee" = 0.00 
        WHERE "platformFee" IS NULL
      `;
      console.log('✅ Fixed null platformFee values');

      // Update any payments with null currency
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET "currency" = 'ZAR' 
        WHERE "currency" IS NULL
      `;
      console.log('✅ Fixed null currency values');

    } catch (error) {
      console.log('⚠️ Error fixing payment fields:', error.message);
    }

    // 3. Verify the fixes
    console.log('\n🔍 Verifying the fixes...');
    
    try {
      const testBookings = await prisma.booking.findMany({
        take: 3,
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
      
      console.log(`✅ Successfully fetched ${testBookings.length} bookings with all relations`);
      
      testBookings.forEach((booking, index) => {
        console.log(`\n  ${index + 1}. Booking ID: ${booking.id}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Service: ${booking.service?.name || 'N/A'}`);
        console.log(`     Amount: R${booking.totalAmount || 0}`);
        console.log(`     Duration: ${booking.duration || 'N/A'} minutes`);
        console.log(`     Platform Fee: R${booking.platformFee || 0}`);
        console.log(`     Address: ${booking.address || 'N/A'}`);
        if (booking.payment) {
          console.log(`     Payment: Status: ${booking.payment.status}, Amount: R${booking.payment.amount}, Escrow: R${booking.payment.escrowAmount}`);
        } else {
          console.log(`     Payment: None`);
        }
      });

    } catch (error) {
      console.log('❌ Error testing booking fetch:', error.message);
      console.log('   This suggests there are still schema issues to resolve');
    }

    // 4. Test the my-bookings API endpoint logic
    console.log('\n🧪 Testing API endpoint logic...');
    
    try {
      // Simulate what the my-bookings API does
      const allBookings = await prisma.booking.findMany({
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

      console.log(`✅ Successfully fetched ${allBookings.length} total bookings`);
      
      // Group by client to simulate user-specific fetch
      const bookingsByClient = {};
      allBookings.forEach(booking => {
        if (!bookingsByClient[booking.clientId]) {
          bookingsByClient[booking.clientId] = [];
        }
        bookingsByClient[booking.clientId].push(booking);
      });

      console.log(`📊 Bookings distributed across ${Object.keys(bookingsByClient).length} clients`);
      
      Object.entries(bookingsByClient).forEach(([clientId, bookings]) => {
        console.log(`   Client ${clientId}: ${bookings.length} bookings`);
      });

    } catch (error) {
      console.log('❌ Error testing API logic:', error.message);
    }

    console.log('\n🎉 Issue fixing completed!');
    console.log('✅ Your existing bookings should now appear in the dashboard');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart your Next.js development server');
    console.log('   2. Check the dashboard - existing bookings should now appear');
    console.log('   3. Test creating a new booking to ensure everything works');

  } catch (error) {
    console.error('❌ Issue fixing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRemainingIssues();
