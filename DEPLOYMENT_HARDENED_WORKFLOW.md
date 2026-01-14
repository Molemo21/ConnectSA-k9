# 🔒 Hardened Deployment Workflow

## Overview

The deployment workflow has been refactored to eliminate structural risks through:
- **Decoupled backups** - Separate, explicit backup step
- **Modular verification** - Thin orchestrator with single-purpose checks
- **Hardened failure boundaries** - Any failure prevents deployment
- **Explicit step boundaries** - Observable in CI logs

## Architecture

### Verification Phase (Read-Only)

**Orchestrator:** `scripts/predeploy-verify.js`
- Thin orchestrator that runs checks in sequence
- Does NOT perform checks itself
- Fails fast if any check fails

**Individual Checks:**
1. `scripts/verify-safety-guards.js` - Environment guards (CI, NODE_ENV)
2. `scripts/verify-env.js` - Environment variable validation
3. `scripts/verify-migrations.js` - Migration status check
4. `scripts/verify-connection.js` - Database connection test
5. `scripts/verify-schema.js` - Schema structure verification

**Properties:**
- Each check is independent and single-purpose
- Each check fails fast (exits immediately on error)
- All checks are read-only (no mutations)
- Orchestrator stops on first failure

### Backup Phase (Read-Only)

**Script:** `scripts/backup-production.js`

**Properties:**
- Separate, explicit step
- Fail-fast (aborts pipeline on error)
- Requires `NODE_ENV=production` and `CI=true`
- Creates backup before any mutations
- Verifies backup file exists and has content

**Exit Codes:**
- `0` = Backup created successfully
- `1` = Backup failed (pipeline aborts)

### Deployment Phase (Mutation Allowed)

**Script:** `scripts/deploy-db.js`

**Properties:**
- Performs EXACTLY ONE action: `prisma migrate deploy`
- No backup logic (backups are separate)
- No verification logic (verification is separate)
- Requires `NODE_ENV=production` and `CI=true`
- Generates Prisma client before migration

**Exit Codes:**
- `0` = Migrations deployed successfully
- `1` = Deployment failed

## Workflow

### Standard Deployment Flow

```bash
# Step 1: Pre-deployment verification (READ-ONLY)
npm run predeploy

# Step 2: Create backup (READ-ONLY, FAIL-FAST)
npm run backup:production

# Step 3: Deploy migrations (MUTATION ALLOWED)
npm run deploy:db

# OR combined:
npm run deploy  # Runs all three in sequence
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

- name: Create production backup
  run: npm run backup:production
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

## Failure Boundaries

### Hard Failure Rules

1. **Verification Failure** → Deployment BLOCKED
   - Any check failure in `predeploy` blocks all subsequent steps
   - No mutations have occurred
   - Database remains unchanged

2. **Backup Failure** → Deployment BLOCKED
   - Backup failure aborts pipeline immediately
   - No mutations have occurred
   - Must fix backup issue before retry

3. **Deployment Failure** → Database may be inconsistent
   - Backup was created before mutations
   - Rollback using backup is possible
   - Review error and restore if needed

### Step Boundaries

Each step is explicitly marked in CI logs:

```
[STEP 1/3] Pre-deployment verification (read-only)...
[STEP 2/3] Creating production database backup...
[STEP 3/3] Deploying database migrations...
```

## Files Created

### Verification Scripts (Single-Purpose)

1. `scripts/verify-safety-guards.js` - Environment guards
2. `scripts/verify-env.js` - Environment validation
3. `scripts/verify-migrations.js` - Migration status
4. `scripts/verify-connection.js` - Connection test
5. `scripts/verify-schema.js` - Schema verification

### Orchestration & Deployment

6. `scripts/predeploy-verify.js` - Thin orchestrator (refactored)
7. `scripts/backup-production.js` - Separate backup step (new)
8. `scripts/deploy-db.js` - Deployment only (refactored, backup removed)

## Files Modified

1. `package.json`
   - Added: `backup:production` script
   - Updated: `deploy` script to include backup step

2. `scripts/deploy-production.sh`
   - Updated: Explicit step markers
   - Updated: Includes backup step

3. `scripts/test-deployment-safety.js`
   - Updated: Tests for new structure
   - Added: Backup separation test

## Safety Guarantees Preserved

✅ **CI-only execution** - All scripts require `CI=true`  
✅ **Default-deny behavior** - Guards fail by default  
✅ **No bypass flags** - Guards are permanent  
✅ **No local production mutation** - Local runs blocked  

## Additional Guarantees

✅ **Backups are decoupled** - Separate step, fail-fast  
✅ **Verification is modular** - Single-purpose checks  
✅ **Failure boundaries are hard** - Any failure blocks deployment  
✅ **Steps are observable** - Explicit markers in CI logs  

## Testing

Run the safety test suite:

```bash
npm run test:deployment-safety
```

This verifies:
- ✅ All guards work correctly
- ✅ Backup is separate from deployment
- ✅ Deploy-db performs only migrate deploy
- ✅ Verification is modular
- ✅ Workflow is correct

## Summary

The deployment workflow is now:
- ✅ **Decoupled** - Backups separate from deployment
- ✅ **Modular** - Verification checks are independent
- ✅ **Hardened** - Failure boundaries prevent unsafe states
- ✅ **Observable** - Step boundaries explicit in logs
- ✅ **Safe** - All existing guarantees preserved
