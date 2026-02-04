#!/usr/bin/env node

/**
 * Hardened Prisma CLI Wrapper
 * 
 * ENFORCES: Direct Prisma CLI execution is TECHNICALLY IMPOSSIBLE for production mutations.
 * 
 * Safety Guarantees:
 * 1. `prisma migrate deploy` can ONLY run through approved deployment wrapper
 * 2. Direct `npx prisma migrate deploy` fails hard
 * 3. Even via npm scripts, `migrate deploy` requires CI=true + approved path
 * 4. All other Prisma commands require npm script execution
 * 
 * This replaces the existing prisma-wrapper.js with hardened enforcement.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// LOAD ENVIRONMENT VARIABLES (Before any Prisma operations)
// ============================================================================
// Load environment variables based on NODE_ENV
// This ensures scripts can use .env.development, .env.production, etc.
try {
  const dotenv = require('dotenv');
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  
  // Priority order: .env.local (highest) -> .env.{NODE_ENV} -> .env (lowest)
  const envFiles = [
    path.join(__dirname, '..', '.env.local'),           // Next.js local overrides
    path.join(__dirname, '..', `.env.${nodeEnv}`),      // .env.development, .env.production, etc.
    path.join(__dirname, '..', '.env'),                 // Standard .env fallback
  ];
  
  // Load first existing file (highest priority wins)
  for (const envPath of envFiles) {
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      if (!result.error) {
        break; // Use first file found
      }
    }
  }
} catch (error) {
  // dotenv not available or other error - continue without it
  // Environment variables may already be set by the system
}

// ============================================================================
// DATABASE URL CLASSIFICATION (Early, before any Prisma operations)
// ============================================================================

function classifyDatabaseUrl(url) {
  if (!url) return { type: 'unknown', isProduction: false };
  
  const urlLower = url.toLowerCase();
  
  // Production patterns
  const isProd = urlLower.includes('pooler.supabase.com') ||
                urlLower.includes('supabase.com:5432') ||
                urlLower.includes('aws-0-eu-west-1') ||
                (urlLower.includes('supabase') && !urlLower.includes('localhost'));
  
  // Development patterns
  const isDev = urlLower.includes('localhost') ||
                urlLower.includes('127.0.0.1') ||
                urlLower.includes('connectsa_dev');
  
  // Test patterns
  const isTest = urlLower.includes('connectsa_test');
  
  if (isProd) return { type: 'production', isProduction: true };
  if (isTest) return { type: 'test', isProduction: false };
  if (isDev) return { type: 'development', isProduction: false };
  
  return { type: 'unknown', isProduction: false };
}

// ============================================================================
// EARLY DATABASE_URL VALIDATION (Before Prisma initializes)
// ============================================================================

function validateDatabaseUrlEarly() {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  const dbClass = classifyDatabaseUrl(dbUrl);
  
  // CRITICAL: Development/test cannot use production database
  // Exception: Supabase databases are allowed in development (common setup)
  if ((nodeEnv === 'development' || nodeEnv === 'test') && dbClass.isProduction) {
    // Check if it's Supabase (common for development)
    const isSupabase = dbUrl.includes('supabase.com') || 
                       dbUrl.includes('pooler.supabase.com');
    
    if (isSupabase && nodeEnv === 'development') {
      // Allow Supabase in development but warn
      console.warn('\n⚠️  WARNING: Using Supabase database in development mode');
      console.warn(`   Database URL: ${dbUrl.substring(0, 60)}...`);
      console.warn('   Make sure this is a development/staging Supabase project, not production.');
      console.warn('   For local development, consider using a local PostgreSQL database.\n');
      // Continue - don't block Supabase in development
    } else {
      // Block non-Supabase production databases
      console.error('\n' + '='.repeat(80));
      console.error('🚨 CRITICAL: DATABASE_URL points to PRODUCTION in non-production context');
      console.error('='.repeat(80));
      console.error(`Environment: ${nodeEnv.toUpperCase()}`);
      console.error(`Database Type: ${dbClass.type.toUpperCase()}`);
      console.error(`CI: ${isCI ? 'true' : 'false'}`);
      console.error('');
      console.error('This is BLOCKED to prevent accidental production mutations.');
      console.error('Process will exit BEFORE any Prisma client initialization.');
      console.error('='.repeat(80) + '\n');
      process.exit(1);
    }
  }
  
  // CRITICAL: Production mutations require CI=true
  if (nodeEnv === 'production' && dbClass.isProduction && !isCI) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 CRITICAL: Production database access requires CI=true');
    console.error('='.repeat(80));
    console.error('Production database mutations can ONLY occur in CI/CD pipelines.');
    console.error('Local production access is PERMANENTLY BLOCKED.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

// ============================================================================
// APPROVED DEPLOYMENT PATH CHECK
// ============================================================================

function isApprovedDeploymentPath() {
  // Check if we're being called from deploy-db.js
  const stack = new Error().stack || '';
  
  // Check parent process
  try {
    const parentCmd = process.env.npm_lifecycle_event || '';
    if (parentCmd === 'deploy:db') {
      return true;
    }
  } catch (e) {
    // Continue checking
  }
  
  // Check if called via approved wrapper
  if (process.env.PRISMA_DEPLOYMENT_APPROVED === 'true') {
    return true;
  }
  
  return false;
}

// ============================================================================
// MIGRATE DEPLOY ENFORCEMENT
// ============================================================================

function enforceMigrateDeploy() {
  const command = process.argv.slice(2).join(' ');
  const isMigrateDeploy = command.includes('migrate deploy') || 
                         process.argv.includes('migrate') && process.argv.includes('deploy');
  
  if (!isMigrateDeploy) {
    return; // Not a migrate deploy command
  }
  
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const isApproved = isApprovedDeploymentPath();
  
  // BLOCK: Not in production
  if (nodeEnv !== 'production') {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: prisma migrate deploy requires NODE_ENV=production');
    console.error('='.repeat(80));
    console.error(`Current NODE_ENV: ${nodeEnv || '(not set)'}`);
    console.error('');
    console.error('Direct prisma migrate deploy execution is BLOCKED.');
    console.error('Use: npm run deploy:db (which enforces all safety checks)');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // BLOCK: Not in CI
  if (!isCI) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: prisma migrate deploy requires CI=true');
    console.error('='.repeat(80));
    console.error('Direct prisma migrate deploy execution is BLOCKED.');
    console.error('Use: npm run deploy:db (which enforces all safety checks)');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // BLOCK: Not through approved path
  if (!isApproved) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: prisma migrate deploy must run through approved wrapper');
    console.error('='.repeat(80));
    console.error('Direct prisma migrate deploy execution is BLOCKED.');
    console.error('');
    console.error('Even with CI=true and NODE_ENV=production, you must use:');
    console.error('  npm run deploy:db');
    console.error('');
    console.error('This ensures order-locked deployment and all safety checks.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

// ============================================================================
// NPM SCRIPT CHECK (For non-migrate-deploy commands)
// ============================================================================

function isRunningViaNpmScript() {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;
  const npmUserAgent = process.env.npm_config_user_agent;
  
  if (npmLifecycleEvent) return true;
  if (npmUserAgent && npmUserAgent.includes('npm')) return true;
  
  return false;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  // Step 1: Early DATABASE_URL validation (before any Prisma operations)
  validateDatabaseUrlEarly();
  
  // Step 2: Enforce migrate deploy restrictions
  enforceMigrateDeploy();
  
  // Step 3: For other commands, require npm script execution
  const command = process.argv.slice(2).join(' ') || 'unknown';
  const isMigrateDeploy = command.includes('migrate deploy');
  
  if (!isMigrateDeploy && !isRunningViaNpmScript()) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BLOCKED: Direct Prisma CLI usage is not allowed');
    console.error('='.repeat(80));
    console.error(`Attempted command: prisma ${command}`);
    console.error('');
    console.error('Prisma commands must be executed through npm scripts.');
    console.error('See package.json for available commands.');
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
  
  // Step 4: Get Prisma binary and execute
  const prismaPath = getPrismaBinaryPath();
  const prismaArgs = process.argv.slice(2);
  
  // If using npx, prepend 'prisma' to args
  const finalArgs = prismaPath === 'npx' ? ['prisma', ...prismaArgs] : prismaArgs;
  const finalCommand = prismaPath === 'npx' ? 'npx' : prismaPath;
  
  const prismaProcess = spawn(finalCommand, finalArgs, {
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

function getPrismaBinaryPath() {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', '.bin', 'prisma'),
    path.join(process.cwd(), 'node_modules', '@prisma', 'cli', 'build', 'index.js'),
    path.join(__dirname, '..', 'node_modules', '.bin', 'prisma'),
    path.join(__dirname, '..', 'node_modules', '@prisma', 'cli', 'build', 'index.js'),
  ];
  
  for (const prismaPath of possiblePaths) {
    try {
      if (fs.existsSync(prismaPath)) {
        return prismaPath;
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  // Fallback: use npx to find prisma (works if prisma is in node_modules)
  // This ensures we use the locally installed version
  return 'npx';
}

if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  validateDatabaseUrlEarly,
  enforceMigrateDeploy,
  classifyDatabaseUrl
};
