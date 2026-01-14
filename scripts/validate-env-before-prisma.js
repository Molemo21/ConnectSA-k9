#!/usr/bin/env node

/**
 * Pre-validation script for Prisma CLI commands
 * 
 * This script validates database environment safety before running Prisma commands
 * like `prisma generate`, `prisma migrate`, `prisma db push`, etc.
 * 
 * Usage: node scripts/validate-env-before-prisma.js
 * 
 * This is automatically called before Prisma commands in package.json scripts.
 * 
 * Safety Features:
 * - Blocks development from connecting to production database
 * - Blocks production from using development database
 * - Validates DATABASE_URL is set
 * - Checks for placeholder values
 * - Warns about mismatched DATABASE_URL and DIRECT_URL
 */

// Simple validation logic (duplicated from db-safety.ts for CommonJS compatibility)
function isProductionDatabaseUrl(url) {
  if (!url) return false;
  return url.includes('pooler.supabase.com') || 
         url.includes('supabase.com:5432') ||
         url.includes('aws-0-eu-west-1');
}

function isDevelopmentDatabaseUrl(url) {
  if (!url) return false;
  return url.includes('localhost') || 
         url.includes('127.0.0.1') ||
         url.includes('connectsa_dev');
}

function isTestDatabaseUrl(url) {
  if (!url) return false;
  return url.includes('connectsa_test');
}

function validateBeforePrisma() {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  
  // Check if DATABASE_URL is set
  if (!databaseUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL before running Prisma commands.');
    console.error('   See ENVIRONMENT_SEPARATION.md for setup instructions.\n');
    return false;
  }
  
  // Check for placeholder values
  if (databaseUrl.includes('<PASSWORD>') || databaseUrl.includes('<password>')) {
    console.error('\n❌ ERROR: DATABASE_URL contains placeholder values (<PASSWORD>)');
    console.error('   Please replace with actual database credentials.');
    console.error(`   Database URL: ${databaseUrl.substring(0, 60)}...\n`);
    return false;
  }
  
  // Production environment cannot use development database (always blocked)
  if (nodeEnv === 'production') {
    if (isDevelopmentDatabaseUrl(databaseUrl) || isTestDatabaseUrl(databaseUrl)) {
      console.error('\n' + '='.repeat(80));
      console.error('🚨 CRITICAL: Production environment is using a development/test database!');
      console.error('='.repeat(80));
      console.error(`Database URL: ${databaseUrl.substring(0, 60)}...`);
      console.error('');
      console.error('This will cause data loss and is BLOCKED.');
      console.error('Please set correct DATABASE_URL in your production environment.');
      console.error('='.repeat(80) + '\n');
      return false;
    }
    
    // Warn if production URL doesn't look like production
    if (!isProductionDatabaseUrl(databaseUrl)) {
      console.warn('\n⚠️  WARNING: Production environment database URL doesn\'t match expected production patterns.');
      console.warn(`   Database URL: ${databaseUrl.substring(0, 60)}...`);
      console.warn('   Please verify this is the correct production database.\n');
    }
  }
  
  // HARD BLOCK: Development/test cannot connect to production database
  // NO BYPASS ALLOWED - This is a security requirement
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    if (isProductionDatabaseUrl(databaseUrl)) {
      console.error('\n' + '='.repeat(80));
      console.error('🚨 CRITICAL SECURITY ERROR: Cannot run Prisma commands on production database');
      console.error('='.repeat(80));
      console.error(`Environment: ${nodeEnv.toUpperCase()}`);
      console.error(`Database URL: ${databaseUrl.substring(0, 60)}...`);
      console.error('');
      console.error('Running Prisma commands on production from development is PERMANENTLY BLOCKED');
      console.error('for security to prevent accidental schema changes or data loss.');
      console.error('');
      console.error('Required solution:');
      console.error('  Use a separate development database for local development');
      console.error('  See ENVIRONMENT_SEPARATION.md for setup instructions');
      console.error('');
      console.error('If you need to run migrations on production, use approved CI/CD pipelines.');
      console.error('='.repeat(80) + '\n');
      return false;
    }
  }
  
  // Warn if DATABASE_URL and DIRECT_URL point to different environments
  if (databaseUrl && directUrl) {
    const dbIsProd = isProductionDatabaseUrl(databaseUrl);
    const directIsProd = isProductionDatabaseUrl(directUrl);
    
    if (dbIsProd !== directIsProd) {
      console.warn('\n⚠️  WARNING: DATABASE_URL and DIRECT_URL point to different environments');
      console.warn(`   DATABASE_URL: ${dbIsProd ? 'PRODUCTION' : 'DEVELOPMENT/TEST'}`);
      console.warn(`   DIRECT_URL: ${directIsProd ? 'PRODUCTION' : 'DEVELOPMENT/TEST'}`);
      console.warn('   They should typically point to the same database.\n');
    }
  }
  
  // All checks passed
  return true;
}

// Run validation
try {
  const isValid = validateBeforePrisma();
  
  if (!isValid) {
    process.exit(1);
  }
  
  // Exit with success (script continues to next command)
  process.exit(0);
} catch (error) {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
}
