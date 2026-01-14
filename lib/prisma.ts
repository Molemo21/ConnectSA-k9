import { PrismaClient } from '@prisma/client';
import { getDatabaseConfig } from './db-safety';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 200;
const MAX_RETRY_DELAY = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Early DATABASE_URL validation (before Prisma client initialization)
function validateDatabaseUrlEarly() {
  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const ci = process.env.CI || '';
  const isCI = ci === 'true' || ci === '1' || ci.toLowerCase() === 'true';
  
  // Classify database URL
  const urlLower = dbUrl.toLowerCase();
  const isProd = urlLower.includes('pooler.supabase.com') ||
                urlLower.includes('supabase.com:5432') ||
                urlLower.includes('aws-0-eu-west-1') ||
                (urlLower.includes('supabase') && !urlLower.includes('localhost'));
  
  // CRITICAL: Development/test cannot use production database
  if ((nodeEnv === 'development' || nodeEnv === 'test') && isProd && !isCI) {
    throw new Error(
      'SECURITY VIOLATION: Cannot initialize Prisma client with production DATABASE_URL ' +
      'in development/test context. Process exits before Prisma initializes.'
    );
  }
  
  // CRITICAL: Production mutations require CI=true
  if (nodeEnv === 'production' && isProd && !isCI) {
    throw new Error(
      'SECURITY VIOLATION: Production database access requires CI=true. ' +
      'Local production access is PERMANENTLY BLOCKED.'
    );
  }
}

// Enhanced database URL configuration with safety checks
function getDatabaseUrl() {
  // Early validation (before any Prisma operations)
  validateDatabaseUrlEarly();
  
  // Use safety-validated database configuration
  const config = getDatabaseConfig();
  
  console.log(`🔗 Database URL configured for ${config.environment} environment`);
  return config.databaseUrl;
}

class PrismaWithRetry extends PrismaClient {
  private isConnected: boolean = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: getDatabaseUrl()
        }
      }
    });
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