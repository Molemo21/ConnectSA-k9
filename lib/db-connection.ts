import { PrismaClient } from '@prisma/client';

// Connection pool management
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;
  private isConnected = false;

  private constructor() {
    // Fix for Supabase prepared statement conflicts
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = databaseUrl?.replace(':6543/', ':5432/').replace('?pgbouncer=true', '');
    
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: directUrl || process.env.DATABASE_URL,
        },
      },
      // Disable prepared statements to avoid conflicts
      __internal: {
        engine: {
          enableEngineDebugMode: false,
        },
      },
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.prisma.$connect();
        this.isConnected = true;
        console.log('Database connected successfully');
      } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('Database disconnected successfully');
      } catch (error) {
        console.error('Database disconnection failed:', error);
        throw error;
      }
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Use a simple query instead of raw query
      await this.prisma.user.findFirst();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const dbConnection = DatabaseConnection.getInstance();

// Initialize connection
dbConnection.connect().catch(console.error);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Closing database connections...`);
  await dbConnection.disconnect();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', () => dbConnection.disconnect());

// Export the Prisma client
export const prisma = dbConnection.getClient();

// Export connection utilities
export const connectDB = () => dbConnection.connect();
export const disconnectDB = () => dbConnection.disconnect();
export const healthCheck = () => dbConnection.healthCheck();

export default prisma; 