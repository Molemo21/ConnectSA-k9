#!/usr/bin/env node

/**
 * Environment Configuration Management Script
 * 
 * This script helps manage environment variables across different environments
 * and validates configuration before deployment.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnvironmentManager {
  constructor() {
    this.envFiles = {
      development: '.env',
      staging: '.env.staging',
      production: '.env.production'
    };
    
    this.requiredVars = {
      // Database
      DATABASE_URL: {
        required: true,
        pattern: /^postgresql:\/\//,
        description: 'PostgreSQL database connection string'
      },
      DIRECT_URL: {
        required: true,
        pattern: /^postgresql:\/\//,
        description: 'Direct PostgreSQL connection for migrations'
      },
      PRISMA_DISABLE_PREPARED_STATEMENTS: {
        required: false,
        defaultValue: 'true',
        description: 'Disable prepared statements for connection pooling'
      },
      
      // Authentication
      JWT_SECRET: {
        required: true,
        minLength: 32,
        description: 'JWT signing secret (minimum 32 characters)'
      },
      JWT_EXPIRES_IN: {
        required: false,
        defaultValue: '7d',
        description: 'JWT token expiration time'
      },
      NEXTAUTH_SECRET: {
        required: true,
        minLength: 32,
        description: 'NextAuth.js secret (minimum 32 characters)'
      },
      NEXTAUTH_URL: {
        required: true,
        pattern: /^https?:\/\//,
        description: 'Application base URL'
      },
      
      // Email Service
      RESEND_API_KEY: {
        required: true,
        pattern: /^re_/,
        description: 'Resend API key for email service'
      },
      FROM_EMAIL: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        description: 'From email address for notifications'
      },
      
      // Payment Service
      PAYSTACK_SECRET_KEY: {
        required: true,
        pattern: /^sk_(test_|live_)/,
        description: 'Paystack secret key (test or live)'
      },
      PAYSTACK_PUBLIC_KEY: {
        required: true,
        pattern: /^pk_(test_|live_)/,
        description: 'Paystack public key (test or live)'
      },
      PAYSTACK_TEST_MODE: {
        required: false,
        defaultValue: 'true',
        description: 'Enable Paystack test mode (true for test, false for live)'
      },
      PAYSTACK_WEBHOOK_URL: {
        required: false,
        pattern: /^https:\/\//,
        description: 'Paystack webhook URL'
      },
      
      // App Configuration
      NODE_ENV: {
        required: true,
        enum: ['development', 'staging', 'production'],
        description: 'Node.js environment'
      },
      COOKIE_DOMAIN: {
        required: false,
        description: 'Cookie domain for authentication'
      },
      LOG_LEVEL: {
        required: false,
        defaultValue: 'info',
        enum: ['error', 'warn', 'info', 'debug'],
        description: 'Logging level'
      }
    };
  }

  // Generate secure random secrets
  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Validate environment variable
  validateVariable(key, value, environment) {
    const config = this.requiredVars[key];
    if (!config) {
      return { valid: true, message: 'Unknown variable' };
    }

    // Check if required
    if (config.required && !value) {
      return { valid: false, message: `${key} is required` };
    }

    // Check minimum length
    if (config.minLength && value && value.length < config.minLength) {
      return { valid: false, message: `${key} must be at least ${config.minLength} characters` };
    }

    // Check pattern
    if (config.pattern && value && !config.pattern.test(value)) {
      return { valid: false, message: `${key} format is invalid` };
    }

    // Check enum values
    if (config.enum && value && !config.enum.includes(value)) {
      return { valid: false, message: `${key} must be one of: ${config.enum.join(', ')}` };
    }

    return { valid: true, message: 'Valid' };
  }

  // Load environment file
  loadEnvironmentFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });

    return env;
  }

  // Save environment file
  saveEnvironmentFile(filePath, env) {
    const content = Object.entries(env)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    fs.writeFileSync(filePath, content + '\n');
  }

  // Validate environment
  validateEnvironment(environment) {
    console.log(`🔍 Validating ${environment} environment...`);
    
    const envFile = this.envFiles[environment];
    if (!envFile) {
      console.error(`❌ Unknown environment: ${environment}`);
      return false;
    }

    const env = this.loadEnvironmentFile(envFile);
    let isValid = true;
    const errors = [];

    // Validate each required variable
    Object.entries(this.requiredVars).forEach(([key, config]) => {
      const value = env[key] || config.defaultValue;
      const validation = this.validateVariable(key, value, environment);
      
      if (!validation.valid) {
        errors.push(`${key}: ${validation.message}`);
        isValid = false;
      } else {
        console.log(`✅ ${key}: ${validation.message}`);
      }
    });

    // Check for missing required variables
    Object.entries(this.requiredVars).forEach(([key, config]) => {
      if (config.required && !env[key] && !config.defaultValue) {
        errors.push(`${key}: Required but not set`);
        isValid = false;
      }
    });

    if (!isValid) {
      console.error('\n❌ Validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log(`\n✅ ${environment} environment validation passed`);
    }

    return isValid;
  }

  // Create environment template
  createTemplate(environment) {
    console.log(`📝 Creating ${environment} environment template...`);
    
    const envFile = this.envFiles[environment];
    const env = {};

    // Set NODE_ENV
    env.NODE_ENV = environment;

    // Add default values
    Object.entries(this.requiredVars).forEach(([key, config]) => {
      if (config.defaultValue) {
        env[key] = config.defaultValue;
      } else if (config.required) {
        // Generate secure secrets for required fields
        if (key.includes('SECRET') || key.includes('KEY')) {
          env[key] = this.generateSecret();
        } else {
          env[key] = `<${key.toLowerCase().replace(/_/g, '-')}>`;
        }
      }
    });

    // Save template
    this.saveEnvironmentFile(envFile, env);
    console.log(`✅ Template created: ${envFile}`);
    console.log(`📋 Please update the placeholder values with your actual configuration`);
  }

  // Compare environments
  compareEnvironments(env1, env2) {
    console.log(`🔍 Comparing ${env1} and ${env2} environments...`);
    
    const file1 = this.envFiles[env1];
    const file2 = this.envFiles[env2];
    
    if (!file1 || !file2) {
      console.error('❌ Invalid environment names');
      return;
    }

    const config1 = this.loadEnvironmentFile(file1);
    const config2 = this.loadEnvironmentFile(file2);

    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    const differences = [];

    allKeys.forEach(key => {
      const value1 = config1[key];
      const value2 = config2[key];

      if (value1 !== value2) {
        differences.push({
          key,
          [env1]: value1 || 'not set',
          [env2]: value2 || 'not set'
        });
      }
    });

    if (differences.length === 0) {
      console.log('✅ Environments are identical');
    } else {
      console.log(`\n📊 Found ${differences.length} differences:`);
      differences.forEach(diff => {
        console.log(`\n${diff.key}:`);
        console.log(`  ${env1}: ${diff[env1]}`);
        console.log(`  ${env2}: ${diff[env2]}`);
      });
    }
  }

  // Generate production secrets
  generateProductionSecrets() {
    console.log('🔐 Generating production secrets...');
    
    const secrets = {
      JWT_SECRET: this.generateSecret(64),
      NEXTAUTH_SECRET: this.generateSecret(64)
    };

    console.log('\n📋 Generated secrets:');
    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log('\n⚠️ Important: Store these secrets securely and never commit them to version control!');
    
    return secrets;
  }

  // Check for security issues
  checkSecurity(environment) {
    console.log(`🔒 Checking security for ${environment} environment...`);
    
    const envFile = this.envFiles[environment];
    const env = this.loadEnvironmentFile(envFile);
    
    const issues = [];

    // Check for weak secrets
    Object.entries(env).forEach(([key, value]) => {
      if (key.includes('SECRET') || key.includes('KEY')) {
        if (value.length < 32) {
          issues.push(`${key} is too short (${value.length} chars, minimum 32)`);
        }
        if (value === 'your-secret-here' || value === 'secret' || value === 'password') {
          issues.push(`${key} uses default/weak value`);
        }
      }
    });

    // Check for test keys in production (only warn, don't fail)
    if (environment === 'production') {
      if (env.PAYSTACK_SECRET_KEY && env.PAYSTACK_SECRET_KEY.startsWith('sk_test_')) {
        issues.push('PAYSTACK_SECRET_KEY is using test key in production (consider switching to live keys)');
      }
      if (env.PAYSTACK_PUBLIC_KEY && env.PAYSTACK_PUBLIC_KEY.startsWith('pk_test_')) {
        issues.push('PAYSTACK_PUBLIC_KEY is using test key in production (consider switching to live keys)');
      }
      if (env.PAYSTACK_TEST_MODE === 'true') {
        issues.push('PAYSTACK_TEST_MODE is enabled in production (test payments will be processed)');
      }
    }

    if (issues.length === 0) {
      console.log('✅ No security issues found');
    } else {
      console.log('\n🚨 Security issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return issues.length === 0;
  }
}

// CLI interface
function main() {
  const manager = new EnvironmentManager();
  const command = process.argv[2];
  const environment = process.argv[3];

  switch (command) {
    case 'validate':
      if (!environment) {
        console.error('❌ Please specify environment: validate <environment>');
        process.exit(1);
      }
      const isValid = manager.validateEnvironment(environment);
      process.exit(isValid ? 0 : 1);
      break;

    case 'create':
      if (!environment) {
        console.error('❌ Please specify environment: create <environment>');
        process.exit(1);
      }
      manager.createTemplate(environment);
      break;

    case 'compare':
      const env1 = process.argv[3];
      const env2 = process.argv[4];
      if (!env1 || !env2) {
        console.error('❌ Please specify two environments: compare <env1> <env2>');
        process.exit(1);
      }
      manager.compareEnvironments(env1, env2);
      break;

    case 'generate-secrets':
      manager.generateProductionSecrets();
      break;

    case 'security-check':
      if (!environment) {
        console.error('❌ Please specify environment: security-check <environment>');
        process.exit(1);
      }
      const isSecure = manager.checkSecurity(environment);
      process.exit(isSecure ? 0 : 1);
      break;

    default:
      console.log(`
🔧 Environment Configuration Manager

Usage:
  node scripts/manage-env.js <command> [options]

Commands:
  validate <environment>     Validate environment configuration
  create <environment>       Create environment template
  compare <env1> <env2>      Compare two environments
  generate-secrets          Generate secure production secrets
  security-check <env>      Check for security issues

Examples:
  node scripts/manage-env.js validate production
  node scripts/manage-env.js create staging
  node scripts/manage-env.js compare development production
  node scripts/manage-env.js generate-secrets
  node scripts/manage-env.js security-check production
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = EnvironmentManager;
