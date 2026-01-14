#!/usr/bin/env node

/**
 * Production Database Backup (READ-ONLY)
 * 
 * Creates a database backup before deployment.
 * This is a separate, explicit step that fails fast on error.
 * 
 * Safety Guards:
 * - Requires NODE_ENV=production
 * - Requires CI=true
 * - Fails immediately if backup cannot be created
 * 
 * Exit Codes:
 *   0 = Backup created successfully
 *   1 = Backup failed (exits immediately, aborts pipeline)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const deploymentState = require('./deployment-state');

// ============================================================================
// GUARDS - Fail immediately if conditions not met
// ============================================================================

function enforceBackupGuards() {
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  if (nodeEnv !== 'production') {
    console.error('\n🚨 BLOCKED: Backup requires NODE_ENV=production');
    process.exit(1);
  }
  
  if (!isCI) {
    console.error('\n🚨 BLOCKED: Backup requires CI=true');
    process.exit(1);
  }
}

// ============================================================================
// BACKUP CREATION - Fail fast on error
// ============================================================================

function createBackup() {
  console.log('📦 Creating production database backup...');
  
  const backupDir = './database-backups';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-pre-deployment-${timestamp}.sql`);
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL not set');
    process.exit(1);
  }
  
  try {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;
    
    if (!host || !database || !username || !password) {
      console.error('❌ ERROR: Invalid DATABASE_URL format');
      process.exit(1);
    }
    
    // Set password for pg_dump
    process.env.PGPASSWORD = password;
    
    // Create backup - FAIL FAST if this fails
    console.log(`   Backup file: ${backupFile}`);
    
    execSync(
      `pg_dump -h "${host}" -p "${port}" -U "${username}" -d "${database}" -F c -f "${backupFile}"`,
      { stdio: 'inherit' }
    );
    
    // Verify backup file exists and has content
    if (!fs.existsSync(backupFile)) {
      console.error('❌ ERROR: Backup file was not created');
      process.exit(1);
    }
    
    const stats = fs.statSync(backupFile);
    if (stats.size === 0) {
      console.error('❌ ERROR: Backup file is empty');
      fs.unlinkSync(backupFile);
      process.exit(1);
    }
    
    console.log(`✅ Backup created: ${backupFile} (${stats.size} bytes)`);
    console.log(`   Backup location: ${path.resolve(backupFile)}`);
    
    // Mark backup as completed (order-locked)
    deploymentState.markBackupCompleted(backupFile);
    
    // Clear password from environment
    delete process.env.PGPASSWORD;
    
  } catch (error) {
    // Clear password from environment on error
    delete process.env.PGPASSWORD;
    
    console.error('❌ ERROR: Backup creation failed:', error.message);
    console.error('   Deployment is BLOCKED until backup succeeds.');
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📦 PRODUCTION DATABASE BACKUP');
  console.log('='.repeat(80));
  
  enforceBackupGuards();
  createBackup();
  
  console.log('\n✅ Backup step completed successfully\n');
}

if (require.main === module) {
  main();
}

module.exports = { createBackup };
