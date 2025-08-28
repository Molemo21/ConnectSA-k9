# Complete Paystack Payment Lifecycle Implementation

## Overview

This document describes the complete implementation of the Paystack-based escrow payment system for ConnectSA. The system handles the entire payment lifecycle from initialization to escrow release, with comprehensive webhook processing and security measures.

## Architecture

```
Client → Payment Initiation → Paystack Gateway → Webhook Processing → Escrow → Job Completion → Escrow Release → Provider Payout
```

## Database Schema Updates

### New Models

#### WebhookEvent
- **Purpose**: Audit trail and idempotency for webhook processing
- **Fields**:
  - `id`: Unique identifier
  - `eventType`: Type of webhook event (charge.success, transfer.success, etc.)
  - `paystackRef`: Paystack reference for tracking
  - `payload`: Full webhook payload (JSON)
  - `processed`: Whether the webhook was processed successfully
  - `error`: Error message if processing failed
  - `retryCount`: Number of retry attempts
  - `createdAt`: When the webhook was received
  - `processedAt`: When the webhook was processed

### Updated Enums

#### PaymentStatus
- `PENDING`: Payment initialized, waiting for completion
- `HELD_IN_ESCROW`: Payment successful, held in escrow
- `PROCESSING_RELEASE`: Escrow release in progress
- `RELEASED`: Payment released to provider
- `REFUNDED`: Payment refunded to client
- `FAILED`: Payment failed

## API Endpoints

### 1. Payment Initialization
**Endpoint**: `POST /api/book-service/[id]/pay`

**Purpose**: Initialize payment with Paystack and create payment record

**Flow**:
1. Validate user permissions and booking status
2. Calculate payment breakdown (service amount, platform fee, escrow amount)
3. Generate unique Paystack reference
4. Call Paystack API to initialize payment
5. Create payment record with `PENDING` status
6. Update booking status to `PENDING_EXECUTION`
7. Return authorization URL for frontend redirect

**Response**:
```json
{
  "success": true,
  "payment": { /* payment details */ },
  "authorizationUrl": "https://checkout.paystack.com/...",
  "message": "Payment initialized successfully. Redirecting to payment gateway..."
}
```

### 2. Paystack Webhook
**Endpoint**: `POST /api/webhooks/paystack`

**Purpose**: Process Paystack webhook events securely

**Security Features**:
- **Signature Verification**: Validates `x-paystack-signature` header
- **Idempotency**: Prevents duplicate processing of the same webhook
- **Audit Logging**: Stores all webhook events for debugging
- **Error Handling**: Graceful handling of processing failures

**Supported Events**:
- `charge.success`: Payment successful → Move to escrow
- `charge.failed`: Payment failed → Mark as failed
- `transfer.success`: Payout successful → Mark as released
- `transfer.failed`: Payout failed → Mark as failed
- `refund.processed`: Refund processed → Mark as refunded

**Webhook Processing Flow**:
1. **Signature Validation**: Verify webhook authenticity
2. **Event Storage**: Store webhook event for audit
3. **Duplicate Check**: Ensure webhook hasn't been processed
4. **Event Processing**: Handle specific event type
5. **Status Update**: Mark webhook as processed
6. **Error Logging**: Log any processing errors

### 3. Escrow Release
**Endpoint**: `POST /api/book-service/[id]/release-escrow`

**Purpose**: Release escrow payment to provider after job completion

**Access Control**:
- **Admins**: Can release escrow for any booking
- **Clients**: Can only release escrow for their own bookings

**Prerequisites**:
- Payment must be in `HELD_IN_ESCROW` status
- Booking must be `COMPLETED` or `AWAITING_CONFIRMATION`
- Job completion proof must exist (for client requests)

**Flow**:
1. Validate user permissions and booking status
2. Update payment status to `PROCESSING_RELEASE`
3. Create payout record
4. Initiate Paystack transfer to provider
5. Update payment status to `RELEASED`
6. Update booking status to `COMPLETED`

**Response**:
```json
{
  "success": true,
  "payout": { /* payout details */ },
  "payment": { /* updated payment details */ },
  "booking": { /* updated booking details */ },
  "message": "Escrow released successfully to provider"
}
```

### 4. Payment Verification
**Endpoint**: `POST /api/payment/verify`

**Purpose**: Manually verify payment status with Paystack

**Features**:
- **Real-time Verification**: Calls Paystack API for current status
- **Status Synchronization**: Updates local database if status mismatch
- **Permission Control**: Users can only verify their own payments

**Use Cases**:
- Debugging payment issues
- Manual status updates
- Client/provider payment confirmation

**Response**:
```json
{
  "success": true,
  "payment": { /* payment details */ },
  "paystackVerification": { /* Paystack response */ },
  "statusUpdate": { /* status change details */ },
  "message": "Payment verification completed successfully"
}
```

### 5. Webhook Event Management (Admin)
**Endpoint**: `GET /api/admin/webhook-events`

**Purpose**: Admin interface for monitoring webhook processing

**Features**:
- **Pagination**: Large result sets with page-based navigation
- **Filtering**: By event type, status, reference, date range
- **Statistics**: Summary of webhook processing status
- **Retry Management**: Reset failed webhooks for retry

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)
- `eventType`: Filter by specific event type
- `processed`: Filter by processing status
- `reference`: Search by Paystack reference
- `startDate`/`endDate`: Date range filtering

## Payment Flow States

### 1. Payment Initialization
```
Client clicks "Pay" → Payment API → Paystack Gateway → Client redirected
```

**Database State**:
- Payment: `PENDING`
- Booking: `PENDING_EXECUTION`

### 2. Payment Success (Webhook)
```
Paystack webhook → charge.success → Payment moved to escrow
```

**Database State**:
- Payment: `HELD_IN_ESCROW`
- Booking: `PENDING_EXECUTION`

### 3. Job Completion
```
Provider submits completion proof → Job proof created → Booking: AWAITING_CONFIRMATION
```

**Database State**:
- Payment: `HELD_IN_ESCROW`
- Booking: `AWAITING_CONFIRMATION`
- JobProof: Created with auto-confirmation date

### 4. Escrow Release
```
Client/Admin releases escrow → Transfer initiated → Payment released to provider
```

**Database State**:
- Payment: `RELEASED`
- Booking: `COMPLETED`
- Payout: `PROCESSING` → `COMPLETED`

## Security Features

### 1. Webhook Security
- **Signature Verification**: HMAC-SHA512 validation using webhook secret
- **Payload Validation**: Zod schema validation for all webhook data
- **Rate Limiting**: Built-in protection against webhook spam

### 2. Access Control
- **Role-based Permissions**: Different access levels for clients, providers, admins
- **Resource Ownership**: Users can only access their own resources
- **Admin Override**: Admins have access to all resources for support

### 3. Data Integrity
- **Database Transactions**: Atomic updates for critical operations
- **Status Guards**: Prevents invalid state transitions
- **Audit Logging**: Complete trail of all payment operations

## Error Handling

### 1. Webhook Failures
- **Automatic Retry**: Failed webhooks are marked for retry
- **Error Logging**: Detailed error messages stored in database
- **Graceful Degradation**: System continues operating even with webhook failures

### 2. Payment Failures
- **Status Tracking**: Failed payments marked with failure reason
- **Client Notification**: Users informed of payment failures
- **Manual Recovery**: Support for manual payment verification

### 3. Transfer Failures
- **Automatic Rollback**: Failed transfers revert payment status
- **Provider Notification**: Providers informed of transfer issues
- **Manual Intervention**: Support for manual transfer retry

## Monitoring and Debugging

### 1. Webhook Events Dashboard
- **Real-time Status**: View all webhook processing status
- **Error Analysis**: Identify and resolve processing issues
- **Performance Metrics**: Track processing times and success rates

### 2. Payment Status Tracking
- **Status History**: Complete audit trail of payment changes
- **Paystack Sync**: Real-time verification with Paystack
- **Manual Override**: Support for manual status corrections

### 3. Logging and Analytics
- **Structured Logging**: Consistent log format for all operations
- **Performance Tracking**: Response times and throughput metrics
- **Error Aggregation**: Group and analyze common failure patterns

## Production Considerations

### 1. Environment Variables
```bash
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...
```

### 2. Webhook Configuration
- **URL**: `https://yourdomain.com/api/webhooks/paystack`
- **Events**: charge.success, charge.failed, transfer.success, transfer.failed, refund.processed
- **Retry Policy**: Configured in Paystack dashboard

### 3. Database Migrations
```bash
# Run Prisma migrations to add WebhookEvent table
npx prisma migrate dev --name add_webhook_events

# Deploy to production
npx prisma migrate deploy
```

### 4. Monitoring Setup
- **Health Checks**: Monitor webhook endpoint availability
- **Error Alerts**: Set up alerts for webhook processing failures
- **Performance Monitoring**: Track response times and throughput

## Testing

### 1. Local Testing
```bash
# Test webhook locally using ngrok
ngrok http 3000

# Update Paystack webhook URL to ngrok URL
# Test with Paystack test cards
```

### 2. Test Scenarios
- **Payment Success**: Complete payment flow to escrow
- **Payment Failure**: Test failed payment handling
- **Webhook Retry**: Test duplicate webhook handling
- **Escrow Release**: Test complete escrow flow
- **Error Conditions**: Test various failure scenarios

### 3. Load Testing
- **Concurrent Payments**: Test multiple simultaneous payments
- **Webhook Volume**: Test high webhook processing rates
- **Database Performance**: Monitor transaction performance

## Troubleshooting

### Common Issues

#### 1. Webhook Not Received
- Check Paystack webhook configuration
- Verify webhook URL accessibility
- Check server logs for connection errors

#### 2. Payment Status Mismatch
- Use payment verification endpoint
- Check webhook processing logs
- Verify Paystack transaction status

#### 3. Escrow Release Failure
- Check provider bank account details
- Verify Paystack transfer configuration
- Review transfer error logs

### Debug Commands
```bash
# Check webhook events
curl -X GET "http://localhost:3000/api/admin/webhook-events?limit=10"

# Verify specific payment
curl -X POST "http://localhost:3000/api/payment/verify" \
  -H "Content-Type: application/json" \
  -d '{"reference":"CS_1234567890_ABC123"}'

# Retry failed webhook
curl -X POST "http://localhost:3000/api/admin/webhook-events" \
  -H "Content-Type: application/json" \
  -d '{"action":"retry","webhookEventId":"webhook_id"}'
```

## Future Enhancements

### 1. Advanced Escrow Features
- **Partial Releases**: Support for milestone-based payments
- **Dispute Resolution**: Built-in dispute handling system
- **Auto-release**: Automatic escrow release after time period

### 2. Payment Analytics
- **Revenue Tracking**: Detailed payment analytics and reporting
- **Provider Payouts**: Comprehensive payout management
- **Tax Reporting**: Automated tax calculation and reporting

### 3. Integration Features
- **Multi-currency**: Support for multiple currencies
- **Payment Methods**: Additional payment gateway options
- **Subscription Support**: Recurring payment handling

## Conclusion

This implementation provides a robust, secure, and scalable payment system that handles the complete Paystack payment lifecycle. The system includes comprehensive error handling, audit logging, and admin tools for monitoring and debugging.

Key benefits:
- **Security**: Webhook signature verification and comprehensive access control
- **Reliability**: Idempotent webhook processing and automatic retry mechanisms
- **Transparency**: Complete audit trail and real-time status tracking
- **Scalability**: Efficient database operations and optimized API responses
- **Maintainability**: Clear separation of concerns and comprehensive documentation

The system is production-ready and includes all necessary monitoring, debugging, and recovery mechanisms for a reliable payment service.
