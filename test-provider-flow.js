#!/usr/bin/env node

/**
 * Provider Side Booking Flow Test Script
 * Tests provider authentication and booking management
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Provider test data
const PROVIDER_DATA = {
  email: 'bubelembizeni32@gmail.com', // Keitumetse Faith Seroto provider
  password: 'Bubele32'
};

let providerAuthToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(providerAuthToken && { 'Cookie': `auth-token=${providerAuthToken}` }),
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

async function testProviderLogin() {
  console.log('\n🔐 Testing Provider Authentication');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: PROVIDER_DATA.email,
      password: PROVIDER_DATA.password
    })
  });
  
  if (response && response.ok) {
    console.log('✅ Provider login successful');
    console.log(`   User: ${data.user.name} (${data.user.email})`);
    console.log(`   Role: ${data.user.role}`);
    
    // Extract auth token from Set-Cookie header
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        providerAuthToken = tokenMatch[1];
        console.log(`   Auth token: ${providerAuthToken.substring(0, 20)}...`);
      }
    }
    
    return true;
  } else {
    console.log('❌ Provider login failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return false;
  }
}

async function testProviderBookings() {
  console.log('\n📋 Testing Provider Bookings API');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/provider/bookings`);
  
  if (response && response.ok) {
    console.log('✅ Provider bookings API successful');
    console.log(`   Found ${data.bookings.length} bookings`);
    console.log('   Stats:', data.stats);
    
    if (data.bookings.length > 0) {
      console.log('   Recent bookings:');
      data.bookings.slice(0, 5).forEach((booking, index) => {
        console.log(`     ${index + 1}. ${booking.service?.name || 'Unknown Service'}`);
        console.log(`        Status: ${booking.status}`);
        console.log(`        Date: ${booking.scheduledDate}`);
        console.log(`        Client: ${booking.client?.name || 'Unknown Client'}`);
        console.log(`        Amount: R${booking.totalAmount || 0}`);
        console.log('');
      });
    } else {
      console.log('   No bookings found');
    }
    return data.bookings;
  } else {
    console.log('❌ Provider bookings API failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testProviderStatus() {
  console.log('\n📊 Testing Provider Status API');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/provider/status`);
  
  if (response && response.ok) {
    console.log('✅ Provider status API successful');
    console.log('   Provider info:', data.provider);
    return data.provider;
  } else {
    console.log('❌ Provider status API failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testBookingActions(bookings) {
  console.log('\n⚡ Testing Booking Actions');
  console.log('='.repeat(50));
  
  if (!bookings || bookings.length === 0) {
    console.log('❌ No bookings available for testing actions');
    return false;
  }
  
  // Find a PENDING booking
  const pendingBooking = bookings.find(b => b.status === 'PENDING');
  
  if (!pendingBooking) {
    console.log('❌ No PENDING bookings found for testing actions');
    return false;
  }
  
  console.log(`   Found PENDING booking: ${pendingBooking.id}`);
  console.log(`   Service: ${pendingBooking.service?.name}`);
  console.log(`   Client: ${pendingBooking.client?.name}`);
  
  // Test accept booking
  console.log('\n   Testing ACCEPT booking action...');
  const { response: acceptResponse, data: acceptData } = await makeRequest(
    `${BASE_URL}/api/book-service/${pendingBooking.id}/accept`,
    { method: 'POST' }
  );
  
  if (acceptResponse && acceptResponse.ok) {
    console.log('   ✅ Accept booking successful');
    console.log(`   New status: ${acceptData.booking.status}`);
    return true;
  } else {
    console.log('   ❌ Accept booking failed');
    console.log(`   Status: ${acceptResponse?.status}`);
    console.log(`   Error: ${acceptData?.error || 'Unknown error'}`);
    return false;
  }
}

async function runProviderTest() {
  console.log('🚀 Starting Provider Side Booking Flow Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Provider Email: ${PROVIDER_DATA.email}`);
  
  const results = {
    login: false,
    bookings: false,
    status: false,
    actions: false
  };
  
  // Test provider login
  results.login = await testProviderLogin();
  
  if (!results.login) {
    console.log('\n❌ Provider login failed. Cannot continue with provider tests.');
    return results;
  }
  
  // Test provider status
  const providerInfo = await testProviderStatus();
  results.status = providerInfo !== null;
  
  // Test provider bookings
  const bookings = await testProviderBookings();
  results.bookings = bookings !== null;
  
  // Test booking actions
  results.actions = await testBookingActions(bookings);
  
  // Summary
  console.log('\n📊 Provider Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Provider Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Provider Status: ${results.status ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Provider Bookings: ${results.bookings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Booking Actions: ${results.actions ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All provider tests passed! Provider side is working correctly.');
  } else {
    console.log('⚠️ Some provider tests failed. Check the logs above for details.');
  }
  
  return results;
}

// Run the test
runProviderTest().catch(console.error);
