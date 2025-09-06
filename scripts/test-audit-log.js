#!/usr/bin/env node

/**
 * Test AdminAuditLog Functionality
 * 
 * This script tests if the AdminAuditLog model is working properly
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing AdminAuditLog Functionality');
console.log('=====================================');

async function testAuditLog() {
  try {
    const { prisma } = require('../lib/prisma-simple-fixed.ts');
    
    if (!prisma) {
      console.log('❌ Prisma client is null');
      return;
    }
    
    console.log('✅ Prisma client loaded');
    
    // Test 1: Check if AdminAuditLog model exists
    if (prisma.adminAuditLog) {
      console.log('✅ AdminAuditLog model is available');
      
      // Test 2: Try to count audit logs
      try {
        const count = await prisma.adminAuditLog.count();
        console.log(`✅ AdminAuditLog count query successful: ${count} records`);
      } catch (countError) {
        console.log('⚠️ AdminAuditLog count query failed:', countError.message);
      }
      
      // Test 3: Try to create a test audit log entry
      try {
        const testAuditLog = await prisma.adminAuditLog.create({
          data: {
            adminId: 'test-admin-id',
            action: 'USER_SUSPENDED',
            targetType: 'USER',
            targetId: 'test-user-id',
            details: { test: true },
            ipAddress: '127.0.0.1',
            userAgent: 'test-script',
          },
        });
        
        console.log('✅ AdminAuditLog create successful:', testAuditLog.id);
        
        // Clean up the test entry
        await prisma.adminAuditLog.delete({
          where: { id: testAuditLog.id }
        });
        console.log('✅ Test audit log entry cleaned up');
        
      } catch (createError) {
        console.log('❌ AdminAuditLog create failed:', createError.message);
      }
      
    } else {
      console.log('❌ AdminAuditLog model is not available');
      console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$')));
    }
    
    // Test 4: Test user model
    if (prisma.user) {
      console.log('✅ User model is available');
      
      try {
        const userCount = await prisma.user.count();
        console.log(`✅ User count query successful: ${userCount} users`);
      } catch (userError) {
        console.log('⚠️ User count query failed:', userError.message);
      }
    }
    
    await prisma.$disconnect();
    console.log('🔌 Prisma client disconnected');
    console.log('=====================================');
    console.log('🎉 AdminAuditLog test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuditLog();
