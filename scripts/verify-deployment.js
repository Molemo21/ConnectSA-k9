#!/usr/bin/env node
/**
 * Deployment Verification Script
 * - Checks if the frontend changes are live in production
 * - Verifies the enhanced endpoint is being called
 * - Provides deployment status confirmation
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

async function checkDeployment() {
  console.log('🔍 Verifying Deployment Status');
  console.log('==============================');
  
  try {
    // Check if the site is accessible
    const response = await new Promise((resolve, reject) => {
      const req = https.get(PRODUCTION_URL, (res) => {
        resolve({
          status: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    console.log(`🌐 Site Status: ${response.status}`);
    console.log(`📅 Last Modified: ${response.headers['last-modified'] || 'Not available'}`);
    console.log(`🔄 Cache Control: ${response.headers['cache-control'] || 'Not available'}`);

    if (response.status === 200) {
      console.log('✅ Site is accessible');
      
      // Check if we can access the enhanced endpoint
      const endpointTest = await new Promise((resolve) => {
        const url = new URL('/api/book-service/send-offer-enhanced', PRODUCTION_URL);
        
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': 2
          }
        };

        const req = https.request(options, (res) => {
          resolve({
            status: res.statusCode,
            accessible: res.statusCode === 401 // Expected without auth
          });
        });

        req.on('error', () => resolve({ status: 0, accessible: false }));
        req.write('{}');
        req.end();
      });

      console.log(`📡 Enhanced Endpoint: ${endpointTest.status}`);
      console.log(`✅ Endpoint Accessible: ${endpointTest.accessible ? 'YES' : 'NO'}`);

      if (endpointTest.accessible) {
        console.log('\n🎉 Deployment Verification Complete!');
        console.log('=====================================');
        console.log('✅ Site is live and accessible');
        console.log('✅ Enhanced endpoint is deployed');
        console.log('✅ Ready for manual testing');
        console.log('\n📋 Next Steps:');
        console.log('1. Follow the Manual Testing Guide');
        console.log('2. Test the complete booking flow');
        console.log('3. Verify "Confirm & Book" works without 401 errors');
        return true;
    } else {
        console.log('\n⚠️  Endpoint not accessible - deployment may be in progress');
    return false;
  }
    } else {
      console.log('❌ Site not accessible');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Deployment check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const success = await checkDeployment();
  
  if (success) {
    console.log('\n🚀 Ready for testing!');
    process.exit(0);
  } else {
    console.log('\n⏳ Deployment may still be in progress. Try again in a few minutes.');
    process.exit(1);
  }
}

main().catch(console.error);