const crypto = require('crypto');

// Debug signature validation
function debugSignature() {
  const payload = '{"event":"charge.success","data":{"reference":"CS_1755595072703_SG1F0GP7ALS"}}';
  const testSecretKey = 'sk_test_c8...17f0'; // Use the actual key from your .env
  
  console.log('🔍 Debugging Signature Validation');
  console.log('📋 Payload:', payload);
  console.log('🔑 Secret Key:', testSecretKey);
  
  // Generate hash
  const hash = crypto
    .createHmac('sha512', testSecretKey)
    .update(payload)
    .digest('hex');
  
  console.log('🔐 Generated Hash:', hash);
  console.log('📏 Hash Length:', hash.length);
  
  // Test with actual key from environment
  const envKey = process.env.PAYSTACK_SECRET_KEY;
  if (envKey) {
    const envHash = crypto
      .createHmac('sha512', envKey)
      .update(payload)
      .digest('hex');
    
    console.log('🔑 Env Key:', envKey.substring(0, 20) + '...');
    console.log('🔐 Env Hash:', envHash);
    console.log('📏 Env Hash Length:', envHash.length);
    
    // Test the webhook
    console.log('\n🧪 Test Command:');
    console.log(`curl -X POST http://localhost:3000/api/webhooks/paystack \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "x-paystack-signature: ${envHash}" \\`);
    console.log(`  -d '${payload}'`);
  }
}

debugSignature();
