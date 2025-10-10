#!/usr/bin/env node

/**
 * Quick test to verify the fixed provider endpoints
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

async function testFixedEndpoints() {
  console.log('\n🔧 Testing Fixed Provider Endpoints');
  console.log('='.repeat(50));
  
  // Test Provider Earnings API
  console.log('   Testing Provider Earnings API...');
  const { response: earningsResponse, data: earningsData } = await makeRequest(`${BASE_URL}/api/provider/earnings`);
  
  if (earningsResponse && earningsResponse.ok) {
    console.log('   ✅ Provider Earnings API working');
    console.log(`     Total earnings: R${earningsData.totalEarnings || 0}`);
    console.log(`     This month: R${earningsData.thisMonthEarnings || 0}`);
    console.log(`     Completed bookings: ${earningsData.completedBookings || 0}`);
  } else {
    console.log('   ❌ Provider Earnings API failed');
    console.log(`     Status: ${earningsResponse?.status}`);
    console.log(`     Error: ${earningsData?.error || 'Unknown error'}`);
  }
  
  // Test Provider Dashboard API
  console.log('   Testing Provider Dashboard API...');
  const { response: dashboardResponse, data: dashboardData } = await makeRequest(`${BASE_URL}/api/provider/dashboard`);
  
  if (dashboardResponse && dashboardResponse.ok) {
    console.log('   ✅ Provider Dashboard API working');
    console.log(`     Success: ${dashboardData.success}`);
    console.log(`     Total bookings: ${dashboardData.stats?.totalBookings || 0}`);
    console.log(`     Pending bookings: ${dashboardData.stats?.pendingBookings || 0}`);
    console.log(`     Completed bookings: ${dashboardData.stats?.completedBookings || 0}`);
  } else {
    console.log('   ❌ Provider Dashboard API failed');
    console.log(`     Status: ${dashboardResponse?.status}`);
    console.log(`     Error: ${dashboardData?.error || 'Unknown error'}`);
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Provider Earnings: ${earningsResponse?.ok ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Dashboard: ${dashboardResponse?.ok ? '✅ WORKING' : '❌ FAILED'}`);
  
  const workingEndpoints = [earningsResponse?.ok, dashboardResponse?.ok].filter(Boolean).length;
  console.log(`\nFixed endpoints working: ${workingEndpoints}/2`);
  
  if (workingEndpoints === 2) {
    console.log('🎉 All provider endpoints are now working!');
  } else {
    console.log('⚠️ Some endpoints still need attention.');
  }
}

async function runTest() {
  console.log('🚀 Testing Fixed Provider Endpoints');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateProvider();
  
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Cannot test endpoints.');
    return;
  }
  
  await testFixedEndpoints();
}

// Run test
runTest().catch(console.error);
