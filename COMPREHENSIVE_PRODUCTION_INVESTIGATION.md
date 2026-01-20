# 🔍 Comprehensive Production Investigation Guide

## Problem
In production UI, "Specialized Cleaning" subcategory shows only "Carpet Cleaning". "Mobile Car Wash" and "Office Cleaning" are missing.

## Investigation Steps

### Step 1: Verify Frontend Code is Deployed

**Check Vercel Deployment:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Deployments" tab
4. Find the latest deployment
5. Check if commit `aae2ea4` or later is deployed
6. Verify deployment status is "Ready" (green checkmark)

**Expected Code (ServiceSelection.tsx line 46):**
```typescript
'Specialized Cleaning': ['Carpet Cleaning', 'Mobile Car Wash', 'Office Cleaning']
```

**If code is not deployed:**
- Wait for Vercel to finish deployment
- Or manually trigger redeploy in Vercel dashboard

---

### Step 2: Check Production Database

**Run Investigation Script:**
```bash
# Set production database URL
export PROD_DATABASE_URL=your-production-database-url

# Run comprehensive investigation
npm run investigate:specialized:cleaning
```

**What the script checks:**
1. ✅ All services in production database
2. ✅ Exact name matching for "Mobile Car Wash" and "Office Cleaning"
3. ✅ Case sensitivity issues
4. ✅ Partial name matches
5. ✅ Frontend filtering logic simulation
6. ✅ Comparison with config/services.ts

**Expected Output:**
- Lists all cleaning services in database
- Shows which services match expected names
- Identifies name mismatches
- Simulates what frontend filtering would return

---

### Step 3: Common Issues and Fixes

#### Issue 1: Services Don't Exist in Database

**Symptoms:**
- Script shows "NOT FOUND in database"
- Services exist in config but not in production DB

**Fix:**
```bash
# Option A: Run CI/CD pipeline (recommended)
# Push to main branch - reference data promotion will sync services

# Option B: Manual sync (if CI/CD not working)
PROD_DATABASE_URL=your-prod-url npm run sync:reference:apply
```

#### Issue 2: Service Name Mismatch

**Symptoms:**
- Script shows "PARTIAL MATCH" or "CASE MISMATCH"
- Database has "Mobile Car Wash Service" but frontend expects "Mobile Car Wash"

**Fix:**
```bash
# Fix service name mismatches
PROD_DATABASE_URL=your-prod-url npm run fix:service:names
```

#### Issue 3: Frontend Code Not Deployed

**Symptoms:**
- Database has correct services
- Script shows services would appear in UI
- But UI still shows only "Carpet Cleaning"

**Fix:**
1. Check Vercel deployment status
2. Verify latest commit is deployed
3. Clear browser cache (hard refresh: Ctrl+Shift+R)
4. Check browser console for JavaScript errors

#### Issue 4: Filtering Logic Issue

**Symptoms:**
- Services exist with exact names
- But filtering doesn't match them

**Check:**
- Verify service names have no extra spaces
- Check for hidden characters
- Verify case sensitivity (should be case-insensitive)

---

### Step 4: Manual Database Check

**If you have direct database access:**

```sql
-- Check all cleaning services
SELECT id, name, "basePrice", "isActive"
FROM "Service"
WHERE "categoryId" = (
  SELECT id FROM "ServiceCategory" WHERE name = 'Cleaning Services'
)
AND "isActive" = true
ORDER BY name;
```

**Expected Results:**
- Should see: "Carpet Cleaning"
- Should see: "Mobile Car Wash" (exact name, case-sensitive)
- Should see: "Office Cleaning" (exact name, case-sensitive)

**If services are missing or have wrong names:**
- Update names to match config/services.ts exactly
- Or run the fix script

---

### Step 5: Verify Frontend Filtering

**The filtering logic in ServiceSelection.tsx:**
```typescript
services.filter(service => 
  subcategoryServices.some(subName => 
    service.name.toLowerCase().includes(subName.toLowerCase()) ||
    subName.toLowerCase().includes(service.name.toLowerCase())
  )
);
```

**This should match:**
- "Mobile Car Wash" ✅
- "mobile car wash" ✅ (case-insensitive)
- "Mobile Car Wash Service" ✅ (partial match)
- "Car Wash Mobile" ✅ (partial match)

**This will NOT match:**
- "CarWash" ❌ (no spaces)
- "MobileCarWash" ❌ (no spaces)
- "Mobile Carwash" ❌ (different word)

---

### Step 6: Quick Diagnostic Commands

```bash
# 1. Check what's in production database
PROD_DATABASE_URL=your-prod-url npm run investigate:specialized:cleaning

# 2. Fix service name mismatches
PROD_DATABASE_URL=your-prod-url npm run fix:service:names

# 3. Verify service names match config
PROD_DATABASE_URL=your-prod-url npm run verify:service:names

# 4. Check production state
PROD_DATABASE_URL=your-prod-url npm run verify:production:state
```

---

## Expected Final State

### Production Database Should Have:
1. ✅ "Carpet Cleaning" (R400)
2. ✅ "Mobile Car Wash" (R100) - **EXACT NAME**
3. ✅ "Office Cleaning" (R150) - **EXACT NAME**
4. ✅ "Standard House Cleaning" (R350)
5. ✅ "Deep Cleaning" (R600)
6. ✅ "Window Cleaning" (R300)

### Production UI Should Show:

**Specialized Cleaning Subcategory:**
- ✅ Carpet Cleaning
- ✅ Mobile Car Wash
- ✅ Office Cleaning

**Home Cleaning Subcategory:**
- ✅ Standard House Cleaning
- ✅ Deep Cleaning
- ✅ Window Cleaning

---

## Troubleshooting Checklist

- [ ] Frontend code deployed to Vercel (commit aae2ea4 or later)
- [ ] Browser cache cleared (hard refresh)
- [ ] Production database has all services
- [ ] Service names match exactly (case-sensitive)
- [ ] Services are active (isActive = true)
- [ ] No JavaScript errors in browser console
- [ ] API endpoint returns correct data

---

## Next Steps After Investigation

1. **If services are missing in database:**
   - Run CI/CD pipeline to sync reference data
   - Or manually create services

2. **If service names don't match:**
   - Run `npm run fix:service:names`
   - Or manually rename in database

3. **If frontend code not deployed:**
   - Check Vercel deployment
   - Trigger manual redeploy if needed

4. **If everything looks correct but still not showing:**
   - Check browser console for errors
   - Verify API response in Network tab
   - Check if subcategory is selected correctly

---

**Last Updated:** After comprehensive investigation
