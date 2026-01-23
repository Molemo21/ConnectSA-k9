# 🔐 Paystack Live Keys Integration Guide

## Overview

This guide covers the complete process of integrating **LIVE Paystack API keys** into your production environment, following security best practices and ensuring proper configuration.

---

## 🎯 Key Principles

1. **Environment Separation**: Test keys for development, Live keys for production
2. **Security First**: Never commit live keys to git
3. **Validation**: System validates key consistency automatically
4. **Verification**: Health check endpoint to verify configuration

---

## 📋 Prerequisites

- [ ] Paystack account with live keys enabled
- [ ] Production domain configured (e.g., `app.proliinkconnect.co.za`)
- [ ] HTTPS enabled on production domain
- [ ] Access to hosting platform (Vercel) environment variables

---

## 🚀 Step-by-Step Setup

### Step 1: Get Live Keys from Paystack Dashboard

1. **Log in to Paystack**
   - Go to https://dashboard.paystack.com
   - Navigate to **Settings** → **API Keys & Webhooks**

2. **Copy Your Live Keys**
   - **Live Secret Key**: Starts with `sk_live_` (e.g., `sk_live_abc123...`)
   - **Live Public Key**: Starts with `pk_live_` (e.g., `pk_live_xyz789...`)
   - ⚠️ **Keep secret key secure** - never expose it publicly

3. **Verify Key Format**
   - Secret key: `sk_live_` + 40+ characters
   - Public key: `pk_live_` + 40+ characters
   - Both must be from the same Paystack account

### Step 2: Configure Webhook in Paystack

1. In Paystack Dashboard → **Settings** → **API Keys & Webhooks**
2. Click **"Add Webhook"** or edit existing webhook
3. Configure:
   - **Webhook URL**: `https://app.proliinkconnect.co.za/api/webhooks/paystack`
   - **Events to listen for**:
     - `charge.success` - Payment successful
     - `charge.failed` - Payment failed
     - `transfer.success` - Transfer to provider successful
     - `transfer.failed` - Transfer failed
   - **Secret**: Uses your `PAYSTACK_SECRET_KEY` (same key for API and webhooks)
4. Save webhook configuration

### Step 3: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add/Update Variables for Production**
   
   For **Production** environment, add:
   ```bash
   PAYSTACK_SECRET_KEY=sk_live_[your_actual_live_secret_key]
   PAYSTACK_PUBLIC_KEY=pk_live_[your_actual_live_public_key]
   PAYSTACK_TEST_MODE=false
   PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack
   PAYSTACK_BASE_URL=https://api.paystack.co
   ```

3. **Important Settings**
   - Select **Production** environment (not Preview/Development)
   - Ensure variables are saved
   - Redeploy application after adding variables

### Step 4: Verify Configuration

#### Option A: Health Check Endpoint

```bash
curl https://app.proliinkconnect.co.za/api/health/paystack
```

**Expected Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "Paystack configuration is valid",
  "environment": "production",
  "configuration": {
    "secretKeyType": "live",
    "publicKeyType": "live",
    "secretKeyPrefix": "sk_live_abc...",
    "publicKeyPrefix": "pk_live_xyz...",
    "testModeFlag": false,
    "webhookUrl": "https://app.proliinkconnect.co.za/api/webhooks/paystack",
    "keysConfigured": true,
    "keysMatch": true
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**If you see warnings/errors:**
- `status: "warning"` - Configuration issues detected (check recommendations)
- `status: "error"` - Critical errors (keys don't match, missing keys, etc.)

#### Option B: Application Logs

Check application startup logs for validation messages:
```
✅ PAYSTACK_SECRET_KEY: Valid
✅ PAYSTACK_PUBLIC_KEY: Valid
✅ Paystack key consistency check passed
```

### Step 5: Test with Small Transaction

**Before going fully live**, test with a small amount:

1. **Make a Test Payment**
   - Create a booking with minimum amount
   - Complete payment flow
   - Use a real card (will charge real money, but small amount)

2. **Verify Payment Processing**
   - Check Paystack dashboard for transaction
   - Verify webhook received in application logs
   - Check payment status updated in database

3. **Test Escrow Release**
   - Complete service
   - Release escrow payment
   - Verify transfer to provider's bank account

---

## 🔒 Security Best Practices

### ✅ DO:

- ✅ Store live keys **only** in hosting platform (Vercel) environment variables
- ✅ Use **different keys** for development and production
- ✅ **Rotate keys** if accidentally exposed
- ✅ **Monitor** Paystack dashboard for suspicious activity
- ✅ **Verify** key configuration before each deployment
- ✅ Use **HTTPS** for all webhook URLs
- ✅ **Validate** webhook signatures (already implemented)

### ❌ DON'T:

- ❌ **Never** commit live keys to git
- ❌ **Never** use live keys in development environment
- ❌ **Never** share keys in chat/email (use secure sharing methods)
- ❌ **Never** hardcode keys in source code
- ❌ **Never** use test keys in production
- ❌ **Never** mix test and live keys (one test, one live)

---

## 🧪 Testing Checklist

Before going fully live, verify:

- [ ] Health check endpoint shows `status: "healthy"`
- [ ] Keys are both live (not test)
- [ ] `PAYSTACK_TEST_MODE=false` in production
- [ ] Webhook URL configured in Paystack dashboard
- [ ] Small test transaction processes successfully
- [ ] Webhook events received and processed
- [ ] Payment status updates correctly
- [ ] Escrow release works
- [ ] Provider receives payment

---

## 🐛 Troubleshooting

### Issue: Health check shows "error" status

**Possible causes:**
- Keys don't match (one test, one live)
- Missing keys
- Invalid key format

**Solution:**
1. Check both keys start with correct prefix
2. Ensure both are from same environment (both live)
3. Verify keys are set in Vercel environment variables

### Issue: Health check shows "warning" status

**Possible causes:**
- Production using test keys
- Development using live keys
- Test mode flag mismatch

**Solution:**
1. For production: Use live keys and set `PAYSTACK_TEST_MODE=false`
2. For development: Use test keys and set `PAYSTACK_TEST_MODE=true`

### Issue: Webhooks not received

**Possible causes:**
- Webhook URL not configured in Paystack
- Webhook URL incorrect
- SSL certificate issues

**Solution:**
1. Verify webhook URL in Paystack dashboard
2. Check webhook URL uses HTTPS
3. Test webhook endpoint manually
4. Check application logs for webhook errors

### Issue: Payment fails

**Possible causes:**
- Invalid API keys
- Insufficient funds
- Card declined
- API rate limits

**Solution:**
1. Verify keys are correct in health check
2. Check Paystack dashboard for error details
3. Verify card/bank account details
4. Check Paystack status page for outages

---

## 📊 Monitoring

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Monitor in Paystack dashboard
   - Track failed payments

2. **Webhook Processing**
   - Check application logs
   - Monitor webhook event processing

3. **Transfer Success Rate**
   - Monitor provider payouts
   - Track failed transfers

4. **Configuration Health**
   - Regular health check endpoint calls
   - Monitor for configuration drift

---

## 🔄 Key Rotation

If you need to rotate keys:

1. **Generate New Keys** in Paystack dashboard
2. **Update Environment Variables** in Vercel
3. **Update Webhook Secret** (if changed)
4. **Redeploy Application**
5. **Verify** with health check endpoint
6. **Test** with small transaction
7. **Revoke Old Keys** in Paystack dashboard (after confirming new keys work)

---

## 📚 Additional Resources

- [Paystack API Documentation](https://paystack.com/docs/api)
- [Paystack Webhooks Guide](https://paystack.com/docs/payments/webhooks)
- [Environment Variables Best Practices](./ENV_MIGRATION_GUIDE.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_BEST_PRACTICES.md)

---

## ✅ Final Checklist

Before marking as complete:

- [ ] Live keys obtained from Paystack dashboard
- [ ] Keys configured in Vercel (Production environment)
- [ ] Webhook configured in Paystack dashboard
- [ ] Health check shows `status: "healthy"`
- [ ] Test transaction successful
- [ ] Webhook events processing correctly
- [ ] Escrow release working
- [ ] No test keys in production
- [ ] Documentation updated

---

**Last Updated**: 2025-01-20  
**Status**: ✅ Ready for Production
