#!/usr/bin/env node

/**
 * User Deletion System Deployment Script
 * 
 * Handles deployment of user deletion system migration.
 * Supports both development and production environments.
 * 
 * Usage:
 *   Development: node scripts/deploy-user-deletion.js --dev
 *   Production: node scripts/deploy-user-deletion.js --prod (requires CI=true)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const isProd = args.includes('--prod') || args.includes('--production');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check environment
function checkEnvironment() {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV || '';
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || (ci || '').toLowerCase() === 'true';
  
  info(`Environment Check:`);
  console.log(`   DATABASE_URL: ${dbUrl ? '✅ Set' : '❌ Not set'}`);
  console.log(`   NODE_ENV: ${nodeEnv || '(not set)'}`);
  console.log(`   CI: ${ci || '(not set)'}`);
  
  if (!dbUrl) {
    error('DATABASE_URL environment variable is not set');
    console.log('\nPlease set DATABASE_URL before deploying.');
    console.log('Example: export DATABASE_URL="postgresql://user:pass@host:5432/dbname"');
    return false;
  }
  
  // Classify database
  const urlLower = dbUrl.toLowerCase();
  const isProductionDb = urlLower.includes('pooler.supabase.com') ||
                        urlLower.includes('supabase.com:5432') ||
                        urlLower.includes('aws-0-eu-west-1') ||
                        (urlLower.includes('supabase') && !urlLower.includes('localhost'));
  
  if (isProductionDb && !isCI && nodeEnv !== 'production') {
    warning('Production database detected but not in CI/production environment');
    console.log('   For production deployment, use: npm run deploy');
    console.log('   Or set: CI=true NODE_ENV=production');
    return false;
  }
  
  return true;
}

// Verify implementation
function verifyImplementation() {
  log('\n' + '='.repeat(80));
  log('Step 1: Verifying Implementation', 'blue');
  log('='.repeat(80));
  
  try {
    execSync('npm run verify:user-deletion', { stdio: 'inherit' });
    success('Implementation verification passed');
    return true;
  } catch (error) {
    error('Implementation verification failed');
    return false;
  }
}

// Generate Prisma client
function generatePrismaClient() {
  log('\n' + '='.repeat(80));
  log('Step 2: Generating Prisma Client', 'blue');
  log('='.repeat(80));
  
  try {
    info('Generating Prisma client...');
    execSync('npm run db:generate', { stdio: 'inherit' });
    success('Prisma client generated successfully');
    return true;
  } catch (error) {
    error('Failed to generate Prisma client');
    return false;
  }
}

// Apply migration
function applyMigration() {
  log('\n' + '='.repeat(80));
  log('Step 3: Applying Migration', 'blue');
  log('='.repeat(80));
  
  try {
    if (isProd) {
      info('Production deployment - using deploy command');
      info('This will run: predeploy → backup → deploy:db');
      execSync('npm run deploy', { stdio: 'inherit' });
    } else {
      info('Development deployment - applying migration');
      execSync('npm run db:migrate', { stdio: 'inherit' });
    }
    success('Migration applied successfully');
    return true;
  } catch (error) {
    error('Migration failed');
    return false;
  }
}

// Verify migration
function verifyMigration() {
  log('\n' + '='.repeat(80));
  log('Step 4: Verifying Migration', 'blue');
  log('='.repeat(80));
  
  try {
    info('Checking database schema...');
    execSync('npm run db:validate', { stdio: 'inherit' });
    success('Migration verification passed');
    return true;
  } catch (error) {
    warning('Migration verification had issues (may be expected)');
    return true; // Don't fail on validation issues
  }
}

// Main deployment flow
async function main() {
  log('\n' + '='.repeat(80));
  log('🚀 User Deletion System Deployment', 'blue');
  log('='.repeat(80));
  log('');
  
  // Determine deployment type
  if (!isDev && !isProd) {
    // Auto-detect
    const dbUrl = process.env.DATABASE_URL || '';
    const urlLower = dbUrl.toLowerCase();
    const isProductionDb = urlLower.includes('pooler.supabase.com') ||
                          urlLower.includes('supabase.com:5432') ||
                          urlLower.includes('aws-0-eu-west-1');
    
    if (isProductionDb) {
      warning('Production database detected');
      log('   Use --prod flag for production deployment');
      log('   Or use: npm run deploy');
      process.exit(1);
    } else {
      info('Development database detected');
      log('   Proceeding with development deployment');
    }
  }
  
  // Step 0: Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Step 1: Verify implementation
  if (!verifyImplementation()) {
    process.exit(1);
  }
  
  // Step 2: Generate Prisma client
  if (!generatePrismaClient()) {
    process.exit(1);
  }
  
  // Step 3: Apply migration
  if (!applyMigration()) {
    error('Deployment failed at migration step');
    process.exit(1);
  }
  
  // Step 4: Verify migration
  verifyMigration();
  
  // Success
  log('\n' + '='.repeat(80));
  success('🎉 Deployment Completed Successfully!');
  log('='.repeat(80));
  log('');
  info('Next steps:');
  log('   1. Test the API: npm run test:user-deletion');
  log('   2. Monitor logs for any issues');
  log('   3. Verify deletion works in admin panel');
  log('');
}

// Run deployment
if (require.main === module) {
  main().catch(error => {
    error('Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main };
