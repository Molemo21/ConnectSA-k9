require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReleasePaymentAPI() {
  console.log('🧪 TESTING RELEASE PAYMENT API');
  console.log('===============================');

  try {
    // Get a booking with failed payout
    const bookingWithFailedPayout = await prisma.booking.findFirst({
      where: {
        status: 'AWAITING_CONFIRMATION',
        payment: {
          status: 'ESCROW',
          payout: {
            status: 'FAILED'
          }
        }
      },
      include: {
        payment: {
          include: {
            payout: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            bankName: true,
            bankCode: true,
            accountNumber: true,
            accountName: true,
            recipientCode: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    });

    if (!bookingWithFailedPayout) {
      console.log('❌ No booking with failed payout found');
      return;
    }

    console.log(`\n📋 Testing with booking: ${bookingWithFailedPayout.id}`);
    console.log(`Service: ${bookingWithFailedPayout.service?.name}`);
    console.log(`Amount: R${bookingWithFailedPayout.totalAmount}`);
    console.log(`Escrow Amount: R${bookingWithFailedPayout.payment.escrowAmount}`);
    console.log(`Provider: ${bookingWithFailedPayout.provider.businessName || 'Unknown'}`);
    
    const payout = bookingWithFailedPayout.payment.payout;
    console.log(`\n📋 Existing Payout:`);
    console.log(`ID: ${payout.id}`);
    console.log(`Status: ${payout.status}`);
    console.log(`Amount: R${payout.amount}`);
    console.log(`Transfer Code: ${payout.transferCode || 'None'}`);
    console.log(`Paystack Ref: ${payout.paystackRef}`);

    // Test the API call
    console.log(`\n🌐 Testing API call to /api/book-service/${bookingWithFailedPayout.id}/release-payment`);
    
    const response = await fetch(`http://localhost:3000/api/book-service/${bookingWithFailedPayout.id}/release-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This will fail auth, but we can see the error
      }
    });

    console.log(`Response Status: ${response.status}`);
    const responseData = await response.json();
    console.log(`Response Data:`, responseData);

  } catch (error) {
    console.error('❌ Error testing release payment API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReleasePaymentAPI();
