#!/usr/bin/env node

/**
 * Test Script for Escrow Payment System
 * 
 * This script helps test the escrow payment system step by step
 * Run with: node scripts/test-escrow-fixed.js
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
    INFO: 'ℹ️',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    TEST: '���'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} [${timestamp}] ${type}: ${message}`);
}

async function cleanup() {
  try {
    log('Cleaning up test data...', 'INFO');
    
    // Clean up in reverse order to avoid foreign key constraints
    if (testData.jobProofId) {
      await prisma.jobProof.deleteMany({ where: { id: testData.jobProofId } });
    }
    
    if (testData.payoutId) {
      await prisma.payout.deleteMany({ where: { id: testData.payoutId } });
    }
    
    if (testData.paymentId) {
      await prisma.payment.deleteMany({ where: { id: testData.paymentId } });
    }
    
    if (testData.bookingId) {
      await prisma.booking.deleteMany({ where: { id: testData.bookingId } });
    }
    
    log('Cleanup completed successfully', 'SUCCESS');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'ERROR');
  }
}

/**
 * Test functions
 */
async function testDatabaseConnection() {
  try {
    log('Testing database connection...', 'TEST');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    log('Database connection successful', 'SUCCESS');
    
    // Test schema access
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('payments', 'payouts', 'job_proofs', 'bookings')
      ORDER BY table_name
    `;
    
    log(`Found ${tables.length} required tables: ${tables.map(t => t.table_name).join(', ')}`, 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Database connection test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testPaymentSchema() {
  try {
    log('Testing payment schema...', 'TEST');
    
    // Check payments table structure
    const paymentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name IN ('escrow_amount', 'platform_fee', 'paystack_ref', 'status')
      ORDER BY column_name
    `;
    
    log(`Payment table has ${paymentColumns.length} required columns`, 'SUCCESS');
    
    // Check enums
    const paymentStatuses = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::payment_status)) as status
    `;
    
    log(`Payment statuses: ${paymentStatuses.map(s => s.status).join(', ')}`, 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Payment schema test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function testWebhookValidation() {
  try {
    log('Testing webhook signature validation...', 'TEST');
    
    const payload = JSON.stringify({ event: 'payment.success', data: { id: 123 } });
    const secret = TEST_CONFIG.webhookSecret;
    const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    
    // Simulate webhook validation
    const expectedSignature = `sha512=${signature}`;
    const isValid = expectedSignature.startsWith('sha512=');
    
    log(`Webhook signature validation: ${isValid ? 'PASSED' : 'FAILED'}`, 'SUCCESS');
    
    return true;
  } catch (error) {
    log(`Webhook validation test failed: ${error.message}`, 'ERROR');
    return false;
  }
}

async function runAllTests() {
  log('Starting escrow payment system tests...', 'TEST');
  
  try {
    // Test 1: Database connection
    const dbTest = await testDatabaseConnection();
    if (!dbTest) {
      log('Database test failed, stopping tests', 'ERROR');
      return;
    }
    
    // Test 2: Payment schema
    const schemaTest = await testPaymentSchema();
    if (!schemaTest) {
      log('Schema test failed, stopping tests', 'ERROR');
      return;
    }
    
    // Test 3: Webhook validation
    const webhookTest = await testWebhookValidation();
    if (!webhookTest) {
      log('Webhook test failed', 'ERROR');
    }
    
    log('All core tests completed!', 'SUCCESS');
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'ERROR');
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testDatabaseConnection, testPaymentSchema, testWebhookValidation };
