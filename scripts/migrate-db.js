#!/usr/bin/env node

/**
 * Database Migration Strategy Script
 * 
 * This script provides a comprehensive database migration strategy
 * with backup, validation, and rollback capabilities.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DatabaseMigrationManager {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn', 'info'],
      errorFormat: 'pretty'
    });
    
    this.backupDir = './database-backups';
    this.migrationLogFile = './migration.log';
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Logging function
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.migrationLogFile, logMessage + '\n');
  }

  // Create database backup
  async createBackup(description = '') {
    this.log(`Creating database backup: ${description}`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
    
    try {
      // Extract database connection details
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      // Parse connection string
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Create backup using pg_dump
      const pgDumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;
      
      // Set password environment variable
      process.env.PGPASSWORD = password;
      
      execSync(pgDumpCommand, { 
        stdio: 'pipe',
        output: fs.createWriteStream(backupFile)
      });

      this.log(`Backup created successfully: ${backupFile}`);
      return backupFile;
      
    } catch (error) {
      this.log(`Backup creation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Validate database schema
  async validateSchema() {
    this.log('Validating database schema...');
    
    const validationResults = {
      tables: { status: 'unknown', missing: [], extra: [] },
      columns: { status: 'unknown', issues: [] },
      indexes: { status: 'unknown', missing: [], extra: [] },
      constraints: { status: 'unknown', issues: [] }
    };

    try {
      // Check required tables
      const requiredTables = [
        'users', 'providers', 'services', 'service_categories',
        'bookings', 'payments', 'reviews', 'provider_services',
        'ProviderReview', 'VerificationToken', 'PasswordResetToken',
        'booking_drafts', 'notifications'
      ];

      const existingTables = await this.prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      const tableNames = existingTables.map(t => t.table_name);
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));
      const extraTables = tableNames.filter(table => !requiredTables.includes(table));

      validationResults.tables = {
        status: missingTables.length === 0 ? 'valid' : 'invalid',
        missing: missingTables,
        extra: extraTables
      };

      // Check enum values
      const bookingStatusValues = await this.prisma.$queryRaw`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'BookingStatus')
        ORDER BY enumsortorder
      `;

      const requiredBookingStatuses = [
        'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION',
        'COMPLETED', 'CANCELLED', 'PENDING_EXECUTION', 'PAYMENT_PROCESSING', 'DISPUTED'
      ];

      const existingBookingStatuses = bookingStatusValues.map(v => v.enumlabel);
      const missingBookingStatuses = requiredBookingStatuses.filter(status => !existingBookingStatuses.includes(status));

      if (missingBookingStatuses.length > 0) {
        validationResults.columns.issues.push(`Missing BookingStatus values: ${missingBookingStatuses.join(', ')}`);
      }

      // Test basic operations
      await this.prisma.user.count();
      await this.prisma.provider.count();
      await this.prisma.booking.count();
      await this.prisma.payment.count();

      this.log('Schema validation completed');
      return validationResults;

    } catch (error) {
      this.log(`Schema validation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Run Prisma migrations
  async runMigrations() {
    this.log('Running Prisma migrations...');
    
    try {
      // Generate Prisma client
      this.log('Generating Prisma client...');
      execSync('npx prisma generate', { stdio: 'inherit' });

      // Deploy migrations
      this.log('Deploying migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });

      this.log('Migrations completed successfully');
      return true;

    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Verify migration success
  async verifyMigration() {
    this.log('Verifying migration success...');
    
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      this.log('Database connection verified');

      // Test basic operations
      const userCount = await this.prisma.user.count();
      const providerCount = await this.prisma.provider.count();
      const bookingCount = await this.prisma.booking.count();
      const paymentCount = await this.prisma.payment.count();

      this.log(`Database operations verified - Users: ${userCount}, Providers: ${providerCount}, Bookings: ${bookingCount}, Payments: ${paymentCount}`);

      // Validate schema
      const validationResults = await this.validateSchema();
      
      if (validationResults.tables.status === 'valid') {
        this.log('Schema validation passed');
        return true;
      } else {
        this.log('Schema validation failed', 'error');
        return false;
      }

    } catch (error) {
      this.log(`Migration verification failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Rollback migration
  async rollbackMigration(backupFile) {
    this.log(`Rolling back migration using backup: ${backupFile}`);
    
    try {
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }

      // Extract database connection details
      const dbUrl = process.env.DATABASE_URL;
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1);
      const username = url.username;
      const password = url.password;

      // Restore backup
      const psqlCommand = `psql -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;
      
      process.env.PGPASSWORD = password;
      
      execSync(`${psqlCommand} < ${backupFile}`, { stdio: 'inherit' });

      this.log('Rollback completed successfully');
      return true;

    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Get migration status
  async getMigrationStatus() {
    this.log('Checking migration status...');
    
    try {
      // Check Prisma migration status
      const migrationStatus = execSync('npx prisma migrate status', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      this.log('Migration status retrieved');
      return migrationStatus;

    } catch (error) {
      this.log(`Failed to get migration status: ${error.message}`, 'error');
      return null;
    }
  }

  // Clean up old backups
  cleanupOldBackups(keepDays = 7) {
    this.log(`Cleaning up backups older than ${keepDays} days...`);
    
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      let deletedCount = 0;
      files.forEach(file => {
        if (file.startsWith('backup-') && file.endsWith('.sql')) {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
            this.log(`Deleted old backup: ${file}`);
          }
        }
      });

      this.log(`Cleanup completed - deleted ${deletedCount} old backups`);
      return deletedCount;

    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      return 0;
    }
  }

  // Full migration process
  async runFullMigration(description = 'Full migration') {
    let backupFile = null;
    
    try {
      this.log(`Starting full migration process: ${description}`);
      
      // Step 1: Create backup
      backupFile = await this.createBackup(`Before ${description}`);
      
      // Step 2: Validate current schema
      const preValidation = await this.validateSchema();
      this.log('Pre-migration validation completed');
      
      // Step 3: Run migrations
      await this.runMigrations();
      
      // Step 4: Verify migration
      const verificationSuccess = await this.verifyMigration();
      
      if (verificationSuccess) {
        this.log('Full migration completed successfully');
        return { success: true, backupFile };
      } else {
        this.log('Migration verification failed, initiating rollback', 'error');
        await this.rollbackMigration(backupFile);
        return { success: false, error: 'Migration verification failed' };
      }

    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      
      // Attempt rollback if backup exists
      if (backupFile) {
        try {
          await this.rollbackMigration(backupFile);
          this.log('Rollback completed after migration failure');
        } catch (rollbackError) {
          this.log(`Rollback failed: ${rollbackError.message}`, 'error');
        }
      }
      
      return { success: false, error: error.message };
    }
  }

  // Close database connection
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const manager = new DatabaseMigrationManager();
  const command = process.argv[2];
  const description = process.argv[3] || '';

  try {
    switch (command) {
      case 'backup':
        await manager.createBackup(description);
        break;

      case 'validate':
        const validation = await manager.validateSchema();
        console.log('Validation results:', JSON.stringify(validation, null, 2));
        break;

      case 'migrate':
        await manager.runMigrations();
        break;

      case 'verify':
        const success = await manager.verifyMigration();
        process.exit(success ? 0 : 1);
        break;

      case 'rollback':
        const backupFile = process.argv[3];
        if (!backupFile) {
          console.error('❌ Please specify backup file: rollback <backup-file>');
          process.exit(1);
        }
        await manager.rollbackMigration(backupFile);
        break;

      case 'status':
        const status = await manager.getMigrationStatus();
        console.log(status);
        break;

      case 'full-migrate':
        const result = await manager.runFullMigration(description);
        if (result.success) {
          console.log('✅ Full migration completed successfully');
        } else {
          console.error('❌ Full migration failed:', result.error);
          process.exit(1);
        }
        break;

      case 'cleanup':
        const keepDays = parseInt(process.argv[3]) || 7;
        manager.cleanupOldBackups(keepDays);
        break;

      default:
        console.log(`
🗄️ Database Migration Manager

Usage:
  node scripts/migrate-db.js <command> [options]

Commands:
  backup [description]           Create database backup
  validate                      Validate current schema
  migrate                       Run Prisma migrations
  verify                        Verify migration success
  rollback <backup-file>        Rollback using backup
  status                        Check migration status
  full-migrate [description]    Run full migration with backup
  cleanup [days]                Clean up old backups

Examples:
  node scripts/migrate-db.js backup "Before adding new features"
  node scripts/migrate-db.js validate
  node scripts/migrate-db.js full-migrate "Production deployment"
  node scripts/migrate-db.js cleanup 7
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseMigrationManager;
