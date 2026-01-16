# ✅ Manual `.env.development` Verification Checklist

Use this checklist to verify your `.env.development` configuration manually.

---

## 🚨 CRITICAL CHECKS (Must Pass)

### 1. Environment
- [ ] `NODE_ENV=development` (NOT "production")
- [ ] No production URLs anywhere

### 2. Database URLs (MUST be development database)
- [ ] `DATABASE_URL` does NOT contain `qdrktzqfeewwcktgltzy`
- [ ] `DATABASE_URL` does NOT contain `pooler.supabase.com`
- [ ] `DATABASE_URL` does NOT contain `aws-0-eu-west-1`
- [ ] `DATABASE_URL` points to your **development** Supabase database
- [ ] `DIRECT_URL` does NOT contain `qdrktzqfeewwcktgltzy`
- [ ] `DIRECT_URL` does NOT contain `pooler.supabase.com`
- [ ] `DIRECT_URL` points to your **development** Supabase database

**Example of CORRECT development database URL:**
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres"
```

**Example of WRONG (production):**
```
DATABASE_URL="postgresql://postgres.qdrktzqfeewwcktgltzy:...@aws-0-eu-west-1.pooler.supabase.com:6543/..."
```

### 3. Supabase Storage (MUST be development project)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` does NOT contain `qdrktzqfeewwcktgltzy`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to your **development** Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is from development project
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is from development project

**Example of CORRECT development Supabase URL:**
```
NEXT_PUBLIC_SUPABASE_URL="https://[dev-project-ref].supabase.co"
```

**Example of WRONG (production):**
```
NEXT_PUBLIC_SUPABASE_URL="https://qdrktzqfeewwcktgltzy.supabase.co"
```

### 4. Application URLs (MUST be localhost)
- [ ] `NEXTAUTH_URL=http://localhost:3000` (NOT production URL)
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000` (NOT production URL)
- [ ] `COOKIE_DOMAIN=localhost` (NOT `app.proliinkconnect.co.za`)

**Example of CORRECT:**
```
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"
```

**Example of WRONG:**
```
NEXTAUTH_URL="https://app.proliinkconnect.co.za"
NEXT_PUBLIC_APP_URL="https://app.proliinkconnect.co.za"
COOKIE_DOMAIN="app.proliinkconnect.co.za"
```

---

## ✅ Required Variables Checklist

### Environment
- [ ] `NODE_ENV=development`

### Database
- [ ] `DATABASE_URL` (development database)
- [ ] `DIRECT_URL` (development database)
- [ ] `PRISMA_DISABLE_PREPARED_STATEMENTS=false` (or not set)

### Supabase Storage
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (development project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (development project)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (development project)

### Authentication
- [ ] `JWT_SECRET` (minimum 32 characters, different from production)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `NEXTAUTH_SECRET` (minimum 32 characters, different from production)
- [ ] `NEXTAUTH_URL=http://localhost:3000`

### Application URLs
- [ ] `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] `COOKIE_DOMAIN=localhost`

### Email Service
- [ ] `RESEND_API_KEY` (starts with `re_`)
- [ ] `FROM_EMAIL` (valid email format)

### Payment Service (TEST Mode)
- [ ] `PAYSTACK_SECRET_KEY` (starts with `sk_test_`, NOT `sk_live_`)
- [ ] `PAYSTACK_PUBLIC_KEY` (starts with `pk_test_`, NOT `pk_live_`)
- [ ] `PAYSTACK_TEST_MODE=true`
- [ ] `PAYSTACK_WEBHOOK_URL=http://localhost:3000/api/webhooks/paystack` (NOT production URL)

---

## 🔍 Pattern Validation

### Database URL Pattern
✅ **CORRECT:**
```
postgresql://postgres:[PASSWORD]@db.[dev-project-ref].supabase.co:5432/postgres
```

❌ **WRONG (Production):**
```
postgresql://postgres.qdrktzqfeewwcktgltzy:...@aws-0-eu-west-1.pooler.supabase.com:6543/...
```

### Supabase URL Pattern
✅ **CORRECT:**
```
https://[dev-project-ref].supabase.co
```

❌ **WRONG (Production):**
```
https://qdrktzqfeewwcktgltzy.supabase.co
```

### Paystack Keys Pattern
✅ **CORRECT (Test Mode):**
```
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
```

❌ **WRONG (Live Mode):**
```
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
```

### Secrets Length
✅ **CORRECT:**
```
JWT_SECRET="[at least 32 characters long]"
NEXTAUTH_SECRET="[at least 32 characters long]"
```

❌ **WRONG:**
```
JWT_SECRET="short"  # Less than 32 characters
```

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Using production database** (`qdrktzqfeewwcktgltzy`)
   - ✅ Use separate development database

2. ❌ **Using production Supabase project** (`qdrktzqfeewwcktgltzy`)
   - ✅ Use separate development Supabase project

3. ❌ **Using production URLs** (`app.proliinkconnect.co.za`)
   - ✅ Use `http://localhost:3000` for development

4. ❌ **Using production secrets** (same as production)
   - ✅ Use different secrets for development

5. ❌ **Using Paystack LIVE keys** (`sk_live_`, `pk_live_`)
   - ✅ Use TEST keys (`sk_test_`, `pk_test_`) for development

6. ❌ **Setting `NODE_ENV=production`**
   - ✅ Must be `NODE_ENV=development`

---

## ✅ After Saving Your File

1. **Save the file** (if you haven't already)
2. **Run validation script:**
   ```bash
   node scripts/validate-env-development.js
   ```
3. **Test development server:**
   ```bash
   npm run dev
   ```
4. **Verify:**
   - No warnings about production Supabase project
   - No errors about database connection
   - Connects to development database
   - Uses development Supabase storage

---

## 📝 Quick Reference: What Should Be Where

| Variable | Development (`.env.development`) | Production (Hosting Platform) |
|----------|--------------------------------|-------------------------------|
| `NODE_ENV` | `development` | `production` |
| `DATABASE_URL` | Dev Supabase database | Prod Supabase database |
| `NEXT_PUBLIC_SUPABASE_URL` | Dev Supabase project | Prod Supabase project |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://app.proliinkconnect.co.za` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://app.proliinkconnect.co.za` |
| `COOKIE_DOMAIN` | `localhost` | `app.proliinkconnect.co.za` |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` | `pk_live_...` |
| `PAYSTACK_TEST_MODE` | `true` | `false` |

---

**Status**: Ready for manual verification
**Next Step**: Save your `.env.development` file, then run the validation script
