# 🚀 Deployment Quick Reference

## Commands

```bash
# Pre-deployment verification (READ-ONLY)
npm run predeploy

# Database deployment (MUTATION ALLOWED - CI ONLY)
npm run deploy:db

# Combined (recommended)
npm run deploy

# Test safety guarantees
npm run test:deployment-safety
```

## Requirements

**Both scripts require:**
- `NODE_ENV=production`
- `CI=true`

**Local runs are PERMANENTLY BLOCKED** - Use CI/CD only.

## What Each Script Does

### `npm run predeploy` (Read-Only)
- ✅ Checks migration status
- ✅ Validates environment
- ✅ Tests database connection
- ✅ Verifies schema structure
- ❌ **CANNOT** modify database

### `npm run deploy:db` (Mutation Allowed)
- ✅ Creates backup
- ✅ Generates Prisma client
- ✅ **ONLY MUTATION:** `prisma migrate deploy`
- ✅ Verifies deployment
- ❌ **BLOCKED** if run locally

## Safety Guarantees

1. ✅ Pre-deployment **cannot** mutate production
2. ✅ Only `deploy:db` **can** mutate production
3. ✅ Local runs are **permanently blocked**

## Files

- `scripts/predeploy-verify.js` - Read-only verification
- `scripts/deploy-db.js` - Only mutation allowed
- `scripts/test-deployment-safety.js` - Safety tests

## Documentation

- `DEPLOYMENT_WORKFLOW_REFACTOR.md` - Complete guide
- `DEPLOYMENT_REFACTOR_SUMMARY.md` - Executive summary
- `DEPLOYMENT_REFACTOR_COMPLETE.md` - Implementation details
