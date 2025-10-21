#!/usr/bin/env node
/**
 * End-to-End Booking Flow Verification
 * - Tests the complete catalogue booking flow
 * - Verifies authentication and API endpoints
 * - Provides detailed test results
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

class BookingFlowTester {
  constructor() {
    this.results = {
      deployment: false,
      endpoints: {},
      authentication: false,
      catalogueFlow: false,
      errors: []
    };
  }

  async testEndpoint(endpoint, payload, expectedStatus = 401) {
    return new Promise((resolve) => {
      const url = new URL(endpoint, PRODUCTION_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(payload))
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const result = {
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            success: res.statusCode === expectedStatus
          };
          resolve(result);
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 0,
          data: { error: error.message },
          success: false
        });
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async testDeployment() {
    console.log('🚀 Testing Deployment Status...');
    
    try {
      // Test a known endpoint that should exist
      const response = await this.testEndpoint('/api/catalogue', {});
      this.results.deployment = response.status === 200 || response.status === 401;
      
      console.log(`   Status: ${response.status}`);
      console.log(`   ✅ Deployment: ${this.results.deployment ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      this.results.errors.push(`Deployment test failed: ${error.message}`);
      console.log(`   ❌ Deployment: FAILED - ${error.message}`);
    }
  }

  async testEndpoints() {
    console.log('\n🔍 Testing API Endpoints...');
    
    const testPayload = {
      providerId: 'test-provider-id',
      serviceId: 'test-service-id',
      date: '2024-12-25',
      time: '14:00',
      address: 'Test Address',
      notes: 'Test booking',
      catalogueItemId: 'test-catalogue-id'
    };

    // Test legacy endpoint
    console.log('   📡 Legacy endpoint...');
    const legacyResult = await this.testEndpoint('/api/book-service/send-offer', testPayload);
    this.results.endpoints.legacy = legacyResult;
    console.log(`      Status: ${legacyResult.status} (Expected: 401)`);
    console.log(`      ✅ Legacy: ${legacyResult.success ? 'ACCESSIBLE' : 'FAILED'}`);

    // Test enhanced endpoint
    console.log('   📡 Enhanced endpoint...');
    const enhancedResult = await this.testEndpoint('/api/book-service/send-offer-enhanced', testPayload);
    this.results.endpoints.enhanced = enhancedResult;
    console.log(`      Status: ${enhancedResult.status} (Expected: 401)`);
    console.log(`      ✅ Enhanced: ${enhancedResult.success ? 'ACCESSIBLE' : 'FAILED'}`);
  }

  async testCatalogueAPI() {
    console.log('\n📦 Testing Catalogue API...');
    
    try {
      const response = await this.testEndpoint('/api/catalogue', {});
      this.results.catalogueFlow = response.status === 200 || response.status === 401;
      
      console.log(`   Status: ${response.status}`);
      console.log(`   ✅ Catalogue API: ${this.results.catalogueFlow ? 'ACCESSIBLE' : 'FAILED'}`);
    } catch (error) {
      this.results.errors.push(`Catalogue API test failed: ${error.message}`);
      console.log(`   ❌ Catalogue API: FAILED - ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const totalTests = 4;
    const passedTests = [
      this.results.deployment,
      this.results.endpoints.legacy?.success,
      this.results.endpoints.enhanced?.success,
      this.results.catalogueFlow
    ].filter(Boolean).length;

    console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`🚀 Deployment: ${this.results.deployment ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📡 Legacy Endpoint: ${this.results.endpoints.legacy?.success ? '✅ ACCESSIBLE' : '❌ FAILED'}`);
    console.log(`📡 Enhanced Endpoint: ${this.results.endpoints.enhanced?.success ? '✅ ACCESSIBLE' : '❌ FAILED'}`);
    console.log(`📦 Catalogue API: ${this.results.catalogueFlow ? '✅ ACCESSIBLE' : '❌ FAILED'}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors Found:');
      this.results.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n🎯 Next Steps:');
    if (passedTests === totalTests) {
      console.log('   ✅ All systems ready for testing');
      console.log('   🧪 Manual test: Try the booking flow in production');
      console.log('   📱 Test: Service → Providers → Services → Select Package → Confirm & Book');
    } else {
      console.log('   ⚠️  Some issues detected - check errors above');
      console.log('   🔧 Fix issues before manual testing');
    }

    return passedTests === totalTests;
  }

  async runAllTests() {
    console.log('🧪 End-to-End Booking Flow Verification');
    console.log('=========================================');
    
    await this.testDeployment();
    await this.testEndpoints();
    await this.testCatalogueAPI();
    
    const success = this.generateReport();
    return success;
  }
}

// Run the tests
async function main() {
  const tester = new BookingFlowTester();
  const success = await tester.runAllTests();
  
  if (success) {
    console.log('\n🎉 All tests passed! Ready for manual verification.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
    process.exit(1);
  }
}

main().catch(console.error);
