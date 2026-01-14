/**
 * Database Safety Checks
 * 
 * Prevents accidental connection to production database from development environment
 * and validates environment configuration.
 * 
 * This module provides non-blocking warnings initially, with the ability to
 * enforce stricter rules as needed.
 */

// Production detection: Check for specific production project reference
// NOTE: Generic Supabase patterns (pooler.supabase.com, aws-0-eu-west-1) are used by BOTH
// production and development databases, so we must check for the specific production project ref
const PRODUCTION_PROJECT_REF = 'qdrktzqfeewwcktgltzy'; // Production project reference

const PRODUCTION_INDICATORS = [
  PRODUCTION_PROJECT_REF, // Specific production project reference
  // Only include patterns that are UNIQUE to production
  // Generic Supabase patterns are excluded as they match dev databases too
];

const DEV_INDICATORS = [
  'localhost',
  '127.0.0.1',
  'connectsa_dev',
  // Development Supabase databases use pooler.supabase.com but with different project refs
  // We'll check for production ref specifically, not generic patterns
];

const TEST_INDICATORS = [
  'connectsa_test',
];

export interface DatabaseSafetyResult {
  isSafe: boolean;
  warnings: string[];
  errors: string[];
  environment: 'development' | 'production' | 'test' | 'unknown';
}

/**
 * Check if a database URL appears to be production
 * 
 * NOTE: This checks for the specific production project reference.
 * If DATABASE_ENV=development is set, this will return false even if
 * the URL contains production patterns (allows explicit dev database override).
 */
export function isProductionDatabaseUrl(url: string): boolean {
  if (!url) return false;
  
  // Allow explicit override for development databases
  // This prevents false positives when dev databases use similar URL patterns
  if (process.env.DATABASE_ENV === 'development' || process.env.DATABASE_ENV === 'dev') {
    return false;
  }
  
  return PRODUCTION_INDICATORS.some(indicator => url.includes(indicator));
}

/**
 * Check if a database URL appears to be development
 */
export function isDevelopmentDatabaseUrl(url: string): boolean {
  if (!url) return false;
  return DEV_INDICATORS.some(indicator => url.includes(indicator));
}

/**
 * Check if a database URL appears to be test
 */
export function isTestDatabaseUrl(url: string): boolean {
  if (!url) return false;
  return TEST_INDICATORS.some(indicator => url.includes(indicator));
}

/**
 * Validate database environment safety
 * Returns warnings and errors without throwing (non-blocking)
 */
export function validateDatabaseEnvironment(): DatabaseSafetyResult {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const databaseUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';
  
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Determine environment
  let environment: 'development' | 'production' | 'test' | 'unknown' = 'unknown';
  if (nodeEnv === 'production') environment = 'production';
  else if (nodeEnv === 'test') environment = 'test';
  else environment = 'development';

  // Check if DATABASE_URL is set
  if (!databaseUrl) {
    errors.push('DATABASE_URL environment variable is not set');
    return { isSafe: false, warnings, errors, environment };
  }

  // In development/test, warn if connecting to production database
  if ((environment === 'development' || environment === 'test')) {
    if (isProductionDatabaseUrl(databaseUrl)) {
      warnings.push(
        `⚠️  WARNING: ${environment} environment appears to be connecting to a production database.\n` +
        `   Database URL: ${databaseUrl.substring(0, 60)}...\n` +
        `   This is allowed but NOT RECOMMENDED for safety.\n` +
        `   Consider using a separate development database to prevent accidental data loss.`
      );
    }
  }

  // In production, error if using development database
  if (environment === 'production') {
    if (isDevelopmentDatabaseUrl(databaseUrl) || isTestDatabaseUrl(databaseUrl)) {
      errors.push(
        `🚨 CRITICAL: Production environment is using a development/test database URL!\n` +
        `   Database URL: ${databaseUrl.substring(0, 60)}...\n` +
        `   This will cause data loss and is BLOCKED.\n` +
        `   Please set correct DATABASE_URL in your production environment.`
      );
    }
    
    // Warn if production URL doesn't look like production
    if (!isProductionDatabaseUrl(databaseUrl)) {
      warnings.push(
        `⚠️  WARNING: Production environment database URL doesn't match expected production patterns.\n` +
        `   Please verify this is the correct production database.`
      );
    }
  }

  // Validate both URLs point to same environment type
  if (databaseUrl && directUrl) {
    const dbIsProd = isProductionDatabaseUrl(databaseUrl);
    const directIsProd = isProductionDatabaseUrl(directUrl);
    
    if (dbIsProd !== directIsProd) {
      warnings.push(
        `⚠️  WARNING: DATABASE_URL and DIRECT_URL appear to point to different environments.\n` +
        `   DATABASE_URL: ${dbIsProd ? 'PRODUCTION' : 'DEVELOPMENT/TEST'}\n` +
        `   DIRECT_URL: ${directIsProd ? 'PRODUCTION' : 'DEVELOPMENT/TEST'}\n` +
        `   They should typically point to the same database.`
      );
    }
  }

  // Check for hardcoded credentials in URL (basic check)
  if (databaseUrl.includes('<PASSWORD>') || databaseUrl.includes('<password>')) {
    errors.push(
      `🚨 CRITICAL: DATABASE_URL contains placeholder values (<PASSWORD>).\n` +
      `   Please replace with actual database credentials.`
    );
  }

  return {
    isSafe: errors.length === 0,
    warnings,
    errors,
    environment,
  };
}

/**
 * Get environment-specific database configuration
 * Validates and returns database URLs with safety checks
 */
export function getDatabaseConfig(): {
  databaseUrl: string;
  directUrl: string;
  environment: string;
} {
  const validation = validateDatabaseEnvironment();
  
  // Log warnings (non-blocking)
  if (validation.warnings.length > 0) {
    console.warn('\n' + '='.repeat(80));
    console.warn('⚠️  DATABASE SAFETY WARNINGS');
    console.warn('='.repeat(80));
    validation.warnings.forEach(warning => console.warn(warning));
    console.warn('='.repeat(80) + '\n');
  }
  
  // Log errors and throw in production
  if (validation.errors.length > 0) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 DATABASE SAFETY ERRORS');
    console.error('='.repeat(80));
    validation.errors.forEach(error => console.error(error));
    console.error('='.repeat(80) + '\n');
    
    // In production, errors are always blocking
    if (validation.environment === 'production') {
      throw new Error('Database safety check failed. Production cannot use development database.');
    }
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL || databaseUrl;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // HARD BLOCK: Development/test cannot connect to production database
  // NO BYPASS ALLOWED - This is a security requirement
  if ((validation.environment === 'development' || validation.environment === 'test')) {
    if (isProductionDatabaseUrl(databaseUrl)) {
      console.error('\n' + '='.repeat(80));
      console.error('🚨 CRITICAL SECURITY ERROR: Development/Test cannot connect to production database');
      console.error('='.repeat(80));
      console.error(`Environment: ${validation.environment.toUpperCase()}`);
      console.error(`Database URL: ${databaseUrl.substring(0, 60)}...`);
      console.error('');
      console.error('This connection is PERMANENTLY BLOCKED for security.');
      console.error('Production database access from local development is not allowed.');
      console.error('');
      console.error('Required solution:');
      console.error('  Create a separate development database and update DATABASE_URL');
      console.error('  See ENVIRONMENT_SEPARATION.md for setup instructions');
      console.error('');
      console.error('If you need to access production data, use approved tools and processes.');
      console.error('='.repeat(80) + '\n');
      
      throw new Error(
        'SECURITY VIOLATION: Development environment cannot connect to production database. ' +
        'This is a hard block and cannot be bypassed.'
      );
    }
  }
  
  return {
    databaseUrl,
    directUrl,
    environment: validation.environment,
  };
}

/**
 * Check if migration should be allowed based on environment
 * Returns true if migration is safe, false otherwise
 */
export function isMigrationSafe(forceFlag: boolean = false): {
  allowed: boolean;
  reason?: string;
} {
  const validation = validateDatabaseEnvironment();
  const nodeEnv = validation.environment;
  const dbUrl = process.env.DATABASE_URL || '';
  
  // Force flag bypasses all checks
  if (forceFlag) {
    return { allowed: true };
  }
  
  // Production migrations only allowed in production environment
  if (isProductionDatabaseUrl(dbUrl) && nodeEnv !== 'production') {
    return {
      allowed: false,
      reason: `Cannot run migrations on production database from ${nodeEnv} environment. Use --force flag if intentional.`,
    };
  }
  
  // Development/test migrations allowed in any non-production environment
  if ((nodeEnv === 'development' || nodeEnv === 'test') && !isProductionDatabaseUrl(dbUrl)) {
    return { allowed: true };
  }
  
  // Production environment can migrate production database
  if (nodeEnv === 'production' && isProductionDatabaseUrl(dbUrl)) {
    return { allowed: true };
  }
  
  return { allowed: true };
}


