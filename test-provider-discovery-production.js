/**
 * Production Provider Discovery Test Script
 * 
 * This script tests the provider discovery API endpoint to ensure it works correctly
 * in production before committing changes.
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://app.proliinkconnect.co.za'; // Correct production URL
const TEST_SERVICE_ID = 'cmfu45chx0001s7jg79cblbue'; // Use a valid service ID that should have providers
const TEST_DATA = {
  serviceId: TEST_SERVICE_ID,
  date: '2025-10-20',
  time: '10:00',
  address: 'Test Address, Cape Town, South Africa'
};

console.log('🧪 Testing Provider Discovery API in Production');
console.log('================================================');
console.log(`Production URL: ${PRODUCTION_URL}`);
console.log(`Test Service ID: ${TEST_SERVICE_ID}`);
console.log(`Test Data:`, JSON.stringify(TEST_DATA, null, 2));
console.log('');

// Function to make HTTP request
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ProviderDiscoveryTest/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: responseData,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000); // 30 second timeout
    req.write(postData);
    req.end();
  });
}

// Test function
async function testProviderDiscovery() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Sending request to provider discovery API...');
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/discover-providers`,
      TEST_DATA
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Request completed in ${duration}ms`);
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log(`📋 Response Headers:`, response.headers);
    console.log('');
    
    if (response.parseError) {
      console.log('❌ JSON Parse Error:', response.parseError);
      console.log('📄 Raw Response:', response.rawData);
      return;
    }
    
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    
    // Analyze the response
    if (response.statusCode === 200) {
      console.log('✅ SUCCESS: Provider discovery API is working correctly!');
      
      if (response.data && response.data.providers) {
        console.log(`📈 Found ${response.data.providers.length} providers`);
        console.log(`📊 Total Count: ${response.data.totalCount}`);
        console.log(`💬 Message: ${response.data.message}`);
        
        if (response.data.providers.length > 0) {
          console.log('');
          console.log('🔍 Provider Details:');
          response.data.providers.forEach((provider, index) => {
            console.log(`  ${index + 1}. ${provider.businessName || 'Unknown'}`);
            console.log(`     - ID: ${provider.id}`);
            console.log(`     - Rating: ${provider.averageRating}/5`);
            console.log(`     - Reviews: ${provider.totalReviews}`);
            console.log(`     - Completed Jobs: ${provider.completedJobs}`);
            console.log(`     - Hourly Rate: R${provider.hourlyRate || 0}`);
            console.log(`     - Service: ${provider.service?.name || 'Unknown'}`);
            console.log('');
          });
        } else {
          console.log('⚠️  No providers found for this service');
        }
      } else {
        console.log('⚠️  Response structure unexpected - no providers array found');
      }
    } else if (response.statusCode === 404) {
      console.log('⚠️  NOT FOUND: No providers available for this service');
      console.log(`💬 Message: ${response.data?.error || 'No message'}`);
    } else if (response.statusCode === 400) {
      console.log('❌ BAD REQUEST: Invalid input data');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
    } else if (response.statusCode === 500) {
      console.log('❌ INTERNAL SERVER ERROR: API is failing');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      console.log(`🔍 Details: ${response.data?.details || 'No details'}`);
    } else {
      console.log(`❌ UNEXPECTED STATUS: ${response.statusCode}`);
      console.log(`💬 Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`❌ REQUEST FAILED after ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
    console.log(`🔍 Stack: ${error.stack}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('🌐 DNS Resolution failed - check if the production URL is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Connection refused - server might be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Connection timeout - server might be slow or overloaded');
    }
  }
}

// Additional test with different service ID
async function testWithDifferentService() {
  console.log('');
  console.log('🔄 Testing with a different service ID...');
  
  const testData2 = {
    ...TEST_DATA,
    serviceId: 'test-service-id' // This should fail validation
  };
  
  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/discover-providers`,
      testData2
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 400) {
      console.log('✅ Validation working correctly - invalid service ID rejected');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
    } else {
      console.log('⚠️  Validation might not be working as expected');
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the tests
async function runTests() {
  console.log('Starting production tests...');
  console.log('');
  
  await testProviderDiscovery();
  await testWithDifferentService();
  
  console.log('');
  console.log('🏁 Tests completed!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If all tests pass ✅ - Safe to commit the changes');
  console.log('2. If tests fail ❌ - Need to investigate and fix issues');
  console.log('3. Check Vercel logs for additional error details');
}

// Run the tests
runTests().catch(console.error);
