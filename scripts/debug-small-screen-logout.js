#!/usr/bin/env node

/**
 * Debug script to understand why small screen logout is still not working
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

const logger = createLogger('DebugSmallScreenLogout');

function analyzeProviderDashboardRendering() {
  logger.info('Analyzing provider dashboard rendering logic');
  
  const dashboardPath = 'components/provider/provider-dashboard-unified.tsx';
  
  if (!fs.existsSync(dashboardPath)) {
    logger.error('Provider dashboard not found');
    return null;
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Find the rendering logic
  const renderingPatterns = [
    /hidden\s+lg:flex/g,
    /lg:hidden/g,
    /sm:hidden/g,
    /ConsolidatedMobileHeaderProvider/g,
    /MobileBottomNav/g
  ];
  
  const matches = {};
  renderingPatterns.forEach((pattern, index) => {
    const patternMatches = content.match(pattern);
    matches[`pattern_${index}`] = patternMatches || [];
  });
  
  logger.info('Provider dashboard rendering patterns:', matches);
  
  // Check if MobileBottomNav is actually rendered
  const mobileBottomNavRendered = content.includes('MobileBottomNav userRole="PROVIDER"');
  const mobileHeaderRendered = content.includes('ConsolidatedMobileHeaderProvider');
  
  logger.info('Component rendering status:', {
    mobileBottomNavRendered,
    mobileHeaderRendered
  });
  
  return {
    matches,
    mobileBottomNavRendered,
    mobileHeaderRendered
  };
}

function analyzeMobileBottomNavVisibility() {
  logger.info('Analyzing mobile bottom nav visibility');
  
  const navPath = 'components/ui/mobile-bottom-nav.tsx';
  
  if (!fs.existsSync(navPath)) {
    logger.error('Mobile bottom nav not found');
    return null;
  }
  
  const content = fs.readFileSync(navPath, 'utf8');
  
  // Check the visibility classes
  const visibilityClasses = content.match(/className={cn\([\s\S]*?\)/g) || [];
  
  logger.info('Mobile bottom nav visibility classes:', visibilityClasses);
  
  // Check if sm:hidden is properly applied
  const hasSmHidden = content.includes('sm:hidden');
  const hasLogoutButton = content.includes('isLogout: true');
  const hasLogoutHandler = content.includes('handleLogout');
  
  logger.info('Mobile bottom nav logout features:', {
    hasSmHidden,
    hasLogoutButton,
    hasLogoutHandler,
    visibilityClasses: visibilityClasses[0] || 'not found'
  });
  
  return {
    hasSmHidden,
    hasLogoutButton,
    hasLogoutHandler,
    visibilityClasses
  };
}

function checkForConflictingComponents() {
  logger.info('Checking for conflicting components');
  
  const componentsToCheck = [
    'components/ui/mobile-bottom-nav.tsx',
    'components/ui/consolidated-mobile-header-provider.tsx',
    'components/provider/provider-dashboard-unified.tsx'
  ];
  
  const conflicts = {};
  
  componentsToCheck.forEach(componentPath => {
    if (!fs.existsSync(componentPath)) {
      logger.warn(`Component not found: ${componentPath}`);
      return;
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    const componentName = path.basename(componentPath, '.tsx');
    
    conflicts[componentName] = {
      hasZIndex: content.includes('z-'),
      hasFixed: content.includes('fixed'),
      hasSticky: content.includes('sticky'),
      hasAbsolute: content.includes('absolute'),
      zIndexValues: content.match(/z-\[?\d+\]?/g) || [],
      positionValues: content.match(/(fixed|sticky|absolute|relative)/g) || []
    };
  });
  
  logger.info('Component positioning analysis:', conflicts);
  
  return conflicts;
}

function analyzeBreakpointConflicts() {
  logger.info('Analyzing potential breakpoint conflicts');
  
  const dashboardPath = 'components/provider/provider-dashboard-unified.tsx';
  const navPath = 'components/ui/mobile-bottom-nav.tsx';
  
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  // Check for conflicting breakpoints
  const conflicts = {
    dashboard: {
      lgHidden: dashboardContent.includes('lg:hidden'),
      lgFlex: dashboardContent.includes('hidden lg:flex'),
      mobileHeader: dashboardContent.includes('ConsolidatedMobileHeaderProvider'),
      mobileBottomNav: dashboardContent.includes('MobileBottomNav')
    },
    nav: {
      smHidden: navContent.includes('sm:hidden'),
      hasLogout: navContent.includes('isLogout: true')
    }
  };
  
  // Check if there's a gap between sm and lg
  const potentialGap = {
    hasSmHidden: conflicts.nav.smHidden,
    hasLgHidden: conflicts.dashboard.lgHidden,
    gapBetween: 'sm:hidden (0-639px) vs lg:hidden (0-1023px) - potential overlap'
  };
  
  logger.info('Breakpoint conflict analysis:', {
    conflicts,
    potentialGap
  });
  
  return { conflicts, potentialGap };
}

function checkUseLogoutHookImplementation() {
  logger.info('Checking useLogout hook implementation');
  
  const hookPath = 'hooks/use-logout.ts';
  
  if (!fs.existsSync(hookPath)) {
    logger.error('useLogout hook not found');
    return false;
  }
  
  const content = fs.readFileSync(hookPath, 'utf8');
  
  // Check for potential issues
  const issues = {
    hasNuclearLogout: content.includes('Nuclear logout'),
    hasCredentialsInclude: content.includes('credentials: \'include\''),
    hasCacheNoStore: content.includes('cache: \'no-store\''),
    hasLocalStorageClear: content.includes('localStorage.clear()'),
    hasSessionStorageClear: content.includes('sessionStorage.clear()'),
    hasIndexedDBClear: content.includes('indexedDB'),
    hasServiceWorkerClear: content.includes('caches.keys()'),
    hasNuclearCookieClear: content.includes('cookieNames'),
    hasHardRedirect: content.includes('window.location.href'),
    hasAuthContextClear: content.includes('AuthContext')
  };
  
  const totalFeatures = Object.keys(issues).length;
  const workingFeatures = Object.values(issues).filter(Boolean).length;
  const workingPercentage = (workingFeatures / totalFeatures) * 100;
  
  logger.info('useLogout hook analysis:', {
    issues,
    workingFeatures,
    totalFeatures,
    workingPercentage: `${workingPercentage.toFixed(1)}%`
  });
  
  return workingPercentage >= 80;
}

function generateDebuggingRecommendations() {
  logger.info('Generating debugging recommendations');
  
  const dashboardAnalysis = analyzeProviderDashboardRendering();
  const navAnalysis = analyzeMobileBottomNavVisibility();
  const conflicts = checkForConflictingComponents();
  const breakpointConflicts = analyzeBreakpointConflicts();
  const hookAnalysis = checkUseLogoutHookImplementation();
  
  console.log('\n🔍 SMALL SCREEN LOGOUT DEBUGGING ANALYSIS');
  console.log('==========================================');
  
  console.log('\n📱 COMPONENT RENDERING:');
  console.log(`Provider Dashboard Mobile Bottom Nav: ${dashboardAnalysis?.mobileBottomNavRendered ? '✅ Rendered' : '❌ Not Rendered'}`);
  console.log(`Provider Dashboard Mobile Header: ${dashboardAnalysis?.mobileHeaderRendered ? '✅ Rendered' : '❌ Not Rendered'}`);
  
  console.log('\n🎯 MOBILE BOTTOM NAV:');
  console.log(`Visibility (sm:hidden): ${navAnalysis?.hasSmHidden ? '✅ Applied' : '❌ Missing'}`);
  console.log(`Logout Button: ${navAnalysis?.hasLogoutButton ? '✅ Present' : '❌ Missing'}`);
  console.log(`Logout Handler: ${navAnalysis?.hasLogoutHandler ? '✅ Present' : '❌ Missing'}`);
  
  console.log('\n⚡ POTENTIAL ISSUES:');
  
  const issues = [];
  
  if (!dashboardAnalysis?.mobileBottomNavRendered) {
    issues.push('MobileBottomNav not rendered in provider dashboard');
  }
  
  if (!navAnalysis?.hasSmHidden) {
    issues.push('MobileBottomNav missing sm:hidden visibility class');
  }
  
  if (!navAnalysis?.hasLogoutButton) {
    issues.push('MobileBottomNav missing logout button');
  }
  
  if (!navAnalysis?.hasLogoutHandler) {
    issues.push('MobileBottomNav missing logout handler');
  }
  
  // Check for z-index conflicts
  const zIndexConflicts = Object.entries(conflicts).filter(([name, data]) => 
    data.zIndexValues.length > 0 && data.hasFixed
  );
  
  if (zIndexConflicts.length > 1) {
    issues.push('Potential z-index conflicts between components');
  }
  
  // Check breakpoint gap
  if (breakpointConflicts.potentialGap.hasSmHidden && breakpointConflicts.potentialGap.hasLgHidden) {
    issues.push('Potential breakpoint overlap: sm:hidden vs lg:hidden');
  }
  
  if (!hookAnalysis) {
    issues.push('useLogout hook implementation issues');
  }
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\n💡 DEBUGGING RECOMMENDATIONS:');
  console.log('1. Check browser dev tools to see which components actually render');
  console.log('2. Test on actual small screen device (not just browser resize)');
  console.log('3. Check if MobileBottomNav is being overridden by other components');
  console.log('4. Verify z-index stacking order');
  console.log('5. Check for JavaScript errors in console');
  console.log('6. Test if logout button is clickable on small screens');
  
  return {
    dashboardAnalysis,
    navAnalysis,
    conflicts,
    breakpointConflicts,
    hookAnalysis,
    issues
  };
}

function runSmallScreenLogoutDebug() {
  logger.info('Running small screen logout debugging');
  
  try {
    const analysis = generateDebuggingRecommendations();
    
    console.log('\n📊 DEBUGGING SUMMARY');
    console.log('====================');
    
    const totalIssues = analysis.issues.length;
    
    if (totalIssues === 0) {
      console.log('🎉 No obvious issues found in code analysis');
      console.log('🔍 Issue might be:');
      console.log('   - Runtime rendering problem');
      console.log('   - CSS conflicts');
      console.log('   - JavaScript errors');
      console.log('   - Device-specific issues');
    } else {
      console.log(`⚠️  ${totalIssues} potential issues identified`);
      console.log('🔧 Please address the issues above');
    }
    
    return analysis;
    
  } catch (error) {
    logger.error('Error in small screen logout debugging', error);
    console.error(`❌ Debugging failed: ${error.message}`);
    return null;
  }
}

// Handle script execution
if (require.main === module) {
  runSmallScreenLogoutDebug();
}

module.exports = {
  analyzeProviderDashboardRendering,
  analyzeMobileBottomNavVisibility,
  checkForConflictingComponents,
  analyzeBreakpointConflicts,
  checkUseLogoutHookImplementation,
  generateDebuggingRecommendations,
  runSmallScreenLogoutDebug
};
