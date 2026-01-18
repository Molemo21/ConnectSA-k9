# 🔍 GitHub Secrets: DEV_DATABASE_URL vs PROD_DATABASE_URL Explained

## Your Current Setup

✅ **Local `.env.development`:** `DATABASE_URL`  
✅ **Vercel Production:** `DATABASE_URL`

## What GitHub Actions Needs

The CI/CD pipeline needs **different variable names** for clarity and safety:
- `DEV_DATABASE_URL` - Source database (where changes exist)
- `PROD_DATABASE_URL` - Target database (where changes should go)

## How the Sync Script Works

Looking at `scripts/sync-reference-data-dev-to-prod.ts`:

```typescript
// Line 504-505
const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
const prodUrl = process.env.PROD_DATABASE_URL;
```

**Key Points:**
1. ✅ `DEV_DATABASE_URL` has a fallback to `DATABASE_URL`
2. ❌ `PROD_DATABASE_URL` is **REQUIRED** (no fallback)

## Best Practice Solution

### Option 1: Same Database for Dev and Prod (Recommended if you only have one database)

If you're using the **same database** for both development and production:

**In GitHub Secrets, set:**
- `DEV_DATABASE_URL` = Your `DATABASE_URL` from Vercel (Production)
- `PROD_DATABASE_URL` = Your `DATABASE_URL` from Vercel (Production) - **same value**

**Why?**
- Both point to the same database
- The sync script will copy from the same place to itself
- This is safe because the script only creates/updates, never deletes
- It's idempotent (safe to run multiple times)

### Option 2: Different Databases (If you have separate dev/prod)

If you have **separate databases**:

**In GitHub Secrets, set:**
- `DEV_DATABASE_URL` = Your development database URL (where you made changes locally)
- `PROD_DATABASE_URL` = Your production database URL (from Vercel)

---

## Step-by-Step: Setting Up GitHub Secrets

### Step 1: Get Your Production Database URL

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `DATABASE_URL` (Production environment)
3. Copy this value

### Step 2: Determine Your Setup

**Question:** Do you use the same database for local development and production?

- **Yes (Same DB):** Your local `.env.development` `DATABASE_URL` is the same as Vercel's `DATABASE_URL`
- **No (Different DBs):** Your local `.env.development` `DATABASE_URL` is different from Vercel's `DATABASE_URL`

### Step 3: Set GitHub Secrets

#### If Using Same Database (Most Common):

```bash
# In GitHub Secrets, add:

DEV_DATABASE_URL = [Same as your Vercel DATABASE_URL]
PROD_DATABASE_URL = [Same as your Vercel DATABASE_URL]
```

**Example:**
```
DEV_DATABASE_URL = postgresql://user:pass@host:6543/db?pgbouncer=true
PROD_DATABASE_URL = postgresql://user:pass@host:6543/db?pgbouncer=true
```

#### If Using Different Databases:

```bash
# In GitHub Secrets, add:

DEV_DATABASE_URL = [Your local .env.development DATABASE_URL]
PROD_DATABASE_URL = [Your Vercel Production DATABASE_URL]
```

---

## Important: Why Different Names?

The sync script uses **explicit names** for safety:

1. **Clarity:** Makes it obvious which database is source vs target
2. **Safety:** Prevents accidentally syncing in the wrong direction
3. **CI/CD Best Practice:** Explicit is better than implicit
4. **No Ambiguity:** GitHub Actions needs to know exactly which DB to read from and write to

---

## How to Verify Your Setup

### Check 1: Which Database Has Your Changes?

Run this to check where your changes exist:

```bash
# Check your local database
export DATABASE_URL="your-local-database-url"
npx tsx scripts/verify-beauty-subcategories.ts
```

If this shows your changes (Mobile Car Wash, Beauty subcategories), then:
- `DEV_DATABASE_URL` should point to this database

### Check 2: Which Database Should Receive Changes?

Your production database in Vercel should receive the changes, so:
- `PROD_DATABASE_URL` should point to your Vercel `DATABASE_URL`

---

## Common Scenarios

### Scenario 1: Single Database (Dev = Prod)

**Your Setup:**
- Local `.env.development`: `DATABASE_URL` → Production DB
- Vercel Production: `DATABASE_URL` → Same Production DB

**GitHub Secrets:**
```
DEV_DATABASE_URL = [Production DB URL]
PROD_DATABASE_URL = [Production DB URL] (same value)
```

**Result:** ✅ Safe - Syncs from production to production (idempotent, safe)

---

### Scenario 2: Separate Databases

**Your Setup:**
- Local `.env.development`: `DATABASE_URL` → Development DB
- Vercel Production: `DATABASE_URL` → Production DB

**GitHub Secrets:**
```
DEV_DATABASE_URL = [Development DB URL]
PROD_DATABASE_URL = [Production DB URL]
```

**Result:** ✅ Safe - Syncs from dev to prod (proper workflow)

---

### Scenario 3: Local Dev on Production DB

**Your Setup:**
- Local `.env.development`: `DATABASE_URL` → Production DB (you test on prod)
- Vercel Production: `DATABASE_URL` → Same Production DB

**GitHub Secrets:**
```
DEV_DATABASE_URL = [Production DB URL]
PROD_DATABASE_URL = [Production DB URL] (same value)
```

**Result:** ✅ Safe - Both point to production, sync is idempotent

---

## Verification Checklist

After setting up secrets, verify:

- [ ] `DEV_DATABASE_URL` points to database with your changes
- [ ] `PROD_DATABASE_URL` points to production database
- [ ] Both secrets are added in GitHub (Settings → Secrets → Actions)
- [ ] You can see them in the list (values hidden as `••••••••`)

---

## Testing the Setup

Once secrets are configured, test with a dry-run:

1. **Push a commit** to trigger the workflow
2. **Watch the workflow** in GitHub Actions
3. **Check the "Promote Reference Data" job:**
   - It should show: `✅ Reference data promotion configured`
   - Not: `⚠️ Reference data promotion skipped`

---

## Summary

✅ **It's fine** that your local/Vercel env only has `DATABASE_URL`

✅ **You still need** to create `DEV_DATABASE_URL` and `PROD_DATABASE_URL` in GitHub Secrets

✅ **They can have the same value** if you're using one database for both

✅ **The sync script will differentiate** because it reads `DEV_DATABASE_URL` to read from and `PROD_DATABASE_URL` to write to

**Bottom line:** GitHub Secrets use different names for clarity and safety, but they can point to the same database if that's your setup!

---

## Quick Reference

```bash
# Get these values:

# 1. Production DB URL (from Vercel)
Vercel → Settings → Environment Variables → DATABASE_URL (Production)

# 2. Dev DB URL (from your local .env.development)
# If same as production, use same value
# If different, use your local DATABASE_URL

# 3. Set in GitHub Secrets:
DEV_DATABASE_URL = [value from step 1 or 2]
PROD_DATABASE_URL = [value from step 1]
```

---

**Need help determining which setup you have?** Check your `.env.development` file - does `DATABASE_URL` match your Vercel production `DATABASE_URL`?
