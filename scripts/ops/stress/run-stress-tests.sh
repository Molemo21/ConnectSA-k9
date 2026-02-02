#!/bin/bash

# Stress Test Runner Script
# Usage: ./scripts/run-stress-tests.sh

echo "🧪 Financial System Stress Test Suite"
echo "======================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "   Please set it to your staging database connection string"
    exit 1
fi

# Check if we're using staging database
if [[ "$DATABASE_URL" != *"staging"* ]] && [[ "$DATABASE_URL" != *"test"* ]]; then
    echo "⚠️  WARNING: DATABASE_URL does not appear to be a staging/test database"
    echo "   Current: $DATABASE_URL"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run Prisma migrations to ensure schema is up to date
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy || {
    echo "❌ Migration failed"
    exit 1
}

# Run stress tests
echo ""
echo "🚀 Running stress tests..."
echo ""

npx tsx scripts/stress-test-financial-system.ts

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ All stress tests passed!"
else
    echo ""
    echo "❌ Some stress tests failed. Check the output above for details."
fi

exit $EXIT_CODE
