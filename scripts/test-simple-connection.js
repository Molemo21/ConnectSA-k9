#!/usr/bin/env node

/**
 * Simple Connection Test
 * 
 * This script tests the Prisma connection directly
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Simple Connection Test');
console.log('========================');

async function testConnection() {
  try {
    const { PrismaClient } = require('@prisma/client');
    console.log('✅ Prisma Client imported');
    
    const prisma = new PrismaClient();
    console.log('✅ Prisma Client created');
    
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
    console.log('========================');
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testConnection();
