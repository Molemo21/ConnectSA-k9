#!/usr/bin/env node

/**
 * Pre-Deployment Verification Orchestrator (READ-ONLY)
 * 
 * Thin orchestrator that runs individual verification checks in sequence.
 * Each check is a separate, single-purpose script that fails fast.
 * 
 * This script does NOT perform any checks itself - it only orchestrates.
 * All actual verification logic is in separate scripts.
 * 
 * Exit Codes:
 *   0 = All checks passed
 *   1 = Any check failed (exits immediately)
 */

const { execSync } = require('child_process');
const path = require('path');
const deploymentState = require('./deployment-state');

const VERIFICATION_STEPS = [
  { name: 'Safety Guards', script: 'verify-safety-guards.js' },
  { name: 'Environment', script: 'verify-env.js' },
  { name: 'Migrations', script: 'verify-migrations.js' },
  { name: 'Connection', script: 'verify-connection.js' },
  { name: 'Schema', script: 'verify-schema.js' },
];

function runVerificationStep(step) {
  const scriptPath = path.join(__dirname, step.script);
  
  console.log(`\n[STEP] ${step.name}...`);
  
  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log(`✅ ${step.name} passed`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${step.name} FAILED`);
    console.error(`   Script: ${step.script}`);
    console.error(`   Exit code: ${error.status || 1}`);
    return false;
  }
}

function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 PRE-DEPLOYMENT VERIFICATION (READ-ONLY)');
  console.log('='.repeat(80));
  console.log('\nRunning verification checks in sequence...');
  console.log('Each check must pass or deployment is BLOCKED.\n');
  
  for (const step of VERIFICATION_STEPS) {
    if (!runVerificationStep(step)) {
      console.log('\n' + '='.repeat(80));
      console.log('❌ PRE-DEPLOYMENT VERIFICATION FAILED');
      console.log('='.repeat(80));
      console.log(`\nFailed at: ${step.name}`);
      console.log('Deployment is BLOCKED. Fix the issue above and retry.\n');
      process.exit(1);
    }
  }
  
  // Mark verification as passed (order-locked)
  deploymentState.markVerificationPassed();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ PRE-DEPLOYMENT VERIFICATION PASSED');
  console.log('='.repeat(80));
  console.log('\nAll checks passed. Safe to proceed with backup and deployment.\n');
}

if (require.main === module) {
  main();
}

module.exports = { main };
