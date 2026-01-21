#!/usr/bin/env node

/**
 * Check for Failed Migrations (Regression Protection)
 * 
 * This script checks if any failed migrations exist in the database.
 * It MUST run before deploy-db.js to prevent P3009 errors.
 * 
 * This is a regression protection check - it ensures failed migrations
 * are resolved BEFORE migrate deploy is attempted.
 * 
 * Exit Codes:
 *   0 = No failed migrations found (safe to proceed)
 *   1 = Failed migrations found (deployment blocked)
 */

const { execSync } = require('child_process');

function checkFailedMigrations() {
  console.log('🔍 Checking for failed migrations (regression protection)...');
  
  try {
    // Generate Prisma client first
    execSync('npx prisma generate', {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    // Check migration status - this will fail if there are failed migrations
    const env = { ...process.env };
    if (process.env.DIRECT_URL) {
      env.DIRECT_URL = process.env.DIRECT_URL;
    }
    
    try {
      const status = execSync('npx prisma migrate status', {
        encoding: 'utf8',
        stdio: 'pipe',
        env: env
      });
      
      // Check output for failed migrations
      const statusOutput = String(status);
      
      if (statusOutput.includes('failed') || statusOutput.includes('P3009')) {
        console.error('❌ FAILED MIGRATIONS DETECTED');
        console.error('   Deployment is BLOCKED until failed migrations are resolved.');
        console.error('   Run: npm run resolve:failed:migrations');
        process.exit(1);
      }
      
      console.log('✅ No failed migrations found');
      return;
      
    } catch (error) {
      const errorOutput = String(error.stdout || error.stderr || error.message || '');
      
      // Check for P3009 error (failed migrations)
      if (errorOutput.includes('P3009') || 
          errorOutput.includes('found failed migrations') ||
          errorOutput.includes('failed migration')) {
        console.error('\n❌ FAILED MIGRATIONS DETECTED');
        console.error('   Prisma error P3009: Failed migrations found in database');
        console.error('   Deployment is BLOCKED until failed migrations are resolved.');
        console.error('');
        console.error('   Resolution required:');
        console.error('   1. Run: npm run resolve:failed:migrations');
        console.error('   2. Then retry deployment');
        console.error('');
        console.error('   Error details:');
        console.error(errorOutput.substring(0, 500));
        process.exit(1);
      }
      
      // Migration history mismatches are OK (will be resolved during deploy)
      if (errorOutput.includes('migrations have not yet been applied') ||
          errorOutput.includes('migrations from the database are not found locally')) {
        console.log('⚠️  Migration history mismatch (expected - will be resolved during deploy)');
        console.log('✅ No failed migrations - safe to proceed');
        return;
      }
      
      // Re-throw other errors
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Failed to check for failed migrations:', error.message);
    console.error('   Deployment is BLOCKED until check succeeds.');
    process.exit(1);
  }
}

if (require.main === module) {
  checkFailedMigrations();
}

module.exports = { checkFailedMigrations };
