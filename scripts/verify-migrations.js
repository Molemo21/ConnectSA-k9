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
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const env = { ...process.env };
    
    if (process.env.DIRECT_URL) {
      env.DATABASE_URL = process.env.DIRECT_URL;
      console.log('📡 Using DIRECT_URL for migration status check (bypassing connection pooler)');
    } else {
      console.log('⚠️  DIRECT_URL not set, using DATABASE_URL (may fail with connection pooling)');
    }
    
    // Step 3: Check migration status
    const status = execSync('npx prisma migrate status', {
      encoding: 'utf8',
      stdio: 'pipe',
      env: env
    });
    
    console.log(status);
    console.log('✅ Migration status check completed');
  } catch (error) {
    console.error('❌ Failed to check migration status:', error.message);
    if (error.stdout) console.error('Stdout:', error.stdout);
    if (error.stderr) console.error('Stderr:', error.stderr);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyMigrations();
}

module.exports = { verifyMigrations };
