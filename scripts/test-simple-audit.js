#!/usr/bin/env node

/**
 * Simple Audit Log Test
 * 
 * This script tests the audit logging functionality
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing Simple Audit Log Functionality');
console.log('========================================');

async function testAuditLog() {
  try {
    // Test the audit logger directly
    const { logAdminAction } = require('../lib/audit-logger.ts');
    
    console.log('✅ Audit logger imported successfully');
    
    // Test logging an admin action
    await logAdminAction({
      adminId: 'test-admin-id',
      action: 'USER_SUSPENDED',
      targetType: 'USER',
      targetId: 'test-user-id',
      details: { test: true },
      ipAddress: '127.0.0.1',
      userAgent: 'test-script',
    });
    
    console.log('✅ Audit logging test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuditLog();
