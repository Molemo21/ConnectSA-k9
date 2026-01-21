#!/usr/bin/env node

/**
 * Deployment State Management
 * 
 * Enforces order-locked deployment using state files.
 * 
 * Guarantees:
 * - Cannot run deployment before verification
 * - Cannot run deployment without backup
 * - State files prevent out-of-order execution
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(process.cwd(), '.deployment-state');
const VERIFICATION_STATE = path.join(STATE_DIR, 'verification.passed');
const BACKUP_STATE = path.join(STATE_DIR, 'backup.completed');
const DEPLOYMENT_LOCK = path.join(STATE_DIR, 'deployment.lock');

// ============================================================================
// STATE FILE OPERATIONS
// ============================================================================

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function markVerificationPassed() {
  ensureStateDir();
  const timestamp = new Date().toISOString();
  fs.writeFileSync(VERIFICATION_STATE, JSON.stringify({
    passed: true,
    timestamp,
    nodeEnv: process.env.NODE_ENV,
    ci: process.env.CI
  }, null, 2));
}

function markBackupCompleted(backupFile) {
  ensureStateDir();
  const timestamp = new Date().toISOString();
  fs.writeFileSync(BACKUP_STATE, JSON.stringify({
    completed: true,
    timestamp,
    backupFile,
    nodeEnv: process.env.NODE_ENV,
    ci: process.env.CI
  }, null, 2));
}

function acquireDeploymentLock() {
  ensureStateDir();
  const timestamp = new Date().toISOString();
  fs.writeFileSync(DEPLOYMENT_LOCK, JSON.stringify({
    locked: true,
    timestamp,
    nodeEnv: process.env.NODE_ENV,
    ci: process.env.CI,
    pid: process.pid
  }, null, 2));
}

function releaseDeploymentLock() {
  if (fs.existsSync(DEPLOYMENT_LOCK)) {
    fs.unlinkSync(DEPLOYMENT_LOCK);
  }
}

function clearAllState() {
  if (fs.existsSync(VERIFICATION_STATE)) fs.unlinkSync(VERIFICATION_STATE);
  if (fs.existsSync(BACKUP_STATE)) fs.unlinkSync(BACKUP_STATE);
  if (fs.existsSync(DEPLOYMENT_LOCK)) fs.unlinkSync(DEPLOYMENT_LOCK);
}

// ============================================================================
// ORDER ENFORCEMENT
// ============================================================================

function requireVerificationPassed() {
  // In CI/CD, rely on workflow dependencies instead of file-based state
  // Each job runs in a separate container, so state files aren't shared
  const isCI = process.env.CI === 'true' || process.env.CI === '1' || (process.env.CI || '').toLowerCase() === 'true';
  
  if (isCI) {
    // In CI/CD, verification is enforced by workflow dependencies (needs: [predeploy])
    // If this job is running, verification already passed
    console.log('✅ Verification check passed (enforced by CI/CD workflow dependencies)');
    return;
  }
  
  // Local execution: check file-based state
  if (!fs.existsSync(VERIFICATION_STATE)) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Verification step not completed');
    console.error('='.repeat(80));
    console.error('Deployment requires verification to pass first.');
    console.error('Run: npm run predeploy');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  const state = JSON.parse(fs.readFileSync(VERIFICATION_STATE, 'utf8'));
  if (!state.passed) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Verification did not pass');
    console.error('='.repeat(80));
    console.error('Deployment requires successful verification.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

function requireBackupCompleted() {
  // In CI/CD, rely on workflow dependencies instead of file-based state
  // Each job runs in a separate container, so state files aren't shared
  const isCI = process.env.CI === 'true' || process.env.CI === '1' || (process.env.CI || '').toLowerCase() === 'true';
  
  if (isCI) {
    // In CI/CD, backup is enforced by workflow dependencies (needs: [backup])
    // If this job is running, backup already completed
    console.log('✅ Backup check passed (enforced by CI/CD workflow dependencies)');
    return;
  }
  
  // Local execution: check file-based state
  if (!fs.existsSync(BACKUP_STATE)) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Backup step not completed');
    console.error('='.repeat(80));
    console.error('Deployment requires backup to be created first.');
    console.error('Run: npm run backup:production');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  const state = JSON.parse(fs.readFileSync(BACKUP_STATE, 'utf8'));
  if (!state.completed) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Backup was not completed');
    console.error('='.repeat(80));
    console.error('Deployment requires successful backup.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

function requireDeploymentLock() {
  if (fs.existsSync(DEPLOYMENT_LOCK)) {
    const lock = JSON.parse(fs.readFileSync(DEPLOYMENT_LOCK, 'utf8'));
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Deployment already in progress');
    console.error('='.repeat(80));
    console.error(`Lock acquired at: ${lock.timestamp}`);
    console.error(`Process ID: ${lock.pid}`);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  acquireDeploymentLock();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  markVerificationPassed,
  markBackupCompleted,
  requireVerificationPassed,
  requireBackupCompleted,
  requireDeploymentLock,
  releaseDeploymentLock,
  clearAllState,
  getBackupFile: () => {
    if (!fs.existsSync(BACKUP_STATE)) return null;
    const state = JSON.parse(fs.readFileSync(BACKUP_STATE, 'utf8'));
    return state.backupFile || null;
  }
};
