#!/usr/bin/env node

/**
 * Analyze responsive logout functionality across different screen sizes
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

const logger = createLogger('AnalyzeResponsiveLogout');

function analyzeBreakpoints() {
  logger.info('Analyzing Tailwind CSS breakpoints');
  
  const breakpoints = {
    'xs': '0px',
    'sm': '640px',
    'md': '768px', 
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px'
  };
  
  console.log('\n📱 TAILWIND CSS BREAKPOINTS');
  console.log('============================');
  Object.entries(breakpoints).forEach(([size, width]) => {
    console.log(`${size.padEnd(4)}: ${width}`);
  });
  
  return breakpoints;
}

function analyzeProviderDashboardResponsive() {
  logger.info('Analyzing provider dashboard responsive behavior');
  
  const dashboardPath = 'components/provider/provider-dashboard-unified.tsx';
  
  if (!fs.existsSync(dashboardPath)) {
    logger.error('Provider dashboard not found');
    return null;
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Extract responsive classes
  const responsiveClasses = content.match(/hidden\s+(sm|md|lg|xl|2xl):|block\s+(sm|md|lg|xl|2xl):|flex\s+(sm|md|lg|xl|2xl):|lg:hidden|lg:block|lg:flex/g) || [];
  
  logger.info('Responsive classes found in provider dashboard:', { responsiveClasses });
  
  // Analyze layout structure
  const layoutAnalysis = {
    desktopSidebar: content.includes('hidden lg:flex') ? 'lg and up' : 'not found',
    mobileLayout: content.includes('lg:hidden') ? 'below lg' : 'not found',
    mobileHeader: content.includes('ConsolidatedMobileHeaderProvider') ? 'yes' : 'no',
    mobileBottomNav: content.includes('MobileBottomNav') ? 'yes' : 'no'
  };
  
  logger.info('Provider dashboard layout analysis:', layoutAnalysis);
  
  return {
    responsiveClasses,
    layoutAnalysis
  };
}

function analyzeMobileBottomNav() {
  logger.info('Analyzing mobile bottom navigation');
  
  const navPath = 'components/ui/mobile-bottom-nav.tsx';
  
  if (!fs.existsSync(navPath)) {
    logger.error('Mobile bottom nav not found');
    return null;
  }
  
  const content = fs.readFileSync(navPath, 'utf8');
  
  // Check breakpoint usage
  const breakpointUsage = {
    smHidden: content.includes('sm:hidden'),
    hasLogout: content.includes('logout') || content.includes('LogOut'),
    hasUseLogout: content.includes('useLogout')
  };
  
  logger.info('Mobile bottom nav analysis:', breakpointUsage);
  
  // Check if there are any logout-related imports or functionality
  const hasLogoutFunctionality = content.includes('logout') || content.includes('LogOut') || content.includes('signOut') || content.includes('SignOut');
  
  return {
    breakpointUsage,
    hasLogoutFunctionality,
    navItems: content.match(/href:\s*["']([^"']+)["']/g) || []
  };
}

function analyzeMobileHeaders() {
  logger.info('Analyzing mobile headers');
  
  const mobileHeaders = [
    'components/ui/consolidated-mobile-header-provider.tsx',
    'components/ui/consolidated-mobile-header.tsx',
    'components/ui/consolidated-mobile-header-admin.tsx'
  ];
  
  const analysis = {};
  
  mobileHeaders.forEach(headerPath => {
    if (!fs.existsSync(headerPath)) {
      logger.warn(`Header not found: ${headerPath}`);
      return;
    }
    
    const content = fs.readFileSync(headerPath, 'utf8');
    const headerName = path.basename(headerPath, '.tsx');
    
    analysis[headerName] = {
      hasUseLogout: content.includes('useLogout'),
      hasConfirmLogout: content.includes('confirmLogout'),
      hasLogoutDialog: content.includes('showLogoutConfirm'),
      hasLoadingState: content.includes('isLoggingOut'),
      hasNuclearLogout: content.includes('logout()'),
      breakpointUsage: {
        hasResponsiveClasses: /(hidden|block|flex)\s+(sm|md|lg|xl|2xl):/.test(content),
        classes: content.match(/(hidden|block|flex)\s+(sm|md|lg|xl|2xl):[^\s]*/g) || []
      }
    };
    
    logger.info(`Header analysis for ${headerName}:`, analysis[headerName]);
  });
  
  return analysis;
}

function identifyLogoutGaps() {
  logger.info('Identifying logout functionality gaps');
  
  const breakpoints = analyzeBreakpoints();
  const providerAnalysis = analyzeProviderDashboardResponsive();
  const bottomNavAnalysis = analyzeMobileBottomNav();
  const headersAnalysis = analyzeMobileHeaders();
  
  console.log('\n🔍 RESPONSIVE LOGOUT ANALYSIS');
  console.log('==============================');
  
  // Screen size analysis
  console.log('\n📱 SCREEN SIZE COVERAGE:');
  console.log('xs (0-639px)    : Very small phones');
  console.log('sm (640-767px)  : Large phones, small tablets');
  console.log('md (768-1023px) : Tablets');
  console.log('lg (1024px+)    : Desktop');
  
  // Component analysis
  console.log('\n🧩 COMPONENT BREAKDOWN:');
  console.log('Desktop (lg+): Desktop sidebar with logout');
  console.log('Mobile (<lg) : ConsolidatedMobileHeaderProvider + MobileBottomNav');
  
  // Issue identification
  console.log('\n⚠️  POTENTIAL ISSUES:');
  
  const issues = [];
  
  // Check if mobile bottom nav has logout
  if (bottomNavAnalysis && !bottomNavAnalysis.hasLogoutFunctionality) {
    issues.push('MobileBottomNav has no logout functionality');
  }
  
  // Check if mobile headers are properly implemented
  if (headersAnalysis) {
    Object.entries(headersAnalysis).forEach(([header, analysis]) => {
      if (!analysis.hasUseLogout || !analysis.hasConfirmLogout) {
        issues.push(`${header} missing comprehensive logout`);
      }
    });
  }
  
  // Check breakpoint gaps
  if (providerAnalysis?.layoutAnalysis) {
    if (providerAnalysis.layoutAnalysis.mobileLayout === 'below lg' && providerAnalysis.layoutAnalysis.desktopSidebar === 'lg and up') {
      // Check if there's a gap between sm and lg
      if (bottomNavAnalysis?.breakpointUsage?.smHidden) {
        issues.push('Potential gap: MobileBottomNav only shows sm:hidden, but mobile header shows lg:hidden');
      }
    }
  }
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Ensure ConsolidatedMobileHeaderProvider is accessible on all mobile sizes');
  console.log('2. Add logout to MobileBottomNav for very small screens');
  console.log('3. Test logout on actual mobile devices at different sizes');
  console.log('4. Verify mobile header menu is accessible and working');
  
  return {
    breakpoints,
    providerAnalysis,
    bottomNavAnalysis,
    headersAnalysis,
    issues
  };
}

function runResponsiveLogoutAnalysis() {
  logger.info('Running comprehensive responsive logout analysis');
  
  try {
    const analysis = identifyLogoutGaps();
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    
    const totalIssues = analysis.issues.length;
    
    if (totalIssues === 0) {
      console.log('🎉 No responsive logout issues detected!');
    } else {
      console.log(`⚠️  ${totalIssues} responsive logout issues found`);
      console.log('🔧 Please address the issues above to fix mobile logout');
    }
    
    return analysis;
    
  } catch (error) {
    logger.error('Error in responsive logout analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    return null;
  }
}

// Handle script execution
if (require.main === module) {
  runResponsiveLogoutAnalysis();
}

module.exports = {
  analyzeBreakpoints,
  analyzeProviderDashboardResponsive,
  analyzeMobileBottomNav,
  analyzeMobileHeaders,
  identifyLogoutGaps,
  runResponsiveLogoutAnalysis
};
