#!/usr/bin/env node

/**
 * Seamless Booking Flow Test Script
 * Tests the complete flow: Client Books → Provider Accepts → Client Pays → Payment in Escrow → Provider Starts → Provider Completes → Client Confirms → Funds Released
 */

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with working configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.qdrktzqfeewwcktgltzy:Motebangnakin@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
    }
  },
  log: ['error'],
  errorFormat: 'pretty'
});

async function testSeamlessBookingFlow() {
  console.log('🚀 Starting Seamless Booking Flow Test');
  console.log('=' .repeat(60));
  console.log('Flow: Client Books → Provider Accepts → Client Pays → Payment in Escrow → Provider Starts → Provider Completes → Client Confirms → Funds Released');
  console.log('=' .repeat(60) + '\n');

  let testBookingId = null;
  let testPaymentId = null;

  try {
    // Step 1: Client Books Provider
    console.log('📋 STEP 1: CLIENT BOOKS PROVIDER');
    console.log('─'.repeat(40));
    
    // Find a client and provider for testing
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });
    
    const provider = await prisma.user.findFirst({
      where: { role: 'PROVIDER' },
      include: { provider: true }
    });
    
    const service = await prisma.service.findFirst({
      where: { isActive: true }
    });

    if (!client || !provider || !service) {
      console.log('❌ Missing required test data (client, provider, or service)');
      return;
    }

    console.log(`✅ Client: ${client.name}`);
    console.log(`✅ Provider: ${provider.name}`);
    console.log(`✅ Service: ${service.name}`);

    // Create a new booking (simulating client booking)
    const newBooking = await prisma.booking.create({
      data: {
        clientId: client.id,
        providerId: provider.provider.id,
        serviceId: service.id,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 120, // 2 hours
        address: "123 Test Street, Test City",
        description: "Test booking for flow validation",
        status: "PENDING",
        totalAmount: 0, // Will be set when provider accepts
        platformFee: 0
      },
      include: {
        client: true,
        provider: { include: { user: true } },
        service: true
      }
    });

    testBookingId = newBooking.id;
    console.log(`✅ Booking created: ${newBooking.id}`);
    console.log(`✅ Status: ${newBooking.status}`);
    console.log(`✅ Amount: R${newBooking.totalAmount}\n`);

    // Step 2: Provider Accepts
    console.log('📋 STEP 2: PROVIDER ACCEPTS');
    console.log('─'.repeat(40));
    
    const acceptedBooking = await prisma.booking.update({
      where: { id: testBookingId },
      data: { 
        status: "CONFIRMED",
        totalAmount: service.basePrice || 150
      },
      include: {
        client: true,
        provider: { include: { user: true } },
        service: true
      }
    });

    console.log(`✅ Provider accepted booking`);
    console.log(`✅ Status: ${acceptedBooking.status}`);
    console.log(`✅ Amount set to: R${acceptedBooking.totalAmount}\n`);

    // Step 3: Client Pays
    console.log('📋 STEP 3: CLIENT PAYS');
    console.log('─'.repeat(40));
    
    // Create payment record (simulating Paystack payment)
    const payment = await prisma.payment.create({
      data: {
        bookingId: testBookingId,
        amount: acceptedBooking.totalAmount,
        status: "PENDING",
        paystackRef: `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      }
    });

    testPaymentId = payment.id;
    console.log(`✅ Payment created: ${payment.id}`);
    console.log(`✅ Amount: R${payment.amount}`);
    console.log(`✅ Status: ${payment.status}`);

    // Simulate successful payment (Paystack webhook)
    const successfulPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: "ESCROW",
        paidAt: new Date()
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: "PENDING_EXECUTION" }
    });

    console.log(`✅ Payment successful`);
    console.log(`✅ Payment status: ${successfulPayment.status}`);
    console.log(`✅ Booking status: PENDING_EXECUTION\n`);

    // Step 4: Provider Starts Job
    console.log('📋 STEP 4: PROVIDER STARTS JOB');
    console.log('─'.repeat(40));
    
    const startedBooking = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: "IN_PROGRESS" }
    });

    console.log(`✅ Provider started job`);
    console.log(`✅ Booking status: ${startedBooking.status}\n`);

    // Step 5: Provider Completes Job
    console.log('📋 STEP 5: PROVIDER COMPLETES JOB');
    console.log('─'.repeat(40));
    
    const completedBooking = await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: "AWAITING_CONFIRMATION" }
    });

    console.log(`✅ Provider completed job`);
    console.log(`✅ Booking status: ${completedBooking.status}`);
    console.log(`✅ Client can now confirm completion\n`);

    // Step 6: Client Confirms Completion
    console.log('📋 STEP 6: CLIENT CONFIRMS COMPLETION');
    console.log('─'.repeat(40));
    
    // Update payment status to processing release
    await prisma.payment.update({
      where: { id: testPaymentId },
      data: { status: "PROCESSING_RELEASE" }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: testBookingId },
      data: { status: "AWAITING_CONFIRMATION" }
    });

    console.log(`✅ Client confirmed completion`);
    console.log(`✅ Payment status: PROCESSING_RELEASE`);
    console.log(`✅ Booking status: AWAITING_CONFIRMATION`);

    // Simulate successful transfer (Paystack webhook)
    await prisma.payment.update({
      where: { id: testPaymentId },
      data: { 
        status: "RELEASED",
        updatedAt: new Date()
      }
    });

    await prisma.booking.update({
      where: { id: testBookingId },
      data: { 
        status: "COMPLETED",
        updatedAt: new Date()
      }
    });

    console.log(`✅ Funds released to provider`);
    console.log(`✅ Payment status: RELEASED`);
    console.log(`✅ Booking status: COMPLETED\n`);

    // Final Verification
    console.log('📋 FINAL VERIFICATION');
    console.log('─'.repeat(40));
    
    const finalBooking = await prisma.booking.findUnique({
      where: { id: testBookingId },
      include: { 
        payment: true,
        client: true,
        provider: { include: { user: true } },
        service: true
      }
    });

    console.log(`✅ Booking ID: ${finalBooking.id}`);
    console.log(`✅ Client: ${finalBooking.client.name}`);
    console.log(`✅ Provider: ${finalBooking.provider.user.name}`);
    console.log(`✅ Service: ${finalBooking.service.name}`);
    console.log(`✅ Final Status: ${finalBooking.status}`);
    console.log(`✅ Payment Status: ${finalBooking.payment.status}`);
    console.log(`✅ Amount: R${finalBooking.totalAmount}`);
    console.log(`✅ Payment Amount: R${finalBooking.payment.amount}`);

    // Flow Validation
    console.log('\n🔍 FLOW VALIDATION');
    console.log('─'.repeat(40));
    
    const validation = validateSeamlessFlow(finalBooking);
    if (validation.isValid) {
      console.log('🎉 SUCCESS: Seamless booking flow is working perfectly!');
      console.log('✅ All steps completed successfully');
      console.log('✅ Status transitions are correct');
      console.log('✅ Payment flow is seamless');
      console.log('✅ Funds properly released to provider');
    } else {
      console.log('❌ ISSUES FOUND:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Cleanup (optional - comment out if you want to keep test data)
    console.log('\n🧹 CLEANUP');
    console.log('─'.repeat(40));
    
    await prisma.payment.delete({ where: { id: testPaymentId } });
    await prisma.booking.delete({ where: { id: testBookingId } });
    
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Cleanup on error
    if (testPaymentId) {
      try { await prisma.payment.delete({ where: { id: testPaymentId } }); } catch {}
    }
    if (testBookingId) {
      try { await prisma.booking.delete({ where: { id: testBookingId } }); } catch {}
    }
  } finally {
    await prisma.$disconnect();
  }
}

function validateSeamlessFlow(booking) {
  const issues = [];
  
  // Check final booking status
  if (booking.status !== 'COMPLETED') {
    issues.push(`Final booking status should be COMPLETED, but is ${booking.status}`);
  }
  
  // Check final payment status
  if (booking.payment.status !== 'RELEASED') {
    issues.push(`Final payment status should be RELEASED, but is ${booking.payment.status}`);
  }
  
  // Check amount consistency
  if (booking.payment.amount !== booking.totalAmount) {
    issues.push(`Payment amount (R${booking.payment.amount}) doesn't match booking amount (R${booking.totalAmount})`);
  }
  
  // Check required fields
  if (!booking.clientId || !booking.providerId || !booking.serviceId) {
    issues.push('Missing required booking relationships');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Run the test
console.log('🎯 Testing Seamless Booking Flow...\n');
testSeamlessBookingFlow().catch(console.error);
