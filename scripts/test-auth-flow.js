#!/usr/bin/env node

/**
 * Test authentication flow end-to-end
 */

const https = require('https');
const http = require('http');

async function testAuthenticationFlow() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  
  console.log('🔐 TESTING AUTHENTICATION FLOW');
  console.log('===============================');
  
  try {
    // Test 1: Check if user can access auth debug
    console.log('\n1. Testing auth debug endpoint...');
    const debugResponse = await makeRequest(`${baseUrl}/api/auth/debug`);
    console.log(`   Status: ${debugResponse.status}`);
    console.log(`   Authenticated: ${debugResponse.data.isAuthenticated}`);
    console.log(`   Has auth token: ${debugResponse.data.hasAuthToken}`);
    
    if (!debugResponse.data.isAuthenticated) {
      console.log('   ❌ User is not authenticated');
      console.log('   💡 User needs to log in through the browser');
      console.log('   💡 Or cookies might not be working properly');
    } else {
      console.log('   ✅ User is authenticated');
      console.log(`   👤 User: ${debugResponse.data.user?.email} (${debugResponse.data.user?.role})`);
    }
    
    // Test 2: Check provider dashboard API
    console.log('\n2. Testing provider dashboard API...');
    const dashboardResponse = await makeRequest(`${baseUrl}/api/provider/bookings`);
    console.log(`   Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.status === 200) {
      console.log('   ✅ Provider dashboard API is working');
    } else {
      console.log(`   ❌ Provider dashboard API failed: ${dashboardResponse.status}`);
      console.log(`   Error: ${dashboardResponse.data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

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
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            data: data
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
    
    request.end();
  });
}

if (require.main === module) {
  testAuthenticationFlow().catch(console.error);
}

module.exports = { testAuthenticationFlow };
