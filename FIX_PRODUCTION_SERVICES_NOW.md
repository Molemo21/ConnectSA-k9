# 🔧 Fix Production Services - Action Required

## Current Issues (From Verification)

**Production Database Has:**
- ❌ "House Cleaning" (should be "Standard House Cleaning")
- ❌ "Cleaning Services" (invalid - it's a category name, not a service)
- ❌ Missing "Mobile Car Wash"
- ❌ Missing "Office Cleaning"

**Expected (from config/services.ts):**
- ✅ "Standard House Cleaning"
- ✅ "Mobile Car Wash"
- ✅ "Office Cleaning"
- ✅ "Carpet Cleaning"
- ✅ "Deep Cleaning"
- ✅ "Window Cleaning"

---

## ✅ Solution: Run the Fix Script

The `ensure-production-services` script will automatically fix all these issues!

### Step 1: Set Production Database URL

```bash
export PROD_DATABASE_URL=your-production-database-url
```

### Step 2: Run the Fix Script

**Option A: Dry Run First (Preview Changes)**
```bash
npm run ensure:production:services:dry-run
```

**Option B: Apply Changes**
```bash
npm run ensure:production:services
```

---

## What the Script Will Do

1. ✅ **Rename "House Cleaning" → "Standard House Cleaning"**
2. ✅ **Remove "Cleaning Services" service** (invalid category name)
3. ✅ **Create "Mobile Car Wash"** (missing)
4. ✅ **Create "Office Cleaning"** (missing)
5. ✅ **Update all services to match config**

---

## Or: Let CI/CD Fix It Automatically

The CI/CD pipeline will automatically run this script after reference data promotion.

**To trigger CI/CD:**
1. Go to: https://github.com/Molemo21/ConnectSA-k9/actions/workflows/deploy-production.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"

The pipeline will:
- ✅ Run pre-deployment verification (now fixed)
- ✅ Promote reference data
- ✅ **Run ensure-production-services** (will fix all issues automatically)
- ✅ Verify deployment

---

## Expected Results After Fix

**Production Database Will Have:**
- ✅ Standard House Cleaning (renamed from "House Cleaning")
- ✅ Mobile Car Wash (created)
- ✅ Office Cleaning (created)
- ✅ Carpet Cleaning (already exists)
- ✅ Deep Cleaning (already exists)
- ✅ Window Cleaning (already exists)
- ❌ ~~Cleaning Services~~ (removed/deactivated)

**Production UI Will Show:**
- **Specialized Cleaning:** Carpet Cleaning, Mobile Car Wash, Office Cleaning
- **Home Cleaning:** Standard House Cleaning, Deep Cleaning, Window Cleaning

---

## Quick Fix Command

```bash
# Set production database URL
export PROD_DATABASE_URL=your-production-database-url

# Run the fix
npm run ensure:production:services
```

---

**The script is ready and will fix all issues automatically!**
