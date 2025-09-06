#!/usr/bin/env node

/**
 * Test Direct Connection
 * 
 * This script tests using the direct connection instead of pooler
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing Direct Connection');
console.log('============================');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
console.log('  DIRECT_URL:', process.env.DIRECT_URL ? 'Present' : 'Missing');

if (process.env.DATABASE_URL) {
  console.log('  DATABASE_URL Protocol:', process.env.DATABASE_URL.split('://')[0]);
}

// Test with direct connection
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client can be imported');
  
  // Use direct connection for testing
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('🔍 Using direct connection URL');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });
  
  console.log('✅ Prisma Client created with direct connection');
  
  // Test a simple query
  prisma.$queryRaw`SELECT 1 as test`
    .then(result => {
      console.log('✅ Database connection successful:', result);
      return prisma.$disconnect();
    })
    .then(() => {
      console.log('🔌 Prisma client disconnected');
      console.log('============================');
      console.log('🎉 Direct connection works!');
    })
    .catch(error => {
      console.error('❌ Database connection failed:', error.message);
      prisma.$disconnect();
    });
    
} catch (error) {
  console.error('❌ Failed to import Prisma Client:', error.message);
}
