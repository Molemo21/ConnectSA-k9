#!/usr/bin/env node

/**
 * Database Schema Fix Script
 * 
 * This script creates missing tables that are defined in the Prisma schema
 * but don't exist in the database yet.
 * 
 * Usage: node scripts/fix-database-schema.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabaseSchema() {
  console.log('🔧 Starting database schema fix...\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Create missing tables using raw SQL
    console.log('📋 Creating missing tables...\n');

    // 1. Create job_proofs table
    console.log('1️⃣ Creating job_proofs table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "job_proofs" (
        "id" TEXT PRIMARY KEY,
        "bookingId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "photos" TEXT[] DEFAULT '{}',
        "notes" TEXT,
        "completedAt" TIMESTAMP(3) NOT NULL,
        "clientConfirmed" BOOLEAN DEFAULT FALSE,
        "confirmedAt" TIMESTAMP(3),
        "autoConfirmAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ job_proofs table created/verified\n');

    // 2. Create payouts table
    console.log('2️⃣ Creating payouts table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "payouts" (
        "id" TEXT PRIMARY KEY,
        "paymentId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "paystackRef" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "transferCode" TEXT,
        "recipientCode" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ payouts table created/verified\n');

    // 3. Create disputes table
    console.log('3️⃣ Creating disputes table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "disputes" (
        "id" TEXT PRIMARY KEY,
        "bookingId" TEXT UNIQUE NOT NULL,
        "raisedBy" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "resolvedBy" TEXT,
        "resolution" TEXT,
        "resolvedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ disputes table created/verified\n');

    // 4. Create indexes for better performance
    console.log('4️⃣ Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_job_proofs_bookingId" ON "job_proofs"("bookingId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_job_proofs_providerId" ON "job_proofs"("providerId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_payouts_paymentId" ON "payouts"("paymentId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_payouts_providerId" ON "payouts"("providerId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_disputes_bookingId" ON "disputes"("bookingId");`;
    console.log('✅ Indexes created/verified\n');

    // 5. Verify tables exist
    console.log('5️⃣ Verifying tables...');
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename IN ('job_proofs', 'payouts', 'disputes')
      ORDER BY tablename;
    `;
    
    console.log('📊 Found tables:', tables.map(t => t.tablename).join(', '));
    
    if (tables.length === 3) {
      console.log('\n🎉 All required tables are now available!');
      console.log('💡 You can now uncomment the job proof creation code in the complete endpoint.');
    } else {
      console.log('\n⚠️ Some tables are still missing. Please check the database connection.');
    }

  } catch (error) {
    console.error('\n❌ Error fixing database schema:', error);
    console.error('\n💡 This usually means:');
    console.error('   - Database connection failed');
    console.error('   - Insufficient database permissions');
    console.error('   - Database URL is incorrect');
    console.error('\n🔧 To fix manually:');
    console.error('   1. Check your DATABASE_URL environment variable');
    console.error('   2. Ensure the database user has CREATE TABLE permissions');
    console.error('   3. Run the SQL commands manually in your database client');
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixDatabaseSchema();
}

module.exports = { fixDatabaseSchema };
