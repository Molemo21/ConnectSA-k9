#!/usr/bin/env node
/**
 * Debug Enhanced Endpoint 500 Error
 * - Tests the specific request that's failing
 * - Checks database connectivity and catalogue items
 * - Identifies the exact cause of the 500 error
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

async function testEnhancedEndpoint() {
  console.log('🔍 Debugging Enhanced Endpoint 500 Error');
  console.log('=========================================');
  
  // Test payload similar to what the frontend sends
  const testPayload = {
    providerId: 'cmgtgu6010001jo0477fz2zwh', // Use a real provider ID
    serviceId: 'cmgtgu6010001jo0477fz2zwh', // Use a real service ID
    date: '2024-12-25',
    time: '14:00',
    address: 'Test Address',
    notes: 'Test booking',
    catalogueItemId: 'cat_test123456789012345678901' // Test catalogue ID
  };

  try {
    console.log('📡 Testing enhanced endpoint with real payload...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      const url = new URL('/api/book-service/send-offer-enhanced', PRODUCTION_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(testPayload))
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
      req.write(JSON.stringify(testPayload));
      req.end();
    });

    console.log(`\n📊 Response Status: ${result.status}`);
    console.log('📊 Response Data:', JSON.stringify(result.data, null, 2));
    
    if (result.status === 500) {
      console.log('\n❌ 500 Internal Server Error detected');
      console.log('🔍 Possible causes:');
      console.log('1. Database connection issue');
      console.log('2. Prisma model not found (CatalogueItem)');
      console.log('3. Feature flag environment variable issue');
      console.log('4. Missing catalogue items in database');
      console.log('5. Authentication/authorization issue');
      
      console.log('\n🔧 Debugging steps:');
      console.log('1. Check server logs for detailed error');
      console.log('2. Verify catalogue items exist in database');
      console.log('3. Check environment variables');
      console.log('4. Test with simpler payload');
    } else if (result.status === 401) {
      console.log('\n✅ 401 Unauthorized - Authentication working correctly');
      console.log('The endpoint is working, just needs authentication');
    } else {
      console.log(`\n✅ Status ${result.status} - Endpoint responding`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testCatalogueAPI() {
  console.log('\n📦 Testing Catalogue API...');
  
  try {
    const result = await new Promise((resolve, reject) => {
      const url = new URL('/api/catalogue', PRODUCTION_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`📊 Catalogue API Status: ${result.status}`);
    if (result.data && Array.isArray(result.data)) {
      console.log(`📊 Catalogue Items Count: ${result.data.length}`);
      if (result.data.length > 0) {
        console.log('📊 Sample Item:', JSON.stringify(result.data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Catalogue API test failed:', error.message);
  }
}

async function main() {
  await testEnhancedEndpoint();
  await testCatalogueAPI();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check server logs for detailed 500 error');
  console.log('2. Verify database has catalogue items');
  console.log('3. Check environment variables are set');
  console.log('4. Test with authenticated request');
}

main().catch(console.error);
