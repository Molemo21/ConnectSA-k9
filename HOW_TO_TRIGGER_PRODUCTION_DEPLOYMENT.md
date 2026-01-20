# 🚀 How to Trigger Production Deployment

## Issue: Production Deployment Not Showing

The production deployment workflow has `paths-ignore` that excludes `.github/**` files. Since we just modified the workflow file itself, it won't trigger automatically.

## Solution: Manual Trigger

### Option 1: Trigger via GitHub UI (Recommended)

1. **Go to GitHub Actions:**
   - Visit: https://github.com/Molemo21/ConnectSA-k9/actions
   
2. **Find "Production Deployment" workflow:**
   - Look in the left sidebar for "Production Deployment"
   - Or search for it in the workflow list

3. **Click "Run workflow":**
   - Click on "Production Deployment"
   - Click the "Run workflow" dropdown button (top right)
   - Select branch: `main`
   - Click "Run workflow" button

4. **Monitor the run:**
   - The workflow will start immediately
   - Watch each job complete

### Option 2: Trigger via Push (Make Small Change)

Make a small change to trigger the workflow:

```bash
# Make a small change to trigger workflow
echo "# Trigger production deployment" >> README.md
git add README.md
git commit -m "chore: trigger production deployment"
git push origin main
```

**Note:** The workflow will trigger because `README.md` is in `paths-ignore`, but the workflow file change will be included.

### Option 3: Remove .github from paths-ignore (Not Recommended)

This would cause the workflow to run on every workflow file change, which is usually not desired.

---

## Why This Happened

The workflow has this configuration:

```yaml
on:
  push:
    branches: [ main ]
    paths-ignore:
      - '**.md'
      - '.gitignore'
      - 'README.md'
      - 'docs/**'
      - '.github/**'  # ← This excludes workflow file changes
```

This is intentional to prevent the workflow from running when you only change workflow files or documentation.

---

## Quick Fix: Manual Trigger Now

**Right now, do this:**

1. Go to: https://github.com/Molemo21/ConnectSA-k9/actions/workflows/deploy-production.yml
2. Click "Run workflow" button
3. Select branch: `main`
4. Click "Run workflow"

This will immediately start the production deployment with the fixed workflow!

---

## Expected Workflow Jobs

After triggering, you should see:

1. ✅ Pre-deployment Verification
2. ✅ Create Production Backup
3. ✅ Deploy Database Migrations
4. ✅ Promote Reference Data
5. ✅ Ensure Production Services (NEW - will create missing services)
6. ✅ Verify Deployment (FIXED - now generates Prisma client)
7. ✅ Send Notification

---

## After Workflow Completes

1. **Check Services in Production:**
   - Run: `npm run ensure:production:services` (with PROD_DATABASE_URL)
   - Or check production UI

2. **Verify in Production UI:**
   - Visit: https://your-production-url.com/book-service
   - Select "Cleaning Services"
   - Click "Specialized Cleaning"
   - Should see: Carpet Cleaning, Mobile Car Wash, Office Cleaning

---

**Action Required:** Manually trigger the workflow now to deploy the fixes!
