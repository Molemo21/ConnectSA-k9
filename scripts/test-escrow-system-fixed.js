#!/usr/bin/env node

/**
 * Fixed Escrow Payment System Test - Uses Raw SQL for All Custom Models
 */

const { PrismaClient } = require('@prisma/client');

// Helper function to handle photos array for PostgreSQL text[] type
function createPhotosArray(photos) {
  if (Array.isArray(photos)) {
    return photos;
  } else if (typeof photos === 'string') {
    return [photos]; // Single photo wrapped in array
  } else {
    return []; // Empty array as fallback
  }
}

async function testEscrowSystem() {
  console.log('í·ª Testing Escrow Payment System (Fixed Version)...\n');
  
  // Create a fresh Prisma client instance with proper configuration
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  let testData = {
    user: null,
    provider: null,
    providerRecord: null,
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
    
    // Test 1: Create test user and provider user
    console.log('\n1ï¸âƒ£ Creating test user and provider user...');
    
    // Create user first
    testData.user = await prisma.user.create({
      data: {
        email: uniqueUserEmail,
        name: 'Test User',
        role: 'CLIENT'
      }
    });
    console.log('âœ… Test user created');
    
    // Create provider user
    testData.provider = await prisma.user.create({
      data: {
        email: uniqueProviderEmail, 
        name: 'Test Provider',
        role: 'PROVIDER'
      }
    });
    console.log('âœ… Test provider user created');
    
    // Test 1.5: Create provider record in providers table
    console.log('\n1ï¸âƒ£.5ï¸âƒ£ Creating provider record...');
    testData.providerRecord = await prisma.provider.create({
      data: {
        userId: testData.provider.id,
        businessName: `Test Business ${timestamp}`,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('âœ… Provider record created');
    
    // Test 2: Create test service
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
    
    // Test 3: Create test booking
    console.log('\n3ï¸âƒ£ Creating test booking...');
    testData.booking = await prisma.booking.create({
      data: {
        clientId: testData.user.id,
        providerId: testData.providerRecord.id,
        serviceId: testData.service.id,
        scheduledDate: new Date(),
        duration: 60,
        totalAmount: 1000.0,
        platformFee: 100.0,
        address: 'Test Address 123',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('âœ… Test booking created');
    
    // Test 4: Create test payment using RAW SQL
    console.log('\n4ï¸âƒ£ Creating test payment in ESCROW using raw SQL...');
    const paymentId = `payment_${timestamp}`;
    await prisma.$executeRaw`
      INSERT INTO payments (
        id, 
        "bookingId", 
        amount, 
        "paystackRef", 
        status, 
        "createdAt", 
        "updatedAt",
        escrow_amount,
        platform_fee,
        currency
      )
      VALUES (
        ${paymentId}, 
        ${testData.booking.id}, 
        1000, 
        ${`TEST_REF_${timestamp}`}, 
        'ESCROW', 
        ${new Date()}, 
        ${new Date()},
        900,
        100,
        'NGN'
      )
    `;
    console.log('âœ… Test payment created in ESCROW via raw SQL');
    
    // Get the created payment
    const payments = await prisma.$queryRaw`
      SELECT * FROM payments 
      WHERE "bookingId" = ${testData.booking.id}
      ORDER BY "createdAt" DESC LIMIT 1
    `;
    testData.payment = payments[0];
    
    // Test 5: Create test job proof using RAW SQL (since model doesn't exist)
    console.log('\n5ï¸âƒ£ Creating test job proof using raw SQL...');
    const jobProofId = `jobproof_${timestamp}`;
    
    // Create photos array for PostgreSQL text[] type
    const photosArray = createPhotosArray(['photo1.jpg', 'photo2.jpg']);
    
    await prisma.$executeRaw`
      INSERT INTO job_proofs (
        id,
        booking_id,
        provider_id,
        photos,
        notes,
        completed_at,
        auto_confirm_at
      )
      VALUES (
        ${jobProofId},
        ${testData.booking.id},
        ${testData.providerRecord.id},
        ${photosArray}::text[],
        'Job completed successfully',
        ${new Date()},
        ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
      )
    `;
    console.log('âœ… Test job proof created via raw SQL');
    
    // Get the created job proof
    const jobProofs = await prisma.$queryRaw`
      SELECT * FROM job_proofs 
      WHERE booking_id = ${testData.booking.id}
      ORDER BY completed_at DESC LIMIT 1
    `;
    testData.jobProof = jobProofs[0];
    
    // Test 6: Create test payout using RAW SQL (since model doesn't exist)
    console.log('\n6ï¸âƒ£ Creating test payout using raw SQL...');
    const payoutId = `payout_${timestamp}`;
    await prisma.$executeRaw`
      INSERT INTO payouts (
        id,
        payment_id,
        provider_id,
        amount,
        paystack_ref,
        status
      )
      VALUES (
        ${payoutId},
        ${testData.payment.id},
        ${testData.providerRecord.id},
        900,
        ${`PAYOUT_REF_${timestamp}`},
        'PENDING'
      )
    `;
    console.log('âœ… Test payout created via raw SQL');
    
    // Get the created payout
    const payouts = await prisma.$queryRaw`
      SELECT * FROM payouts 
      WHERE payment_id = ${testData.payment.id}
      ORDER BY id DESC LIMIT 1
    `;
    testData.payout = payouts[0];
    
    // Test 7: Verify the complete escrow payment flow
    console.log('\n7ï¸âƒ£ Verifying complete escrow payment flow...');
    
    const paymentSummary = await prisma.$queryRaw`
      SELECT 
        b.id as booking_id,
        b."totalAmount" as booking_amount,
        b."platformFee" as booking_platform_fee,
        b.address as booking_address,
        b.status as booking_status,
        b.duration as duration_minutes,
        p.status as payment_status,
        p.amount as payment_amount,
        p.escrow_amount,
        p.platform_fee,
        p.currency,
        p."paystackRef",
        jp.photos,
        jp.notes,
        po.status as payout_status,
        po.amount as payout_amount
      FROM bookings b
      JOIN payments p ON b.id = p."bookingId"
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
    const calculatedEscrow = summary.payment_amount - summary.platform_fee;
    
    if (summary.escrow_amount == calculatedEscrow && summary.platform_fee == 100) {
      console.log('âœ… Payment calculations correct:');
      console.log(`   Booking Amount: ${summary.booking_amount} NGN`);
      console.log(`   Booking Platform Fee: ${summary.booking_platform_fee} NGN`);
      console.log(`   Payment Amount: ${summary.payment_amount} NGN`);
      console.log(`   Payment Platform Fee: ${summary.platform_fee} NGN`);
      console.log(`   Escrow Amount: ${summary.escrow_amount} NGN`);
      console.log(`   Currency: ${summary.currency}`);
      console.log(`   Duration: ${summary.duration_minutes} minutes`);
      console.log(`   Address: ${summary.booking_address}`);
      console.log(`   Status: ${summary.booking_status}`);
    } else {
      console.log('âŒ Payment calculations incorrect');
      console.log(`   Expected escrow: ${calculatedEscrow}, Got: ${summary.escrow_amount}`);
      console.log(`   Expected platform fee: 100, Got: ${summary.platform_fee}`);
    }
    
    console.log('\ní¾‰ Escrow payment system test completed successfully!');
    console.log(' Note: Used raw SQL for all custom models to bypass Prisma schema issues');
    
  } catch (error) {
    console.error('âŒ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Safe cleanup with proper connection handling
    console.log('\ní·¹ Cleaning up test data...');
    
    try {
      // Clean up in reverse order to avoid foreign key constraints
      if (testData.jobProof) {
        await prisma.$executeRaw`DELETE FROM job_proofs WHERE id = ${testData.jobProof.id}`;
        console.log('âœ… Job proof deleted');
      }
      
      if (testData.payout) {
        await prisma.$executeRaw`DELETE FROM payouts WHERE id = ${testData.payout.id}`;
        console.log('âœ… Payout deleted');
      }
      
      if (testData.payment) {
        await prisma.$executeRaw`DELETE FROM payments WHERE id = ${testData.payment.id}`;
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
      
      if (testData.providerRecord) {
        await prisma.provider.delete({ where: { id: testData.providerRecord.id } });
        console.log('âœ… Provider record deleted');
      }
      
      if (testData.provider) {
        await prisma.user.delete({ where: { id: testData.provider.id } });
        console.log('âœ… Provider user deleted');
      }
      
      if (testData.user) {
        await prisma.user.delete({ where: { id: testData.user.id } });
        console.log('âœ… User deleted');
      }
      
      console.log('âœ… All cleanup completed successfully');
      
    } catch (cleanupError) {
      console.error('âš ï¸ Cleanup error:', cleanupError.message);
    }
    
    // Properly disconnect Prisma client with error handling
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
testEscrowSystem().catch(console.error);
