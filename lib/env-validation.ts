/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at application startup.
 * Fails fast with clear error messages if critical variables are missing.
 */

interface EnvVarConfig {
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  description: string;
  defaultValue?: string;
  validateProduction?: boolean; // Only validate in production
}

const REQUIRED_ENV_VARS: Record<string, EnvVarConfig> = {
  // Database - Always required
  DATABASE_URL: {
    required: true,
    pattern: /^postgresql:\/\//,
    description: 'PostgreSQL database connection string',
  },
  DIRECT_URL: {
    required: true,
    pattern: /^postgresql:\/\//,
    description: 'Direct PostgreSQL connection for migrations',
  },

  // Authentication - Always required
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: 'JWT signing secret (minimum 32 characters)',
  },
  NEXTAUTH_SECRET: {
    required: true,
    minLength: 32,
    description: 'NextAuth.js secret (minimum 32 characters)',
  },
  NEXTAUTH_URL: {
    required: true,
    pattern: /^https?:\/\//,
    description: 'NextAuth.js base URL',
  },

  // Application URLs - Always required
  NEXT_PUBLIC_APP_URL: {
    required: true,
    pattern: /^https?:\/\//,
    description: 'Public application URL (accessible in browser)',
  },

  // Email Service - Always required
  RESEND_API_KEY: {
    required: true,
    pattern: /^re_/,
    description: 'Resend API key for email service',
  },
  FROM_EMAIL: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'From email address for notifications',
  },

  // Payment Service - Required in production
  PAYSTACK_SECRET_KEY: {
    required: true,
    validateProduction: true,
    pattern: /^sk_(test_|live_)/,
    description: 'Paystack secret key',
  },
  PAYSTACK_PUBLIC_KEY: {
    required: true,
    validateProduction: true,
    pattern: /^pk_(test_|live_)/,
    description: 'Paystack public key',
  },

  // Push Notifications - Optional but recommended
  VAPID_PUBLIC_KEY: {
    required: false,
    description: 'VAPID public key for push notifications',
  },
  VAPID_PRIVATE_KEY: {
    required: false,
    description: 'VAPID private key for push notifications',
  },
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(key: string, config: EnvVarConfig, isProduction: boolean): { valid: boolean; message: string } {
  const value = process.env[key];

  // Check if variable is required
  if (config.required) {
    // Skip production-only validation if not in production
    if (config.validateProduction && !isProduction) {
      return { valid: true, message: 'Skipped (production-only)' };
    }

    if (!value && !config.defaultValue) {
      return { valid: false, message: `Missing required variable` };
    }

    const actualValue = value || config.defaultValue;

    // Validate pattern
    if (config.pattern && !config.pattern.test(actualValue)) {
      return { valid: false, message: `Invalid format` };
    }

    // Validate minimum length
    if (config.minLength && actualValue.length < config.minLength) {
      return { valid: false, message: `Must be at least ${config.minLength} characters` };
    }
  }

  // Warn if optional but recommended variable is missing
  if (!config.required && !value) {
    return { valid: true, message: 'Optional (recommended)' };
  }

  return { valid: true, message: 'Valid' };
}

/**
 * Validate all required environment variables
 */
export function validateEnvironmentVariables(): ValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n🔍 Validating environment variables (${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})...\n`);

  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const validation = validateEnvVar(key, config, isProduction);

    if (!validation.valid) {
      errors.push(`${key}: ${validation.message} - ${config.description}`);
      console.error(`❌ ${key}: ${validation.message}`);
    } else if (validation.message.includes('Optional')) {
      warnings.push(`${key}: ${config.description}`);
      console.warn(`⚠️  ${key}: ${validation.message}`);
    } else {
      console.log(`✅ ${key}: ${validation.message}`);
    }
  });

  if (errors.length > 0) {
    console.error('\n❌ Environment validation FAILED');
    console.error('\nMissing or invalid environment variables:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease set the required environment variables before starting the application.\n');
    return { valid: false, errors, warnings };
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('\n✅ Environment validation PASSED\n');
  return { valid: true, errors: [], warnings };
}

/**
 * Validate Paystack key consistency and environment alignment
 * Prevents mixing test/live keys and warns about misconfigurations
 */
export function validatePaystackKeyConsistency(): { valid: boolean; errors: string[]; warnings: string[] } {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
  const testMode = process.env.PAYSTACK_TEST_MODE === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!secretKey || !publicKey) {
    return { valid: true, errors: [], warnings: [] }; // Will be caught by required validation
  }

  const secretIsTest = secretKey.startsWith('sk_test_');
  const secretIsLive = secretKey.startsWith('sk_live_');
  const publicIsTest = publicKey.startsWith('pk_test_');
  const publicIsLive = publicKey.startsWith('pk_live_');

  // Check key consistency (both must be test or both must be live)
  if ((secretIsTest && publicIsLive) || (secretIsLive && publicIsTest)) {
    errors.push(
      `Paystack key mismatch: Secret and public keys must both be test or both be live. ` +
      `Secret: ${secretIsTest ? 'TEST' : secretIsLive ? 'LIVE' : 'INVALID'}, ` +
      `Public: ${publicIsTest ? 'TEST' : publicIsLive ? 'LIVE' : 'INVALID'}`
    );
  }

  // Warn if production environment uses test keys
  if (isProduction && secretIsTest) {
    warnings.push(
      '⚠️  WARNING: Production environment is using TEST Paystack keys! ' +
      'This should only be used for staging/testing, not real transactions.'
    );
  }

  // Warn if development uses live keys
  if (!isProduction && secretIsLive) {
    warnings.push(
      '⚠️  WARNING: Development environment is using LIVE Paystack keys! ' +
      'This could result in real money transactions during development. ' +
      'Use test keys (sk_test_..., pk_test_...) for development.'
    );
  }

  // Check test mode flag consistency
  if (testMode && secretIsLive) {
    errors.push(
      'Configuration error: PAYSTACK_TEST_MODE=true but using LIVE keys. ' +
      'Set PAYSTACK_TEST_MODE=false for live keys.'
    );
  }

  if (!testMode && secretIsTest && isProduction) {
    warnings.push(
      '⚠️  WARNING: PAYSTACK_TEST_MODE=false but using TEST keys in production. ' +
      'For production, use live keys (sk_live_..., pk_live_...) and set PAYSTACK_TEST_MODE=false.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate environment variables and throw if invalid
 * Use this at application startup to fail fast
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironmentVariables();
  
  // Also validate Paystack key consistency
  const paystackValidation = validatePaystackKeyConsistency();
  
  if (!result.valid || !paystackValidation.valid) {
    const allErrors = [...result.errors, ...paystackValidation.errors];
    const errorMessage = `Environment validation failed:\n${allErrors.join('\n')}`;
    console.error(`\n${'='.repeat(80)}`);
    console.error('🚨 CRITICAL: Application cannot start');
    console.error(`${'='.repeat(80)}\n`);
    throw new Error(errorMessage);
  }

  // Show warnings
  const allWarnings = [...result.warnings, ...paystackValidation.warnings];
  if (allWarnings.length > 0) {
    console.warn(`\n${'='.repeat(80)}`);
    console.warn('⚠️  WARNING: Configuration issues detected');
    console.warn(`${'='.repeat(80)}`);
    allWarnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn(`${'='.repeat(80)}\n`);
  }
}

