#!/usr/bin/env node

/**
 * Test the complete provider login flow to identify authentication issues
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

const logger = createLogger('ProviderLoginFlowTest');

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

async function testProviderLoginFlow() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  
  logger.info('Testing provider login flow');
  
  try {
    console.log('🔐 TESTING PROVIDER LOGIN FLOW');
    console.log('===============================');
    
    // Test 1: Check if we can access the login page
    console.log('\n1. Testing login page accessibility...');
    try {
      const loginPageResponse = await makeRequest(`${baseUrl}/login`);
      console.log(`   Status: ${loginPageResponse.status} ${loginPageResponse.statusText}`);
      if (loginPageResponse.status === 200) {
        console.log('   ✅ Login page is accessible');
      } else {
        console.log('   ❌ Login page not accessible');
      }
    } catch (error) {
      console.log(`   ❌ Error accessing login page: ${error.message}`);
    }
    
    // Test 2: Test authentication debug endpoint
    console.log('\n2. Testing authentication debug endpoint...');
    try {
      const debugResponse = await makeRequest(`${baseUrl}/api/auth/debug`);
      console.log(`   Status: ${debugResponse.status} ${debugResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(debugResponse.data, null, 2));
      
      if (debugResponse.data.hasAuthToken) {
        console.log('   ✅ Auth token is present');
      } else {
        console.log('   ❌ No auth token found');
      }
    } catch (error) {
      console.log(`   ❌ Error accessing debug endpoint: ${error.message}`);
    }
    
    // Test 3: Test /api/auth/me endpoint
    console.log('\n3. Testing /api/auth/me endpoint...');
    try {
      const meResponse = await makeRequest(`${baseUrl}/api/auth/me`);
      console.log(`   Status: ${meResponse.status} ${meResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(meResponse.data, null, 2));
      
      if (meResponse.status === 200 && meResponse.data.user) {
        console.log('   ✅ User is authenticated');
        if (meResponse.data.user.role === 'PROVIDER') {
          console.log('   ✅ User has PROVIDER role');
        } else {
          console.log(`   ⚠️  User role is: ${meResponse.data.user.role}`);
        }
      } else {
        console.log('   ❌ User is not authenticated');
      }
    } catch (error) {
      console.log(`   ❌ Error accessing /api/auth/me: ${error.message}`);
    }
    
    // Test 4: Test provider bookings API
    console.log('\n4. Testing provider bookings API...');
    try {
      const bookingsResponse = await makeRequest(`${baseUrl}/api/provider/bookings`);
      console.log(`   Status: ${bookingsResponse.status} ${bookingsResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(bookingsResponse.data, null, 2));
      
      if (bookingsResponse.status === 200) {
        console.log('   ✅ Provider bookings API is working');
        console.log(`   📊 Bookings count: ${bookingsResponse.data.bookings?.length || 0}`);
      } else if (bookingsResponse.status === 401) {
        console.log('   ❌ Provider bookings API: Authentication required');
      } else if (bookingsResponse.status === 403) {
        console.log('   ❌ Provider bookings API: Access forbidden');
      } else if (bookingsResponse.status === 404) {
        console.log('   ❌ Provider bookings API: Provider profile not found');
      } else {
        console.log(`   ❌ Provider bookings API: Unexpected status ${bookingsResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error accessing provider bookings API: ${error.message}`);
    }
    
    // Test 5: Test provider dashboard API
    console.log('\n5. Testing provider dashboard API...');
    try {
      const dashboardResponse = await makeRequest(`${baseUrl}/api/provider/dashboard`);
      console.log(`   Status: ${dashboardResponse.status} ${dashboardResponse.statusText}`);
      console.log(`   Response:`, JSON.stringify(dashboardResponse.data, null, 2));
      
      if (dashboardResponse.status === 200) {
        console.log('   ✅ Provider dashboard API is working');
      } else {
        console.log(`   ❌ Provider dashboard API: Status ${dashboardResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error accessing provider dashboard API: ${error.message}`);
    }
    
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    console.log('The issue is likely one of the following:');
    console.log('1. User is not logged in (no auth token)');
    console.log('2. Auth token is expired or invalid');
    console.log('3. Cookie domain mismatch (COOKIE_DOMAIN setting)');
    console.log('4. User does not have PROVIDER role');
    console.log('5. User does not have a provider profile');
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Try logging in again as a provider');
    console.log('2. Check browser developer tools for cookies');
    console.log('3. Verify COOKIE_DOMAIN environment variable');
    console.log('4. Check if user has PROVIDER role in database');
    console.log('5. Check if user has a provider profile');
    
  } catch (error) {
    logger.error('Error in provider login flow test', error);
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Handle script execution
if (require.main === module) {
  testProviderLoginFlow().catch((error) => {
    logger.error('Script execution failed', error);
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testProviderLoginFlow
};
