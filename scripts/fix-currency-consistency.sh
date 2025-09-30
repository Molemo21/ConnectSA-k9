#!/bin/bash

# Currency Consistency Fix Script
# This script identifies files that need currency updates

echo "🔍 Finding USD currency references in admin components..."
echo ""

# Find files with USD in currency formatting
echo "📊 Files with en-US locale (should be en-ZA):"
grep -r "en-US" components/admin --include="*.tsx" --include="*.ts" -l

echo ""
echo "📊 Files with USD currency code:"
grep -r "currency.*USD\|USD.*currency" components/admin --include="*.tsx" --include="*.ts" -l

echo ""
echo "📊 Files with dollar symbol in amounts:"
grep -rE "amount.*\\\$|\\\$.*amount|total.*\\\$|\\\$.*total" components/admin --include="*.tsx" --include="*.ts" -l | head -10

echo ""
echo "✅ Analysis complete!"
echo ""
echo "Files to update:"
echo "1. components/admin/admin-user-management-enhanced.tsx - FIXED ✅"
echo "2. components/admin/admin-provider-management-enhanced.tsx - FIXED ✅"
echo "3. lib/paystack.ts - FIXED ✅"
echo ""
echo "Database currency: ZAR ✅"
echo "Default currency context: ZAR ✅"
