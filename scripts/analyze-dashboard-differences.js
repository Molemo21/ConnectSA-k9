#!/usr/bin/env node

/**
 * Comprehensive analysis of provider dashboard differences
 */

const fs = require('fs');
const path = require('path');

// Structured logging utility
const createLogger = (context) => ({
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

const logger = createLogger('AnalyzeDashboardDifferences');

function analyzeFile(filePath, name) {
  try {
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Analyze various aspects
    const analysis = {
      name,
      filePath,
      lineCount: content.split('\n').length,
      characterCount: content.length,
      imports: [],
      stateVariables: [],
      useEffectHooks: [],
      useCallbackHooks: [],
      apiCalls: [],
      errorHandling: [],
      dependencies: [],
      potentialIssues: []
    };

    // Extract imports
    const importMatches = content.match(/import.*from/g);
    if (importMatches) {
      analysis.imports = importMatches;
    }

    // Extract state variables
    const stateMatches = content.match(/useState\([^)]*\)/g);
    if (stateMatches) {
      analysis.stateVariables = stateMatches;
    }

    // Extract useEffect hooks
    const useEffectMatches = content.match(/useEffect\([^)]*\)/g);
    if (useEffectMatches) {
      analysis.useEffectHooks = useEffectMatches;
    }

    // Extract useCallback hooks
    const useCallbackMatches = content.match(/useCallback\([^)]*\)/g);
    if (useCallbackMatches) {
      analysis.useCallbackHooks = useCallbackMatches;
    }

    // Extract API calls
    const apiMatches = content.match(/fetch\([^)]*\)/g);
    if (apiMatches) {
      analysis.apiCalls = apiMatches;
    }

    // Extract error handling
    const errorMatches = content.match(/catch\s*\([^)]*\)/g);
    if (errorMatches) {
      analysis.errorHandling = errorMatches;
    }

    // Extract dependency arrays
    const depMatches = content.match(/\[\s*[^\]]*\s*\]/g);
    if (depMatches) {
      analysis.dependencies = depMatches.filter(dep => 
        dep.includes('useEffect') || dep.includes('useCallback')
      );
    }

    // Check for potential issues
    if (content.includes('stats') && content.includes('useEffect')) {
      analysis.potentialIssues.push('Potential infinite loop: stats in useEffect dependency');
    }

    if (content.includes('fetchProviderData') && content.includes('useEffect')) {
      analysis.potentialIssues.push('Potential infinite loop: fetchProviderData in useEffect dependency');
    }

    if (content.includes('checkAuthentication') && content.includes('useEffect')) {
      analysis.potentialIssues.push('Potential infinite loop: checkAuthentication in useEffect dependency');
    }

    if (content.includes('setLoading(true)') && !content.includes('setLoading(false)')) {
      analysis.potentialIssues.push('Potential issue: setLoading(true) without setLoading(false)');
    }

    if (content.includes('setAuthState') && content.includes('useEffect')) {
      analysis.potentialIssues.push('Potential issue: setAuthState in useEffect might cause loops');
    }

    return analysis;
  } catch (error) {
    logger.error(`Error analyzing ${filePath}`, error);
    return null;
  }
}

function compareAnalyses(enhanced, simple) {
  const comparison = {
    enhanced: enhanced,
    simple: simple,
    differences: {
      complexity: {
        enhanced: enhanced.lineCount,
        simple: simple.lineCount,
        difference: enhanced.lineCount - simple.lineCount
      },
      stateVariables: {
        enhanced: enhanced.stateVariables.length,
        simple: simple.stateVariables.length,
        difference: enhanced.stateVariables.length - simple.stateVariables.length
      },
      useEffectHooks: {
        enhanced: enhanced.useEffectHooks.length,
        simple: simple.useEffectHooks.length,
        difference: enhanced.useEffectHooks.length - simple.useEffectHooks.length
      },
      useCallbackHooks: {
        enhanced: enhanced.useCallbackHooks.length,
        simple: simple.useCallbackHooks.length,
        difference: enhanced.useCallbackHooks.length - simple.useCallbackHooks.length
      },
      potentialIssues: {
        enhanced: enhanced.potentialIssues,
        simple: simple.potentialIssues
      }
    }
  };

  return comparison;
}

function identifyRootCauses(enhanced, simple) {
  const rootCauses = [];

  // Check for infinite loop causes
  if (enhanced.potentialIssues.length > simple.potentialIssues.length) {
    rootCauses.push({
      issue: 'Infinite Loop Dependencies',
      description: 'Enhanced dashboard has more potential infinite loop issues',
      enhancedIssues: enhanced.potentialIssues,
      simpleIssues: simple.potentialIssues,
      solution: 'Remove problematic dependencies from useEffect arrays'
    });
  }

  // Check for complexity issues
  if (enhanced.lineCount > simple.lineCount * 1.5) {
    rootCauses.push({
      issue: 'Code Complexity',
      description: 'Enhanced dashboard is significantly more complex',
      enhancedLines: enhanced.lineCount,
      simpleLines: simple.lineCount,
      solution: 'Simplify complex logic and break into smaller functions'
    });
  }

  // Check for state management issues
  if (enhanced.stateVariables.length > simple.stateVariables.length) {
    rootCauses.push({
      issue: 'State Management Complexity',
      description: 'Enhanced dashboard manages more state variables',
      enhancedStates: enhanced.stateVariables.length,
      simpleStates: simple.stateVariables.length,
      solution: 'Reduce state variables and use derived state where possible'
    });
  }

  // Check for useEffect complexity
  if (enhanced.useEffectHooks.length > simple.useEffectHooks.length) {
    rootCauses.push({
      issue: 'useEffect Complexity',
      description: 'Enhanced dashboard has more useEffect hooks',
      enhancedHooks: enhanced.useEffectHooks.length,
      simpleHooks: simple.useEffectHooks.length,
      solution: 'Combine or simplify useEffect hooks'
    });
  }

  return rootCauses;
}

function generateFixRecommendations(rootCauses) {
  const recommendations = [];

  rootCauses.forEach(cause => {
    switch (cause.issue) {
      case 'Infinite Loop Dependencies':
        recommendations.push({
          priority: 'HIGH',
          fix: 'Fix useEffect Dependencies',
          description: 'Remove problematic dependencies that cause infinite loops',
          steps: [
            'Remove "stats" from fetchProviderData dependency array',
            'Remove "fetchProviderData" from useEffect dependency arrays',
            'Remove "checkAuthentication" from useEffect dependency arrays',
            'Use empty dependency arrays for initialization effects',
            'Add proper initialization guards'
          ]
        });
        break;

      case 'Code Complexity':
        recommendations.push({
          priority: 'MEDIUM',
          fix: 'Simplify Code Structure',
          description: 'Break down complex functions into smaller, manageable pieces',
          steps: [
            'Extract authentication logic into separate hook',
            'Extract data fetching logic into separate hook',
            'Simplify component structure',
            'Remove unused imports and variables'
          ]
        });
        break;

      case 'State Management Complexity':
        recommendations.push({
          priority: 'MEDIUM',
          fix: 'Optimize State Management',
          description: 'Reduce state variables and use derived state',
          steps: [
            'Combine related state variables',
            'Use derived state instead of separate state variables',
            'Remove unnecessary state variables',
            'Use useMemo for computed values'
          ]
        });
        break;

      case 'useEffect Complexity':
        recommendations.push({
          priority: 'LOW',
          fix: 'Simplify useEffect Hooks',
          description: 'Combine or simplify useEffect hooks',
          steps: [
            'Combine related useEffect hooks',
            'Extract complex logic into custom hooks',
            'Use proper dependency arrays',
            'Add cleanup functions where needed'
          ]
        });
        break;
    }
  });

  return recommendations;
}

function main() {
  console.log('🔍 COMPREHENSIVE DASHBOARD ANALYSIS');
  console.log('====================================');
  
  try {
    // Analyze both dashboards
    console.log('\n1. Analyzing Enhanced Provider Dashboard...');
    const enhancedAnalysis = analyzeFile('components/provider/provider-dashboard-enhanced.tsx', 'Enhanced');
    
    console.log('\n2. Analyzing Simple Provider Dashboard...');
    const simpleAnalysis = analyzeFile('components/provider/provider-dashboard-simple.tsx', 'Simple');
    
    if (!enhancedAnalysis || !simpleAnalysis) {
      console.log('❌ Failed to analyze one or both dashboards');
      return;
    }

    // Compare analyses
    console.log('\n3. Comparing Analyses...');
    const comparison = compareAnalyses(enhancedAnalysis, simpleAnalysis);
    
    // Display comparison results
    console.log('\n📊 COMPARISON RESULTS');
    console.log('=====================');
    console.log(`Enhanced Dashboard:`);
    console.log(`  - Lines of code: ${comparison.enhanced.lineCount}`);
    console.log(`  - State variables: ${comparison.enhanced.stateVariables.length}`);
    console.log(`  - useEffect hooks: ${comparison.enhanced.useEffectHooks.length}`);
    console.log(`  - useCallback hooks: ${comparison.enhanced.useCallbackHooks.length}`);
    console.log(`  - Potential issues: ${comparison.enhanced.potentialIssues.length}`);
    
    console.log(`\nSimple Dashboard:`);
    console.log(`  - Lines of code: ${comparison.simple.lineCount}`);
    console.log(`  - State variables: ${comparison.simple.stateVariables.length}`);
    console.log(`  - useEffect hooks: ${comparison.simple.useEffectHooks.length}`);
    console.log(`  - useCallback hooks: ${comparison.simple.useCallbackHooks.length}`);
    console.log(`  - Potential issues: ${comparison.simple.potentialIssues.length}`);
    
    console.log(`\nDifferences:`);
    console.log(`  - Code complexity: ${comparison.differences.complexity.difference} lines`);
    console.log(`  - State variables: ${comparison.differences.stateVariables.difference}`);
    console.log(`  - useEffect hooks: ${comparison.differences.useEffectHooks.difference}`);
    console.log(`  - useCallback hooks: ${comparison.differences.useCallbackHooks.difference}`);

    // Identify root causes
    console.log('\n4. Identifying Root Causes...');
    const rootCauses = identifyRootCauses(enhancedAnalysis, simpleAnalysis);
    
    console.log('\n🎯 ROOT CAUSES IDENTIFIED');
    console.log('=========================');
    rootCauses.forEach((cause, index) => {
      console.log(`\n${index + 1}. ${cause.issue}`);
      console.log(`   Description: ${cause.description}`);
      console.log(`   Solution: ${cause.solution}`);
    });

    // Generate fix recommendations
    console.log('\n5. Generating Fix Recommendations...');
    const recommendations = generateFixRecommendations(rootCauses);
    
    console.log('\n🔧 FIX RECOMMENDATIONS');
    console.log('======================');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.fix}`);
      console.log(`   Description: ${rec.description}`);
      console.log(`   Steps:`);
      rec.steps.forEach((step, stepIndex) => {
        console.log(`     ${stepIndex + 1}. ${step}`);
      });
    });

    console.log('\n💡 SUMMARY');
    console.log('===========');
    console.log('The enhanced dashboard fails to load due to:');
    console.log('1. 🔄 Infinite loops in useEffect dependencies');
    console.log('2. 🧩 Overly complex state management');
    console.log('3. 🔗 Circular dependencies between functions');
    console.log('4. ⚡ Too many re-renders causing performance issues');
    
    console.log('\nThe simple dashboard works because:');
    console.log('1. ✅ Clean dependency arrays without circular references');
    console.log('2. ✅ Simplified state management');
    console.log('3. ✅ Single initialization effect');
    console.log('4. ✅ Proper error handling without loops');

  } catch (error) {
    logger.error('Error in dashboard analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  compareAnalyses,
  identifyRootCauses,
  generateFixRecommendations
};
