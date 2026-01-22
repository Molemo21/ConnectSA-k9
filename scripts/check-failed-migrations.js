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
      
      // Only fail on actual failed migrations, not history mismatches
      if (statusOutput.includes('P3009') || 
          statusOutput.includes('found failed migrations') ||
          (statusOutput.includes('failed') && statusOutput.includes('migration') && !statusOutput.includes('have not yet been applied'))) {
        console.error('❌ FAILED MIGRATIONS DETECTED');
        console.error('   Deployment is BLOCKED until failed migrations are resolved.');
        console.error('   Run: npm run resolve:failed:migrations');
        process.exit(1);
      }
      
      console.log('✅ No failed migrations found');
      return;
      
    } catch (error) {
      const errorOutput = String(error.stdout || error.stderr || error.message || '');
      const errorMessage = String(error.message || '');
      
      // Check for P3009 error (failed migrations) - this is the critical check
      if (errorOutput.includes('P3009') || 
          errorMessage.includes('P3009') ||
          errorOutput.includes('found failed migrations') ||
          errorMessage.includes('found failed migrations') ||
          (errorOutput.includes('failed') && errorOutput.includes('migration') && 
           !errorOutput.includes('have not yet been applied') &&
           !errorOutput.includes('not found locally'))) {
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
      // These are NOT failed migrations - they're just mismatched history
      const isMigrationMismatch = 
        errorOutput.includes('migrations have not yet been applied') ||
        errorOutput.includes('migrations from the database are not found locally') ||
        errorOutput.includes('local migration history and the migrations table') ||
        errorMessage.includes('migrations have not yet been applied') ||
        errorMessage.includes('migrations from the database are not found locally') ||
        errorMessage.includes('local migration history and the migrations table');
      
      // Check if the error is about the "production" folder being treated as a migration
      const isProductionFolderError = 
        errorOutput.includes('Following migration have not yet been applied:\nproduction') ||
        errorOutput.includes('migration have not yet been applied:\nproduction') ||
        (errorOutput.includes('production') && errorOutput.includes('migrations found') && 
         errorOutput.includes('have not yet been applied'));
      
      if (isMigrationMismatch || isProductionFolderError) {
        if (isProductionFolderError) {
          console.log('⚠️  Prisma is treating "production" folder as a migration');
          console.log('   The "production" folder contains SQL scripts, not migrations.');
          console.log('   This will be handled during deployment - the folder will be ignored.');
        } else {
          console.log('⚠️  Migration history mismatch (expected - will be resolved during deploy)');
          console.log('   This is NOT a failed migration - just a history mismatch.');
        }
        console.log('✅ No failed migrations detected - safe to proceed');
        return;
      }
      
      // Re-throw other errors (connection issues, etc.)
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
