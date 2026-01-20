# Debug: Production Services Not Being Fixed

## Problem
The `ensure-production-services` step runs in CI/CD, but verification still shows:
- ❌ "House Cleaning" instead of "Standard House Cleaning"
- ❌ "Cleaning Services" service exists (should be removed)
- ❌ "Mobile Car Wash" missing
- ❌ "Office Cleaning" missing

## Root Cause Analysis

### Possible Issues:
1. **Script not running** - Step might be skipped or failing silently
2. **Wrong database URL** - Script might be connecting to dev instead of prod
3. **Dry-run mode** - Script might be running in dry-run (but we're not passing `--dry-run`)
4. **Script logic bug** - Script might not be finding/fixing services correctly
5. **Timing issue** - Verification might run before changes are committed

## Fixes Applied

### 1. Added Prisma Client Generation
```yaml
- name: Generate Prisma Client
  run: npx prisma generate
  env:
    DATABASE_URL: ${{ secrets.PROD_DATABASE_URL || secrets.DATABASE_URL }}
```

### 2. Added Debug Logging
The script now logs:
- Environment variables (NODE_ENV, CI, FORCE_RUN)
- Database URL being used (first 30 chars)
- Dry-run mode status

### 3. Made Step Always Run
- Removed conditional check
- Set `continue-on-error: false` (pipeline fails if step fails)

### 4. Explicit Database URL
- Set both `PROD_DATABASE_URL` and `DATABASE_URL` in workflow
- Script uses `PROD_DATABASE_URL || DATABASE_URL`

## Next Steps

### Step 1: Check GitHub Actions Logs
1. Go to: https://github.com/Molemo21/ConnectSA-k9/actions
2. Find the latest `deploy-production` workflow run
3. Check the "Ensure production services exist" step output
4. Look for:
   - Environment info (should show PROD_DATABASE_URL is set)
   - Database URL being used
   - Services being created/renamed/deleted
   - Any errors

### Step 2: Verify Script Logic
The script should:
1. ✅ Find "House Cleaning" service
2. ✅ Rename it to "Standard House Cleaning"
3. ✅ Find "Cleaning Services" service
4. ✅ Delete/deactivate it
5. ✅ Create "Mobile Car Wash"
6. ✅ Create "Office Cleaning"

### Step 3: Manual Verification
If CI/CD still fails, run locally:
```bash
# Set production database URL
export PROD_DATABASE_URL=your-production-database-url

# Run the script
npm run ensure:production:services

# Verify changes
npm run verify:service:names
```

## Expected Output

When the script runs successfully, you should see:
```
🔧 Ensuring Production Services Exist
======================================================================
🔍 Environment Info:
   NODE_ENV: production
   CI: true
   FORCE_RUN: true
   PROD_DATABASE_URL: ✅ set
   DATABASE_URL: ✅ set
   Using database URL: postgresql://...
   Dry run mode: NO

📋 Step 1: Ensuring Cleaning Services Category Exists
  ✅ Found: Cleaning Services category (ID: ...)

📋 Step 3: Fixing Service Name Mismatches
  ✅ Renamed "House Cleaning" → "Standard House Cleaning"

📋 Step 4: Removing Invalid Services
  ✅ Deleted invalid service: "Cleaning Services"

📋 Step 5: Ensuring All Services from config/services.ts Exist
  ✅ Created: "Mobile Car Wash" (R100)
  ✅ Created: "Office Cleaning" (R150)
  ✅ Exists: "Standard House Cleaning" (already in sync)
  ...

✨ All services are now in sync with config/services.ts!
```

## If Still Failing

1. **Check GitHub Secrets**: Ensure `PROD_DATABASE_URL` is set correctly
2. **Check Database Connection**: Script should connect to production database
3. **Check Script Output**: Look for any errors or warnings in CI/CD logs
4. **Run Manually**: Test the script locally with production database URL

## Critical Check

**The "Ensure production services exist" step MUST run BEFORE "Verify service names match config"**

Current workflow order:
1. `promote-reference-data` job (includes "Ensure production services exist")
2. `verify-deployment` job (includes "Verify service names match config")

The `verify-deployment` job has `needs: [deploy-database, promote-reference-data]`, so it should wait for `promote-reference-data` to complete first.

If the step is running but not fixing services, check:
- Database URL is correct (production, not dev)
- Script has write permissions
- No database connection issues
- Services aren't locked by other transactions
