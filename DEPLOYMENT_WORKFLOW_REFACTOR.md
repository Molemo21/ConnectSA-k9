# 🔒 Deployment Workflow Refactor - Production Safety Guarantee

## Overview

This refactor ensures **absolute production safety** by enforcing strict separation between verification (read-only) and deployment (mutation allowed).

## Core Principles

1. **Pre-deployment checks are STRICTLY NON-DESTRUCTIVE** (read-only)
2. **Verification is fully separated from deployment**
3. **`prisma migrate deploy` is the ONLY operation allowed to mutate production**

## Architecture

### Pre-Deployment Verification (`npm run predeploy`)

**Script:** `scripts/predeploy-verify.js`

**Purpose:** Read-only verification before deployment

**Guards:**
- ✅ Requires `NODE_ENV=production`
- ✅ Requires `CI=true` (blocks local runs)
- ✅ Blocks all mutation commands (`db push`, `db pull`, `migrate dev`, etc.)
- ✅ Only performs read-only checks

**Operations:**
- ✅ `prisma migrate status` (read-only)
- ✅ Environment variable validation (read-only)
- ✅ Database connection test (read-only query)
- ✅ Schema structure verification (read-only queries)

**Exit Codes:**
- `0` = All checks passed, safe to deploy
- `1` = Checks failed, deployment blocked

### Database Deployment (`npm run deploy:db`)

**Script:** `scripts/deploy-db.js`

**Purpose:** The ONLY script allowed to mutate production database

**Guards:**
- ✅ Requires `NODE_ENV=production`
- ✅ Requires `CI=true` (blocks local runs - PERMANENT)
- ✅ Creates backup before mutations
- ✅ Only runs `prisma migrate deploy`

**Operations:**
- ✅ Creates database backup
- ✅ Generates Prisma client
- ✅ **ONLY MUTATION:** `prisma migrate deploy`
- ✅ Post-deployment verification (read-only)

**Exit Codes:**
- `0` = Migrations deployed successfully
- `1` = Deployment failed or guards blocked execution

## Workflow

### Standard Deployment Flow

```bash
# Step 1: Pre-deployment verification (READ-ONLY)
npm run predeploy

# Step 2: Database deployment (MUTATION ALLOWED)
npm run deploy:db

# OR combined:
npm run deploy  # Runs predeploy then deploy:db
```

### CI/CD Pipeline Integration

```yaml
# Example GitHub Actions workflow
- name: Pre-deployment verification
  run: npm run predeploy
  env:
    NODE_ENV: production
    CI: true
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Deploy database migrations
  run: npm run deploy:db
  env:
    NODE_ENV: production
    CI: true
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Removed Destructive Operations

### From Pre-Deployment

The following operations have been **REMOVED** from pre-deployment:

- ❌ `prisma db push` (was in some scripts)
- ❌ `prisma db pull` (was in some scripts)
- ❌ `npm run db:sync` (removed from `deploy-production.sh`)
- ❌ Any schema synchronization that modifies the database

### Replaced With

- ✅ `prisma migrate status` (read-only)
- ✅ Read-only schema verification queries
- ✅ Read-only connection tests

## Safety Guarantees

### Guarantee 1: Pre-deployment Cannot Mutate

Even if `DATABASE_URL` points to production, `npm run predeploy`:
- ✅ Cannot run `prisma db push`
- ✅ Cannot run `prisma db pull`
- ✅ Cannot run `prisma migrate dev`
- ✅ Cannot execute any SQL writes
- ✅ Only performs read-only operations

**Proof:** Run `npm run test:deployment-safety`

### Guarantee 2: Only deploy:db Can Mutate

Only `npm run deploy:db` can:
- ✅ Run `prisma migrate deploy`
- ✅ Modify production database schema

**Guards:**
- ✅ Requires `CI=true` (blocks local runs)
- ✅ Requires `NODE_ENV=production`
- ✅ Creates backup before mutations

### Guarantee 3: Local Runs Are Blocked

Both scripts **permanently block** local execution:
- ✅ `predeploy` requires `CI=true`
- ✅ `deploy:db` requires `CI=true`
- ✅ No bypass flags available
- ✅ Default to failure, not permissiveness

## Files Created/Modified

### Created Files

1. **`scripts/predeploy-verify.js`**
   - Read-only pre-deployment verification
   - Environment guards
   - Mutation blocker
   - Clear PASS/FAIL verdict

2. **`scripts/deploy-db.js`**
   - The ONLY script that mutates production
   - CI-only execution guard
   - Backup creation
   - Migration deployment

3. **`scripts/test-deployment-safety.js`**
   - Proves safety guarantees
   - Tests all guards
   - Verifies workflow integrity

4. **`DEPLOYMENT_WORKFLOW_REFACTOR.md`** (this file)
   - Complete documentation
   - Workflow explanation
   - Safety guarantees

### Modified Files

1. **`package.json`**
   - Added `predeploy` script
   - Added `deploy:db` script
   - Added `deploy` script (combines both)
   - Added `test:deployment-safety` script

2. **`scripts/deploy-production.sh`**
   - Removed `npm run db:sync` from database operations
   - Replaced with `npm run predeploy` (read-only)
   - Uses `npm run deploy:db` for mutations

## Testing the Guarantees

Run the safety test suite:

```bash
npm run test:deployment-safety
```

This verifies:
- ✅ Pre-deploy blocks without `CI=true`
- ✅ Pre-deploy blocks without `NODE_ENV=production`
- ✅ Deploy-db blocks without `CI=true`
- ✅ Deploy-db blocks without `NODE_ENV=production`
- ✅ Predeploy script contains no mutation commands
- ✅ Only deploy-db calls `prisma migrate deploy`
- ✅ Package.json workflow is correct

## Migration Guide

### Before (Old Workflow)

```bash
# Old way (had destructive operations)
npm run db:sync  # Could modify database
npx prisma migrate deploy
```

### After (New Workflow)

```bash
# New way (strictly separated)
npm run predeploy  # Read-only verification
npm run deploy:db  # Only mutation allowed
```

## Error Handling

### Pre-deployment Fails

If `npm run predeploy` fails:
- ❌ Deployment is **BLOCKED**
- ✅ No mutations have occurred
- ✅ Database remains unchanged
- ✅ Fix issues and retry

### Deployment Fails

If `npm run deploy:db` fails:
- ⚠️  Database may be in inconsistent state
- ✅ Backup was created before mutations
- ✅ Rollback using backup is possible
- ✅ Review error and restore from backup if needed

## Best Practices

1. **Always run predeploy first**
   ```bash
   npm run predeploy && npm run deploy:db
   ```

2. **Use CI/CD for deployments**
   - Never run `deploy:db` locally
   - Always use CI/CD pipelines
   - Guards enforce this automatically

3. **Review migrations before deployment**
   - Check `prisma/migrations/` directory
   - Review SQL in migration files
   - Test in development first

4. **Monitor after deployment**
   - Check application health
   - Verify database state
   - Review logs for errors

## Troubleshooting

### "BLOCKED: Pre-deployment verification requires CI=true"

**Cause:** Running predeploy locally

**Solution:** This is intentional. Pre-deployment only runs in CI/CD. For local testing, use development database.

### "BLOCKED: Database deployment requires CI=true"

**Cause:** Attempting to run `deploy:db` locally

**Solution:** This is intentional. Database migrations can ONLY be deployed from CI/CD pipelines. Push your code and let CI/CD handle it.

### "Migration status unclear"

**Cause:** `prisma migrate status` returned unexpected output

**Solution:** 
1. Check migration files in `prisma/migrations/`
2. Verify database connection
3. Review Prisma schema for inconsistencies

## Summary

✅ **Pre-deployment is read-only** - Cannot mutate production  
✅ **Deployment is CI-only** - Cannot run locally  
✅ **Single mutation point** - Only `deploy:db` can modify schema  
✅ **Guards are permanent** - No bypass flags  
✅ **Default to failure** - Safety first  

The deployment workflow is now **bulletproof** against accidental production mutations.
