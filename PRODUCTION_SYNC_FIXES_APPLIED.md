# Production Environment Setup Guide

## 🚨 Critical Fixes Applied

### 1. Database Connection Fix
- **Fixed**: Removed hardcoded database URL from `lib/prisma.ts`
- **Now**: Uses `DATABASE_URL` environment variable properly
- **Impact**: Production will use correct database instead of development database

### 2. Environment Variable Configuration

Create a `.env.production` file with these variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15&pool_timeout=60&connection_limit=5"
PRISMA_DISABLE_PREPARED_STATEMENTS=true
DIRECT_URL="postgresql://postgres:<password>@aws-0-eu-west-1.supabase.com:5432/postgres?sslmode=require"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_EXPIRES_IN="7d"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Email Service (Resend)
RESEND_API_KEY="re_your-resend-api-key"
FROM_EMAIL="no-reply@your-domain.com"

# Payment Service (Paystack)
PAYSTACK_SECRET_KEY="sk_live_your-production-secret-key"
PAYSTACK_PUBLIC_KEY="pk_live_your-production-public-key"
PAYSTACK_TEST_MODE=false
PAYSTACK_WEBHOOK_URL="https://your-domain.com/api/webhooks/paystack"

# App Configuration
NODE_ENV=production
COOKIE_DOMAIN=your-domain.com
LOG_LEVEL=info
```

### 3. Database Schema Synchronization

The Prisma schema has been verified to match production database:
- ✅ User model has all required fields (phone, avatar, googleId, appleId)
- ✅ Provider model has all required fields (description, experience, etc.)
- ✅ ProviderStatus enum includes INCOMPLETE status
- ✅ All required models exist (ProviderReview, VerificationToken, etc.)

### 4. API Route Environment Handling

Fixed environment detection in API routes:
- ✅ Proper build-time vs runtime detection
- ✅ Consistent error handling across environments
- ✅ Environment-specific logging configuration

## 🚀 Deployment Steps

### Step 1: Update Environment Variables
1. Set all environment variables in your production environment (Vercel, etc.)
2. Ensure `DATABASE_URL` points to your production database
3. Verify `NODE_ENV=production` is set

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: Deploy Database Changes (if needed)
```bash
npx prisma migrate deploy
```

### Step 4: Deploy Application
Deploy your application with the updated code.

## 🔍 Verification Steps

### 1. Test Database Connection
Visit: `https://your-domain.com/api/debug/environment`

Expected response:
```json
{
  "success": true,
  "environment": {
    "NODE_ENV": "production",
    "DATABASE_URL_PRESENT": true,
    "DIRECT_URL_PRESENT": true
  }
}
```

### 2. Test API Endpoints
- Test booking creation: `POST /api/book-service`
- Test payment processing: `POST /api/book-service/[id]/pay`
- Test webhook endpoint: `GET /api/webhooks/paystack`

### 3. Monitor Logs
Check application logs for:
- ✅ "Database URL configured from environment variables"
- ✅ No "DATABASE_URL environment variable is required" errors
- ✅ Successful database connections

## 🎯 Expected Results

After applying these fixes:
- ✅ Production uses correct database (not development database)
- ✅ Environment variables are properly loaded
- ✅ API routes work consistently across environments
- ✅ Database schema matches Prisma schema
- ✅ Frontend and backend stay synchronized

## 🚨 Common Issues & Solutions

### Issue: Still using development database
**Solution**: Verify `DATABASE_URL` environment variable is set correctly in production

### Issue: Schema mismatches
**Solution**: Run `npx prisma generate` and `npx prisma migrate deploy`

### Issue: Environment variables not loading
**Solution**: Restart application after setting environment variables

### Issue: API routes failing
**Solution**: Check `NODE_ENV` is set to "production" in environment

## 📋 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Payment processing working
- [ ] Email notifications working
- [ ] Admin dashboard accessible
- [ ] User registration/login working
- [ ] Booking flow complete end-to-end

---

**Status**: ✅ **FIXES APPLIED** | 🚀 **READY FOR DEPLOYMENT**
**Priority**: Critical (resolves production synchronization issues)
**Impact**: Production will now work correctly with proper database and environment configuration
