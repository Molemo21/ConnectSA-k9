require('dotenv').config();
const crypto = require('crypto');

// Test webhook with proper payload structure
function testWebhookProper() {
  // Payload that matches the WebhookEventSchema
  const payload = JSON.stringify({
    event: "charge.success",
    data: {
      reference: "CS_1755595072703_SG1F0GP7ALS",
      id: 123456789,
      status: "success",
      amount: 3356,
      currency: "ZAR"
    }
  });

  const envKey = process.env.PAYSTACK_SECRET_KEY;
  if (!envKey) {
    console.log('❌ PAYSTACK_SECRET_KEY not found in environment');
    return;
  }

  // Generate hash using the same logic as webhook handler
  const hash = crypto
    .createHmac('sha512', envKey)
    .update(payload)
    .digest('hex');
  
  console.log('🧪 Testing Webhook with Proper Payload');
  console.log('📋 Payload:', payload);
  console.log('🔑 Secret Key:', envKey.substring(0, 20) + '...');
  console.log('🔐 Generated Hash:', hash);
  
  console.log('\n📤 Test Command:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${hash}" \\`);
  console.log(`  -d '${payload}'`);
  
  // Also test with a minimal valid payload
  const minimalPayload = JSON.stringify({
    event: "charge.success",
    data: {
      reference: "CS_1755595072703_SG1F0GP7ALS"
    }
  });
  
  const minimalHash = crypto
    .createHmac('sha512', envKey)
    .update(minimalPayload)
    .digest('hex');
  
  console.log('\n🧪 Minimal Test Command:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${minimalHash}" \\`);
  console.log(`  -d '${minimalPayload}'`);
}

testWebhookProper();
