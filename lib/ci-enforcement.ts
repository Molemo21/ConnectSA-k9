/**
 * CI-ONLY EXECUTION ENFORCEMENT
 * 
 * CRITICAL SAFETY MECHANISM - Prevents local production mutations
 * 
 * This module enforces that production mutation scripts can ONLY run in CI.
 * It provides:
 * - Hard failure if CI !== "true"
 * - Blocks PROD_DATABASE_URL usage locally
 * - Fail-fast before any database connection
 * 
 * NO BYPASSES - NO WARNINGS - HARD FAILURES ONLY
 */

export type MutationScript = 
  | 'deploy-db'
  | 'sync-dev-to-prod'
  | 'sync-reference-data'
  | 'backup-production'
  | 'migrate-production';

/**
 * Enforce CI-only execution for production mutations
 * 
 * This MUST be called at the very start of any script that can mutate production.
 * It fails fast before any database connections or operations.
 * 
 * @param scriptName - Name of the mutation script
 * @throws Error if CI !== "true" or if running locally with production database
 */
export function enforceCIOnlyExecution(scriptName: MutationScript): void {
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  
  // GUARD 1: Must be in CI environment
  if (!isCI) {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: ${scriptName} requires CI=true
${'='.repeat(80)}
Current CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

This script can mutate production data and MUST run in CI/CD only.
Local execution is PERMANENTLY BLOCKED to prevent accidental mutations.

If you need to test:
1. Use dry-run mode (if available)
2. Test in a staging environment
3. Never run mutation scripts locally against production

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 2: Block PROD_DATABASE_URL usage locally (even in CI, validate it's not misconfigured)
  const prodDbUrl = process.env.PROD_DATABASE_URL || '';
  const dbUrl = process.env.DATABASE_URL || '';
  
  // If PROD_DATABASE_URL is set but we're not in production context, that's suspicious
  if (prodDbUrl && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: PROD_DATABASE_URL detected in non-production context
${'='.repeat(80)}
PROD_DATABASE_URL is set but NODE_ENV=${nodeEnv}

This prevents accidental use of production database in wrong context.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 3: Validate we're in production environment
  if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: ${scriptName} requires NODE_ENV=production
${'='.repeat(80)}
Current NODE_ENV: ${nodeEnv || '(not set)'}
CI: ${isCI}

Production mutation scripts require both CI=true AND NODE_ENV=production.
${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // All guards passed
  console.log(`✅ CI-only execution guard passed for ${scriptName}`);
  console.log(`   CI: ${isCI}`);
  console.log(`   NODE_ENV: ${nodeEnv}`);
}

/**
 * Block PROD_DATABASE_URL usage in local/development context
 * 
 * This prevents accidental connection to production database from local machine.
 * 
 * @param databaseUrl - Database URL to validate
 * @throws Error if production database URL detected in non-CI context
 */
export function blockProductionDatabaseLocally(databaseUrl: string): void {
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  
  // Detect production database patterns
  const urlLower = databaseUrl.toLowerCase();
  const isProdDb = 
    urlLower.includes('pooler.supabase.com') ||
    urlLower.includes('supabase.com:5432') ||
    urlLower.includes('aws-0-eu-west-1') ||
    (urlLower.includes('supabase') && !urlLower.includes('localhost'));

  // Block production database access in non-CI, non-production contexts
  if (isProdDb && !isCI && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production database URL detected in local/development context
${'='.repeat(80)}
Database URL pattern indicates production database.
CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

Production database access is BLOCKED outside CI/CD pipelines.
This prevents accidental mutations from local development machines.

If you need production access:
1. Use CI/CD pipeline
2. Use read-only production replica (if available)
3. Never connect to production from local machine

${'='.repeat(80)}
`;
    console.error(error);
    throw new Error('Production database access blocked in local context');
  }
}

/**
 * Validate mutation script is allowed to run
 * 
 * Combines CI enforcement and database blocking.
 * 
 * @param scriptName - Name of the mutation script
 * @param databaseUrl - Database URL (optional, for additional validation)
 */
export function validateMutationScript(
  scriptName: MutationScript,
  databaseUrl?: string
): void {
  // Enforce CI-only execution
  enforceCIOnlyExecution(scriptName);

  // Block production database locally if URL provided
  if (databaseUrl) {
    blockProductionDatabaseLocally(databaseUrl);
  }
}
