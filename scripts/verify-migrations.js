#!/usr/bin/env node

const { execSync } = require('child_process');

function verifyMigrations() {
  console.log('📊 Checking migration status (read-only)...');
  
  try {
    const status = execSync('npx prisma migrate status', {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    console.log(status);
    console.log('✅ Migration status check completed');
  } catch (error) {
    console.error('❌ Failed to check migration status:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyMigrations();
}

module.exports = { verifyMigrations };
