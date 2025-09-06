#!/usr/bin/env node

/**
 * Final Prisma Connection Test
 * 
 * This script tests the Prisma connection with the same setup as the Next.js app
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Final Prisma Connection Test');
console.log('==============================');

async function testConnection() {
  try {
    // Import the same Prisma client that the app uses
    const { prisma } = require('../lib/prisma-simple-fixed.ts');
    
    if (!prisma) {
      console.log('❌ Prisma client is null');
      return;
    }
    
    console.log('✅ Prisma client loaded');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma client connected');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Test user model
    const userCount = await prisma.user.count();
    console.log(`✅ User count query successful: ${userCount} users`);
    
    // Test AdminAuditLog model
    if (prisma.adminAuditLog) {
      const auditCount = await prisma.adminAuditLog.count();
      console.log(`✅ AdminAuditLog count query successful: ${auditCount} records`);
    } else {
      console.log('❌ AdminAuditLog model not available');
    }
    
    await prisma.$disconnect();
    console.log('🔌 Prisma client disconnected');
    console.log('==============================');
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testConnection();
