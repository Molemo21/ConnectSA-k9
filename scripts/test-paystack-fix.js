const { PrismaClient } = require('@prisma/client');

async function testPaymentFlow() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing payment flow...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test finding a booking that can be paid
    const booking = await prisma.booking.findFirst({
      where: {
        status: 'CONFIRMED',
        payment: null
      },
      include: {
        client: true,
        provider: true,
        service: true
      }
    });
    
    if (!booking) {
      console.log('ℹ️ No confirmed booking without payment found');
      
      // Try to find any booking
      const anyBooking = await prisma.booking.findFirst({
        include: {
          client: true,
          provider: true,
          service: true,
          payment: true
        }
      });
      
      if (anyBooking) {
        console.log(`📋 Found booking ${anyBooking.id} with status: ${anyBooking.status}`);
        console.log(`💰 Has payment: ${!!anyBooking.payment}`);
        console.log(`👤 Client: ${anyBooking.client?.email || 'N/A'}`);
        console.log(`🏢 Provider: ${anyBooking.provider?.businessName || 'N/A'}`);
      } else {
        console.log('❌ No bookings found in database');
      }
    } else {
      console.log(`✅ Found confirmed booking ${booking.id} without payment`);
      console.log(`💰 Amount: R${booking.totalAmount || 0}`);
      console.log(`👤 Client: ${booking.client?.email || 'N/A'}`);
      console.log(`🏢 Provider: ${booking.provider?.businessName || 'N/A'}`);
    }
    
    // Test environment variables
    console.log('\n🔧 Environment check:');
    console.log(`PAYSTACK_SECRET_KEY: ${process.env.PAYSTACK_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`PAYSTACK_PUBLIC_KEY: ${process.env.PAYSTACK_PUBLIC_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentFlow();
