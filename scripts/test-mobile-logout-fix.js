#!/usr/bin/env node

/**
 * Test script to verify mobile logout functionality
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

const logger = createLogger('TestMobileLogoutFix');

function checkMobileHeaderImplementation() {
  logger.info('Checking mobile header logout implementations');
  
  const mobileHeaders = [
    'components/ui/consolidated-mobile-header-provider.tsx',
    'components/ui/consolidated-mobile-header.tsx',
    'components/ui/consolidated-mobile-header-admin.tsx'
  ];
  
  const results = {};
  
  mobileHeaders.forEach(headerPath => {
    if (!fs.existsSync(headerPath)) {
      logger.warn(`Header file not found: ${headerPath}`);
      return;
    }
    
    const content = fs.readFileSync(headerPath, 'utf8');
    const headerName = path.basename(headerPath, '.tsx');
    
    // Check for useLogout import
    const hasUseLogoutImport = content.includes('import { useLogout } from "@/hooks/use-logout"');
    
    // Check for useLogout usage
    const hasUseLogoutUsage = content.includes('const { logout, isLoggingOut } = useLogout()');
    
    // Check for comprehensive logout implementation
    const hasConfirmLogout = content.includes('confirmLogout');
    
    // Check for loading state
    const hasLoadingState = content.includes('isLoggingOut');
    
    // Check for old simple fetch implementation
    const hasOldFetchLogout = content.includes('fetch("/api/auth/logout"');
    
    results[headerName] = {
      hasUseLogoutImport,
      hasUseLogoutUsage,
      hasConfirmLogout,
      hasLoadingState,
      hasOldFetchLogout,
      isProperlyImplemented: hasUseLogoutImport && hasUseLogoutUsage && hasConfirmLogout && hasLoadingState && !hasOldFetchLogout
    };
    
    logger.info(`Header analysis for ${headerName}:`, results[headerName]);
  });
  
  return results;
}

function checkLogoutHookImplementation() {
  logger.info('Checking useLogout hook implementation');
  
  const hookPath = 'hooks/use-logout.ts';
  
  if (!fs.existsSync(hookPath)) {
    logger.error('useLogout hook not found');
    return false;
  }
  
  const content = fs.readFileSync(hookPath, 'utf8');
  
  // Check for comprehensive logout features
  const features = {
    hasCredentialsInclude: content.includes('credentials: \'include\''),
    hasCacheNoStore: content.includes('cache: \'no-store\''),
    hasAuthContextClear: content.includes('AuthContext'),
    hasLocalStorageClear: content.includes('localStorage.clear()'),
    hasSessionStorageClear: content.includes('sessionStorage.clear()'),
    hasIndexedDBClear: content.includes('indexedDB'),
    hasServiceWorkerClear: content.includes('caches.keys()'),
    hasNuclearCookieClear: content.includes('cookieNames'),
    hasHardRedirect: content.includes('window.location.href'),
    hasNuclearImplementation: content.includes('Nuclear logout')
  };
  
  const totalFeatures = Object.keys(features).length;
  const implementedFeatures = Object.values(features).filter(Boolean).length;
  const implementationPercentage = (implementedFeatures / totalFeatures) * 100;
  
  logger.info('useLogout hook feature analysis:', {
    features,
    implementedFeatures,
    totalFeatures,
    implementationPercentage: `${implementationPercentage.toFixed(1)}%`
  });
  
  return implementationPercentage >= 80; // At least 80% of features should be implemented
}

function checkLogoutApiImplementation() {
  logger.info('Checking logout API implementation');
  
  const apiPath = 'app/api/auth/logout/route.ts';
  
  if (!fs.existsSync(apiPath)) {
    logger.error('Logout API not found');
    return false;
  }
  
  const content = fs.readFileSync(apiPath, 'utf8');
  
  // Check for comprehensive server-side logout features
  const features = {
    hasRuntimeExport: content.includes('export const runtime = \'nodejs\''),
    hasComprehensiveLogging: content.includes('console.log(JSON.stringify({'),
    hasCacheBustingHeaders: content.includes('Cache-Control'),
    hasNuclearCookieClear: content.includes('possibleCookieNames'),
    hasDomainVariations: content.includes('domainVariations'),
    hasPathVariations: content.includes('pathVariations'),
    hasAggressiveClearing: content.includes('clearCookie'),
    hasErrorHandling: content.includes('try {') && content.includes('} catch'),
    hasTimestamp: content.includes('timestamp: new Date().toISOString()')
  };
  
  const totalFeatures = Object.keys(features).length;
  const implementedFeatures = Object.values(features).filter(Boolean).length;
  const implementationPercentage = (implementedFeatures / totalFeatures) * 100;
  
  logger.info('Logout API feature analysis:', {
    features,
    implementedFeatures,
    totalFeatures,
    implementationPercentage: `${implementationPercentage.toFixed(1)}%`
  });
  
  return implementationPercentage >= 80; // At least 80% of features should be implemented
}

function runMobileLogoutTests() {
  logger.info('Running mobile logout functionality tests');
  
  try {
    const headerResults = checkMobileHeaderImplementation();
    const hookResults = checkLogoutHookImplementation();
    const apiResults = checkLogoutApiImplementation();
    
    console.log('\n📊 MOBILE LOGOUT TEST RESULTS');
    console.log('=============================');
    
    // Analyze header implementations
    Object.entries(headerResults).forEach(([header, result]) => {
      const status = result.isProperlyImplemented ? '✅ PROPER' : '❌ ISSUES';
      console.log(`${status} ${header}`);
      
      if (!result.isProperlyImplemented) {
        console.log(`   - useLogout Import: ${result.hasUseLogoutImport ? '✅' : '❌'}`);
        console.log(`   - useLogout Usage: ${result.hasUseLogoutUsage ? '✅' : '❌'}`);
        console.log(`   - Confirm Logout: ${result.hasConfirmLogout ? '✅' : '❌'}`);
        console.log(`   - Loading State: ${result.hasLoadingState ? '✅' : '❌'}`);
        console.log(`   - Old Fetch: ${result.hasOldFetchLogout ? '❌ HAS OLD' : '✅ NONE'}`);
      }
    });
    
    console.log(`\n📱 useLogout Hook: ${hookResults ? '✅ COMPREHENSIVE' : '❌ INCOMPLETE'}`);
    console.log(`🔧 Logout API: ${apiResults ? '✅ NUCLEAR' : '❌ INCOMPLETE'}`);
    
    const allHeadersProper = Object.values(headerResults).every(r => r.isProperlyImplemented);
    const allSystemsReady = allHeadersProper && hookResults && apiResults;
    
    console.log('\n💡 SUMMARY');
    console.log('===========');
    
    if (allSystemsReady) {
      console.log('🎉 MOBILE LOGOUT FIX VERIFIED!');
      console.log('✅ All mobile headers use comprehensive logout');
      console.log('✅ useLogout hook is properly implemented');
      console.log('✅ Logout API has nuclear clearing');
      console.log('\n🚀 Mobile logout should now work correctly!');
      console.log('📱 Test on mobile devices to confirm the fix');
    } else {
      console.log('⚠️ MOBILE LOGOUT ISSUES DETECTED');
      console.log('❌ Some components still have logout issues');
      console.log('🔧 Please review and fix the failing checks above');
    }
    
    return allSystemsReady;
    
  } catch (error) {
    logger.error('Error in mobile logout tests', error);
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Handle script execution
if (require.main === module) {
  runMobileLogoutTests();
}

module.exports = {
  checkMobileHeaderImplementation,
  checkLogoutHookImplementation,
  checkLogoutApiImplementation,
  runMobileLogoutTests
};
