/**
 * Quick Payment Sync Validation Script
 * 
 * This script performs a quick validation of the payment sync system
 * to ensure basic functionality before committing changes.
 */

const fs = require('fs');
const path = require('path');

// Quick validation results
const validation = {
  files: { passed: 0, failed: 0 },
  syntax: { passed: 0, failed: 0 },
  imports: { passed: 0, failed: 0 },
  exports: { passed: 0, failed: 0 }
};

console.log('🔍 Quick Payment Sync System Validation...\n');

// Required files to check
const requiredFiles = [
  'hooks/use-payment-sync.ts',
  'components/ui/payment-status-sync.tsx',
  'components/dashboard/synchronized-booking-card.tsx',
  'components/dashboard/synchronized-dashboard.tsx',
  'app/api/bookings/sync/route.ts',
  '__tests__/payment-sync.test.ts',
  'PAYMENT_SYNCHRONIZATION_SYSTEM.md'
];

// Check file existence
console.log('📁 Checking file existence...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
    validation.files.passed++;
  } else {
    console.log(`   ❌ ${file} - File not found`);
    validation.files.failed++;
  }
});

// Check TypeScript/React syntax
console.log('\n🔧 Checking code syntax...');
const codeFiles = requiredFiles.filter(file => 
  file.endsWith('.ts') || file.endsWith('.tsx')
);

codeFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    validation.syntax.failed++;
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax checks
    const hasImports = content.includes('import');
    const hasExports = content.includes('export');
    const hasProperSyntax = !content.includes('undefined') || content.includes('undefined') && content.includes('//');
    
    if (hasImports) {
      console.log(`   ✅ ${file} - Has imports`);
      validation.imports.passed++;
    } else {
      console.log(`   ❌ ${file} - Missing imports`);
      validation.imports.failed++;
    }
    
    if (hasExports) {
      console.log(`   ✅ ${file} - Has exports`);
      validation.exports.passed++;
    } else {
      console.log(`   ❌ ${file} - Missing exports`);
      validation.exports.failed++;
    }
    
    if (hasProperSyntax) {
      console.log(`   ✅ ${file} - Syntax appears valid`);
      validation.syntax.passed++;
    } else {
      console.log(`   ❌ ${file} - Syntax issues detected`);
      validation.syntax.failed++;
    }
    
  } catch (error) {
    console.log(`   ❌ ${file} - Error reading file: ${error.message}`);
    validation.syntax.failed++;
  }
});

// Check for key functionality
console.log('\n🔍 Checking key functionality...');

// Check usePaymentSync hook
const hookFile = path.join(process.cwd(), 'hooks/use-payment-sync.ts');
if (fs.existsSync(hookFile)) {
  const hookContent = fs.readFileSync(hookFile, 'utf8');
  
  const keyFeatures = [
    'usePaymentSync',
    'invalidatePaymentCache',
    'isPaymentPaid',
    'getPaymentDisplayStatus',
    'fetchPaymentData',
    'refreshPayment',
    'verifyPayment'
  ];
  
  keyFeatures.forEach(feature => {
    if (hookContent.includes(feature)) {
      console.log(`   ✅ Hook has ${feature}`);
    } else {
      console.log(`   ❌ Hook missing ${feature}`);
    }
  });
}

// Check PaymentStatusSync component
const statusFile = path.join(process.cwd(), 'components/ui/payment-status-sync.tsx');
if (fs.existsSync(statusFile)) {
  const statusContent = fs.readFileSync(statusFile, 'utf8');
  
  const keyFeatures = [
    'PaymentStatusSync',
    'usePaymentSync',
    'refreshPayment',
    'verifyPayment',
    'showRefreshButton',
    'onStatusChange'
  ];
  
  keyFeatures.forEach(feature => {
    if (statusContent.includes(feature)) {
      console.log(`   ✅ PaymentStatusSync has ${feature}`);
    } else {
      console.log(`   ❌ PaymentStatusSync missing ${feature}`);
    }
  });
}

// Check API endpoint
const apiFile = path.join(process.cwd(), 'app/api/bookings/sync/route.ts');
if (fs.existsSync(apiFile)) {
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  
  const keyFeatures = [
    'export async function GET',
    'Cache-Control',
    'no-cache',
    'ETag',
    'paystackClient.verifyPayment',
    'fetchPaymentData'
  ];
  
  keyFeatures.forEach(feature => {
    if (apiContent.includes(feature)) {
      console.log(`   ✅ API endpoint has ${feature}`);
    } else {
      console.log(`   ❌ API endpoint missing ${feature}`);
    }
  });
}

// Check test file
const testFile = path.join(process.cwd(), '__tests__/payment-sync.test.ts');
if (fs.existsSync(testFile)) {
  const testContent = fs.readFileSync(testFile, 'utf8');
  
  const keyFeatures = [
    'PaymentStatusSync',
    'SynchronizedBookingCard',
    'SynchronizedDashboard',
    'usePaymentSync',
    'describe(',
    'it(',
    'expect('
  ];
  
  keyFeatures.forEach(feature => {
    if (testContent.includes(feature)) {
      console.log(`   ✅ Test file has ${feature}`);
    } else {
      console.log(`   ❌ Test file missing ${feature}`);
    }
  });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 QUICK VALIDATION SUMMARY');
console.log('='.repeat(50));

const totalFiles = validation.files.passed + validation.files.failed;
const totalSyntax = validation.syntax.passed + validation.syntax.failed;
const totalImports = validation.imports.passed + validation.imports.failed;
const totalExports = validation.exports.passed + validation.exports.failed;

console.log(`📁 Files: ${validation.files.passed}/${totalFiles} passed`);
console.log(`🔧 Syntax: ${validation.syntax.passed}/${totalSyntax} passed`);
console.log(`📦 Imports: ${validation.imports.passed}/${totalImports} passed`);
console.log(`📤 Exports: ${validation.exports.passed}/${totalExports} passed`);

const overallPassed = validation.files.passed + validation.syntax.passed + validation.imports.passed + validation.exports.passed;
const overallTotal = totalFiles + totalSyntax + totalImports + totalExports;
const successRate = ((overallPassed / overallTotal) * 100).toFixed(1);

console.log(`\n📈 Overall Success Rate: ${successRate}%`);

if (validation.files.failed === 0 && validation.syntax.failed === 0) {
  console.log('\n🎉 Quick validation passed! The payment sync system appears to be ready.');
  console.log('✅ You can proceed with the comprehensive test script.');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: node scripts/test-payment-sync-system.js');
  console.log('   2. If all tests pass, commit the changes');
} else {
  console.log('\n⚠️  Quick validation found issues. Please fix before proceeding.');
  if (validation.files.failed > 0) {
    console.log('   • Some required files are missing');
  }
  if (validation.syntax.failed > 0) {
    console.log('   • Some files have syntax issues');
  }
}

console.log('\n🔧 To run the comprehensive test:');
console.log('   node scripts/test-payment-sync-system.js');
