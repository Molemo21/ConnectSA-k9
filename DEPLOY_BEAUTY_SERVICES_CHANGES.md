# 🚀 Deploying Beauty Services & Mobile Car Wash Changes to Production

## Overview

This guide walks you through deploying the following changes to production via CI/CD:

1. ✅ Mobile Car Wash service added to Specialized Cleaning
2. ✅ Beauty service subcategories organized
3. ✅ Redundant "Beauty Services" category removed
4. ✅ All services synced with `config/services.ts`

## Prerequisites

### 1. Verify GitHub Secrets

Ensure these secrets are configured in GitHub:
- Go to: **Settings → Secrets and variables → Actions**

Required secrets:
- ✅ `DATABASE_URL` (Production database)
- ✅ `DIRECT_URL` (Production direct connection)
- ✅ `DEV_DATABASE_URL` (Development database - **must point to your local/dev DB with changes**)
- ✅ `PROD_DATABASE_URL` (Production database - **same as DATABASE_URL or separate**)
- ✅ `NEXTAUTH_SECRET`
- ✅ `JWT_SECRET`

### 2. Verify Local/Dev Database Has Changes

Before deploying, ensure your development database has all the changes:

```bash
# Run this to verify your dev database has all services
cd ConnectSA-k9
npx tsx scripts/verify-beauty-subcategories.ts
```

Expected output:
- ✅ All 11 beauty services in database
- ✅ Mobile Car Wash service exists
- ✅ Only "Beauty & Personal Care" category (no "Beauty Services")
- ✅ All services properly categorized

## Deployment Process

### Step 1: Preview Changes (Dry Run)

First, let's see what will be synced to production:

```bash
# Set your database URLs (use your actual values)
export DEV_DATABASE_URL="your-dev-database-url"
export PROD_DATABASE_URL="your-prod-database-url"

# Run dry-run to preview changes
npm run sync:reference:dry-run
```

This will show you:
- What categories will be created/updated
- What services will be created/updated
- What will be skipped (services with active bookings/providers)

### Step 2: Commit Your Changes

Make sure all changes are committed:

```bash
# Check what files have changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: add Mobile Car Wash, organize beauty subcategories, remove redundant category

- Add Mobile Car Wash to Specialized Cleaning subcategory
- Organize beauty services into 4 subcategories (Hair, Makeup, Nails, Skincare)
- Remove redundant 'Beauty Services' category
- Sync all services with config/services.ts
- Migrate provider relationships safely"

# Push to main branch (triggers CI/CD)
git push origin main
```

### Step 3: Monitor CI/CD Pipeline

1. **Go to GitHub Actions:**
   ```
   https://github.com/Molemo21/ConnectSA-k9/actions
   ```

2. **Watch the workflow:**
   - Click on the latest workflow run
   - Monitor each job:
     - ✅ Pre-deployment Verification
     - ✅ Create Production Backup
     - ✅ Deploy Database Migrations
     - ✅ **Promote Reference Data** (This syncs your changes!)
     - ✅ Verify Deployment

3. **Check the "Promote Reference Data" job:**
   - It will first run a dry-run
   - Then apply the changes
   - Look for logs showing:
     ```
     ✅ Created category: Beauty & Personal Care
     ✅ Created service: Mobile Car Wash
     🔄 Updated service: [service name]
     ```

### Step 4: Verify Production

After deployment completes, verify the changes:

```bash
# Option 1: Check via API (if you have production URL)
curl https://your-production-url.com/api/service-categories

# Option 2: Run verification script against production
# (Update DATABASE_URL to production first)
export DATABASE_URL="your-production-database-url"
npx tsx scripts/verify-beauty-subcategories.ts
```

Expected results:
- ✅ Mobile Car Wash appears in Specialized Cleaning
- ✅ Beauty services organized in 4 subcategories
- ✅ Only "Beauty & Personal Care" category exists
- ✅ All 11 beauty services present

## What the CI/CD Pipeline Does

The `deploy-production.yml` workflow automatically:

1. **Pre-deployment Verification**
   - Validates environment variables
   - Runs safety checks
   - Verifies database connectivity

2. **Create Backup**
   - Creates full database backup
   - Stores backup as artifact (30 days retention)

3. **Deploy Database Migrations**
   - Runs Prisma migrations
   - Updates database schema if needed

4. **Promote Reference Data** ⭐ (This is what syncs your changes!)
   - Reads from DEV_DATABASE_URL (your dev database with changes)
   - Writes to PROD_DATABASE_URL (production database)
   - Only modifies `service_categories` and `services` tables
   - Skips services with active bookings/providers (safety)
   - Idempotent (safe to run multiple times)

5. **Verify Deployment**
   - Tests database connection
   - Verifies deployment success

## Troubleshooting

### Issue: "Reference data promotion skipped"

**Cause:** `DEV_DATABASE_URL` or `PROD_DATABASE_URL` not configured in GitHub secrets.

**Solution:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add `DEV_DATABASE_URL` (your dev database)
3. Add `PROD_DATABASE_URL` (your production database)
4. Re-run the workflow

### Issue: "Service has bookings/providers - skipped"

**Cause:** The sync script safely skips services that have active relationships.

**Solution:**
- This is expected behavior for safety
- Services with bookings/providers won't be modified
- New services will still be created
- You can manually review and update if needed

### Issue: "CI=true required"

**Cause:** The sync script only runs in CI/CD for safety.

**Solution:**
- This is correct behavior
- The script is designed to only run in CI/CD
- Don't try to run `sync:reference:apply` locally
- Use `sync:reference:dry-run` locally to preview

## Manual Deployment (If CI/CD Not Available)

If you need to deploy manually (not recommended, but possible):

```bash
# ⚠️ WARNING: Only do this if absolutely necessary
# Make sure you have backups first!

export CI=true
export DEV_DATABASE_URL="your-dev-database-url"
export PROD_DATABASE_URL="your-prod-database-url"

# Run the sync
npm run sync:reference:apply
```

## Summary

✅ **Your changes are ready to deploy!**

The CI/CD pipeline is already configured. Just:
1. ✅ Verify GitHub secrets are set
2. ✅ Commit and push your changes
3. ✅ Monitor the GitHub Actions workflow
4. ✅ Verify production after deployment

The workflow will automatically:
- Create backups
- Deploy migrations
- **Sync your service changes from dev to prod**
- Verify everything worked

---

**Questions?** Check the workflow logs in GitHub Actions for detailed information about each step.
