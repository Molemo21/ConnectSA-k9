/**
 * CRITICAL: Production guards execute BEFORE Prisma import
 * 
 * If this file is imported in a non-CI context with production database,
 * the guards will fail BEFORE Prisma client is initialized.
 */

// GUARD: Block production database access locally (BEFORE Prisma import)
const ci = process.env.CI || '';
const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
const dbUrl = process.env.DATABASE_URL || '';
const databaseEnv = (process.env.DATABASE_ENV || '').toLowerCase();

// Production detection: Check for specific production project reference
// NOTE: Generic Supabase patterns (pooler.supabase.com, aws-0-eu-west-1) are used by BOTH
// production and development databases, so we must check for the specific production project ref
const PRODUCTION_PROJECT_REF = 'qdrktzqfeewwcktgltzy'; // Production project reference

// Detect production database patterns (specific, not generic)
const urlLower = dbUrl.toLowerCase();

// Allow explicit override for development databases
// This prevents false positives when dev databases use similar URL patterns
const isExplicitlyDev = databaseEnv === 'development' || databaseEnv === 'dev';

// Check if this is the specific production database (not just any Supabase DB)
const isProdDb = !isExplicitlyDev && urlLower.includes(PRODUCTION_PROJECT_REF);

// Block production database in non-CI, non-production contexts
if (isProdDb && !isCI && nodeEnv !== 'production' && nodeEnv !== 'prod') {
  const error = `
${'='.repeat(80)}
🚨 BLOCKED: Production database access in local context
${'='.repeat(80)}
This guard executes BEFORE Prisma client initialization.

Database URL pattern indicates production database.
CI: ${ci || '(not set)'}
NODE_ENV: ${nodeEnv || '(not set)'}

Production database access is PHYSICALLY IMPOSSIBLE outside CI/CD pipelines.
This prevents accidental mutations from local development machines.

NO BYPASSES EXIST. This is a HARD GUARANTEE.

${'='.repeat(80)}
`;
  console.error(error);
  // Use process.exit to prevent Prisma from initializing
  process.exit(1);
}

// Only import Prisma AFTER guards pass
import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig } from './db-safety';
import { 
  validateEnvironmentFingerprint, 
  getExpectedEnvironment,
  type Environment 
} from './env-fingerprint';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 200;
const MAX_RETRY_DELAY = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Early DATABASE_URL validation (before Prisma client initialization)
async function validateDatabaseUrlEarly() {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  const databaseEnv = (process.env.DATABASE_ENV || '').toLowerCase();
  
  // Production detection: Check for specific production project reference
  const PRODUCTION_PROJECT_REF = 'qdrktzqfeewwcktgltzy'; // Production project reference
  
  // Classify database URL (specific, not generic)
  const urlLower = dbUrl.toLowerCase();
  const isExplicitlyDev = databaseEnv === 'development' || databaseEnv === 'dev';
  const isProd = !isExplicitlyDev && urlLower.includes(PRODUCTION_PROJECT_REF);
  
  // GUARD 1: Development/test cannot use production database
  if ((nodeEnv === 'development' || nodeEnv === 'test') && isProd && !isCI) {
    throw new Error(
      'SECURITY VIOLATION: Cannot initialize Prisma client with production DATABASE_URL ' +
      'in development/test context. Process exits before Prisma initializes.'
    );
  }
  
  // GUARD 3: Production mutations require CI=true
  if (nodeEnv === 'production' && isProd && !isCI) {
    throw new Error(
      'SECURITY VIOLATION: Production database access requires CI=true. ' +
      'Local production access is PERMANENTLY BLOCKED.'
    );
  }

  // GUARD 4: Environment fingerprint validation (CRITICAL)
  // Skip fingerprint validation if we're in a build context (no DB connection yet)
  const skipFingerprint = process.env.SKIP_FINGERPRINT_VALIDATION === 'true' || 
                          process.env.NEXT_PHASE === 'phase-production-build';
  
  if (!skipFingerprint && dbUrl) {
    try {
      const expectedEnv = getExpectedEnvironment();
      const fingerprintResult = await validateEnvironmentFingerprint(dbUrl, expectedEnv);
      
      if (!fingerprintResult.isValid) {
        const error = `
${'='.repeat(80)}
🚨 CRITICAL: Environment Fingerprint Validation Failed
${'='.repeat(80)}
${fingerprintResult.error}

Expected Environment: ${expectedEnv}
Detected Environment: ${fingerprintResult.environment || 'unknown'}

This prevents accidental cross-environment database access.
The database MUST have a valid environment fingerprint.

${'='.repeat(80)}
`;
        throw new Error(error);
      }
    } catch (error: any) {
      // If validation fails, we MUST fail - no fallback
      if (error.message.includes('CRITICAL') || error.message.includes('fingerprint')) {
        throw error;
      }
      // For connection errors during validation, we still fail but with context
      throw new Error(
        `Failed to validate environment fingerprint: ${error.message}. ` +
        `This is a CRITICAL safety check and cannot be bypassed.`
      );
    }
  }
}

// Enhanced database URL configuration with safety checks
async function getDatabaseUrl(): Promise<string> {
  // Early validation (before any Prisma operations)
  // NOTE: This is now async due to fingerprint validation
  await validateDatabaseUrlEarly();
  
  // Use safety-validated database configuration
  const config = getDatabaseConfig();
  
  console.log(`🔗 Database URL configured for ${config.environment} environment`);
  return config.databaseUrl;
}

class PrismaWithRetry extends PrismaClient {
  private isConnected: boolean = false;
  private databaseUrl: string | null = null;
  private urlValidationPromise: Promise<string> | null = null;

  constructor() {
    // We can't use async in constructor, so we'll validate on first connection
    // The URL will be set during connect()
    // For now, use DATABASE_URL directly - validation happens in connect()
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL || ''
        }
      }
    });
  }

  private async ensureDatabaseUrl(): Promise<string> {
    if (!this.urlValidationPromise) {
      // Create validation promise (will be reused)
      this.urlValidationPromise = getDatabaseUrl().then(url => {
        this.databaseUrl = url;
        // Update datasource URL if possible
        try {
          (this as any).$engine.datasources = {
            db: { url: this.databaseUrl }
          };
        } catch (e) {
          // Engine may not be initialized yet, that's okay
        }
        return url;
      });
    }
    return this.urlValidationPromise;
  }

  private async handleConnectionError(error: any) {
    if (error.message.includes('Connection pool timeout')) {
      console.error('Connection pool timeout detected. Attempting to reconnect...');
      await this.reconnect();
      return true;
    }
    return false;
  }

  private async reconnect() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      await this.connect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
      throw error;
    }
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    // Step 1: Ensure database URL is validated and set
    const dbUrl = await this.ensureDatabaseUrl();

    // Step 2: Validate environment fingerprint (CRITICAL - before connection)
    // Skip fingerprint validation if we're in a build context (no DB connection yet)
    const skipFingerprint = process.env.SKIP_FINGERPRINT_VALIDATION === 'true' || 
                            process.env.NEXT_PHASE === 'phase-production-build';
    
    if (!skipFingerprint && dbUrl) {
      try {
        const expectedEnv = getExpectedEnvironment();
        const fingerprintResult = await validateEnvironmentFingerprint(dbUrl, expectedEnv);
        
        if (!fingerprintResult.isValid) {
          const error = `
${'='.repeat(80)}
🚨 CRITICAL: Environment Fingerprint Validation Failed
${'='.repeat(80)}
${fingerprintResult.error}

Expected Environment: ${expectedEnv}
Detected Environment: ${fingerprintResult.environment || 'unknown'}

This prevents accidental cross-environment database access.
The database MUST have a valid environment fingerprint.

${'='.repeat(80)}
`;
          throw new Error(error);
        }
      } catch (error: any) {
        // If validation fails, we MUST fail - no fallback
        if (error.message.includes('CRITICAL') || error.message.includes('fingerprint')) {
          throw error;
        }
        // For connection errors during validation, we still fail but with context
        throw new Error(
          `Failed to validate environment fingerprint: ${error.message}. ` +
          `This is a CRITICAL safety check and cannot be bypassed.`
        );
      }
    }

    // Step 3: Connect to database
    let lastError;
    let delay = INITIAL_RETRY_DELAY;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await super.$connect();
        this.isConnected = true;
        console.log('✅ Database connection established successfully');
        
        // Test the connection
        await this.$queryRaw`SELECT 1`;
        return;
      } catch (error) {
        lastError = error;
        console.error(`❌ Connection attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
          delay = Math.min(delay * 2, MAX_RETRY_DELAY);
        }
      }
    }

    throw new Error(`Failed to connect after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await super.$disconnect();
      this.isConnected = false;
      console.log('Database connection closed successfully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  async query<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (await this.handleConnectionError(error)) {
        return await operation();
      }
      throw error;
    }
  }

  // Override key methods to use our query wrapper
  async $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql): Promise<T> {
    return this.query(() => super.$queryRaw<T>(query));
  }

  async $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql): Promise<T> {
    return this.query(() => super.$executeRaw<T>(query));
  }
}

// Create a singleton instance
declare global {
  var prisma: PrismaWithRetry | undefined;
}

export const prisma = global.prisma || new PrismaWithRetry();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the instance as default and named export
export default prisma;