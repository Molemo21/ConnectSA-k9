#!/usr/bin/env node

/**
 * Test with proper authentication to isolate the issue
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
        console.log(`   Token: ${providerAuthToken.substring(0, 20)}...`);
        return true;
      }
    }
  }
  
  console.log('❌ Provider authentication failed');
  console.log(`   Status: ${response?.status}`);
  console.log(`   Response: ${JSON.stringify(data)}`);
  return false;
}

async function testWithAuthentication() {
  console.log('\n🔧 Testing APIs with Authentication');
  console.log('='.repeat(50));
  
  // Test 1: Provider Status API
  console.log('   Testing Provider Status API...');
  const { response: statusResponse, data: statusData } = await makeRequest(`${BASE_URL}/api/provider/status`);
  
  if (statusResponse && statusResponse.ok) {
    console.log('   ✅ Provider Status API working');
    console.log(`     Provider ID: ${statusData.provider?.id}`);
    console.log(`     Status: ${statusData.provider?.status}`);
  } else {
    console.log('   ❌ Provider Status API failed');
    console.log(`     Status: ${statusResponse?.status}`);
    console.log(`     Error: ${statusData?.error || 'Unknown error'}`);
  }
  
  // Test 2: Provider Bookings API
  console.log('   Testing Provider Bookings API...');
  const { response: bookingsResponse, data: bookingsData } = await makeRequest(`${BASE_URL}/api/provider/bookings`);
  
  if (bookingsResponse && bookingsResponse.ok) {
    console.log('   ✅ Provider Bookings API working');
    console.log(`     Bookings count: ${bookingsData.bookings?.length || 0}`);
    console.log(`     Success: ${bookingsData.success}`);
  } else {
    console.log('   ❌ Provider Bookings API failed');
    console.log(`     Status: ${bookingsResponse?.status}`);
    console.log(`     Error: ${bookingsData?.error || 'Unknown error'}`);
  }
  
  // Test 3: Provider Earnings API
  console.log('   Testing Provider Earnings API...');
  const { response: earningsResponse, data: earningsData } = await makeRequest(`${BASE_URL}/api/provider/earnings`);
  
  if (earningsResponse && earningsResponse.ok) {
    console.log('   ✅ Provider Earnings API working');
    console.log(`     Success: ${earningsData.success}`);
    console.log(`     Total earnings: R${earningsData.totalEarnings || 0}`);
  } else {
    console.log('   ❌ Provider Earnings API failed');
    console.log(`     Status: ${earningsResponse?.status}`);
    console.log(`     Error: ${earningsData?.error || 'Unknown error'}`);
  }
  
  // Test 4: Provider Dashboard API
  console.log('   Testing Provider Dashboard API...');
  const { response: dashboardResponse, data: dashboardData } = await makeRequest(`${BASE_URL}/api/provider/dashboard`);
  
  if (dashboardResponse && dashboardResponse.ok) {
    console.log('   ✅ Provider Dashboard API working');
    console.log(`     Success: ${dashboardData.success}`);
    console.log(`     Total bookings: ${dashboardData.stats?.totalBookings || 0}`);
  } else {
    console.log('   ❌ Provider Dashboard API failed');
    console.log(`     Status: ${dashboardResponse?.status}`);
    console.log(`     Error: ${dashboardData?.error || 'Unknown error'}`);
  }
  
  // Test 5: Debug endpoint
  console.log('   Testing Debug Provider Earnings API...');
  const { response: debugResponse, data: debugData } = await makeRequest(`${BASE_URL}/api/debug/provider-earnings`);
  
  if (debugResponse && debugResponse.ok) {
    console.log('   ✅ Debug Provider Earnings API working');
    console.log(`     Test: ${debugData.test}`);
    console.log(`     Total earnings: R${debugData.totalEarnings || 0}`);
  } else {
    console.log('   ❌ Debug Provider Earnings API failed');
    console.log(`     Status: ${debugResponse?.status}`);
    console.log(`     Error: ${debugData?.error || 'Unknown error'}`);
    console.log(`     Test: ${debugData?.test || 'N/A'}`);
  }
  
  return {
    status: statusResponse?.ok || false,
    bookings: bookingsResponse?.ok || false,
    earnings: earningsResponse?.ok || false,
    dashboard: dashboardResponse?.ok || false,
    debug: debugResponse?.ok || false
  };
}

async function runAuthenticatedTest() {
  console.log('🚀 Testing Provider APIs with Authentication');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateProvider();
  
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Cannot test endpoints.');
    return;
  }
  
  const results = await testWithAuthentication();
  
  console.log('\n📊 Authenticated Test Results');
  console.log('='.repeat(50));
  console.log(`Provider Status: ${results.status ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Bookings: ${results.bookings ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Earnings: ${results.earnings ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Dashboard: ${results.dashboard ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Debug Earnings: ${results.debug ? '✅ WORKING' : '❌ FAILED'}`);
  
  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`\nWorking endpoints: ${workingCount}/5`);
  
  if (results.status && results.bookings && !results.earnings && !results.dashboard) {
    console.log('\n🔍 Analysis: Status and Bookings work, but Earnings and Dashboard fail');
    console.log('   This suggests the issue is specifically with the earnings and dashboard implementations');
  }
}

// Run test
runAuthenticatedTest().catch(console.error);
