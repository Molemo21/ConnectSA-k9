#!/usr/bin/env node

/**
 * Test the DB wrapper specifically
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Test credentials
const PROVIDER_DATA = {
  email: 'bubelembizeni32@gmail.com',
  password: 'Bubele32'
};

let providerAuthToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(providerAuthToken && { 'Cookie': `auth-token=${providerAuthToken}` }),
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { response: null, data: null, error };
  }
}

async function authenticateProvider() {
  console.log('🔐 Authenticating provider...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: PROVIDER_DATA.email,
      password: PROVIDER_DATA.password
    })
  });
  
  if (response && response.ok) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        providerAuthToken = tokenMatch[1];
        console.log('✅ Provider authenticated successfully');
        return true;
      }
    }
  }
  
  console.log('❌ Provider authentication failed');
  return false;
}

async function testDbWrapper() {
  console.log('\n🔧 Testing DB Wrapper');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/debug/db-wrapper-test`);
  
  if (response && response.ok) {
    console.log('✅ DB Wrapper Test working');
    console.log(`   Success: ${data.success}`);
    console.log(`   Test: ${data.test}`);
    console.log(`   Provider ID: ${data.providerId}`);
    console.log(`   Booking count: ${data.bookingCount}`);
    console.log(`   Bookings: ${JSON.stringify(data.bookings)}`);
  } else {
    console.log('❌ DB Wrapper Test failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    console.log(`   Test: ${data?.test || 'N/A'}`);
    if (data?.stack) {
      console.log(`   Stack: ${data.stack.substring(0, 300)}...`);
    }
  }
  
  return response?.ok || false;
}

async function runDbWrapperTest() {
  console.log('🚀 Testing DB Wrapper');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateProvider();
  
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Cannot test DB wrapper.');
    return;
  }
  
  const dbWrapperWorking = await testDbWrapper();
  
  console.log('\n📊 DB Wrapper Test Results');
  console.log('='.repeat(50));
  console.log(`DB Wrapper: ${dbWrapperWorking ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (dbWrapperWorking) {
    console.log('\n🔍 Analysis: DB wrapper is working correctly');
    console.log('   The issue must be in the specific earnings/dashboard implementations');
  } else {
    console.log('\n🔍 Analysis: DB wrapper is failing');
    console.log('   This suggests a fundamental issue with database connectivity or the db wrapper');
  }
}

// Run test
runDbWrapperTest().catch(console.error);
