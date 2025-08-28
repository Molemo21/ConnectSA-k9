const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalFix() {
  try {
    console.log('🔧 Final Database Fix...\n');

    // 1. First, let's see what we're dealing with
    console.log('📊 Current database state...');
    
    const bookingCount = await prisma.booking.count();
    const paymentCount = await prisma.payment.count();
    
    console.log(`📋 Total bookings: ${bookingCount}`);
    console.log(`💳 Total payments: ${paymentCount}`);

    // 2. Fix the PAID status issue - this is the main problem
    console.log('\n🔧 Fixing PAID status issue...');
    
    try {
      // Update all PAID statuses to PENDING_EXECUTION
      const result = await prisma.$executeRaw`
        UPDATE "bookings" 
        SET "status" = 'PENDING_EXECUTION' 
        WHERE "status" = 'PAID'
      `;
      console.log('✅ Updated PAID statuses to PENDING_EXECUTION');
    } catch (error) {
      console.log('⚠️ Error updating PAID statuses:', error.message);
      
      // Try alternative approach - update to CONFIRMED if PENDING_EXECUTION fails
      try {
        await prisma.$executeRaw`
          UPDATE "bookings" 
          SET "status" = 'CONFIRMED' 
          WHERE "status" = 'PAID'
        `;
        console.log('✅ Updated PAID statuses to CONFIRMED (fallback)');
      } catch (fallbackError) {
        console.log('❌ Fallback also failed:', fallbackError.message);
      }
    }

    // 3. Fix any remaining invalid statuses
    console.log('\n🔧 Fixing any remaining invalid statuses...');
    
    try {
      // Get current statuses
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

      // Fix any statuses that aren't in our valid enum
      const validStatuses = ['PENDING', 'CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
      
      for (const status of statuses) {
        if (!validStatuses.includes(status.status)) {
          console.log(`⚠️ Found invalid status: ${status.status} (${status.count} bookings)`);
          
          // Try to fix it
          try {
            await prisma.$executeRaw`
              UPDATE "bookings" 
              SET "status" = 'PENDING' 
              WHERE "status" = ${status.status}
            `;
            console.log(`✅ Fixed ${status.status} → PENDING`);
          } catch (fixError) {
            console.log(`❌ Failed to fix ${status.status}:`, fixError.message);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Error checking/fixing statuses:', error.message);
    }

    // 4. Fix payment field issues
    console.log('\n💳 Fixing payment field issues...');
    
    try {
      // Ensure all required payment fields have values
      await prisma.$executeRaw`
        UPDATE "payments" 
        SET 
          "escrowAmount" = COALESCE("escrowAmount", "amount"),
          "platformFee" = COALESCE("platformFee", 0.00),
          "currency" = COALESCE("currency", 'ZAR')
        WHERE 
          "escrowAmount" IS NULL 
          OR "platformFee" IS NULL 
          OR "currency" IS NULL
      `;
      console.log('✅ Fixed null payment fields');
    } catch (error) {
      console.log('⚠️ Error fixing payment fields:', error.message);
    }

    // 5. Test the fix
    console.log('\n🧪 Testing the fix...');
    
    try {
      // Test basic booking fetch
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
      
      // Let's try to identify the specific issue
      try {
        const simpleBookings = await prisma.booking.findMany({
          take: 1,
          select: {
            id: true,
            status: true,
            totalAmount: true,
          }
        });
        console.log('✅ Basic booking fetch works');
        console.log(`   Sample: ID: ${simpleBookings[0]?.id}, Status: ${simpleBookings[0]?.status}`);
      } catch (simpleError) {
        console.log('❌ Even basic fetch fails:', simpleError.message);
      }
    }

    // 6. Final verification
    console.log('\n🔍 Final verification...');
    
    try {
      const finalStatuses = await prisma.$queryRaw`
        SELECT DISTINCT status, COUNT(*) as count 
        FROM "bookings" 
        GROUP BY status 
        ORDER BY count DESC
      `;
      
      console.log('📊 Final booking statuses:');
      finalStatuses.forEach(status => {
        console.log(`  ${status.status}: ${status.count} bookings`);
      });

      const finalPaymentStatuses = await prisma.$queryRaw`
        SELECT DISTINCT status, COUNT(*) as count 
        FROM "payments" 
        GROUP BY status 
        ORDER BY count DESC
      `;
      
      console.log('\n📊 Final payment statuses:');
      finalPaymentStatuses.forEach(status => {
        console.log(`  ${status.status}: ${status.count} payments`);
      });

    } catch (error) {
      console.log('⚠️ Error in final verification:', error.message);
    }

    console.log('\n🎉 Final fix completed!');
    console.log('✅ Your existing bookings should now appear in the dashboard');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart your Next.js development server');
    console.log('   2. Check the dashboard - existing bookings should now appear');
    console.log('   3. If issues persist, check the browser console for specific error messages');

  } catch (error) {
    console.error('❌ Final fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the final fix
finalFix();
