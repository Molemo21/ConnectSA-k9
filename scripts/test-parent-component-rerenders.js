#!/usr/bin/env node

/**
 * Parent Component Re-render Test
 * 
 * This script analyzes the provider dashboard (parent component)
 * to identify patterns that could cause the BankDetailsForm to re-render infinitely.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PARENT COMPONENT RE-RENDER ANALYSIS');
console.log('=====================================');

// Read the parent component (provider dashboard)
const parentComponentPath = path.join(__dirname, '..', 'components', 'provider', 'provider-dashboard-unified.tsx');

console.log('\n📋 Reading parent component file...');
console.log(`Path: ${parentComponentPath}`);

if (!fs.existsSync(parentComponentPath)) {
  console.log('❌ Parent component file not found!');
  process.exit(1);
}

const parentCode = fs.readFileSync(parentComponentPath, 'utf8');
console.log(`✅ Parent component file read successfully (${parentCode.length} characters)`);

// Analyze patterns that could cause child re-renders
console.log('\n📋 PARENT RE-RENDER TRIGGER ANALYSIS');
console.log('====================================');

const reRenderTriggers = [
  {
    pattern: /checkBankDetails\s*\(/g,
    description: 'checkBankDetails function calls',
    risk: 'HIGH',
    explanation: 'Could trigger state updates that cause BankDetailsForm re-renders'
  },
  {
    pattern: /setDashboardState\s*\(/g,
    description: 'Dashboard state updates',
    risk: 'MEDIUM',
    explanation: 'State updates could trigger child component re-renders'
  },
  {
    pattern: /onBankDetailsChange.*=>/g,
    description: 'Inline callback definitions',
    risk: 'CRITICAL',
    explanation: 'Inline callbacks create new functions on every render'
  },
  {
    pattern: /handleBankDetailsChange/g,
    description: 'Bank details change handler',
    risk: 'MEDIUM',
    explanation: 'Handler function could trigger re-renders if not memoized'
  },
  {
    pattern: /useCallback.*handleBankDetailsChange/gs,
    description: 'Memoized bank details handler',
    risk: 'LOW',
    explanation: 'useCallback should prevent function recreation'
  },
  {
    pattern: /initialBankDetails.*dashboardState/g,
    description: 'Props derived from dashboard state',
    risk: 'HIGH',
    explanation: 'Props that change frequently could trigger child re-renders'
  },
  {
    pattern: /BankDetailsForm[^>]*initialBankDetails=\{[^}]*}/g,
    description: 'BankDetailsForm prop passing',
    risk: 'MEDIUM',
    explanation: 'How props are passed affects re-render behavior'
  },
  {
    pattern: /useEffect.*checkBankDetails/gs,
    description: 'useEffect calling checkBankDetails',
    risk: 'HIGH',
    explanation: 'Could create loops if checkBankDetails triggers re-renders'
  },
  {
    pattern: /fetchProviderData.*checkBankDetails/gs,
    description: 'Data fetching triggering bank details check',
    risk: 'MEDIUM',
    explanation: 'Data fetching could trigger state updates'
  }
];

console.log('\n🔍 Scanning for re-render triggers...');

let criticalTriggers = 0;
let highRiskTriggers = 0;
let mediumRiskTriggers = 0;

reRenderTriggers.forEach((check, index) => {
  const matches = parentCode.match(check.pattern);
  
  console.log(`\n${index + 1}. ${check.description}`);
  console.log(`   Risk Level: ${check.risk}`);
  console.log(`   Explanation: ${check.explanation}`);
  
  if (matches && matches.length > 0) {
    console.log(`   🚨 FOUND ${matches.length} occurrence(s):`);
    matches.forEach((match, i) => {
      console.log(`      ${i + 1}. ${match.substring(0, 100)}${match.length > 100 ? '...' : ''}`);
    });
    
    if (check.risk === 'CRITICAL') {
      criticalTriggers += matches.length;
    } else if (check.risk === 'HIGH') {
      highRiskTriggers += matches.length;
    } else if (check.risk === 'MEDIUM') {
      mediumRiskTriggers += matches.length;
    }
  } else {
    console.log(`   ✅ No instances found`);
  }
});

// Analyze how BankDetailsForm is rendered
console.log('\n📋 BANKDETAILSFORM RENDERING ANALYSIS');
console.log('====================================');

const bankFormMatches = parentCode.match(/<BankDetailsForm[^>]*>/gs);
if (bankFormMatches) {
  console.log(`Found ${bankFormMatches.length} BankDetailsForm rendering(s):`);
  
  bankFormMatches.forEach((match, index) => {
    console.log(`\n${index + 1}. BankDetailsForm usage:`);
    console.log(`   ${match}`);
    
    // Check for dangerous prop patterns
    if (match.includes('onBankDetailsChange={')) {
      if (match.includes('=>') || match.includes('()')) {
        console.log('   🚨 CRITICAL: Inline callback prop detected!');
      } else if (match.includes('handleBankDetailsChange')) {
        console.log('   ⚠️  MEDIUM: Named callback prop (check if memoized)');
      } else {
        console.log('   ℹ️  Callback prop detected');
      }
    } else {
      console.log('   ✅ No callback prop');
    }
    
    if (match.includes('initialBankDetails={')) {
      if (match.includes('dashboardState.data')) {
        console.log('   ⚠️  MEDIUM: Props derived from state');
      } else {
        console.log('   ℹ️  Initial bank details prop detected');
      }
    }
  });
} else {
  console.log('No BankDetailsForm usage found');
}

// Analyze state management patterns
console.log('\n📋 STATE MANAGEMENT ANALYSIS');
console.log('============================');

const statePatterns = [
  {
    pattern: /const\s+\[dashboardState,\s*setDashboardState\]\s*=\s*useState/g,
    description: 'Dashboard state definition',
    analysis: 'Check initial state and update patterns'
  },
  {
    pattern: /setDashboardState\s*\(\s*prev\s*=>/g,
    description: 'Functional state updates',
    analysis: 'Good pattern - prevents stale closure issues'
  },
  {
    pattern: /setDashboardState\s*\(\s*\{/g,
    description: 'Direct state updates',
    analysis: 'Could cause issues if not spreading previous state'
  },
  {
    pattern: /dashboardState\.data\.bankDetails/g,
    description: 'Bank details access from state',
    analysis: 'Check if this changes frequently causing re-renders'
  }
];

console.log('\n🔍 Analyzing state management patterns...');

statePatterns.forEach((pattern, index) => {
  const matches = parentCode.match(pattern.pattern);
  console.log(`\n${index + 1}. ${pattern.description}`);
  console.log(`   Analysis: ${pattern.analysis}`);
  
  if (matches && matches.length > 0) {
    console.log(`   ✅ Found ${matches.length} occurrence(s)`);
    matches.slice(0, 3).forEach((match, i) => {
      console.log(`      ${i + 1}. ${match.substring(0, 80)}${match.length > 80 ? '...' : ''}`);
    });
    if (matches.length > 3) {
      console.log(`      ... and ${matches.length - 3} more`);
    }
  } else {
    console.log(`   ❌ No instances found`);
  }
});

// Check useEffect patterns in parent
console.log('\n📋 PARENT useEffect ANALYSIS');
console.log('============================');

const parentEffectMatches = parentCode.match(/useEffect\s*\([^}]*}\s*,\s*\[[^\]]*\]/gs);
if (parentEffectMatches) {
  console.log(`Found ${parentEffectMatches.length} useEffect calls in parent:`);
  
  parentEffectMatches.forEach((match, index) => {
    console.log(`\n${index + 1}. useEffect analysis:`);
    
    // Extract dependency array
    const depsMatch = match.match(/\[([^\]]*)\]/);
    if (depsMatch) {
      const deps = depsMatch[1].trim();
      console.log(`   Dependencies: [${deps}]`);
      
      // Check for dangerous patterns
      if (deps.includes('dashboardState')) {
        console.log('   🚨 CRITICAL: Depends on dashboardState!');
      } else if (deps.includes('checkBankDetails')) {
        console.log('   ⚠️  HIGH: Depends on checkBankDetails function');
      } else if (deps === '') {
        console.log('   ✅ Empty deps - runs once');
      } else {
        console.log('   ℹ️  Custom dependencies');
      }
      
      // Check if it calls checkBankDetails
      if (match.includes('checkBankDetails')) {
        console.log('   🚨 CRITICAL: Calls checkBankDetails in effect!');
      }
    }
  });
} else {
  console.log('No useEffect calls found in parent');
}

// Analyze callback memoization
console.log('\n📋 CALLBACK MEMOIZATION ANALYSIS');
console.log('================================');

const callbackPatterns = [
  {
    pattern: /useCallback\s*\(\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*checkBankDetails[^}]*\}/gs,
    description: 'checkBankDetails useCallback',
    importance: 'CRITICAL'
  },
  {
    pattern: /const\s+handleBankDetailsChange\s*=\s*useCallback/g,
    description: 'handleBankDetailsChange memoization',
    importance: 'HIGH'
  },
  {
    pattern: /useCallback\s*\([^,]*,\s*\[\s*\]/g,
    description: 'useCallback with empty dependencies',
    importance: 'GOOD'
  },
  {
    pattern: /useCallback\s*\([^,]*,\s*\[[^\]]*dashboardState[^\]]*\]/g,
    description: 'useCallback depending on dashboardState',
    importance: 'DANGEROUS'
  }
];

callbackPatterns.forEach((pattern, index) => {
  const matches = parentCode.match(pattern.pattern);
  console.log(`\n${index + 1}. ${pattern.description}`);
  console.log(`   Importance: ${pattern.importance}`);
  
  if (matches && matches.length > 0) {
    console.log(`   ✅ Found ${matches.length} occurrence(s)`);
    if (pattern.importance === 'DANGEROUS') {
      console.log(`   🚨 WARNING: This pattern can cause infinite loops`);
    } else if (pattern.importance === 'CRITICAL' || pattern.importance === 'HIGH') {
      console.log(`   ℹ️  This is important for preventing re-renders`);
    } else {
      console.log(`   ✅ Good pattern detected`);
    }
  } else {
    console.log(`   ❌ No instances found`);
    if (pattern.importance === 'CRITICAL' || pattern.importance === 'HIGH') {
      console.log(`   ⚠️  Missing important memoization`);
    }
  }
});

// Generate findings summary
console.log('\n📊 PARENT COMPONENT ANALYSIS SUMMARY');
console.log('====================================');

console.log(`\n🚨 Re-render triggers found:`);
console.log(`   Critical: ${criticalTriggers}`);
console.log(`   High Risk: ${highRiskTriggers}`);
console.log(`   Medium Risk: ${mediumRiskTriggers}`);

console.log('\n🔍 KEY FINDINGS:');

if (criticalTriggers > 0) {
  console.log('1. 🚨 CRITICAL: Inline callback props detected');
  console.log('   - These create new functions on every parent render');
  console.log('   - This triggers child useEffect that depends on the callback');
  console.log('   - This is likely the root cause of React Error #185');
}

if (highRiskTriggers > 0) {
  console.log('2. ⚠️  HIGH RISK: Parent state updates affecting child props');
  console.log('   - Check if bank details props change frequently');
  console.log('   - Verify if checkBankDetails is being called in loops');
}

if (mediumRiskTriggers > 0) {
  console.log('3. ⚠️  MEDIUM RISK: State management patterns detected');
  console.log('   - Review state update frequency and patterns');
  console.log('   - Consider memoizing expensive calculations');
}

console.log('\n💡 RECOMMENDATIONS:');

console.log('1. ✅ Remove all callback props from BankDetailsForm');
console.log('2. ✅ Use useCallback for all handler functions');
console.log('3. ✅ Avoid inline prop definitions');
console.log('4. ✅ Memoize props derived from state with useMemo');
console.log('5. ✅ Check if checkBankDetails needs to run so frequently');
console.log('6. ✅ Consider moving bank details state to a context');

console.log('\n🎯 IMMEDIATE ACTION ITEMS:');

if (criticalTriggers > 0) {
  console.log('1. 🚨 URGENT: Remove onBankDetailsChange prop from BankDetailsForm');
  console.log('2. 🚨 URGENT: Make BankDetailsForm completely self-contained');
}

console.log('3. ⚠️  Wrap checkBankDetails in useCallback with proper dependencies');
console.log('4. ⚠️  Add defensive checks to prevent unnecessary state updates');
console.log('5. ⚠️  Consider debouncing checkBankDetails calls');

console.log('\n✅ Parent component analysis complete!');
console.log('This analysis identifies parent-side causes of the infinite render loop.');
