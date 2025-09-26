#!/usr/bin/env node

/**
 * Current Component State Test
 * 
 * This script analyzes the current BankDetailsForm component
 * to identify the exact source of React Error #185.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CURRENT COMPONENT STATE ANALYSIS');
console.log('===================================');

// Read the current BankDetailsForm component
const componentPath = path.join(__dirname, '..', 'components', 'provider', 'bank-details-form.tsx');

console.log('\n📋 Reading current component file...');
console.log(`Path: ${componentPath}`);

if (!fs.existsSync(componentPath)) {
  console.log('❌ Component file not found!');
  process.exit(1);
}

const componentCode = fs.readFileSync(componentPath, 'utf8');
console.log(`✅ Component file read successfully (${componentCode.length} characters)`);

// Analyze the component code
console.log('\n📋 CODE ANALYSIS');
console.log('================');

// Check for dangerous patterns
const dangerousPatterns = [
  {
    pattern: /useEffect\([^,]*,\s*\[[^\]]*useState[^\]]*\]/g,
    description: 'useEffect with state dependencies',
    risk: 'CRITICAL',
    explanation: 'This pattern can cause infinite loops'
  },
  {
    pattern: /useEffect\([^,]*,\s*\[[^\]]*bankDetails[^\]]*\]/g,
    description: 'useEffect depending on bankDetails state',
    risk: 'CRITICAL',
    explanation: 'This will cause infinite re-renders'
  },
  {
    pattern: /useEffect\([^,]*,\s*\[[^\]]*initialBankDetails[^\]]*\]/g,
    description: 'useEffect depending on initialBankDetails prop',
    risk: 'HIGH',
    explanation: 'This can cause loops if prop reference changes'
  },
  {
    pattern: /setBankDetails.*useEffect/gs,
    description: 'setState call inside useEffect',
    risk: 'HIGH',
    explanation: 'This can trigger re-renders leading to loops'
  },
  {
    pattern: /onBankDetailsChange.*\(\)/g,
    description: 'Callback invocation',
    risk: 'MEDIUM',
    explanation: 'Callbacks can trigger parent re-renders'
  },
  {
    pattern: /useMemo\([^,]*,\s*\[[^\]]*initialBankDetails[^\]]*\]/g,
    description: 'useMemo depending on initialBankDetails',
    risk: 'MEDIUM',
    explanation: 'Can cause recalculation on every render'
  }
];

console.log('\n🔍 Scanning for dangerous patterns...');

let criticalIssuesFound = 0;
let highRiskIssuesFound = 0;
let mediumRiskIssuesFound = 0;

dangerousPatterns.forEach((check, index) => {
  const matches = componentCode.match(check.pattern);
  
  console.log(`\n${index + 1}. ${check.description}`);
  console.log(`   Risk Level: ${check.risk}`);
  console.log(`   Explanation: ${check.explanation}`);
  
  if (matches && matches.length > 0) {
    console.log(`   🚨 FOUND ${matches.length} occurrence(s):`);
    matches.forEach((match, i) => {
      console.log(`      ${i + 1}. ${match.substring(0, 100)}${match.length > 100 ? '...' : ''}`);
    });
    
    if (check.risk === 'CRITICAL') {
      criticalIssuesFound += matches.length;
    } else if (check.risk === 'HIGH') {
      highRiskIssuesFound += matches.length;
    } else if (check.risk === 'MEDIUM') {
      mediumRiskIssuesFound += matches.length;
    }
  } else {
    console.log(`   ✅ No instances found`);
  }
});

// Analyze useState patterns
console.log('\n📋 useState PATTERNS ANALYSIS');
console.log('=============================');

const useStateMatches = componentCode.match(/useState\s*\([^)]*\)/g);
if (useStateMatches) {
  console.log(`Found ${useStateMatches.length} useState calls:`);
  useStateMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match}`);
    
    if (match.includes('=>') || match.includes('function')) {
      console.log('   ✅ Uses function initializer (good for performance)');
    } else {
      console.log('   ℹ️  Uses direct value initializer');
    }
  });
} else {
  console.log('No useState calls found');
}

// Analyze useEffect patterns
console.log('\n📋 useEffect PATTERNS ANALYSIS');
console.log('==============================');

const useEffectMatches = componentCode.match(/useEffect\s*\([^}]*}\s*,\s*\[[^\]]*\]/gs);
if (useEffectMatches) {
  console.log(`Found ${useEffectMatches.length} useEffect calls:`);
  useEffectMatches.forEach((match, index) => {
    console.log(`\n${index + 1}. useEffect dependencies analysis:`);
    
    // Extract dependency array
    const depsMatch = match.match(/\[([^\]]*)\]/);
    if (depsMatch) {
      const deps = depsMatch[1].trim();
      console.log(`   Dependencies: [${deps}]`);
      
      if (deps === '') {
        console.log('   ✅ Empty dependency array - runs once on mount');
      } else if (deps.includes('bankDetails')) {
        console.log('   🚨 CRITICAL: Depends on bankDetails state!');
      } else if (deps.includes('initialBankDetails')) {
        console.log('   ⚠️  HIGH RISK: Depends on initialBankDetails prop');
      } else if (deps.includes('onBankDetailsChange')) {
        console.log('   ⚠️  MEDIUM RISK: Depends on callback prop');
      } else {
        console.log('   ℹ️  Custom dependencies detected');
      }
    } else {
      console.log('   🚨 CRITICAL: No dependency array - runs on every render!');
    }
  });
} else {
  console.log('No useEffect calls found');
}

// Check for React Strict Mode
console.log('\n📋 REACT STRICT MODE CHECK');
console.log('==========================');

const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  const strictModeMatch = nextConfig.match(/reactStrictMode\s*:\s*(true|false)/);
  
  if (strictModeMatch) {
    const isStrictMode = strictModeMatch[1] === 'true';
    console.log(`React Strict Mode: ${isStrictMode ? 'ENABLED' : 'DISABLED'}`);
    
    if (isStrictMode) {
      console.log('⚠️  Strict Mode causes components to mount twice in development');
      console.log('   This can expose infinite loop issues more easily');
    } else {
      console.log('✅ Strict Mode is disabled');
    }
  } else {
    console.log('React Strict Mode setting not found in config');
  }
} else {
  console.log('next.config.mjs not found');
}

// Check component structure
console.log('\n📋 COMPONENT STRUCTURE ANALYSIS');
console.log('===============================');

const componentLines = componentCode.split('\n');
const totalLines = componentLines.length;

console.log(`Total lines: ${totalLines}`);
console.log(`File size: ${componentCode.length} characters`);

// Count various elements
const hookCounts = {
  useState: (componentCode.match(/useState/g) || []).length,
  useEffect: (componentCode.match(/useEffect/g) || []).length,
  useRef: (componentCode.match(/useRef/g) || []).length,
  useCallback: (componentCode.match(/useCallback/g) || []).length,
  useMemo: (componentCode.match(/useMemo/g) || []).length
};

console.log('\nHook usage:');
Object.entries(hookCounts).forEach(([hook, count]) => {
  console.log(`  ${hook}: ${count} times`);
});

// Check for error boundaries
const hasErrorBoundary = componentCode.includes('try') && componentCode.includes('catch');
console.log(`\nError handling: ${hasErrorBoundary ? '✅ Has try-catch blocks' : '❌ No error handling found'}`);

// Generate recommendations
console.log('\n📊 ANALYSIS SUMMARY');
console.log('==================');

console.log(`\n🚨 Issues found:`);
console.log(`   Critical: ${criticalIssuesFound}`);
console.log(`   High Risk: ${highRiskIssuesFound}`);
console.log(`   Medium Risk: ${mediumRiskIssuesFound}`);

if (criticalIssuesFound > 0) {
  console.log('\n🚨 CRITICAL ISSUES DETECTED!');
  console.log('These patterns are known to cause React Error #185');
  console.log('Immediate action required to fix infinite render loops');
} else if (highRiskIssuesFound > 0) {
  console.log('\n⚠️  HIGH RISK PATTERNS DETECTED!');
  console.log('These patterns could cause React Error #185 under certain conditions');
} else if (mediumRiskIssuesFound > 0) {
  console.log('\n⚠️  MEDIUM RISK PATTERNS DETECTED!');
  console.log('These patterns should be monitored for potential issues');
} else {
  console.log('\n✅ NO DANGEROUS PATTERNS DETECTED!');
  console.log('The component structure looks safe from a static analysis perspective');
}

console.log('\n💡 RECOMMENDATIONS:');

if (criticalIssuesFound > 0) {
  console.log('1. 🚨 URGENT: Remove state dependencies from useEffect');
  console.log('2. 🚨 URGENT: Avoid setState calls inside useEffect that depend on that state');
  console.log('3. 🚨 URGENT: Use refs instead of state for values that trigger effects');
}

if (highRiskIssuesFound > 0) {
  console.log('4. ⚠️  Use useCallback to stabilize prop dependencies');
  console.log('5. ⚠️  Consider using useRef for prop values that don\'t need re-renders');
  console.log('6. ⚠️  Minimize object prop dependencies in useEffect');
}

console.log('7. ✅ Always use dependency arrays with useEffect');
console.log('8. ✅ Consider using useState function initializers for complex state');
console.log('9. ✅ Add comprehensive error boundaries');
console.log('10. ✅ Test with React Strict Mode disabled during debugging');

console.log('\n✅ Analysis complete!');
console.log('Review the findings above to identify the root cause of React Error #185.');
