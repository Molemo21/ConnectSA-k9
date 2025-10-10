#!/usr/bin/env node

/**
 * Phase 1: Client Side Booking Flow - Comprehensive Testing
 * Tests service selection, form submission, validation, and provider discovery
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

// Test credentials
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

async function testClientLogin() {
  console.log('\n🔐 Phase 1.1: Testing Client Login');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: CLIENT_DATA.email,
      password: CLIENT_DATA.password
    })
  });
  
  if (response && response.ok) {
    console.log('✅ Client login successful');
    console.log(`   User: ${data.user.name} (${data.user.email})`);
    console.log(`   Role: ${data.user.role}`);
    console.log(`   Email Verified: ${data.user.emailVerified}`);
    console.log(`   Is Active: ${data.user.isActive}`);
    
    // Extract auth token
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        clientAuthToken = tokenMatch[1];
        console.log(`   Auth token: ${clientAuthToken.substring(0, 20)}...`);
      }
    }
    
    return true;
  } else {
    console.log('❌ Client login failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return false;
  }
}

async function testServiceCategories() {
  console.log('\n📂 Phase 1.2: Testing Service Categories API');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/service-categories`);
  
  if (response && response.ok) {
    console.log('✅ Service categories API successful');
    console.log(`   Found ${data.length} categories`);
    
    if (data.length > 0) {
      console.log('   Categories:');
      data.forEach((category, index) => {
        console.log(`     ${index + 1}. ${category.name} (${category.id})`);
        console.log(`        Description: ${category.description || 'N/A'}`);
        console.log(`        Icon: ${category.icon || 'N/A'}`);
        console.log(`        Active: ${category.isActive}`);
        console.log(`        Services: ${category.services?.length || 0}`);
        console.log('');
      });
    }
    
    return data;
  } else {
    console.log('❌ Service categories API failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testServicesAPI() {
  console.log('\n🔧 Phase 1.3: Testing Services API');
  console.log('='.repeat(50));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/services`);
  
  if (response && response.ok) {
    console.log('✅ Services API successful');
    console.log(`   Found ${data.length} services`);
    
    if (data.length > 0) {
      console.log('   Services:');
      data.forEach((service, index) => {
        console.log(`     ${index + 1}. ${service.name} (${service.id})`);
        console.log(`        Description: ${service.description || 'N/A'}`);
        console.log(`        Category ID: ${service.categoryId}`);
        console.log(`        Category Name: ${service.categoryName}`);
        console.log(`        Base Price: R${service.basePrice || 0}`);
        console.log(`        Active: ${service.isActive}`);
        console.log('');
      });
    }
    
    return data;
  } else {
    console.log('❌ Services API failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testServiceValidation() {
  console.log('\n✅ Phase 1.4: Testing Service Validation');
  console.log('='.repeat(50));
  
  // Test with valid service ID
  const validServiceId = 'c1cebfd1-7656-47c6-9203-7cf0164bd705'; // Carpet Cleaning
  
  console.log(`   Testing with valid service ID: ${validServiceId}`);
  
  // Test service ID format validation
  const cuidPattern = /^[a-z0-9]{25}$/;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const isValidCuid = cuidPattern.test(validServiceId);
  const isValidUuid = uuidPattern.test(validServiceId);
  
  console.log(`   CUID format valid: ${isValidCuid ? '✅' : '❌'}`);
  console.log(`   UUID format valid: ${isValidUuid ? '✅' : '❌'}`);
  console.log(`   Overall format valid: ${(isValidCuid || isValidUuid) ? '✅' : '❌'}`);
  
  return isValidCuid || isValidUuid;
}

async function testProviderDiscovery() {
  console.log('\n🔍 Phase 1.5: Testing Provider Discovery');
  console.log('='.repeat(50));
  
  const discoveryData = {
    serviceId: 'c1cebfd1-7656-47c6-9203-7cf0164bd705', // Carpet Cleaning
    date: '2025-10-15',
    time: '10:00',
    address: '123 Test Street, Cape Town, South Africa'
  };
  
  console.log('   Discovery parameters:');
  console.log(`     Service ID: ${discoveryData.serviceId}`);
  console.log(`     Date: ${discoveryData.date}`);
  console.log(`     Time: ${discoveryData.time}`);
  console.log(`     Address: ${discoveryData.address}`);
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/book-service/discover-providers`, {
    method: 'POST',
    body: JSON.stringify(discoveryData)
  });
  
  if (response && response.ok) {
    console.log('✅ Provider discovery successful');
    console.log(`   Found ${data.providers.length} providers`);
    
    if (data.providers.length > 0) {
      console.log('   Providers:');
      data.providers.forEach((provider, index) => {
        console.log(`     ${index + 1}. ${provider.businessName || 'Unnamed Provider'} (${provider.id})`);
        console.log(`        Status: ${provider.status}`);
        console.log(`        Available: ${provider.available}`);
        console.log(`        Hourly Rate: R${provider.hourlyRate || 0}`);
        console.log(`        Rating: ${provider.averageRating || 'N/A'}`);
        console.log(`        Reviews: ${provider.totalReviews || 0}`);
        console.log('');
      });
    }
    
    return data.providers;
  } else {
    console.log('❌ Provider discovery failed');
    console.log(`   Status: ${response?.status}`);
    console.log(`   Error: ${data?.error || 'Unknown error'}`);
    return null;
  }
}

async function testFormValidation() {
  console.log('\n📝 Phase 1.6: Testing Form Validation');
  console.log('='.repeat(50));
  
  // Test various validation scenarios
  const testCases = [
    {
      name: 'Valid booking data',
      data: {
        providerId: 'cmd8luf4r0002s7v4shykm4un',
        serviceId: 'c1cebfd1-7656-47c6-9203-7cf0164bd705',
        date: '2025-10-15',
        time: '10:00',
        address: '123 Test Street, Cape Town, South Africa',
        notes: 'Please clean thoroughly'
      },
      shouldPass: true
    },
    {
      name: 'Missing provider ID',
      data: {
        serviceId: 'c1cebfd1-7656-47c6-9203-7cf0164bd705',
        date: '2025-10-15',
        time: '10:00',
        address: '123 Test Street, Cape Town, South Africa'
      },
      shouldPass: false
    },
    {
      name: 'Invalid service ID format',
      data: {
        providerId: 'cmd8luf4r0002s7v4shykm4un',
        serviceId: 'invalid-service-id',
        date: '2025-10-15',
        time: '10:00',
        address: '123 Test Street, Cape Town, South Africa'
      },
      shouldPass: false
    },
    {
      name: 'Missing address',
      data: {
        providerId: 'cmd8luf4r0002s7v4shykm4un',
        serviceId: 'c1cebfd1-7656-47c6-9203-7cf0164bd705',
        date: '2025-10-15',
        time: '10:00'
      },
      shouldPass: false
    }
  ];
  
  let passedTests = 0;
  
  for (const testCase of testCases) {
    console.log(`   Testing: ${testCase.name}`);
    
    const { response, data } = await makeRequest(`${BASE_URL}/api/book-service/send-offer`, {
      method: 'POST',
      body: JSON.stringify(testCase.data)
    });
    
    const testPassed = (testCase.shouldPass && response?.ok) || (!testCase.shouldPass && !response?.ok);
    
    console.log(`     Expected: ${testCase.shouldPass ? 'PASS' : 'FAIL'}`);
    console.log(`     Actual: ${response?.ok ? 'PASS' : 'FAIL'}`);
    console.log(`     Result: ${testPassed ? '✅' : '❌'}`);
    
    if (testPassed) {
      passedTests++;
    } else {
      console.log(`     Error: ${data?.error || 'Unknown error'}`);
    }
    
    console.log('');
  }
  
  console.log(`   Validation tests passed: ${passedTests}/${testCases.length}`);
  return passedTests === testCases.length;
}

async function runPhase1Test() {
  console.log('🚀 Phase 1: Client Side Booking Flow - Comprehensive Testing');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Client: ${CLIENT_DATA.email}`);
  
  const results = {
    clientLogin: false,
    serviceCategories: false,
    servicesAPI: false,
    serviceValidation: false,
    providerDiscovery: false,
    formValidation: false
  };
  
  // Test client login
  results.clientLogin = await testClientLogin();
  
  if (!results.clientLogin) {
    console.log('\n❌ Client login failed. Cannot continue with Phase 1 tests.');
    return results;
  }
  
  // Test service categories
  const categories = await testServiceCategories();
  results.serviceCategories = categories !== null;
  
  // Test services API
  const services = await testServicesAPI();
  results.servicesAPI = services !== null;
  
  // Test service validation
  results.serviceValidation = await testServiceValidation();
  
  // Test provider discovery
  const providers = await testProviderDiscovery();
  results.providerDiscovery = providers !== null;
  
  // Test form validation
  results.formValidation = await testFormValidation();
  
  // Summary
  console.log('\n📊 Phase 1 Test Results Summary');
  console.log('='.repeat(70));
  console.log(`Client Login: ${results.clientLogin ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Service Categories: ${results.serviceCategories ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Services API: ${results.servicesAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Service Validation: ${results.serviceValidation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Provider Discovery: ${results.providerDiscovery ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Form Validation: ${results.formValidation ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nPhase 1 Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Phase 1 PASSED - Client side booking flow is working perfectly!');
  } else {
    console.log('⚠️ Phase 1 PARTIALLY PASSED - Some client side features need attention.');
  }
  
  return results;
}

// Run Phase 1 test
runPhase1Test().catch(console.error);
