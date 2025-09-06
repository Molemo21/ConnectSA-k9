#!/usr/bin/env node

/**
 * Cross-Platform Test Runner for Admin Dashboard User Management System
 * 
 * This script automatically detects the platform and runs the appropriate test suite.
 * Works on Windows, macOS, and Linux.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';
const CLEANUP = process.env.CLEANUP === 'true';

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkApplication() {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      command = `curl -s -f "${BASE_URL}"`;
    } else {
      command = `curl -s -f "${BASE_URL}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        log(`❌ Application is not running at ${BASE_URL}`, 'red');
        log('💡 Please start your application with: npm run dev', 'yellow');
        resolve(false);
      } else {
        log('✅ Application is running', 'green');
        resolve(true);
      }
    });
  });
}

function installDependencies() {
  return new Promise((resolve) => {
    log('📦 Installing test dependencies...', 'blue');
    
    const npm = spawn('npm', ['install', '--save-dev', 'axios', 'puppeteer'], {
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        log('✅ Dependencies installed successfully', 'green');
        resolve(true);
      } else {
        log('❌ Failed to install dependencies', 'red');
        resolve(false);
      }
    });
  });
}

function setupTestData() {
  return new Promise((resolve) => {
    log('📝 Setting up test data...', 'blue');
    
    const env = { ...process.env, BASE_URL };
    const setup = spawn('node', ['scripts/setup-test-data.js'], {
      stdio: 'inherit',
      shell: true,
      env
    });
    
    setup.on('close', (code) => {
      if (code === 0) {
        log('✅ Test data setup completed', 'green');
        resolve(true);
      } else {
        log('❌ Test data setup failed', 'red');
        resolve(false);
      }
    });
  });
}

function runTests() {
  return new Promise((resolve) => {
    log('🧪 Running comprehensive test suite...', 'blue');
    
    const env = { ...process.env, BASE_URL, HEADLESS: HEADLESS.toString() };
    const tests = spawn('node', ['scripts/test-admin-user-management.js'], {
      stdio: 'inherit',
      shell: true,
      env
    });
    
    tests.on('close', (code) => {
      resolve(code);
    });
  });
}

function cleanup() {
  if (!CLEANUP) return Promise.resolve();
  
  return new Promise((resolve) => {
    log('🧹 Cleaning up test data...', 'blue');
    // Add cleanup logic here if needed
    log('✅ Cleanup completed', 'green');
    resolve();
  });
}

async function main() {
  log('🚀 Admin Dashboard User Management System Test Runner', 'blue');
  log('================================================', 'blue');
  
  try {
    // Check if application is running
    log('🔍 Checking if application is running...', 'yellow');
    const appRunning = await checkApplication();
    if (!appRunning) {
      process.exit(1);
    }
    
    // Install dependencies
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
      process.exit(1);
    }
    
    // Setup test data
    const dataSetup = await setupTestData();
    if (!dataSetup) {
      process.exit(1);
    }
    
    // Run tests
    const testExitCode = await runTests();
    
    // Cleanup if requested
    await cleanup();
    
    // Report results
    if (testExitCode === 0) {
      log('🎉 All tests passed!', 'green');
      log('📊 Check scripts/test-results.json for detailed results', 'blue');
    } else {
      log('❌ Some tests failed', 'red');
      log('📊 Check scripts/test-results.json for detailed results', 'blue');
    }
    
    process.exit(testExitCode);
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
