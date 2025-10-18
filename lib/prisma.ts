import { PrismaClient } from '@prisma/client';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 200;
const MAX_RETRY_DELAY = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced database URL configuration
function getDatabaseUrl() {
  // Use environment variable for database URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  console.log('🔗 Database URL configured from environment variables');
  return databaseUrl;
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