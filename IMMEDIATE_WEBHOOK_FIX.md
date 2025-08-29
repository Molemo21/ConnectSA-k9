# 🚨 IMMEDIATE WEBHOOK FIX - 5 Minutes

## ⚠️ **Current Issue**
Your webhook endpoint is failing because the `webhook_events` table doesn't exist in your database.

## 🔥 **Quick Fix (5 minutes)**

### **Step 1: Create Missing Database Table**
```bash
# Run this script to create the webhook_events table
node scripts/create-webhook-events-table.js
```

### **Step 2: Verify Environment Variables**
Ensure your `.env` file has:
```bash
# Paystack Configuration (NO separate webhook secret needed)
PAYSTACK_SECRET_KEY=sk_test_your_test_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_test_public_key

# No PAYSTACK_WEBHOOK_SECRET needed!
```

**Important**: Paystack uses the same `PAYSTACK_SECRET_KEY` for both API calls and webhook signature verification. They do NOT provide separate webhook secrets like Stripe.

### **Step 3: Restart Application**
```bash
# Stop your dev server and restart
npm run dev
```

### **Step 4: Test Webhook Endpoint**
Visit: `https://b5424031aff4.ngrok-free.app/api/webhooks/paystack`

You should now see:
- ✅ Environment variables status
- ✅ Database table status
- ✅ Payment status distribution
- ✅ Setup instructions

## 🎯 **Expected Results**

### **Before Fix (Broken)**
```
Error: "The column `webhook_events.event_type` does not exist"
Status: ❌ COMPLETELY BROKEN
```

### **After Fix (Working)**
```json
{
  "message": "Paystack webhook endpoint is working",
  "environment": {
    "NODE_ENV": "development",
    "PAYSTACK_SECRET_KEY": "✅ Set"
  },
  "database": {
    "webhookEvents": "✅ Available (0 events)",
    "payments": "✅ Available (17 payments)",
    "paymentStatusDistribution": {
      "PENDING": 17,
      "ESCROW": 0
    }
  }
}
```

## 🔍 **What the Script Does**

1. **Connects to your database** using `DATABASE_URL`
2. **Creates `webhook_events` table** with correct schema
3. **Adds performance indexes** for fast queries
4. **Tests the table** with sample data
5. **Verifies structure** matches Prisma schema

## 🚨 **If Script Fails**

### **Check Database Connection**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Should look like:
# postgresql://username:password@host:port/database
```

### **Manual Table Creation**
If the script fails, run this SQL directly in your database:
```sql
CREATE TABLE webhook_events (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "eventType" TEXT NOT NULL,
  "paystackRef" TEXT,
  "payload" JSONB NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "error" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "processedAt" TIMESTAMP WITH TIME ZONE
);
```

## 🧪 **Testing After Fix**

### **1. Check Webhook Status**
Visit the GET endpoint to verify everything is working.

### **2. Make Test Payment**
Use Paystack test cards and watch the logs for webhook processing.

### **3. Verify Payment Flow**
Payment should automatically move from PENDING → ESCROW.

## 📋 **Complete Environment Setup**

Your `.env` file should have:
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

## 🎉 **Success Indicators**

Your webhook system is working when:
- ✅ Webhook endpoint returns status information
- ✅ Database tables are accessible
- ✅ Environment variables are detected
- ✅ No more "column does not exist" errors

## 🔗 **Quick Action Items**

1. **IMMEDIATE**: Run `node scripts/create-webhook-events-table.js`
2. **NEXT**: Verify `PAYSTACK_SECRET_KEY` is set in `.env`
3. **THEN**: Restart your application
4. **FINALLY**: Test webhook endpoint

**Time to fix: ~5 minutes**
**Impact: Complete webhook functionality restoration**
**Result: Automatic payment processing, no more manual recovery**

---

## 📞 **Need Help?**

If the script fails:
1. Check your `DATABASE_URL` environment variable
2. Ensure you can connect to your Supabase database
3. Verify you have write permissions to create tables
4. Check the error message for specific database issues

## 🔐 **Important: Paystack Webhook Security**

**Paystack uses the same `PAYSTACK_SECRET_KEY` for webhook verification:**
- ✅ **API calls** → Uses `PAYSTACK_SECRET_KEY`
- ✅ **Webhook verification** → Uses `PAYSTACK_SECRET_KEY`
- ✅ **Both test and live** → Same key for both environments

**No separate webhook secrets needed** - this is how Paystack works by design!

The webhook handler is now robust and will work even if the table is missing, but you need the table for proper webhook event tracking and idempotency.
