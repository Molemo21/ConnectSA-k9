#!/usr/bin/env node

/**
 * Prisma CLI Wrapper - Enforces npm script execution
 * 
 * This wrapper ensures Prisma commands can ONLY be executed through npm scripts.
 * Direct Prisma CLI usage (e.g., `npx prisma db push`) is blocked.
 * 
 * How it works:
 * - Checks if execution is via npm script (npm_lifecycle_event is set)
 * - If not via npm, blocks execution with clear error
 * - If via npm, passes through to actual Prisma CLI
 * 
 * This script is installed as the Prisma binary via postinstall hook.
 */

const { spawn } = require('child_process');
const path = require('path');

// Check if we're being run via npm script
function isRunningViaNpmScript() {
  // npm sets this environment variable when running scripts
  const npmLifecycleEvent = process.env.npm_lifecycle_event;
  
  // Also check npm_config_user_agent
  const npmUserAgent = process.env.npm_config_user_agent;
  
  // Check if we're in an npm script context
  if (npmLifecycleEvent) {
    return true;
  }
  
  // Check if parent process is npm
  if (npmUserAgent && npmUserAgent.includes('npm')) {
    return true;
  }
  
  return false;
}

// Get the actual Prisma binary path
function getPrismaBinaryPath() {
  // Try to find Prisma in node_modules
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', '.bin', 'prisma'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'cli', 'build', 'index.js'),
    path.join(__dirname, '..', 'node_modules', '.bin', 'prisma'),
  ];
  
  for (const prismaPath of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(prismaPath)) {
        return prismaPath;
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  // Fallback: use npx to find Prisma
  return 'prisma';
}

// Main execution
function main() {
  // Check if this is a direct invocation (not via npm script)
  if (!isRunningViaNpmScript()) {
    const command = process.argv.slice(2).join(' ') || 'unknown command';
    
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Direct Prisma CLI usage is not allowed');
    console.error('='.repeat(80));
    console.error('');
    console.error('Prisma commands must be executed through npm scripts to ensure');
    console.error('environment validation and safety checks are applied.');
    console.error('');
    console.error(`Attempted command: prisma ${command}`);
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
    console.error('   Instead of: npx prisma migrate deploy');
    console.error('   Use:        npm run db:migrate:deploy');
    console.error('');
    console.error('   Instead of: npx prisma migrate reset');
    console.error('   Use:        npm run db:reset');
    console.error('');
    console.error('   Instead of: npx prisma studio');
    console.error('   Use:        npm run db:studio');
    console.error('');
    console.error('   See package.json for all available Prisma commands.');
    console.error('');
    console.error('='.repeat(80) + '\n');
    
    process.exit(1);
  }
  
  // If we get here, we're running via npm script - pass through to Prisma
  const prismaPath = getPrismaBinaryPath();
  const prismaArgs = process.argv.slice(2);
  
  // Spawn the actual Prisma process
  const prismaProcess = spawn(prismaPath, prismaArgs, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  
  prismaProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  prismaProcess.on('error', (error) => {
    console.error('Failed to execute Prisma:', error);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

module.exports = { main, isRunningViaNpmScript };
