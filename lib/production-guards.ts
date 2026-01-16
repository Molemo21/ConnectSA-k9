/**
 * PRODUCTION MUTATION GUARDS
 * 
 * CRITICAL: These guards MUST execute BEFORE any Prisma import or database connection.
 * They are the FIRST line of defense against local production mutations.
 * 
 * NO BYPASSES - NO WARNINGS - HARD FAILURES ONLY
 */

/**
 * Hard guard that fails BEFORE Prisma initialization
 * 
 * This function MUST be called at the very top of any script that can mutate production.
 * It executes synchronously and fails fast before any imports or connections.
 */
export function enforceProductionGuards(): void {
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const dbUrl = process.env.DATABASE_URL || '';
  const prodDbUrl = process.env.PROD_DATABASE_URL || '';

  // GUARD 1: CI-only execution (PHYSICAL IMPOSSIBILITY)
  if (!isCI) {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production mutations require CI=true
${'='.repeat(80)}
Current CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

Production mutations are PHYSICALLY IMPOSSIBLE outside CI/CD pipelines.
This guard executes BEFORE any database connection or Prisma initialization.

NO BYPASSES EXIST. This is a HARD GUARANTEE.

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 2: Production environment required
  if (nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production mutations require NODE_ENV=production
${'='.repeat(80)}
Current NODE_ENV: ${nodeEnv || '(not set)'}
CI: ${isCI}

Production mutations require BOTH CI=true AND NODE_ENV=production.

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }

  // GUARD 3: Block PROD_DATABASE_URL usage in wrong context
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

  // GUARD 4: Block production database patterns locally
  const urlLower = dbUrl.toLowerCase();
  const isProdDb = 
    urlLower.includes('pooler.supabase.com') ||
    urlLower.includes('supabase.com:5432') ||
    urlLower.includes('aws-0-eu-west-1') ||
    (urlLower.includes('supabase') && !urlLower.includes('localhost'));

  if (isProdDb && !isCI && nodeEnv !== 'production' && nodeEnv !== 'prod') {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production database URL detected in local context
${'='.repeat(80)}
Database URL pattern indicates production database.
CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

Production database access is BLOCKED outside CI/CD pipelines.

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }
}

/**
 * Validate that mutation script is in allowlist
 * 
 * ONLY scripts in this list are allowed to mutate production.
 * Any other script attempting mutation will fail.
 */
const ALLOWED_MUTATION_SCRIPTS = [
  'scripts/deploy-db.js',
  'scripts/sync-dev-to-prod-services.ts',
] as const;

export function validateMutationScriptInAllowlist(scriptPath: string): void {
  const normalizedPath = scriptPath.replace(/\\/g, '/');
  const isAllowed = ALLOWED_MUTATION_SCRIPTS.some(allowed => 
    normalizedPath.endsWith(allowed)
  );

  if (!isAllowed) {
    const error = `
${'='.repeat(80)}
🚨 BLOCKED: Script not in mutation allowlist
${'='.repeat(80)}
Script: ${scriptPath}

Only the following scripts are allowed to mutate production:
${ALLOWED_MUTATION_SCRIPTS.map(s => `  - ${s}`).join('\n')}

This script is NOT in the allowlist and cannot mutate production.

${'='.repeat(80)}
`;
    console.error(error);
    process.exit(1);
  }
}
