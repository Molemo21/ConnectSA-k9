# 🧹 Service Cleanup Scripts

This directory contains scripts to clean up and standardize the service catalog in your ConnectSA database.

## 🚨 **IMPORTANT: Before Running Any Cleanup Scripts**

1. **Backup your database** - Always create a backup before running cleanup scripts
2. **Test on staging first** - Run scripts in a staging environment before production
3. **Run during low traffic** - Execute cleanup during maintenance windows
4. **Monitor the application** - Watch for any issues after cleanup

## 📋 **Available Scripts**

### 1. **Dry Run Analysis** (Safe - No Changes)
```bash
npx tsx scripts/cleanup-duplicate-services-dry-run.ts
```
- Shows what duplicate services exist
- Displays cleanup plan without making changes
- Safe to run anytime

### 2. **Duplicate Services Cleanup** (Makes Changes)
```bash
npx tsx scripts/cleanup-duplicate-services.ts
```
- Removes duplicate service entries
- Migrates providers and bookings to kept services
- **⚠️  Makes permanent changes to database**

### 3. **Category Standardization** (Makes Changes)
```bash
# Dry run first
npx tsx scripts/standardize-service-categories.ts --dry-run

# Then execute
npx tsx scripts/standardize-service-categories.ts
```
- Standardizes service categories
- Consolidates inconsistent naming
- **⚠️  Makes permanent changes to database**

## 🔍 **Current Issues Identified**

Based on the analysis, your database has:
- **26 total services** with many duplicates
- **Inconsistent categories** (e.g., "Hair" vs "Beauty & Personal Care")
- **Duplicate service names** in different categories
- **Provider coverage gaps** (most services have no providers)

## 📊 **Recommended Cleanup Order**

### Step 1: Analyze (Safe)
```bash
npx tsx scripts/cleanup-duplicate-services-dry-run.ts
```
Review the output to understand what will be cleaned up.

### Step 2: Standardize Categories (Safe First)
```bash
npx tsx scripts/standardize-service-categories.ts --dry-run
```
See what category changes would be made.

### Step 3: Execute Category Standardization
```bash
npx tsx scripts/standardize-service-categories.ts
```
This consolidates categories before deduplication.

### Step 4: Execute Duplicate Cleanup
```bash
npx tsx scripts/cleanup-duplicate-services.ts
```
This removes duplicate services and migrates data.

### Step 5: Verify Results
```bash
npx tsx scripts/check-services-providers.ts
```
Confirm the cleanup was successful.

## 🛡️ **Safety Features**

### Production Protection
- Scripts check `NODE_ENV` and require `--force` flag in production
- Database connection issues are handled gracefully
- Rollback information is logged

### Data Integrity
- Providers and bookings are migrated before deleting services
- Foreign key relationships are maintained
- Audit trail of all changes

### Error Handling
- Individual service updates can fail without stopping the entire process
- Detailed error logging for troubleshooting
- Graceful database disconnection

## 📈 **Expected Results**

After cleanup, you should have:
- **~15-18 unique services** (down from 26)
- **3 standardized categories**:
  - Beauty & Personal Care
  - Home & Garden  
  - Transportation & Logistics
- **No duplicate service names**
- **Consistent provider coverage**

## 🚀 **Quick Start (Development)**

```bash
# 1. See what needs cleanup
npx tsx scripts/cleanup-duplicate-services-dry-run.ts

# 2. Standardize categories
npx tsx scripts/standardize-service-categories.ts --dry-run
npx tsx scripts/standardize-service-categories.ts

# 3. Clean up duplicates
npx tsx scripts/cleanup-duplicate-services.ts

# 4. Verify results
npx tsx scripts/check-services-providers.ts
```

## 🚀 **Production Deployment**

```bash
# 1. Backup database
pg_dump your_database > backup_before_cleanup.sql

# 2. Run dry runs to verify plan
NODE_ENV=production npx tsx scripts/cleanup-duplicate-services-dry-run.ts
NODE_ENV=production npx tsx scripts/standardize-service-categories.ts --dry-run

# 3. Execute cleanup with force flag
NODE_ENV=production npx tsx scripts/standardize-service-categories.ts --force
NODE_ENV=production npx tsx scripts/cleanup-duplicate-services.ts --force

# 4. Verify results
NODE_ENV=production npx tsx scripts/check-services-providers.ts
```

## 🔧 **Troubleshooting**

### Common Issues

1. **Database Connection Errors**
   - Check your `.env` file and database connectivity
   - Ensure Prisma can connect to your database

2. **Permission Errors**
   - Verify database user has UPDATE/DELETE permissions
   - Check if any services are referenced by active bookings

3. **Foreign Key Constraints**
   - Scripts handle this automatically by migrating data first
   - If issues persist, check for circular references

### Rollback Plan

If something goes wrong:
1. **Stop the application** to prevent new data
2. **Restore from backup** using your database backup
3. **Check logs** to identify what went wrong
4. **Fix the issue** and try again with dry run first

## 📞 **Support**

If you encounter issues:
1. Check the script output for error messages
2. Review database logs for constraint violations
3. Ensure all dependencies are installed (`@prisma/client`)
4. Verify database schema matches Prisma expectations

## 🎯 **Next Steps After Cleanup**

1. **Recruit more providers** for underserved services
2. **Implement service validation** to prevent future duplicates
3. **Add service onboarding** for new service types
4. **Monitor service coverage** and provider distribution

---

**Remember: Always backup before cleanup, test on staging first, and monitor the application after changes!**
