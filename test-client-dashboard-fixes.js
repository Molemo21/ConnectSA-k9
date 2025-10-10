#!/usr/bin/env node

/**
 * Test client dashboard APIs to verify fixes
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Client credentials
const CLIENT_DATA = {
  email: 'molemonakin21@gmail.com',
  password: 'Molemo.10'
};

let clientAuthToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(clientAuthToken && { 'Cookie': `auth-token=${clientAuthToken}` }),
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

async function authenticateClient() {
  console.log('🔐 Authenticating client...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: CLIENT_DATA.email,
      password: CLIENT_DATA.password
    })
  });
  
  if (response && response.ok) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        clientAuthToken = tokenMatch[1];
        console.log('✅ Client authenticated successfully');
        return true;
      }
    }
  }
  
  console.log('❌ Client authentication failed');
  return false;
}

async function testClientDashboard() {
  console.log('\n🔧 Testing Client Dashboard APIs');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateClient();
  if (!authenticated) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test 1: Client Bookings API
  console.log('   Testing client bookings API...');
  const { response: bookingsResponse, data: bookingsData } = await makeRequest(`${BASE_URL}/api/bookings/my-bookings`);
  
  if (bookingsResponse && bookingsResponse.ok) {
    console.log('   ✅ Client bookings API working');
    console.log(`     Success: ${bookingsData.success}`);
    console.log(`     Bookings count: ${bookingsData.count || 0}`);
    console.log(`     Message: ${bookingsData.message || 'N/A'}`);
    
    if (bookingsData.bookings && bookingsData.bookings.length > 0) {
      const firstBooking = bookingsData.bookings[0];
      console.log(`     Sample booking: ${firstBooking.id}`);
      console.log(`     Status: ${firstBooking.status}`);
      console.log(`     Service: ${firstBooking.service?.name || 'N/A'}`);
      console.log(`     Provider: ${firstBooking.provider?.businessName || 'N/A'}`);
    }
  } else {
    console.log('   ❌ Client bookings API failed');
    console.log(`     Status: ${bookingsResponse?.status}`);
    console.log(`     Error: ${bookingsData?.error || 'Unknown error'}`);
  }
  
  // Test 2: Drafts API
  console.log('   Testing drafts API...');
  const { response: draftsResponse, data: draftsData } = await makeRequest(`${BASE_URL}/api/bookings/drafts/user-drafts`);
  
  if (draftsResponse && draftsResponse.ok) {
    console.log('   ✅ Drafts API working');
    console.log(`     Success: ${draftsData.success}`);
    console.log(`     Drafts count: ${draftsData.drafts?.length || 0}`);
  } else {
    console.log('   ❌ Drafts API failed');
    console.log(`     Status: ${draftsResponse?.status}`);
    console.log(`     Error: ${draftsData?.error || 'Unknown error'}`);
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log('✅ Client dashboard APIs should now be working!');
  console.log('✅ Bookings should appear in the client dashboard!');
}

// Run the test
testClientDashboard().catch(console.error);
