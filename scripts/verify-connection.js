#!/usr/bin/env node

/**
 * Database Connection Verification (READ-ONLY)
 * 
 * Tests database connection with a read-only query.
 * This is a single-purpose check that fails fast if connection fails.
 * 
 * Exit Codes:
 *   0 = Connection verified
 *   1 = Connection failed (exits immediately)
 */

const { PrismaClient } = require('@prisma/client');

async function verifyConnection() {
  console.log('🔍 Verifying database connection (read-only)...');
  
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal'
  });
  
  try {
    // Read-only query to test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyConnection().catch((error) => {
    console.error('❌ Connection verification error:', error.message);
    process.exit(1);
  });
}

module.exports = { verifyConnection };
