const crypto = require('crypto');

// Test webhook signature validation using the same logic as the webhook handler
function testWebhookSignature() {
  const payload = JSON.stringify({
    event: "charge.success",
    data: {
      reference: "CS_1755595072703_SG1F0GP7ALS",
      amount: 3356,
      currency: "ZAR",
      status: "success"
    }
  });

  // Use test secret key for signature (same as webhook handler)
  const testSecretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_c8...17f0';
  
  console.log('🧪 Testing Webhook Signature Validation');
  console.log('📋 Payload:', payload);
  console.log('🔑 Secret Key:', testSecretKey.substring(0, 20) + '...');
  
  // Generate HMAC SHA-512 hash (same as webhook handler)
  const hash = crypto
    .createHmac('sha512', testSecretKey)
    .update(payload)
    .digest('hex');
  
  console.log('🔐 Generated Hash:', hash);
  console.log('📤 Test with:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${hash}" \\`);
  console.log(`  -d '${payload}'`);
  
  // Also test with a simple test
  console.log('\n🧪 Simple Test:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${hash}" \\`);
  console.log(`  -d '{"event":"charge.success","data":{"reference":"CS_1755595072703_SG1F0GP7ALS"}}'`);
}

testWebhookSignature();
