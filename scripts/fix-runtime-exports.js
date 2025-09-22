#!/usr/bin/env node

/**
 * Script to fix files where export const runtime is in the wrong position
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/payment/verify/route.ts',
  'app/api/bookings/sync/route.ts',
  'app/api/book-service/[id]/review/route.ts',
  'app/api/book-service/[id]/reschedule/route.ts',
  'app/api/book-service/[id]/release-escrow/route.ts',
  'app/api/book-service/[id]/pay/route.ts',
  'app/api/book-service/[id]/accept/route.ts',
  'app/api/book-service/send-offer/route.ts',
  'app/api/book-service/route.ts',
  'app/api/admin/webhook-events/route.ts',
  'app/api/admin/users/[id]/route.ts'
];

function fixRuntimeExport(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has the runtime export in the wrong position
    if (content.startsWith('export const runtime')) {
      const lines = content.split('\n');
      let runtimeLine = '';
      let importLines = [];
      let otherLines = [];
      
      // Separate the lines
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('export const runtime')) {
          runtimeLine = lines[i];
        } else if (lines[i].trim().startsWith('import ')) {
          importLines.push(lines[i]);
        } else {
          otherLines.push(lines[i]);
        }
      }
      
      // Reconstruct the file with proper order
      const newContent = [
        ...importLines,
        '',
        '// Force dynamic rendering to prevent build-time static generation',
        'export const dynamic = \'force-dynamic\'',
        runtimeLine,
        '',
        ...otherLines.filter(line => !line.includes('export const dynamic'))
      ].join('\n');
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`✅ Already correct: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing runtime export positions...\n');
  
  let successCount = 0;
  let totalCount = filesToFix.length;
  
  for (const file of filesToFix) {
    if (fixRuntimeExport(file)) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} files fixed`);
  
  if (successCount === totalCount) {
    console.log('🎉 All runtime exports fixed successfully!');
  }
}

main();
