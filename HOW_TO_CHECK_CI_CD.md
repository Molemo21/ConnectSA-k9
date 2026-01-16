# 🔍 How to Check CI/CD Pipeline Status

## Quick Methods

### Method 1: GitHub Actions (Recommended)

**If you're using GitHub:**

1. **Go to your repository on GitHub:**
   ```
   https://github.com/Molemo21/ConnectSA-k9
   ```

2. **Click on "Actions" tab** (top navigation)

3. **View recent workflow runs:**
   - You'll see a list of workflow runs
   - Look for runs triggered by your recent push to `main`
   - Click on the latest run to see details

4. **Check workflow status:**
   - ✅ Green checkmark = Success
   - ❌ Red X = Failed
   - 🟡 Yellow circle = In progress
   - ⚪ Gray circle = Queued

5. **View detailed logs:**
   - Click on a specific job (e.g., "unit-tests", "e2e-tests")
   - Expand individual steps to see logs
   - Look for deployment steps

### Method 2: Command Line (GitHub CLI)

```bash
# Install GitHub CLI (if not installed)
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: See https://cli.github.com/

# Authenticate
gh auth login

# Check workflow runs
gh run list

# View latest run details
gh run view

# Watch a running workflow
gh run watch

# View logs for a specific run
gh run view [RUN_ID] --log
```

### Method 3: Check Deployment Platform

**If using Vercel:**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click "Deployments" tab
4. View latest deployment status

**If using other platforms:**
- Check your platform's dashboard
- Look for deployment logs
- Check deployment history

---

## What to Look For

### ✅ Successful Deployment Signs

1. **GitHub Actions:**
   - All jobs show ✅ (green checkmark)
   - No failed steps
   - Deployment job completed

2. **Deployment Logs Should Show:**
   ```
   ✅ PRE-DEPLOYMENT VERIFICATION PASSED
   ✅ Backup step completed successfully
   ✅ DATABASE DEPLOYMENT COMPLETED
   ✅ Migrations deployed successfully
   ```

3. **Application Status:**
   - Application is accessible
   - Database migrations applied
   - New features working

### ❌ Failed Deployment Signs

1. **GitHub Actions:**
   - Any job shows ❌ (red X)
   - Error messages in logs
   - Deployment step failed

2. **Common Failure Points:**
   - Pre-deployment verification failed
   - Backup creation failed
   - Migration deployment failed
   - Build errors

---

## Step-by-Step: Checking Your Deployment

### Step 1: Check GitHub Actions

```bash
# Open in browser
https://github.com/Molemo21/ConnectSA-k9/actions
```

**What to check:**
- Latest workflow run (should be from your merge)
- Status: ✅ Success or ❌ Failed
- Duration: How long it took

### Step 2: Check Deployment Logs

**In GitHub Actions, look for:**

1. **Pre-deployment verification:**
   ```
   [STEP] Safety Guards...
   ✅ Safety Guards passed
   [STEP] Environment...
   ✅ Environment passed
   [STEP] Migrations...
   ✅ Migrations passed
   ```

2. **Backup creation:**
   ```
   📦 Creating production database backup...
   ✅ Backup created: ./database-backups/backup-pre-deployment-{timestamp}.sql
   ```

3. **Migration deployment:**
   ```
   🚀 Deploying database migrations...
   ✅ Migrations deployed successfully
   ```

### Step 3: Verify Production Database

**After deployment, verify:**

```bash
# Check if migration was applied (in production)
# This requires production database access
```

**Or check via application:**
- Verify new tables exist
- Test new features
- Check application logs

---

## Troubleshooting

### If CI/CD Didn't Run

**Check:**
1. Did you push to `main` branch?
2. Is GitHub Actions enabled?
3. Check repository settings → Actions

### If Deployment Failed

**Check logs for:**
1. **Verification failures:**
   - Missing environment variables
   - Database connection issues
   - Migration status problems

2. **Backup failures:**
   - `pg_dump` not available
   - Database connection issues
   - Permission problems

3. **Migration failures:**
   - SQL syntax errors
   - Foreign key constraint violations
   - Missing dependencies

### Common Issues

**Issue: "CI/CD not running"**
- Solution: Check if GitHub Actions is enabled in repository settings

**Issue: "Deployment failed at verification"**
- Solution: Check environment variables in CI/CD secrets

**Issue: "Migration failed"**
- Solution: Review migration SQL for errors
- Check database connection
- Verify backup was created

---

## Quick Status Check Commands

```bash
# Check latest commit
git log --oneline -1

# Check if pushed to remote
git log origin/main --oneline -1

# Check GitHub Actions status (if using gh CLI)
gh run list --limit 5

# Check deployment status
gh run view --web
```

---

## Expected Workflow

When you push to `main`, you should see:

1. **Workflow triggered** (within seconds)
2. **Tests run** (unit, e2e, etc.)
3. **Deployment starts** (if tests pass)
4. **Pre-deployment verification** (read-only checks)
5. **Backup created** (database backup)
6. **Migrations deployed** (database changes applied)
7. **Application deployed** (code changes live)

---

## Monitoring Deployment

### Real-time Monitoring

```bash
# Watch GitHub Actions (if using gh CLI)
gh run watch

# Or check in browser
# https://github.com/Molemo21/ConnectSA-k9/actions
```

### Post-Deployment Verification

```bash
# Check application health
curl https://app.proliinkconnect.co.za/api/health

# Verify database (if you have access)
# Check that new tables exist:
# - payouts
# - webhook_events
```

---

## Summary

**To check CI/CD pipeline:**

1. **GitHub:** Go to repository → Actions tab
2. **Look for:** Latest workflow run from your merge
3. **Check status:** ✅ Success or ❌ Failed
4. **Review logs:** Click on the run to see detailed logs
5. **Verify deployment:** Check application and database

**Your merge commit:** `70c1b51` should trigger the pipeline automatically.
