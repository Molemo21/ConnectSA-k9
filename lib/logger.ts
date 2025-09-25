/**
 * Centralized Error Logging System for ConnectSA
 * 
 * Provides structured logging with:
 * - timestamp
 * - service name
 * - action
 * - status
 * - error_code
 * - message
 * 
 * Environment-specific behavior:
 * - Development: Pretty console output
 * - Production: Structured JSON logs to file/DB
 */

// Only import Node.js modules on server-side
let fs: any, path: any;
if (typeof window === 'undefined') {
  fs = require('fs');
  path = require('path');
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type ServiceName = 'booking' | 'payment' | 'provider' | 'client' | 'admin' | 'auth' | 'webhook' | 'system';
export type ActionType = 
  | 'create' | 'update' | 'delete' | 'accept' | 'reject' | 'cancel' | 'complete'
  | 'init' | 'verify' | 'webhook' | 'escrow_release' | 'transfer' | 'refund'
  | 'login' | 'signup' | 'verify_email' | 'reset_password'
  | 'dashboard_load' | 'stats_load' | 'profile_update'
  | 'system_start' | 'system_error';

export type StatusType = 'success' | 'failed' | 'pending' | 'retry' | 'timeout';

export interface LogEntry {
  timestamp: string;
  service: ServiceName;
  action: ActionType;
  status: StatusType;
  error_code?: string;
  message: string;
  level: LogLevel;
  userId?: string;
  bookingId?: string;
  paymentId?: string;
  providerId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableDatabase: boolean;
  logFilePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

class CentralizedLogger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private isProcessing = false;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      enableConsole: true, // Always enable console logging
      enableFile: false, // Disable file logging in serverless environments
      enableDatabase: process.env.NODE_ENV === 'production',
      logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config
    };

    // Skip file system operations in serverless environments or client-side
    if (this.config.enableFile && this.config.logFilePath && !process.env.VERCEL && typeof window === 'undefined' && fs) {
      const logDir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.enableConsole && process.env.NODE_ENV !== 'production') {
      // Pretty format for development
      const emoji = {
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        debug: '🔍'
      }[entry.level];

      const statusEmoji = {
        success: '✅',
        failed: '❌',
        pending: '⏳',
        retry: '🔄',
        timeout: '⏰'
      }[entry.status];

      return `${emoji} [${entry.timestamp}] ${statusEmoji} ${entry.service.toUpperCase()}.${entry.action.toUpperCase()}: ${entry.message}${
        entry.error_code ? ` (${entry.error_code})` : ''
      }${entry.userId ? ` | User: ${entry.userId}` : ''}${
        entry.bookingId ? ` | Booking: ${entry.bookingId}` : ''
      }${entry.paymentId ? ` | Payment: ${entry.paymentId}` : ''}${
        entry.metadata ? ` | Data: ${JSON.stringify(entry.metadata)}` : ''
      }`;
    } else {
      // Structured JSON for production
      return JSON.stringify(entry);
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile || !this.config.logFilePath || typeof window !== 'undefined' || !fs) return;

    try {
      const logLine = this.formatLogEntry(entry) + '\n';
      
      // Check file size and rotate if needed
      if (fs.existsSync(this.config.logFilePath)) {
        const stats = fs.statSync(this.config.logFilePath);
        if (stats.size > this.config.maxFileSize!) {
          await this.rotateLogFile();
        }
      }

      fs.appendFileSync(this.config.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(): Promise<void> {
    if (!this.config.logFilePath || typeof window !== 'undefined' || !fs || !path) return;

    try {
      const logDir = path.dirname(this.config.logFilePath);
      const logFileName = path.basename(this.config.logFilePath, '.log');
      
      // Rotate existing files
      for (let i = this.config.maxFiles! - 1; i > 0; i--) {
        const oldFile = path.join(logDir, `${logFileName}.${i}.log`);
        const newFile = path.join(logDir, `${logFileName}.${i + 1}.log`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles! - 1) {
            fs.unlinkSync(oldFile); // Delete oldest file
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Move current log to .1
      if (fs.existsSync(this.config.logFilePath)) {
        fs.renameSync(this.config.logFilePath, path.join(logDir, `${logFileName}.1.log`));
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.config.enableDatabase) return;

    try {
      // Import Prisma dynamically to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      await prisma.auditLog.create({
        data: {
          timestamp: new Date(entry.timestamp),
          service: entry.service,
          action: entry.action,
          status: entry.status,
          errorCode: entry.error_code,
          message: entry.message,
          level: entry.level,
          userId: entry.userId,
          bookingId: entry.bookingId,
          paymentId: entry.paymentId,
          providerId: entry.providerId,
          metadata: entry.metadata,
          stack: entry.stack,
        }
      });

      await prisma.$disconnect();
    } catch (error) {
      console.error('Failed to write to database:', error);
    }
  }

  private async processLogQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    const entries = [...this.logQueue];
    this.logQueue = [];

    for (const entry of entries) {
      try {
        // Console output
        if (this.config.enableConsole) {
          console.log(this.formatLogEntry(entry));
        }

        // File output
        await this.writeToFile(entry);

        // Database output
        await this.writeToDatabase(entry);
      } catch (error) {
        console.error('Failed to process log entry:', error);
      }
    }

    this.isProcessing = false;
  }

  private log(level: LogLevel, service: ServiceName, action: ActionType, status: StatusType, message: string, options?: {
    error_code?: string;
    userId?: string;
    bookingId?: string;
    paymentId?: string;
    providerId?: string;
    metadata?: Record<string, any>;
    error?: Error;
  }): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      service,
      action,
      status,
      error_code: options?.error_code,
      message,
      level,
      userId: options?.userId,
      bookingId: options?.bookingId,
      paymentId: options?.paymentId,
      providerId: options?.providerId,
      metadata: options?.metadata,
      stack: options?.error?.stack,
    };

    this.logQueue.push(entry);
    
    // Process queue asynchronously
    setImmediate(() => this.processLogQueue());
  }

  // Public logging methods
  info(service: ServiceName, action: ActionType, status: StatusType, message: string, options?: Parameters<typeof this.log>[5]): void {
    this.log('info', service, action, status, message, options);
  }

  warn(service: ServiceName, action: ActionType, status: StatusType, message: string, options?: Parameters<typeof this.log>[5]): void {
    this.log('warn', service, action, status, message, options);
  }

  error(service: ServiceName, action: ActionType, status: StatusType, message: string, options?: Parameters<typeof this.log>[5]): void {
    this.log('error', service, action, status, message, options);
  }

  debug(service: ServiceName, action: ActionType, status: StatusType, message: string, options?: Parameters<typeof this.log>[5]): void {
    this.log('debug', service, action, status, message, options);
  }

  // Convenience methods for common scenarios
  bookingSuccess(action: ActionType, message: string, options?: { bookingId?: string; userId?: string; metadata?: Record<string, any> }): void {
    this.info('booking', action, 'success', message, options);
  }

  bookingError(action: ActionType, message: string, error: Error, options?: { bookingId?: string; userId?: string; error_code?: string; metadata?: Record<string, any> }): void {
    this.error('booking', action, 'failed', message, { ...options, error });
  }

  paymentSuccess(action: ActionType, message: string, options?: { paymentId?: string; bookingId?: string; userId?: string; metadata?: Record<string, any> }): void {
    this.info('payment', action, 'success', message, options);
  }

  paymentError(action: ActionType, message: string, error: Error, options?: { paymentId?: string; bookingId?: string; userId?: string; error_code?: string; metadata?: Record<string, any> }): void {
    this.error('payment', action, 'failed', message, { ...options, error });
  }

  dashboardSuccess(service: ServiceName, action: ActionType, message: string, options?: { userId?: string; metadata?: Record<string, any> }): void {
    this.info(service, action, 'success', message, options);
  }

  dashboardError(service: ServiceName, action: ActionType, message: string, error: Error, options?: { userId?: string; error_code?: string; metadata?: Record<string, any> }): void {
    this.error(service, action, 'failed', message, { ...options, error });
  }
}

// Create singleton instance
const logger = new CentralizedLogger();

// Export both the instance and the class for testing
export { logger, CentralizedLogger };

// Export convenience functions
export const logBooking = {
  success: (action: ActionType, message: string, options?: { bookingId?: string; userId?: string; metadata?: Record<string, any> }) => 
    logger.bookingSuccess(action, message, options),
  error: (action: ActionType, message: string, error: Error, options?: { bookingId?: string; userId?: string; error_code?: string; metadata?: Record<string, any> }) => 
    logger.bookingError(action, message, error, options),
};

export const logPayment = {
  success: (action: ActionType, message: string, options?: { paymentId?: string; bookingId?: string; userId?: string; metadata?: Record<string, any> }) => 
    logger.paymentSuccess(action, message, options),
  error: (action: ActionType, message: string, error: Error, options?: { paymentId?: string; bookingId?: string; userId?: string; error_code?: string; metadata?: Record<string, any> }) => 
    logger.paymentError(action, message, error, options),
};

export const logDashboard = {
  success: (service: ServiceName, action: ActionType, message: string, options?: { userId?: string; metadata?: Record<string, any> }) => 
    logger.dashboardSuccess(service, action, message, options),
  error: (service: ServiceName, action: ActionType, message: string, error: Error, options?: { userId?: string; error_code?: string; metadata?: Record<string, any> }) => 
    logger.dashboardError(service, action, message, error, options),
};

// Export logSystem for socket-client compatibility
export const logSystem = {
  success: (service: ServiceName, action: ActionType, message: string, options?: { userId?: string; metadata?: Record<string, any> }) => 
    logger.info(service, action, 'success', message, options),
  error: (service: ServiceName, action: ActionType, message: string, error: Error, options?: { userId?: string; error_code?: string; metadata?: Record<string, any> }) => 
    logger.error(service, action, 'failed', message, { ...options, error }),
};

export default logger;
