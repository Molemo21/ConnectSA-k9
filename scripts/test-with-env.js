#!/usr/bin/env node

/**
 * Test with Environment Variables
 * 
 * This script loads the .env file and tests the database connection
 */

// Load environment variables
require('dotenv').config();

console.log('🧪 Database Connection Test with .env');
console.log('====================================');

// Check environment variables
console.log('📋 Environment Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
console.log('  DIRECT_URL:', process.env.DIRECT_URL ? 'Present' : 'Missing');
console.log('  NODE_ENV:', process.env.NODE_ENV);

if (process.env.DATABASE_URL) {
  console.log('  DATABASE_URL Protocol:', process.env.DATABASE_URL.split('://')[0]);
}

// Test if we can require Prisma
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client can be imported');
  
  // Try to create a client
  const prisma = new PrismaClient();
  console.log('✅ Prisma Client created');
  
  // Test a simple query
  prisma.$queryRaw`SELECT 1 as test`
    .then(result => {
      console.log('✅ Database connection successful:', result);
      return prisma.$disconnect();
    })
    .then(() => {
      console.log('🔌 Prisma client disconnected');
      console.log('====================================');
      console.log('🎉 All tests passed!');
    })
    .catch(error => {
      console.error('❌ Database connection failed:', error.message);
      prisma.$disconnect();
    });
    
} catch (error) {
  console.error('❌ Failed to import Prisma Client:', error.message);
  console.log('💡 Try running: npx prisma generate');
}
