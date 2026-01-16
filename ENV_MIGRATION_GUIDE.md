# 🚨 CRITICAL: `.env` File Contains Production Credentials

## ⚠️ Current Issue

Your `.env` file currently contains **PRODUCTION** credentials:
- Production database URLs (`qdrktzqfeewwcktgltzy`)
- Production URLs (`app.proliinkconnect.co.za`)
- Production configuration (`NODE_ENV=production`)

**This is a security risk and breaks environment isolation!**

---

## ✅ What Needs to Happen

### Step 1: Move Production Credentials OUT of `.env`

**Production credentials should ONLY be in your hosting platform (Vercel), NOT in the repository.**

### Step 2: Create `.env.development` with Development Credentials

All development-specific variables should be in `.env.development`.

---

## 📋 Variables Currently in `.env` (Production)

Based on what I can see, your `.env` contains:

```bash
# ❌ PRODUCTION - Should NOT be in .env
NODE_ENV=production
COOKIE_DOMAIN=app.proliinkconnect.co.za
DATABASE_URL=postgresql://postgres.qdrktzqfeewwcktgltzy:...@aws-0-eu-west-1.pooler.supabase.com:6543/...
DIRECT_URL=postgresql://postgres.qdrktzqfeewwcktgltzy:...@aws-0-eu-west-1.pooler.supabase.com:6543/...
NEXTAUTH_URL=https://app.proliinkconnect.co.za
FROM_EMAIL=no-reply@app.proliinkconnect.co.za
PAYSTACK_WEBHOOK_URL=https://app.proliinkconnect.co.za/api/webhooks/paystack
PRISMA_DISABLE_PREPARED_STATEMENTS=true
JWT_SECRET=supersecretdevkey1234567890abcdef
JWT_EXPIRES_IN=7d
```

**⚠️ ALL OF THESE ARE PRODUCTION VALUES - They should NOT be in `.env`!**

---

## 🔄 Migration Steps

### Step 1: Backup Current `.env`

```bash
cp .env .env.backup
```

### Step 2: Create `.env.development` with Development Values

Create `.env.development` with these **development** values:

```bash
# ============================================================================
# DEVELOPMENT ENVIRONMENT
# ============================================================================
NODE_ENV=development

# ============================================================================
# DATABASE - Development Supabase Database
# ============================================================================
# ⚠️ Replace with your DEVELOPMENT database credentials
DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres?sslmode=require"
PRISMA_DISABLE_PREPARED_STATEMENTS=false

# ============================================================================
# SUPABASE STORAGE - Development Supabase Project
# ============================================================================
# ⚠️ Replace with your DEVELOPMENT Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL="https://[dev-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[dev-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[dev-service-role-key]"

# ============================================================================
# AUTHENTICATION
# ============================================================================
# ⚠️ Use DIFFERENT secrets for development (minimum 32 characters)
JWT_SECRET="[your-dev-jwt-secret-minimum-32-characters-long]"
JWT_EXPIRES_IN="7d"
NEXTAUTH_SECRET="[your-dev-nextauth-secret-minimum-32-characters-long]"
NEXTAUTH_URL="http://localhost:3000"

# ============================================================================
# APPLICATION URLs
# ============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"

# ============================================================================
# EMAIL SERVICE
# ============================================================================
RESEND_API_KEY="re_[your-resend-api-key]"
FROM_EMAIL="no-reply@your-dev-domain.com"

# ============================================================================
# PAYMENT SERVICE (TEST MODE for development)
# ============================================================================
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY="sk_test_[your-test-secret-key]"
PAYSTACK_PUBLIC_KEY="pk_test_[your-test-public-key]"
PAYSTACK_WEBHOOK_SECRET=""
PAYSTACK_WEBHOOK_URL="http://localhost:3000/api/webhooks/paystack"
PAYSTACK_BASE_URL="https://api.paystack.co"
PAYSTACK_TEST_MODE=true
```

### Step 3: Clear `.env` (Keep Minimal or Empty)

**Option A: Empty `.env` (Recommended)**
```bash
# .env should be empty or contain only shared fallback values
# Leave it empty - Next.js will use .env.development when NODE_ENV=development
```

**Option B: Minimal `.env` (If you need shared fallback)**
```bash
# Only put truly shared values here (rare)
# Most projects should leave .env empty
```

### Step 4: Verify Production Credentials in Hosting Platform

**In Vercel (or your hosting platform):**
1. Go to Project Settings → Environment Variables
2. Verify all production credentials are set there:
   - `NODE_ENV=production`
   - `DATABASE_URL` (production database)
   - `DIRECT_URL` (production database)
   - `NEXT_PUBLIC_SUPABASE_URL` (production Supabase project)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production)
   - `SUPABASE_SERVICE_ROLE_KEY` (production)
   - `NEXTAUTH_URL` (production URL)
   - `NEXT_PUBLIC_APP_URL` (production URL)
   - `COOKIE_DOMAIN` (production domain)
   - All other production values

---

## 🔍 Key Differences: Development vs Production

| Variable | Development (`.env.development`) | Production (Hosting Platform) |
|----------|----------------------------------|------------------------------|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | Dev Supabase database | Prod Supabase database |
| `NEXT_PUBLIC_SUPABASE_URL` | Dev Supabase project | Prod Supabase project (`qdrktzqfeewwcktgltzy`) |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://app.proliinkconnect.co.za` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://app.proliinkconnect.co.za` |
| `COOKIE_DOMAIN` | `localhost` | `app.proliinkconnect.co.za` |
| `JWT_SECRET` | Dev secret (different) | Prod secret (different) |
| `NEXTAUTH_SECRET` | Dev secret (different) | Prod secret (different) |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` (TEST) | `sk_live_...` (LIVE) |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` (TEST) | `pk_live_...` (LIVE) |
| `PAYSTACK_TEST_MODE` | `true` | `false` |

---

## ✅ Verification Checklist

After migration:

- [ ] `.env` is empty or minimal (no production credentials)
- [ ] `.env.development` contains ONLY development credentials
- [ ] Development database URLs point to dev Supabase database (NOT `qdrktzqfeewwcktgltzy`)
- [ ] Development Supabase URLs point to dev Supabase project (NOT `qdrktzqfeewwcktgltzy`)
- [ ] Development URLs use `http://localhost:3000` (NOT production URLs)
- [ ] Production credentials are set in hosting platform (Vercel)
- [ ] Test: `npm run dev` works with `.env.development`
- [ ] Test: No warnings about using production Supabase project
- [ ] Test: No errors about database connection (connects to dev)

---

## 🚨 Critical Actions Required

1. **IMMEDIATE**: Remove production credentials from `.env`
2. **IMMEDIATE**: Create `.env.development` with development credentials
3. **VERIFY**: Production credentials are in hosting platform (Vercel)
4. **TEST**: Development works with new configuration
5. **VERIFY**: Production deployment still works (uses hosting platform env vars)

---

## 📝 Quick Migration Command

```bash
# 1. Backup current .env
cp .env .env.backup

# 2. Create .env.development (copy template from ENV_DEVELOPMENT_CHECKLIST.md)
# Edit with your development credentials

# 3. Clear .env (or make it minimal)
echo "" > .env
# OR keep minimal shared values only

# 4. Test development
npm run dev
```

---

**Status**: 🚨 **CRITICAL - Action Required**
**Priority**: **HIGH** - Production credentials should not be in repository
