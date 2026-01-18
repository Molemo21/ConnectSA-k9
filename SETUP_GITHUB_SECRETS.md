# 🔐 Setting Up GitHub Secrets for CI/CD Pipeline

## Overview

Your CI/CD pipeline needs access to database credentials and API keys. These are stored as **GitHub Secrets** to keep them secure.

## Step-by-Step Guide

### Step 1: Access GitHub Repository Settings

1. **Go to your repository on GitHub:**
   ```
   https://github.com/Molemo21/ConnectSA-k9
   ```

2. **Navigate to Secrets:**
   - Click on **Settings** (top navigation bar)
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

### Step 2: Add Required Secrets

You'll need to add these secrets one by one. For each secret:

1. Click **"New repository secret"** button
2. Enter the **Name** (exactly as shown below)
3. Enter the **Secret** value
4. Click **"Add secret"**

---

## Required Secrets

### 1. DATABASE_URL

**Name:** `DATABASE_URL`

**Description:** Production database connection string (PostgreSQL)

**How to get it:**
- **From Vercel:**
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Find `DATABASE_URL`
  3. Copy the value
  4. Make sure it's the **Production** environment value

- **Format:** 
  ```
  postgresql://user:password@host:port/database?sslmode=require
  ```

**Example:**
```
postgresql://postgres:yourpassword@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=15
```

---

### 2. DIRECT_URL

**Name:** `DIRECT_URL`

**Description:** Direct database connection (bypasses connection pooler for migrations)

**How to get it:**
- **From Vercel:**
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Find `DIRECT_URL`
  3. Copy the value
  4. If it doesn't exist, use the same as `DATABASE_URL` but change the port (usually 5432 instead of 6543)

- **Format:**
  ```
  postgresql://user:password@host:5432/database?sslmode=require
  ```

**Example:**
```
postgresql://postgres:yourpassword@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Note:** If you don't have `DIRECT_URL` in Vercel, create it by:
- Taking your `DATABASE_URL`
- Changing the port from `6543` (pooler) to `5432` (direct)
- Removing `pgbouncer=true` parameter

---

### 3. DEV_DATABASE_URL

**Name:** `DEV_DATABASE_URL`

**Description:** Development database connection string (where your changes currently exist)

**How to get it:**
- **Option 1: From your local `.env.development` file:**
  ```bash
  # Open your .env.development file
  # Copy the DATABASE_URL value
  ```

- **Option 2: From Vercel (if you have a dev/staging environment):**
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Switch to **Development** or **Preview** environment
  3. Find `DATABASE_URL`
  4. Copy the value

- **Option 3: Use the same as DATABASE_URL (if dev = prod):**
  - If you're using the same database for dev and prod, just copy `DATABASE_URL`

**Important:** This should point to the database where you ran:
- `npx tsx scripts/ensure-beauty-services.ts`
- `npx tsx scripts/merge-beauty-categories.ts`
- `npx tsx scripts/ensure-mobile-car-wash.ts`

---

### 4. PROD_DATABASE_URL

**Name:** `PROD_DATABASE_URL`

**Description:** Production database connection string (same as DATABASE_URL)

**How to get it:**
- **Same as DATABASE_URL:**
  1. Copy the `DATABASE_URL` value you just added
  2. Use the exact same value for `PROD_DATABASE_URL`

**Note:** Some setups use separate URLs, but typically they're the same.

---

### 5. NEXTAUTH_SECRET

**Name:** `NEXTAUTH_SECRET`

**Description:** Secret key for NextAuth.js authentication

**How to get it:**
- **From Vercel:**
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Find `NEXTAUTH_SECRET`
  3. Copy the value

- **If you need to generate a new one:**
  ```bash
  openssl rand -base64 32
  ```

**Example:**
```
your-nextauth-secret-key-here-minimum-32-characters
```

---

### 6. JWT_SECRET

**Name:** `JWT_SECRET`

**Description:** Secret key for JWT token signing

**How to get it:**
- **From Vercel:**
  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
  2. Find `JWT_SECRET`
  3. Copy the value

- **If you need to generate a new one:**
  ```bash
  openssl rand -base64 32
  ```

**Example:**
```
your-jwt-secret-key-here-minimum-32-characters
```

---

## Complete Checklist

Use this checklist to ensure you've added all secrets:

- [ ] `DATABASE_URL` - Production database connection
- [ ] `DIRECT_URL` - Direct database connection (for migrations)
- [ ] `DEV_DATABASE_URL` - Development database (with your changes)
- [ ] `PROD_DATABASE_URL` - Production database (same as DATABASE_URL)
- [ ] `NEXTAUTH_SECRET` - NextAuth authentication secret
- [ ] `JWT_SECRET` - JWT token signing secret

---

## Visual Guide: Adding a Secret

1. **Go to:** `https://github.com/Molemo21/ConnectSA-k9/settings/secrets/actions`

2. **Click:** "New repository secret" button (top right)

3. **Fill in:**
   - **Name:** `DATABASE_URL` (or other secret name)
   - **Secret:** `your-secret-value-here`

4. **Click:** "Add secret"

5. **Verify:** The secret appears in the list (value is hidden for security)

---

## Getting Values from Vercel

### Method 1: Vercel Dashboard

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select your project**

3. **Go to Settings → Environment Variables**

4. **For each variable:**
   - Find the variable name
   - Click on it to reveal the value (if hidden)
   - Copy the value
   - Paste into GitHub Secrets

### Method 2: Vercel CLI (Alternative)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.production

# View the .env.production file
cat .env.production
```

---

## Security Best Practices

✅ **DO:**
- Use different secrets for dev and prod (if possible)
- Rotate secrets periodically
- Use strong, random values
- Never commit secrets to git
- Use GitHub Secrets (not hardcoded values)

❌ **DON'T:**
- Share secrets in chat/email
- Commit secrets to repository
- Use weak/predictable values
- Reuse the same secret across multiple projects

---

## Verifying Secrets Are Set

After adding all secrets, verify they're configured:

1. **Go to:** `https://github.com/Molemo21/ConnectSA-k9/settings/secrets/actions`

2. **Check the list:**
   - You should see all 6 secrets listed
   - Values are hidden (showing as `••••••••`)
   - You can see when each was last updated

3. **Test the workflow:**
   - Push a commit to `main` branch
   - Go to Actions tab
   - Check if the workflow runs without "secret not found" errors

---

## Troubleshooting

### Issue: "Secret not found" error in workflow

**Solution:**
1. Double-check the secret name (case-sensitive!)
2. Make sure you added it to the correct repository
3. Ensure you're looking at "Actions" secrets (not "Dependabot" secrets)

### Issue: "Database connection failed"

**Possible causes:**
1. Wrong database URL format
2. Database credentials expired
3. Network/firewall blocking connection
4. Wrong environment (dev vs prod)

**Solution:**
1. Verify the database URL format
2. Test connection locally first
3. Check database provider dashboard for connection status

### Issue: "DEV_DATABASE_URL not configured"

**Solution:**
- This is expected if you haven't set it yet
- The workflow will skip reference data promotion
- Add `DEV_DATABASE_URL` and `PROD_DATABASE_URL` to enable it

---

## Quick Reference: Secret Names

Copy-paste these exact names when adding secrets:

```
DATABASE_URL
DIRECT_URL
DEV_DATABASE_URL
PROD_DATABASE_URL
NEXTAUTH_SECRET
JWT_SECRET
```

---

## Next Steps

After setting up all secrets:

1. ✅ Verify all 6 secrets are added
2. ✅ Push a commit to trigger the workflow
3. ✅ Monitor the GitHub Actions workflow
4. ✅ Check that deployment succeeds

---

## Need Help?

If you encounter issues:

1. **Check workflow logs:**
   - Go to Actions tab
   - Click on the failed workflow
   - Review error messages

2. **Verify secret values:**
   - Make sure you copied the entire value
   - Check for extra spaces/newlines
   - Verify you're using the correct environment (prod vs dev)

3. **Test locally first:**
   - Try running the sync script locally with `--dry-run`
   - This helps identify issues before CI/CD

---

**Once all secrets are configured, your CI/CD pipeline will automatically deploy changes to production!** 🚀
