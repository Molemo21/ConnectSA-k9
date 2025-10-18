#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * 
 * This script verifies that the production deployment is working correctly
 * and all systems are synchronized.
 */

const https = require('https');
const http = require('http');

async function verifyProductionDeployment(baseUrl) {
  console.log(`🚀 Verifying production deployment at ${baseUrl}...`);
  
  const results = {
    environment: false,
    database: false,
    api: false,
    auth: false,
    payments: false,
    webhooks: false
  };

  try {
    // Test 1: Environment Configuration
    console.log('🔍 Testing environment configuration...');
    const envResponse = await makeRequest(`${baseUrl}/api/debug/environment`);
    if (envResponse.success && envResponse.environment.NODE_ENV === 'production') {
      console.log('✅ Environment configuration correct');
      results.environment = true;
    } else {
      console.log('❌ Environment configuration incorrect');
    }

    // Test 2: Database Connection
    console.log('🔍 Testing database connection...');
    try {
      const dbResponse = await makeRequest(`${baseUrl}/api/services`);
      if (dbResponse && Array.isArray(dbResponse)) {
        console.log('✅ Database connection working');
        results.database = true;
      } else {
        console.log('❌ Database connection failed');
      }
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
    }

    // Test 3: API Endpoints
    console.log('🔍 Testing API endpoints...');
    const apiEndpoints = [
      '/api/services',
      '/api/service-categories',
      '/api/book-service/discover-providers'
    ];

    let apiWorking = 0;
    for (const endpoint of apiEndpoints) {
      try {
        const response = await makeRequest(`${baseUrl}${endpoint}`);
        if (response) {
          apiWorking++;
        }
      } catch (error) {
        console.log(`❌ API endpoint ${endpoint} failed:`, error.message);
      }
    }

    if (apiWorking === apiEndpoints.length) {
      console.log('✅ All API endpoints working');
      results.api = true;
    } else {
      console.log(`⚠️ ${apiWorking}/${apiEndpoints.length} API endpoints working`);
    }

    // Test 4: Authentication System
    console.log('🔍 Testing authentication system...');
    try {
      const authResponse = await makeRequest(`${baseUrl}/api/auth/me`);
      // Should return 401 for unauthenticated requests, which is correct
      if (authResponse.error === 'Unauthorized') {
        console.log('✅ Authentication system working');
        results.auth = true;
      } else {
        console.log('❌ Authentication system not working correctly');
      }
    } catch (error) {
      console.log('❌ Authentication system failed:', error.message);
    }

    // Test 5: Payment System
    console.log('🔍 Testing payment system...');
    try {
      const webhookResponse = await makeRequest(`${baseUrl}/api/webhooks/paystack`);
      if (webhookResponse.message && webhookResponse.message.includes('webhook endpoint is working')) {
        console.log('✅ Payment webhook system working');
        results.payments = true;
      } else {
        console.log('❌ Payment webhook system not working');
      }
    } catch (error) {
      console.log('❌ Payment webhook system failed:', error.message);
    }

    // Test 6: Webhook Endpoint
    console.log('🔍 Testing webhook endpoint...');
    try {
      const webhookResponse = await makeRequest(`${baseUrl}/api/webhooks/paystack`);
      if (webhookResponse.environment && webhookResponse.database) {
        console.log('✅ Webhook endpoint accessible');
        results.webhooks = true;
      } else {
        console.log('❌ Webhook endpoint not accessible');
      }
    } catch (error) {
      console.log('❌ Webhook endpoint failed:', error.message);
    }

    // Summary
    console.log('\n📊 Deployment Verification Summary:');
    console.log('=====================================');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 Production deployment is fully synchronized and working!');
      return true;
    } else {
      console.log('⚠️ Some issues detected. Please review the failed tests above.');
      return false;
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve(data);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run verification if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'https://your-domain.com';
  verifyProductionDeployment(baseUrl)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyProductionDeployment };
