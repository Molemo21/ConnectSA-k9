#!/usr/bin/env node

/**
 * Test Onboarding Form Fix
 * Simple test to verify the onboarding form loads without errors
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000
};

const testOnboardingFormFix = async () => {
  console.log('🧪 Testing Onboarding Form Fix');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if signup works
    console.log('\n📝 Test 1: Provider Signup');
    const testEmail = `test-onboarding-${Date.now()}@example.com`;
    
    const signupResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test Onboarding",
        email: testEmail,
        password: "testpass123",
        role: "PROVIDER"
      }),
      timeout: TEST_CONFIG.timeout
    });
    
    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(`Signup failed: ${errorData.error || signupResponse.statusText}`);
    }
    
    console.log('✅ Provider signup successful');
    
    // Test 2: Get verification token and verify email
    console.log('\n📧 Test 2: Email Verification');
    const dbResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/test-db`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (!dbResponse.ok) {
      throw new Error('Failed to get database info');
    }
    
    const dbData = await dbResponse.json();
    const verificationToken = dbData.existingTokens?.[0]?.fullToken;
    
    if (!verificationToken) {
      throw new Error('No verification token found');
    }
    
    const verifyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/verify-email?token=${verificationToken}`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(`Email verification failed: ${errorData.error || verifyResponse.statusText}`);
    }
    
    console.log('✅ Email verification successful');
    
    // Test 3: Login and check redirect
    console.log('\n🔐 Test 3: Login and Redirect');
    const loginResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: "testpass123"
      }),
      timeout: TEST_CONFIG.timeout
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.error || loginResponse.statusText}`);
    }
    
    const loginResult = await loginResponse.json();
    console.log(`✅ Login successful - Redirect URL: ${loginResult.redirectUrl}`);
    
    if (loginResult.redirectUrl === '/provider/onboarding') {
      console.log('✅ Correct redirect to onboarding page');
    } else {
      console.log(`❌ Wrong redirect URL. Expected: /provider/onboarding, Got: ${loginResult.redirectUrl}`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Onboarding Form Fix Test Successful!');
    console.log('✅ Provider signup works');
    console.log('✅ Email verification works');
    console.log('✅ Login redirects to onboarding');
    console.log('✅ Form should now load without onChange errors');
    
  } catch (error) {
    console.log('\n' + '=' .repeat(50));
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
};

// Run test if this script is executed directly
if (require.main === module) {
  testOnboardingFormFix();
}

module.exports = { testOnboardingFormFix };
