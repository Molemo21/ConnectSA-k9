# 🚨 Webhook Setup Guide - Fix Your Payment System

## 🎯 **Problem Summary**
Your payment system has identified these critical issues:
- ❌ **Missing Webhook Events**: No webhook processing has occurred yet
- ❌ **Null Escrow/Platform Fee Values**: Some payments have null values for critical fields  
- ❌ **Payments Stuck in PENDING**: 17 payments waiting for webhook processing

## 🔧 **Immediate Fixes**

### 1. Fix Null Values (Run First)
```bash
# This will fix the null escrow and platform fee values
node scripts/fix-payment-issues.js
```

### 2. Fix Webhook Configuration (Critical)

#### Step 2.1: Check Environment Variables
Add these to your `.env.local` file:
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_actual_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
```

#### Step 2.2: Get Your Webhook Secret
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Click **Add Webhook**
4. Set URL: `https://yourdomain.com/api/webhooks/paystack`
5. Select events: `charge.success`, `transfer.success`, `transfer.failed`
6. Copy the **Webhook Secret** (starts with `whsec_`)

#### Step 2.3: Update Your Environment
Replace `whsec_your_actual_webhook_secret` with the actual secret from Step 2.2

### 3. Test Webhook Configuration

#### Step 3.1: Local Development (ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update Paystack webhook URL to: https://abc123.ngrok.io/api/webhooks/paystack
```

#### Step 3.2: Test Webhook Delivery
1. Make a test payment
2. Check your application logs for webhook events
3. Verify webhook events are stored in the database

### 4. Monitor Webhook Events

#### Step 4.1: Check Webhook Status
```bash
# Check if webhooks are being received
node scripts/check-current-payments.js
```

#### Step 4.2: View Webhook Events in Database
```sql
-- Check webhook events
SELECT * FROM webhook_events ORDER BY created_at DESC;

-- Check payment statuses
SELECT status, COUNT(*) FROM payments GROUP BY status;
```

## 🚨 **Why Webhooks Are Critical**

### Payment Flow Without Webhooks
```
Client Payment → Paystack Success → ❌ NO WEBHOOK → Payment Stuck in PENDING
```

### Payment Flow With Webhooks
```
Client Payment → Paystack Success → ✅ WEBHOOK RECEIVED → Payment → HELD_IN_ESCROW
```

## 🔍 **Troubleshooting**

### Issue: Webhook Not Received
**Possible Causes:**
1. ❌ Wrong webhook URL in Paystack dashboard
2. ❌ Incorrect webhook secret in environment
3. ❌ Webhook endpoint not publicly accessible
4. ❌ Firewall blocking webhook requests

**Solutions:**
1. ✅ Verify webhook URL in Paystack dashboard
2. ✅ Check PAYSTACK_WEBHOOK_SECRET in .env.local
3. ✅ Use ngrok for local development
4. ✅ Check server logs for webhook attempts

### Issue: Invalid Signature Error
**Cause:** Webhook secret mismatch
**Solution:** Ensure PAYSTACK_WEBHOOK_SECRET matches exactly

### Issue: Webhook Processed But Payment Not Updated
**Cause:** Database transaction failure
**Solution:** Check application logs for database errors

## 📊 **Expected Results After Fix**

### Before Fix
```
Payments: 17 PENDING, 0 HELD_IN_ESCROW
Webhook Events: 0
Status: ❌ BROKEN
```

### After Fix
```
Payments: 0 PENDING, 17 HELD_IN_ESCROW  
Webhook Events: 17+ (charge.success events)
Status: ✅ WORKING
```

## 🧪 **Testing Your Fix**

### 1. Run the Fix Script
```bash
node scripts/fix-payment-issues.js
```

### 2. Make a Test Payment
1. Create a test booking
2. Initialize payment
3. Complete payment with test card
4. Check webhook processing

### 3. Verify Results
```bash
# Check payment statuses
node scripts/check-current-payments.js

# Check webhook events
SELECT COUNT(*) FROM webhook_events;
```

## 🚀 **Production Deployment**

### 1. Update Environment Variables
```bash
# Production .env
PAYSTACK_SECRET_KEY=sk_live_your_live_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_key  
PAYSTACK_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 2. Update Webhook URL
Change Paystack webhook URL to your production domain:
```
https://yourdomain.com/api/webhooks/paystack
```

### 3. Test Live Webhooks
1. Make a small live payment
2. Verify webhook processing
3. Check payment status updates

## 📞 **Support**

If you continue to have issues:
1. Check Paystack webhook logs in dashboard
2. Review application logs for errors
3. Verify database connectivity
4. Test webhook endpoint manually

## 🎉 **Success Indicators**

Your payment system is working when:
- ✅ Webhook events are being received and stored
- ✅ Payments move from PENDING to HELD_IN_ESCROW
- ✅ No null values in escrow_amount or platform_fee
- ✅ Booking statuses progress correctly
- ✅ Webhook processing logs show success

---

**Remember:** Webhooks are the backbone of your payment system. Without them, payments will remain stuck in PENDING status indefinitely.
