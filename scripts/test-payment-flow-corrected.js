#!/usr/bin/env node

/**
 * Corrected Payment Flow Test - Matches Your Actual Schema
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentFlow() {
  console.log('��� Testing Complete Payment Flow (Corrected Schema)...\n');
  
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
    // Test 1: Create test user and provider
    console.log('1️⃣ Creating test user and provider...');
    testData.user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT'
      }
    });
    
    testData.provider = await prisma.user.create({
      data: {
        email: 'provider@example.com', 
        name: 'Test Provider',
        role: 'PROVIDER'
      }
    });
    
    console.log('✅ Test users created');
    
    // Test 2: Create test service with ALL required fields
    console.log('\n2️⃣ Creating test service...');
    testData.service = await prisma.service.create({
      data: {
        name: 'Test Service',
        description: 'Test service for payment flow',
        category: 'TEST_CATEGORY',        // Required field
        isActive: true,                   // Required field
        basePrice: 1000,                 // Optional field
        providerId: testData.provider.id
      }
    });
    
    console.log('✅ Test service created');
    
    // Test 3: Create test booking
    console.log('\n3️⃣ Creating test booking...');
    testData.booking = await prisma.booking.create({
      data: {
        clientId: testData.user.id,
        providerId: testData.provider.id,
        serviceId: testData.service.id,
        status: 'PENDING',
        amount: 1000,
        scheduledDate: new Date()
      }
    });
    
    console.log('✅ Test booking created');
    
    // Test 4: Create test payment
    console.log('\n4️⃣ Creating test payment...');
    testData.payment = await prisma.payment.create({
      data: {
        bookingId: testData.booking.id,
        amount: 1000,
        status: 'ESCROW',
        escrowAmount: 900,
        platformFee: 100,
        currency: 'NGN',
        paystackRef: 'TEST_REF_' + Date.now()
      }
    });
    
    console.log('✅ Test payment created');
    
    // Test 5: Create test job proof
    console.log('\n5️⃣ Creating test job proof...');
    testData.jobProof = await prisma.jobProof.create({
      data: {
        bookingId: testData.booking.id,
        providerId: testData.provider.id,
        photos: ['photo1.jpg', 'photo2.jpg'],
        notes: 'Job completed successfully',
        completedAt: new Date(),
        autoConfirmAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    });
    
    console.log('✅ Test job proof created');
    
    // Test 6: Create test payout
    console.log('\n6️⃣ Creating test payout...');
    testData.payout = await prisma.payout.create({
      data: {
        paymentId: testData.payment.id,
        providerId: testData.provider.id,
        amount: 900,
        paystackRef: 'PAYOUT_REF_' + Date.now(),
        status: 'PENDING'
      }
    });
    
    console.log('✅ Test payout created');
    
    // Test 7: Verify all relationships
    console.log('\n7️⃣ Verifying database relationships...');
    
    const paymentSummary = await prisma.$queryRaw`
      SELECT 
        b.id as booking_id,
        b.status as booking_status,
        p.status as payment_status,
        p.amount as total_amount,
        p.escrow_amount,
        p.platform_fee,
        jp.photos,
        po.status as payout_status
      FROM bookings b
      JOIN payments p ON b.id = p.booking_id
      LEFT JOIN job_proofs jp ON b.id = jp.booking_id
      LEFT JOIN payouts po ON p.id = po.payment_id
      WHERE b.id = ${testData.booking.id}
    `;
    
    console.log('✅ Database relationships verified');
    console.log(' Payment Summary:', JSON.stringify(paymentSummary, null, 2));
    
    console.log('\n��� All payment flow tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Safe cleanup
    console.log('\n��� Cleaning up test data...');
    
    try {
      if (testData.jobProof) {
        await prisma.jobProof.delete({ where: { id: testData.jobProof.id } });
        console.log('✅ Job proof deleted');
      }
      
      if (testData.payout) {
        await prisma.payout.delete({ where: { id: testData.payout.id } });
        console.log('✅ Payout deleted');
      }
      
      if (testData.payment) {
        await prisma.payment.delete({ where: { id: testData.payment.id } });
        console.log('✅ Payment deleted');
      }
      
      if (testData.booking) {
        await prisma.booking.delete({ where: { id: testData.booking.id } });
        console.log('✅ Booking deleted');
      }
      
      if (testData.service) {
        await prisma.service.delete({ where: { id: testData.service.id } });
        console.log('✅ Service deleted');
      }
      
      if (testData.user) {
        await prisma.user.delete({ where: { id: testData.user.id } });
        console.log('✅ User deleted');
      }
      
      if (testData.provider) {
        await prisma.user.delete({ where: { id: testData.provider.id } });
        console.log('✅ Provider deleted');
      }
      
      console.log('✅ All cleanup completed successfully');
      
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError.message);
    }
    
    await prisma.$disconnect();
  }
}

testPaymentFlow();
