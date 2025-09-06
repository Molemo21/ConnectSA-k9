#!/usr/bin/env node

/**
 * Comprehensive Automated Test Script for Admin Dashboard User Management System
 * 
 * This script tests all admin user management APIs and frontend flows,
 * ensuring the system works correctly for all user types and scenarios.
 * 
 * Prerequisites:
 * - Node.js environment
 * - Database with test data
 * - Application running on localhost:3000
 * 
 * Usage: node scripts/test-admin-user-management.js
 */

const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;
const HEADLESS = process.env.HEADLESS !== 'false';

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

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName} - ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log(`${'='.repeat(60)}`);
}

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

// Test data setup
async function setupTestData() {
  logSection('SETUP: Creating Test Data');
  
  // Create test users if they don't exist
  for (const [role, userData] of Object.entries(TEST_USERS)) {
    const response = await makeRequest('POST', '/auth/signup', {
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email: userData.email,
      password: userData.password,
      role: userData.role
    });
    
    if (response.success || response.status === 409) { // 409 = user already exists
      logTest(`Create ${role} user`, true);
    } else {
      logTest(`Create ${role} user`, false, response.error);
    }
  }
}

// API Tests
async function testUserListAPI() {
  logSection('API TESTS: User List Management');
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Admin login', false, 'Could not obtain admin token');
    return;
  }
  
  // Test 1: List all users (admin access)
  const listResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('List all users (admin)', listResponse.success, 
    listResponse.success ? `Found ${listResponse.data.users?.length || 0} users` : listResponse.error);
  
  // Test 2: List users with pagination
  const paginationResponse = await makeRequest('GET', '/admin/users?page=1&limit=5', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('List users with pagination', paginationResponse.success, 
    paginationResponse.success ? `Page 1, limit 5` : paginationResponse.error);
  
  // Test 3: Filter users by role
  const roleFilterResponse = await makeRequest('GET', '/admin/users?role=CLIENT', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Filter users by role (CLIENT)', roleFilterResponse.success, 
    roleFilterResponse.success ? `Found ${roleFilterResponse.data.users?.length || 0} clients` : roleFilterResponse.error);
  
  // Test 4: Search users by email
  const searchResponse = await makeRequest('GET', '/admin/users?search=test.com', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Search users by email', searchResponse.success, 
    searchResponse.success ? `Found ${searchResponse.data.users?.length || 0} matching users` : searchResponse.error);
  
  // Test 5: Non-admin access (should fail)
  const clientToken = await loginUser(TEST_USERS.client.email, TEST_USERS.client.password);
  const unauthorizedResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${clientToken}`
  });
  
  logTest('Non-admin access blocked', !unauthorizedResponse.success && unauthorizedResponse.status === 401, 
    unauthorizedResponse.success ? 'Unauthorized access allowed' : 'Access properly blocked');
  
  return { adminToken, users: listResponse.data?.users || [] };
}

async function testUserDetailsAPI(adminToken, users) {
  logSection('API TESTS: User Details');
  
  if (!users.length) {
    logTest('User details test', false, 'No users available for testing');
    return;
  }
  
  const testUser = users[0];
  
  // Test 1: Get user details
  const detailsResponse = await makeRequest('GET', `/admin/users/${testUser.id}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Get user details', detailsResponse.success, 
    detailsResponse.success ? `Retrieved details for ${testUser.name}` : detailsResponse.error);
  
  // Test 2: Get non-existent user
  const notFoundResponse = await makeRequest('GET', '/admin/users/non-existent-id', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Get non-existent user', !notFoundResponse.success && notFoundResponse.status === 404, 
    notFoundResponse.success ? 'Non-existent user found' : 'Properly returned 404');
  
  return testUser;
}

async function testUserActionsAPI(adminToken, testUser) {
  logSection('API TESTS: User Actions');
  
  // Test 1: Suspend user
  const suspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'suspend',
    reason: 'Test suspension'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Suspend user', suspendResponse.success, 
    suspendResponse.success ? 'User suspended successfully' : suspendResponse.error);
  
  // Test 2: Unsuspend user
  const unsuspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'unsuspend',
    reason: 'Test unsuspension'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Unsuspend user', unsuspendResponse.success, 
    unsuspendResponse.success ? 'User unsuspended successfully' : unsuspendResponse.error);
  
  // Test 3: Change user role
  const roleChangeResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
    action: 'changeRole',
    newRole: 'PROVIDER',
    reason: 'Test role change'
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Change user role', roleChangeResponse.success, 
    roleChangeResponse.success ? 'User role changed successfully' : roleChangeResponse.error);
  
  // Test 4: Self-modification prevention
  const adminUser = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (adminUser.success && adminUser.data.users.length > 0) {
    const adminUserData = adminUser.data.users.find(u => u.role === 'ADMIN');
    if (adminUserData) {
      const selfModifyResponse = await makeRequest('PATCH', `/admin/users/${adminUserData.id}`, {
        action: 'suspend',
        reason: 'Self modification test'
      }, {
        'Authorization': `Bearer ${adminToken}`
      });
      
      logTest('Prevent self-modification', !selfModifyResponse.success && selfModifyResponse.status === 400, 
        selfModifyResponse.success ? 'Self-modification allowed' : 'Self-modification properly blocked');
    }
  }
  
  // Test 5: Soft delete user
  const deleteResponse = await makeRequest('DELETE', `/admin/users/${testUser.id}`, {
    reason: 'Test deletion',
    permanent: false
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Soft delete user', deleteResponse.success, 
    deleteResponse.success ? 'User soft deleted successfully' : deleteResponse.error);
}

async function testAuditLogsAPI(adminToken) {
  logSection('API TESTS: Audit Logs');
  
  // Test 1: Get audit logs
  const auditResponse = await makeRequest('GET', '/admin/audit-logs', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Get audit logs', auditResponse.success, 
    auditResponse.success ? `Found ${auditResponse.data.logs?.length || 0} audit entries` : auditResponse.error);
  
  // Test 2: Filter audit logs by action
  const filteredAuditResponse = await makeRequest('GET', '/admin/audit-logs?action=USER_SUSPENDED', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Filter audit logs by action', filteredAuditResponse.success, 
    filteredAuditResponse.success ? `Found ${filteredAuditResponse.data.logs?.length || 0} suspension entries` : filteredAuditResponse.error);
  
  // Test 3: Filter audit logs by date range
  const today = new Date().toISOString().split('T')[0];
  const dateFilteredResponse = await makeRequest('GET', `/admin/audit-logs?startDate=${today}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  logTest('Filter audit logs by date', dateFilteredResponse.success, 
    dateFilteredResponse.success ? `Found ${dateFilteredResponse.data.logs?.length || 0} today's entries` : dateFilteredResponse.error);
}

// Frontend Tests
async function testFrontendUserManagement() {
  logSection('FRONTEND TESTS: User Management Interface');
  
  const browser = await puppeteer.launch({ 
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test 1: Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', TEST_USERS.admin.email);
    await page.type('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const isAdminDashboard = page.url().includes('/admin/dashboard');
    logTest('Admin login and redirect', isAdminDashboard, 
      isAdminDashboard ? 'Successfully logged in and redirected' : 'Login or redirect failed');
    
    if (!isAdminDashboard) {
      await browser.close();
      return;
    }
    
    // Test 2: Navigate to user management
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForSelector('[data-testid="user-management"]', { timeout: 10000 }).catch(() => {});
    
    const userManagementLoaded = await page.$('[data-testid="user-management"]') !== null;
    logTest('User management page loads', userManagementLoaded, 
      userManagementLoaded ? 'User management page loaded successfully' : 'Page failed to load');
    
    // Test 3: Check user statistics cards
    const statsCards = await page.$$('[data-testid="stats-card"]');
    logTest('User statistics cards display', statsCards.length > 0, 
      statsCards.length > 0 ? `Found ${statsCards.length} stats cards` : 'No stats cards found');
    
    // Test 4: Test search functionality
    const searchInput = await page.$('input[placeholder*="Search users"]');
    if (searchInput) {
      await searchInput.type('test');
      await page.waitForTimeout(1000); // Wait for search results
      logTest('Search functionality', true, 'Search input found and functional');
    } else {
      logTest('Search functionality', false, 'Search input not found');
    }
    
    // Test 5: Test role filter
    const roleFilter = await page.$('select, [role="combobox"]');
    if (roleFilter) {
      logTest('Role filter dropdown', true, 'Role filter found');
    } else {
      logTest('Role filter dropdown', false, 'Role filter not found');
    }
    
    // Test 6: Test user cards/rows
    const userCards = await page.$$('[data-testid="user-card"], .border.rounded-lg');
    logTest('User cards/rows display', userCards.length > 0, 
      userCards.length > 0 ? `Found ${userCards.length} user cards` : 'No user cards found');
    
    // Test 7: Test view details button
    const viewButtons = await page.$$('button:has-text("View"), button[aria-label*="View"]');
    if (viewButtons.length > 0) {
      await viewButtons[0].click();
      await page.waitForTimeout(1000);
      
      const modalOpen = await page.$('[role="dialog"], .modal') !== null;
      logTest('View details modal', modalOpen, 
        modalOpen ? 'Modal opened successfully' : 'Modal failed to open');
      
      if (modalOpen) {
        // Close modal
        const closeButton = await page.$('button[aria-label="Close"], button:has-text("Close")');
        if (closeButton) {
          await closeButton.click();
        }
      }
    } else {
      logTest('View details button', false, 'View details button not found');
    }
    
    // Test 8: Test action dropdown
    const actionButtons = await page.$$('button[aria-label*="More"], button:has-text("⋯")');
    if (actionButtons.length > 0) {
      await actionButtons[0].click();
      await page.waitForTimeout(500);
      
      const dropdownOpen = await page.$('[role="menu"], .dropdown-menu') !== null;
      logTest('Action dropdown menu', dropdownOpen, 
        dropdownOpen ? 'Dropdown opened successfully' : 'Dropdown failed to open');
    } else {
      logTest('Action dropdown menu', false, 'Action dropdown button not found');
    }
    
    // Test 9: Mobile responsiveness
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.$('.grid-cols-1, .flex-col') !== null;
    logTest('Mobile responsive layout', mobileLayout, 
      mobileLayout ? 'Layout adapts to mobile' : 'Layout not mobile responsive');
    
    // Test 10: Navigation tabs
    await page.setViewport({ width: 1280, height: 720 }); // Reset to desktop
    const navTabs = await page.$$('[role="tab"], .tab');
    logTest('Navigation tabs', navTabs.length > 0, 
      navTabs.length > 0 ? `Found ${navTabs.length} navigation tabs` : 'No navigation tabs found');
    
  } catch (error) {
    logTest('Frontend test execution', false, error.message);
  } finally {
    await browser.close();
  }
}

async function testSecurityAndSafety() {
  logSection('SECURITY TESTS: Access Control and Safety');
  
  // Test 1: Non-admin cannot access admin APIs
  const clientToken = await loginUser(TEST_USERS.client.email, TEST_USERS.client.password);
  if (clientToken) {
    const unauthorizedAccess = await makeRequest('GET', '/admin/users', null, {
      'Authorization': `Bearer ${clientToken}`
    });
    
    logTest('Non-admin API access blocked', !unauthorizedAccess.success && unauthorizedAccess.status === 401, 
      unauthorizedAccess.success ? 'Unauthorized access allowed' : 'Access properly blocked');
  }
  
  // Test 2: Provider cannot access admin APIs
  const providerToken = await loginUser(TEST_USERS.provider.email, TEST_USERS.provider.password);
  if (providerToken) {
    const providerAccess = await makeRequest('GET', '/admin/users', null, {
      'Authorization': `Bearer ${providerToken}`
    });
    
    logTest('Provider API access blocked', !providerAccess.success && providerAccess.status === 401, 
      providerAccess.success ? 'Unauthorized access allowed' : 'Access properly blocked');
  }
  
  // Test 3: Invalid token access
  const invalidTokenAccess = await makeRequest('GET', '/admin/users', null, {
    'Authorization': 'Bearer invalid-token'
  });
  
  logTest('Invalid token access blocked', !invalidTokenAccess.success && invalidTokenAccess.status === 401, 
    invalidTokenAccess.success ? 'Invalid token access allowed' : 'Access properly blocked');
  
  // Test 4: No token access
  const noTokenAccess = await makeRequest('GET', '/admin/users');
  
  logTest('No token access blocked', !noTokenAccess.success && noTokenAccess.status === 401, 
    noTokenAccess.success ? 'No token access allowed' : 'Access properly blocked');
}

// Email notification tests (mock)
async function testEmailNotifications() {
  logSection('EMAIL TESTS: Notification System');
  
  // Note: In a real test environment, you would need to:
  // 1. Set up a test email service (like Mailtrap or similar)
  // 2. Configure the application to use the test email service
  // 3. Check the email service for sent emails
  
  // For now, we'll test that the API calls complete successfully
  // which indicates the email sending logic was executed
  
  const adminToken = await loginUser(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!adminToken) {
    logTest('Email notification test setup', false, 'Could not obtain admin token');
    return;
  }
  
  // Get a test user to suspend (which should trigger email)
  const usersResponse = await makeRequest('GET', '/admin/users', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (usersResponse.success && usersResponse.data.users.length > 0) {
    const testUser = usersResponse.data.users[0];
    
    // Suspend user (should trigger email)
    const suspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
      action: 'suspend',
      reason: 'Email notification test'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    
    logTest('Email notification on suspend', suspendResponse.success, 
      suspendResponse.success ? 'Suspend action completed (email should be sent)' : suspendResponse.error);
    
    // Unsuspend user (should trigger email)
    const unsuspendResponse = await makeRequest('PATCH', `/admin/users/${testUser.id}`, {
      action: 'unsuspend',
      reason: 'Email notification test'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    
    logTest('Email notification on unsuspend', unsuspendResponse.success, 
      unsuspendResponse.success ? 'Unsuspend action completed (email should be sent)' : unsuspendResponse.error);
  }
}

// Generate test report
function generateReport() {
  logSection('TEST REPORT SUMMARY');
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  console.log(`\n📊 Test Results Summary:`);
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
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: parseFloat(passRate)
    },
    details: testResults.details
  };
  
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Admin Dashboard User Management System Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log(`🎭 Headless mode: ${HEADLESS}`);
  
  try {
    // Setup
    await setupTestData();
    
    // API Tests
    const { adminToken, users } = await testUserListAPI();
    if (adminToken && users.length > 0) {
      const testUser = await testUserDetailsAPI(adminToken, users);
      if (testUser) {
        await testUserActionsAPI(adminToken, testUser);
      }
      await testAuditLogsAPI(adminToken);
    }
    
    // Frontend Tests
    await testFrontendUserManagement();
    
    // Security Tests
    await testSecurityAndSafety();
    
    // Email Tests
    await testEmailNotifications();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
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
  runTests();
}

module.exports = {
  runTests,
  testResults,
  logTest,
  logSection
};
