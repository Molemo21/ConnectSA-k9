# ✅ `.env.development` Checklist

## Next.js Environment File Best Practices

**File Loading Order** (later overrides earlier):
1. `.env` - Fallback (should be minimal or empty)
2. `.env.local` - Local overrides (gitignored, highest priority)
3. `.env.development` - Development-specific (THIS FILE)
4. `.env.development.local` - Development local overrides (gitignored)

**Best Practice**: All development-specific variables should be in `.env.development`, not `.env`.

---

## 📋 Required Variables for `.env.development`

### ✅ Database (CRITICAL - Must be dev database)

```bash
# Development Supabase Database
DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres?sslmode=require"
PRISMA_DISABLE_PREPARED_STATEMENTS=false
```

**⚠️ CRITICAL**: These MUST point to your **development** Supabase database, NOT production.

---

### ✅ Supabase Storage (CRITICAL - Must be dev project)

```bash
# Development Supabase Project
NEXT_PUBLIC_SUPABASE_URL="https://[dev-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[dev-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[dev-service-role-key]"
```

**⚠️ CRITICAL**: These MUST point to your **development** Supabase project, NOT production (`qdrktzqfeewwcktgltzy`).

---

### ✅ Authentication (Required)

```bash
# JWT Configuration
JWT_SECRET="[your-dev-jwt-secret-minimum-32-characters]"
JWT_EXPIRES_IN="7d"

# NextAuth Configuration
NEXTAUTH_SECRET="[your-dev-nextauth-secret-minimum-32-characters]"
NEXTAUTH_URL="http://localhost:3000"
```

**Note**: Use different secrets for development vs production.

---

### ✅ Application URLs (Required)

```bash
# Application URL (Public - accessible in browser)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"
```

---

### ✅ Email Service (Required)

```bash
# Resend Email Service
RESEND_API_KEY="re_[your-resend-api-key]"
FROM_EMAIL="no-reply@your-dev-domain.com"
```

**Note**: Can use same Resend API key for dev, or use test mode.

---

### ✅ Payment Service (Required for testing)

```bash
# Paystack Configuration (Use TEST mode for development)
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY="sk_test_[your-test-secret-key]"
PAYSTACK_PUBLIC_KEY="pk_test_[your-test-public-key]"
PAYSTACK_WEBHOOK_SECRET=""
PAYSTACK_BASE_URL="https://api.paystack.co"
PAYSTACK_TEST_MODE=true
```

**Note**: Use Paystack TEST mode keys for development.

---

### ✅ Environment Configuration

```bash
# Environment
NODE_ENV=development
LOG_LEVEL=debug
```

---

### ⚠️ Optional (Recommended)

```bash
# Push Notifications (VAPID Keys)
VAPID_PUBLIC_KEY="[your-vapid-public-key]"
VAPID_PRIVATE_KEY="[your-vapid-private-key]"
VAPID_SUBJECT="mailto:support@your-dev-domain.com"

# Transfer Configuration
TRANSFER_RETRY_MAX=5
TRANSFER_RETRY_CRON="*/5 * * * *"

# Server Configuration
HOSTNAME=localhost
PORT=3000
```

---

## 🔍 Variables That Should NOT Be in `.env.development`

### ❌ Production Credentials
- Production `DATABASE_URL` (should be in hosting platform only)
- Production `NEXT_PUBLIC_SUPABASE_URL` (should be in hosting platform only)
- Production `JWT_SECRET` (use different secrets for dev)
- Production `NEXTAUTH_SECRET` (use different secrets for dev)
- Production Paystack LIVE keys (use TEST keys for dev)

### ❌ Production URLs
- Production `NEXT_PUBLIC_APP_URL` (use `http://localhost:3000` for dev)
- Production `NEXTAUTH_URL` (use `http://localhost:3000` for dev)
- Production `COOKIE_DOMAIN` (use `localhost` for dev)

---

## 📝 Complete `.env.development` Template

```bash
# ============================================================================
# DEVELOPMENT ENVIRONMENT CONFIGURATION
# ============================================================================
# This file contains development-specific environment variables.
# Production variables should be set in your hosting platform (Vercel).
# ============================================================================

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# ============================================================================
# DATABASE - Development Supabase Database
# ============================================================================
# ⚠️ CRITICAL: Must point to DEVELOPMENT database, NOT production
DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[DEV_PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres?sslmode=require"
PRISMA_DISABLE_PREPARED_STATEMENTS=false

# ============================================================================
# SUPABASE STORAGE - Development Supabase Project
# ============================================================================
# ⚠️ CRITICAL: Must point to DEVELOPMENT Supabase project, NOT production (qdrktzqfeewwcktgltzy)
NEXT_PUBLIC_SUPABASE_URL="https://[dev-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[dev-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[dev-service-role-key]"

# ============================================================================
# AUTHENTICATION
# ============================================================================
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
# EMAIL SERVICE (Resend)
# ============================================================================
RESEND_API_KEY="re_[your-resend-api-key]"
FROM_EMAIL="no-reply@your-dev-domain.com"

# ============================================================================
# PAYMENT SERVICE (Paystack - TEST MODE)
# ============================================================================
PAYSTACK_MODE=test
PAYSTACK_SECRET_KEY="sk_test_[your-test-secret-key]"
PAYSTACK_PUBLIC_KEY="pk_test_[your-test-public-key]"
PAYSTACK_WEBHOOK_SECRET=""
PAYSTACK_BASE_URL="https://api.paystack.co"
PAYSTACK_TEST_MODE=true

# ============================================================================
# OPTIONAL - Push Notifications
# ============================================================================
# VAPID_PUBLIC_KEY="[your-vapid-public-key]"
# VAPID_PRIVATE_KEY="[your-vapid-private-key]"
# VAPID_SUBJECT="mailto:support@your-dev-domain.com"

# ============================================================================
# OPTIONAL - Transfer Configuration
# ============================================================================
# TRANSFER_RETRY_MAX=5
# TRANSFER_RETRY_CRON="*/5 * * * *"

# ============================================================================
# OPTIONAL - Server Configuration
# ============================================================================
# HOSTNAME=localhost
# PORT=3000
```

---

## ✅ Verification Checklist

Before using `.env.development`, verify:

- [ ] **Database URLs** point to **development** Supabase database (NOT production)
- [ ] **Supabase URLs** point to **development** Supabase project (NOT `qdrktzqfeewwcktgltzy`)
- [ ] **JWT_SECRET** and **NEXTAUTH_SECRET** are different from production (minimum 32 characters)
- [ ] **NEXT_PUBLIC_APP_URL** is `http://localhost:3000` (NOT production URL)
- [ ] **NEXTAUTH_URL** is `http://localhost:3000` (NOT production URL)
- [ ] **COOKIE_DOMAIN** is `localhost` (NOT production domain)
- [ ] **Paystack keys** are TEST mode (`sk_test_`, `pk_test_`) (NOT live keys)
- [ ] **FROM_EMAIL** is appropriate for development (can be test email)

---

## 🔄 Migration from `.env` to `.env.development`

If you currently have variables in `.env`:

1. **Copy all development-specific variables** from `.env` to `.env.development`
2. **Update values** to point to development resources (dev database, dev Supabase project)
3. **Remove production credentials** from `.env.development` (they should only be in hosting platform)
4. **Keep `.env` minimal** - only shared fallback values, or leave it empty
5. **Test** that development works with `.env.development`

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Putting production credentials in `.env.development`**
   - Production credentials should ONLY be in hosting platform (Vercel)

2. ❌ **Using production Supabase project in development**
   - Must use separate Supabase project for development
   - Warning will appear if you use production project (`qdrktzqfeewwcktgltzy`)

3. ❌ **Using production database in development**
   - Code will BLOCK this (throws error)
   - Must use development database

4. ❌ **Using same secrets for dev and prod**
   - Use different `JWT_SECRET` and `NEXTAUTH_SECRET` for each environment

5. ❌ **Using production URLs in development**
   - Use `http://localhost:3000` for development
   - Production URLs should only be in hosting platform

---

## 📚 Next.js Environment Variable Priority

When `NODE_ENV=development`, Next.js loads in this order:

1. `.env` (lowest priority)
2. `.env.local` (gitignored)
3. `.env.development` (THIS FILE - development-specific)
4. `.env.development.local` (gitignored, highest priority)

**Best Practice**: Put all development variables in `.env.development`, use `.env.local` only for personal overrides.

---

## ✅ Final Check

After setting up `.env.development`:

1. ✅ Start dev server: `npm run dev`
2. ✅ Verify no warnings about using production Supabase project
3. ✅ Verify no errors about database connection (should connect to dev database)
4. ✅ Test upload: Upload image → should go to dev Supabase storage
5. ✅ Test query: Run query → should query dev database only

---

**Status**: Ready for implementation
**Next Step**: Copy template above, fill in your development credentials, verify checklist
