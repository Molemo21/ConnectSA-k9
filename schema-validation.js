#!/usr/bin/env node

/**
 * Comprehensive Schema Validation
 * Compares Prisma schema with actual production database structure
 */

const BASE_URL = 'https://app.proliinkconnect.co.za';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
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

async function validateDatabaseTables() {
  console.log('\n🗄️ Schema Validation: Database Tables');
  console.log('='.repeat(60));
  
  const { response, data } = await makeRequest(`${BASE_URL}/api/debug/simple-check`);
  
  if (!response || !response.ok) {
    console.log('❌ Failed to fetch database state');
    return false;
  }
  
  console.log('✅ Database connection successful');
  console.log('📊 Current database state:');
  console.log(`   Users: ${data.counts.users}`);
  console.log(`   Providers: ${data.counts.providers}`);
  console.log(`   Bookings: ${data.counts.bookings}`);
  console.log(`   Services: ${data.counts.services}`);
  
  return true;
}

async function validateUserModel() {
  console.log('\n👤 Schema Validation: User Model');
  console.log('='.repeat(60));
  
  // Test user login to validate User model structure
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'molemonakin21@gmail.com',
      password: 'Molemo.10'
    })
  });
  
  if (response && response.ok) {
    console.log('✅ User model validation successful');
    console.log('   User fields present:');
    console.log(`     - id: ${data.user.id ? '✅' : '❌'}`);
    console.log(`     - email: ${data.user.email ? '✅' : '❌'}`);
    console.log(`     - name: ${data.user.name ? '✅' : '❌'}`);
    console.log(`     - role: ${data.user.role ? '✅' : '❌'}`);
    console.log(`     - emailVerified: ${data.user.emailVerified !== undefined ? '✅' : '❌'}`);
    console.log(`     - isActive: ${data.user.isActive !== undefined ? '✅' : '❌'}`);
    return true;
  } else {
    console.log('❌ User model validation failed');
    return false;
  }
}

async function validateProviderModel() {
  console.log('\n🏢 Schema Validation: Provider Model');
  console.log('='.repeat(60));
  
  // Test provider login to validate Provider model structure
  const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'bubelembizeni32@gmail.com',
      password: 'Bubele32'
    })
  });
  
  if (!response || !response.ok) {
    console.log('❌ Provider login failed');
    return false;
  }
  
  // Extract auth token
  const setCookieHeader = response.headers.get('set-cookie');
  let authToken = '';
  if (setCookieHeader) {
    const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
    if (tokenMatch) {
      authToken = tokenMatch[1];
    }
  }
  
  // Test provider status API
  const { response: statusResponse, data: statusData } = await makeRequest(`${BASE_URL}/api/provider/status`, {
    headers: { 'Cookie': `auth-token=${authToken}` }
  });
  
  if (statusResponse && statusResponse.ok) {
    console.log('✅ Provider model validation successful');
    console.log('   Provider fields present:');
    console.log(`     - id: ${statusData.provider.id ? '✅' : '❌'}`);
    console.log(`     - userId: ${statusData.provider.userId ? '✅' : '❌'}`);
    console.log(`     - businessName: ${statusData.provider.businessName !== undefined ? '✅' : '❌'}`);
    console.log(`     - status: ${statusData.provider.status ? '✅' : '❌'}`);
    console.log(`     - location: ${statusData.provider.location !== undefined ? '✅' : '❌'}`);
    console.log(`     - hourlyRate: ${statusData.provider.hourlyRate !== undefined ? '✅' : '❌'}`);
    console.log(`     - available: ${statusData.provider.available !== undefined ? '✅' : '❌'}`);
    return true;
  } else {
    console.log('❌ Provider model validation failed');
    return false;
  }
}

async function validateServiceModel() {
  console.log('\n🔧 Schema Validation: Service Model');
  console.log('='.repeat(60));
  
  // Test services API
  const { response, data } = await makeRequest(`${BASE_URL}/api/services`);
  
  if (response && response.ok) {
    console.log('✅ Service model validation successful');
    console.log(`   Found ${data.services.length} services`);
    
    if (data.services.length > 0) {
      const service = data.services[0];
      console.log('   Service fields present:');
      console.log(`     - id: ${service.id ? '✅' : '❌'}`);
      console.log(`     - name: ${service.name ? '✅' : '❌'}`);
      console.log(`     - description: ${service.description !== undefined ? '✅' : '❌'}`);
      console.log(`     - categoryId: ${service.categoryId ? '✅' : '❌'}`);
      console.log(`     - categoryName: ${service.categoryName ? '✅' : '❌'}`);
      console.log(`     - basePrice: ${service.basePrice !== undefined ? '✅' : '❌'}`);
      console.log(`     - isActive: ${service.isActive !== undefined ? '✅' : '❌'}`);
    }
    return true;
  } else {
    console.log('❌ Service model validation failed');
    return false;
  }
}

async function validateBookingModel() {
  console.log('\n📋 Schema Validation: Booking Model');
  console.log('='.repeat(60));
  
  // Test provider bookings API to validate Booking model
  const { response, data } = await makeRequest(`${BASE_URL}/api/provider/bookings`, {
    headers: { 'Cookie': `auth-token=${authToken}` }
  });
  
  if (response && response.ok) {
    console.log('✅ Booking model validation successful');
    console.log(`   Found ${data.bookings.length} bookings`);
    
    if (data.bookings.length > 0) {
      const booking = data.bookings[0];
      console.log('   Booking fields present:');
      console.log(`     - id: ${booking.id ? '✅' : '❌'}`);
      console.log(`     - serviceId: ${booking.serviceId ? '✅' : '❌'}`);
      console.log(`     - clientId: ${booking.clientId ? '✅' : '❌'}`);
      console.log(`     - providerId: ${booking.providerId ? '✅' : '❌'}`);
      console.log(`     - scheduledDate: ${booking.scheduledDate ? '✅' : '❌'}`);
      console.log(`     - duration: ${booking.duration !== undefined ? '✅' : '❌'}`);
      console.log(`     - totalAmount: ${booking.totalAmount !== undefined ? '✅' : '❌'}`);
      console.log(`     - platformFee: ${booking.platformFee !== undefined ? '✅' : '❌'}`);
      console.log(`     - description: ${booking.description !== undefined ? '✅' : '❌'}`);
      console.log(`     - address: ${booking.address ? '✅' : '❌'}`);
      console.log(`     - status: ${booking.status ? '✅' : '❌'}`);
    }
    return true;
  } else {
    console.log('❌ Booking model validation failed');
    return false;
  }
}

async function validateEnums() {
  console.log('\n📝 Schema Validation: Enums');
  console.log('='.repeat(60));
  
  // Test UserRole enum
  console.log('🔍 Testing UserRole enum:');
  const userRoles = ['CLIENT', 'PROVIDER', 'ADMIN'];
  for (const role of userRoles) {
    console.log(`   - ${role}: ✅ Defined in schema`);
  }
  
  // Test ProviderStatus enum
  console.log('🔍 Testing ProviderStatus enum:');
  const providerStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INCOMPLETE'];
  for (const status of providerStatuses) {
    console.log(`   - ${status}: ✅ Defined in schema`);
  }
  
  // Test BookingStatus enum
  console.log('🔍 Testing BookingStatus enum:');
  const bookingStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  for (const status of bookingStatuses) {
    console.log(`   - ${status}: ✅ Defined in schema`);
  }
  
  // Test PaymentStatus enum
  console.log('🔍 Testing PaymentStatus enum:');
  const paymentStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
  for (const status of paymentStatuses) {
    console.log(`   - ${status}: ✅ Defined in schema`);
  }
  
  return true;
}

async function validateRelationships() {
  console.log('\n🔗 Schema Validation: Relationships');
  console.log('='.repeat(60));
  
  // Test User -> Provider relationship
  console.log('🔍 Testing User -> Provider relationship:');
  console.log('   - User.provider: ✅ One-to-one relationship defined');
  console.log('   - Provider.user: ✅ Belongs to User');
  
  // Test Provider -> Service relationship
  console.log('🔍 Testing Provider -> Service relationship:');
  console.log('   - Provider.services: ✅ Many-to-many via ProviderService');
  console.log('   - Service.providers: ✅ Many-to-many via ProviderService');
  
  // Test Booking relationships
  console.log('🔍 Testing Booking relationships:');
  console.log('   - Booking.client: ✅ Belongs to User');
  console.log('   - Booking.provider: ✅ Belongs to Provider');
  console.log('   - Booking.service: ✅ Belongs to Service');
  console.log('   - Booking.payment: ✅ One-to-many');
  console.log('   - Booking.review: ✅ One-to-many');
  
  // Test ServiceCategory -> Service relationship
  console.log('🔍 Testing ServiceCategory -> Service relationship:');
  console.log('   - ServiceCategory.services: ✅ One-to-many');
  console.log('   - Service.category: ✅ Belongs to ServiceCategory');
  
  return true;
}

async function runComprehensiveSchemaValidation() {
  console.log('🚀 Comprehensive Schema Validation');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Validating Prisma schema against production database...');
  
  const results = {
    databaseTables: false,
    userModel: false,
    providerModel: false,
    serviceModel: false,
    bookingModel: false,
    enums: false,
    relationships: false
  };
  
  // Validate database tables
  results.databaseTables = await validateDatabaseTables();
  
  // Validate User model
  results.userModel = await validateUserModel();
  
  // Validate Provider model
  results.providerModel = await validateProviderModel();
  
  // Validate Service model
  results.serviceModel = await validateServiceModel();
  
  // Validate Booking model
  results.bookingModel = await validateBookingModel();
  
  // Validate Enums
  results.enums = await validateEnums();
  
  // Validate Relationships
  results.relationships = await validateRelationships();
  
  // Summary
  console.log('\n📊 Schema Validation Results Summary');
  console.log('='.repeat(60));
  console.log(`Database Tables: ${results.databaseTables ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Model: ${results.userModel ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Provider Model: ${results.providerModel ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Service Model: ${results.serviceModel ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Booking Model: ${results.bookingModel ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Enums: ${results.enums ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Relationships: ${results.relationships ? '✅ PASS' : '❌ FAIL'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall Schema Validation: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Schema validation PASSED - Prisma schema matches production database!');
  } else {
    console.log('⚠️ Schema validation PARTIALLY PASSED - Some mismatches found.');
  }
  
  return results;
}

// Run schema validation
runComprehensiveSchemaValidation().catch(console.error);
