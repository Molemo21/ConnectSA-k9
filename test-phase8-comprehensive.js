#!/usr/bin/env node

/**
 * Phase 8: Admin Side Dashboard & Management - Comprehensive Testing
 * Tests all admin functionality including authentication, dashboard, user management, provider management, and system health
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Test credentials - Using the admin user from the database
const ADMIN_DATA = {
  email: 'admin@proliinkconnect.co.za',
  password: 'AdminPass123!'
};

let adminAuthToken = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(adminAuthToken && { 'Cookie': `auth-token=${adminAuthToken}` }),
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

async function authenticateAdmin() {
  console.log('🔐 Authenticating admin...');
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: ADMIN_DATA.email,
      password: ADMIN_DATA.password
    })
  });
  
  if (response && response.ok) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        adminAuthToken = tokenMatch[1];
        console.log('✅ Admin authenticated successfully');
        console.log(`   Token: ${adminAuthToken.substring(0, 20)}...`);
        return true;
      }
    }
  }
  
  console.log('❌ Admin authentication failed');
  console.log(`   Status: ${response?.status}`);
  console.log(`   Response: ${JSON.stringify(data)}`);
  return false;
}

async function testAdminAuthentication() {
  console.log('\n🔧 Testing Admin Authentication');
  console.log('='.repeat(50));
  
  // Test 1: Admin Login
  console.log('   Testing admin login...');
  const authenticated = await authenticateAdmin();
  
  if (authenticated) {
    console.log('   ✅ Admin login successful');
  } else {
    console.log('   ❌ Admin login failed');
    return false;
  }
  
  // Test 2: Admin Role Verification
  console.log('   Testing admin role verification...');
  const { response: meResponse, data: meData } = await makeRequest(`${BASE_URL}/api/auth/me`);
  
  if (meResponse && meResponse.ok && meData.user?.role === 'ADMIN') {
    console.log('   ✅ Admin role verified');
    console.log(`     User ID: ${meData.user.id}`);
    console.log(`     Email: ${meData.user.email}`);
    console.log(`     Role: ${meData.user.role}`);
  } else {
    console.log('   ❌ Admin role verification failed');
    console.log(`     Status: ${meResponse?.status}`);
    console.log(`     Role: ${meData?.user?.role || 'N/A'}`);
    return false;
  }
  
  return true;
}

async function testAdminDashboard() {
  console.log('\n🔧 Testing Admin Dashboard');
  console.log('='.repeat(50));
  
  // Test 1: Admin Stats API
  console.log('   Testing admin stats API...');
  const { response: statsResponse, data: statsData } = await makeRequest(`${BASE_URL}/api/admin/stats`);
  
  if (statsResponse && statsResponse.ok) {
    console.log('   ✅ Admin stats API working');
    console.log(`     Total users: ${statsData.totalUsers || 0}`);
    console.log(`     Total providers: ${statsData.totalProviders || 0}`);
    console.log(`     Pending providers: ${statsData.pendingProviders || 0}`);
    console.log(`     Total bookings: ${statsData.totalBookings || 0}`);
    console.log(`     Completed bookings: ${statsData.completedBookings || 0}`);
    console.log(`     Total revenue: R${statsData.totalRevenue || 0}`);
    console.log(`     Average rating: ${statsData.averageRating || 0}`);
  } else {
    console.log('   ❌ Admin stats API failed');
    console.log(`     Status: ${statsResponse?.status}`);
    console.log(`     Error: ${statsData?.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 2: Admin Analytics API
  console.log('   Testing admin analytics API...');
  const { response: analyticsResponse, data: analyticsData } = await makeRequest(`${BASE_URL}/api/admin/analytics`);
  
  if (analyticsResponse && analyticsResponse.ok) {
    console.log('   ✅ Admin analytics API working');
    console.log(`     User growth: ${analyticsData.userGrowth || 0}%`);
    console.log(`     Provider growth: ${analyticsData.providerGrowth || 0}%`);
    console.log(`     Booking growth: ${analyticsData.bookingGrowth || 0}%`);
    console.log(`     Revenue growth: ${analyticsData.revenueGrowth || 0}%`);
  } else {
    console.log('   ❌ Admin analytics API failed');
    console.log(`     Status: ${analyticsResponse?.status}`);
    console.log(`     Error: ${analyticsData?.error || 'Unknown error'}`);
  }
  
  // Test 3: System Health API
  console.log('   Testing system health API...');
  const { response: healthResponse, data: healthData } = await makeRequest(`${BASE_URL}/api/admin/system-health`);
  
  if (healthResponse && healthResponse.ok) {
    console.log('   ✅ System health API working');
    console.log(`     Status: ${healthData.status || 'N/A'}`);
    console.log(`     Database connection: ${healthData.databaseConnection ? '✅' : '❌'}`);
    console.log(`     API response time: ${healthData.apiResponseTime || 0}ms`);
    console.log(`     Active users: ${healthData.activeUsers || 0}`);
  } else {
    console.log('   ❌ System health API failed');
    console.log(`     Status: ${healthResponse?.status}`);
    console.log(`     Error: ${healthData?.error || 'Unknown error'}`);
  }
  
  return true;
}

async function testUserManagement() {
  console.log('\n🔧 Testing User Management');
  console.log('='.repeat(50));
  
  // Test 1: Get Users API
  console.log('   Testing get users API...');
  const { response: usersResponse, data: usersData } = await makeRequest(`${BASE_URL}/api/admin/users`);
  
  if (usersResponse && usersResponse.ok) {
    console.log('   ✅ Get users API working');
    console.log(`     Total users: ${usersData.total || 0}`);
    console.log(`     Users returned: ${usersData.users?.length || 0}`);
    
    if (usersData.users && usersData.users.length > 0) {
      const firstUser = usersData.users[0];
      console.log(`     Sample user: ${firstUser.name} (${firstUser.email})`);
      console.log(`     Role: ${firstUser.role}, Status: ${firstUser.status}`);
    }
  } else {
    console.log('   ❌ Get users API failed');
    console.log(`     Status: ${usersResponse?.status}`);
    console.log(`     Error: ${usersData?.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 2: Get User by ID (if we have users)
  if (usersData.users && usersData.users.length > 0) {
    console.log('   Testing get user by ID API...');
    const userId = usersData.users[0].id;
    const { response: userResponse, data: userData } = await makeRequest(`${BASE_URL}/api/admin/users/${userId}`);
    
    if (userResponse && userResponse.ok) {
      console.log('   ✅ Get user by ID API working');
      console.log(`     User: ${userData.name} (${userData.email})`);
    } else {
      console.log('   ❌ Get user by ID API failed');
      console.log(`     Status: ${userResponse?.status}`);
      console.log(`     Error: ${userData?.error || 'Unknown error'}`);
    }
  }
  
  return true;
}

async function testProviderManagement() {
  console.log('\n🔧 Testing Provider Management');
  console.log('='.repeat(50));
  
  // Test 1: Get Providers API
  console.log('   Testing get providers API...');
  const { response: providersResponse, data: providersData } = await makeRequest(`${BASE_URL}/api/admin/providers`);
  
  if (providersResponse && providersResponse.ok) {
    console.log('   ✅ Get providers API working');
    console.log(`     Total providers: ${providersData.total || 0}`);
    console.log(`     Providers returned: ${providersData.providers?.length || 0}`);
    
    if (providersData.providers && providersData.providers.length > 0) {
      const firstProvider = providersData.providers[0];
      console.log(`     Sample provider: ${firstProvider.name} (${firstProvider.businessName})`);
      console.log(`     Status: ${firstProvider.status}, Rating: ${firstProvider.averageRating}`);
    }
  } else {
    console.log('   ❌ Get providers API failed');
    console.log(`     Status: ${providersResponse?.status}`);
    console.log(`     Error: ${providersData?.error || 'Unknown error'}`);
    return false;
  }
  
  // Test 2: Get Provider by ID (if we have providers)
  if (providersData.providers && providersData.providers.length > 0) {
    console.log('   Testing get provider by ID API...');
    const providerId = providersData.providers[0].id;
    const { response: providerResponse, data: providerData } = await makeRequest(`${BASE_URL}/api/admin/providers/${providerId}`);
    
    if (providerResponse && providerResponse.ok) {
      console.log('   ✅ Get provider by ID API working');
      console.log(`     Provider: ${providerData.name} (${providerData.businessName})`);
    } else {
      console.log('   ❌ Get provider by ID API failed');
      console.log(`     Status: ${providerResponse?.status}`);
      console.log(`     Error: ${providerData?.error || 'Unknown error'}`);
    }
  }
  
  return true;
}

async function testBookingManagement() {
  console.log('\n🔧 Testing Booking Management');
  console.log('='.repeat(50));
  
  // Test 1: Get Bookings API
  console.log('   Testing get bookings API...');
  const { response: bookingsResponse, data: bookingsData } = await makeRequest(`${BASE_URL}/api/admin/bookings`);
  
  if (bookingsResponse && bookingsResponse.ok) {
    console.log('   ✅ Get bookings API working');
    console.log(`     Total bookings: ${bookingsData.total || 0}`);
    console.log(`     Bookings returned: ${bookingsData.bookings?.length || 0}`);
    
    if (bookingsData.bookings && bookingsData.bookings.length > 0) {
      const firstBooking = bookingsData.bookings[0];
      console.log(`     Sample booking: ${firstBooking.id}`);
      console.log(`     Status: ${firstBooking.status}, Amount: R${firstBooking.totalAmount || 0}`);
    }
  } else {
    console.log('   ❌ Get bookings API failed');
    console.log(`     Status: ${bookingsResponse?.status}`);
    console.log(`     Error: ${bookingsData?.error || 'Unknown error'}`);
    return false;
  }
  
  return true;
}

async function testPaymentManagement() {
  console.log('\n🔧 Testing Payment Management');
  console.log('='.repeat(50));
  
  // Test 1: Get Payments API
  console.log('   Testing get payments API...');
  const { response: paymentsResponse, data: paymentsData } = await makeRequest(`${BASE_URL}/api/admin/payments`);
  
  if (paymentsResponse && paymentsResponse.ok) {
    console.log('   ✅ Get payments API working');
    console.log(`     Total payments: ${paymentsData.total || 0}`);
    console.log(`     Payments returned: ${paymentsData.payments?.length || 0}`);
    
    if (paymentsData.payments && paymentsData.payments.length > 0) {
      const firstPayment = paymentsData.payments[0];
      console.log(`     Sample payment: ${firstPayment.id}`);
      console.log(`     Status: ${firstPayment.status}, Amount: R${firstPayment.amount || 0}`);
    }
  } else {
    console.log('   ❌ Get payments API failed');
    console.log(`     Status: ${paymentsResponse?.status}`);
    console.log(`     Error: ${paymentsData?.error || 'Unknown error'}`);
  }
  
  // Test 2: Get Pending Payments API
  console.log('   Testing get pending payments API...');
  const { response: pendingResponse, data: pendingData } = await makeRequest(`${BASE_URL}/api/admin/payments/pending`);
  
  if (pendingResponse && pendingResponse.ok) {
    console.log('   ✅ Get pending payments API working');
    console.log(`     Pending payments: ${pendingData.total || 0}`);
  } else {
    console.log('   ❌ Get pending payments API failed');
    console.log(`     Status: ${pendingResponse?.status}`);
    console.log(`     Error: ${pendingData?.error || 'Unknown error'}`);
  }
  
  return true;
}

async function testAdminDashboardAccess() {
  console.log('\n🔧 Testing Admin Dashboard Access');
  console.log('='.repeat(50));
  
  // Test 1: Admin Dashboard Page Access
  console.log('   Testing admin dashboard page access...');
  const { response: dashboardResponse } = await makeRequest(`${BASE_URL}/admin/dashboard`);
  
  if (dashboardResponse && dashboardResponse.ok) {
    console.log('   ✅ Admin dashboard page accessible');
    console.log(`     Status: ${dashboardResponse.status}`);
  } else {
    console.log('   ❌ Admin dashboard page not accessible');
    console.log(`     Status: ${dashboardResponse?.status}`);
  }
  
  return true;
}

async function runPhase8Test() {
  console.log('🚀 Phase 8: Admin Side Dashboard & Management');
  console.log('='.repeat(60));
  
  const results = {
    authentication: false,
    dashboard: false,
    userManagement: false,
    providerManagement: false,
    bookingManagement: false,
    paymentManagement: false,
    dashboardAccess: false
  };
  
  // Test 1: Admin Authentication
  results.authentication = await testAdminAuthentication();
  
  if (!results.authentication) {
    console.log('\n❌ Admin authentication failed. Cannot proceed with other tests.');
    console.log('   This suggests admin credentials need to be configured.');
    return results;
  }
  
  // Test 2: Admin Dashboard
  results.dashboard = await testAdminDashboard();
  
  // Test 3: User Management
  results.userManagement = await testUserManagement();
  
  // Test 4: Provider Management
  results.providerManagement = await testProviderManagement();
  
  // Test 5: Booking Management
  results.bookingManagement = await testBookingManagement();
  
  // Test 6: Payment Management
  results.paymentManagement = await testPaymentManagement();
  
  // Test 7: Dashboard Access
  results.dashboardAccess = await testAdminDashboardAccess();
  
  console.log('\n📊 Phase 8 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Admin Authentication: ${results.authentication ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Admin Dashboard: ${results.dashboard ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`User Management: ${results.userManagement ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Provider Management: ${results.providerManagement ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Booking Management: ${results.bookingManagement ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Payment Management: ${results.paymentManagement ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Dashboard Access: ${results.dashboardAccess ? '✅ WORKING' : '❌ FAILED'}`);
  
  const workingCount = Object.values(results).filter(Boolean).length;
  console.log(`\nWorking admin features: ${workingCount}/7`);
  
  if (workingCount === 7) {
    console.log('🎉 All admin functionality is working perfectly!');
  } else if (workingCount >= 5) {
    console.log('✅ Most admin functionality is working well!');
  } else if (workingCount >= 3) {
    console.log('⚠️ Some admin functionality needs attention.');
  } else {
    console.log('❌ Admin system needs significant setup.');
  }
  
  return results;
}

// Run Phase 8 test
runPhase8Test().catch(console.error);
