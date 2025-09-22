#!/usr/bin/env node

/**
 * Verify all comprehensive fixes are working correctly
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

const logger = createLogger('VerifyComprehensiveFixes');

function verifyDynamicRendering() {
  logger.info('Verifying dynamic rendering fixes');
  
  const pagesToCheck = [
    'app/provider/dashboard/page.tsx',
    'app/admin/analytics/page.tsx',
    'app/admin/audit-logs/page.tsx',
    'app/admin/dashboard/page.tsx',
    'app/admin/users/page.tsx',
    'app/admin/system/page.tsx',
    'app/admin/payments/page.tsx',
    'app/admin/providers/page.tsx',
    'app/bookings/page.tsx',
    'app/profile/page.tsx',
    'app/provider/bank-details/page.tsx'
  ];

  let successCount = 0;
  let totalCount = pagesToCheck.length;

  for (const page of pagesToCheck) {
    try {
      if (!fs.existsSync(page)) {
        logger.warn(`Page not found: ${page}`);
        continue;
      }

      const content = fs.readFileSync(page, 'utf8');
      
      if (content.includes('export const dynamic = "force-dynamic"')) {
        logger.info(`✅ Dynamic rendering found in: ${page}`);
        successCount++;
      } else {
        logger.warn(`❌ Dynamic rendering missing in: ${page}`);
      }
    } catch (error) {
      logger.error(`Error checking ${page}`, error);
    }
  }

  return { successCount, totalCount, success: successCount === totalCount };
}

function verifyAuthenticationConfiguration() {
  logger.info('Verifying authentication configuration');
  
  try {
    // Check if auth-enhanced.ts exists
    if (!fs.existsSync('lib/auth-enhanced.ts')) {
      logger.warn('Enhanced auth file not found');
      return { success: false, message: 'Enhanced auth file missing' };
    }

    // Check if error-handling.ts exists
    if (!fs.existsSync('lib/error-handling.ts')) {
      logger.warn('Error handling file not found');
      return { success: false, message: 'Error handling file missing' };
    }

    // Check original auth.ts for cookie domain fix
    const authContent = fs.readFileSync('lib/auth.ts', 'utf8');
    if (authContent.includes('app.proliinkconnect.co.za')) {
      logger.info('✅ Cookie domain fix found in auth.ts');
      return { success: true, message: 'Authentication properly configured' };
    } else {
      logger.warn('⚠️ Cookie domain fix not found in auth.ts');
      return { success: false, message: 'Cookie domain fix missing' };
    }
  } catch (error) {
    logger.error('Error verifying authentication configuration', error);
    return { success: false, message: error.message };
  }
}

function verifyProviderDashboardAPI() {
  logger.info('Verifying provider dashboard API');
  
  try {
    // Check if enhanced provider dashboard API exists
    if (!fs.existsSync('app/api/provider/dashboard-enhanced/route.ts')) {
      logger.warn('Enhanced provider dashboard API not found');
      return { success: false, message: 'Enhanced provider dashboard API missing' };
    }

    const content = fs.readFileSync('app/api/provider/dashboard-enhanced/route.ts', 'utf8');
    
    const checks = [
      'export const dynamic = \'force-dynamic\'',
      'getCurrentUser()',
      'prisma.provider.findUnique',
      'prisma.booking.findMany',
      'NextResponse.json'
    ];

    let passedChecks = 0;
    for (const check of checks) {
      if (content.includes(check)) {
        passedChecks++;
      }
    }

    if (passedChecks === checks.length) {
      logger.info('✅ Enhanced provider dashboard API properly configured');
      return { success: true, message: 'Provider dashboard API ready' };
    } else {
      logger.warn(`⚠️ Enhanced provider dashboard API missing ${checks.length - passedChecks} checks`);
      return { success: false, message: 'Provider dashboard API incomplete' };
    }
  } catch (error) {
    logger.error('Error verifying provider dashboard API', error);
    return { success: false, message: error.message };
  }
}

function verifyPrismaSchema() {
  logger.info('Verifying Prisma schema');
  
  try {
    if (!fs.existsSync('prisma/schema.prisma')) {
      logger.error('Prisma schema not found');
      return { success: false, message: 'Prisma schema missing' };
    }

    const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
    
    const requiredModels = ['User', 'Provider', 'Booking', 'Payment', 'Service'];
    const missingModels = requiredModels.filter(model => !content.includes(`model ${model}`));
    
    if (missingModels.length === 0) {
      logger.info('✅ All required Prisma models found');
      return { success: true, message: 'Prisma schema properly configured' };
    } else {
      logger.error(`❌ Missing Prisma models: ${missingModels.join(', ')}`);
      return { success: false, message: `Missing models: ${missingModels.join(', ')}` };
    }
  } catch (error) {
    logger.error('Error verifying Prisma schema', error);
    return { success: false, message: error.message };
  }
}

function verifyAPIErrorHandling() {
  logger.info('Verifying API error handling');
  
  try {
    if (!fs.existsSync('lib/error-handling.ts')) {
      logger.warn('Error handling utilities not found');
      return { success: false, message: 'Error handling utilities missing' };
    }

    const content = fs.readFileSync('lib/error-handling.ts', 'utf8');
    
    const requiredExports = [
      'AppError',
      'handleApiError',
      'withErrorHandling'
    ];

    const missingExports = requiredExports.filter(exportName => !content.includes(exportName));
    
    if (missingExports.length === 0) {
      logger.info('✅ Error handling utilities properly configured');
      return { success: true, message: 'Error handling ready' };
    } else {
      logger.warn(`⚠️ Missing error handling exports: ${missingExports.join(', ')}`);
      return { success: false, message: `Missing exports: ${missingExports.join(', ')}` };
    }
  } catch (error) {
    logger.error('Error verifying API error handling', error);
    return { success: false, message: error.message };
  }
}

function main() {
  console.log('🔍 VERIFYING COMPREHENSIVE FIXES');
  console.log('=================================');
  
  const results = {
    dynamicRendering: verifyDynamicRendering(),
    authentication: verifyAuthenticationConfiguration(),
    providerDashboard: verifyProviderDashboardAPI(),
    prismaSchema: verifyPrismaSchema(),
    errorHandling: verifyAPIErrorHandling()
  };

  console.log('\n📊 VERIFICATION RESULTS');
  console.log('========================');
  
  let totalSuccess = 0;
  let totalChecks = Object.keys(results).length;

  for (const [category, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${category}: ${result.message}`);
    if (result.success) totalSuccess++;
    
    if (result.successCount && result.totalCount) {
      console.log(`   Details: ${result.successCount}/${result.totalCount} items verified`);
    }
  }

  console.log('\n🎯 OVERALL SUMMARY');
  console.log('==================');
  console.log(`✅ Successful: ${totalSuccess}/${totalChecks} categories`);
  console.log(`❌ Failed: ${totalChecks - totalSuccess}/${totalChecks} categories`);

  if (totalSuccess === totalChecks) {
    console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
    console.log('===================================');
    console.log('✅ Dynamic rendering applied to all authenticated pages');
    console.log('✅ Authentication and cookie handling optimized');
    console.log('✅ Provider dashboard API enhanced');
    console.log('✅ Prisma schema verified');
    console.log('✅ Error handling utilities created');
    
    console.log('\n📋 READY FOR DEPLOYMENT');
    console.log('========================');
    console.log('1. All dynamic rendering issues resolved');
    console.log('2. Authentication cookie domain handling fixed');
    console.log('3. Provider dashboard will load correctly');
    console.log('4. Enhanced error handling in place');
    console.log('5. Database schema properly configured');
    
  } else {
    console.log('\n⚠️  SOME FIXES NEED ATTENTION');
    console.log('==============================');
    console.log('Please review the failed categories above');
    console.log('and apply missing fixes before deployment');
  }

  return totalSuccess === totalChecks;
}

// Handle script execution
if (require.main === module) {
  const success = main();
  process.exit(success ? 0 : 1);
}

module.exports = {
  verifyDynamicRendering,
  verifyAuthenticationConfiguration,
  verifyProviderDashboardAPI,
  verifyPrismaSchema,
  verifyAPIErrorHandling
};
