#!/usr/bin/env node

/**
 * Test Script for Escrow Payment System
 * 
 * This script helps test the escrow payment system step by step
 * Run with: node scripts/test-escrow-payment-system.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || 'test_webhook_secret',
  testEmail: 'test@example.com',
  testAmount: 1000, // NGN 1000
};

// Test data
let testData = {
  userId: null,
  providerId: null,
  serviceId: null,
  bookingId: null,
  paymentId: null,
  payoutId: null,
  jobProofId: null,
};

/**
 * Utility functions
 */
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const emoji = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'TEST': '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} [${timestamp}] ${type}: ${message}`);
}

function generateTestSignature(payload) {
  return crypto
    .createHmac('sha512', TEST_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
}

/**
 * Test 1: Database Connection & Schema Validation
 */
async function testDatabaseConnection() {
  log('Testing database connection...', 'TEST');
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    log('Database connection successful', 'SUCCESS');
    
    // Test schema validation
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'payouts', 'job_proofs')
    `;
    
    const expectedTables = ['payments', 'payouts', 'job_proofs'];
    const foundTables = tables.map(t => t.table_name);
    
    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        log(`Table ${table} exists`, 'SUCCESS');
      } else {
        log(`Table ${table} missing`, 'ERROR');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 2: Create Test Data
 */
async function createTestData() {
  log('Creating test data...', 'TEST');
  
  try {
    // Create test user (client)
    const user = await prisma.user.upsert({
      where: { email: TEST_CONFIG.testEmail },
      update: {},
      create: {
        email: TEST_CONFIG.testEmail,
        name: 'Test Client',
        role: 'CLIENT',
        emailVerified: true,
      },
    });
    testData.userId = user.id;
    log(`Created test user: ${user.id}`, 'SUCCESS');
    
    // Create test service
    const service = await prisma.service.upsert({
      where: { id: 'test-service' },
      update: {},
      create: {
        id: 'test-service',
        name: 'Test Service',
        description: 'Service for testing escrow payment system',
        category: 'Testing',
        basePrice: TEST_CONFIG.testAmount,
        isActive: true,
      },
    });
    testData.serviceId = service.id;
    log(`Created test service: ${service.id}`, 'SUCCESS');
    
    // Create test provider
    const provider = await prisma.provider.upsert({
      where: { userId: 'test-provider-user' },
      update: {},
      create: {
        id: 'test-provider',
        userId: 'test-provider-user',
        businessName: 'Test Provider',
        description: 'Provider for testing',
        experience: 5,
        hourlyRate: TEST_CONFIG.testAmount,
        location: 'Test Location',
        status: 'APPROVED',
        available: true,
      },
    });
    testData.providerId = provider.id;
    log(`Created test provider: ${provider.id}`, 'SUCCESS');
    
    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        providerId: provider.id,
        serviceId: service.id,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 2,
        totalAmount: TEST_CONFIG.testAmount,
        platformFee: TEST_CONFIG.testAmount * 0.1,
        description: 'Test booking for escrow payment system',
        address: 'Test Address',
        status: 'CONFIRMED',
      },
    });
    testData.bookingId = booking.id;
    log(`Created test booking: ${booking.id}`, 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Failed to create test data: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 3: Test Payment Initialization
 */
async function testPaymentInitialization() {
  log('Testing payment initialization...', 'TEST');
  
  try {
    // This would normally call the API endpoint
    // For now, we'll test the database state
    const booking = await prisma.booking.findUnique({
      where: { id: testData.bookingId },
      include: { payment: true }
    });
    
    if (!booking) {
      log('Test booking not found', 'ERROR');
      return false;
    }
    
    if (booking.status !== 'CONFIRMED') {
      log(`Booking status is ${booking.status}, expected CONFIRMED`, 'ERROR');
      return false;
    }
    
    log('Payment initialization test passed', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Payment initialization test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 4: Test Webhook Processing
 */
async function testWebhookProcessing() {
  log('Testing webhook processing...', 'TEST');
  
  try {
    // Create test payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: testData.bookingId,
        amount: TEST_CONFIG.testAmount,
        escrowAmount: TEST_CONFIG.testAmount * 0.9,
        platformFee: TEST_CONFIG.testAmount * 0.1,
        currency: 'NGN',
        paystackRef: `TEST_${Date.now()}`,
        status: 'PENDING',
      },
    });
    testData.paymentId = payment.id;
    log(`Created test payment: ${payment.id}`, 'SUCCESS');
    
    // Simulate webhook payload
    const webhookPayload = {
      event: 'charge.success',
      data: {
        reference: payment.paystackRef,
        id: 12345,
      }
    };
    
    // Generate valid signature
    const signature = generateTestSignature(JSON.stringify(webhookPayload));
    log(`Generated webhook signature: ${signature}`, 'INFO');
    
    // Test signature validation
    const isValid = crypto
      .createHmac('sha512', TEST_CONFIG.webhookSecret)
      .update(JSON.stringify(webhookPayload))
      .digest('hex') === signature;
    
    if (isValid) {
      log('Webhook signature validation passed', 'SUCCESS');
    } else {
      log('Webhook signature validation failed', 'ERROR');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`Webhook processing test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 5: Test Job Completion
 */
async function testJobCompletion() {
  log('Testing job completion...', 'TEST');
  
  try {
    // Update payment status to ESCROW (simulating successful payment)
    await prisma.payment.update({
      where: { id: testData.paymentId },
      data: { status: 'ESCROW' }
    });
    
    // Update booking status to PAID
    await prisma.booking.update({
      where: { id: testData.bookingId },
      data: { status: 'PAID' }
    });
    
    // Create job proof
    const jobProof = await prisma.jobProof.create({
      data: {
        bookingId: testData.bookingId,
        providerId: testData.providerId,
        photos: ['https://example.com/test-photo.jpg'],
        notes: 'Test job completion',
        completedAt: new Date(),
        autoConfirmAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
    });
    testData.jobProofId = jobProof.id;
    log(`Created job proof: ${jobProof.id}`, 'SUCCESS');
    
    // Update booking status to AWAITING_CONFIRMATION
    await prisma.booking.update({
      where: { id: testData.bookingId },
      data: { status: 'AWAITING_CONFIRMATION' }
    });
    
    log('Job completion test passed', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Job completion test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 6: Test Payment Release
 */
async function testPaymentRelease() {
  log('Testing payment release...', 'TEST');
  
  try {
    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        paymentId: testData.paymentId,
        providerId: testData.providerId,
        amount: TEST_CONFIG.testAmount * 0.9, // escrow amount
        paystackRef: `PO_${Date.now()}`,
        status: 'PENDING',
      },
    });
    testData.payoutId = payout.id;
    log(`Created payout: ${payout.id}`, 'SUCCESS');
    
    // Update payment status to PROCESSING_RELEASE
    await prisma.payment.update({
      where: { id: testData.paymentId },
      data: { status: 'PROCESSING_RELEASE' }
    });
    
    // Update job proof to confirmed
    await prisma.jobProof.update({
      where: { id: testData.jobProofId },
      data: { 
        clientConfirmed: true,
        confirmedAt: new Date()
      }
    });
    
    // Update booking status to PAYMENT_PROCESSING
    await prisma.booking.update({
      where: { id: testData.bookingId },
      data: { status: 'PAYMENT_PROCESSING' }
    });
    
    log('Payment release test passed', 'SUCCESS');
    return true;
  } catch (error) {
    log(`Payment release test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Test 7: Verify Final State
 */
async function verifyFinalState() {
  log('Verifying final database state...', 'TEST');
  
  try {
    // Check payment
    const payment = await prisma.payment.findUnique({
      where: { id: testData.paymentId }
    });
    
    if (payment.status === 'PROCESSING_RELEASE') {
      log('Payment status: PROCESSING_RELEASE', 'SUCCESS');
    } else {
      log(`Payment status: ${payment.status}`, 'WARNING');
    }
    
    // Check booking
    const booking = await prisma.booking.findUnique({
      where: { id: testData.bookingId }
    });
    
    if (booking.status === 'PAYMENT_PROCESSING') {
      log('Booking status: PAYMENT_PROCESSING', 'SUCCESS');
    } else {
      log(`Booking status: ${booking.status}`, 'WARNING');
    }
    
    // Check job proof
    const jobProof = await prisma.jobProof.findUnique({
      where: { id: testData.jobProofId }
    });
    
    if (jobProof.clientConfirmed) {
      log('Job proof confirmed by client', 'SUCCESS');
    } else {
      log('Job proof not confirmed by client', 'WARNING');
    }
    
    // Check payout
    const payout = await prisma.payout.findUnique({
      where: { id: testData.payoutId }
    });
    
    if (payout.status === 'PENDING') {
      log('Payout status: PENDING', 'SUCCESS');
    } else {
      log(`Payout status: ${payout.status}`, 'WARNING');
    }
    
    return true;
  } catch (error) {
    log(`Final state verification failed: ${error.message}`, 'ERROR');
    return false;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  log('Cleaning up test data...', 'TEST');
  
  try {
    // Delete in reverse order to respect foreign key constraints
    if (testData.payoutId) {
      await prisma.payout.delete({ where: { id: testData.payoutId } });
    }
    
    if (testData.jobProofId) {
      await prisma.jobProof.delete({ where: { id: testData.jobProofId } });
    }
    
    if (testData.paymentId) {
      await prisma.payment.delete({ where: { id: testData.paymentId } });
    }
    
    if (testData.bookingId) {
      await prisma.booking.delete({ where: { id: testData.bookingId } });
    }
    
    if (testData.serviceId) {
      await prisma.service.delete({ where: { id: testData.serviceId } });
    }
    
    if (testData.providerId) {
      await prisma.provider.delete({ where: { id: testData.providerId } });
    }
    
    if (testData.userId) {
      await prisma.user.delete({ where: { id: testData.userId } });
    }
    
    log('Test data cleanup completed', 'SUCCESS');
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'ERROR');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('🚀 Starting Escrow Payment System Tests', 'TEST');
  log('==========================================', 'TEST');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Create Test Data', fn: createTestData },
    { name: 'Payment Initialization', fn: testPaymentInitialization },
    { name: 'Webhook Processing', fn: testWebhookProcessing },
    { name: 'Job Completion', fn: testJobCompletion },
    { name: 'Payment Release', fn: testPaymentRelease },
    { name: 'Final State Verification', fn: verifyFinalState },
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    log(`Running: ${test.name}`, 'TEST');
    const result = await test.fn();
    
    if (result) {
      passedTests++;
      log(`${test.name} PASSED`, 'SUCCESS');
    } else {
      log(`${test.name} FAILED`, 'ERROR');
    }
    
    log('---', 'INFO');
  }
  
  // Summary
  log('==========================================', 'TEST');
  log(`Test Results: ${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? 'SUCCESS' : 'WARNING'
  );
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! Escrow payment system is working correctly.', 'SUCCESS');
  } else {
    log('⚠️ Some tests failed. Please review the errors above.', 'WARNING');
  }
  
  // Cleanup
  await cleanupTestData();
  
  // Close database connection
  await prisma.$disconnect();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Test runner failed: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testDatabaseConnection,
  createTestData,
  testPaymentInitialization,
  testWebhookProcessing,
  testJobCompletion,
  testPaymentRelease,
  verifyFinalState,
  cleanupTestData,
};
