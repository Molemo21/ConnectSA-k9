#!/usr/bin/env node

/**
 * Script to fix deployment checks in all API routes
 * 
 * The issue: Many API routes have overly restrictive deployment checks that
 * prevent them from working in production by checking for DATABASE_URL
 * availability, which is not reliable in Vercel.
 * 
 * The fix: Change the condition to only skip during actual build phase,
 * not during runtime.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing deployment checks in API routes...\n');

// Find all route.ts files
const routeFiles = glob.sync('app/api/**/route.ts');

let fixedCount = 0;
let totalCount = 0;

routeFiles.forEach(filePath => {
  totalCount++;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has the problematic pattern
  const hasProblematicCheck = content.includes('process.env.NODE_ENV === \'production\' && process.env.VERCEL === \'1\' && !process.env.DATABASE_URL');
  
  if (hasProblematicCheck) {
    console.log(`🔍 Found problematic check in: ${filePath}`);
    
    // Replace the problematic pattern
    const fixedContent = content.replace(
      /if \(process\.env\.NODE_ENV === 'production' && process\.env\.VERCEL === '1' && !process\.env\.DATABASE_URL\)/g,
      'if (process.env.NEXT_PHASE === \'phase-production-build\')'
    );
    
    // Write the fixed content back
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ Fixed: ${filePath}`);
    fixedCount++;
  }
});

console.log(`\n📊 Results:`);
console.log(`   Total route files: ${totalCount}`);
console.log(`   Files fixed: ${fixedCount}`);
console.log(`   Files unchanged: ${totalCount - fixedCount}`);

if (fixedCount > 0) {
  console.log(`\n🎉 Successfully fixed ${fixedCount} API routes!`);
  console.log(`\n📋 What was changed:`);
  console.log(`   Before: if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL)`);
  console.log(`   After:  if (process.env.NEXT_PHASE === 'phase-production-build')`);
  console.log(`\n💡 This change ensures API routes only skip during build time,`);
  console.log(`   not during runtime in production.`);
} else {
  console.log(`\n✅ No files needed fixing.`);
}
