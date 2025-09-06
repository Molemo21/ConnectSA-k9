#!/usr/bin/env node

/**
 * Test Data Setup Script for Admin User Management Tests
 * 
 * This script creates the necessary test data for running the admin user management tests.
 * It ensures we have users of all types (CLIENT, PROVIDER, ADMIN) with proper data.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data configuration
const TEST_DATA = {
  users: [
    {
      name: 'Admin Test User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'ADMIN',
      phone: '+27123456789',
      emailVerified: true
    },
    {
      name: 'Provider Test User',
      email: 'provider@test.com',
      password: 'provider123',
      role: 'PROVIDER',
      phone: '+27123456790',
      emailVerified: true
    },
    {
      name: 'Client Test User',
      email: 'client@test.com',
      password: 'client123',
      role: 'CLIENT',
      phone: '+27123456791',
      emailVerified: true
    },
    {
      name: 'Another Client',
      email: 'client2@test.com',
      password: 'client123',
      role: 'CLIENT',
      phone: '+27123456792',
      emailVerified: false
    },
    {
      name: 'Another Provider',
      email: 'provider2@test.com',
      password: 'provider123',
      role: 'PROVIDER',
      phone: '+27123456793',
      emailVerified: true
    }
  ],
  services: [
    {
      name: 'Plumbing',
      description: 'General plumbing services',
      category: 'Home Services',
      basePrice: 150.00
    },
    {
      name: 'Electrical',
      description: 'Electrical installation and repair',
      category: 'Home Services', 
      basePrice: 200.00
    },
    {
      name: 'Cleaning',
      description: 'House and office cleaning',
      category: 'Cleaning',
      basePrice: 100.00
    }
  ]
};

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function createUser(userData) {
  console.log(`Creating user: ${userData.name} (${userData.email})`);
  
  const response = await makeRequest('POST', '/auth/signup', {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    phone: userData.phone
  });
  
  if (response.success) {
    console.log(`✅ Created user: ${userData.name}`);
    return response.data;
  } else if (response.status === 409) {
    console.log(`⚠️  User already exists: ${userData.name}`);
    return { id: 'existing', email: userData.email };
  } else {
    console.log(`❌ Failed to create user ${userData.name}:`, response.error);
    return null;
  }
}

async function createProviderProfile(userId, userData) {
  if (userData.role !== 'PROVIDER') return null;
  
  console.log(`Creating provider profile for: ${userData.name}`);
  
  // First, we need to get the user's actual ID if they already existed
  let actualUserId = userId;
  if (userId === 'existing') {
    // Try to find the user by email
    const findResponse = await makeRequest('GET', `/admin/users?search=${userData.email}`);
    if (findResponse.success && findResponse.data.users.length > 0) {
      actualUserId = findResponse.data.users[0].id;
    } else {
      console.log(`❌ Could not find existing user: ${userData.email}`);
      return null;
    }
  }
  
  const providerData = {
    userId: actualUserId,
    businessName: `${userData.name}'s Business`,
    description: `Professional ${userData.name.toLowerCase()} services`,
    experience: Math.floor(Math.random() * 10) + 1,
    hourlyRate: Math.floor(Math.random() * 200) + 100,
    location: 'Cape Town, South Africa',
    status: Math.random() > 0.5 ? 'APPROVED' : 'PENDING'
  };
  
  const response = await makeRequest('POST', '/provider/onboarding', providerData);
  
  if (response.success) {
    console.log(`✅ Created provider profile for: ${userData.name}`);
    return response.data;
  } else {
    console.log(`❌ Failed to create provider profile for ${userData.name}:`, response.error);
    return null;
  }
}

async function createServices() {
  console.log('Creating test services...');
  
  for (const serviceData of TEST_DATA.services) {
    console.log(`Creating service: ${serviceData.name}`);
    
    const response = await makeRequest('POST', '/admin/services', serviceData);
    
    if (response.success) {
      console.log(`✅ Created service: ${serviceData.name}`);
    } else if (response.status === 409) {
      console.log(`⚠️  Service already exists: ${serviceData.name}`);
    } else {
      console.log(`❌ Failed to create service ${serviceData.name}:`, response.error);
    }
  }
}

async function createTestBookings() {
  console.log('Creating test bookings...');
  
  // Get users and services
  const usersResponse = await makeRequest('GET', '/admin/users');
  const servicesResponse = await makeRequest('GET', '/admin/services');
  
  if (!usersResponse.success || !servicesResponse.success) {
    console.log('❌ Could not fetch users or services for booking creation');
    return;
  }
  
  const users = usersResponse.data.users;
  const services = servicesResponse.data.services || [];
  
  if (users.length < 2 || services.length === 0) {
    console.log('⚠️  Not enough users or services to create bookings');
    return;
  }
  
  const clients = users.filter(u => u.role === 'CLIENT');
  const providers = users.filter(u => u.role === 'PROVIDER');
  
  if (clients.length === 0 || providers.length === 0) {
    console.log('⚠️  No clients or providers found for booking creation');
    return;
  }
  
  // Create a few test bookings
  for (let i = 0; i < Math.min(3, clients.length); i++) {
    const client = clients[i];
    const provider = providers[i % providers.length];
    const service = services[i % services.length];
    
    const bookingData = {
      clientId: client.id,
      providerId: provider.provider?.id || provider.id,
      serviceId: service.id,
      scheduledDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      duration: 2,
      totalAmount: service.basePrice * 2,
      platformFee: service.basePrice * 2 * 0.1,
      description: `Test booking ${i + 1}`,
      address: '123 Test Street, Cape Town',
      status: ['PENDING', 'CONFIRMED', 'COMPLETED'][i % 3]
    };
    
    console.log(`Creating booking for ${client.name} with ${provider.name}`);
    
    const response = await makeRequest('POST', '/bookings', bookingData);
    
    if (response.success) {
      console.log(`✅ Created booking ${i + 1}`);
    } else {
      console.log(`❌ Failed to create booking ${i + 1}:`, response.error);
    }
  }
}

async function setupTestData() {
  console.log('🚀 Setting up test data for Admin User Management Tests');
  console.log(`📍 Target: ${BASE_URL}`);
  
  try {
    // Create test users
    console.log('\n📝 Creating test users...');
    const createdUsers = [];
    
    for (const userData of TEST_DATA.users) {
      const user = await createUser(userData);
      if (user) {
        createdUsers.push({ ...userData, id: user.id });
      }
    }
    
    // Create provider profiles
    console.log('\n🏢 Creating provider profiles...');
    for (const userData of createdUsers) {
      if (userData.role === 'PROVIDER') {
        await createProviderProfile(userData.id, userData);
      }
    }
    
    // Create services
    console.log('\n🔧 Creating test services...');
    await createServices();
    
    // Create test bookings
    console.log('\n📅 Creating test bookings...');
    await createTestBookings();
    
    // Save test data for use in tests
    const testDataFile = path.join(__dirname, 'test-data.json');
    fs.writeFileSync(testDataFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      users: createdUsers,
      services: TEST_DATA.services
    }, null, 2));
    
    console.log('\n✅ Test data setup completed successfully!');
    console.log(`📄 Test data saved to: ${testDataFile}`);
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestData();
}

module.exports = { setupTestData, TEST_DATA };
