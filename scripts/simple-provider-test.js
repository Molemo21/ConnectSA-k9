#!/usr/bin/env node

/**
 * Simple Provider Test Script
 * Tests basic provider signup functionality
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000
};

const generateTestEmail = () => `provider-${Math.random().toString(36).substring(7)}@test.com`;

const testProviderSignup = async () => {
  console.log('🧪 Testing provider signup...');
  
  const providerData = {
    name: "Test Provider",
    email: generateTestEmail(),
    password: "testpass123",
    role: "PROVIDER"
  };
  
  console.log(`📧 Creating provider: ${providerData.email}`);
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerData),
      timeout: TEST_CONFIG.timeout
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData);
      throw new Error(`Signup failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Signup successful:', data);
    
    if (!data.user || data.user.role !== 'PROVIDER') {
      throw new Error('User role is not PROVIDER');
    }
    
    console.log('✅ Provider signup test passed!');
    return data.user;
    
  } catch (error) {
    console.error('❌ Provider signup test failed:', error.message);
    throw error;
  }
};

const testProviderOnboarding = async (user) => {
  console.log('🧪 Testing provider onboarding...');
  
  const onboardingData = {
    businessName: "Test Plumbing Services",
    description: "Professional plumbing services for residential and commercial properties with over 5 years of experience",
    experience: 5,
    hourlyRate: 200,
    location: "Johannesburg",
    selectedServices: ["service1", "service2"],
    isDraft: false
  };
  
  console.log('📝 Submitting onboarding data...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/provider/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(onboardingData),
      timeout: TEST_CONFIG.timeout
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData);
      throw new Error(`Onboarding failed: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Onboarding successful:', data);
    
    console.log('✅ Provider onboarding test passed!');
    return data;
    
  } catch (error) {
    console.error('❌ Provider onboarding test failed:', error.message);
    throw error;
  }
};

const runSimpleTest = async () => {
  console.log('🚀 Starting Simple Provider Test');
  console.log('=' .repeat(50));
  
  try {
    const user = await testProviderSignup();
    await testProviderOnboarding(user);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.log('\n' + '=' .repeat(50));
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
};

// Run test if this script is executed directly
if (require.main === module) {
  runSimpleTest();
}

module.exports = { runSimpleTest, testProviderSignup, testProviderOnboarding };
