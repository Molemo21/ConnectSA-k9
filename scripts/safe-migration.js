#!/usr/bin/env node

/**
 * Safe Migration Script for Supabase
 * Uses DIRECT_URL to bypass pgbouncer for migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runSafeMigration() {
  console.log('🚀 Starting safe migration for Supabase...');
  
  // Check if we have the required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  if (!process.env.DIRECT_URL) {
    console.error('❌ DIRECT_URL not found in environment');
    console.log('ℹ️ DIRECT_URL is required for Supabase migrations to bypass pgbouncer');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log('📊 Database URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
  console.log('📊 Direct URL:', process.env.DIRECT_URL.substring(0, 50) + '...');

  try {
    // Step 1: Generate Prisma client
    console.log('🔧 Step 1: Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');

    // Step 2: Create migration (this will use DIRECT_URL automatically)
    console.log('🔧 Step 2: Creating migration...');
    execSync('npx prisma migrate dev --name add_catalogue_pricing --create-only', { 
      stdio: 'inherit',
      timeout: 30000 // 30 second timeout
    });
    console.log('✅ Migration created');

    // Step 3: Apply migration
    console.log('🔧 Step 3: Applying migration...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      timeout: 60000 // 60 second timeout
    });
    console.log('✅ Migration applied');

    // Step 4: Verify migration
    console.log('🔧 Step 4: Verifying migration...');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      timeout: 30000
    });
    console.log('✅ Migration verified');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if it's a timeout error
    if (error.message.includes('timeout')) {
      console.log('⏰ Migration timed out. This can happen with Supabase.');
      console.log('💡 Try running the migration in smaller steps:');
      console.log('   1. npx prisma migrate dev --name add_catalogue_pricing --create-only');
      console.log('   2. npx prisma migrate deploy');
    }
    
    process.exit(1);
  }
}

// Run the migration
runSafeMigration();

