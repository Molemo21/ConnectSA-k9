# 🔧 Service Name Sync Guide

## Problem Statement

Service names must match **exactly** between:
1. **config/services.ts** (source of truth for database)
2. **components/book-service/ServiceSelection.tsx** (frontend subcategory definitions)
3. **Production Database** (actual service records)

## Issues Fixed

### ❌ Before (Issues):
1. **ServiceSelection.tsx** had `'House Cleaning'` but **config/services.ts** has `'Standard House Cleaning'`
2. **ServiceSelection.tsx** included `'Cleaning Services'` in subcategory array (this is a **category** name, not a service)
3. Service name mismatches caused filtering to fail in production UI

### ✅ After (Fixed):
1. **ServiceSelection.tsx** now uses `'Standard House Cleaning'` (matches config)
2. **ServiceSelection.tsx** removed `'Cleaning Services'` from subcategory array
3. All service names now match exactly between config, frontend, and database

---

## Source of Truth: config/services.ts

**ALL service names must match exactly with config/services.ts:**

```typescript
// config/services.ts - Source of Truth
{
  name: 'Standard House Cleaning',  // ✅ Correct name
  // ...
},
{
  name: 'Carpet Cleaning',
  // ...
},
{
  name: 'Mobile Car Wash',
  // ...
},
// ...
```

---

## Frontend Subcategory Definition

**ServiceSelection.tsx** must use **exact** service names from config:

```typescript
// components/book-service/ServiceSelection.tsx
const CLEANING_SUBCATEGORIES = {
  'Home Cleaning': [
    'Standard House Cleaning',  // ✅ Matches config exactly
    'Deep Cleaning',            // ✅ Matches config exactly
    'Window Cleaning'           // ✅ Matches config exactly
  ],
  'Specialized Cleaning': [
    'Carpet Cleaning',          // ✅ Matches config exactly
    'Mobile Car Wash'           // ✅ Matches config exactly
    // ❌ NO 'Cleaning Services' - that's a category!
  ]
};
```

---

## Verification Scripts

### 1. Verify Service Name Sync

Check if service names match between config and database:

```bash
npm run verify:service:names
```

**What it checks:**
- ✅ All services in config exist in database with exact name match
- ✅ All services in database exist in config
- ✅ Service names match exactly (case-sensitive)
- ✅ Prices match between config and database
- ✅ No invalid service names (like category names)

**Exit codes:**
- `0` = All services in sync ✅
- `1` = Mismatches found ❌

### 2. Fix Service Name Mismatches

Automatically fix common service name mismatches:

```bash
npm run fix:service:names
```

**What it does:**
- ✅ Renames `'House Cleaning'` → `'Standard House Cleaning'`
- ✅ Removes/deactivates invalid service `'Cleaning Services'`
- ✅ Creates missing services from config
- ✅ Updates service descriptions and prices to match config

**⚠️ WARNING:** This script modifies the database. Always backup first!

---

## Database Sync Process

### Step 1: Verify Current State

```bash
# Check dev database
npm run verify:service:names

# Check production database (after setting PROD_DATABASE_URL)
PROD_DATABASE_URL=your-prod-db-url npm run verify:service:names
```

### Step 2: Fix Mismatches (Development)

```bash
# Fix dev database
npm run fix:service:names
```

### Step 3: Sync to Production (CI/CD)

The CI/CD pipeline automatically syncs reference data:

1. **Reference Data Promotion Job** runs after database migrations
2. Syncs categories and services from dev to prod
3. Matches services by **exact name** (case-sensitive)
4. Creates missing services
5. Updates existing services to match config

**CI/CD Pipeline Flow:**
```
1. Pre-deployment checks
2. Create backup
3. Deploy database migrations
4. Promote reference data (sync categories & services)
5. Verify deployment:
   - ✅ Database connection
   - ✅ Production state check
   - ✅ Frontend/backend sync
   - ✅ Service name verification ← NEW!
```

---

## Best Practices

### ✅ DO:
1. **Always use exact service names** from `config/services.ts`
2. **Update config/services.ts first**, then sync to database
3. **Run verification scripts** before committing changes
4. **Verify service names** match in all three places:
   - config/services.ts
   - ServiceSelection.tsx
   - Database
5. **Test filtering** works correctly after name changes

### ❌ DON'T:
1. **Don't include category names** in subcategory arrays (e.g., "Cleaning Services")
2. **Don't use abbreviated names** (e.g., "House Cleaning" instead of "Standard House Cleaning")
3. **Don't modify database directly** without updating config first
4. **Don't skip verification** after making changes
5. **Don't assume case-insensitive matching** - names must match exactly

---

## Troubleshooting

### Issue: Service not showing in UI subcategory

**Symptoms:**
- Service exists in database
- Service exists in config
- Service not appearing in UI when subcategory is selected

**Possible Causes:**
1. Service name mismatch between config and ServiceSelection.tsx
2. Service name mismatch between database and config
3. Service name has extra spaces or different casing

**Solution:**
```bash
# 1. Verify names match
npm run verify:service:names

# 2. Check ServiceSelection.tsx subcategory array
# Ensure service name matches config/services.ts exactly

# 3. Fix mismatches
npm run fix:service:names
```

### Issue: Invalid service appearing in UI

**Symptoms:**
- Service like "Cleaning Services" appears (this is a category name)
- Category name showing as a service

**Solution:**
```bash
# Remove invalid service
npm run fix:service:names
```

### Issue: Service name changed but old name still in database

**Symptoms:**
- Config has "Standard House Cleaning"
- Database still has "House Cleaning"

**Solution:**
```bash
# Fix name mismatch
npm run fix:service:names
```

---

## Files Changed

1. **components/book-service/ServiceSelection.tsx**
   - ✅ Fixed: `'House Cleaning'` → `'Standard House Cleaning'`
   - ✅ Removed: `'Cleaning Services'` from subcategory array

2. **scripts/verify-service-name-sync.ts** (NEW)
   - Verifies service names match between config and database

3. **scripts/fix-service-name-mismatches.ts** (NEW)
   - Automatically fixes common service name mismatches

4. **.github/workflows/deploy-production.yml**
   - ✅ Added service name verification step in CI/CD

---

## Next Steps

1. ✅ **Development**: Run `npm run fix:service:names` to fix dev database
2. ✅ **Production**: CI/CD will automatically verify and sync on next deployment
3. ✅ **Verification**: Run `npm run verify:service:names` after deployment

---

## Summary

**Before:**
- ❌ Service names didn't match between config and frontend
- ❌ Category name was included as a service
- ❌ Production UI showed wrong services

**After:**
- ✅ All service names match exactly
- ✅ No invalid service names
- ✅ Production UI shows correct services in correct subcategories
- ✅ Automated verification in CI/CD prevents future issues

---

**Last Updated**: After service name sync fixes
