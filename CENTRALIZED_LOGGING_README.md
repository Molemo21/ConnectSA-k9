# Centralized Error Logging System

## Overview

The ConnectSA centralized logging system provides structured error logging across all backend services with environment-specific behavior and comprehensive error tracking.

## Features

### ✅ Structured Logging
- **Timestamp**: ISO format timestamp for all log entries
- **Service Name**: booking, payment, provider, client, admin, auth, webhook, system
- **Action**: create, update, delete, accept, reject, cancel, complete, init, verify, webhook, escrow_release, transfer, refund, login, signup, verify_email, reset_password, dashboard_load, stats_load, profile_update, system_start, system_error
- **Status**: success, failed, pending, retry, timeout
- **Error Code**: Standardized error codes for debugging
- **Message**: Human-readable log message
- **Metadata**: Additional context data (user IDs, booking IDs, payment IDs, etc.)

### ✅ Environment-Specific Behavior
- **Development**: Pretty console output with emojis and colors
- **Production**: Structured JSON logs stored in files and database
- **Configurable**: Environment variables control logging behavior

### ✅ Comprehensive Integration
- **Booking Flow**: Creation, acceptance/rejection, status updates
- **Payment Flow**: Initialization, verification, webhooks, escrow release, transfer simulation
- **Dashboard APIs**: Provider and client dashboard endpoints
- **Authentication**: Login, signup, email verification, password reset

## Usage

### Basic Logging

```typescript
import { logBooking, logPayment, logDashboard } from '@/lib/logger';

// Booking success
logBooking.success('create', 'Booking created successfully', {
  userId: 'user_123',
  bookingId: 'booking_456',
  metadata: { serviceName: 'Plumbing Repair' }
});

// Booking error
logBooking.error('create', 'No providers available', new Error('No available providers'), {
  userId: 'user_123',
  serviceId: 'service_456',
  error_code: 'NO_PROVIDERS_AVAILABLE',
  metadata: { totalProviders: 0 }
});

// Payment success
logPayment.success('init', 'Payment initialized successfully', {
  userId: 'user_123',
  bookingId: 'booking_456',
  paymentId: 'payment_789',
  metadata: { amount: 1500.00, currency: 'ZAR' }
});

// Payment error
logPayment.error('init', 'Paystack API error', new Error('API timeout'), {
  userId: 'user_123',
  bookingId: 'booking_456',
  error_code: 'PAYSTACK_TIMEOUT',
  metadata: { timeout: '30 seconds' }
});

// Dashboard success
logDashboard.success('provider', 'dashboard_load', 'Dashboard loaded successfully', {
  userId: 'user_123',
  metadata: { bookingCount: 15 }
});

// Dashboard error
logDashboard.error('client', 'dashboard_load', 'Database connection failed', new Error('Connection timeout'), {
  userId: 'user_123',
  error_code: 'DATABASE_CONNECTION_ERROR',
  metadata: { retryAttempts: 3 }
});
```

### Advanced Logging

```typescript
import { logger } from '@/lib/logger';

// Direct logger usage
logger.info('booking', 'update', 'success', 'Booking status updated', {
  userId: 'user_123',
  bookingId: 'booking_456',
  metadata: { 
    previousStatus: 'PENDING',
    newStatus: 'CONFIRMED',
    updatedBy: 'provider_789'
  }
});

logger.error('payment', 'webhook', 'failed', 'Webhook processing failed', new Error('Invalid signature'), {
  userId: 'user_123',
  paymentId: 'payment_789',
  error_code: 'WEBHOOK_VALIDATION_FAILED',
  metadata: {
    webhookEvent: 'charge.success',
    paystackRef: 'ref_123456789',
    retryCount: 3
  }
});
```

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL="info"  # debug, info, warn, error
LOG_FILE_PATH="./logs/app.log"  # Path for log files in production
ENABLE_DATABASE_LOGGING="true"  # Enable database logging in production
ENABLE_FILE_LOGGING="true"  # Enable file logging in production
ENABLE_CONSOLE_LOGGING="true"  # Enable console logging (default: true in dev, false in prod)
```

### Database Schema

The logging system uses the `AuditLog` table:

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  service TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  error_code TEXT,
  message TEXT NOT NULL,
  level TEXT NOT NULL,
  user_id TEXT,
  booking_id TEXT,
  payment_id TEXT,
  provider_id TEXT,
  metadata JSONB,
  stack TEXT
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_service ON audit_logs(service);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_booking_id ON audit_logs(booking_id);
CREATE INDEX idx_audit_logs_payment_id ON audit_logs(payment_id);
```

## Error Codes

### Booking Errors
- `UNAUTHORIZED`: Unauthorized booking attempt
- `INVALID_BOOKING_ID`: Invalid booking ID provided
- `BOOKING_NOT_FOUND`: Booking not found
- `FORBIDDEN`: User not authorized for booking
- `INVALID_STATUS`: Invalid booking status for operation
- `NO_PROVIDERS_AVAILABLE`: No providers available for service
- `PROVIDER_CONFLICT`: Provider has conflicting booking
- `VALIDATION_ERROR`: Input validation failed
- `NOTIFICATION_FAILED`: Failed to send notification
- `EMAIL_FAILED`: Failed to send email
- `INTERNAL_ERROR`: Unexpected internal error

### Payment Errors
- `UNAUTHORIZED`: Unauthorized payment attempt
- `INVALID_BOOKING_ID`: Invalid booking ID in payment request
- `BOOKING_NOT_FOUND`: Booking not found for payment
- `FORBIDDEN`: User not authorized for payment
- `INVALID_BOOKING_STATUS`: Invalid booking status for payment
- `INVALID_BOOKING_AMOUNT`: Invalid booking amount
- `MISSING_CLIENT_EMAIL`: Client email required for payment
- `PAYMENT_ALREADY_EXISTS`: Payment already exists for booking
- `PAYSTACK_ERROR`: Paystack API error
- `PAYSTACK_TIMEOUT`: Paystack API timeout
- `DUPLICATE_PAYMENT`: Duplicate payment attempt
- `WEBHOOK_FAILURE`: Webhook processing failed
- `WEBHOOK_VALIDATION_FAILED`: Webhook signature validation failed
- `PAYMENT_INIT_FAILED`: Payment initialization failed
- `INTERNAL_ERROR`: Unexpected internal error

### Dashboard Errors
- `NOT_AUTHENTICATED`: User not authenticated
- `UNAUTHORIZED_ROLE`: User role not authorized for resource
- `PROVIDER_NOT_FOUND`: Provider profile not found
- `UNAUTHORIZED_ACCESS`: Unauthorized access attempt
- `DATABASE_CONNECTION_ERROR`: Database connection failed
- `INVALID_USER_ROLE`: Invalid user role
- `INTERNAL_ERROR`: Unexpected internal error

## Sample Error Scenarios

The system includes comprehensive sample error scenarios for testing:

```typescript
import { sampleErrorScenarios } from '@/lib/logging-config';

// Test booking errors
sampleErrorScenarios.failedBooking.noProvidersAvailable();
sampleErrorScenarios.failedBooking.providerConflict();
sampleErrorScenarios.failedBooking.invalidBookingData();

// Test payment errors
sampleErrorScenarios.failedPayment.paystackError();
sampleErrorScenarios.failedPayment.paymentTimeout();
sampleErrorScenarios.failedPayment.duplicatePayment();
sampleErrorScenarios.failedPayment.webhookFailure();

// Test dashboard errors
sampleErrorScenarios.dashboardErrors.unauthorizedAccess();
sampleErrorScenarios.dashboardErrors.databaseConnectionError();
```

## Testing

Run the test script to see the logging system in action:

```bash
node scripts/test-logging-system.js
```

## Production Considerations

### Log Rotation
- Automatic log file rotation when size limit (10MB) is reached
- Configurable number of log files to keep (default: 5)
- Oldest files are automatically deleted

### Performance
- Asynchronous log processing to avoid blocking requests
- Database writes are batched for efficiency
- Log queue prevents memory overflow

### Security
- Sensitive data is not logged (passwords, tokens)
- User-friendly error messages for clients
- Detailed error information only in server logs

### Monitoring
- Structured logs enable easy parsing and analysis
- Error codes facilitate automated monitoring
- Metadata provides context for debugging

## Integration Status

### ✅ Completed
- [x] Centralized logging utility with structured logs
- [x] Booking flow integration (creation, acceptance/rejection, status updates)
- [x] Payment flow integration (init, verify, webhook, escrow release, transfer simulation)
- [x] Provider dashboard API integration
- [x] Client dashboard API integration
- [x] Environment configuration (development vs production)
- [x] Sample error scenarios for testing
- [x] Database schema for audit logs
- [x] Log rotation and file management
- [x] Comprehensive error codes

### 🔄 Future Enhancements
- [ ] Real-time log monitoring dashboard
- [ ] Automated error alerting
- [ ] Log analytics and reporting
- [ ] Performance metrics integration
- [ ] Custom log filters and search

## Support

For questions or issues with the logging system, refer to:
- `lib/logger.ts` - Main logging utility
- `lib/logging-config.ts` - Configuration and sample scenarios
- `scripts/test-logging-system.js` - Test script
- Database schema in `prisma/schema.prisma`
