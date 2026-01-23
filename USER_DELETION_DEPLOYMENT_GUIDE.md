# User Deletion System - Production Deployment Guide

## 🎯 Overview

This guide follows your existing deployment system patterns and integrates with your CI/CD pipeline.

## 📋 Pre-Deployment Checklist

### 1. Local Testing (Development)

```bash
# Test migration on local/dev database
cd ConnectSA-k9
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Run production safety tests
npm run test:production-safety-hardened
```

### 2. Verify Migration File

```bash
# Check migration exists
ls -la prisma/migrations/20250125000000_add_user_deleted_at/migration.sql

# Verify migration SQL
cat prisma/migrations/20250125000000_add_user_deleted_at/migration.sql
```

Expected output:
```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
```

## 🚀 Production Deployment (CI/CD Pipeline)

Your deployment system uses a 3-step process:

### Step 1: Pre-Deployment Verification

```bash
# This runs automatically in CI/CD
npm run predeploy
```

**What it checks:**
- ✅ Safety guards
- ✅ Environment variables
- ✅ Migration files
- ✅ Database connection
- ✅ Schema validation

### Step 2: Create Backup

```bash
# This runs automatically in CI/CD
npm run backup:production
```

**What it does:**
- Creates full database backup
- Stores backup file path in deployment state
- **Requires:** `NODE_ENV=production` and `CI=true`

### Step 3: Deploy Migrations

```bash
# This runs automatically in CI/CD
npm run deploy:db
```

**What it does:**
- Generates Prisma client
- Validates migration directories
- Applies migrations to production
- **Requires:** Verification passed + Backup completed

## 📝 Manual Deployment (If Needed)

If you need to deploy manually (not recommended for production):

### For Development/Staging:

```bash
# 1. Create backup
npm run db:backup "Before user deletion migration"

# 2. Apply migration
npm run db:migrate:deploy

# 3. Verify
npm run db:validate
```

### For Production (Emergency Only):

**⚠️ WARNING: Only use in emergencies. Normal deployment should go through CI/CD.**

```bash
# Set environment
export NODE_ENV=production
export CI=true

# Run full migration with backup
npm run db:full-migrate "User deletion system deployment"
```

## ✅ Post-Deployment Verification

### 1. Verify Migration Applied

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'deletedAt';

-- Check index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE '%deletedAt%';
```

### 2. Test User Deletion API

```bash
# Test anonymization (provider with bookings)
curl -X DELETE https://your-domain.com/api/admin/users/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin-token}" \
  -d '{"permanent": true, "reason": "Test deletion"}'

# Expected: Should anonymize (not delete) if user has bookings/payouts
```

### 3. Verify Service Works

```bash
# Check logs for:
# - "Enforcing anonymization" (if transactional data exists)
# - "Performing hard delete" (if no transactional data)
# - Transaction serialization errors (should be none)
```

## 🔍 Monitoring Checklist

Monitor these metrics for 24-48 hours post-deployment:

- [ ] **Transaction serialization errors** (P2034) - Should be zero
- [ ] **Migration table errors** - Should be zero
- [ ] **Anonymization vs deletion ratio** - Track in logs
- [ ] **Average transaction time** - Should be < 1 second
- [ ] **Idempotent operation hits** - Already-anonymized users
- [ ] **Email delivery failures** - Non-critical but monitor

## 🚨 Rollback Plan

### If Migration Fails:

The migration is **safe to rollback** because:
- Column is nullable (no data loss)
- No existing data depends on it
- Can be re-added later

**Rollback SQL:**
```sql
-- Only if absolutely necessary
ALTER TABLE "users" DROP COLUMN "deletedAt";
DROP INDEX IF EXISTS "users_deletedAt_idx";
```

### If Code Has Issues:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or redeploy previous version via your deployment platform
```

## 📊 Success Criteria

Deployment is successful when:

1. ✅ Migration applied without errors
2. ✅ `deletedAt` column exists in `users` table
3. ✅ Index created on `deletedAt`
4. ✅ User deletion API responds correctly
5. ✅ Anonymization works for users with transactional data
6. ✅ Hard delete works for users with zero data
7. ✅ No transaction serialization errors
8. ✅ Audit logs are created
9. ✅ Email notifications sent (non-blocking)

## 🔗 Integration with Existing System

This deployment integrates with your existing:

- ✅ `predeploy-verify.js` - Pre-deployment checks
- ✅ `backup-production.js` - Database backup
- ✅ `deploy-db.js` - Migration deployment
- ✅ `deployment-state.js` - Order enforcement
- ✅ CI/CD pipeline guards

## 📚 Related Files

- `lib/services/user-deletion-service.ts` - Core service
- `app/api/admin/users/[id]/route.ts` - API endpoint
- `prisma/schema.prisma` - Schema definition
- `prisma/migrations/20250125000000_add_user_deleted_at/` - Migration

## 🆘 Troubleshooting

### Migration Fails with P3015

**Error:** "Could not find migration file"

**Solution:**
```bash
# Check for empty migration directories
ls -la prisma/migrations/

# Remove empty directories
rm -rf prisma/migrations/{empty-directory-name}
```

### Transaction Serialization Errors

**Error:** P2034 "Transaction conflict"

**Solution:**
- This is expected under high concurrency
- System automatically retries
- Monitor frequency - if excessive, may need to adjust isolation level

### Migration Table Missing

**Error:** "_prisma_migrations table does not exist"

**Solution:**
```bash
# Run initial migration
npx prisma migrate deploy
```

## 📞 Support

If deployment fails:
1. Check deployment logs
2. Verify backup exists
3. Review error messages
4. Check database connection
5. Verify environment variables

---

**Last Updated:** 2025-01-25  
**Status:** Production Ready ✅
