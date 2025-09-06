#!/usr/bin/env node

/**
 * API-Only Test Script for Admin Dashboard User Management System
 * 
 * This script tests only the API endpoints without frontend automation.
 * Useful for environments where Puppeteer is not available or for CI/CD pipelines.
 */

const axios = require('axios');

// Import the main test functions
const { 
  setupTestData, 
  testUserListAPI, 
  testUserDetailsAPI, 
  testUserActionsAPI, 
  testAuditLogsAPI,
  testSecurityAndSafety,
  testEmailNotifications,
  logTest,
  logSection,
  testResults
} = require('./test-admin-user-management.js');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  provider: {
    email: 'provider@test.com',
    password: 'provider123',
    role: 'PROVIDER'
  },
  client: {
    email: 'client@test.com',
    password: 'client123',
    role: 'CLIENT'
  }
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

async function loginUser(email, password) {
  const response = await makeRequest('POST', '/auth/login', {
    email,
    password
  });
  
  if (response.success && response.data.token) {
    return response.data.token;
  }
  return null;
}

// API-only test functions
async function testAPIEndpoints() {
  logSection('API TESTS: Endpoint Validation');
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Admin login for API tests', false, 'Could not obtain admin token');
    return;
  }
  
  // Test all admin endpoints
  const endpoints = [
    { method: 'GET', path: '/admin/users', description: 'List users' },
    { method: 'GET', path: '/admin/users?page=1&limit=10', description: 'List users with pagination' },
    { method: 'GET', path: '/admin/users?role=CLIENT', description: 'Filter users by role' },
    { method: 'GET', path: '/admin/users?search=test', description: 'Search users' },
    { method: 'GET', path: '/admin/audit-logs', description: 'Get audit logs' },
    { method: 'GET', path: '/admin/audit-logs?action=USER_SUSPENDED', description: 'Filter audit logs' }
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint.method, endpoint.path, null, {
      'Authorization': `Bearer ${adminToken}`
    });
    
    logTest(`API ${endpoint.description}`, response.success, 
      response.success ? `Status: ${response.status}` : response.error);
  }
}

async function testUserCRUDOperations() {
  logSection('API TESTS: User CRUD Operations');
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Admin login for CRUD tests', false, 'Could not obtain admin token');
    return;
  }
  
  // Get a test user
  const usersResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!usersResponse.success || !usersResponse.data.users.length) {
    logTest('Get users for CRUD tests', false, 'No users available for testing');
    return;
  }
  
  const testUser = usersResponse.data.users[0];
  
  // Test user details
  const detailsResponse = await makeRequest('GET', `/admin/users/${testUser.id}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Get user details', detailsResponse.success, 
    detailsResponse.success ? `Retrieved details for ${testUser.name}` : detailsResponse.error);
  
  // Test user suspension
  const suspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'suspend',
    reason: 'API test suspension'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Suspend user', suspendResponse.success, 
    suspendResponse.success ? 'User suspended successfully' : suspendResponse.error);
  
  // Test user unsuspension
  const unsuspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'unsuspend',
    reason: 'API test unsuspension'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Unsuspend user', unsuspendResponse.success, 
    unsuspendResponse.success ? 'User unsuspended successfully' : unsuspendResponse.error);
  
  // Test role change
  const roleChangeResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'changeRole',
    newRole: 'PROVIDER',
    reason: 'API test role change'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Change user role', roleChangeResponse.success, 
    roleChangeResponse.success ? 'User role changed successfully' : roleChangeResponse.error);
}

async function testSecurityEndpoints() {
  logSection('API TESTS: Security Validation');
  
  // Test unauthorized access
  const unauthorizedResponse = await makeRequest('GET', '/admin/users');
  logTest('Unauthorized access blocked', !unauthorizedResponse.success && unauthorizedResponse.status === 401, 
    unauthorizedResponse.success ? 'Unauthorized access allowed' : 'Access properly blocked');
  
  // Test with invalid token
  const invalidTokenResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': 'Bearer invalid-token'
  });
  
  logTest('Invalid token access blocked', !invalidTokenResponse.success && invalidTokenResponse.status === 401, 
    invalidTokenResponse.success ? 'Invalid token access allowed' : 'Access properly blocked');
  
  // Test with client token
  const clientToken = await loginUser(TEST_USERS.client.email, TEST_USERS.client.password);
  if (clientToken) {
    const clientAccessResponse = await makeRequest('GET', '/admin/users', null, {
      'Authorization': `Bearer ${clientToken}`
    });
    
    logTest('Client access to admin APIs blocked', !clientAccessResponse.success && clientAccessResponse.status === 401, 
      clientAccessResponse.success ? 'Client access allowed' : 'Access properly blocked');
  }
}

async function testAuditLogging() {
  logSection('API TESTS: Audit Logging');
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Admin login for audit tests', false, 'Could not obtain admin token');
    return;
  }
  
  // Get audit logs
  const auditResponse = await makeRequest('GET', '/admin/audit-logs', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Get audit logs', auditResponse.success, 
    auditResponse.success ? `Found ${auditResponse.data.logs?.length || 0} audit entries` : auditResponse.error);
  
  // Test audit log filtering
  const filteredAuditResponse = await makeRequest('GET', '/admin/audit-logs?action=USER_SUSPENDED', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Filter audit logs by action', filteredAuditResponse.success, 
    filteredAuditResponse.success ? `Found ${filteredAuditResponse.data.logs?.length || 0} suspension entries` : filteredAuditResponse.error);
  
  // Test audit log pagination
  const paginatedAuditResponse = await makeRequest('GET', '/admin/audit-logs?page=1&limit=5', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Audit logs pagination', paginatedAuditResponse.success, 
    paginatedAuditResponse.success ? 'Pagination working correctly' : paginatedAuditResponse.error);
}

async function testDataValidation() {
  logSection('API TESTS: Data Validation');
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Admin login for validation tests', false, 'Could not obtain admin token');
    return;
  }
  
  // Get a test user
  const usersResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (!usersResponse.success || !usersResponse.data.users.length) {
    logTest('Get users for validation tests', false, 'No users available for testing');
    return;
  }
  
  const testUser = usersResponse.data.users[0];
  
  // Test invalid action
  const invalidActionResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'invalid_action',
    reason: 'Test invalid action'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Invalid action rejected', !invalidActionResponse.success && invalidActionResponse.status === 400, 
    invalidActionResponse.success ? 'Invalid action accepted' : 'Invalid action properly rejected');
  
  // Test invalid role
  const invalidRoleResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'changeRole',
    newRole: 'INVALID_ROLE',
    reason: 'Test invalid role'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Invalid role rejected', !invalidRoleResponse.success && invalidRoleResponse.status === 400, 
    invalidRoleResponse.success ? 'Invalid role accepted' : 'Invalid role properly rejected');
  
  // Test non-existent user
  const notFoundResponse = await makeRequest('GET', '/admin/users/non-existent-id', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Non-existent user returns 404', !notFoundResponse.success && notFoundResponse.status === 404, 
    notFoundResponse.success ? 'Non-existent user found' : 'Properly returned 404');
}

// Generate test report
function generateReport() {
  logSection('API TEST REPORT SUMMARY');
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`\n📊 API Test Results Summary:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} ✅`);
  console.log(`   Failed: ${testResults.failed} ❌`);
  console.log(`   Pass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.testName}: ${test.details}`);
      });
  }
  
  // Save detailed report to file
  const fs = require('fs');
  const path = require('path');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    testType: 'API_ONLY',
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: parseFloat(passRate)
    },
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, 'api-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed API test report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Main test execution
async function runAPITests() {
  console.log('🚀 Starting Admin Dashboard User Management API Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🔧 API-only mode (no frontend automation)`);
  
  try {
    // Setup test data
    await setupTestData();
    
    // Run API tests
    await testAPIEndpoints();
    await testUserCRUDOperations();
    await testSecurityEndpoints();
    await testAuditLogging();
    await testDataValidation();
    
  } catch (error) {
    console.error('❌ API test execution failed:', error.message);
    testResults.failed++;
    testResults.total++;
  }
  
  // Generate report
  generateReport();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runAPITests();
}

module.exports = {
  runAPITests,
  testResults,
  logTest,
  logSection
};
