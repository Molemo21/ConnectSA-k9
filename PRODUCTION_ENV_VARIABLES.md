# Production Environment Variables

## Production URL Configuration

Based on your domain setup, here are the production environment variable values:

### Development (Local)
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Production
```bash
NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za
NEXTAUTH_URL=https://app.proliinkconnect.co.za
```

## Complete Production Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

```bash
# Application URL (Public - accessible in browser)
NEXT_PUBLIC_APP_URL=https://app.proliinkconnect.co.za

# Authentication URL
NEXTAUTH_URL=https://app.proliinkconnect.co.za
NEXTAUTH_SECRET=your-nextauth-secret-here

# Database
DATABASE_URL=your-production-database-url
DIRECT_URL=your-production-direct-url
PRISMA_DISABLE_PREPARED_STATEMENTS=true

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=re_ZTeSkpCV_8haEEpLg4Z1vGtT3jSj74HoUn
FROM_EMAIL=no-reply@app.proliinkconnect.co.za

# ============================================================================
# Payment Service (Paystack) - PRODUCTION LIVE KEYS
# ============================================================================
# CRITICAL: Use LIVE keys (sk_live_..., pk_live_...) for production
# NEVER use test keys in production - real money will be processed!
#
# How to get your live keys:
# 1. Log in to Paystack Dashboard: https://dashboard.paystack.com
# 2. Go to Settings → API Keys & Webhooks
# 3. Copy your LIVE Secret Key (starts with sk_live_)
# 4. Copy your LIVE Public Key (starts with pk_live_)
# 5. Set up webhook URL in Paystack dashboard
#
# Security:
# - Secret and public keys MUST both be live (not mixed with test keys)
# - Never commit live keys to git
# - Store only in hosting platform environment variables
# ============================================================================
PAYSTACK_SECRET_KEY=sk_live_your-production-secret-key
PAYSTACK_PUBLIC_KEY=pk_live_your-production-public-key
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack
PAYSTACK_BASE_URL=https://api.paystack.co

# App Configuration
NODE_ENV=production
COOKIE_DOMAIN=app.proliinkconnect.co.za
LOG_LEVEL=info
```

## Important Notes

### NEXT_PUBLIC_APP_URL vs NEXTAUTH_URL

- **`NEXT_PUBLIC_APP_URL`**: 
  - Used for client-side code (accessible in browser)
  - Must start with `https://` in production
  - Used for API calls, redirects, and frontend URL references

- **`NEXTAUTH_URL`**: 
  - Used by NextAuth.js for callbacks and OAuth redirects
  - Must match your actual domain
  - Should match `NEXT_PUBLIC_APP_URL` in most cases

### Security

⚠️ **Important**: Never commit production environment variables to git. Set them in:
- Vercel Dashboard (for Vercel deployments)
- Your hosting platform's environment variable settings
- CI/CD pipeline secrets

## Paystack Live Keys Setup Guide

### Step 1: Get Your Live Keys from Paystack

1. **Log in to Paystack Dashboard**
   - Go to https://dashboard.paystack.com
   - Navigate to **Settings** → **API Keys & Webhooks**

2. **Copy Your Live Keys**
   - **Secret Key**: Starts with `sk_live_` (keep this secret!)
   - **Public Key**: Starts with `pk_live_` (safe to expose in frontend if needed)

3. **Set Up Webhook**
   - Click **"Add Webhook"** or edit existing webhook
   - Set URL: `https://app.proliinkconnect.co.za/api/webhooks/paystack`
   - Select events: `charge.success`, `transfer.success`, `transfer.failed`
   - Save webhook configuration

### Step 2: Configure Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add/Update these variables for **Production** environment:
   ```
   PAYSTACK_SECRET_KEY=sk_live_[your_actual_live_secret_key]
   PAYSTACK_PUBLIC_KEY=pk_live_[your_actual_live_public_key]
   PAYSTACK_TEST_MODE=false
   PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack
   ```

### Step 3: Verify Configuration

After setting up, verify your configuration:

```bash
# Check Paystack configuration health
curl https://app.proliinkconnect.co.za/api/health/paystack
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Paystack configuration is valid",
  "environment": "production",
  "configuration": {
    "secretKeyType": "live",
    "publicKeyType": "live",
    "testModeFlag": false,
    "keysMatch": true
  }
}
```

### Step 4: Test with Small Transaction

Before going fully live:
1. Make a small test transaction (minimum amount)
2. Verify webhook is received
3. Check payment appears in Paystack dashboard
4. Verify escrow release works

## Verification Checklist

Before deploying to production:

### Application URLs
- [ ] `NEXT_PUBLIC_APP_URL` is set to `https://app.proliinkconnect.co.za`
- [ ] `NEXTAUTH_URL` is set to `https://app.proliinkconnect.co.za`
- [ ] All URLs use `https://` (not `http://`)
- [ ] `COOKIE_DOMAIN` is set to `app.proliinkconnect.co.za`

### Email Configuration
- [ ] `FROM_EMAIL` uses the verified domain: `no-reply@app.proliinkconnect.co.za`
- [ ] `RESEND_API_KEY` is set and valid

### Paystack Configuration (CRITICAL)
- [ ] `PAYSTACK_SECRET_KEY` starts with `sk_live_` (NOT `sk_test_`)
- [ ] `PAYSTACK_PUBLIC_KEY` starts with `pk_live_` (NOT `pk_test_`)
- [ ] `PAYSTACK_TEST_MODE=false` (NOT `true`)
- [ ] `PAYSTACK_WEBHOOK_URL` points to production domain
- [ ] Webhook is configured in Paystack dashboard
- [ ] Secret and public keys match (both live, not mixed)
- [ ] Verified configuration via `/api/health/paystack` endpoint

### Security
- [ ] No live keys committed to git
- [ ] All secrets stored in Vercel environment variables
- [ ] Database URLs point to production database
- [ ] All JWT secrets are production-grade (32+ characters)

---

**Domain**: `app.proliinkconnect.co.za`  
**Production URL**: `https://app.proliinkconnect.co.za`

