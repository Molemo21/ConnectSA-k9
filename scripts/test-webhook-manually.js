const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebhookManually() {
  try {
    console.log('🧪 Testing Webhook Endpoint Manually...\n');

    // 1. Find a recent payment to test with
    console.log('📋 Finding recent payment...');
    const recentPayment = await prisma.payment.findFirst({
      where: { status: 'PENDING' },
      include: { booking: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!recentPayment) {
      console.log('❌ No pending payment found. Create a payment first.');
      return;
    }

    console.log(`✅ Found payment: ${recentPayment.id}`);
    console.log(`   Amount: R${recentPayment.amount}`);
    console.log(`   Reference: ${recentPayment.paystackRef}`);
    console.log(`   Booking: ${recentPayment.bookingId}\n`);

    // 2. Simulate webhook payload
    console.log('📋 Simulating webhook payload...');
    const webhookPayload = {
      event: 'charge.success',
      data: {
        reference: recentPayment.paystackRef,
        id: 123456789,
        status: 'success',
        amount: recentPayment.amount * 100, // Paystack uses cents
        currency: 'ZAR'
      }
    };

    console.log('📊 Webhook payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));

    // 3. Test the webhook endpoint
    console.log('\n🌐 Testing webhook endpoint...');
    
    // Create a mock signature (for testing purposes)
    const crypto = require('crypto');
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || 'sk_test_c8ce9460fa0276d2ff1e1b94d6d478a89d1417f0';
    const signature = crypto
      .createHmac('sha512', webhookSecret)
      .update(JSON.stringify(webhookPayload))
      .digest('hex');

    console.log(`🔐 Generated signature: ${signature.substring(0, 20)}...`);

    // 4. Make the webhook call
    const response = await fetch('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await response.text();
    console.log(`\n📡 Webhook response: ${response.status} ${response.statusText}`);
    console.log(`Response body: ${responseText}`);

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      
      // 5. Verify database changes
      console.log('\n🔍 Verifying database changes...');
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: recentPayment.id },
        include: { booking: true }
      });

      console.log(`📊 Payment status: ${updatedPayment.status}`);
      console.log(`📊 Booking status: ${updatedPayment.booking.status}`);
      console.log(`📊 Paid at: ${updatedPayment.paidAt}`);

      if (updatedPayment.status === 'ESCROW' && updatedPayment.booking.status === 'PENDING_EXECUTION') {
        console.log('🎉 SUCCESS! Payment moved to escrow and booking updated!');
        console.log('✅ Phase 4 and 5 are now working!');
      } else {
        console.log('⚠️ Database not updated as expected');
      }
    } else {
      console.log('❌ Webhook failed');
      console.log('Check the server logs for more details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWebhookManually();
