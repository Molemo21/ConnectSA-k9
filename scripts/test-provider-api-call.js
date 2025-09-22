#!/usr/bin/env node

/**
 * Test the provider bookings API directly to see what's happening
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

const logger = createLogger('ProviderAPITest');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const request = client.request(url, {
      method: 'GET',
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
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
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

async function testProviderAPI() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  const apiUrl = `${baseUrl}/api/provider/bookings`;
  
  logger.info('Testing provider bookings API', { url: apiUrl });
  
  try {
    console.log('🔍 Testing Provider Bookings API');
    console.log('================================');
    console.log(`URL: ${apiUrl}`);
    console.log('');
    
    const response = await makeRequest(apiUrl);
    
    console.log('📊 API Response:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('\n🔐 Authentication Issue:');
      console.log('- The API is returning 401 Unauthorized');
      console.log('- This means the user is not properly authenticated');
      console.log('- Check if the user is logged in correctly');
      console.log('- Verify session cookies are being sent');
    } else if (response.status === 403) {
      console.log('\n🚫 Authorization Issue:');
      console.log('- The API is returning 403 Forbidden');
      console.log('- This means the user is authenticated but not a provider');
      console.log('- Check if the user has the PROVIDER role');
    } else if (response.status === 404) {
      console.log('\n❌ Not Found Issue:');
      console.log('- The API is returning 404 Not Found');
      console.log('- This means no provider profile was found for the user');
      console.log('- Check if the user has a provider record in the database');
    } else if (response.status === 500) {
      console.log('\n💥 Server Error:');
      console.log('- The API is returning 500 Internal Server Error');
      console.log('- This indicates a server-side issue');
      console.log('- Check server logs for detailed error information');
    } else if (response.status === 200) {
      console.log('\n✅ Success:');
      console.log('- The API is working correctly');
      console.log('- Check if the frontend is handling the response properly');
    } else {
      console.log(`\n⚠️  Unexpected Status: ${response.status}`);
      console.log('- This is an unexpected response status');
      console.log('- Check the API implementation');
    }
    
    logger.info('Provider API test completed', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
  } catch (error) {
    logger.error('Error testing provider API', error);
    console.log('\n❌ Request Failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('- DNS resolution failed - check if the domain is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('- Connection refused - check if the server is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('- Request timeout - server might be slow or overloaded');
    }
  }
}

async function testHealthEndpoint() {
  const baseUrl = 'https://app.proliinkconnect.co.za';
  const healthUrl = `${baseUrl}/api/health`;
  
  logger.info('Testing health endpoint', { url: healthUrl });
  
  try {
    console.log('\n🏥 Testing Health Endpoint');
    console.log('==========================');
    console.log(`URL: ${healthUrl}`);
    console.log('');
    
    const response = await makeRequest(healthUrl);
    
    console.log('📊 Health Response:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('\n✅ Server is healthy and responding');
    } else {
      console.log('\n⚠️  Server health check failed');
    }
    
  } catch (error) {
    logger.error('Error testing health endpoint', error);
    console.log('\n❌ Health check failed:');
    console.log(`Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 PROVIDER DASHBOARD API DIAGNOSTICS');
  console.log('=====================================');
  
  try {
    await testHealthEndpoint();
    await testProviderAPI();
    
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    console.log('1. Health endpoint test - Check if server is running');
    console.log('2. Provider API test - Check authentication and data');
    console.log('');
    console.log('🔧 NEXT STEPS:');
    console.log('- If health check fails: Server deployment issue');
    console.log('- If provider API returns 401: Authentication issue');
    console.log('- If provider API returns 403: Role authorization issue');
    console.log('- If provider API returns 404: Provider profile missing');
    console.log('- If provider API returns 500: Server-side error');
    console.log('- If provider API returns 200: Frontend handling issue');
    
  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch((error) => {
    logger.error('Script execution failed', error);
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testProviderAPI,
  testHealthEndpoint,
  runTests
};