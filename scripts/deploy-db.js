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

const { execSync } = require('child_process');
const deploymentState = require('./deployment-state');

// CI enforcement is implemented inline to avoid TypeScript compilation issues
// This ensures the guard works even if TypeScript isn't compiled
function enforceCIOnlyExecutionInline(scriptName) {
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  
  // GUARD 1: Must be in CI environment
  if (!isCI) {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: ${scriptName} requires CI=true
${'='.repeat(80)}
Current CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

This script can mutate production data and MUST run in CI/CD only.
Local execution is PERMANENTLY BLOCKED to prevent accidental mutations.

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 2: Block PROD_DATABASE_URL usage locally
  const prodDbUrl = process.env.PROD_DATABASE_URL || '';
  if (prodDbUrl && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: PROD_DATABASE_URL detected in non-production context
${'='.repeat(80)}
PROD_DATABASE_URL is set but NODE_ENV=${nodeEnv}

This prevents accidental use of production database in wrong context.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 3: Validate we're in production environment
  if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: ${scriptName} requires NODE_ENV=production
${'='.repeat(80)}
Current NODE_ENV: ${nodeEnv || '(not set)'}
CI: ${isCI}

Production mutation scripts require both CI=true AND NODE_ENV=production.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// CRITICAL GUARDS - Must pass or script exits
// ============================================================================

function enforceDeploymentGuards() {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // GUARD 1: CI-only execution enforcement (HARD GUARANTEE)
  // This is the PRIMARY safety mechanism - blocks ALL local execution
  enforceCIOnlyExecutionInline('deploy-db');
  
  // GUARD 2: Block production database locally
  const urlLower = (dbUrl || '').toLowerCase();
  const isProdDb = 
    urlLower.includes('pooler.supabase.com') ||
    urlLower.includes('supabase.com:5432') ||
    urlLower.includes('aws-0-eu-west-1') ||
    (urlLower.includes('supabase') && !urlLower.includes('localhost'));
  
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  
  if (isProdDb && !isCI && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production database URL detected in local/development context
${'='.repeat(80)}
Database URL pattern indicates production database.
CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

Production database access is BLOCKED outside CI/CD pipelines.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }
  
  // GUARD 2: Verify DATABASE_URL is set
  if (!dbUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // GUARD 3: Require verification passed (order-locked)
  deploymentState.requireVerificationPassed();
  
  // GUARD 5: Require backup completed (order-locked)
  deploymentState.requireBackupCompleted();
  
  // GUARD 6: Acquire deployment lock (prevent concurrent deployments)
  deploymentState.requireDeploymentLock();
  
  // GUARD 7: Set approved flag for Prisma wrapper
  process.env.PRISMA_DEPLOYMENT_APPROVED = 'true';
  
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  console.log('✅ Deployment guards passed');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   CI: ${isCI}`);
  console.log('   CI Enforcement: ✅ Passed');
  console.log('   Verification: ✅ Passed');
  console.log('   Backup: ✅ Completed');
  console.log('   Lock: ✅ Acquired');
}

// ============================================================================
// MIGRATION DEPLOYMENT - The ONLY action this script performs
// ============================================================================

function deployMigrations() {
  console.log('\n🚀 Deploying database migrations...');
  console.log('   This is the ONLY operation that mutates the production database.');
  console.log('   Command: npx prisma migrate deploy\n');
  
  try {
    // Step 1: Generate Prisma client (required before migrate deploy)
    console.log('📦 Generating Prisma client...');
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

function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DATABASE DEPLOYMENT (MUTATION ALLOWED)');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This script will modify the production database schema.');
  console.log('   This is the ONLY script allowed to mutate production.');
  console.log('   This script performs EXACTLY ONE action: prisma migrate deploy\n');
  
  // Step 1: Enforce guards (exits if failed)
  enforceDeploymentGuards();
  
  // Step 2: Deploy migrations (THE ONLY ACTION)
  deployMigrations();
  
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
