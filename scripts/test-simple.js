const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleTest() {
  try {
    console.log('🧪 Simple Database Test...\n');

    // 1. Test basic connection
    console.log('📡 Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Users: ${userCount}`);

    // 2. Test booking fetch without includes
    console.log('\n📋 Testing basic booking fetch...');
    const basicBookings = await prisma.booking.findMany({
      take: 3,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        clientId: true,
        providerId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Successfully fetched ${basicBookings.length} basic bookings`);
    basicBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Amount: R${booking.totalAmount}`);
    });

    // 3. Test with service include
    console.log('\n🔧 Testing with service include...');
    const bookingsWithService = await prisma.booking.findMany({
      take: 2,
      include: {
        service: {
          select: {
            name: true,
            category: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Successfully fetched ${bookingsWithService.length} bookings with service`);
    bookingsWithService.forEach((booking, index) => {
      console.log(`  ${index + 1}. Service: ${booking.service?.name || 'N/A'}, Status: ${booking.status}`);
    });

    // 4. Test with provider include
    console.log('\n👷 Testing with provider include...');
    const bookingsWithProvider = await prisma.booking.findMany({
      take: 2,
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Successfully fetched ${bookingsWithProvider.length} bookings with provider`);
    bookingsWithProvider.forEach((booking, index) => {
      console.log(`  ${index + 1}. Provider: ${booking.provider?.user?.name || 'N/A'}, Status: ${booking.status}`);
    });

    // 5. Test with payment include
    console.log('\n💳 Testing with payment include...');
    const bookingsWithPayment = await prisma.booking.findMany({
      take: 2,
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Successfully fetched ${bookingsWithPayment.length} bookings with payment`);
    bookingsWithPayment.forEach((booking, index) => {
      if (booking.payment) {
        console.log(`  ${index + 1}. Payment: R${booking.payment.amount}, Status: ${booking.payment.status}`);
      } else {
        console.log(`  ${index + 1}. No payment`);
      }
    });

    // 6. Test the full include (what the dashboard needs)
    console.log('\n🎯 Testing full include (dashboard requirement)...');
    try {
      const fullBookings = await prisma.booking.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
      
      console.log(`✅ Successfully fetched ${fullBookings.length} bookings with full includes`);
      if (fullBookings.length > 0) {
        const booking = fullBookings[0];
        console.log(`   Sample: ID: ${booking.id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Service: ${booking.service?.name || 'N/A'}`);
        console.log(`   Provider: ${booking.provider?.user?.name || 'N/A'}`);
        console.log(`   Payment: ${booking.payment ? 'Exists' : 'None'}`);
        console.log(`   Review: ${booking.review ? 'Exists' : 'None'}`);
      }
    } catch (error) {
      console.log('❌ Full include failed:', error.message);
      console.log('   This is what the dashboard needs to work');
    }

    console.log('\n🎉 Simple test completed!');
    console.log('✅ If all tests passed, your dashboard should work');
    console.log('❌ If any test failed, there are still issues to resolve');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
simpleTest();
