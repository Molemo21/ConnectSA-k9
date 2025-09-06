#!/usr/bin/env node

/**
 * Test Pooler Connection with Fixed Approach
 * 
 * This script tests using the pooler with proper connection handling
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Testing Pooler Connection (Fixed)');
console.log('====================================');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
console.log('  DIRECT_URL:', process.env.DIRECT_URL ? 'Present' : 'Missing');

if (process.env.DATABASE_URL) {
  console.log('  DATABASE_URL Protocol:', process.env.DATABASE_URL.split('://')[0]);
}

// Test with pooler connection
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client can be imported');
  
  // Use pooler connection but with proper configuration
  const poolerUrl = process.env.DATABASE_URL.replace('prisma+postgres://', 'postgresql://');
  console.log('🔍 Using pooler connection URL');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: poolerUrl,
      },
    },
    log: ['error', 'warn'],
  });
  
  console.log('✅ Prisma Client created with pooler connection');
  
  // Test a simple query
  prisma.$queryRaw`SELECT 1 as test`
    .then(result => {
      console.log('✅ Database connection successful:', result);
      return prisma.$disconnect();
    })
    .then(() => {
      console.log('🔌 Prisma client disconnected');
      console.log('====================================');
      console.log('🎉 Pooler connection works!');
    })
    .catch(error => {
      console.error('❌ Database connection failed:', error.message);
      prisma.$disconnect();
    });
    
} catch (error) {
  console.error('❌ Failed to import Prisma Client:', error.message);
}
