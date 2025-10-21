#!/usr/bin/env node
/**
 * Test Catalogue API for Specific Provider
 * - Tests the /api/catalogue endpoint
 * - Checks what catalogue items are returned
 * - Verifies provider and service matching
 */

const https = require('https');

const PRODUCTION_URL = 'https://app.proliinkconnect.co.za';

async function testCatalogueAPI() {
  console.log('🔍 Testing Catalogue API');
  console.log('========================');
  
  try {
    // Test the catalogue API endpoint
    const result = await new Promise((resolve, reject) => {
      const url = new URL('/api/catalogue', PRODUCTION_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`📊 API Status: ${result.status}`);
    
    if (result.status === 200 && result.data) {
      const items = Array.isArray(result.data) ? result.data : (result.data.items || []);
      console.log(`📊 Total Items Returned: ${items.length}`);
      
      if (items.length > 0) {
        console.log('\n📦 Sample Catalogue Items:');
        items.slice(0, 3).forEach((item, index) => {
          console.log(`${index + 1}. ID: ${item.id}`);
          console.log(`   Provider: ${item.providerId}`);
          console.log(`   Service: ${item.serviceId}`);
          console.log(`   Title: ${item.title}`);
          console.log(`   Price: ${item.price} ${item.currency}`);
          console.log(`   Active: ${item.isActive}`);
          console.log('');
        });
        
        // Check for any items with the test ID format
        const testIdItems = items.filter(item => item.id.startsWith('cat_test'));
        if (testIdItems.length > 0) {
          console.log('⚠️  Found items with test ID format:');
          testIdItems.forEach(item => {
            console.log(`   ${item.id} - ${item.title}`);
          });
        } else {
          console.log('✅ No test ID format items found (good)');
        }
        
      } else {
        console.log('⚠️  No catalogue items returned from API');
      }
    } else {
      console.log(`❌ API Error: ${result.status}`);
      console.log('Response:', result.data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testCatalogueAPIWithService() {
  console.log('\n🔍 Testing Catalogue API with Service Filter');
  console.log('============================================');
  
  try {
    // Test with a service ID filter
    const serviceId = '82ce42da-a2b1-4117-b7f5-21240c42ba37'; // Deep Cleaning service from our test
    
    const result = await new Promise((resolve, reject) => {
      const url = new URL(`/api/catalogue?serviceId=${serviceId}&limit=50`, PRODUCTION_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET'
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', reject);
      req.end();
    });

    console.log(`📊 API Status: ${result.status}`);
    
    if (result.status === 200 && result.data) {
      const items = Array.isArray(result.data) ? result.data : (result.data.items || []);
      console.log(`📊 Items for Service ${serviceId}: ${items.length}`);
      
      if (items.length > 0) {
        console.log('\n📦 Items for Deep Cleaning Service:');
        items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.id} - ${item.title} (${item.providerId})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Service filter test failed:', error.message);
  }
}

async function main() {
  await testCatalogueAPI();
  await testCatalogueAPIWithService();
  
  console.log('\n🎯 Analysis:');
  console.log('The issue is likely:');
  console.log('1. Frontend is sending a catalogue item ID that doesn\'t exist');
  console.log('2. Provider mismatch between selected provider and catalogue item');
  console.log('3. Catalogue item was deactivated or deleted');
  console.log('\n🔧 Next steps:');
  console.log('1. Check what catalogue item ID is being sent from frontend');
  console.log('2. Verify the provider ID matches the catalogue item');
  console.log('3. Ensure the catalogue item is active');
}

main().catch(console.error);