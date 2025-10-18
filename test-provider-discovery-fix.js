/**
 * Test Provider Discovery Fix
 * 
 * This script tests the provider discovery API after implementing
 * the fix to exclude PENDING_EXECUTION bookings from the query.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';
const TEST_SERVICE_ID = 'cmfu45chx0001s7jg79cblbue';

const TEST_DATA = {
  serviceId: TEST_SERVICE_ID,
  date: '2025-10-20',
  time: '10:00',
  address: 'Test Address, Cape Town, South Africa'
};

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ProviderDiscoveryFixTest/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            rawData: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
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

    req.setTimeout(30000);
    req.write(postData);
    req.end();
  });
}

async function testProviderDiscoveryFix() {
  console.log('🧪 Testing Provider Discovery Fix');
  console.log('===================================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Test Service ID: ${TEST_SERVICE_ID}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Testing provider discovery API with PENDING_EXECUTION fix...');
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/discover-providers`,
      TEST_DATA
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Request completed in ${duration}ms`);
    console.log(`📊 Status Code: ${response.statusCode}`);
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
      console.log('🎉 SUCCESS: Provider discovery API is now working!');
      console.log('✅ The PENDING_EXECUTION enum issue has been RESOLVED!');
      
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
            console.log('');
          });
        }
      }
    } else if (response.statusCode === 404) {
      console.log('✅ SUCCESS: API is working correctly!');
      console.log('📝 No providers available for this service (expected behavior)');
      console.log(`💬 Message: ${response.data?.error || 'No message'}`);
      console.log('');
      console.log('🎯 The PENDING_EXECUTION enum issue has been RESOLVED!');
      console.log('✅ The fix is working - API no longer returns 500 errors');
    } else if (response.statusCode === 500) {
      console.log('❌ FAILED: 500 error still exists');
      console.log(`💬 Error: ${response.data?.error || 'No error message'}`);
      console.log(`🔍 Details: ${response.data?.details || 'No details'}`);
      
      if (response.data?.details && response.data.details.includes('PENDING_EXECUTION')) {
        console.log('');
        console.log('🔧 The fix may not have been deployed yet.');
        console.log('Please check:');
        console.log('1. The deployment is complete');
        console.log('2. The fix has been applied');
        console.log('3. There are no other PENDING_EXECUTION enum issues');
      } else {
        console.log('');
        console.log('🔍 Different error - the PENDING_EXECUTION issue may be resolved,');
        console.log('but there might be another issue causing the 500 error.');
      }
    } else {
      console.log(`⚠️  Unexpected status: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`❌ REQUEST FAILED after ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
  }
  
  console.log('');
  console.log('📋 Test Results Summary:');
  console.log('- Status 200: ✅ Complete success - providers found');
  console.log('- Status 404: ✅ Success - no providers (expected)');
  console.log('- Status 500: ❌ Still failing - check deployment or other issues');
  console.log('- Request Failed: 🌐 Network/connection issue');
  console.log('');
  console.log('🎯 Expected Outcome:');
  console.log('The API should now work correctly by excluding PENDING_EXECUTION bookings');
  console.log('from the query, preventing the Prisma enum validation error.');
  console.log('');
  console.log('🔧 Fix Applied:');
  console.log('- Changed query from: status: { not: "CANCELLED" }');
  console.log('- To: status: { notIn: ["CANCELLED", "PENDING_EXECUTION"] }');
  console.log('- This prevents Prisma from trying to validate PENDING_EXECUTION enum');
}

// Run the test
testProviderDiscoveryFix().catch(console.error);