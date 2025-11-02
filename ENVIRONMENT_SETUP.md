# 🔧 Environment Configuration and Local Development

## 📋 **Environment Variables Setup**

### **Required Variables**

```bash
# Database
DATABASE_URL=your_database_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=re_ZTeSkpCV_8haEEpLg4Z1vGtT3jSj74HoUn
FROM_EMAIL=noreply@v0-south-africa-marketplace-platfo.vercel.app

# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🧑‍💻 Local Development Best Practices

### Package Manager
- Use pnpm via Corepack:
```
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

### Local Database (recommended)
Run a local Postgres to avoid remote DB latency during development:
```
docker compose -f docker-compose.dev.yml up -d
```
Configure `.env.local`:
```
DATABASE_URL=postgresql://connectsa:connectsa@127.0.0.1:5432/connectsa
DIRECT_URL=postgresql://connectsa:connectsa@127.0.0.1:5432/connectsa
```

Generate Prisma client (skip running migrations if not needed):
```
pnpm exec prisma generate
```

### Email Provider
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=no-reply@app.proliinkconnect.co.za
```

### Start Dev Server
```
pnpm dev
# or
node server.js
```

### Test Email Endpoint
```
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"you@example.com","subject":"E2E Notification Test","message":"This is a test."}'
```

### **Paystack Webhook Secret (Conditional)**

```bash
# For TEST mode: NOT REQUIRED (uses PAYSTACK_SECRET_KEY)
# For LIVE mode: REQUIRED
PAYSTACK_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🔐 **Test Mode Configuration**

### **Environment Variables**
```bash
# Test Mode (.env)
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key
# PAYSTACK_WEBHOOK_SECRET is NOT needed in test mode
```

### **How It Works**
- **Test Mode**: The webhook handler automatically uses `PAYSTACK_SECRET_KEY` for signature verification
- **No Additional Setup**: Paystack test mode doesn't provide separate webhook secrets
- **Automatic Detection**: The handler detects test mode by checking if the secret key starts with `sk_test_`

### **Test Mode Benefits**
- ✅ **Simpler Setup**: No need to configure webhook secrets
- ✅ **Automatic Detection**: Handler automatically uses the correct verification method
- ✅ **Immediate Testing**: Works out of the box with test keys

## 🚀 **Live Mode Configuration**

### **Environment Variables**
```bash
# Live Mode (.env.production)
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### **How It Works**
- **Live Mode**: The webhook handler uses `PAYSTACK_WEBHOOK_SECRET` for signature verification
- **Security**: Separate webhook secret provides additional security layer
- **Automatic Detection**: Handler detects live mode by checking if the secret key starts with `sk_live_`

### **Live Mode Requirements**
- ✅ **Webhook Secret Required**: Must be set for live mode to work
- ✅ **Format Validation**: Must start with `whsec_`
- ✅ **Paystack Dashboard**: Must be configured in Paystack dashboard

## 🌐 **Webhook URL Configuration**

### **Development (Local)**
```bash
# Use ngrok to expose your local server
npm install -g ngrok
ngrok http 3000

# Copy the ngrok URL and set in Paystack dashboard
# Example: https://abc123.ngrok.io/api/webhooks/paystack
```

### **Production**
```bash
# Set your production domain in Paystack dashboard
https://yourdomain.com/api/webhooks/paystack
```

### **Paystack Dashboard Setup**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Click **Add Webhook**
4. Set URL to your webhook endpoint
5. Select events: `charge.success`, `transfer.success`, `transfer.failed`
6. Copy the webhook secret (for live mode only)

## 🔍 **Environment Detection Logic**

The webhook handler automatically detects your environment:

```typescript
// Test Mode Detection
if (testSecretKey.startsWith('sk_test_')) {
  // Use PAYSTACK_SECRET_KEY for signature verification
  secretToUse = testSecretKey;
}

// Live Mode Detection  
else if (testSecretKey.startsWith('sk_live_')) {
  // Use PAYSTACK_WEBHOOK_SECRET for signature verification
  secretToUse = webhookSecret;
}
```

## 📊 **Configuration Examples**

### **Example 1: Test Mode**
```bash
# .env
PAYSTACK_SECRET_KEY=sk_test_c8ce9460fa0276d2ff1e1b94d6d478a89d1417f0
PAYSTACK_PUBLIC_KEY=pk_test_dd2685941223f26bcb8857508bf7cec63aaf9937
# PAYSTACK_WEBHOOK_SECRET not needed
```

### **Example 2: Live Mode**
```bash
# .env.production
PAYSTACK_SECRET_KEY=sk_live_abc123def456...
PAYSTACK_PUBLIC_KEY=pk_live_xyz789...
PAYSTACK_WEBHOOK_SECRET=whsec_webhook_secret_here
```

## 🧪 **Testing Your Configuration**

### **1. Environment Check**
```bash
node scripts/check-environment.js
```

### **2. Test Webhook Delivery**
```bash
# Start your app
npm run dev

# In another terminal, expose with ngrok
ngrok http 3000

# Update Paystack webhook URL to ngrok URL
# Make a test payment
# Check application logs for webhook events
```

### **3. Verify Webhook Processing**
```bash
# Check webhook events in database
SELECT COUNT(*) FROM webhook_events;

# Check payment statuses
SELECT status, COUNT(*) FROM payments GROUP BY status;
```

## 🚨 **Common Issues & Solutions**

### **Issue: Webhook Not Received**
**Solution**: Check webhook URL in Paystack dashboard

### **Issue: Invalid Signature Error**
**Solution**: 
- Test mode: Ensure `PAYSTACK_SECRET_KEY` is correct
- Live mode: Ensure `PAYSTACK_WEBHOOK_SECRET` is correct and starts with `whsec_`

### **Issue: Environment Not Detected**
**Solution**: Check that `PAYSTACK_SECRET_KEY` starts with `sk_test_` or `sk_live_`

### **Issue: Missing Webhook Secret in Live Mode**
**Solution**: Set `PAYSTACK_WEBHOOK_SECRET` in your environment

## 🎯 **Success Indicators**

Your configuration is working when:
- ✅ Environment variables are properly set
- ✅ Webhook handler detects test/live mode correctly
- ✅ Signature validation passes
- ✅ Webhook events are processed and stored
- ✅ Payment statuses update correctly

## 🔄 **Migration from Test to Live**

### **Step 1: Update Environment Variables**
```bash
# Change from test to live keys
PAYSTACK_SECRET_KEY=sk_live_...  # Was sk_test_...
PAYSTACK_PUBLIC_KEY=pk_live_...  # Was pk_test_...
PAYSTACK_WEBHOOK_SECRET=whsec_... # New for live mode
```

### **Step 2: Update Paystack Dashboard**
- Change webhook URL to production domain
- Copy new webhook secret
- Test with small live payment

### **Step 3: Verify Live Mode**
- Check logs for "Using live mode signature verification"
- Verify webhook processing works
- Monitor payment flows

---

## 🔗 **Quick Reference**

- **Test Mode**: Uses `PAYSTACK_SECRET_KEY` for signature verification
- **Live Mode**: Uses `PAYSTACK_WEBHOOK_SECRET` for signature verification
- **Automatic Detection**: Handler automatically detects environment
- **No Manual Changes**: Code automatically adapts to your configuration
