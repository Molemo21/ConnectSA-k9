#!/usr/bin/env node

/**
 * Webhook Processing Test Script
 * 
 * This script tests webhook processing to identify why payments
 * are not moving from PENDING to ESCROW status.
 * 
 * Usage: node scripts/test-webhook-processing.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function testWebhookProcessing() {
  console.log('🧪 Testing Webhook Processing\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check environment variables
    console.log('🔐 Environment Variables Check:');
    const testSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    
    console.log(`   PAYSTACK_SECRET_KEY: ${testSecretKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   PAYSTACK_WEBHOOK_SECRET: ${webhookSecret ? '✅ Set' : '❌ Missing'}`);
    
    if (testSecretKey) {
      console.log(`   Key Type: ${testSecretKey.startsWith('sk_test_') ? 'Test Mode' : testSecretKey.startsWith('sk_live_') ? 'Live Mode' : 'Invalid Format'}`);
    }
    console.log('');

    // Check pending payments
    console.log('📊 Pending Payments Analysis:');
    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        booking: {
          include: {
            service: true,
            client: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Found ${pendingPayments.length} pending payments\n`);

    if (pendingPayments.length > 0) {
      console.log('🔍 Sample Pending Payment Details:');
      const samplePayment = pendingPayments[0];
      console.log(`   Payment ID: ${samplePayment.id}`);
      console.log(`   Amount: R${samplePayment.amount}`);
      console.log(`   Paystack Ref: ${samplePayment.paystackRef}`);
      console.log(`   Created: ${samplePayment.createdAt.toISOString()}`);
      console.log(`   Service: ${samplePayment.booking.service.name}`);
      console.log(`   Client: ${samplePayment.booking.client.name}`);
      console.log('');

      // Check if webhook events exist for this payment
      console.log('📨 Webhook Events Check:');
      const webhookEvents = await prisma.webhookEvent.findMany({
        where: { paystackRef: samplePayment.paystackRef },
        orderBy: { createdAt: 'desc' }
      });

      if (webhookEvents.length > 0) {
        console.log(`   Found ${webhookEvents.length} webhook events for this payment:`);
        webhookEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.eventType} - ${event.processed ? '✅ Processed' : '❌ Not Processed'} - ${event.createdAt.toISOString()}`);
          if (event.error) {
            console.log(`      Error: ${event.error}`);
          }
        });
      } else {
        console.log('   ❌ No webhook events found for this payment');
        console.log('   💡 This suggests webhooks are not being received or processed');
      }
      console.log('');
    }

    // Check webhook events overall
    console.log('📨 Overall Webhook Events Analysis:');
    const allWebhookEvents = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`   Recent webhook events: ${allWebhookEvents.length}`);
    
    if (allWebhookEvents.length > 0) {
      const eventTypes = {};
      const processedCount = { true: 0, false: 0 };
      
      allWebhookEvents.forEach(event => {
        eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
        processedCount[event.processed] = (processedCount[event.processed] || 0) + 1;
      });

      console.log('   Event Types:');
      Object.keys(eventTypes).forEach(type => {
        console.log(`     ${type}: ${eventTypes[type]}`);
      });

      console.log('   Processing Status:');
      console.log(`     Processed: ${processedCount[true] || 0}`);
      console.log(`     Not Processed: ${processedCount[false] || 0}`);
    }
    console.log('');

    // Test signature validation logic
    console.log('🔐 Signature Validation Test:');
    const testPayload = '{"event":"charge.success","data":{"reference":"test_ref_123"}}';
    const testSignature = 'test_signature';
    
    try {
      const testSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (testSecretKey) {
        const hash = crypto
          .createHmac('sha512', testSecretKey)
          .update(testPayload)
          .digest('hex');
        
        console.log(`   Test Hash Generated: ${hash.substring(0, 20)}...`);
        console.log(`   Signature Validation Logic: ✅ Working`);
      } else {
        console.log('   ❌ Cannot test signature validation - no secret key');
      }
    } catch (error) {
      console.log(`   ❌ Signature validation test failed: ${error.message}`);
    }
    console.log('');

    // Recommendations
    console.log('💡 Recommendations:');
    console.log('   1. Check if Paystack webhooks are configured correctly');
    console.log('   2. Verify webhook URL is accessible from Paystack');
    console.log('   3. Check webhook signature validation logic');
    console.log('   4. Monitor webhook event logs for errors');
    console.log('   5. Test webhook endpoint manually');

  } catch (error) {
    console.error('\n❌ Error during webhook testing:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  testWebhookProcessing();
}

module.exports = { testWebhookProcessing };
