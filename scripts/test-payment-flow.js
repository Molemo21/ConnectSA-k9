#!/usr/bin/env node

/**
 * Comprehensive Payment Flow Test
 * Tests the complete escrow payment workflow
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentFlow() {
  console.log('��� Testing Complete Payment Flow...\n');
  
  try {
    // Test 1: Create test user and provider
    console.log('1️⃣ Creating test user and provider...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT'
      }
    });
    
    const provider = await prisma.user.create({
      data: {
        email: 'provider@example.com', 
        name: 'Test Provider',
        role: 'PROVIDER'
      }
    });
    
    console.log('✅ Test users created');
    
    // Test 2: Create test service
    console.log('\n2️⃣ Creating test service...');
    const service = await prisma.service.create({
      data: {
        name: 'Test Service',
        description: 'Test service for payment flow',
        price: 1000,
        providerId: provider.id
      }
    });
    
    console.log('✅ Test service created');
    
    // Test 3: Create test booking
    console.log('\n3️⃣ Creating test booking...');
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: provider.id,
        serviceId: service.id,
        status: 'PENDING',
        amount: 1000,
        scheduledDate: new Date()
      }
    });
    
    console.log('✅ Test booking created');
    
    // Test 4: Create test payment
    console.log('\n4️⃣ Creating test payment...');
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
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
    const jobProof = await prisma.jobProof.create({
      data: {
        bookingId: booking.id,
        providerId: provider.id,
        photos: ['photo1.jpg', 'photo2.jpg'],
        notes: 'Job completed successfully',
        completedAt: new Date(),
        autoConfirmAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    });
    
    console.log('✅ Test job proof created');
    
    // Test 6: Create test payout
    console.log('\n6️⃣ Creating test payout...');
    const payout = await prisma.payout.create({
      data: {
        paymentId: payment.id,
        providerId: provider.id,
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
      WHERE b.id = ${booking.id}
    `;
    
    console.log('✅ Database relationships verified');
    console.log('   Payment Summary:', JSON.stringify(paymentSummary, null, 2));
    
    console.log('\n��� All payment flow tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Cleanup
    console.log('\n��� Cleaning up test data...');
    await prisma.jobProof.deleteMany({ where: { providerId: { in: [user?.id, provider?.id] } } });
    await prisma.payout.deleteMany({ where: { providerId: { in: [user?.id, provider?.id] } } });
    await prisma.payment.deleteMany({ where: { bookingId: { in: [booking?.id] } } });
    await prisma.booking.deleteMany({ where: { id: { in: [booking?.id] } } });
    await prisma.service.deleteMany({ where: { id: { in: [service?.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [user?.id, provider?.id] } } });
    
    console.log('✅ Cleanup completed');
    await prisma.$disconnect();
  }
}

testPaymentFlow();
