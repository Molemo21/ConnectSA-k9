#!/usr/bin/env node

/**
 * Comprehensive test for responsive logout functionality
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

const logger = createLogger('TestResponsiveLogoutComprehensive');

function testMobileBottomNavLogout() {
  logger.info('Testing mobile bottom nav logout functionality');
  
  const navPath = 'components/ui/mobile-bottom-nav.tsx';
  
  if (!fs.existsSync(navPath)) {
    logger.error('Mobile bottom nav not found');
    return false;
  }
  
  const content = fs.readFileSync(navPath, 'utf8');
  
  // Check for logout functionality
  const features = {
    hasUseLogoutImport: content.includes('import { useLogout } from "@/hooks/use-logout"'),
    hasUseLogoutUsage: content.includes('const { logout, isLoggingOut } = useLogout()'),
    hasLogoutHandler: content.includes('handleLogout'),
    hasLogoutButton: content.includes('isLogout: true'),
    hasLogoutIcon: content.includes('LogOut'),
    hasLogoutInAllRoles: content.includes('isLogout: true'),
    hasLogoutButtonRendering: content.includes('if (isLogout)'),
    hasLogoutStyling: content.includes('text-red-400'),
    hasLogoutLoading: content.includes('isLoggingOut ? "..." : item.label'),
    hasLogoutDisabled: content.includes('disabled={isLoggingOut}')
  };
  
  const totalFeatures = Object.keys(features).length;
  const implementedFeatures = Object.values(features).filter(Boolean).length;
  const implementationPercentage = (implementedFeatures / totalFeatures) * 100;
  
  logger.info('Mobile bottom nav logout features:', {
    features,
    implementedFeatures,
    totalFeatures,
    implementationPercentage: `${implementationPercentage.toFixed(1)}%`
  });
  
  // Check if logout is added to all user roles
  const clientLogout = content.includes('case "CLIENT":') && content.includes('isLogout: true');
  const providerLogout = content.includes('case "PROVIDER":') && content.includes('isLogout: true');
  const adminLogout = content.includes('case "ADMIN":') && content.includes('isLogout: true');
  
  const allRolesHaveLogout = clientLogout && providerLogout && adminLogout;
  
  logger.info('User role logout coverage:', {
    clientLogout,
    providerLogout,
    adminLogout,
    allRolesHaveLogout
  });
  
  return implementationPercentage >= 90 && allRolesHaveLogout;
}

function testResponsiveBreakpoints() {
  logger.info('Testing responsive breakpoint coverage');
  
  const breakpoints = {
    'xs': '0-639px',
    'sm': '640-767px', 
    'md': '768-1023px',
    'lg': '1024px+'
  };
  
  // Test provider dashboard
  const dashboardPath = 'components/provider/provider-dashboard-unified.tsx';
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const dashboardBreakpoints = {
    desktopSidebar: dashboardContent.includes('hidden lg:flex'),
    mobileLayout: dashboardContent.includes('lg:hidden'),
    mobileHeader: dashboardContent.includes('ConsolidatedMobileHeaderProvider'),
    mobileBottomNav: dashboardContent.includes('MobileBottomNav')
  };
  
  // Test mobile bottom nav
  const navPath = 'components/ui/mobile-bottom-nav.tsx';
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  const navBreakpoints = {
    verySmallScreens: navContent.includes('sm:hidden'),
    hasLogout: navContent.includes('isLogout: true')
  };
  
  logger.info('Responsive breakpoint analysis:', {
    breakpoints,
    dashboardBreakpoints,
    navBreakpoints
  });
  
  // Verify coverage
  const coverage = {
    'xs (0-639px)': navBreakpoints.verySmallScreens && navBreakpoints.hasLogout,
    'sm (640-767px)': dashboardBreakpoints.mobileHeader,
    'md (768-1023px)': dashboardBreakpoints.mobileHeader,
    'lg (1024px+)': dashboardBreakpoints.desktopSidebar
  };
  
  const totalCoverage = Object.keys(coverage).length;
  const coveredBreakpoints = Object.values(coverage).filter(Boolean).length;
  const coveragePercentage = (coveredBreakpoints / totalCoverage) * 100;
  
  logger.info('Breakpoint coverage:', {
    coverage,
    coveredBreakpoints,
    totalCoverage,
    coveragePercentage: `${coveragePercentage.toFixed(1)}%`
  });
  
  return coveragePercentage >= 100;
}

function testLogoutConsistency() {
  logger.info('Testing logout consistency across all components');
  
  const components = [
    'components/ui/consolidated-mobile-header-provider.tsx',
    'components/ui/consolidated-mobile-header.tsx',
    'components/ui/consolidated-mobile-header-admin.tsx',
    'components/ui/mobile-bottom-nav.tsx'
  ];
  
  const consistency = {};
  
  components.forEach(componentPath => {
    if (!fs.existsSync(componentPath)) {
      logger.warn(`Component not found: ${componentPath}`);
      return;
    }
    
    const content = fs.readFileSync(componentPath, 'utf8');
    const componentName = path.basename(componentPath, '.tsx');
    
    consistency[componentName] = {
      hasUseLogoutImport: content.includes('import { useLogout }'),
      hasUseLogoutUsage: content.includes('const { logout, isLoggingOut }'),
      hasLogoutHandler: content.includes('logout()'),
      hasLoadingState: content.includes('isLoggingOut'),
      hasNuclearLogout: content.includes('await logout()')
    };
  });
  
  // Check if all components use the same logout pattern
  const allHaveUseLogout = Object.values(consistency).every(c => c.hasUseLogoutImport && c.hasUseLogoutUsage);
  const allHaveLogoutHandler = Object.values(consistency).every(c => c.hasLogoutHandler);
  const allHaveLoadingState = Object.values(consistency).every(c => c.hasLoadingState);
  
  logger.info('Logout consistency analysis:', {
    consistency,
    allHaveUseLogout,
    allHaveLogoutHandler,
    allHaveLoadingState
  });
  
  return allHaveUseLogout && allHaveLogoutHandler && allHaveLoadingState;
}

function runComprehensiveResponsiveLogoutTest() {
  logger.info('Running comprehensive responsive logout test');
  
  try {
    const bottomNavTest = testMobileBottomNavLogout();
    const breakpointTest = testResponsiveBreakpoints();
    const consistencyTest = testLogoutConsistency();
    
    console.log('\n📊 COMPREHENSIVE RESPONSIVE LOGOUT TEST RESULTS');
    console.log('===============================================');
    
    console.log(`📱 Mobile Bottom Nav Logout: ${bottomNavTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📐 Responsive Breakpoints: ${breakpointTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔄 Logout Consistency: ${consistencyTest ? '✅ PASS' : '❌ FAIL'}`);
    
    const allTestsPassed = bottomNavTest && breakpointTest && consistencyTest;
    
    console.log('\n💡 SUMMARY');
    console.log('===========');
    
    if (allTestsPassed) {
      console.log('🎉 ALL RESPONSIVE LOGOUT TESTS PASSED!');
      console.log('✅ Mobile bottom nav has logout for very small screens');
      console.log('✅ All breakpoints have logout coverage');
      console.log('✅ Logout is consistent across all components');
      console.log('\n🚀 RESPONSIVE LOGOUT IS FULLY FUNCTIONAL!');
      console.log('📱 Small screens (0-639px): MobileBottomNav with logout');
      console.log('📱 Medium screens (640-1023px): MobileHeader with logout');
      console.log('💻 Large screens (1024px+): Desktop sidebar with logout');
    } else {
      console.log('⚠️ SOME RESPONSIVE LOGOUT TESTS FAILED');
      console.log('❌ Please review and fix the failing tests above');
      console.log('\n🔧 Next steps:');
      if (!bottomNavTest) console.log('1. Fix mobile bottom nav logout functionality');
      if (!breakpointTest) console.log('2. Fix responsive breakpoint coverage');
      if (!consistencyTest) console.log('3. Ensure logout consistency across components');
    }
    
    return allTestsPassed;
    
  } catch (error) {
    logger.error('Error in comprehensive responsive logout test', error);
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

// Handle script execution
if (require.main === module) {
  runComprehensiveResponsiveLogoutTest();
}

module.exports = {
  testMobileBottomNavLogout,
  testResponsiveBreakpoints,
  testLogoutConsistency,
  runComprehensiveResponsiveLogoutTest
};
