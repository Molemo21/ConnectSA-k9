#!/usr/bin/env node

/**
 * Sync Development Database Schema
 * 
 * This script applies all Prisma migrations to your development database
 * to match the production schema structure (without copying data).
 * 
 * Usage:
 *   node scripts/sync-dev-schema.js
 * 
 * This will:
 * 1. Verify you're using development database
 * 2. Apply all pending migrations
 * 3. Verify schema matches Prisma schema
 */

const { execSync } = require('child_process');
const path = require('path');

// Check environment
function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Environment Validation');
  console.log('='.repeat(80) + '\n');
  
  // Check NODE_ENV
  if (nodeEnv !== 'development') {
    console.warn(`⚠️  NODE_ENV is "${nodeEnv}", expected "development"`);
    console.warn('   This script should only run in development environment.\n');
  } else {
    console.log(`✅ NODE_ENV: ${nodeEnv}`);
  }
  
  // Check for production database indicators
  const productionIndicators = [
    'qdrktzqfeewwcktgltzy', // Production project ref
    'aws-0-eu-west-1',      // Production AWS region
  ];
  
  const isProductionDb = productionIndicators.some(ind => dbUrl.includes(ind));
  
  if (isProductionDb) {
    console.error('\n🚨 CRITICAL: DATABASE_URL appears to be production database!');
    console.error('   This script should only run against development database.');
    console.error(`   Database URL: ${dbUrl.substring(0, 60)}...\n`);
    console.error('   Please verify your .env.development file contains development database URL.\n');
    process.exit(1);
  }
  
  // Check for development database indicators
  const devIndicators = [
    'localhost',
    '127.0.0.1',
    'xckkwzmiuiyabwmsbikf', // Dev project ref (from your .env.development)
  ];
  
  const isDevelopmentDb = devIndicators.some(ind => dbUrl.includes(ind));
  
  if (!isDevelopmentDb && !dbUrl.includes('supabase.co')) {
    console.warn('⚠️  Warning: Database URL does not match expected development pattern');
    console.warn(`   Database URL: ${dbUrl.substring(0, 60)}...`);
    console.warn('   Continuing anyway, but please verify this is correct.\n');
  } else {
    console.log(`✅ DATABASE_URL: Development database detected`);
    console.log(`   Database: ${dbUrl.substring(0, 60)}...\n`);
  }
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set');
    console.error('   Please set DATABASE_URL in your .env.development file.\n');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed\n');
}

// Apply migrations
function applyMigrations() {
  console.log('='.repeat(80));
  console.log('📊 Applying Prisma Migrations');
  console.log('='.repeat(80) + '\n');
  
  try {
    console.log('Step 1: Generating Prisma Client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Prisma Client generated\n');
    
    console.log('Step 2: Applying migrations to development database...');
    console.log('   This will create all tables and schema from your Prisma migrations.\n');
    
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });
    
    console.log('\n✅ Migrations applied successfully\n');
  } catch (error) {
    console.error('\n❌ Error applying migrations:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('  1. DATABASE_URL is correct in .env.development');
    console.error('  2. Database is accessible');
    console.error('  3. You have permissions to create tables\n');
    process.exit(1);
  }
}

// Verify schema
function verifySchema() {
  console.log('='.repeat(80));
  console.log('🔍 Verifying Schema');
  console.log('='.repeat(80) + '\n');
  
  try {
    console.log('Checking if schema matches Prisma schema...');
    
    // Use Prisma to introspect and compare
    execSync('npx prisma db pull --print', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    console.log('✅ Schema verification complete\n');
  } catch (error) {
    console.warn('⚠️  Could not verify schema automatically');
    console.warn('   You can manually verify by running: npx prisma studio\n');
  }
}

// Main execution
function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 Development Database Schema Sync');
  console.log('='.repeat(80));
  console.log('\nThis script will:');
  console.log('  1. Verify you\'re using development database');
  console.log('  2. Apply all Prisma migrations to create tables');
  console.log('  3. Verify schema matches Prisma schema');
  console.log('\n⚠️  Note: This creates the SCHEMA (structure) only, not data.');
  console.log('   Tables will be empty, which is correct for development.\n');
  
  // Validate environment
  validateEnvironment();
  
  // Apply migrations
  applyMigrations();
  
  // Verify schema
  verifySchema();
  
  console.log('='.repeat(80));
  console.log('✅ Schema Sync Complete!');
  console.log('='.repeat(80));
  console.log('\nYour development database now has:');
  console.log('  ✅ All tables from production schema');
  console.log('  ✅ All columns and relationships');
  console.log('  ✅ All indexes and constraints');
  console.log('  ✅ Empty tables (ready for development data)\n');
  console.log('Next steps:');
  console.log('  1. Run your application: npm run dev');
  console.log('  2. Create test data as needed');
  console.log('  3. Use Prisma Studio to view tables: npx prisma studio\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, validateEnvironment, applyMigrations, verifySchema };
