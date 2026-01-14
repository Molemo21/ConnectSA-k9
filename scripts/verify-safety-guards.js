#!/usr/bin/env node

/**
 * Safety Guards Verification (READ-ONLY)
 * 
 * Verifies that environment conditions are met for production operations.
 * This is a single-purpose check that fails fast if conditions are not met.
 * 
 * Exit Codes:
 *   0 = Guards passed
 *   1 = Guards failed (exits immediately)
 */

function verifySafetyGuards() {
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  // GUARD 1: Must be in production environment
  if (nodeEnv !== 'production') {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Requires NODE_ENV=production');
    console.error('='.repeat(80));
    console.error(`Current NODE_ENV: ${nodeEnv || '(not set)'}`);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // GUARD 2: Must be in CI environment
  if (!isCI) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Requires CI=true');
    console.error('='.repeat(80));
    console.error(`Current CI: ${ci || '(not set)'}`);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  console.log('✅ Safety guards verified');
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   CI: ${isCI}`);
}

if (require.main === module) {
  verifySafetyGuards();
}

module.exports = { verifySafetyGuards };
