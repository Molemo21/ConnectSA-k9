#!/usr/bin/env node

/**
 * Recreate Tables Script
 * 
 * This script drops the existing tables and recreates them with the correct
 * column names according to the Prisma schema.
 * 
 * Usage: node scripts/recreate-tables.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recreateTables() {
  console.log('🔧 Recreating tables with correct structure...\n');

  try {
    // Check if we can connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Drop existing tables
    console.log('🗑️ Dropping existing tables...\n');
    
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "job_proofs" CASCADE;`;
      console.log('✅ Dropped job_proofs table');
    } catch (error) {
      console.log('⚠️ Could not drop job_proofs table:', error.message);
    }

    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "payouts" CASCADE;`;
      console.log('✅ Dropped payouts table');
    } catch (error) {
      console.log('⚠️ Could not drop payouts table:', error.message);
    }

    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "disputes" CASCADE;`;
      console.log('✅ Dropped disputes table');
    } catch (error) {
      console.log('⚠️ Could not drop disputes table:', error.message);
    }

    console.log('');

    // Recreate tables with correct structure
    console.log('📋 Recreating tables with correct structure...\n');

    // 1. Create job_proofs table with correct column names
    console.log('1️⃣ Creating job_proofs table...');
    await prisma.$executeRaw`
      CREATE TABLE "job_proofs" (
        "id" TEXT PRIMARY KEY,
        "bookingId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "photos" TEXT[] DEFAULT '{}',
        "notes" TEXT,
        "completed_at" TIMESTAMP(3) NOT NULL,
        "client_confirmed" BOOLEAN DEFAULT FALSE,
        "confirmed_at" TIMESTAMP(3),
        "auto_confirm_at" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ job_proofs table created with correct structure\n');

    // 2. Create payouts table with correct column names
    console.log('2️⃣ Creating payouts table...');
    await prisma.$executeRaw`
      CREATE TABLE "payouts" (
        "id" TEXT PRIMARY KEY,
        "paymentId" TEXT UNIQUE NOT NULL,
        "providerId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "paystackRef" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "transfer_code" TEXT,
        "recipient_code" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ payouts table created with correct structure\n');

    // 3. Create disputes table with correct column names
    console.log('3️⃣ Creating disputes table...');
    await prisma.$executeRaw`
      CREATE TABLE "disputes" (
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
    console.log('✅ disputes table created with correct structure\n');

    // 4. Create indexes for better performance
    console.log('4️⃣ Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_job_proofs_bookingId" ON "job_proofs"("bookingId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_job_proofs_providerId" ON "job_proofs"("providerId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_payouts_paymentId" ON "payouts"("paymentId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_payouts_providerId" ON "payouts"("providerId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "idx_disputes_bookingId" ON "disputes"("bookingId");`;
    console.log('✅ Indexes created\n');

    // 5. Verify tables exist and have correct structure
    console.log('5️⃣ Verifying table structure...');
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename IN ('job_proofs', 'payouts', 'disputes')
      ORDER BY tablename;
    `;
    
    console.log('📊 Found tables:', tables.map(t => t.tablename).join(', '));
    
    if (tables.length === 3) {
      console.log('\n🎉 All required tables are now available with correct structure!');
      console.log('💡 You can now uncomment the job proof creation code in the complete endpoint.');
      console.log('💡 You can now uncomment the job proof validation code in the release-payment endpoint.');
    } else {
      console.log('\n⚠️ Some tables are still missing. Please check the database connection.');
    }

  } catch (error) {
    console.error('\n❌ Error recreating tables:', error);
    console.error('\n💡 This usually means:');
    console.error('   - Database connection failed');
    console.error('   - Insufficient database permissions');
    console.error('   - Database URL is incorrect');
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  recreateTables();
}

module.exports = { recreateTables };
