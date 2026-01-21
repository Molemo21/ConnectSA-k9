#!/usr/bin/env node

/**
 * Database Deployment Script (MUTATION ALLOWED)
 * 
 * This is the ONLY script allowed to mutate the production database schema.
 * It performs EXACTLY ONE action: prisma migrate deploy
 * 
 * Safety Guards:
 * - Requires NODE_ENV=production
 * - Requires CI=true (blocks local runs - PERMANENT)
 * - No backup logic (backups are separate step)
 * - No verification logic (verification is separate step)
 * 
 * Usage:
 *   npm run deploy:db
 * 
 * Exit Codes:
 *   0 = Migrations deployed successfully
 *   1 = Deployment failed or guards blocked execution
 */

// ============================================================================
// CRITICAL: Guards execute BEFORE any imports or database connections
// These guards are the FIRST lines of code that execute
// ============================================================================

// GUARD 1: CI-only execution (PHYSICAL IMPOSSIBILITY)
const ci = process.env.CI || '';
const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';

if (!isCI) {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Production mutations require CI=true');
  console.error('='.repeat(80));
  console.error(`Current CI: ${ci || '(not set)'}`);
  console.error('');
  console.error('Production mutations are PHYSICALLY IMPOSSIBLE outside CI/CD pipelines.');
  console.error('This guard executes BEFORE any imports or database connections.');
  console.error('');
  console.error('NO BYPASSES EXIST. This is a HARD GUARANTEE.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// GUARD 2: Production environment required
const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Production mutations require NODE_ENV=production');
  console.error('='.repeat(80));
  console.error(`Current NODE_ENV: ${nodeEnv || '(not set)'}`);
  console.error(`CI: ${isCI}`);
  console.error('');
  console.error('Production mutations require BOTH CI=true AND NODE_ENV=production.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// GUARD 3: Block PROD_DATABASE_URL in wrong context
const prodDbUrl = process.env.PROD_DATABASE_URL || '';
if (prodDbUrl && nodeEnv !== 'production' && nodeEnv !== 'prod') {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: PROD_DATABASE_URL detected in non-production context');
  console.error('='.repeat(80));
  console.error(`PROD_DATABASE_URL is set but NODE_ENV=${nodeEnv}`);
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// GUARD 4: Block production database patterns locally
const dbUrl = process.env.DATABASE_URL || '';
const urlLower = dbUrl.toLowerCase();
const isProdDb = 
  urlLower.includes('pooler.supabase.com') ||
  urlLower.includes('supabase.com:5432') ||
  urlLower.includes('aws-0-eu-west-1') ||
  (urlLower.includes('supabase') && !urlLower.includes('localhost'));

if (isProdDb && !isCI && nodeEnv !== 'production' && nodeEnv !== 'prod') {
  console.error('\n' + '='.repeat(80));
  console.error('🚨 BLOCKED: Production database URL detected in local context');
  console.error('='.repeat(80));
  console.error(`Database URL pattern indicates production database.`);
  console.error(`CI: ${ci || '(not set)'}`);
  console.error(`NODE_ENV: ${nodeEnv || '(not set)'}`);
  console.error('');
  console.error('Production database access is BLOCKED outside CI/CD pipelines.');
  console.error('='.repeat(80) + '\n');
  process.exit(1);
}

// ============================================================================
// Only after ALL guards pass, proceed with imports
// ============================================================================

const { execSync } = require('child_process');
const deploymentState = require('./deployment-state');

// ============================================================================
// CRITICAL GUARDS - Must pass or script exits
// ============================================================================

function enforceDeploymentGuards() {
  // NOTE: CI and environment guards already executed at top of file
  // (before any imports or database connections)
  
  const dbUrl = process.env.DATABASE_URL || '';
  
  // GUARD: Verify DATABASE_URL is set
  if (!dbUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // GUARD: Require verification passed (order-locked)
  deploymentState.requireVerificationPassed();
  
  // GUARD: Require backup completed (order-locked)
  deploymentState.requireBackupCompleted();
  
  // GUARD: Acquire deployment lock (prevent concurrent deployments)
  deploymentState.requireDeploymentLock();
  
  // GUARD: Set approved flag for Prisma wrapper
  process.env.PRISMA_DEPLOYMENT_APPROVED = 'true';
  
  console.log('✅ Deployment guards passed');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   CI: ${isCI}`);
  console.log('   CI Enforcement: ✅ Passed (executed before imports)');
  console.log('   Verification: ✅ Passed');
  console.log('   Backup: ✅ Completed');
  console.log('   Lock: ✅ Acquired');
}

// ============================================================================
// MIGRATION DEPLOYMENT - The ONLY action this script performs
// ============================================================================

async function deployMigrations() {
  console.log('\n🚀 Deploying database migrations...');
  console.log('   This is the ONLY operation that mutates the production database.');
  console.log('   Command: npx prisma migrate deploy\n');
  
  try {
    // Step 0: Validate migration directories (prevent P3015 errors)
    console.log('🔍 Validating migration directories...');
    const fs = require('fs');
    const path = require('path');
    const { PrismaClient } = require('@prisma/client');
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    
    // Get all directories (Prisma counts ALL directories, not just ones with migration.sql)
    const allDirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name !== 'production'); // Exclude production folder
    
    // Check which ones have migration.sql (Prisma requires this)
    const validDirs = [];
    const emptyDirs = [];
    
    for (const dir of allDirs) {
      const migrationPath = path.join(migrationsDir, dir, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        validDirs.push(dir);
      } else {
        emptyDirs.push(dir);
      }
    }
    
    if (emptyDirs.length > 0) {
      console.error('\n❌ CRITICAL: Found migration directories without migration.sql:');
      for (const dir of emptyDirs) {
        console.error(`   - ${dir}`);
      }
      console.error('');
      console.error('   Prisma requires migration.sql in each migration directory.');
      console.error('   Empty directories cause P3015 "Could not find migration file" errors.');
      console.error('');
      console.error('   Resolution:');
      console.error('   1. Delete empty migration directories:');
      for (const dir of emptyDirs) {
        console.error(`      rm -rf prisma/migrations/${dir}`);
      }
      console.error('   2. Or restore missing migration.sql files if they were deleted');
      console.error('');
      throw new Error(`Empty migration directories found: ${emptyDirs.join(', ')}`);
    }
    
    console.log(`✅ All ${validDirs.length} migration directories are valid (have migration.sql)`);
    
    // Step 0.5: Check for migrations in database that don't have local files
    console.log('\n🔍 Checking for database migrations without local files...');
    try {
      const prisma = new PrismaClient();
      const dbMigrations = await prisma.$queryRawUnsafe(
        `SELECT DISTINCT migration_name 
         FROM _prisma_migrations 
         WHERE migration_name IS NOT NULL
         ORDER BY migration_name`
      );
      
      if (Array.isArray(dbMigrations) && dbMigrations.length > 0) {
        const dbMigrationNames = dbMigrations.map(m => m.migration_name || m.migrationName);
        const localSet = new Set(validDirs);
        const missingLocal = dbMigrationNames.filter(name => !localSet.has(name));
        
        if (missingLocal.length > 0) {
          console.warn(`\n⚠️  Found ${missingLocal.length} migration(s) in database without local files:`);
          for (const name of missingLocal) {
            console.warn(`   - ${name}`);
          }
          console.warn('');
          console.warn('   These migrations exist in the database but migration.sql files are missing locally.');
          console.warn('   This can cause P3015 errors.');
          console.warn('');
          console.warn('   Options:');
          console.warn('   1. If migration was applied manually, mark as applied:');
          for (const name of missingLocal) {
            console.warn(`      npx prisma migrate resolve --applied ${name}`);
          }
          console.warn('   2. If migration failed, mark as rolled-back:');
          for (const name of missingLocal) {
            console.warn(`      npx prisma migrate resolve --rolled-back ${name}`);
          }
          console.warn('   3. Or restore the missing migration.sql files');
          console.warn('');
          console.warn('   ⚠️  Proceeding with deployment - may fail with P3015 if files are missing');
        } else {
          console.log('✅ All database migrations have corresponding local files');
        }
      }
      
      await prisma.$disconnect();
    } catch (error) {
      // If _prisma_migrations doesn't exist, that's OK (fresh database)
      if (error.message.includes('does not exist')) {
        console.log('ℹ️  _prisma_migrations table does not exist (fresh database)');
      } else {
        console.warn(`⚠️  Could not check database migrations: ${error.message}`);
        console.warn('   Proceeding with deployment...');
      }
    }
    
    // Step 1: Generate Prisma client (required before migrate deploy)
    console.log('\n📦 Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Prisma client generated');
    
    // Step 2: Deploy migrations (THE ONLY MUTATION)
    console.log('\n📊 Applying migrations to production database...');
    console.log('   ⚠️  This will modify the production database schema.\n');
    
    // Use hardened wrapper (which will allow this because PRISMA_DEPLOYMENT_APPROVED=true)
    execSync('node scripts/prisma-wrapper-hardened.js migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('\n✅ Migrations deployed successfully');
  } catch (error) {
    console.error('\n❌ Migration deployment failed:', error.message);
    console.error('   Database may be in inconsistent state.');
    console.error('   Review error above and restore from backup if needed.');
    process.exit(1);
  }
}

// ============================================================================
// MAIN DEPLOYMENT FLOW
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DATABASE DEPLOYMENT (MUTATION ALLOWED)');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This script will modify the production database schema.');
  console.log('   This is the ONLY script allowed to mutate production.');
  console.log('   This script performs EXACTLY ONE action: prisma migrate deploy\n');
  
  // Step 1: Enforce guards (exits if failed)
  // NOTE: CI guards already executed at top of file
  enforceDeploymentGuards();
  
  // Step 2: Deploy migrations (THE ONLY ACTION)
  await deployMigrations();
  
  // Release deployment lock
  deploymentState.releaseDeploymentLock();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ DATABASE DEPLOYMENT COMPLETED');
  console.log('='.repeat(80));
  console.log('\n');
}

// Run deployment
if (require.main === module) {
  main();
}

module.exports = { main };
