# 🧪 Testing Escrow Payment System - Step by Step Guide

## 🎯 **Testing Objectives**
- Verify Paystack integration works correctly
- Test complete payment flow from booking to payout
- Validate webhook handling and database updates
- Ensure security features are working
- Test error handling and edge cases

## 🚀 **Phase 1: Environment Setup**

### 1.1 Environment Variables
```bash
# Add to your .env.local file
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

### 1.2 Database Migration
```bash
# Run the migration script
psql -d your_database -f scripts/migrate-escrow-payment-system.sql
```

### 1.3 Paystack Test Account Setup
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Switch to **Test Mode**
3. Get your test API keys
4. Set up webhook URL: `https://yourdomain.com/api/webhooks/paystack`

## 🔍 **Phase 2: Component Testing**

### 2.1 Test Paystack Utility Functions
```bash
# Run the unit tests
npm test __tests__/api/escrow-payment-system.test.ts
```

### 2.2 Test Database Schema
```bash
# Verify Prisma schema is valid
npx prisma validate
npx prisma generate
```

### 2.3 Test API Endpoints (Manual Testing)
Use Postman or similar tool to test each endpoint:

#### Test Payment Initialization
```http
POST /api/book-service/{booking_id}/pay
Content-Type: application/json
Authorization: Bearer {client_jwt_token}

{
  "callbackUrl": "https://yourdomain.com/payment/callback"
}
```

#### Test Job Completion
```http
POST /api/book-service/{booking_id}/complete
Content-Type: application/json
Authorization: Bearer {provider_jwt_token}

{
  "photos": ["https://example.com/photo1.jpg"],
  "notes": "Job completed successfully"
}
```

#### Test Payment Release
```http
POST /api/book-service/{booking_id}/release-payment
Content-Type: application/json
Authorization: Bearer {client_jwt_token}
```

#### Test Dispute Creation
```http
POST /api/book-service/{booking_id}/dispute
Content-Type: application/json
Authorization: Bearer {user_jwt_token}

{
  "reason": "service_not_provided",
  "description": "Provider did not show up for the scheduled service"
}
```

## 🧪 **Phase 3: Integration Testing**

### 3.1 Complete Payment Flow Test
1. **Create a test booking** (status: CONFIRMED)
2. **Initialize payment** → Should return Paystack authorization URL
3. **Simulate Paystack webhook** → Should update payment to ESCROW
4. **Submit job completion** → Should update booking to AWAITING_CONFIRMATION
5. **Release payment** → Should create payout and update statuses

### 3.2 Webhook Testing
```bash
# Test webhook signature validation
curl -X POST https://yourdomain.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: {valid_signature}" \
  -d '{"event":"charge.success","data":{"reference":"test_ref"}}'
```

### 3.3 Database State Verification
After each test, verify database state:
```sql
-- Check payment status
SELECT id, status, escrow_amount, platform_fee FROM payments WHERE booking_id = 'test_booking_id';

-- Check booking status
SELECT id, status FROM bookings WHERE id = 'test_booking_id';

-- Check job proof
SELECT * FROM job_proofs WHERE booking_id = 'test_booking_id';

-- Check payout
SELECT * FROM payouts WHERE payment_id = 'test_payment_id';
```

## 🚨 **Phase 4: Error Handling Testing**

### 4.1 Test Invalid Scenarios
- **Unauthorized access** (wrong user role)
- **Invalid booking ID**
- **Missing required fields**
- **Invalid webhook signature**
- **Paystack API failures**

### 4.2 Test Edge Cases
- **Duplicate payment attempts**
- **Race conditions** (multiple requests)
- **Invalid payment amounts**
- **Missing provider information**

## 📊 **Phase 5: Performance & Security Testing**

### 5.1 Load Testing
```bash
# Test webhook processing under load
for i in {1..10}; do
  curl -X POST https://yourdomain.com/api/webhooks/paystack \
    -H "Content-Type: application/json" \
    -H "x-paystack-signature: {valid_signature}" \
    -d '{"event":"charge.success","data":{"reference":"test_ref_$i"}}' &
done
wait
```

### 5.2 Security Testing
- **Webhook signature validation**
- **JWT token validation**
- **SQL injection prevention**
- **Rate limiting**

## 🔧 **Phase 6: Debugging & Fixes**

### 6.1 Common Issues & Solutions

#### Issue: Payment not initializing
**Check:**
- Paystack API keys are correct
- Database connection is working
- Booking exists and is in CONFIRMED status

#### Issue: Webhook not processing
**Check:**
- Webhook URL is accessible
- Webhook secret is correct
- Paystack dashboard webhook configuration

#### Issue: Database errors
**Check:**
- Prisma schema is up to date
- Database migrations have been run
- Foreign key constraints are valid

### 6.2 Debug Mode
```typescript
// Enable detailed logging
const DEBUG_MODE = true;
if (DEBUG_MODE) {
  console.log('Payment flow debug:', {
    step: 'payment_initialization',
    bookingId,
    amount,
    reference
  });
}
```

## 📋 **Testing Checklist**

### ✅ **Setup Complete**
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Paystack test account ready
- [ ] Webhook URL configured

### ✅ **Component Tests Pass**
- [ ] Paystack utility functions
- [ ] Database schema validation
- [ ] API endpoint accessibility
- [ ] Authentication working

### ✅ **Integration Tests Pass**
- [ ] Complete payment flow
- [ ] Webhook processing
- [ ] Database state updates
- [ ] Status transitions

### ✅ **Error Handling Working**
- [ ] Invalid requests rejected
- [ ] Proper error messages
- [ ] Database rollback on failures
- [ ] Security validations

### ✅ **Performance Acceptable**
- [ ] Response times < 2 seconds
- [ ] Webhook processing < 5 seconds
- [ ] Database operations < 1 second
- [ ] No memory leaks

## 🎯 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Update documentation** with lessons learned
3. **Prepare production environment**
4. **Set up monitoring and alerting**
5. **Plan gradual rollout strategy**

## 🆘 **Getting Help**

### **Technical Issues**
- Check application logs
- Verify database state
- Test individual components
- Review error messages

### **Paystack Issues**
- Check Paystack dashboard
- Verify API keys and webhooks
- Review Paystack documentation
- Contact Paystack support

### **Database Issues**
- Run schema validation
- Check migration status
- Verify foreign key constraints
- Review transaction logs

---

**Remember:** Test thoroughly in development before deploying to production. The escrow payment system handles real money, so accuracy and security are critical!
