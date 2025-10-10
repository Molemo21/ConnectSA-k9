#!/usr/bin/env node

/**
 * Debug test to isolate the provider earnings API issue
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

async function testDebugEndpoint() {
  console.log('\n🔧 Testing Debug Provider Earnings Endpoint');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/debug/provider-earnings`);
  
  if (response && response.ok) {
    console.log('✅ Debug endpoint working');
    console.log(`   Success: ${data.success}`);
    console.log(`   Test: ${data.test}`);
    console.log(`   Total earnings: R${data.totalEarnings || 0}`);
    console.log(`   Completed bookings: ${data.completedBookings || 0}`);
    console.log(`   Provider ID: ${data.providerId || 'N/A'}`);
    console.log(`   User ID: ${data.userId || 'N/A'}`);
  } else {
    console.log('❌ Debug endpoint failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    console.log(`   Test: ${data?.test || 'N/A'}`);
    if (data?.stack) {
      console.log(`   Stack: ${data.stack.substring(0, 200)}...`);
    }
  }
  
  return response?.ok || false;
}

async function testOriginalEndpoints() {
  console.log('\n🔧 Testing Original Provider Endpoints');
  console.log('='.repeat(50));
  
  // Test Provider Earnings API
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
  
  // Test Provider Dashboard API
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
  
  return {
    earnings: earningsResponse?.ok || false,
    dashboard: dashboardResponse?.ok || false
  };
}

async function runDebugTest() {
  console.log('🚀 Debug Test: Provider Endpoints');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateProvider();
  
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Cannot test endpoints.');
    return;
  }
  
  const debugWorking = await testDebugEndpoint();
  const originalResults = await testOriginalEndpoints();
  
  console.log('\n📊 Debug Results Summary');
  console.log('='.repeat(50));
  console.log(`Debug Endpoint: ${debugWorking ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Earnings: ${originalResults.earnings ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Dashboard: ${originalResults.dashboard ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (debugWorking && !originalResults.earnings) {
    console.log('\n🔍 Analysis: Debug endpoint works but original earnings fails');
    console.log('   This suggests the issue is in the original earnings API implementation');
  } else if (!debugWorking) {
    console.log('\n🔍 Analysis: Debug endpoint also fails');
    console.log('   This suggests a fundamental issue with authentication or database access');
  }
}

// Run debug test
runDebugTest().catch(console.error);
