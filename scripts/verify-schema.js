#!/usr/bin/env node

/**
 * Schema Structure Verification (READ-ONLY)
 * 
 * Verifies that required database tables exist.
 * This is a single-purpose check that fails fast if schema is invalid.
 * 
 * Exit Codes:
 *   0 = Schema verified
 *   1 = Schema verification failed (exits immediately)
 */

const { PrismaClient } = require('@prisma/client');

async function verifySchema() {
  console.log('📋 Verifying schema structure (read-only)...');
  
  const prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal'
  });
  
  try {
    // Read-only: Check required tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const requiredTables = [
      'users', 'providers', 'services', 'service_categories',
      'bookings', 'payments', 'reviews'
    ];
    
    const existingTables = tables.map(t => t.table_name.toLowerCase());
    const missing = requiredTables.filter(t => !existingTables.includes(t.toLowerCase()));
    
    if (missing.length > 0) {
      console.error(`❌ Missing required tables: ${missing.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ All required tables exist');
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifySchema().catch((error) => {
    console.error('❌ Schema verification error:', error.message);
    process.exit(1);
  });
}

module.exports = { verifySchema };
