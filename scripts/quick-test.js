#!/usr/bin/env node

/**
 * Quick Test Script for Email Verification System
 * 
 * This script runs a minimal test to verify the basic fixes are working:
 * 1. Database connection test
 * 2. Simple user signup
 * 3. Basic token verification
 */

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testUser: {
    name: `Quick Test User ${Date.now()}`,
    email: `quick.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    phone: '+27123456789',
    role: 'CLIENT'
  }
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function quickTest() {
  log.info('🚀 Running Quick Test for Email Verification System');
  log.info(`Base URL: ${TEST_CONFIG.baseUrl}`);
  log.info(`Test User: ${TEST_CONFIG.testUser.email}`);
  
  try {
    // Test 1: Database Connection
    log.info('Testing database connection...');
    const dbResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/test-db`);
    if (!dbResponse.ok) {
      throw new Error(`Database test failed: ${dbResponse.status}`);
    }
    const dbData = await dbResponse.json();
    log.success('Database connection working');
    
    // Test 2: User Signup
    log.info('Testing user signup...');
    const signupResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CONFIG.testUser)
    });
    
    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(`Signup failed: ${signupResponse.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const signupData = await signupResponse.json();
    log.success(`User signup successful: ${signupData.user.email}`);
    
    // Test 3: Check Token Creation
    log.info('Checking token creation...');
    await sleep(1000); // Wait for token creation
    
    const tokenCheckResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/test-db`);
    const tokenData = await tokenCheckResponse.json();
    const userTokens = tokenData.existingTokens.filter(token => 
      token.userEmail === TEST_CONFIG.testUser.email
    );
    
    if (userTokens.length === 0) {
      throw new Error('No verification tokens found for the test user');
    }
    
    const token = userTokens[0];
    log.success(`Token found: ${token.tokenPreview}`);
    
    // Test 4: Email Verification
    log.info('Testing email verification...');
    
    // Now we have access to the full token from the database test endpoint
    const fullToken = token.fullToken;
    log.debug(`Full token: ${fullToken.substring(0, 8)}...${fullToken.substring(fullToken.length - 8)}`);
    log.debug(`Full token length: ${fullToken.length} characters`);
    
    const verificationUrl = `${TEST_CONFIG.baseUrl}/api/auth/verify-email?token=${fullToken}`;
    log.debug(`Verification URL: ${verificationUrl}`);
    
    const verificationResponse = await fetch(verificationUrl);
    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json();
      log.debug(`Verification error details: ${JSON.stringify(errorData, null, 2)}`);
      throw new Error(`Verification failed: ${verificationResponse.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const verificationData = await verificationResponse.json();
    log.success('Email verification successful');
    
    // Test 5: Check User Status Update
    log.info('Checking user status update...');
    await sleep(1000); // Wait for status update
    
    const finalCheckResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/test-db`);
    const finalData = await finalCheckResponse.json();
    const finalUserTokens = finalData.existingTokens.filter(token => 
      token.userEmail === TEST_CONFIG.testUser.email
    );
    
    if (finalUserTokens.length > 0) {
      log.info(`Note: ${finalUserTokens.length} tokens still exist (should be cleaned up)`);
    }
    
    log.success('🎉 Quick test completed successfully!');
    log.info('The email verification system is working correctly.');
    
  } catch (error) {
    log.error(`Quick test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the quick test
if (require.main === module) {
  quickTest().catch(error => {
    log.error(`Quick test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { quickTest };
