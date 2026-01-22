/**
 * ENVIRONMENT FINGERPRINTING SYSTEM
 * 
 * CRITICAL SAFETY MECHANISM - Prevents misconfiguration
 * 
 * This module validates database environment fingerprints BEFORE Prisma initializes.
 * It ensures:
 * - DEV tooling cannot connect to PROD database
 * - PROD tooling cannot connect to DEV database
 * - Missing or corrupted fingerprints cause hard failures
 * 
 * NO BYPASSES - NO WARNINGS - HARD FAILURES ONLY
 * 
 * NOTE: PrismaClient is NOT imported at the top level - it will be lazy-imported
 *       AFTER prisma generate runs to prevent initialization errors
 */

export type Environment = 'dev' | 'staging' | 'prod';

interface FingerprintResult {
  isValid: boolean;
  environment: Environment | null;
  error: string | null;
}

/**
 * Validate database environment fingerprint
 * 
 * This MUST be called BEFORE Prisma client initialization.
 * It performs a raw SQL query to check the database_metadata table.
 * 
 * @param databaseUrl - Database connection URL
 * @param expectedEnv - Expected environment ('dev', 'staging', or 'prod')
 * @returns Fingerprint validation result
 */
export async function validateEnvironmentFingerprint(
  databaseUrl: string,
  expectedEnv: Environment
): Promise<FingerprintResult> {
  // Lazy import PrismaClient (must be called after prisma generate)
  let PrismaClient: any;
  try {
    // Clear module cache to ensure we get the freshly generated client
    const modulePaths = Object.keys(require.cache || {});
    modulePaths.forEach(path => {
      if (path.includes('@prisma/client') || path.includes('.prisma')) {
        delete require.cache[path];
      }
    });
    
    try {
      const prismaClientPath = require.resolve('@prisma/client');
      delete require.cache[prismaClientPath];
    } catch {
      // If resolve fails, that's OK
    }
    
    const prismaModule = require('@prisma/client');
    PrismaClient = prismaModule.PrismaClient;
  } catch (error) {
    return {
      isValid: false,
      environment: null,
      error: `Failed to import PrismaClient for fingerprint validation. Ensure 'npx prisma generate' has run. Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  
  // Create a temporary Prisma client ONLY for fingerprint validation
  const tempPrisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['error'],
  });

  try {
    // Step 1: Check if database_metadata table exists
    const tableExists = await tempPrisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'database_metadata'
      ) as exists
    `;

    if (!tableExists[0]?.exists) {
      await tempPrisma.$disconnect();
      return {
        isValid: false,
        environment: null,
        error: `CRITICAL: database_metadata table does not exist. This database has not been properly initialized with environment fingerprinting.`,
      };
    }

    // Step 2: Read the fingerprint
    const metadata = await tempPrisma.$queryRaw<Array<{
      id: string;
      environment: string;
      fingerprint: string;
    }>>`
      SELECT id, environment, fingerprint 
      FROM database_metadata 
      WHERE id = 'singleton'
      LIMIT 1
    `;

    if (!metadata || metadata.length === 0) {
      await tempPrisma.$disconnect();
      return {
        isValid: false,
        environment: null,
        error: `CRITICAL: database_metadata table exists but has no fingerprint record. Database is in invalid state.`,
      };
    }

    const record = metadata[0];

    // Step 3: Validate environment matches
    if (record.environment !== expectedEnv) {
      await tempPrisma.$disconnect();
      return {
        isValid: false,
        environment: record.environment as Environment,
        error: `CRITICAL MISCONFIGURATION: Database fingerprint indicates environment="${record.environment}" but expected="${expectedEnv}". This prevents accidental cross-environment access.`,
      };
    }

    // Step 4: Validate fingerprint format
    if (!record.fingerprint || record.fingerprint.length < 10) {
      await tempPrisma.$disconnect();
      return {
        isValid: false,
        environment: record.environment as Environment,
        error: `CRITICAL: Database fingerprint is missing or corrupted. Fingerprint: "${record.fingerprint}"`,
      };
    }

    await tempPrisma.$disconnect();
    return {
      isValid: true,
      environment: record.environment as Environment,
      error: null,
    };
  } catch (error: any) {
    await tempPrisma.$disconnect().catch(() => {});
    
    // Connection errors are also failures
    return {
      isValid: false,
      environment: null,
      error: `CRITICAL: Failed to validate environment fingerprint: ${error.message}`,
    };
  }
}

/**
 * Initialize environment fingerprint in a database
 * 
 * This should ONLY be called during database setup/migration.
 * 
 * @param databaseUrl - Database connection URL
 * @param environment - Environment to set ('dev', 'staging', or 'prod')
 * @param fingerprint - Optional custom fingerprint string
 */
export async function initializeEnvironmentFingerprint(
  databaseUrl: string,
  environment: Environment,
  fingerprint?: string
): Promise<void> {
  // Lazy import PrismaClient (must be called after prisma generate)
  let PrismaClient: any;
  try {
    // Clear module cache to ensure we get the freshly generated client
    const modulePaths = Object.keys(require.cache || {});
    modulePaths.forEach(path => {
      if (path.includes('@prisma/client') || path.includes('.prisma')) {
        delete require.cache[path];
      }
    });
    
    try {
      const prismaClientPath = require.resolve('@prisma/client');
      delete require.cache[prismaClientPath];
    } catch {
      // If resolve fails, that's OK
    }
    
    const prismaModule = require('@prisma/client');
    PrismaClient = prismaModule.PrismaClient;
  } catch (error) {
    throw new Error(
      `Failed to import PrismaClient for fingerprint initialization. ` +
      `Ensure 'npx prisma generate' has run. Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  
  const tempPrisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['error'],
  });

  try {
    const finalFingerprint = fingerprint || `${environment}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create or update the fingerprint
    await tempPrisma.$executeRaw`
      INSERT INTO database_metadata (id, environment, fingerprint, "createdAt", "updatedAt")
      VALUES ('singleton', ${environment}, ${finalFingerprint}, NOW(), NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        environment = ${environment},
        fingerprint = ${finalFingerprint},
        "updatedAt" = NOW()
    `;

    await tempPrisma.$disconnect();
  } catch (error: any) {
    await tempPrisma.$disconnect().catch(() => {});
    throw new Error(`Failed to initialize environment fingerprint: ${error.message}`);
  }
}

/**
 * Get expected environment from context
 * 
 * Determines expected environment based on:
 * - NODE_ENV
 * - DATABASE_URL patterns
 * - CI environment
 */
export function getExpectedEnvironment(): Environment {
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const dbUrl = (process.env.DATABASE_URL || '').toLowerCase();
  const devDbUrl = (process.env.DEV_DATABASE_URL || '').toLowerCase();
  const prodDbUrl = (process.env.PROD_DATABASE_URL || '').toLowerCase();

  // If PROD_DATABASE_URL is set, we're expecting production
  if (prodDbUrl && dbUrl === prodDbUrl) {
    return 'prod';
  }

  // If DEV_DATABASE_URL is set, we're expecting development
  if (devDbUrl && dbUrl === devDbUrl) {
    return 'dev';
  }

  // Fallback to NODE_ENV
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    return 'prod';
  }

  if (nodeEnv === 'staging') {
    return 'staging';
  }

  return 'dev';
}
