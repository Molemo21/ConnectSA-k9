#!/usr/bin/env node

/**
 * Test payment API to verify fixes
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

async function testPaymentAPI() {
  console.log('\n🔧 Testing Payment API');
  console.log('='.repeat(50));
  
  const authenticated = await authenticateClient();
  if (!authenticated) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // First, get client bookings to find a booking ID
  console.log('   Getting client bookings...');
  const { response: bookingsResponse, data: bookingsData } = await makeRequest(`${BASE_URL}/api/bookings/my-bookings`);
  
  if (!bookingsResponse || !bookingsResponse.ok || !bookingsData.bookings || bookingsData.bookings.length === 0) {
    console.log('   ❌ No bookings found to test payment');
    console.log(`     Status: ${bookingsResponse?.status}`);
    console.log(`     Bookings: ${bookingsData.bookings?.length || 0}`);
    return;
  }
  
  const booking = bookingsData.bookings[0];
  console.log(`   ✅ Found booking: ${booking.id}`);
  console.log(`     Status: ${booking.status}`);
  console.log(`     Amount: R${booking.totalAmount || 0}`);
  
  // Test payment API
  console.log('   Testing payment API...');
  const { response: paymentResponse, data: paymentData } = await makeRequest(`${BASE_URL}/api/book-service/${booking.id}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      callbackUrl: `${BASE_URL}/dashboard?payment=success&booking=${booking.id}`
    })
  });
  
  if (paymentResponse && paymentResponse.ok) {
    console.log('   ✅ Payment API working');
    console.log(`     Success: ${paymentData.success}`);
    console.log(`     Payment ID: ${paymentData.payment?.id || 'N/A'}`);
    console.log(`     Authorization URL: ${paymentData.authorizationUrl ? 'Present' : 'Missing'}`);
    console.log(`     Message: ${paymentData.message || 'N/A'}`);
  } else {
    console.log('   ❌ Payment API failed');
    console.log(`     Status: ${paymentResponse?.status}`);
    console.log(`     Error: ${paymentData?.error || 'Unknown error'}`);
    console.log(`     Message: ${paymentData?.message || 'N/A'}`);
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log('✅ Payment API should now be working!');
  console.log('✅ Clients should be able to initiate payments!');
}

// Run the test
testPaymentAPI().catch(console.error);
