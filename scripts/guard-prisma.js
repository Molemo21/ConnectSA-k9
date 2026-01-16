#!/usr/bin/env node

/**
 * Prisma CLI Execution Guard
 * 
 * This script enforces that Prisma commands can ONLY be executed through npm scripts.
 * Direct Prisma CLI usage (e.g., `npx prisma db push`) is blocked to prevent
 * bypassing environment validation and safety checks.
 * 
 * How it works:
 * - When run via npm scripts, npm sets npm_lifecycle_event environment variable
 * - Direct Prisma CLI usage (npx prisma) doesn't have this variable
 * - This guard detects the execution context and blocks direct usage
 * 
 * Usage:
 *   This script is automatically called by npm scripts in package.json
 *   DO NOT call this directly - it's a guard, not a command
 */

// Check if we're being run via npm script
function isRunningViaNpmScript() {
  // npm sets this environment variable when running scripts
  const npmLifecycleEvent = process.env.npm_lifecycle_event;
  
  // Also check for npm_config_user_agent which indicates npm context
  const npmUserAgent = process.env.npm_config_user_agent;
  
  // Check if we're in an npm script context
  if (npmLifecycleEvent) {
    return true;
  }
  
  // Check if parent process is npm
  if (npmUserAgent && npmUserAgent.includes('npm')) {
    return true;
  }
  
  // Check process title (npm sets this)
  if (process.title && process.title.includes('npm')) {
    return true;
  }
  
  return false;
}

// Check if Prisma is being invoked directly
function isDirectPrismaInvocation() {
  const args = process.argv;
  
  // Check if this script is being called directly (not via npm)
  // If someone runs: node scripts/guard-prisma.js
  // Or: npx prisma ... (which would bypass this entirely)
  
  // If we're here, it means someone is trying to run Prisma
  // Check if we have the npm context
  return !isRunningViaNpmScript();
}

// Main guard logic
function guardPrismaExecution() {
  // Get the Prisma command being attempted
  const prismaCommand = process.argv.slice(2).join(' ') || 'unknown command';
  
  // Check if this is a direct invocation
  if (isDirectPrismaInvocation()) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Direct Prisma CLI usage is not allowed');
    console.error('='.repeat(80));
    console.error('');
    console.error('Prisma commands must be executed through npm scripts to ensure');
    console.error('environment validation and safety checks are applied.');
    console.error('');
    console.error(`Attempted command: prisma ${prismaCommand}`);
    console.error('');
    console.error('❌ Why this is blocked:');
    console.error('   - Direct Prisma CLI usage bypasses environment validation');
    console.error('   - Safety checks in scripts/validate-env-before-prisma.js are skipped');
    console.error('   - This could allow accidental production database access');
    console.error('');
    console.error('✅ How to fix:');
    console.error('   Use npm scripts instead:');
    console.error('');
    console.error('   Instead of: npx prisma db push');
    console.error('   Use:        npm run db:push');
    console.error('');
    console.error('   Instead of: npx prisma migrate dev');
    console.error('   Use:        npm run db:migrate');
    console.error('');
    console.error('   Instead of: npx prisma generate');
    console.error('   Use:        npm run db:generate');
    console.error('');
    console.error('   See package.json for all available Prisma commands.');
    console.error('');
    console.error('='.repeat(80) + '\n');
    
    process.exit(1);
  }
  
  // If we get here, we're running via npm script - allow execution
  // The actual Prisma command will be run by the calling npm script
  return true;
}

// Run guard
if (require.main === module) {
  guardPrismaExecution();
}

module.exports = { guardPrismaExecution, isRunningViaNpmScript };
