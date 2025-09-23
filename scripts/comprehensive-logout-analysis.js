#!/usr/bin/env node

/**
 * Comprehensive analysis of all logout functionalities
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

const logger = createLogger('ComprehensiveLogoutAnalysis');

function findAllLogoutImplementations() {
  logger.info('Finding all logout implementations across the codebase');
  
  const searchPaths = [
    'components',
    'hooks',
    'app',
    'lib'
  ];
  
  const logoutFiles = [];
  
  searchPaths.forEach(searchPath => {
    if (fs.existsSync(searchPath)) {
      const files = getAllFiles(searchPath);
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('logout') || content.includes('LogOut') || content.includes('signOut')) {
          logoutFiles.push(file);
        }
      });
    }
  });
  
  logger.info('Found logout-related files:', { count: logoutFiles.length, files: logoutFiles });
  return logoutFiles;
}

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js'))) {
      files.push(fullPath);
    }
  });
  
  return files;
}

function analyzeLogoutImplementations(files) {
  logger.info('Analyzing logout implementations');
  
  const implementations = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file);
    
    implementations[fileName] = {
      path: file,
      hasUseLogoutImport: content.includes('import { useLogout }'),
      hasUseLogoutUsage: content.includes('const { logout, isLoggingOut }'),
      hasHandleLogout: content.includes('handleLogout'),
      hasConfirmLogout: content.includes('confirmLogout'),
      hasLogoutButton: content.includes('LogOut') || content.includes('logout'),
      hasOnClick: content.includes('onClick={'),
      hasTouchEvents: content.includes('onTouchStart') || content.includes('onTouchEnd'),
      hasMobileOptimization: content.includes('touch-manipulation') || content.includes('select-none'),
      hasErrorHandling: content.includes('try {') && content.includes('} catch'),
      hasLoadingState: content.includes('isLoggingOut'),
      hasDirectFetch: content.includes('fetch("/api/auth/logout"'),
      hasCredentialsInclude: content.includes('credentials: "include"'),
      hasTimeout: content.includes('AbortController') || content.includes('setTimeout'),
      hasMobileDetection: content.includes('navigator.userAgent'),
      hasNetworkCheck: content.includes('navigator.onLine')
    };
  });
  
  return implementations;
}

function checkLogoutAPI() {
  logger.info('Checking logout API implementation');
  
  const apiPath = 'app/api/auth/logout/route.ts';
  
  if (!fs.existsSync(apiPath)) {
    logger.error('Logout API not found');
    return null;
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  const apiFeatures = {
    hasPostMethod: content.includes('export async function POST'),
    hasGetMethod: content.includes('export async function GET'),
    hasRuntimeExport: content.includes('export const runtime'),
    hasDynamicExport: content.includes('export const dynamic'),
    hasCookieClearing: content.includes('clearCookie') || content.includes('expireAuthCookie'),
    hasComprehensiveClearing: content.includes('possibleCookieNames'),
    hasErrorHandling: content.includes('try {') && content.includes('} catch'),
    hasLogging: content.includes('console.log'),
    hasCacheHeaders: content.includes('Cache-Control'),
    hasTimestamp: content.includes('timestamp: new Date()')
  };
  
  logger.info('Logout API features:', apiFeatures);
  return apiFeatures;
}

function checkUseLogoutHook() {
  logger.info('Checking useLogout hook implementation');
  
  const hookPath = 'hooks/use-logout.ts';
  
  if (!fs.existsSync(hookPath)) {
    logger.error('useLogout hook not found');
    return null;
  }
  
  const content = fs.readFileSync(hookPath, 'utf8');
  
  const hookFeatures = {
    hasCredentialsInclude: content.includes('credentials: "include"'),
    hasCacheNoStore: content.includes('cache: \'no-store\''),
    hasAbortController: content.includes('AbortController'),
    hasTimeout: content.includes('setTimeout'),
    hasAuthContextClear: content.includes('AuthContext'),
    hasLocalStorageClear: content.includes('localStorage.clear()'),
    hasSessionStorageClear: content.includes('sessionStorage.clear()'),
    hasIndexedDBClear: content.includes('indexedDB'),
    hasServiceWorkerClear: content.includes('caches.keys()'),
    hasNuclearCookieClear: content.includes('cookieNames'),
    hasHardRedirect: content.includes('window.location.href'),
    hasErrorHandling: content.includes('try {') && content.includes('} catch'),
    hasLogging: content.includes('console.log'),
    hasToast: content.includes('showToast')
  };
  
  logger.info('useLogout hook features:', hookFeatures);
  return hookFeatures;
}

function identifyIssues(implementations, apiFeatures, hookFeatures) {
  logger.info('Identifying issues across all logout implementations');
  
  console.log('\n🔍 COMPREHENSIVE LOGOUT ANALYSIS');
  console.log('=================================');
  
  console.log('\n📁 LOGOUT IMPLEMENTATIONS:');
  Object.entries(implementations).forEach(([file, features]) => {
    const totalFeatures = Object.keys(features).length - 1; // Exclude path
    const implementedFeatures = Object.values(features).filter((v, i) => i > 0 && v).length;
    const score = (implementedFeatures / totalFeatures) * 100;
    
    console.log(`\n📄 ${file}:`);
    console.log(`   Score: ${score.toFixed(1)}%`);
    console.log(`   useLogout Import: ${features.hasUseLogoutImport ? '✅' : '❌'}`);
    console.log(`   useLogout Usage: ${features.hasUseLogoutUsage ? '✅' : '❌'}`);
    console.log(`   Handle Logout: ${features.hasHandleLogout ? '✅' : '❌'}`);
    console.log(`   Logout Button: ${features.hasLogoutButton ? '✅' : '❌'}`);
    console.log(`   onClick Handler: ${features.hasOnClick ? '✅' : '❌'}`);
    console.log(`   Touch Events: ${features.hasTouchEvents ? '✅' : '❌'}`);
    console.log(`   Mobile Optimization: ${features.hasMobileOptimization ? '✅' : '❌'}`);
    console.log(`   Error Handling: ${features.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Loading State: ${features.hasLoadingState ? '✅' : '❌'}`);
    console.log(`   Direct Fetch: ${features.hasDirectFetch ? '⚠️' : '✅'}`);
    console.log(`   Credentials Include: ${features.hasCredentialsInclude ? '✅' : '❌'}`);
    console.log(`   Timeout: ${features.hasTimeout ? '✅' : '❌'}`);
    console.log(`   Mobile Detection: ${features.hasMobileDetection ? '✅' : '❌'}`);
    console.log(`   Network Check: ${features.hasNetworkCheck ? '✅' : '❌'}`);
  });
  
  console.log('\n🔧 LOGOUT API:');
  if (apiFeatures) {
    const totalFeatures = Object.keys(apiFeatures).length;
    const implementedFeatures = Object.values(apiFeatures).filter(Boolean).length;
    const score = (implementedFeatures / totalFeatures) * 100;
    
    console.log(`   Score: ${score.toFixed(1)}%`);
    Object.entries(apiFeatures).forEach(([feature, present]) => {
      console.log(`   ${feature}: ${present ? '✅' : '❌'}`);
    });
  } else {
    console.log('   ❌ Logout API not found');
  }
  
  console.log('\n🎣 useLogout HOOK:');
  if (hookFeatures) {
    const totalFeatures = Object.keys(hookFeatures).length;
    const implementedFeatures = Object.values(hookFeatures).filter(Boolean).length;
    const score = (implementedFeatures / totalFeatures) * 100;
    
    console.log(`   Score: ${score.toFixed(1)}%`);
    Object.entries(hookFeatures).forEach(([feature, present]) => {
      console.log(`   ${feature}: ${present ? '✅' : '❌'}`);
    });
  } else {
    console.log('   ❌ useLogout hook not found');
  }
  
  // Identify specific issues
  console.log('\n⚠️ ISSUES IDENTIFIED:');
  const issues = [];
  
  // Check mobile bottom nav specifically
  const mobileBottomNav = implementations['mobile-bottom-nav.tsx'];
  if (mobileBottomNav) {
    if (!mobileBottomNav.hasOnClick) {
      issues.push('MobileBottomNav: Missing onClick handler');
    }
    if (!mobileBottomNav.hasTouchEvents) {
      issues.push('MobileBottomNav: Missing touch events');
    }
    if (!mobileBottomNav.hasMobileOptimization) {
      issues.push('MobileBottomNav: Missing mobile optimization');
    }
    if (mobileBottomNav.hasDirectFetch) {
      issues.push('MobileBottomNav: Using direct fetch instead of useLogout hook');
    }
  }
  
  // Check for components using direct fetch
  Object.entries(implementations).forEach(([file, features]) => {
    if (features.hasDirectFetch) {
      issues.push(`${file}: Using direct fetch instead of useLogout hook`);
    }
  });
  
  // Check useLogout hook
  if (hookFeatures) {
    if (!hookFeatures.hasCredentialsInclude) {
      issues.push('useLogout Hook: Missing credentials include');
    }
    if (!hookFeatures.hasAbortController) {
      issues.push('useLogout Hook: Missing AbortController for timeout');
    }
    if (!hookFeatures.hasErrorHandling) {
      issues.push('useLogout Hook: Missing error handling');
    }
  }
  
  // Check logout API
  if (apiFeatures) {
    if (!apiFeatures.hasPostMethod) {
      issues.push('Logout API: Missing POST method');
    }
    if (!apiFeatures.hasCookieClearing) {
      issues.push('Logout API: Missing cookie clearing');
    }
  }
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  return { issues, implementations, apiFeatures, hookFeatures };
}

function generateFixes(analysis) {
  logger.info('Generating fixes for identified issues');
  
  console.log('\n🛠️ RECOMMENDED FIXES:');
  console.log('======================');
  
  if (analysis.issues.length === 0) {
    console.log('🎉 No issues found! All logout implementations look good.');
  } else {
    console.log(`\n📋 Fix ${analysis.issues.length} identified issues:`);
    
    analysis.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue}`);
      
      if (issue.includes('MobileBottomNav')) {
        console.log('   Fix: Ensure mobile bottom nav has proper event handlers');
      } else if (issue.includes('direct fetch')) {
        console.log('   Fix: Replace direct fetch with useLogout hook');
      } else if (issue.includes('useLogout Hook')) {
        console.log('   Fix: Enhance useLogout hook implementation');
      } else if (issue.includes('Logout API')) {
        console.log('   Fix: Enhance logout API implementation');
      }
    });
  }
  
  console.log('\n💡 GENERAL RECOMMENDATIONS:');
  console.log('1. Ensure all logout buttons use useLogout hook');
  console.log('2. Add proper touch event handling for mobile');
  console.log('3. Implement comprehensive error handling');
  console.log('4. Add loading states and user feedback');
  console.log('5. Test on actual mobile devices');
}

function runComprehensiveLogoutAnalysis() {
  logger.info('Running comprehensive logout analysis');
  
  try {
    const files = findAllLogoutImplementations();
    const implementations = analyzeLogoutImplementations(files);
    const apiFeatures = checkLogoutAPI();
    const hookFeatures = checkUseLogoutHook();
    
    const analysis = identifyIssues(implementations, apiFeatures, hookFeatures);
    generateFixes(analysis);
    
    console.log('\n📊 ANALYSIS SUMMARY');
    console.log('===================');
    console.log(`📁 Files analyzed: ${files.length}`);
    console.log(`⚠️ Issues found: ${analysis.issues.length}`);
    console.log(`🔧 API status: ${apiFeatures ? 'Found' : 'Missing'}`);
    console.log(`🎣 Hook status: ${hookFeatures ? 'Found' : 'Missing'}`);
    
    return analysis;
    
  } catch (error) {
    logger.error('Error in comprehensive logout analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    return null;
  }
}

// Handle script execution
if (require.main === module) {
  runComprehensiveLogoutAnalysis();
}

module.exports = {
  findAllLogoutImplementations,
  analyzeLogoutImplementations,
  checkLogoutAPI,
  checkUseLogoutHook,
  identifyIssues,
  generateFixes,
  runComprehensiveLogoutAnalysis
};
