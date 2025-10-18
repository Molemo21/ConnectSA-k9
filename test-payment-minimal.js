#!/usr/bin/env node

/**
 * Minimal payment API test to isolate the issue
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Client credentials
const CLIENT_DATA = {
  email: 'molemonakin21@gmail.com',
  password: 'Molemo.10'
};

let clientAuthToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(clientAuthToken && { 'Cookie': `auth-token=${clientAuthToken}` }),
        ...options.headers
      },
      ...options
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: 'Invalid JSON', raw: text };
    }
    
    return { response, data, text };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { response: null, data: null, text: null, error };
  }
}

async function authenticateClient() {
  console.log('🔐 Authenticating client...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: CLIENT_DATA.email,
      password: CLIENT_DATA.password
    })
  });
  
  if (response && response.ok) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        clientAuthToken = tokenMatch[1];
        console.log('✅ Client authenticated successfully');
        return true;
      }
    }
  }
  
  console.log('❌ Client authentication failed');
  return false;
}

async function testPaymentAPI() {
  console.log('\n🔧 Testing Payment API (Minimal)');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateClient();
  if (!authenticated) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test with a known booking ID
  const bookingId = 'cmgksn4tp0001l504nsm1m14y';
  
  console.log(`   Testing payment API for booking: ${bookingId}`);
  
  // Test payment API
  const { response: paymentResponse, data: paymentData, text: paymentText } = await makeRequest(`${BASE_URL}/api/book-service/${bookingId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      callbackUrl: `${BASE_URL}/dashboard?payment=success&booking=${bookingId}`
    })
  });
  
  console.log(`   Response Status: ${paymentResponse?.status}`);
  console.log(`   Response Headers:`, Object.fromEntries(paymentResponse?.headers.entries() || []));
  console.log(`   Response Text: ${paymentText?.substring(0, 500)}...`);
  
  if (paymentResponse && paymentResponse.ok) {
    console.log('   ✅ Payment API working');
    console.log(`     Success: ${paymentData.success}`);
    console.log(`     Payment ID: ${paymentData.payment?.id || 'N/A'}`);
    console.log(`     Message: ${paymentData.message || 'N/A'}`);
  } else {
    console.log('   ❌ Payment API failed');
    console.log(`     Status: ${paymentResponse?.status}`);
    console.log(`     Error: ${paymentData?.error || 'Unknown error'}`);
    console.log(`     Message: ${paymentData?.message || 'N/A'}`);
    console.log(`     Details: ${paymentData?.details || 'N/A'}`);
  }
}

// Run the test
testPaymentAPI().catch(console.error);






