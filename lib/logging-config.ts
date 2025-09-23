/**
 * Logging Configuration for ConnectSA
 * 
 * This file contains environment-specific logging configurations
 * and sample error scenarios for testing the logging system.
 */

import { CentralizedLogger, LogLevel } from './logger';

// Environment-specific configuration
export const getLoggingConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info'),
    enableConsole: isDevelopment || process.env.ENABLE_CONSOLE_LOGGING === 'true',
    enableFile: isProduction || process.env.ENABLE_FILE_LOGGING === 'true',
    enableDatabase: isProduction || process.env.ENABLE_DATABASE_LOGGING === 'true',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  };
};

// Sample error scenarios for testing
export const sampleErrorScenarios = {
  // Failed booking scenarios
  failedBooking: {
    noProvidersAvailable: () => {
      const logger = new CentralizedLogger(getLoggingConfig());
      logger.bookingError('create', 'No providers available for booking', new Error('No available providers'), {
        userId: 'user_123',
        serviceId: 'service_456',
        scheduledDate: '2024-01-15',
        error_code: 'NO_PROVIDERS_AVAILABLE',
        metadata: {
          totalProviders: 0,
          availableProviders: 0,
          approvedProviders: 0,
          serviceCategory: 'plumbing',
          requestedTime: '14:00'
        }
      });
    },

    providerConflict: () => {
      const logger = new CentralizedLogger(getLoggingConfig());
      logger.bookingError('create', 'Provider has conflicting booking', new Error('Provider double-booked'), {
        userId: 'user_123',
        serviceId: 'service_456',
        providerId: 'provider_789',
        scheduledDate: '2024-01-15',
        error_code: 'PROVIDER_CONFLICT',
        metadata: {
          conflictingBookingId: 'booking_999',
          conflictingTime: '2024-01-15T14:00:00Z',
          requestedTime: '2024-01-15T14:00:00Z',
          timeDifference: '0 hours'
        }
      });
    },

    invalidBookingData: () => {
      const logger = new CentralizedLogger(getLoggingConfig());
      logger.bookingError('create', 'Invalid booking data provided', new Error('Validation failed'), {
        userId: 'user_123',
        error_code: 'VALIDATION_ERROR',
        metadata: {
          validationErrors: [
            { field: 'serviceId', message: 'Service ID must be 25 alphanumeric characters' },
            { field: 'address', message: 'Address is required' },
            { field: 'date', message: 'Date must be in the future' }
          ],
          providedData: {
            serviceId: 'invalid_id',
            address: '',
            date: '2023-01-01'
          }
        }
      });
    },

    // Failed payment scenarios
    failedPayment: {
      paystackError: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.paymentError('init', 'Paystack payment initialization failed', new Error('Paystack API error'), {
          userId: 'user_123',
          bookingId: 'booking_456',
          paymentId: 'payment_789',
          error_code: 'PAYSTACK_ERROR',
          metadata: {
            paystackErrorCode: 'insufficient_funds',
            paystackErrorMessage: 'Customer account has insufficient funds',
            amount: 1500.00,
            currency: 'ZAR',
            paystackRef: 'ref_123456789'
          }
        });
      },

      paymentTimeout: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.paymentError('init', 'Payment initialization timeout', new Error('Request timeout'), {
          userId: 'user_123',
          bookingId: 'booking_456',
          error_code: 'PAYMENT_TIMEOUT',
          metadata: {
            timeoutDuration: '30 seconds',
            paystackEndpoint: 'https://api.paystack.co/transaction/initialize',
            retryAttempts: 3,
            lastAttempt: '2024-01-15T14:30:00Z'
          }
        });
      },

      duplicatePayment: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.paymentError('init', 'Duplicate payment attempt detected', new Error('Payment already exists'), {
          userId: 'user_123',
          bookingId: 'booking_456',
          existingPaymentId: 'payment_999',
          error_code: 'DUPLICATE_PAYMENT',
          metadata: {
            existingPaymentStatus: 'PENDING',
            existingPaymentAmount: 1500.00,
            existingPaystackRef: 'ref_999888777',
            timeSinceFirstAttempt: '5 minutes'
          }
        });
      },

      webhookFailure: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.paymentError('webhook', 'Webhook processing failed', new Error('Webhook validation failed'), {
          userId: 'user_123',
          bookingId: 'booking_456',
          paymentId: 'payment_789',
          error_code: 'WEBHOOK_FAILURE',
          metadata: {
            webhookEvent: 'charge.success',
            paystackRef: 'ref_123456789',
            webhookSignature: 'invalid_signature',
            retryCount: 3,
            lastRetryAt: '2024-01-15T14:35:00Z'
          }
        });
      }
    },

    // Dashboard API errors
    dashboardErrors: {
      unauthorizedAccess: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.dashboardError('provider', 'dashboard_load', 'Unauthorized dashboard access attempt', new Error('Unauthorized'), {
          userId: 'user_123',
          userRole: 'CLIENT',
          requestedResource: 'provider_dashboard',
          error_code: 'UNAUTHORIZED_ACCESS',
          metadata: {
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            attemptedAt: '2024-01-15T14:00:00Z'
          }
        });
      },

      databaseConnectionError: () => {
        const logger = new CentralizedLogger(getLoggingConfig());
        logger.dashboardError('client', 'dashboard_load', 'Database connection failed', new Error('Connection timeout'), {
          userId: 'user_123',
          error_code: 'DATABASE_CONNECTION_ERROR',
          metadata: {
            databaseHost: 'db.example.com',
            databasePort: 5432,
            connectionTimeout: '30 seconds',
            retryAttempts: 3,
            lastAttempt: '2024-01-15T14:00:00Z'
          }
        });
      }
    }
  };
};

// Function to run all sample error scenarios
export const runSampleErrorScenarios = () => {
  console.log('🧪 Running sample error scenarios for logging system...\n');
  
  const scenarios = sampleErrorScenarios;
  
  // Booking errors
  console.log('📋 Testing booking error scenarios:');
  scenarios.failedBooking.noProvidersAvailable();
  scenarios.failedBooking.providerConflict();
  scenarios.failedBooking.invalidBookingData();
  
  // Payment errors
  console.log('\n💳 Testing payment error scenarios:');
  scenarios.failedPayment.paystackError();
  scenarios.failedPayment.paymentTimeout();
  scenarios.failedPayment.duplicatePayment();
  scenarios.failedPayment.webhookFailure();
  
  // Dashboard errors
  console.log('\n📊 Testing dashboard error scenarios:');
  scenarios.dashboardErrors.unauthorizedAccess();
  scenarios.dashboardErrors.databaseConnectionError();
  
  console.log('\n✅ Sample error scenarios completed!');
};

// Export the configured logger instance
export const configuredLogger = new CentralizedLogger(getLoggingConfig());
