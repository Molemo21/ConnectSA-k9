/**
 * Script to add database environment fingerprint
 * 
 * This script adds the required fingerprint record to the database_metadata table
 * to fix the "Environment Fingerprint Validation Failed" error.
 * 
 * Usage:
 *   node scripts/run-add-fingerprint.js
 * 
 * Or set environment variables:
 *   DATABASE_URL="your-db-url" node scripts/run-add-fingerprint.js
 */

// Load environment variables from .env.development or .env
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env' }); // Fallback to .env

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function addFingerprint() {
  console.log('🔧 Adding database environment fingerprint...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set.');
    console.error('   Please set it in your .env file or as an environment variable.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'database_metadata'
      ) as exists
    `;

    if (!tableExists[0]?.exists) {
      console.error('❌ Error: database_metadata table does not exist.');
      console.error('   Please run Prisma migrations first: npx prisma migrate deploy');
      process.exit(1);
    }

    // Generate fingerprint
    const fingerprint = `dev-environment-fingerprint-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Insert or update fingerprint record using Prisma model
    await prisma.databaseMetadata.upsert({
      where: { id: 'singleton' },
      update: {
        environment: 'dev',
        fingerprint: fingerprint,
        updatedAt: new Date()
      },
      create: {
        id: 'singleton',
        environment: 'dev',
        fingerprint: fingerprint,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Verify the record
    const record = await prisma.databaseMetadata.findUnique({
      where: { id: 'singleton' }
    });

    if (record) {
      console.log('✅ Database fingerprint record added/updated successfully!\n');
      console.log('📋 Record Details:');
      console.log(`   ID: ${record.id}`);
      console.log(`   Environment: ${record.environment}`);
      console.log(`   Fingerprint: ${record.fingerprint}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Updated: ${record.updatedAt}\n`);
      console.log('✅ The validation system will now recognize this database as a dev environment.');
      console.log('   You should no longer see the "Environment Fingerprint Validation Failed" error.\n');
    } else {
      console.error('❌ Error: Failed to verify fingerprint record.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error adding fingerprint:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addFingerprint()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
