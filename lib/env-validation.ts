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
 * Validate environment variables and throw if invalid
 * Use this at application startup to fail fast
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironmentVariables();
  
  if (!result.valid) {
    const errorMessage = `Environment validation failed:\n${result.errors.join('\n')}`;
    console.error(`\n${'='.repeat(80)}`);
    console.error('🚨 CRITICAL: Application cannot start');
    console.error(`${'='.repeat(80)}\n`);
    throw new Error(errorMessage);
  }

  if (result.warnings.length > 0) {
    console.warn(`\n${'='.repeat(80)}`);
    console.warn('⚠️  WARNING: Some optional variables are not set');
    console.warn(`${'='.repeat(80)}\n`);
  }
}

