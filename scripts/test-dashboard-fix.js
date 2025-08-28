const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardFix() {
  try {
    console.log('🧪 Testing Dashboard Fix...\n');

    // 1. Test if we can fetch bookings
    console.log('📋 Testing booking fetch...');
    const bookings = await prisma.booking.findMany({
      take: 5, // Limit to 5 for testing
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

    console.log(`✅ Successfully fetched ${bookings.length} bookings`);
    
    if (bookings.length > 0) {
      console.log('\n📊 Sample booking data:');
      bookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ID: ${booking.id}`);
        console.log(`     Status: ${booking.status}`);
        console.log(`     Service: ${booking.service?.name || 'N/A'}`);
        console.log(`     Client: ${booking.clientId}`);
        console.log(`     Provider: ${booking.providerId}`);
        console.log(`     Amount: R${booking.totalAmount || 0}`);
        console.log(`     Duration: ${booking.duration || 'N/A'} minutes`);
        console.log(`     Platform Fee: R${booking.platformFee || 0}`);
        console.log(`     Address: ${booking.address || 'N/A'}`);
        console.log(`     Payment: ${booking.payment ? `Status: ${booking.payment.status}, Amount: R${booking.payment.amount}` : 'None'}`);
        console.log('');
      });
    }

    // 2. Test if we can fetch a specific user's bookings
    console.log('👤 Testing user-specific booking fetch...');
    if (bookings.length > 0) {
      const firstBooking = bookings[0];
      const userBookings = await prisma.booking.findMany({
        where: { clientId: firstBooking.clientId },
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

      console.log(`✅ Successfully fetched ${userBookings.length} bookings for user ${firstBooking.clientId}`);
    }

    // 3. Test payment status compatibility
    console.log('\n💳 Testing payment status compatibility...');
    const payments = await prisma.payment.findMany({
      take: 3,
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          }
        }
      }
    });

    console.log(`✅ Found ${payments.length} payments`);
    payments.forEach((payment, index) => {
      console.log(`  ${index + 1}. Payment ID: ${payment.id}`);
      console.log(`     Amount: R${payment.amount}`);
      console.log(`     Status: ${payment.status}`);
      console.log(`     Escrow Amount: R${payment.escrowAmount || 'N/A'}`);
      console.log(`     Platform Fee: R${payment.platformFee || 'N/A'}`);
      console.log(`     Currency: ${payment.currency || 'N/A'}`);
      console.log(`     Booking Status: ${payment.booking?.status || 'N/A'}`);
      console.log('');
    });

    // 4. Test enum values
    console.log('🔍 Testing enum values...');
    const bookingStatuses = await prisma.$queryRaw`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM "bookings" 
      GROUP BY status 
      ORDER BY count DESC
    `;
    
    console.log('📊 Current booking statuses:');
    bookingStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status.count} bookings`);
    });

    const paymentStatuses = await prisma.$queryRaw`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM "payments" 
      GROUP BY status 
      ORDER BY count DESC
    `;
    
    console.log('\n📊 Current payment statuses:');
    paymentStatuses.forEach(status => {
      console.log(`  ${status.status}: ${status.count} payments`);
    });

    console.log('\n🎉 Dashboard fix test completed successfully!');
    console.log('✅ Your existing bookings should now appear in the dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'P2002') {
      console.error('   This might be a unique constraint issue');
    } else if (error.code === 'P2003') {
      console.error('   This might be a foreign key constraint issue');
    } else if (error.code === 'P2008') {
      console.error('   This might be a transaction timeout issue');
    }
    
    console.error('\n🔧 Please run the SQL migration scripts first:');
    console.error('   1. scripts/create-missing-tables.sql');
    console.error('   2. scripts/fix-existing-bookings.sql');
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDashboardFix();
