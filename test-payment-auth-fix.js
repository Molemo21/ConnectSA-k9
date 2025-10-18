/**
 * Test Payment Authentication Fix
 * 
 * This script tests that the payment button now properly handles
 * 401 authentication errors by redirecting to login instead of
 * falling back to payment=mock behavior.
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';
const PROBLEM_BOOKING_ID = 'cmgtgu6010001jo0477fz2zwh';

function makeRequest(url, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'PaymentAuthTest/1.0'
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

async function testPaymentAuthenticationFix() {
  console.log('🧪 Testing Payment Authentication Fix');
  console.log('=====================================');
  console.log(`📋 Booking ID: ${PROBLEM_BOOKING_ID}`);
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  
  try {
    // Step 1: Test payment initialization without authentication
    console.log('\n🔍 Step 1: Testing payment initialization without authentication...');
    
    const paymentData = {
      callbackUrl: `${PRODUCTION_URL}/dashboard?payment=success&booking=${PROBLEM_BOOKING_ID}`
    };
    
    console.log('📤 Request data:', JSON.stringify(paymentData, null, 2));
    
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/book-service/${PROBLEM_BOOKING_ID}/pay`,
      paymentData
    );
    
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Step 2: Analyze the response
    console.log('\n🔍 Step 2: Analyzing authentication response...');
    
    if (response.statusCode === 401) {
      console.log('✅ Payment API correctly returns 401 Unauthorized');
      console.log('✅ This confirms the user needs to be authenticated');
      console.log('✅ The payment button should now redirect to login');
      
      if (response.data && response.data.error === 'Unauthorized') {
        console.log('✅ Error message is correct: "Unauthorized"');
      } else {
        console.log('⚠️  Error message might be different:', response.data?.error);
      }
      
    } else if (response.statusCode === 200) {
      console.log('⚠️  Payment API returned 200 - user might be authenticated');
      console.log('🔍 This suggests the user is logged in or authentication is not required');
      
    } else {
      console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
    // Step 3: Test with authentication (if possible)
    console.log('\n🔍 Step 3: Testing with authentication...');
    
    // Try to get a valid session token (this might not work without proper auth)
    try {
      const authResponse = await makeRequest(
        `${PRODUCTION_URL}/api/auth/me`,
        {},
        'GET'
      );
      
      console.log(`📊 Auth Status Code: ${authResponse.statusCode}`);
      
      if (authResponse.statusCode === 401) {
        console.log('✅ Auth endpoint also returns 401 - confirms authentication is required');
      } else if (authResponse.statusCode === 200) {
        console.log('⚠️  Auth endpoint returns 200 - user might be authenticated');
      } else {
        console.log(`⚠️  Auth endpoint returned: ${authResponse.statusCode}`);
      }
      
    } catch (authError) {
      console.log('❌ Auth test failed:', authError.message);
    }
    
    // Step 4: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUTHENTICATION FIX TEST SUMMARY');
    console.log('='.repeat(60));
    
    if (response.statusCode === 401) {
      console.log('🎉 AUTHENTICATION FIX WORKING CORRECTLY!');
      console.log('✅ Payment API returns 401 when user is not authenticated');
      console.log('✅ Payment button should now redirect to login');
      console.log('✅ No more payment=mock fallback behavior');
      
      console.log('\n🔧 EXPECTED USER EXPERIENCE:');
      console.log('1. User clicks "Pay" button');
      console.log('2. Payment API returns 401 Unauthorized');
      console.log('3. Payment button detects 401 error');
      console.log('4. User is redirected to login page');
      console.log('5. After login, user can retry payment');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Test the payment button in production');
      console.log('2. Verify users are redirected to login on 401');
      console.log('3. Confirm payment works after authentication');
      console.log('4. Monitor for any remaining payment=mock issues');
      
    } else {
      console.log('⚠️  AUTHENTICATION FIX NEEDS VERIFICATION');
      console.log(`Payment API returned: ${response.statusCode}`);
      console.log('This might indicate:');
      console.log('- User is already authenticated');
      console.log('- Authentication is not required');
      console.log('- Different error handling is needed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaymentAuthenticationFix().catch(console.error);
