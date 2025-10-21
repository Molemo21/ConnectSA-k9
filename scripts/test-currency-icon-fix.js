#!/usr/bin/env node

/**
 * Currency Icon Fix Test
 * Verifies that DollarSign icons have been replaced with Rand symbols
 */

const fs = require('fs');
const path = require('path');

function testCurrencyIconFix() {
  console.log('🧪 Testing Currency Icon Fix...\n');

  const filesToCheck = [
    'components/provider/catalogue-manager.tsx',
    'components/provider/provider-catalogue-dashboard.tsx',
    'components/provider/catalogue-item-form.tsx'
  ];

  let totalDollarSignFound = 0;
  let totalRandSymbolFound = 0;

  filesToCheck.forEach(filePath => {
    console.log(`📄 Checking ${filePath}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Count DollarSign occurrences
      const dollarSignMatches = content.match(/DollarSign/g);
      const dollarSignCount = dollarSignMatches ? dollarSignMatches.length : 0;
      
      // Count Rand symbol occurrences
      const randSymbolMatches = content.match(/<span className="text-sm font-bold text-green-400">R<\/span>/g);
      const randSymbolCount = randSymbolMatches ? randSymbolMatches.length : 0;
      
      // Count Rand symbol in dashboard
      const randDashboardMatches = content.match(/<span className="text-lg font-bold text-yellow-400">R<\/span>/g);
      const randDashboardCount = randDashboardMatches ? randDashboardMatches.length : 0;
      
      const totalRandInFile = randSymbolCount + randDashboardCount;
      
      console.log(`   💰 DollarSign icons: ${dollarSignCount}`);
      console.log(`   🇿🇦 Rand symbols: ${totalRandInFile}`);
      
      if (dollarSignCount === 0 && totalRandInFile > 0) {
        console.log(`   ✅ Currency icons fixed successfully`);
      } else if (dollarSignCount > 0) {
        console.log(`   ⚠️  Still has ${dollarSignCount} DollarSign icons`);
      } else {
        console.log(`   ❌ No currency symbols found`);
      }
      
      totalDollarSignFound += dollarSignCount;
      totalRandSymbolFound += totalRandInFile;
      
    } catch (error) {
      console.log(`   ❌ Error reading file: ${error.message}`);
    }
    
    console.log('');
  });

  console.log('📊 Summary:');
  console.log(`   💰 Total DollarSign icons found: ${totalDollarSignFound}`);
  console.log(`   🇿🇦 Total Rand symbols found: ${totalRandSymbolFound}`);
  
  if (totalDollarSignFound === 0 && totalRandSymbolFound > 0) {
    console.log('\n🎉 Currency icon fix completed successfully!');
    console.log('✅ All DollarSign icons replaced with Rand symbols');
    console.log('✅ Currency consistency maintained across all components');
  } else if (totalDollarSignFound > 0) {
    console.log('\n⚠️  Some DollarSign icons still remain');
    console.log('❌ Currency fix incomplete');
  } else {
    console.log('\n❌ No currency symbols found');
    console.log('❌ Currency fix may have removed all symbols');
  }

  console.log('\n📋 Expected Results:');
  console.log('   • Catalogue cards show "R" instead of "$"');
  console.log('   • Revenue stats show "R" instead of "$"');
  console.log('   • Form labels show "R" instead of "$"');
  console.log('   • Visual consistency with ZAR currency');
}

// Run the test
testCurrencyIconFix();

