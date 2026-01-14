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

// ============================================================================
// CRITICAL GUARDS - Must pass or script exits
// ============================================================================

function enforceDeploymentGuards() {
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  // GUARD 1: Must be in production environment
  if (nodeEnv !== 'production') {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Database deployment requires NODE_ENV=production');
    console.error('='.repeat(80));
    console.error(`Current NODE_ENV: ${nodeEnv || '(not set)'}`);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // GUARD 2: Must be in CI environment (blocks local runs - PERMANENT)
  if (!isCI) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Database deployment requires CI=true');
    console.error('='.repeat(80));
    console.error(`Current CI: ${ci || '(not set)'}`);
    console.error('');
    console.error('Database migrations can ONLY be deployed from CI/CD pipelines.');
    console.error('Local runs are PERMANENTLY BLOCKED to prevent accidental mutations.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // GUARD 3: Verify DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // GUARD 4: Require verification passed (order-locked)
  deploymentState.requireVerificationPassed();
  
  // GUARD 5: Require backup completed (order-locked)
  deploymentState.requireBackupCompleted();
  
  // GUARD 6: Acquire deployment lock (prevent concurrent deployments)
  deploymentState.requireDeploymentLock();
  
  // GUARD 7: Set approved flag for Prisma wrapper
  process.env.PRISMA_DEPLOYMENT_APPROVED = 'true';
  
  console.log('✅ Deployment guards passed');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   CI: ${isCI}`);
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
