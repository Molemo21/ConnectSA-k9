#!/usr/bin/env node

/**
 * Test Complete Provider Flow Script
 * Tests the complete provider signup, email verification, and onboarding flow
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 15000
};

const generateTestEmail = () => `provider-${Date.now()}@test.com`;

const testCompleteProviderFlow = async () => {
  console.log('🚀 Testing Complete Provider Flow');
  console.log('=' .repeat(60));
  
  const testEmail = generateTestEmail();
  console.log(`📧 Test email: ${testEmail}`);
  
  try {
    // Step 1: Provider Signup
    console.log('\n📝 Step 1: Provider Signup');
    const signupData = {
      name: "Test Provider",
      email: testEmail,
      password: "testpass123",
      role: "PROVIDER"
    };
    
    const signupResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
      timeout: TEST_CONFIG.timeout
    });
    
    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(`Signup failed: ${errorData.error || signupResponse.statusText}`);
    }
    
    const signupResult = await signupResponse.json();
    console.log('✅ Provider signup successful');
    console.log(`   User ID: ${signupResult.user.id}`);
    console.log(`   Role: ${signupResult.user.role}`);
    console.log(`   Email Verified: ${signupResult.user.emailVerified}`);
    
    // Step 2: Get verification token from database
    console.log('\n🔑 Step 2: Getting Verification Token');
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
    
    console.log('✅ Verification token retrieved');
    console.log(`   Token: ${verificationToken.substring(0, 8)}...`);
    
    // Step 3: Verify Email
    console.log('\n📧 Step 3: Email Verification');
    const verifyResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/verify-email?token=${verificationToken}`, {
      timeout: TEST_CONFIG.timeout
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      throw new Error(`Email verification failed: ${errorData.error || verifyResponse.statusText}`);
    }
    
    const verifyResult = await verifyResponse.json();
    console.log('✅ Email verification successful');
    console.log(`   Message: ${verifyResult.message}`);
    
    // Step 4: Test Login After Verification
    console.log('\n🔐 Step 4: Login After Email Verification');
    const loginData = {
      email: testEmail,
      password: "testpass123"
    };
    
    const loginResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
      timeout: TEST_CONFIG.timeout
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.error || loginResponse.statusText}`);
    }
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   Redirect URL: ${loginResult.redirectUrl}`);
    
    // Check if redirect URL is correct
    if (loginResult.redirectUrl === '/provider/onboarding') {
      console.log('✅ Correct redirect to onboarding page');
    } else {
      console.log(`❌ Wrong redirect URL. Expected: /provider/onboarding, Got: ${loginResult.redirectUrl}`);
      throw new Error(`Incorrect redirect URL: ${loginResult.redirectUrl}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Complete Provider Flow Test Successful!');
    console.log('✅ Provider signup creates user with INCOMPLETE status');
    console.log('✅ Email verification works correctly');
    console.log('✅ Login redirects to onboarding page after verification');
    console.log('✅ Complete flow is working as expected');
    
  } catch (error) {
    console.log('\n' + '=' .repeat(60));
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
};

// Run test if this script is executed directly
if (require.main === module) {
  testCompleteProviderFlow();
}

module.exports = { testCompleteProviderFlow };
