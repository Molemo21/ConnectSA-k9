#!/usr/bin/env node

/**
 * Script to add dynamic rendering to all authenticated API routes
 * This fixes the "Dynamic server usage" errors during Next.js build
 */

const fs = require('fs');
const path = require('path');

// List of API routes that need dynamic rendering (from build logs)
const apiRoutes = [
  'app/api/admin/audit-logs/route.ts',
  'app/api/admin/bookings/route.ts',
  'app/api/admin/payments/pending/route.ts',
  'app/api/admin/payments/route.ts',
  'app/api/admin/stats/cancelled-bookings/route.ts',
  'app/api/admin/stats/completed-bookings/route.ts',
  'app/api/admin/stats/completed-payments/route.ts',
  'app/api/admin/stats/pending-providers/route.ts',
  'app/api/admin/stats/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/notifications/latest/route.ts',
  'app/api/notifications/route.ts',
  'app/api/auth/me/route.ts',
  'app/api/reviews/my-reviews/route.ts',
  'app/api/provider/status/route.ts',
  'app/api/provider/onboarding/route.ts',
  'app/api/provider/earnings/route.ts',
  'app/api/provider/reviews/route.ts',
  'app/api/provider/settings/route.ts'
];

function addDynamicRendering(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if dynamic export already exists
    if (content.includes('export const dynamic')) {
      console.log(`✅ Already has dynamic export: ${filePath}`);
      return true;
    }

    // Find the first import statement and add dynamic export after it
    const importMatch = content.match(/^import.*?from.*?;$/m);
    if (!importMatch) {
      console.log(`⚠️  No import statement found in: ${filePath}`);
      return false;
    }

    // Add dynamic export after the last import
    const lastImportIndex = content.lastIndexOf('import');
    const lastImportEnd = content.indexOf(';', lastImportIndex) + 1;
    
    const dynamicExport = '\n\n// Force dynamic rendering to prevent build-time static generation\nexport const dynamic = \'force-dynamic\'\n';
    
    content = content.slice(0, lastImportEnd) + dynamicExport + content.slice(lastImportEnd);
    
    // Write the file back
    fs.writeFileSync(filePath, content);
    console.log(`✅ Added dynamic rendering to: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 FIXING DYNAMIC RENDERING FOR ALL API ROUTES');
  console.log('================================================');
  
  let successCount = 0;
  let totalCount = apiRoutes.length;
  
  apiRoutes.forEach(route => {
    if (addDynamicRendering(route)) {
      successCount++;
    }
  });
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`✅ Successfully fixed: ${successCount}/${totalCount} routes`);
  console.log(`❌ Failed to fix: ${totalCount - successCount}/${totalCount} routes`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All routes fixed successfully!');
  } else {
    console.log('\n⚠️  Some routes failed. Check the errors above.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addDynamicRendering, apiRoutes };
