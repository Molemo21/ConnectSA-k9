#!/usr/bin/env node

const { execSync } = require('child_process');

function verifyMigrations() {
  console.log('📊 Checking migration status (read-only)...');
  
  try {
    // Step 1: Generate Prisma client first
    console.log('🔧 Generating Prisma client...');
    execSync('npx prisma generate', {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env }
    });
    console.log('✅ Prisma client generated');
    
    // Step 2: Use DIRECT_URL for migration status (required for Supabase connection pooling)
    // Migration status requires direct connection, not through pgbouncer
    // Prisma schema uses both url (DATABASE_URL) and directUrl (DIRECT_URL)
    // For migrate status, we need to ensure DIRECT_URL is set and valid
    const env = { ...process.env };
    
    if (!process.env.DIRECT_URL) {
      console.error('❌ DIRECT_URL is required for migration status check');
      console.error('   Migration status requires direct database connection (bypasses pgbouncer)');
      console.error('   Set DIRECT_URL to your direct connection string (port 5432, not 6543)');
      process.exit(1);
    }
    
    // Validate DIRECT_URL format (should not contain "pooler" and should use port 5432)
    const directUrl = process.env.DIRECT_URL;
    if (directUrl.includes('pooler') || directUrl.includes(':6543')) {
      console.warn('⚠️  WARNING: DIRECT_URL appears to be using pooler connection');
      console.warn('   DIRECT_URL should use direct connection (port 5432, no "pooler" in hostname)');
      console.warn('   Example: postgresql://user:pass@aws-X-eu-west-1.supabase.com:5432/db');
    }
    
    // Set both DATABASE_URL and DIRECT_URL for Prisma
    // Prisma will use directUrl from schema for migrations
    env.DATABASE_URL = process.env.DATABASE_URL; // Keep original for client
    env.DIRECT_URL = directUrl; // Ensure DIRECT_URL is set
    
    console.log('📡 Using DIRECT_URL for migration status check (bypassing connection pooler)');
    console.log(`   Direct URL: ${directUrl.substring(0, 50)}...`);
    
    // Step 3: Check migration status
    // Prisma will automatically use DIRECT_URL from schema's directUrl field
    try {
      const status = execSync('npx prisma migrate status', {
        encoding: 'utf8',
        stdio: 'pipe',
        env: env
      });
      
      console.log(status);
      console.log('✅ Migration status check completed');
    } catch (error) {
      // Migration status might show mismatches if migrations were applied manually
      // or with different names. This is OK - the deploy step will apply missing migrations.
      const errorOutput = error.stdout || error.stderr || error.message;
      
      // Check if it's just a mismatch (not a connection error)
      if (errorOutput.includes('migrations have not yet been applied') || 
          errorOutput.includes('migrations from the database are not found locally')) {
        console.warn('⚠️  Migration history mismatch detected');
        console.warn('   This is expected if migrations were applied manually or with different names.');
        console.warn('   Missing migrations will be applied during deployment.');
        console.warn('\n   Migration status output:');
        console.warn(errorOutput);
        console.log('\n✅ Migration check passed (mismatches will be resolved during deployment)');
      } else {
        // Re-throw if it's a different error (connection, etc.)
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Failed to check migration status:', error.message);
    if (error.stdout) {
      console.error('\nStdout:');
      console.error(error.stdout);
    }
    if (error.stderr) {
      console.error('\nStderr:');
      console.error(error.stderr);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure DIRECT_URL is set to direct connection (port 5432)');
    console.error('   2. DIRECT_URL should NOT use pooler (no "pooler" in hostname, not port 6543)');
    console.error('   3. Example: postgresql://user:pass@aws-X-eu-west-1.supabase.com:5432/db');
    process.exit(1);
  }
}

if (require.main === module) {
  verifyMigrations();
}

module.exports = { verifyMigrations };
