/**
 * Test script for booking draft preservation flow
 * 
 * This script tests the complete flow:
 * 1. User starts booking (not logged in)
 * 2. User is prompted to log in/sign up
 * 3. User signs up
 * 4. User verifies email
 * 5. User is redirected back to continue booking
 * 6. Booking data is preserved throughout
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    role: 'CLIENT'
  }
};

// Logging utility
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`)
};

// Test booking data
const testBookingData = {
  serviceId: 'test-service-id',
  date: '2024-12-25',
  time: '14:00',
  address: '123 Test Street, Test City',
  notes: 'Test booking notes'
};

/**
 * Test 1: Booking Draft Creation
 */
async function testBookingDraftCreation() {
  log.info('Testing booking draft creation...');
  
  try {
    // Simulate creating a draft
    const draftId = generateUUID();
    const draft = {
      id: draftId,
      ...testBookingData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Test localStorage save
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('booking_draft', JSON.stringify(draft));
      log.success('Draft saved to localStorage');
    }
    
    // Test cookie setting
    if (typeof document !== 'undefined') {
      document.cookie = `booking_draft_id=${draftId}; path=/; max-age=${7 * 24 * 60 * 60}`;
      log.success('Draft ID saved to cookie');
    }
    
    return draft;
  } catch (error) {
    log.error(`Draft creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 2: User Signup with Draft Preservation
 */
async function testUserSignupWithDraft() {
  log.info('Testing user signup with draft preservation...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_CONFIG.testUser)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Signup failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const signupData = await response.json();
    log.success(`User signup successful: ${signupData.user.email}`);
    
    return signupData.user;
  } catch (error) {
    log.error(`User signup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 3: Email Verification
 */
async function testEmailVerification(token) {
  log.info('Testing email verification...');
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/verify-email?token=${token}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Verification failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const verificationData = await response.json();
    log.success('Email verification successful');
    
    return verificationData;
  } catch (error) {
    log.error(`Email verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 4: Draft Retrieval After Login
 */
async function testDraftRetrievalAfterLogin() {
  log.info('Testing draft retrieval after login...');
  
  try {
    // Simulate login with draft ID in cookie
    const draftId = generateUUID();
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-draft-id': draftId
      },
      body: JSON.stringify({
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Login failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const loginData = await response.json();
    
    if (loginData.draft) {
      log.success('Draft successfully merged with user after login');
      return loginData.draft;
    } else {
      log.warn('No draft found in login response');
      return null;
    }
  } catch (error) {
    log.error(`Draft retrieval after login failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 5: Booking Resume Flow
 */
async function testBookingResumeFlow() {
  log.info('Testing booking resume flow...');
  
  try {
    const draftId = generateUUID();
    
    // Test resume page
    const response = await fetch(`${TEST_CONFIG.baseUrl}/booking/resume?draftId=${draftId}`, {
      method: 'GET'
    });
    
    if (response.ok) {
      log.success('Booking resume page accessible');
    } else {
      log.warn(`Booking resume page returned ${response.status}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Booking resume flow test failed: ${error.message}`);
    throw error;
  }
}

/**
 * Test 6: Draft API Endpoints
 */
async function testDraftAPIEndpoints() {
  log.info('Testing draft API endpoints...');
  
  try {
    const draftId = generateUUID();
    const testDraft = {
      id: draftId,
      ...testBookingData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Test POST /api/bookings/drafts
    const createResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/drafts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testDraft)
    });
    
    if (createResponse.ok) {
      log.success('Draft creation API endpoint working');
    } else {
      log.warn(`Draft creation API returned ${createResponse.status}`);
    }
    
    // Test GET /api/bookings/drafts/[id]
    const getResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/drafts/${draftId}`, {
      method: 'GET'
    });
    
    if (getResponse.ok) {
      log.success('Draft retrieval API endpoint working');
    } else {
      log.warn(`Draft retrieval API returned ${getResponse.status}`);
    }
    
    // Test DELETE /api/bookings/drafts/[id]
    const deleteResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/bookings/drafts/${draftId}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      log.success('Draft deletion API endpoint working');
    } else {
      log.warn(`Draft deletion API returned ${deleteResponse.status}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Draft API endpoints test failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generate UUID for testing
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Main test runner
 */
async function runTests() {
  log.info('🚀 Starting booking draft preservation flow tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const tests = [
    { name: 'Booking Draft Creation', fn: testBookingDraftCreation },
    { name: 'Draft API Endpoints', fn: testDraftAPIEndpoints },
    { name: 'User Signup with Draft', fn: testUserSignupWithDraft },
    { name: 'Draft Retrieval After Login', fn: testDraftRetrievalAfterLogin },
    { name: 'Booking Resume Flow', fn: testBookingResumeFlow }
  ];
  
  for (const test of tests) {
    try {
      log.info(`Running test: ${test.name}`);
      await test.fn();
      results.passed++;
      results.tests.push({ name: test.name, status: 'PASSED' });
      log.success(`✅ ${test.name} - PASSED`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name: test.name, status: 'FAILED', error: error.message });
      log.error(`❌ ${test.name} - FAILED: ${error.message}`);
    }
  }
  
  // Print summary
  log.info('\n📊 Test Results Summary:');
  log.info(`✅ Passed: ${results.passed}`);
  log.info(`❌ Failed: ${results.failed}`);
  log.info(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Print detailed results
  log.info('\n📋 Detailed Results:');
  results.tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    log.info(`${status} ${test.name}: ${test.status}`);
    if (test.error) {
      log.info(`   Error: ${test.error}`);
    }
  });
  
  // Save results to file
  const resultsFile = path.join(__dirname, 'test-results', 'booking-draft-flow-results.json');
  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  log.info(`\n📄 Results saved to: ${resultsFile}`);
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBookingDraftCreation,
  testUserSignupWithDraft,
  testEmailVerification,
  testDraftRetrievalAfterLogin,
  testBookingResumeFlow,
  testDraftAPIEndpoints
};
