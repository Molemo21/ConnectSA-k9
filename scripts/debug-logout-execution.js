#!/usr/bin/env node

/**
 * Debug script to investigate logout execution differences between components
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

const logger = createLogger('DebugLogoutExecution');

function compareLogoutImplementations() {
  logger.info('Comparing logout implementations across components');
  
  const components = [
    'components/ui/mobile-bottom-nav.tsx',
    'components/ui/consolidated-mobile-header-provider.tsx',
    'components/ui/consolidated-mobile-header.tsx',
    'components/ui/consolidated-mobile-header-admin.tsx'
  ];
  
  const implementations = {};
  
  components.forEach(componentPath => {
    if (!fs.existsSync(componentPath)) {
      logger.warn(`Component not found: ${componentPath}`);
      return;
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    const componentName = path.basename(componentPath, '.tsx');
    
    implementations[componentName] = {
      hasUseLogoutImport: content.includes('import { useLogout }'),
      hasUseLogoutUsage: content.includes('const { logout, isLoggingOut }'),
      hasHandleLogout: content.includes('handleLogout'),
      hasConfirmLogout: content.includes('confirmLogout'),
      hasLogoutDialog: content.includes('showLogoutConfirm'),
      hasLoadingDelay: content.includes('setTimeout(resolve => setTimeout(resolve, 100))'),
      hasMenuClose: content.includes('closeMenu()'),
      hasDirectLogout: content.includes('await logout()'),
      hasErrorHandling: content.includes('try {') && content.includes('} catch'),
      hasConfirmationFlow: content.includes('setShowLogoutConfirm(true)')
    };
  });
  
  logger.info('Logout implementation comparison:', implementations);
  
  return implementations;
}

function analyzeLogoutFlow() {
  logger.info('Analyzing logout flow differences');
  
  const implementations = compareLogoutImplementations();
  
  console.log('\n🔍 LOGOUT IMPLEMENTATION COMPARISON');
  console.log('====================================');
  
  Object.entries(implementations).forEach(([component, features]) => {
    console.log(`\n📱 ${component}:`);
    console.log(`   useLogout Import: ${features.hasUseLogoutImport ? '✅' : '❌'}`);
    console.log(`   useLogout Usage: ${features.hasUseLogoutUsage ? '✅' : '❌'}`);
    console.log(`   Handle Logout: ${features.hasHandleLogout ? '✅' : '❌'}`);
    console.log(`   Confirm Logout: ${features.hasConfirmLogout ? '✅' : '❌'}`);
    console.log(`   Logout Dialog: ${features.hasLogoutDialog ? '✅' : '❌'}`);
    console.log(`   Loading Delay: ${features.hasLoadingDelay ? '✅' : '❌'}`);
    console.log(`   Menu Close: ${features.hasMenuClose ? '✅' : '❌'}`);
    console.log(`   Direct Logout: ${features.hasDirectLogout ? '✅' : '❌'}`);
    console.log(`   Error Handling: ${features.hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Confirmation Flow: ${features.hasConfirmationFlow ? '✅' : '❌'}`);
    
    // Calculate implementation score
    const totalFeatures = Object.keys(features).length;
    const implementedFeatures = Object.values(features).filter(Boolean).length;
    const score = (implementedFeatures / totalFeatures) * 100;
    
    console.log(`   Implementation Score: ${score.toFixed(1)}%`);
  });
  
  return implementations;
}

function identifyLogoutIssues() {
  logger.info('Identifying specific logout issues');
  
  const implementations = analyzeLogoutFlow();
  
  console.log('\n⚠️  LOGOUT ISSUES IDENTIFIED:');
  console.log('=============================');
  
  const issues = [];
  
  // Check mobile bottom nav specifically
  const mobileBottomNav = implementations['mobile-bottom-nav'];
  if (mobileBottomNav) {
    if (!mobileBottomNav.hasConfirmLogout) {
      issues.push('MobileBottomNav: Missing confirmLogout function');
    }
    if (!mobileBottomNav.hasLogoutDialog) {
      issues.push('MobileBottomNav: Missing logout confirmation dialog');
    }
    if (!mobileBottomNav.hasLoadingDelay) {
      issues.push('MobileBottomNav: Missing loading delay');
    }
    if (!mobileBottomNav.hasMenuClose) {
      issues.push('MobileBottomNav: Missing menu close functionality');
    }
    if (mobileBottomNav.hasDirectLogout && !mobileBottomNav.hasConfirmationFlow) {
      issues.push('MobileBottomNav: Uses direct logout without confirmation flow');
    }
  }
  
  // Check other components for consistency
  const otherComponents = Object.entries(implementations).filter(([name]) => name !== 'mobile-bottom-nav');
  
  otherComponents.forEach(([name, features]) => {
    if (!features.hasConfirmLogout) {
      issues.push(`${name}: Missing confirmLogout function`);
    }
    if (!features.hasLoadingDelay) {
      issues.push(`${name}: Missing loading delay`);
    }
  });
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Add confirmation dialog to MobileBottomNav');
  console.log('2. Add loading delay to MobileBottomNav');
  console.log('3. Ensure consistent logout flow across all components');
  console.log('4. Add proper error handling and user feedback');
  
  return issues;
}

function testLogoutHookImplementation() {
  logger.info('Testing useLogout hook implementation');
  
  const hookPath = 'hooks/use-logout.ts';
  
  if (!fs.existsSync(hookPath)) {
    logger.error('useLogout hook not found');
    return false;
  }
  
  const content = fs.readFileSync(hookPath, 'utf8');
  
  // Check for critical logout features
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
  
  console.log('\n🔧 useLogout Hook Analysis:');
  console.log('===========================');
  Object.entries(features).forEach(([feature, implemented]) => {
    console.log(`${feature}: ${implemented ? '✅' : '❌'}`);
  });
  console.log(`Implementation: ${implementationPercentage.toFixed(1)}%`);
  
  return implementationPercentage >= 80;
}

function runLogoutExecutionDebug() {
  logger.info('Running logout execution debugging');
  
  try {
    const implementations = analyzeLogoutFlow();
    const issues = identifyLogoutIssues();
    const hookStatus = testLogoutHookImplementation();
    
    console.log('\n📊 LOGOUT EXECUTION DEBUG SUMMARY');
    console.log('==================================');
    
    const totalIssues = issues.length;
    
    if (totalIssues === 0 && hookStatus) {
      console.log('🎉 No logout execution issues found!');
      console.log('✅ All components have consistent logout implementation');
      console.log('✅ useLogout hook is properly implemented');
    } else {
      console.log(`⚠️  ${totalIssues} logout execution issues found`);
      console.log(`🔧 useLogout hook status: ${hookStatus ? '✅ OK' : '❌ ISSUES'}`);
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix the identified issues above');
      console.log('2. Ensure consistent logout flow across all components');
      console.log('3. Test logout functionality on actual devices');
    }
    
    return {
      implementations,
      issues,
      hookStatus
    };
    
  } catch (error) {
    logger.error('Error in logout execution debugging', error);
    console.error(`❌ Debugging failed: ${error.message}`);
    return null;
  }
}

// Handle script execution
if (require.main === module) {
  runLogoutExecutionDebug();
}

module.exports = {
  compareLogoutImplementations,
  analyzeLogoutFlow,
  identifyLogoutIssues,
  testLogoutHookImplementation,
  runLogoutExecutionDebug
};
