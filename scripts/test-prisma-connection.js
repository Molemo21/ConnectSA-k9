#!/usr/bin/env node

/**
 * Test Prisma Connection Script
 * 
 * This script tests if the Prisma client can connect to the database
 * and if the AdminAuditLog model is available.
 */

const { prisma } = require('../lib/prisma-simple-fixed.ts');

async function testConnection() {
  console.log('🧪 Testing Prisma Connection...');
  console.log('================================');
  
  try {
    // Test 1: Check if Prisma client exists
    if (!prisma) {
      console.log('❌ Prisma client is null (likely in browser/Edge runtime)');
      return;
    }
    
    console.log('✅ Prisma client initialized');
    
    // Test 2: Check if AdminAuditLog model exists
    if (prisma.adminAuditLog) {
      console.log('✅ AdminAuditLog model is available');
      
      // Test 3: Try to count audit logs (simple query)
      try {
        const count = await prisma.adminAuditLog.count();
        console.log(`✅ AdminAuditLog count query successful: ${count} records`);
      } catch (countError) {
        console.log('⚠️ AdminAuditLog count query failed:', countError.message);
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
    } else {
      console.log('❌ User model is not available');
    }
    
    // Test 5: Test database connection with a simple query
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Database connection test successful');
    } catch (connectionError) {
      console.log('❌ Database connection test failed:', connectionError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Prisma client disconnected');
    }
  }
  
  console.log('================================');
  console.log('🏁 Test completed');
}

// Run the test
testConnection().catch(console.error);
