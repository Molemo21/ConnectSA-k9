#!/usr/bin/env node

/**
 * Integration test script for payment initialization
 * 
 * Usage:
 *   TEST_BOOKING_ID=your_booking_id TEST_TOKEN=your_jwt_token node scripts/test-init-payment.js
 * 
 * Environment Variables:
 *   - TEST_BOOKING_ID: The booking ID to test payment initialization for
 *   - TEST_TOKEN: JWT token for authentication (optional, will use default test user)
 *   - BASE_URL: Base URL for the API (defaults to http://localhost:3000)
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_BOOKING_ID = process.env.TEST_BOOKING_ID;
const TEST_TOKEN = process.env.TEST_TOKEN;

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

const logger = createLogger('PaymentIntegrationTest');

// HTTP client helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 30000
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test payment initialization
async function testPaymentInitialization(bookingId, token = null) {
  logger.info('Testing payment initialization', { bookingId });
  
  const url = `${BASE_URL}/api/book-service/${bookingId}/pay`;
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestBody = {
    callbackUrl: `${BASE_URL}/dashboard?payment=success&booking=${bookingId}`
  };

  try {
    logger.info('Sending payment initialization request', { 
      url, 
      bookingId, 
      hasToken: !!token 
    });

    const response = await makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    logger.info('Payment initialization response received', {
      bookingId,
      status: response.status,
      success: response.data?.success,
      hasAuthorizationUrl: !!response.data?.authorizationUrl
    });

    // Validate response
    if (response.status === 200 && response.data?.success) {
      if (response.data.authorizationUrl) {
        logger.info('✅ Payment initialization successful', {
          bookingId,
          authorizationUrl: response.data.authorizationUrl,
          reference: response.data.reference
        });
        
        return {
          success: true,
          data: response.data,
          message: 'Payment initialization successful'
        };
      } else {
        logger.error('❌ Payment initialization failed - no authorization URL', {
          bookingId,
          responseData: response.data
        });
        return {
          success: false,
          error: 'No authorization URL in response',
          data: response.data
        };
      }
    } else {
      logger.error('❌ Payment initialization failed', {
        bookingId,
        status: response.status,
        error: response.data?.error || response.data?.message
      });
      return {
        success: false,
        error: response.data?.error || response.data?.message || 'Unknown error',
        status: response.status
      };
    }

  } catch (error) {
    logger.error('Payment initialization request failed', error, { bookingId });
    return {
      success: false,
      error: error.message,
      type: 'network_error'
    };
  }
}

// Test payment verification
async function testPaymentVerification(reference, token = null) {
  logger.info('Testing payment verification', { reference });
  
  const url = `${BASE_URL}/api/payment/verify`;
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestBody = { reference };

  try {
    logger.info('Sending payment verification request', { reference });

    const response = await makeRequest(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    logger.info('Payment verification response received', {
      reference,
      status: response.status,
      success: response.data?.success
    });

    return {
      success: response.status === 200,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    logger.error('Payment verification request failed', error, { reference });
    return {
      success: false,
      error: error.message,
      type: 'network_error'
    };
  }
}

// Test payment status check
async function testPaymentStatusCheck(reference) {
  logger.info('Testing payment status check', { reference });
  
  const url = `${BASE_URL}/api/payment/verify?reference=${reference}`;

  try {
    const response = await makeRequest(url);

    logger.info('Payment status check response received', {
      reference,
      status: response.status,
      success: response.data?.success
    });

    return {
      success: response.status === 200,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    logger.error('Payment status check request failed', error, { reference });
    return {
      success: false,
      error: error.message,
      type: 'network_error'
    };
  }
}

// Main test function
async function runTests() {
  logger.info('Starting payment integration tests', {
    baseUrl: BASE_URL,
    bookingId: TEST_BOOKING_ID,
    hasToken: !!TEST_TOKEN
  });

  // Validate required environment variables
  if (!TEST_BOOKING_ID) {
    logger.error('❌ TEST_BOOKING_ID environment variable is required');
    process.exit(1);
  }

  const results = {
    initialization: null,
    verification: null,
    statusCheck: null
  };

  try {
    // Test 1: Payment Initialization
    logger.info('🧪 Test 1: Payment Initialization');
    results.initialization = await testPaymentInitialization(TEST_BOOKING_ID, TEST_TOKEN);
    
    if (results.initialization.success) {
      // Test 2: Payment Verification (using the reference from initialization)
      logger.info('🧪 Test 2: Payment Verification');
      results.verification = await testPaymentVerification(
        results.initialization.data.reference, 
        TEST_TOKEN
      );
      
      // Test 3: Payment Status Check
      logger.info('🧪 Test 3: Payment Status Check');
      results.statusCheck = await testPaymentStatusCheck(
        results.initialization.data.reference
      );
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🧪 PAYMENT INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📋 Booking ID: ${TEST_BOOKING_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`🔑 Has Token: ${!!TEST_TOKEN}`);
    
    console.log('\n📊 Test Results:');
    console.log(`  1. Payment Initialization: ${results.initialization?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  2. Payment Verification: ${results.verification?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  3. Payment Status Check: ${results.statusCheck?.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.initialization?.success) {
      console.log(`\n🔗 Authorization URL: ${results.initialization.data.authorizationUrl}`);
      console.log(`📝 Reference: ${results.initialization.data.reference}`);
    }
    
    // Overall result
    const allPassed = results.initialization?.success && 
                     results.verification?.success && 
                     results.statusCheck?.success;
    
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (!allPassed) {
      console.log('\n❌ Failed Tests Details:');
      if (!results.initialization?.success) {
        console.log(`  - Initialization: ${results.initialization?.error}`);
      }
      if (!results.verification?.success) {
        console.log(`  - Verification: ${results.verification?.error}`);
      }
      if (!results.statusCheck?.success) {
        console.log(`  - Status Check: ${results.statusCheck?.error}`);
      }
    }
    
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    logger.error('Test execution failed', error);
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch((error) => {
    logger.error('Unhandled error in test execution', error);
    console.error('Unhandled error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testPaymentInitialization,
  testPaymentVerification,
  testPaymentStatusCheck,
  runTests
};
