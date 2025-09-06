#!/usr/bin/env node

/**
 * Database Connectivity Test Script (Pooler only)
 *
 * - Validates runtime connectivity to Supabase via the pooler using DATABASE_URL
 * - Intentionally ignores DIRECT_URL for staging/production checks
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing database connectivity (pooler only)...\n');

// Ensure we don't accidentally use DIRECT_URL in this script
process.env.DIRECT_URL = '';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

console.log('1️⃣ Testing runtime connectivity (DATABASE_URL - pooler)...');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  errorFormat: 'pretty',
});

(async () => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('No result from SELECT 1');
    }
    console.log('✅ Runtime connectivity (pooler) working\n');
  } catch (error) {
    console.error('❌ Runtime connectivity failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('🎉 Database connectivity test completed successfully!');
  console.log('\nNext steps:');
  console.log('• Run `npx prisma db seed` to seed the database');
  console.log('• Run `npm test` to run unit tests');
  console.log('• Run `npm run test:e2e` to run integration tests');
})();
