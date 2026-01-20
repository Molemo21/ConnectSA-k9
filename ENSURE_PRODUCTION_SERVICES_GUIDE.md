# 🔧 Ensure Production Services - Automated Script

## Overview

This script automatically checks if services exist in the production database and creates/updates them if they don't match `config/services.ts` (source of truth).

## Features

✅ **Automatic Service Creation** - Creates missing services from config  
✅ **Service Updates** - Updates existing services to match config  
✅ **Category Management** - Ensures categories exist  
✅ **Invalid Service Cleanup** - Removes/deactivates invalid services  
✅ **Dry Run Mode** - Preview changes without applying  
✅ **Safety Checks** - Prevents accidental dev database modifications  
✅ **Comprehensive Verification** - Verifies all services are in sync  

---

## Quick Start

### 1. Set Production Database URL

**Option A: Environment Variable**
```bash
export PROD_DATABASE_URL=your-production-database-url
```

**Option B: .env.production.local File**
```bash
# Create .env.production.local
echo 'PROD_DATABASE_URL=your-production-database-url' > .env.production.local
```

### 2. Run Script

**Dry Run (Preview Changes):**
```bash
npm run ensure:production:services:dry-run
```

**Apply Changes:**
```bash
npm run ensure:production:services
```

---

## What the Script Does

### Step 1: Ensures Categories Exist
- ✅ Creates "Cleaning Services" category if missing
- ✅ Creates "Beauty & Personal Care" category if missing

### Step 2: Ensures All Services Exist
- ✅ Creates services from `config/services.ts` that don't exist
- ✅ Updates existing services to match config (description, price, active status)
- ✅ Skips services that are already in sync

### Step 3: Removes Invalid Services
- ✅ Removes/deactivates services with category names (e.g., "Cleaning Services")
- ✅ Preserves services with active relationships (bookings, providers)

### Step 4: Verification
- ✅ Verifies all services from config exist in database
- ✅ Checks "Specialized Cleaning" services specifically
- ✅ Reports any mismatches

---

## Usage Examples

### Example 1: Preview Changes (Dry Run)
```bash
# Set production database URL
export PROD_DATABASE_URL=postgresql://postgres:password@host:port/database

# Preview what would be created/updated
npm run ensure:production:services:dry-run
```

**Output:**
```
🔍 DRY RUN MODE - No changes will be made

📋 Step 3: Ensuring All Services from config/services.ts Exist
  [DRY RUN] Would create: "Mobile Car Wash" (R100)
  [DRY RUN] Would create: "Office Cleaning" (R150)
  ✓ Exists: "Carpet Cleaning" (already in sync)

📊 SUMMARY
   Created: 2
   Updated: 0
   Skipped: 1
```

### Example 2: Apply Changes
```bash
# Set production database URL
export PROD_DATABASE_URL=postgresql://postgres:password@host:port/database

# Apply changes
npm run ensure:production:services
```

**Output:**
```
📋 Step 3: Ensuring All Services from config/services.ts Exist
  ✅ Created: "Mobile Car Wash" (R100)
  ✅ Created: "Office Cleaning" (R150)
  ✓ Exists: "Carpet Cleaning" (already in sync)

📊 SUMMARY
   Created: 2
   Updated: 0
   Skipped: 1
   Errors: 0

✨ All services are now in sync with config/services.ts!
```

### Example 3: Skip Verification
```bash
# Run without verification step (faster)
npm run ensure:production:services -- --skip-verification
```

---

## Command Line Options

| Option | Short | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Preview changes without applying |
| `--skip-verification` | `-s` | Skip verification step (faster) |

**Examples:**
```bash
# Dry run
npm run ensure:production:services -- --dry-run

# Skip verification
npm run ensure:production:services -- --skip-verification

# Both
npm run ensure:production:services -- --dry-run --skip-verification
```

---

## Safety Features

### 1. Production Database Check
The script checks if you're connecting to a production database:
- ✅ Requires `PROD_DATABASE_URL` environment variable
- ✅ Or checks if `DATABASE_URL` contains "production" or "prod"
- ✅ Or checks if `NODE_ENV=production`
- ⚠️  Prevents accidental modifications to development database

**Override (if needed):**
```bash
FORCE_RUN=true npm run ensure:production:services
```

### 2. Dry Run Mode
Always preview changes first:
```bash
npm run ensure:production:services:dry-run
```

### 3. Relationship Preservation
- ✅ Services with active bookings are deactivated (not deleted)
- ✅ Services with active providers are preserved
- ✅ Only services without relationships are deleted

---

## Integration with CI/CD

The script is automatically run in CI/CD pipeline after reference data promotion:

```yaml
# .github/workflows/deploy-production.yml
- name: Ensure production services exist (fallback)
  run: npm run ensure:production:services
  env:
    PROD_DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
    FORCE_RUN: true
```

This ensures services are always in sync after deployment.

---

## Troubleshooting

### Error: "DATABASE_URL or PROD_DATABASE_URL environment variable is required"

**Solution:**
```bash
export PROD_DATABASE_URL=your-production-database-url
```

### Error: "This script is designed for PRODUCTION database"

**Solution:**
```bash
# Option 1: Use PROD_DATABASE_URL
export PROD_DATABASE_URL=your-production-database-url

# Option 2: Force run (if you're sure)
FORCE_RUN=true npm run ensure:production:services
```

### Services Still Not Showing in UI

**Check:**
1. ✅ Services exist in database (run script again to verify)
2. ✅ Frontend code is deployed (check Vercel)
3. ✅ Browser cache cleared (hard refresh)
4. ✅ Service names match exactly (case-sensitive)

**Verify:**
```bash
npm run investigate:specialized:cleaning
```

---

## Best Practices

### 1. Always Dry Run First
```bash
npm run ensure:production:services:dry-run
```

### 2. Verify Changes
After running, verify services exist:
```bash
npm run verify:production:state
```

### 3. Check UI After Deployment
- Wait for Vercel deployment
- Clear browser cache
- Verify services appear in correct subcategories

### 4. Use CI/CD
Let the CI/CD pipeline run this automatically after deployments.

---

## Expected Results

After running the script, production database should have:

### Cleaning Services:
- ✅ Carpet Cleaning (R400)
- ✅ Mobile Car Wash (R100)
- ✅ Office Cleaning (R150)
- ✅ Standard House Cleaning (R350)
- ✅ Deep Cleaning (R600)
- ✅ Window Cleaning (R300)

### Beauty & Personal Care:
- ✅ All 11 beauty services from config

---

## Summary

**Script:** `scripts/ensure-production-services.ts`  
**NPM Command:** `npm run ensure:production:services`  
**Dry Run:** `npm run ensure:production:services:dry-run`  
**Source of Truth:** `config/services.ts`  

**This script ensures your production database always matches your configuration!**
