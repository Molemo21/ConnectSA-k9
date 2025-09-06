#!/usr/bin/env node

/**
 * Test Next.js Prisma Client
 * 
 * This script tests the new Next.js-compatible Prisma client
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing Next.js Prisma Client');
console.log('================================');

async function testNextJsPrisma() {
  try {
    // Import the new Next.js Prisma client
    const { prisma } = require('../lib/prisma-nextjs.ts');
    
    if (!prisma) {
      console.log('❌ Prisma client is null');
      return;
    }
    
    console.log('✅ Next.js Prisma client loaded');
    
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
    console.log('================================');
    console.log('🎉 Next.js Prisma client test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNextJsPrisma();
