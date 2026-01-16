# 🔄 Development to Production Services Sync Guide

## Overview

This guide explains how to safely sync service categories and services from your **development database** (18 tables) to your **production database** (31 tables) using best practices.

## 🎯 What This Does

The sync script will:
- ✅ **Sync Categories**: Copy/update service categories from dev → prod
- ✅ **Sync Services**: Copy/update services from dev → prod  
- ✅ **Preserve Relationships**: Never delete services with bookings or providers
- ✅ **Safe Updates**: Only updates what's changed, preserves existing IDs
- ✅ **Idempotent**: Safe to run multiple times

## ⚠️ Critical Safety Features

1. **Dry-Run Mode**: Preview changes before applying
2. **Confirmation Required**: Must explicitly confirm before modifying production
3. **Backup Reminder**: Warns you to backup before proceeding
4. **Protected Services**: Never deactivates services with bookings/providers
5. **Detailed Logging**: Shows exactly what will change

## 📋 Prerequisites

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Development Database (18 tables - where you made changes)
DEV_DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Production Database (31 tables - where you want to apply changes)
PROD_DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

**⚠️ CRITICAL**: Double-check these URLs are correct! The script will show masked URLs before running.

### 2. Database Access

- ✅ Both databases must be accessible
- ✅ Prisma Client must be generated (`npm run db:generate`)
- ✅ You have read/write access to both databases

## 🚀 Step-by-Step Process

### Step 1: Backup Production Database

**BEFORE RUNNING THE SYNC**, create a backup of your production database:

```bash
# Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Database → Backups
3. Create a manual backup

# OR using pg_dump (if you have direct access)
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Dry-Run (Preview Changes)

**ALWAYS run dry-run first** to see what will change:

```bash
npm run sync:dev-to-prod:dry-run
```

This will show you:
- How many categories/services will be created
- How many will be updated
- Which services will be deactivated
- **No changes are made** in dry-run mode

### Step 3: Review the Output

Carefully review the dry-run output:
- ✅ Verify the database URLs are correct
- ✅ Check the counts match your expectations
- ✅ Ensure no critical services will be deactivated
- ✅ Review what will be created/updated

### Step 4: Run the Actual Sync

Once you've verified everything looks correct:

```bash
npm run sync:dev-to-prod
```

The script will:
1. Show database connection status
2. Display masked database URLs
3. **Ask for confirmation** (type `yes` to proceed)
4. Create a backup reminder
5. Sync categories first
6. Sync services
7. Show a detailed summary

## 📊 Understanding the Output

### Categories Section
- **Created**: New categories that don't exist in production
- **Updated**: Existing categories that were modified
- **Skipped**: Categories that are already identical

### Services Section
- **Created**: New services that don't exist in production
- **Updated**: Existing services that were modified (name, price, description, category)
- **Skipped**: Services that are already identical
- **Deactivated**: Services in prod that don't exist in dev (only if no bookings/providers)

## 🛡️ Safety Guarantees

### What the Script WILL Do:
- ✅ Create new categories/services
- ✅ Update existing categories/services
- ✅ Deactivate services not in dev (only if safe)

### What the Script WILL NOT Do:
- ❌ Delete any data
- ❌ Deactivate services with bookings
- ❌ Deactivate services with providers
- ❌ Modify service IDs (preserves relationships)
- ❌ Run without explicit confirmation

## 🔍 Troubleshooting

### Error: "DEV_DATABASE_URL or DATABASE_URL environment variable required"

**Solution**: Add `DEV_DATABASE_URL` to your `.env` file

### Error: "PROD_DATABASE_URL environment variable required"

**Solution**: Add `PROD_DATABASE_URL` to your `.env` file

### Error: "Connection failed"

**Solutions**:
1. Verify database URLs are correct
2. Check network connectivity
3. Ensure databases are accessible
4. Verify credentials are correct

### Services Not Syncing

**Possible Causes**:
1. Category doesn't exist in production (check category sync first)
2. Service name mismatch (script matches by name)
3. Database connection issues

**Solution**: Run dry-run to see detailed error messages

## 📝 Example Workflow

```bash
# 1. Set environment variables in .env
echo "DEV_DATABASE_URL=postgresql://..." >> .env
echo "PROD_DATABASE_URL=postgresql://..." >> .env

# 2. Preview changes (safe, no modifications)
npm run sync:dev-to-prod:dry-run

# 3. Review output carefully
# ... review the output ...

# 4. If everything looks good, run the actual sync
npm run sync:dev-to-prod

# 5. Type 'yes' when prompted
# ... script runs ...

# 6. Verify in production UI
# Visit your production site and check services are updated
```

## 🎯 Best Practices

1. **Always Backup First**: Never skip the backup step
2. **Test in Staging**: If you have a staging environment, test there first
3. **Run During Low Traffic**: Sync during maintenance windows if possible
4. **Monitor After Sync**: Check production UI after syncing
5. **Keep Logs**: Save the sync output for reference
6. **Verify Results**: Manually verify a few services in production

## 🔄 Rollback Plan

If something goes wrong:

1. **Stop the sync** (Ctrl+C if still running)
2. **Restore from backup** using Supabase dashboard or pg_restore
3. **Review what changed** using the sync logs
4. **Fix issues** in development database
5. **Re-run sync** after fixing

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Review the troubleshooting section
3. Check database connectivity
4. Verify environment variables are set correctly

## ✅ Verification Checklist

After running the sync, verify:

- [ ] Categories appear correctly in production
- [ ] Services appear correctly in production
- [ ] Service names match development
- [ ] Service prices match development
- [ ] Service descriptions match development
- [ ] Services are properly categorized
- [ ] No services with bookings were affected
- [ ] Production UI shows updated services

---

**Remember**: This script modifies your production database. Always backup first and test in a staging environment if possible!
