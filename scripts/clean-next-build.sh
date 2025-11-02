#!/bin/bash
# Clean Next.js build folders to fix file system lock errors
# Usage: bash scripts/clean-next-build.sh

echo "🧹 Cleaning Next.js build folders..."

# Remove .next-dev folder if it exists
if [ -d ".next-dev" ]; then
  echo "Removing .next-dev folder..."
  rm -rf .next-dev
  echo "✅ .next-dev removed"
else
  echo "ℹ️  .next-dev folder not found"
fi

# Remove .next folder if it exists
if [ -d ".next" ]; then
  echo "Removing .next folder..."
  rm -rf .next
  echo "✅ .next removed"
else
  echo "ℹ️  .next folder not found"
fi

echo ""
echo "✅ Cleanup complete! Restart your dev server with: pnpm dev"




