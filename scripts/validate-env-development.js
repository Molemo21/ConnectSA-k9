#!/usr/bin/env node

/**
 * Comprehensive .env.development Validation Script
 * 
 * Validates your .env.development file against best practices:
 * - No production credentials
 * - All required variables present
 * - Correct development values
 * - Security checks
 */

const fs = require('fs');
const path = require('path');

// Production indicators (should NOT be in development)
const PRODUCTION_INDICATORS = {
  database: [
    'qdrktzqfeewwcktgltzy', // Production Supabase project ref (specific check)
    'aws-0-eu-west-1', // Production AWS region (specific)
  ],
  supabase: [
    'qdrktzqfeewwcktgltzy', // Production Supabase project ref
  ],
  urls: [
    'app.proliinkconnect.co.za',
    'https://app.proliinkconnect.co.za',
  ],
  nodeEnv: ['production'],
};

// Note: pooler.supabase.com is OK for development - it's the project ref that matters

// Required variables for development
const REQUIRED_VARS = {
  // Environment
  NODE_ENV: {
    required: true,
    expected: 'development',
    description: 'Must be "development"',
  },
  
  // Database
  DATABASE_URL: {
    required: true,
    pattern: /^postgresql:\/\//,
    notContain: PRODUCTION_INDICATORS.database,
    description: 'Development database URL (must NOT contain production indicators)',
  },
  DIRECT_URL: {
    required: true,
    pattern: /^postgresql:\/\//,
    notContain: PRODUCTION_INDICATORS.database,
    description: 'Direct database URL for migrations (must NOT contain production indicators)',
  },
  
  // Supabase Storage
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    pattern: /^https:\/\/.*\.supabase\.co$/,
    notContain: PRODUCTION_INDICATORS.supabase,
    description: 'Development Supabase project URL (must NOT be qdrktzqfeewwcktgltzy)',
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    pattern: /^eyJ/,
    description: 'Supabase anon key',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: true,
    pattern: /^eyJ/,
    description: 'Supabase service role key (server-side only)',
  },
  
  // Authentication
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: 'JWT secret (minimum 32 characters)',
  },
  JWT_EXPIRES_IN: {
    required: true,
    description: 'JWT expiration time',
  },
  NEXTAUTH_SECRET: {
    required: true,
    minLength: 32,
    description: 'NextAuth secret (minimum 32 characters)',
  },
  NEXTAUTH_URL: {
    required: true,
    pattern: /^http:\/\/localhost:3000$/,
    notContain: PRODUCTION_INDICATORS.urls,
    description: 'NextAuth URL (must be http://localhost:3000)',
  },
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: {
    required: true,
    pattern: /^http:\/\/localhost:3000$/,
    notContain: PRODUCTION_INDICATORS.urls,
    description: 'Application URL (must be http://localhost:3000)',
  },
  COOKIE_DOMAIN: {
    required: true,
    expected: 'localhost',
    description: 'Cookie domain (must be localhost)',
  },
  
  // Email
  RESEND_API_KEY: {
    required: true,
    pattern: /^re_/,
    description: 'Resend API key',
  },
  FROM_EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'From email address',
  },
  
  // Payment (Test mode for development)
  PAYSTACK_SECRET_KEY: {
    required: true,
    pattern: /^sk_test_/,
    description: 'Paystack secret key (must be TEST mode: sk_test_...)',
  },
  PAYSTACK_PUBLIC_KEY: {
    required: true,
    pattern: /^pk_test_/,
    description: 'Paystack public key (must be TEST mode: pk_test_...)',
  },
  PAYSTACK_TEST_MODE: {
    required: true,
    expected: 'true',
    description: 'Paystack test mode (must be true)',
  },
};

// Optional but recommended
const OPTIONAL_VARS = {
  PRISMA_DISABLE_PREPARED_STATEMENTS: {
    expected: 'false',
    description: 'Should be false for development',
  },
  LOG_LEVEL: {
    description: 'Logging level (debug recommended for dev)',
  },
  VAPID_PUBLIC_KEY: {
    description: 'VAPID public key for push notifications',
  },
  VAPID_PRIVATE_KEY: {
    description: 'VAPID private key for push notifications',
  },
};

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach((line, index) => {
    // Remove comments and whitespace
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      return;
    }
    
    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove inline comments (everything after # that's not inside quotes)
      // Check if # is outside of quotes
      let inQuotes = false;
      let quoteChar = null;
      let commentIndex = -1;
      
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if ((char === '"' || char === "'") && (i === 0 || value[i-1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = null;
          }
        } else if (char === '#' && !inQuotes) {
          commentIndex = i;
          break;
        }
      }
      
      if (commentIndex > 0) {
        value = value.substring(0, commentIndex).trim();
      }
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

function checkContainsProductionIndicators(value, indicators, varName) {
  const issues = [];
  
  if (!value) return issues;
  
  indicators.forEach(indicator => {
    if (value.includes(indicator)) {
      issues.push(`Contains production indicator: "${indicator}"`);
    }
  });
  
  return issues;
}

function validateVariable(key, value, config) {
  const issues = [];
  const warnings = [];
  
  if (!value && config.required) {
    issues.push(`Missing required variable`);
    return { valid: false, issues, warnings };
  }
  
  if (!value) {
    return { valid: true, issues: [], warnings: ['Optional variable not set'] };
  }
  
  // Check expected value
  if (config.expected && value !== config.expected) {
    issues.push(`Expected "${config.expected}", got "${value}"`);
  }
  
  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    issues.push(`Does not match required pattern: ${config.pattern}`);
  }
  
  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    issues.push(`Must be at least ${config.minLength} characters (got ${value.length})`);
  }
  
  // Check for production indicators
  if (config.notContain) {
    const prodIssues = checkContainsProductionIndicators(value, config.notContain, key);
    if (prodIssues.length > 0) {
      issues.push(...prodIssues);
      issues.push('⚠️  CRITICAL: This appears to be a PRODUCTION value!');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

function main() {
  const envFilePath = path.join(process.cwd(), '.env.development');
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 .env.development Validation');
  console.log('='.repeat(80) + '\n');
  
  // Check if file exists
  if (!fs.existsSync(envFilePath)) {
    console.error('❌ .env.development file does not exist!');
    console.error('   Create it with development credentials.\n');
    process.exit(1);
  }
  
  // Check if file is empty
  const stats = fs.statSync(envFilePath);
  if (stats.size === 0) {
    console.error('❌ .env.development file is empty!');
    console.error('   Add your development environment variables.\n');
    process.exit(1);
  }
  
  // Parse environment file
  let env;
  try {
    env = parseEnvFile(envFilePath);
  } catch (error) {
    console.error('❌ Error reading .env.development:', error.message);
    process.exit(1);
  }
  
  console.log(`📄 Found ${Object.keys(env).length} environment variables\n`);
  
  // Validate required variables
  const results = {
    passed: [],
    failed: [],
    warnings: [],
    critical: [],
  };
  
  console.log('🔍 Validating Required Variables...\n');
  
  Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
    const value = env[key];
    const validation = validateVariable(key, value, config);
    
    if (validation.valid) {
      results.passed.push(key);
      console.log(`✅ ${key}: OK`);
      if (value && value.length > 50) {
        console.log(`   Value: ${value.substring(0, 50)}...`);
      } else if (value) {
        console.log(`   Value: ${value}`);
      }
    } else {
      const isCritical = validation.issues.some(issue => issue.includes('CRITICAL'));
      
      if (isCritical) {
        results.critical.push(key);
      } else {
        results.failed.push(key);
      }
      
      console.error(`❌ ${key}: FAILED`);
      validation.issues.forEach(issue => {
        console.error(`   - ${issue}`);
      });
      if (value) {
        console.error(`   Current value: ${value.substring(0, 60)}...`);
      }
    }
    console.log('');
  });
  
  // Check optional variables
  console.log('\n🔍 Checking Optional Variables...\n');
  
  Object.entries(OPTIONAL_VARS).forEach(([key, config]) => {
    const value = env[key];
    if (value) {
      const validation = validateVariable(key, value, config);
      if (validation.valid) {
        console.log(`✅ ${key}: OK`);
      } else {
        results.warnings.push(key);
        console.warn(`⚠️  ${key}: ${validation.issues.join(', ')}`);
      }
    } else {
      console.log(`ℹ️  ${key}: Not set (optional)`);
    }
  });
  
  // Check for unexpected production variables
  console.log('\n🔍 Checking for Production Credentials...\n');
  
  const productionKeys = Object.keys(env).filter(key => {
    const value = env[key];
    if (!value) return false;
    
    // Check for production indicators in any value
    return PRODUCTION_INDICATORS.database.some(ind => value.includes(ind)) ||
           PRODUCTION_INDICATORS.supabase.some(ind => value.includes(ind)) ||
           PRODUCTION_INDICATORS.urls.some(ind => value.includes(ind));
  });
  
  if (productionKeys.length > 0) {
    console.error('🚨 CRITICAL: Found production credentials!\n');
    productionKeys.forEach(key => {
      console.error(`   ❌ ${key}: Contains production indicators`);
      console.error(`      Value: ${env[key].substring(0, 60)}...`);
    });
    results.critical.push(...productionKeys);
  } else {
    console.log('✅ No production credentials detected');
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Validation Summary');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`🚨 Critical Issues: ${results.critical.length}`);
  console.log('='.repeat(80) + '\n');
  
  if (results.critical.length > 0) {
    console.error('🚨 CRITICAL: Production credentials found in development file!');
    console.error('   This is a security risk. Remove production values immediately.\n');
    process.exit(1);
  }
  
  if (results.failed.length > 0) {
    console.error('❌ Some required variables are missing or invalid.');
    console.error('   Fix the issues above before proceeding.\n');
    process.exit(1);
  }
  
  if (results.warnings.length > 0) {
    console.warn('⚠️  Some optional variables have warnings.');
    console.warn('   Review the warnings above.\n');
  }
  
  console.log('✅ .env.development validation PASSED!');
  console.log('   Your development environment is properly configured.\n');
  
  process.exit(0);
}

main();
