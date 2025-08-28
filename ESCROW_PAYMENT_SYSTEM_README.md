# 🏦 Escrow Payment System Implementation

## Overview

This document describes the comprehensive Paystack-based escrow payment system implemented for the ConnectSA service marketplace. The system ensures secure payment processing, funds held in escrow until job completion, and automated payout to providers.

## 🏗️ Architecture

### Core Components

1. **Payment Initialization** - Client initiates payment via Paystack
2. **Escrow Holding** - Funds held securely until job completion
3. **Job Completion Proof** - Provider uploads proof of work completion
4. **Payment Release** - Client confirms completion, funds released to provider
5. **Dispute Handling** - Admin resolves disputes and manages payouts

### Database Models

```prisma
model Payment {
  id            String        @id @default(cuid())
  bookingId     String        @unique
  amount        Float         // Total amount paid
  escrowAmount  Float         // Amount held in escrow
  platformFee   Float         // Platform fee (10%)
  status        PaymentStatus // PENDING → ESCROW → RELEASED
  paystackRef   String        @unique
  // ... other fields
}

model Payout {
  id            String        @id @default(cuid())
  paymentId     String        @unique
  providerId    String
  amount        Float         // Amount to be paid to provider
  status        PayoutStatus  // PENDING → PROCESSING → COMPLETED
  // ... other fields
}

model JobProof {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  photos          String[] // Array of photo URLs
  notes           String?
  clientConfirmed Boolean  @default(false)
  autoConfirmAt   DateTime // Auto-confirm after 3 days
  // ... other fields
}
```

## 🔄 Payment Flow

### Step 1: Client Books & Pays
```
Client → POST /book-service/:id/pay
↓
Paystack Payment Initialization
↓
Payment Status: PENDING
Booking Status: PENDING_EXECUTION
```

### Step 2: Funds Held in Escrow
```
Paystack Webhook: charge.success
↓
Payment Status: ESCROW
Booking Status: PAID
↓
Funds held securely in merchant account
```

### Step 3: Job Completion Proof
```
Provider → POST /book-service/:id/complete
↓
Upload photos + notes
↓
Booking Status: AWAITING_CONFIRMATION
Auto-confirm after 3 days
```

### Step 4: Release Funds
```
Client → POST /book-service/:id/release-payment
↓
Paystack Transfer API
↓
Payment Status: RELEASED
Booking Status: COMPLETED
Provider receives payout
```

### Step 5: Dispute Handling
```
User → POST /book-service/:id/dispute
↓
Admin Review
↓
Manual Payout or Refund
```

## 🛠️ API Endpoints

### Payment Management

#### `POST /api/book-service/:id/pay`
- **Purpose**: Initialize Paystack payment
- **Auth**: Client only
- **Body**: `{ callbackUrl: string }`
- **Response**: Paystack authorization URL and access code

#### `POST /api/webhooks/paystack`
- **Purpose**: Handle Paystack webhook events
- **Auth**: Paystack signature validation
- **Events**: `charge.success`, `transfer.success`, `transfer.failed`, `refund.processed`

### Job Completion

#### `POST /api/book-service/:id/complete`
- **Purpose**: Submit job completion proof
- **Auth**: Provider only
- **Body**: `{ photos: string[], notes?: string }`
- **Features**: Auto-confirmation after 3 days

#### `POST /api/book-service/:id/release-payment`
- **Purpose**: Release escrow payment to provider
- **Auth**: Client only
- **Triggers**: Paystack transfer to provider

### Dispute Management

#### `POST /api/book-service/:id/dispute`
- **Purpose**: Create dispute for booking
- **Auth**: Client or Provider
- **Body**: `{ reason: DisputeReason, description: string, evidence?: string[] }`

## 🔐 Security Features

### Webhook Security
- **Signature Validation**: HMAC-SHA512 validation using webhook secret
- **Idempotency**: Prevents duplicate webhook processing
- **Event Verification**: Double-checks with Paystack API

### Payment Security
- **Escrow Protection**: Funds held until job completion
- **Transaction Verification**: All payments verified with Paystack
- **Status Validation**: Strict status transition enforcement

### Database Security
- **Transaction Wrappers**: All critical operations wrapped in transactions
- **Foreign Key Constraints**: Maintains referential integrity
- **Audit Trail**: Complete payment and payout history

## 💰 Financial Logic

### Platform Fee Structure
```typescript
const breakdown = {
  serviceAmount: 1000,    // Provider's rate
  platformFee: 100,       // 10% platform fee
  escrowAmount: 900,      // 90% held in escrow
  totalAmount: 1000       // Client pays total
};
```

### Escrow Calculation
- **Provider Payout**: 90% of service amount
- **Platform Fee**: 10% of service amount
- **Currency**: NGN (Nigerian Naira)
- **Auto-confirmation**: 3 days after job completion

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Payment calculations, reference generation
- **Integration Tests**: API endpoints, database operations
- **Webhook Tests**: Signature validation, event handling

### Running Tests
```bash
npm test __tests__/api/escrow-payment-system.test.ts
```

## 🚀 Deployment

### Environment Variables
```bash
# Required
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_...

# Optional
PAYSTACK_BASE_URL=https://api.paystack.co
```

### Database Migration
```bash
# Run the migration script
psql -d your_database -f scripts/migrate-escrow-payment-system.sql
```

### Webhook Configuration
1. Set webhook URL in Paystack dashboard: `https://yourdomain.com/api/webhooks/paystack`
2. Configure events: `charge.success`, `transfer.success`, `transfer.failed`, `refund.processed`
3. Set webhook secret in environment variables

## 📊 Monitoring & Logging

### Payment Tracking
- **Status Monitoring**: Track payment status transitions
- **Escrow Balance**: Monitor funds held in escrow
- **Payout Tracking**: Track provider payout status

### Error Handling
- **API Failures**: Graceful handling of Paystack API errors
- **Webhook Failures**: Retry mechanism for failed webhooks
- **Database Errors**: Transaction rollback on failures

### Audit Logs
- **Payment Events**: Complete payment lifecycle logging
- **Admin Actions**: Track dispute resolutions and manual overrides
- **System Events**: Webhook processing and API calls

## 🔧 Configuration

### Auto-Confirmation Settings
```typescript
export const PAYMENT_CONSTANTS = {
  AUTO_CONFIRMATION_DAYS: 3,        // Auto-confirm after 3 days
  PLATFORM_FEE_PERCENTAGE: 0.1,     // 10% platform fee
  CURRENCY: 'NGN',                  // Nigerian Naira
  MIN_AMOUNT: 100,                  // Minimum amount in NGN
  MAX_AMOUNT: 1000000,              // Maximum amount in NGN
};
```

### Webhook Retry Settings
- **Max Retries**: 3 attempts
- **Retry Delay**: Exponential backoff (1s, 2s, 4s)
- **Dead Letter Queue**: Failed webhooks stored for manual processing

## 🚨 Troubleshooting

### Common Issues

#### Payment Not Processing
1. Check Paystack API keys
2. Verify webhook configuration
3. Check database connection
4. Review payment status in database

#### Webhook Failures
1. Validate webhook signature
2. Check webhook secret configuration
3. Verify webhook URL accessibility
4. Review webhook event logs

#### Payout Failures
1. Verify provider recipient code
2. Check Paystack balance
3. Review transfer API responses
4. Check payout status in database

### Debug Mode
```typescript
// Enable debug logging
const DEBUG_MODE = process.env.NODE_ENV === 'development';
if (DEBUG_MODE) {
  console.log('Payment debug:', { amount, reference, status });
}
```

## 📈 Performance Optimization

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paystack_ref ON payments(paystack_ref);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_job_proofs_booking_id ON job_proofs(booking_id);
```

### Caching Strategy
- **Payment Status**: Cache payment status for 5 minutes
- **Provider Info**: Cache provider details for 1 hour
- **Service Rates**: Cache service pricing for 24 hours

### Rate Limiting
- **Payment Initiation**: 10 requests per minute per user
- **Webhook Processing**: 100 webhooks per minute
- **API Calls**: 1000 requests per hour per IP

## 🔮 Future Enhancements

### Planned Features
1. **Multi-Currency Support**: USD, EUR, GBP
2. **Advanced Dispute Resolution**: AI-powered dispute analysis
3. **Payment Plans**: Installment payments for large services
4. **Provider Payout Scheduling**: Automated weekly/monthly payouts
5. **Advanced Analytics**: Payment performance metrics

### Integration Opportunities
1. **Accounting Systems**: QuickBooks, Xero integration
2. **Tax Calculation**: Automated tax computation
3. **Fraud Detection**: Machine learning-based fraud prevention
4. **Mobile Payments**: USSD, mobile money integration

## 📚 Additional Resources

### Documentation
- [Paystack API Documentation](https://paystack.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Support
- **Technical Issues**: Check logs and error messages
- **Paystack Support**: Contact Paystack support team
- **Database Issues**: Review migration scripts and schema

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
