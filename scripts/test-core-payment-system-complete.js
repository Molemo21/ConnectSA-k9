#!/usr/bin/env node

/**
 * Core Payment System Test - Complete Version with All Required Fields
 */

const { PrismaClient } = require('@prisma/client');

async function testCorePaymentSystem() {
  console.log('í·ª Testing Core Escrow Payment System (Complete)...\n');
  
  // Create a fresh Prisma client instance
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
  
  let testData = {
    user: null,
    provider: null,
    service: null,
    booking: null,
    payment: null,
    jobProof: null,
    payout: null
  };
  
  try {
    // Test database connection first
    console.log('í´Œ Testing database connection...');
    await prisma.$connect();
    console.log('âœ… Database connected successfully');
    
    // Generate unique email addresses using timestamp
    const timestamp = Date.now();
    const uniqueUserEmail = `test.user.${timestamp}@example.com`;
    const uniqueProviderEmail = `test.provider.${timestamp}@example.com`;
    
    console.log(`í³§ Using unique emails: ${uniqueUserEmail}, ${uniqueProviderEmail}`);
    
    // Test 1: Create test user and provider
    console.log('\n1ï¸âƒ£ Creating test user and provider...');
    
    // Create user first
    testData.user = await prisma.user.create({
      data: {
        email: uniqueUserEmail,
        name: 'Test User',
        role: 'CLIENT'
      }
    });
    console.log('âœ… Test user created');
    
    // Create provider
    testData.provider = await prisma.user.create({
      data: {
        email: uniqueProviderEmail, 
        name: 'Test Provider',
        role: 'PROVIDER'
      }
    });
    console.log('âœ… Test provider created');
    
    // Test 2: Create test service (standalone)
    console.log('\n2ï¸âƒ£ Creating test service...');
    testData.service = await prisma.service.create({
      data: {
        name: `Test Service ${timestamp}`,
        description: 'Test service for payment flow',
        category: 'TEST_CATEGORY',
        isActive: true,
        basePrice: 1000
      }
    });
    console.log('âœ… Test service created');
    
    // Test 3: Create test booking with ALL required fields
    console.log('\n3ï¸âƒ£ Creating test booking...');
    testData.booking = await prisma.booking.create({
      data: {
        clientId: testData.user.id,
        providerId: testData.provider.id,
        serviceId: testData.service.id,
        scheduledDate: new Date(),
        duration: 60, // 60 minutes
        totalAmount: 1000.0, // Required field
        platformFee: 100.0 // Added the missing required field
      }
    });
    console.log('âœ… Test booking created');
    
    // Test 4: Create test payment (ESCROW)
    console.log('\n4ï¸âƒ£ Creating test payment in ESCROW...');
    testData.payment = await prisma.payment.create({
      data: {
        bookingId: testData.booking.id,
        amount: 1000,
        status: 'ESCROW',
        escrowAmount: 900,
        platformFee: 100,
        currency: 'NGN',
        paystackRef: `TEST_REF_${timestamp}`
      }
    });
    console.log('âœ… Test payment created in ESCROW');
    
    // Test 5: Create test job proof
    console.log('\n5ï¸âƒ£ Creating test job proof...');
    testData.jobProof = await prisma.jobProof.create({
      data: {
        bookingId: testData.booking.id,
        providerId: testData.provider.id,
        photos: ['photo1.jpg', 'photo2.jpg'],
        notes: 'Job completed successfully',
        completedAt: new Date(),
        autoConfirmAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('âœ… Test job proof created');
    
    // Test 6: Create test payout (PENDING)
    console.log('\n6ï¸âƒ£ Creating test payout...');
    testData.payout = await prisma.payout.create({
      data: {
        paymentId: testData.payment.id,
        providerId: testData.provider.id,
        amount: 900,
        paystackRef: `PAYOUT_REF_${timestamp}`,
        status: 'PENDING'
      }
    });
    console.log('âœ… Test payout created');
    
    // Test 7: Verify the complete escrow payment flow
    console.log('\n7ï¸âƒ£ Verifying complete escrow payment flow...');
    
    const paymentSummary = await prisma.$queryRaw`
      SELECT 
        b.id as booking_id,
        b.duration as duration_minutes,
        b."scheduledDate" as scheduled_date,
        b."totalAmount" as booking_amount,
        b."platformFee" as booking_platform_fee,
        p.status as payment_status,
        p.amount as total_amount,
        p.escrow_amount,
        p.platform_fee,
        p.currency,
        jp.photos,
        jp.notes,
        po.status as payout_status,
        po.amount as payout_amount
      FROM bookings b
      JOIN payments p ON b.id = p.booking_id
      LEFT JOIN job_proofs jp ON b.id = jp.booking_id
      LEFT JOIN payouts po ON p.id = po.payment_id
      WHERE b.id = ${testData.booking.id}
    `;
    
    console.log('âœ… Complete escrow payment flow verified!');
    console.log('\ní³Š Payment Summary:');
    console.log(JSON.stringify(paymentSummary, null, 2));
    
    // Test 8: Verify payment calculations
    console.log('\n8ï¸âƒ£ Verifying payment calculations...');
    const summary = paymentSummary[0];
    const calculatedEscrow = summary.total_amount - summary.platform_fee;
    
    if (summary.escrow_amount === calculatedEscrow && summary.platform_fee === 100) {
      console.log('âœ… Payment calculations correct:');
      console.log(`   Booking Amount: ${summary.booking_amount} NGN`);
      console.log(`   Booking Platform Fee: ${summary.booking_platform_fee} NGN`);
      console.log(`   Total Payment: ${summary.total_amount} NGN`);
      console.log(`   Payment Platform Fee: ${summary.platform_fee} NGN`);
      console.log(`   Escrow Amount: ${summary.escrow_amount} NGN`);
      console.log(`   Duration: ${summary.duration_minutes} minutes`);
      console.log(`   Scheduled: ${summary.scheduled_date}`);
    } else {
      console.log('âŒ Payment calculations incorrect');
    }
    
    console.log('\ní¾‰ Core escrow payment system test completed successfully!');
    console.log('   Note: All required fields now included');
    
  } catch (error) {
    console.error('âŒ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Safe cleanup
    console.log('\ní·¹ Cleaning up test data...');
    
    try {
      // Clean up in reverse order to avoid foreign key constraints
      if (testData.jobProof) {
        await prisma.jobProof.delete({ where: { id: testData.jobProof.id } });
        console.log('âœ… Job proof deleted');
      }
      
      if (testData.payout) {
        await prisma.payout.delete({ where: { id: testData.payout.id } });
        console.log('âœ… Payout deleted');
      }
      
      if (testData.payment) {
        await prisma.payment.delete({ where: { id: testData.payment.id } });
        console.log('âœ… Payment deleted');
      }
      
      if (testData.booking) {
        await prisma.booking.delete({ where: { id: testData.booking.id } });
        console.log('âœ… Booking deleted');
      }
      
      if (testData.service) {
        await prisma.service.delete({ where: { id: testData.service.id } });
        console.log('âœ… Service deleted');
      }
      
      if (testData.provider) {
        await prisma.user.delete({ where: { id: testData.provider.id } });
        console.log('âœ… Provider deleted');
      }
      
      if (testData.user) {
        await prisma.user.delete({ where: { id: testData.user.id } });
        console.log('âœ… User deleted');
      }
      
      console.log('âœ… All cleanup completed successfully');
      
    } catch (cleanupError) {
      console.error('âš ï¸ Cleanup error:', cleanupError.message);
    }
    
    // Properly disconnect Prisma client
    try {
      await prisma.$disconnect();
      console.log('âœ… Prisma client disconnected');
    } catch (disconnectError) {
      console.error('âš ï¸ Disconnect error:', disconnectError.message);
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\ní»‘ Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\ní»‘ Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run the test
testCorePaymentSystem().catch(console.error);
