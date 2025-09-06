#!/usr/bin/env node

/**
 * Provider Onboarding Flow Test Script
 * Tests the complete provider signup and verification flow
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
};

// Test data generators
const generateTestName = () => `Test Provider ${Math.random().toString(36).substring(7)}`;
const generateTestEmail = () => `provider-${Math.random().toString(36).substring(7)}@test.com`;
const generateTestPassword = () => `TestPass${Math.random().toString(36).substring(7)}`;

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = TEST_CONFIG.retries) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: TEST_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(TEST_CONFIG.retryDelay);
    }
  }
};

// Test logging
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`)
};

// Global test state
let globalTestUser = null;
let globalTestToken = null;
let globalTestProvider = null;

// Test 1: Provider Signup
const testProviderSignup = async () => {
  log.info('Testing provider signup...');
  
  const providerData = {
    name: generateTestName(),
    email: generateTestEmail(),
    password: generateTestPassword(),
    role: 'PROVIDER'
  };
  
  log.debug(`Creating provider: ${providerData.email}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(providerData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Provider signup failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  log.debug(`Provider signup response: ${JSON.stringify(data, null, 2)}`);
  
  if (!data.user || data.user.role !== 'PROVIDER') {
    throw new Error('Provider signup did not create user with PROVIDER role');
  }
  
  globalTestUser = data.user;
  log.success(`Provider signup successful: ${providerData.email}`);
  return true;
};

// Test 2: Email Verification
const testEmailVerification = async () => {
  log.info('Testing email verification...');
  
  if (!globalTestUser) {
    throw new Error('No test user available for email verification');
  }
  
  // Get verification token from database (this would need a test endpoint)
  const tokenResponse = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/test-db`);
  
  if (!tokenResponse.ok) {
    throw new Error('Failed to get verification token for testing');
  }
  
  const tokenData = await tokenResponse.json();
  const fullToken = tokenData.existingTokens?.[0]?.fullToken;
  
  if (!fullToken) {
    throw new Error('No verification token found for testing');
  }
  
  globalTestToken = fullToken;
  log.debug(`Using verification token: ${fullToken.substring(0, 8)}...`);
  
  // Verify email
  const verifyResponse = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/auth/verify-email?token=${fullToken}`);
  
  if (!verifyResponse.ok) {
    const errorData = await verifyResponse.json();
    throw new Error(`Email verification failed: ${errorData.error || verifyResponse.statusText}`);
  }
  
  const verifyData = await verifyResponse.json();
  log.debug(`Email verification response: ${JSON.stringify(verifyData, null, 2)}`);
  
  log.success('Email verification successful');
  return true;
};

// Test 3: Provider Onboarding - Draft Save
const testProviderOnboardingDraft = async () => {
  log.info('Testing provider onboarding draft save...');
  
  if (!globalTestUser) {
    throw new Error('No test user available for onboarding');
  }
  
  const onboardingData = {
    businessName: "Test Plumbing Services",
    description: "Professional plumbing services for residential and commercial properties",
    experience: 5,
    hourlyRate: 200,
    location: "Johannesburg",
    selectedServices: ["service1", "service2"], // These would need to be real service IDs
    isDraft: true
  };
  
  log.debug(`Saving draft onboarding data: ${JSON.stringify(onboardingData, null, 2)}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/provider/onboarding`, {
    method: 'POST',
    body: JSON.stringify(onboardingData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Draft save failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  log.debug(`Draft save response: ${JSON.stringify(data, null, 2)}`);
  
  if (!data.isDraft || data.status !== 'INCOMPLETE') {
    throw new Error('Draft save did not set correct status');
  }
  
  log.success('Provider onboarding draft save successful');
  return true;
};

// Test 4: Provider Onboarding - Complete Submission
const testProviderOnboardingComplete = async () => {
  log.info('Testing provider onboarding complete submission...');
  
  if (!globalTestUser) {
    throw new Error('No test user available for onboarding');
  }
  
  const onboardingData = {
    businessName: "Test Plumbing Services",
    description: "Professional plumbing services for residential and commercial properties with over 5 years of experience",
    experience: 5,
    hourlyRate: 200,
    location: "Johannesburg",
    selectedServices: ["service1", "service2"], // These would need to be real service IDs
    isDraft: false
  };
  
  log.debug(`Submitting complete onboarding data: ${JSON.stringify(onboardingData, null, 2)}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/provider/onboarding`, {
    method: 'POST',
    body: JSON.stringify(onboardingData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Complete submission failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  log.debug(`Complete submission response: ${JSON.stringify(data, null, 2)}`);
  
  if (data.isDraft || data.status !== 'PENDING') {
    throw new Error('Complete submission did not set correct status');
  }
  
  globalTestProvider = data;
  log.success('Provider onboarding complete submission successful');
  return true;
};

// Test 5: Admin Review - Approve Provider
const testAdminApproveProvider = async () => {
  log.info('Testing admin approval of provider...');
  
  if (!globalTestProvider) {
    throw new Error('No test provider available for admin approval');
  }
  
  const approvalData = {
    status: 'APPROVED',
    comment: 'Test approval - all documents verified and experience confirmed'
  };
  
  log.debug(`Approving provider with data: ${JSON.stringify(approvalData, null, 2)}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/admin/providers/${globalTestProvider.id}`, {
    method: 'PATCH',
    body: JSON.stringify(approvalData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Admin approval failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  log.debug(`Admin approval response: ${JSON.stringify(data, null, 2)}`);
  
  if (data.status !== 'APPROVED') {
    throw new Error('Admin approval did not set correct status');
  }
  
  log.success('Admin approval successful');
  return true;
};

// Test 6: Provider Status Check
const testProviderStatusCheck = async () => {
  log.info('Testing provider status check...');
  
  if (!globalTestProvider) {
    throw new Error('No test provider available for status check');
  }
  
  // This would need a test endpoint to check provider status
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/test-db`);
  
  if (!response.ok) {
    throw new Error('Failed to check provider status');
  }
  
  const data = await response.json();
  log.debug(`Provider status check response: ${JSON.stringify(data, null, 2)}`);
  
  log.success('Provider status check successful');
  return true;
};

// Test 7: Provider Onboarding Validation
const testProviderOnboardingValidation = async () => {
  log.info('Testing provider onboarding validation...');
  
  if (!globalTestUser) {
    throw new Error('No test user available for validation testing');
  }
  
  // Test incomplete data
  const incompleteData = {
    businessName: "",
    description: "Short",
    experience: -1,
    hourlyRate: 0,
    location: "",
    selectedServices: [],
    isDraft: false
  };
  
  log.debug(`Testing incomplete data validation: ${JSON.stringify(incompleteData, null, 2)}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/provider/onboarding`, {
    method: 'POST',
    body: JSON.stringify(incompleteData)
  });
  
  if (response.ok) {
    throw new Error('Incomplete data should have been rejected');
  }
  
  const errorData = await response.json();
  log.debug(`Validation error response: ${JSON.stringify(errorData, null, 2)}`);
  
  if (!errorData.error) {
    throw new Error('Validation error response missing error message');
  }
  
  log.success('Provider onboarding validation working correctly');
  return true;
};

// Test 8: Provider Onboarding - Rejection Flow
const testProviderRejectionFlow = async () => {
  log.info('Testing provider rejection flow...');
  
  if (!globalTestProvider) {
    throw new Error('No test provider available for rejection testing');
  }
  
  const rejectionData = {
    status: 'REJECTED',
    comment: 'Test rejection - insufficient experience for the requested services'
  };
  
  log.debug(`Rejecting provider with data: ${JSON.stringify(rejectionData, null, 2)}`);
  
  const response = await fetchWithRetry(`${TEST_CONFIG.baseUrl}/api/admin/providers/${globalTestProvider.id}`, {
    method: 'PATCH',
    body: JSON.stringify(rejectionData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Provider rejection failed: ${errorData.error || response.statusText}`);
  }
  
  const data = await response.json();
  log.debug(`Provider rejection response: ${JSON.stringify(data, null, 2)}`);
  
  if (data.status !== 'REJECTED') {
    throw new Error('Provider rejection did not set correct status');
  }
  
  log.success('Provider rejection flow successful');
  return true;
};

// Main test runner
const runTests = async () => {
  log.info('🚀 Starting Provider Onboarding Flow Tests');
  log.info('=' .repeat(50));
  
  const tests = [
    { name: 'Provider Signup', fn: testProviderSignup },
    { name: 'Email Verification', fn: testEmailVerification },
    { name: 'Provider Onboarding Draft', fn: testProviderOnboardingDraft },
    { name: 'Provider Onboarding Complete', fn: testProviderOnboardingComplete },
    { name: 'Admin Approval', fn: testAdminApproveProvider },
    { name: 'Provider Status Check', fn: testProviderStatusCheck },
    { name: 'Onboarding Validation', fn: testProviderOnboardingValidation },
    { name: 'Provider Rejection Flow', fn: testProviderRejectionFlow }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      log.info(`\n📋 Running: ${test.name}`);
      await test.fn();
      passed++;
    } catch (error) {
      log.error(`${test.name} FAILED: ${error.message}`);
      failed++;
    }
  }
  
  log.info('\n' + '=' .repeat(50));
  log.info('📊 Test Results Summary');
  log.info('=' .repeat(50));
  log.success(`✅ Passed: ${passed}`);
  if (failed > 0) {
    log.error(`❌ Failed: ${failed}`);
  }
  log.info(`📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    log.success('🎉 All tests passed! Provider onboarding flow is working correctly.');
  } else {
    log.error('💥 Some tests failed. Please review the implementation.');
    process.exit(1);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testProviderSignup,
  testEmailVerification,
  testProviderOnboardingDraft,
  testProviderOnboardingComplete,
  testAdminApproveProvider,
  testProviderStatusCheck,
  testProviderOnboardingValidation,
  testProviderRejectionFlow
};
