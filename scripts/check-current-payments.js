const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentPayments() {
  try {
    console.log('🔍 Checking current payment data...\n');

    // Check all payments
    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          include: {
            client: true,
            provider: true,
            service: true
          }
        }
      }
    });

    console.log(`📊 Found ${payments.length} payments:\n`);

    payments.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`);
      console.log(`  ID: ${payment.id}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Amount: ${payment.amount}`);
      console.log(`  Escrow Amount: ${payment.escrowAmount}`);
      console.log(`  Platform Fee: ${payment.platformFee}`);
      console.log(`  Paystack Ref: ${payment.paystackRef}`);
      console.log(`  Currency: ${payment.currency}`);
      console.log(`  Created: ${payment.createdAt}`);
      console.log(`  Booking Status: ${payment.booking?.status}`);
      console.log(`  Service: ${payment.booking?.service?.name}`);
      console.log(`  Client: ${payment.booking?.client?.email}`);
      console.log(`  Provider: ${payment.booking?.provider?.businessName || payment.booking?.provider?.user?.email}`);
      console.log('');
    });

    // Check for null values
    const nullEscrowPayments = payments.filter(p => p.escrowAmount === null);
    const nullPlatformFeePayments = payments.filter(p => p.platformFee === null);
    const pendingPayments = payments.filter(p => p.status === 'PENDING');

    console.log('⚠️ Issues Found:');
    if (nullEscrowPayments.length > 0) {
      console.log(`  - ${nullEscrowPayments.length} payments have null escrow amounts`);
    }
    if (nullPlatformFeePayments.length > 0) {
      console.log(`  - ${nullPlatformFeePayments.length} payments have null platform fees`);
    }
    if (pendingPayments.length > 0) {
      console.log(`  - ${pendingPayments.length} payments are stuck in PENDING status`);
    }

    // Check webhook events
    const webhookEvents = await prisma.webhookEvent.findMany();
    console.log(`\n📨 Webhook Events: ${webhookEvents.length} total`);
    
    if (webhookEvents.length === 0) {
      console.log('  ❌ No webhook events found - this explains why payments are stuck!');
    } else {
      webhookEvents.forEach((event, index) => {
        console.log(`  Event ${index + 1}: ${event.eventType} - ${event.processed ? 'Processed' : 'Pending'} - ${event.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentPayments();
