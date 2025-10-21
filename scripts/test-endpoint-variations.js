#!/usr/bin/env node
/**
 * Test Enhanced Endpoint with Detailed Logging
 * - Tests various payload formats
 * - Checks validation errors
 * - Identifies specific failure points
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

async function testPayloadVariations() {
  console.log('🧪 Testing Enhanced Endpoint with Various Payloads');
  console.log('=================================================');
  
  const testCases = [
    {
      name: 'Valid payload with catalogueItemId',
      payload: {
        providerId: 'cmgtgu6010001jo0477fz2zwh',
        serviceId: 'cmgtgu6010001jo0477fz2zwh',
        date: '2024-12-25',
        time: '14:00',
        address: 'Test Address',
        notes: 'Test booking',
        catalogueItemId: 'cat_test123456789012345678901'
      }
    },
    {
      name: 'Valid payload without catalogueItemId (legacy)',
      payload: {
        providerId: 'cmgtgu6010001jo0477fz2zwh',
        serviceId: 'cmgtgu6010001jo0477fz2zwh',
        date: '2024-12-25',
        time: '14:00',
        address: 'Test Address',
        notes: 'Test booking'
      }
    },
    {
      name: 'Invalid serviceId format',
      payload: {
        providerId: 'cmgtgu6010001jo0477fz2zwh',
        serviceId: 'invalid-service-id',
        date: '2024-12-25',
        time: '14:00',
        address: 'Test Address',
        catalogueItemId: 'cat_test123456789012345678901'
      }
    },
    {
      name: 'Missing required fields',
      payload: {
        providerId: 'cmgtgu6010001jo0477fz2zwh',
        serviceId: 'cmgtgu6010001jo0477fz2zwh',
        date: '2024-12-25',
        time: '14:00'
        // Missing address
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📡 Testing: ${testCase.name}`);
    console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
    
    try {
      const result = await new Promise((resolve, reject) => {
        const url = new URL('/api/book-service/send-offer-enhanced', PRODUCTION_URL);
        
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(testCase.payload))
          }
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
        req.write(JSON.stringify(testCase.payload));
        req.end();
      });

      console.log(`   Status: ${result.status}`);
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      
      if (result.status === 500) {
        console.log('   ❌ 500 Internal Server Error');
      } else if (result.status === 400) {
        console.log('   ⚠️  400 Bad Request (validation error)');
      } else if (result.status === 401) {
        console.log('   ✅ 401 Unauthorized (expected without auth)');
      } else {
        console.log(`   ✅ Status ${result.status}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...');
  
  // Test if the feature flag endpoint is accessible
  try {
    const result = await new Promise((resolve, reject) => {
      const url = new URL('/api/health', PRODUCTION_URL);
      
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
            data: data
          });
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`Health check status: ${result.status}`);
    
  } catch (error) {
    console.log(`Health check failed: ${error.message}`);
  }
}

async function main() {
  await testPayloadVariations();
  await checkEnvironmentVariables();
  
  console.log('\n🎯 Analysis:');
  console.log('If all tests return 401, the endpoint is working correctly.');
  console.log('The 500 error in the browser suggests:');
  console.log('1. Authentication issue (cookies not being sent)');
  console.log('2. Request format issue from frontend');
  console.log('3. Server-side error during processing');
  console.log('\n🔧 Next steps:');
  console.log('1. Check browser network tab for request details');
  console.log('2. Verify authentication cookies are being sent');
  console.log('3. Check server logs for detailed error');
}

main().catch(console.error);
