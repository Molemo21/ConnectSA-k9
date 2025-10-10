#!/usr/bin/env node

/**
 * Comprehensive Booking Flow Test Script
 * Tests each phase of the booking flow systematically
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Test data
const TEST_DATA = {
  client: {
    email: 'molemonakin21@gmail.com',
    password: 'Molemo.10'
  },
  service: {
    id: 'c1cebfd1-7656-47c6-9203-7cf0164bd705', // Carpet Cleaning
    name: 'Carpet Cleaning'
  },
  booking: {
    date: '2025-10-11',
    time: '10:30',
    address: 'Test Address, Cape Town, South Africa',
    notes: 'Test booking for comprehensive flow testing'
  }
};

let authToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Cookie': `auth-token=${authToken}` }),
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { response: null, data: null, error };
  }
}

async function testPhase1_ClientLogin() {
  console.log('\n🔐 Phase 1: Testing Client Authentication');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_DATA.client.email,
      password: TEST_DATA.client.password
    })
  });
  
  if (response && response.ok) {
    console.log('✅ Login successful');
    console.log(`   User: ${data.user.name} (${data.user.email})`);
    console.log(`   Role: ${data.user.role}`);
    
    // Extract auth token from Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log(`   Auth token: ${authToken.substring(0, 20)}...`);
      }
    }
    
    return true;
  } else {
    console.log('❌ Login failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return false;
  }
}

async function testPhase2_ProviderDiscovery() {
  console.log('\n🔍 Phase 2: Testing Provider Discovery');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/book-service/discover-providers`, {
    method: 'POST',
    body: JSON.stringify({
      serviceId: TEST_DATA.service.id,
      date: TEST_DATA.booking.date,
      time: TEST_DATA.booking.time,
      address: TEST_DATA.booking.address
    })
  });
  
  if (response && response.ok) {
    console.log('✅ Provider discovery successful');
    console.log(`   Found ${data.totalCount} providers`);
    console.log('   Providers:');
    data.providers.forEach((provider, index) => {
      console.log(`     ${index + 1}. ${provider.businessName || 'Unnamed'} - R${provider.hourlyRate}/hr`);
    });
    return data.providers;
  } else {
    console.log('❌ Provider discovery failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testPhase3_SendOffer(providers) {
  console.log('\n📤 Phase 3: Testing Send Offer');
  console.log('='.repeat(50));
  
  if (!providers || providers.length === 0) {
    console.log('❌ No providers available for testing');
    return null;
  }
  
  const selectedProvider = providers[0]; // Select first provider
  console.log(`   Selected provider: ${selectedProvider.businessName} (${selectedProvider.id})`);
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/book-service/send-offer`, {
    method: 'POST',
    body: JSON.stringify({
      providerId: selectedProvider.id,
      serviceId: TEST_DATA.service.id,
      date: TEST_DATA.booking.date,
      time: TEST_DATA.booking.time,
      address: TEST_DATA.booking.address,
      notes: TEST_DATA.booking.notes
    })
  });
  
  if (response && response.ok) {
    console.log('✅ Send offer successful');
    console.log(`   Booking ID: ${data.booking.id}`);
    console.log(`   Status: ${data.booking.status}`);
    console.log(`   Total Amount: R${data.booking.totalAmount}`);
    console.log(`   Message: ${data.message}`);
    return data.booking;
  } else {
    console.log('❌ Send offer failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testPhase4_ProviderBookings() {
  console.log('\n📋 Phase 4: Testing Provider Bookings API');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/provider/bookings`);
  
  if (response && response.ok) {
    console.log('✅ Provider bookings API working');
    console.log(`   Found ${data.bookings.length} bookings`);
    console.log('   Stats:', data.stats);
    
    if (data.bookings.length > 0) {
      console.log('   Recent bookings:');
      data.bookings.slice(0, 3).forEach((booking, index) => {
        console.log(`     ${index + 1}. ${booking.service?.name} - ${booking.status} - ${booking.scheduledDate}`);
      });
    }
    return data.bookings;
  } else {
    console.log('❌ Provider bookings API failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testPhase5_DatabaseState() {
  console.log('\n🗄️ Phase 5: Testing Database State');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/debug/simple-check`);
  
  if (response && response.ok) {
    console.log('✅ Database state check successful');
    console.log('   Counts:', data.counts);
    console.log('   Recent bookings:', data.recentBookings.length);
    console.log('   Providers:', data.providers.length);
    return data;
  } else {
    console.log('❌ Database state check failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Booking Flow Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Service: ${TEST_DATA.service.name} (${TEST_DATA.service.id})`);
  console.log(`Test Date: ${TEST_DATA.booking.date} at ${TEST_DATA.booking.time}`);
  
  const results = {
    phase1_login: false,
    phase2_discovery: false,
    phase3_sendOffer: false,
    phase4_providerBookings: false,
    phase5_database: false
  };
  
  // Phase 1: Client Authentication
  results.phase1_login = await testPhase1_ClientLogin();
  
  // Phase 2: Provider Discovery
  const providers = await testPhase2_ProviderDiscovery();
  results.phase2_discovery = providers !== null;
  
  // Phase 3: Send Offer
  const booking = await testPhase3_SendOffer(providers);
  results.phase3_sendOffer = booking !== null;
  
  // Phase 4: Provider Bookings
  const providerBookings = await testPhase4_ProviderBookings();
  results.phase4_providerBookings = providerBookings !== null;
  
  // Phase 5: Database State
  const dbState = await testPhase5_DatabaseState();
  results.phase5_database = dbState !== null;
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Phase 1 - Client Login: ${results.phase1_login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phase 2 - Provider Discovery: ${results.phase2_discovery ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phase 3 - Send Offer: ${results.phase3_sendOffer ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phase 4 - Provider Bookings: ${results.phase4_providerBookings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Phase 5 - Database State: ${results.phase5_database ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedPhases = Object.values(results).filter(Boolean).length;
  const totalPhases = Object.keys(results).length;
  
  console.log(`\nOverall Result: ${passedPhases}/${totalPhases} phases passed`);
  
  if (passedPhases === totalPhases) {
    console.log('🎉 All phases passed! Booking flow is working correctly.');
  } else {
    console.log('⚠️ Some phases failed. Check the logs above for details.');
  }
  
  return results;
}

// Run the test
runComprehensiveTest().catch(console.error);
