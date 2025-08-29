# 🔧 Webhook Environment Setup Guide

## 🎯 **Overview**

This guide explains how to configure environment variables for Paystack webhooks. **Paystack uses the same `PAYSTACK_SECRET_KEY` for both API calls and webhook signature verification** - they do not provide separate webhook secrets like Stripe.

## 🔐 **Environment Variables**

### **Required Variables (Always)**

```bash
# Paystack API Keys (Required for both test and live)
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
```

### **Important Note: No Separate Webhook Secrets**

**Paystack does NOT provide separate webhook secrets.** The same `PAYSTACK_SECRET_KEY` is used for:
- ✅ API calls to Paystack
- ✅ Webhook signature verification
- ✅ Both test and live environments

## 🌐 **Webhook URL Configuration**

### **Local Development (ngrok)**
```bash
# Your current ngrok URL
PAYSTACK_WEBHOOK_URL=https://b5424031aff4.ngrok-free.app/api/webhooks/paystack
```

### **Production**
```bash
PAYSTACK_WEBHOOK_URL=https://yourdomain.com/api/webhooks/paystack
```

## 🔍 **How Webhook Verification Works**

The webhook handler uses Paystack's official method:

```typescript
// 1. Extract raw request body
const body = await request.text();

// 2. Get signature from x-paystack-signature header
const signature = request.headers.get('x-paystack-signature');

// 3. Generate HMAC SHA-512 hash using PAYSTACK_SECRET_KEY
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(body)
  .digest('hex');

// 4. Compare hash with received signature (timing-safe)
const isValid = crypto.timingSafeEqual(
  Buffer.from(hash, 'hex'),
  Buffer.from(signature, 'hex')
);
```

## 📋 **Step-by-Step Setup**

### **Step 1: Configure Paystack Dashboard**

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Click **"Add Webhook"**
4. Set **Webhook URL**: `https://b5424031aff4.ngrok-free.app/api/webhooks/paystack`
5. Select **Events**:
   - ✅ `charge.success` (when payment is successful)
   - ✅ `charge.failed` (when payment fails)
   - ✅ `transfer.success` (when payout is successful)
   - ✅ `transfer.failed` (when payout fails)
6. **No webhook secret needed** - Paystack will use your API secret key

### **Step 2: Verify Environment Variables**

Ensure your `.env` file has:
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key

# No PAYSTACK_WEBHOOK_SECRET needed!
```

### **Step 3: Restart Your Application**

```bash
# Stop your development server
# Then restart it to load environment variables
npm run dev
```

### **Step 4: Test Webhook Endpoint**

Visit: `https://b5424031aff4.ngrok-free.app/api/webhooks/paystack`

You should see:
- ✅ Environment variables status
- ✅ Database table status
- ✅ Payment status distribution
- ✅ Setup instructions

## 🧪 **Testing Your Configuration**

### **1. Check Webhook Endpoint Status**

Visit the GET endpoint to verify everything is working.

### **2. Make a Test Payment**

1. Use Paystack test cards
2. Check application logs for webhook events
3. Verify payment moves from PENDING → ESCROW automatically

### **3. Monitor Webhook Processing**

Look for these log patterns:
- `📨 Paystack webhook received`
- `🔐 Environment detected: TEST mode`
- `🔐 Validated using PAYSTACK_SECRET_KEY (TEST mode)`
- `✅ Webhook signature validation successful`
- `✅ Webhook processed successfully`

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid signature" error**

**Symptoms**: Webhook received but signature validation fails

**Solutions**:
1. **Check PAYSTACK_SECRET_KEY**: Ensure it matches your Paystack dashboard
2. **Verify webhook URL**: Must match exactly in Paystack dashboard
3. **Check environment**: Ensure you're using correct test/live keys
4. **Restart application**: Environment variables need restart to load

### **Issue: Webhook not received**

**Symptoms**: No webhook events in logs

**Solutions**:
1. **Check ngrok URL**: Ensure it's accessible
2. **Verify Paystack webhook URL**: Must match exactly
3. **Check ngrok status**: Ensure tunnel is active
4. **Test webhook endpoint**: Visit the GET endpoint manually

### **Issue: Payment stuck in PENDING**

**Symptoms**: Payment created but status doesn't update

**Solutions**:
1. **Check webhook processing logs**: Look for errors
2. **Verify database connection**: Ensure Prisma can connect
3. **Check webhook events table**: Look for failed events
4. **Use auto-recovery**: Admin dashboard has recovery tools

## 🔧 **Environment Variable Reference**

### **Complete .env Example (TEST Mode)**
```bash
# Database
DATABASE_URL=your_database_url

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email Service
RESEND_API_KEY=your_resend_api_key

# Paystack Configuration (NO separate webhook secret needed)
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### **Complete .env.production Example (LIVE Mode)**
```bash
# Database
DATABASE_URL=your_production_database_url

# JWT Configuration
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=7d

# Email Service
RESEND_API_KEY=your_production_resend_api_key

# Paystack Configuration (NO separate webhook secret needed)
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key

# App Configuration
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com
```

## 📊 **Expected Results After Setup**

### **Before Setup (Broken)**
```
Payments: Stuck in PENDING status
Webhook Events: 0 or signature validation fails
Status: ❌ COMPLETELY BROKEN
```

### **After Setup (Working)**
```
Payments: Automatically move PENDING → ESCROW
Webhook Events: Successfully processed and stored
Status: ✅ FULLY WORKING
```

## 🔄 **Migration from Test to Live**

### **Step 1: Update Environment Variables**
```bash
# Change from test to live keys
PAYSTACK_SECRET_KEY=sk_live_...  # Was sk_test_...
PAYSTACK_PUBLIC_KEY=pk_live_...  # Was pk_test_...
# No webhook secret changes needed!
```

### **Step 2: Update Paystack Dashboard**
- Change webhook URL to production domain
- Update environment variables
- **No webhook secret to copy** - Paystack handles this automatically

### **Step 3: Test Live Mode**
- Make test payment with live keys
- Verify webhook processing
- Check payment status updates

## 🎯 **Success Indicators**

Your webhook configuration is working when:
- ✅ Webhook endpoint returns status information
- ✅ Environment variables are properly detected
- ✅ Signature validation passes using PAYSTACK_SECRET_KEY
- ✅ Payments move from PENDING to ESCROW automatically
- ✅ Webhook events are stored in database
- ✅ No manual recovery needed

## 📞 **Support & Troubleshooting**

### **Immediate Help**
1. **Check webhook endpoint**: Visit GET endpoint for status
2. **Verify environment variables**: Use admin dashboard
3. **Check application logs**: Look for webhook processing
4. **Test webhook manually**: Use Paystack test tools

### **Debugging Steps**
1. **Environment check**: Verify PAYSTACK_SECRET_KEY is set
2. **Webhook test**: Check endpoint accessibility
3. **Payment test**: Make test payment and monitor logs
4. **Recovery test**: Use auto-recovery if needed

## ⚠️ **Security Notes**

- **Never commit environment files** to version control
- **Use different keys** for test and live environments
- **Monitor webhook events** for suspicious activity
- **Validate all webhook signatures** before processing
- **Use timing-safe comparison** to prevent timing attacks

## 🔗 **Paystack Official Documentation**

- [Webhook Setup](https://paystack.com/docs/webhooks)
- [Webhook Verification](https://paystack.com/docs/webhooks#verifying-webhooks)
- [API Keys](https://paystack.com/docs/api-keys)

---

## 🔗 **Quick Action Items**

1. **IMMEDIATE**: Verify PAYSTACK_SECRET_KEY is set in your `.env` file
2. **NEXT**: Configure webhook URL in Paystack dashboard
3. **THEN**: Restart your development server
4. **FINALLY**: Test webhook endpoint

**Time to setup: ~5 minutes**
**Impact: Complete webhook functionality restoration**
**Result: Automatic payment processing, no more manual recovery**

**Note**: No separate webhook secret needed - Paystack uses your existing API secret key!
