#!/bin/bash

# Script to add dynamic export to all authenticated API routes
echo "🔧 Adding dynamic rendering to all API routes..."

# Array of API route files that need fixing
routes=(
  "app/api/admin/bookings/route.ts"
  "app/api/admin/payments/pending/route.ts"
  "app/api/admin/payments/route.ts"
  "app/api/admin/stats/cancelled-bookings/route.ts"
  "app/api/admin/stats/completed-bookings/route.ts"
  "app/api/admin/stats/completed-payments/route.ts"
  "app/api/admin/stats/pending-providers/route.ts"
  "app/api/admin/stats/route.ts"
  "app/api/admin/users/route.ts"
  "app/api/notifications/latest/route.ts"
  "app/api/notifications/route.ts"
  "app/api/auth/me/route.ts"
  "app/api/provider/onboarding/route.ts"
  "app/api/provider/earnings/route.ts"
  "app/api/provider/reviews/route.ts"
  "app/api/provider/settings/route.ts"
)

# Function to add dynamic export to a file
add_dynamic_export() {
  local file="$1"
  
  if [ ! -f "$file" ]; then
    echo "⚠️  File not found: $file"
    return 1
  fi
  
  # Check if dynamic export already exists
  if grep -q "export const dynamic" "$file"; then
    echo "✅ Already has dynamic export: $file"
    return 0
  fi
  
  # Find the line number of the last import statement
  local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
  
  if [ -z "$last_import_line" ]; then
    echo "⚠️  No import statements found in: $file"
    return 1
  fi
  
  # Create a temporary file with the dynamic export added
  local temp_file=$(mktemp)
  
  # Copy lines up to and including the last import
  head -n "$last_import_line" "$file" > "$temp_file"
  
  # Add the dynamic export and empty lines
  echo "" >> "$temp_file"
  echo "// Force dynamic rendering to prevent build-time static generation" >> "$temp_file"
  echo "export const dynamic = 'force-dynamic'" >> "$temp_file"
  echo "" >> "$temp_file"
  
  # Copy the rest of the file (from line after last import)
  tail -n +$((last_import_line + 1)) "$file" >> "$temp_file"
  
  # Replace the original file
  mv "$temp_file" "$file"
  
  echo "✅ Added dynamic rendering to: $file"
  return 0
}

# Process each route
success_count=0
total_count=${#routes[@]}

for route in "${routes[@]}"; do
  if add_dynamic_export "$route"; then
    ((success_count++))
  fi
done

echo ""
echo "📊 SUMMARY"
echo "==========="
echo "✅ Successfully fixed: $success_count/$total_count routes"
echo "❌ Failed to fix: $((total_count - success_count))/$total_count routes"

if [ $success_count -eq $total_count ]; then
  echo ""
  echo "🎉 All routes fixed successfully!"
else
  echo ""
  echo "⚠️  Some routes failed. Check the errors above."
fi
