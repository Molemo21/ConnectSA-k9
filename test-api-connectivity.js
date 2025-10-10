#!/usr/bin/env node

/**
 * Test basic API connectivity
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

async function testBasicConnectivity() {
  console.log('🔍 Testing Basic API Connectivity');
  console.log('='.repeat(50));
  
  // Test 1: Provider Status API (we know this works)
  console.log('   Testing Provider Status API...');
  try {
    const response = await fetch(`${BASE_URL}/api/provider/status`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This should fail but return proper JSON
      }
    });
    
    const data = await response.json();
    console.log(`   ✅ Provider Status API responds (Status: ${response.status})`);
    console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Provider Status API failed: ${error.message}`);
  }
  
  // Test 2: Provider Bookings API (we know this works)
  console.log('   Testing Provider Bookings API...');
  try {
    const response = await fetch(`${BASE_URL}/api/provider/bookings`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This should fail but return proper JSON
      }
    });
    
    const data = await response.json();
    console.log(`   ✅ Provider Bookings API responds (Status: ${response.status})`);
    console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Provider Bookings API failed: ${error.message}`);
  }
  
  // Test 3: Provider Earnings API (the failing one)
  console.log('   Testing Provider Earnings API...');
  try {
    const response = await fetch(`${BASE_URL}/api/provider/earnings`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This should fail but return proper JSON
      }
    });
    
    const data = await response.json();
    console.log(`   ✅ Provider Earnings API responds (Status: ${response.status})`);
    console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Provider Earnings API failed: ${error.message}`);
  }
  
  // Test 4: Provider Dashboard API (the failing one)
  console.log('   Testing Provider Dashboard API...');
  try {
    const response = await fetch(`${BASE_URL}/api/provider/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This should fail but return proper JSON
      }
    });
    
    const data = await response.json();
    console.log(`   ✅ Provider Dashboard API responds (Status: ${response.status})`);
    console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Provider Dashboard API failed: ${error.message}`);
  }
  
  // Test 5: Debug endpoint (the new one)
  console.log('   Testing Debug Provider Earnings API...');
  try {
    const response = await fetch(`${BASE_URL}/api/debug/provider-earnings`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test-token' // This should fail but return proper JSON
      }
    });
    
    const data = await response.json();
    console.log(`   ✅ Debug Provider Earnings API responds (Status: ${response.status})`);
    console.log(`     Response: ${JSON.stringify(data).substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Debug Provider Earnings API failed: ${error.message}`);
  }
}

// Run test
testBasicConnectivity().catch(console.error);
