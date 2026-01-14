#!/usr/bin/env node

/**
 * Security Script: Block Local Production Mode
 * 
 * This script prevents production mode from running on local machines.
 * Production mode can ONLY run in CI/CD or Vercel environments.
 * 
 * This is a hard security requirement to prevent production credentials
 * from existing on local developer machines.
 */

function blockLocalProduction() {
  // Check if we're in production mode
  if (process.env.NODE_ENV !== 'production') {
    // Not production mode, allow
    return true;
  }

  // Check if we're in a valid production environment
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  
  if (isCI || isVercel) {
    // Valid production environment, allow
    return true;
  }

  // Production mode on local machine - BLOCK
  console.error('\n' + '='.repeat(80));
  console.error('🚨 CRITICAL SECURITY ERROR: Production mode cannot run locally');
  console.error('='.repeat(80));
  console.error('');
  console.error('Production mode (NODE_ENV=production) is BLOCKED on local machines');
  console.error('for security reasons. Production credentials must never exist locally.');
  console.error('');
  console.error('This is a hard security requirement and cannot be bypassed.');
  console.error('');
  console.error('Allowed environments for production mode:');
  console.error('  - Vercel (VERCEL=1 or VERCEL_ENV set)');
  console.error('  - CI/CD pipelines (CI=true or GITHUB_ACTIONS=true)');
  console.error('');
  console.error('For local development:');
  console.error('  - Use NODE_ENV=development (default)');
  console.error('  - Use development database credentials');
  console.error('  - Never set NODE_ENV=production locally');
  console.error('='.repeat(80) + '\n');
  
  return false;
}

// Run check
if (require.main === module) {
  const allowed = blockLocalProduction();
  if (!allowed) {
    process.exit(1);
  }
}

module.exports = { blockLocalProduction };
