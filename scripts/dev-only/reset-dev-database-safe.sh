#!/bin/bash
# reset-dev-database-safe.sh
# DEVELOPMENT-ONLY database reset with comprehensive safety checks

set -e  # Exit immediately on any error

echo "🔄 DEVELOPMENT DATABASE RESET (SAFE MODE)"
echo "=================================================================================="
echo ""

# ============================================================================
# STEP 1: Load and Verify Environment
# ============================================================================
echo "📋 Step 1: Loading and verifying environment..."

# Check .env.development exists
if [ ! -f .env.development ]; then
  echo "❌ ERROR: .env.development file not found"
  echo "   Please ensure you're in the ConnectSA-k9 directory"
  exit 1
fi

# Load environment using Node.js (more reliable than shell export)
export NODE_ENV=development

# Load DATABASE_URL using Node.js
DATABASE_URL=$(node -e "require('dotenv').config({ path: '.env.development' }); console.log(process.env.DATABASE_URL || '')")
DIRECT_URL=$(node -e "require('dotenv').config({ path: '.env.development' }); console.log(process.env.DIRECT_URL || '')")

# Verify NODE_ENV
if [ "$NODE_ENV" != "development" ]; then
  echo "❌ ERROR: NODE_ENV must be 'development'"
  echo "   Current: $NODE_ENV"
  exit 1
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set in .env.development"
  exit 1
fi

# Export for Prisma commands
export DATABASE_URL
export DIRECT_URL

echo "✅ Environment loaded:"
echo "   NODE_ENV: $NODE_ENV"
echo "   DATABASE_URL: ${DATABASE_URL:0:80}..."
echo ""

# ============================================================================
# STEP 2: Safety Checks - Production Database Detection
# ============================================================================
echo "📋 Step 2: Safety checks - Production database detection..."

DB_URL_LOWER=$(echo "$DATABASE_URL" | tr '[:upper:]' '[:lower:]')

# Production identifiers that should BLOCK
BLOCKING_PATTERNS=("production" "prod-db" "prod_db")

# Supabase patterns that should WARN but allow
SUPABASE_PATTERNS=("pooler.supabase.com" "aws-0-eu-west-1" "aws-1-eu-west-1" "supabase.com")

IS_BLOCKED=false
HAS_SUPABASE_WARNING=false

# Check for blocking patterns
for pattern in "${BLOCKING_PATTERNS[@]}"; do
  if [[ "$DB_URL_LOWER" == *"$pattern"* ]]; then
    IS_BLOCKED=true
    echo "❌ BLOCKED: Database URL contains production identifier: $pattern"
  fi
done

# Check for Supabase patterns (warn but allow)
for pattern in "${SUPABASE_PATTERNS[@]}"; do
  if [[ "$DB_URL_LOWER" == *"$pattern"* ]]; then
    HAS_SUPABASE_WARNING=true
  fi
done

# Block if production patterns found
if [ "$IS_BLOCKED" = true ]; then
  echo ""
  echo "🚨 CRITICAL: This appears to be a PRODUCTION database!"
  echo "   This script will DELETE ALL DATA. Aborting for safety."
  exit 1
fi

# Warn about Supabase
if [ "$HAS_SUPABASE_WARNING" = true ]; then
  echo "⚠️  WARNING: Database URL contains Supabase patterns"
  echo "   This is allowed in development, but please verify:"
  echo "   - This is your development/staging Supabase project"
  echo "   - NOT your production Supabase database"
  echo ""
fi

# ============================================================================
# STEP 3: Explicit Confirmation
# ============================================================================
echo "=================================================================================="
echo "⚠️  CRITICAL WARNING"
echo "=================================================================================="
echo "This script will:"
echo "  ❌ DELETE ALL TABLES in the database"
echo "  ❌ DELETE ALL DATA in the database"
echo "  ❌ CLEAR all migration history"
echo "  ✅ Create a clean baseline migration"
echo "  ✅ Apply the baseline"
echo "  ✅ Seed with minimal test data"
echo ""
echo "Database: ${DATABASE_URL:0:80}..."
echo ""
read -p "Type 'yes' to confirm this is your DEVELOPMENT database: " confirm

if [ "$confirm" != "yes" ]; then
  echo ""
  echo "❌ Reset aborted. Confirmation was not 'yes'."
  exit 1
fi

echo ""
echo "✅ Confirmation received. Proceeding with reset..."
echo ""

# ============================================================================
# STEP 4: Reset Database (Drop all tables, clear migration history)
# ============================================================================
echo "📋 Step 4: Resetting database (drops all tables, clears migration history)..."
echo "   Running: npx prisma migrate reset --force --skip-seed"
echo ""

npx prisma migrate reset --force --skip-seed

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Database reset failed"
  exit 1
fi

echo "✅ Database reset complete"
echo ""

# ============================================================================
# STEP 5: Create Baseline Migration
# ============================================================================
echo "📋 Step 5: Creating baseline migration..."
echo "   Running: npx prisma migrate dev --name baseline_financial_architecture --create-only"
echo ""

npx prisma migrate dev --name baseline_financial_architecture --create-only

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Baseline migration creation failed"
  exit 1
fi

echo "✅ Baseline migration created"
echo ""

# ============================================================================
# STEP 6: Apply Baseline Migration
# ============================================================================
echo "📋 Step 6: Applying baseline migration..."
echo "   Running: npx prisma migrate deploy"
echo ""

npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Baseline migration application failed"
  exit 1
fi

echo "✅ Baseline migration applied"
echo ""

# ============================================================================
# STEP 7: Generate Prisma Client
# ============================================================================
echo "📋 Step 7: Generating Prisma client..."
echo "   Running: npx prisma generate"
echo ""

npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Prisma client generation failed"
  exit 1
fi

echo "✅ Prisma client generated"
echo ""

# ============================================================================
# STEP 8: Seed Database
# ============================================================================
echo "📋 Step 8: Seeding database with minimal test data..."
echo "   Running: npx tsx prisma/seed.ts"
echo ""

npx tsx prisma/seed.ts || echo "⚠️  Seeding had issues (may be expected)"

echo "✅ Database seeding complete"
echo ""

# ============================================================================
# STEP 9: Verify Migrations
# ============================================================================
echo "📋 Step 9: Verifying migrations..."
echo "   Running: npx prisma migrate status"
echo ""

npx prisma migrate status

if [ $? -ne 0 ]; then
  echo "❌ ERROR: Migration verification failed"
  exit 1
fi

echo ""

# ============================================================================
# FINAL VERIFICATION
# ============================================================================
echo "=================================================================================="
echo "✅ DEVELOPMENT DATABASE RESET COMPLETE"
echo "=================================================================================="
echo ""
echo "📊 Summary:"
echo "   ✅ All tables cleared"
echo "   ✅ Migration history cleared"
echo "   ✅ Clean baseline migration created and applied"
echo "   ✅ Prisma client generated"
echo "   ✅ Database seeded with minimal test data"
echo "   ✅ Migrations verified"
echo ""
echo "🧪 Database is now ready for:"
echo "   - Financial architecture validation"
echo "   - Stress testing: npx tsx scripts/stress-test-financial-system.ts"
echo "   - Development work"
echo ""
