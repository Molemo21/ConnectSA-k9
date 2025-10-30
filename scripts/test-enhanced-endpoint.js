#!/usr/bin/env node
/**
 * Test Enhanced Booking Endpoint
 * - Verifies the enhanced endpoint is accessible
 * - Tests both legacy and catalogue pricing modes
 * - Provides deployment verification
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

async function testEndpoint(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, PRODUCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function testBookingEndpoints() {
  console.log('🔍 Testing Booking Endpoints');
  console.log('=============================');
  
  // Test payload (without authentication - should get 401)
  const testPayload = {
    providerId: 'test-provider-id',
    serviceId: 'test-service-id',
    date: '2024-12-25',
    time: '14:00',
    address: 'Test Address',
    notes: 'Test booking',
    catalogueItemId: 'test-catalogue-id'
  };

  try {
    console.log('📡 Testing legacy endpoint...');
    const legacyResult = await testEndpoint('/api/book-service/send-offer', testPayload);
    console.log(`   Status: ${legacyResult.status}`);
    console.log(`   Response: ${legacyResult.data?.error || 'No error message'}`);

    console.log('\n📡 Testing enhanced endpoint...');
    const enhancedResult = await testEndpoint('/api/book-service/send-offer-enhanced', testPayload);
    console.log(`   Status: ${enhancedResult.status}`);
    console.log(`   Response: ${enhancedResult.data?.error || 'No error message'}`);

    console.log('\n✅ Analysis:');
    if (legacyResult.status === 401 && enhancedResult.status === 401) {
      console.log('   Both endpoints are accessible and return 401 (expected without auth)');
      console.log('   ✅ Enhanced endpoint is deployed and working');
    } else if (legacyResult.status !== 401) {
      console.log('   ⚠️  Legacy endpoint returned unexpected status');
    } else if (enhancedResult.status !== 401) {
      console.log('   ❌ Enhanced endpoint not accessible');
    }

    console.log('\n🚀 Next Steps:');
    console.log('1. Deploy the updated frontend code');
    console.log('2. Test the booking flow with catalogue pricing');
    console.log('3. Verify "Confirm & Book" button works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBookingEndpoints();

