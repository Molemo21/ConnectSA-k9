/**
 * Simple Provider Discovery Test
 * 
 * This script tests the provider discovery API with minimal data
 * to isolate the PENDING_EXECUTION enum issue.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

// Test with minimal data
const TEST_DATA = {
  serviceId: 'cmfu45chx0001s7jg79cblbue',
  date: '2025-10-20',
  time: '10:00',
  address: 'Test Address'
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
        'Content-Length': Buffer.byteLength(postData)
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

async function testSimple() {
  console.log('🧪 Simple Provider Discovery Test');
  console.log('==================================');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Test Data:`, JSON.stringify(TEST_DATA, null, 2));
  console.log('');
  
  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/discover-providers`,
      TEST_DATA
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    
    if (response.parseError) {
      console.log('❌ JSON Parse Error:', response.parseError);
      console.log('📄 Raw Response:', response.rawData);
      return;
    }
    
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 500) {
      console.log('');
      console.log('🔍 Error Analysis:');
      if (response.data?.details) {
        console.log('Details:', response.data.details);
        
        if (response.data.details.includes('PENDING_EXECUTION')) {
          console.log('');
          console.log('🎯 ISSUE IDENTIFIED:');
          console.log('The production database schema is missing the PENDING_EXECUTION enum value.');
          console.log('This suggests the database schema is not up to date.');
          console.log('');
          console.log('🔧 SOLUTION:');
          console.log('1. Run database migration: npx prisma db push');
          console.log('2. Or update the production database schema');
          console.log('3. Or remove PENDING_EXECUTION usage from the code');
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testSimple().catch(console.error);
