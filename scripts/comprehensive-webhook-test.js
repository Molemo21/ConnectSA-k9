require('dotenv').config();
const crypto = require('crypto');

// Comprehensive webhook testing
function comprehensiveTest() {
  console.log('🧪 Comprehensive Webhook Testing');
  console.log('================================');
  
  // Check environment variables
  console.log('\n📋 Environment Check:');
  console.log('PAYSTACK_SECRET_KEY:', process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.substring(0, 20) + '...' : 'NOT SET');
  console.log('PAYSTACK_WEBHOOK_SECRET:', process.env.PAYSTACK_WEBHOOK_SECRET ? process.env.PAYSTACK_WEBHOOK_SECRET.substring(0, 20) + '...' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
  
  // Test payload
  const payload = '{"event":"charge.success","data":{"reference":"CS_1755595072703_SG1F0GP7ALS"}}';
  
  console.log('\n📋 Test Payload:', payload);
  
  // Generate hash with current secret key
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.log('❌ No secret key found');
    return;
  }
  
  const hash = crypto
    .createHmac('sha512', secretKey)
    .update(payload)
    .digest('hex');
  
  console.log('🔑 Secret Key (first 20 chars):', secretKey.substring(0, 20));
  console.log('🔐 Generated Hash:', hash);
  console.log('📏 Hash Length:', hash.length);
  
  // Test different payload variations
  console.log('\n🧪 Test Commands:');
  
  // Test 1: Minimal payload
  console.log('\n1️⃣ Minimal Payload Test:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${hash}" \\`);
  console.log(`  -d '${payload}'`);
  
  // Test 2: Full payload
  const fullPayload = JSON.stringify({
    event: "charge.success",
    data: {
      reference: "CS_1755595072703_SG1F0GP7ALS",
      id: 123456789,
      status: "success",
      amount: 3356,
      currency: "ZAR"
    }
  });
  
  const fullHash = crypto
    .createHmac('sha512', secretKey)
    .update(fullPayload)
    .digest('hex');
  
  console.log('\n2️⃣ Full Payload Test:');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${fullHash}" \\`);
  console.log(`  -d '${fullPayload}'`);
  
  // Test 3: Test without signature
  console.log('\n3️⃣ No Signature Test (should fail):');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '${payload}'`);
  
  // Test 4: Test with wrong signature
  console.log('\n4️⃣ Wrong Signature Test (should fail):');
  console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: wrong_signature_here" \\`);
  console.log(`  -d '${payload}'`);
}

comprehensiveTest();
