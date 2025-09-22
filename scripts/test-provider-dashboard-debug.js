#!/usr/bin/env node

/**
 * Debug script to test provider dashboard API calls directly
 */

const https = require('https');
const http = require('http');

// Structured logging utility
const createLogger = (context) => ({
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

const logger = createLogger('ProviderDashboardDebug');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const request = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            data: jsonData,
            cookies: response.headers['set-cookie'] || []
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            data: data,
            cookies: response.headers['set-cookie'] || []
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      request.write(options.body);
    }
    
    request.end();
  });
}

async function testProviderDashboardAPIs() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  
  logger.info('Testing provider dashboard API calls');
  
  try {
    console.log('🔍 TESTING PROVIDER DASHBOARD API CALLS');
    console.log('=======================================');
    
    // Test 1: /api/auth/me endpoint
    console.log('\n1. Testing /api/auth/me endpoint...');
    try {
      const meResponse = await makeRequest(`${baseUrl}/api/auth/me`);
      console.log(`   Status: ${meResponse.status} ${meResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(meResponse.data, null, 2));
      
      if (meResponse.status === 200 && meResponse.data.user) {
        console.log('   ✅ User is authenticated');
        console.log(`   👤 User: ${meResponse.data.user.email} (${meResponse.data.user.role})`);
        
        if (meResponse.data.user.role === 'PROVIDER') {
          console.log('   ✅ User has PROVIDER role');
        } else {
          console.log(`   ❌ User role is: ${meResponse.data.user.role} (expected PROVIDER)`);
        }
      } else if (meResponse.status === 401) {
        console.log('   ❌ User is not authenticated (401 Unauthorized)');
        console.log('   🔧 This is the root cause - user needs to log in');
      } else {
        console.log(`   ❌ Unexpected response: ${meResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing /api/auth/me: ${error.message}`);
    }
    
    // Test 2: /api/provider/bookings endpoint
    console.log('\n2. Testing /api/provider/bookings endpoint...');
    try {
      const bookingsResponse = await makeRequest(`${baseUrl}/api/provider/bookings`);
      console.log(`   Status: ${bookingsResponse.status} ${bookingsResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(bookingsResponse.data, null, 2));
      
      if (bookingsResponse.status === 200) {
        console.log('   ✅ Provider bookings API is working');
        console.log(`   📊 Bookings count: ${bookingsResponse.data.bookings?.length || 0}`);
        if (bookingsResponse.data.success) {
          console.log('   ✅ API returned success: true');
        } else {
          console.log('   ❌ API returned success: false');
        }
      } else if (bookingsResponse.status === 401) {
        console.log('   ❌ Provider bookings API: Authentication required (401)');
        console.log('   🔧 This matches the /api/auth/me failure');
      } else if (bookingsResponse.status === 403) {
        console.log('   ❌ Provider bookings API: Access forbidden (403)');
        console.log('   🔧 User might not have PROVIDER role');
      } else if (bookingsResponse.status === 404) {
        console.log('   ❌ Provider bookings API: Provider profile not found (404)');
        console.log('   🔧 User might not have a provider profile');
      } else {
        console.log(`   ❌ Unexpected response: ${bookingsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error testing /api/provider/bookings: ${error.message}`);
    }
    
    // Test 3: Check if there are any cookie issues
    console.log('\n3. Analyzing authentication flow...');
    console.log('   🔍 The issue is likely:');
    console.log('   1. User is not logged in (no auth cookie)');
    console.log('   2. Auth cookie is expired or invalid');
    console.log('   3. Cookie domain configuration issue');
    console.log('   4. User does not have PROVIDER role');
    console.log('   5. User does not have a provider profile');
    
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    console.log('The "Failed to load provider data" error occurs when:');
    console.log('- /api/auth/me returns 401 (user not authenticated)');
    console.log('- /api/provider/bookings returns 401, 403, or 404');
    console.log('- Frontend sets error state and shows "Try Again" button');
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if user is actually logged in');
    console.log('2. Verify auth cookie exists in browser');
    console.log('3. Check if user has PROVIDER role in database');
    console.log('4. Verify user has a provider profile');
    console.log('5. Test login flow to ensure cookies are set correctly');
    
  } catch (error) {
    logger.error('Error in provider dashboard debug', error);
    console.log(`❌ Debug failed: ${error.message}`);
  }
}

async function testLoginFlow() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  
  console.log('\n🔐 TESTING LOGIN FLOW');
  console.log('=====================');
  
  try {
    // Test login page accessibility
    console.log('\n1. Testing login page...');
    const loginPageResponse = await makeRequest(`${baseUrl}/login`);
    console.log(`   Status: ${loginPageResponse.status} ${loginPageResponse.statusText}`);
    
    if (loginPageResponse.status === 200) {
      console.log('   ✅ Login page is accessible');
    } else {
      console.log('   ❌ Login page not accessible');
    }
    
    // Test auth debug endpoint
    console.log('\n2. Testing auth debug endpoint...');
    const debugResponse = await makeRequest(`${baseUrl}/api/auth/debug`);
    console.log(`   Status: ${debugResponse.status} ${debugResponse.statusText}`);
    console.log(`   Has auth token: ${debugResponse.data.hasAuthToken}`);
    console.log(`   User: ${debugResponse.data.user ? `${debugResponse.data.user.email} (${debugResponse.data.user.role})` : 'null'}`);
    
  } catch (error) {
    console.log(`❌ Login flow test failed: ${error.message}`);
  }
}

async function main() {
  console.log('🐛 PROVIDER DASHBOARD DEBUG TOOL');
  console.log('=================================');
  
  try {
    await testProviderDashboardAPIs();
    await testLoginFlow();
    
    console.log('\n🎯 ROOT CAUSE ANALYSIS');
    console.log('======================');
    console.log('The "Failed to load provider data" error is most likely caused by:');
    console.log('1. 🔐 Authentication failure - user not logged in');
    console.log('2. 🍪 Cookie issues - auth cookie not being sent');
    console.log('3. 👤 Role mismatch - user not a provider');
    console.log('4. 📊 Missing profile - no provider profile in database');
    
    console.log('\n💡 SOLUTION:');
    console.log('1. Ensure user is properly logged in');
    console.log('2. Check browser cookies for auth-token');
    console.log('3. Verify user has PROVIDER role');
    console.log('4. Confirm provider profile exists');
    
  } catch (error) {
    logger.error('Debug execution failed', error);
    console.error(`❌ Debug failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    logger.error('Script execution failed', error);
    console.error('❌ Debug failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testProviderDashboardAPIs,
  testLoginFlow,
  main
};
