#!/usr/bin/env node

/**
 * Comprehensive script to add dynamic exports to all API routes that use authentication
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

const logger = createLogger('FixAllDynamicExports');

function getAllApiRoutes() {
  const routes = [];
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        scanDirectory(itemPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        const relativePath = path.relative(process.cwd(), itemPath);
        routes.push(relativePath);
      }
    }
  }
  
  scanDirectory(apiDir);
  return routes;
}

function checkRouteUsesAuth(routePath) {
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Check for authentication-related imports and usage
    const authPatterns = [
      'getCurrentUser',
      'getCurrentUserSafe',
      'cookies()',
      'headers()',
      'auth()'
    ];
    
    return authPatterns.some(pattern => content.includes(pattern));
  } catch (error) {
    logger.error(`Error reading route ${routePath}`, error);
    return false;
  }
}

function hasDynamicExport(routePath) {
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    return content.includes('export const dynamic');
  } catch (error) {
    logger.error(`Error checking dynamic export in ${routePath}`, error);
    return false;
  }
}

function addDynamicExport(routePath) {
  try {
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex === -1) {
      logger.warn(`No import statements found in ${routePath}`);
      return false;
    }
    
    // Insert the dynamic export after the last import
    const dynamicExport = "export const dynamic = 'force-dynamic'";
    lines.splice(lastImportIndex + 1, 0, '', dynamicExport, '');
    
    const newContent = lines.join('\n');
    fs.writeFileSync(routePath, newContent, 'utf8');
    
    logger.info(`Added dynamic export to ${routePath}`);
    return true;
  } catch (error) {
    logger.error(`Error adding dynamic export to ${routePath}`, error);
    return false;
  }
}

function shouldSkipRoute(routePath) {
  // Skip routes that don't need dynamic exports
  const skipPatterns = [
    '/health/route.ts',
    '/test/route.ts',
    '/webhooks/',
    '/db-test/route.ts'
  ];
  
  return skipPatterns.some(pattern => routePath.includes(pattern));
}

async function fixAllDynamicExports() {
  logger.info('Starting comprehensive dynamic export fix');
  
  const allRoutes = getAllApiRoutes();
  logger.info(`Found ${allRoutes.length} total API routes`);
  
  const routesNeedingFix = [];
  const routesAlreadyFixed = [];
  const routesSkipped = [];
  const routesWithErrors = [];
  
  for (const route of allRoutes) {
    try {
      if (shouldSkipRoute(route)) {
        routesSkipped.push(route);
        continue;
      }
      
      if (!checkRouteUsesAuth(route)) {
        routesSkipped.push(route);
        continue;
      }
      
      if (hasDynamicExport(route)) {
        routesAlreadyFixed.push(route);
      } else {
        routesNeedingFix.push(route);
      }
    } catch (error) {
      logger.error(`Error processing route ${route}`, error);
      routesWithErrors.push({ route, error: error.message });
    }
  }
  
  logger.info('Route analysis complete', {
    totalRoutes: allRoutes.length,
    needsFix: routesNeedingFix.length,
    alreadyFixed: routesAlreadyFixed.length,
    skipped: routesSkipped.length,
    errors: routesWithErrors.length
  });
  
  console.log('\n📊 ROUTE ANALYSIS');
  console.log('==================');
  console.log(`Total API routes: ${allRoutes.length}`);
  console.log(`Need dynamic export: ${routesNeedingFix.length}`);
  console.log(`Already have dynamic export: ${routesAlreadyFixed.length}`);
  console.log(`Skipped (no auth): ${routesSkipped.length}`);
  console.log(`Errors: ${routesWithErrors.length}`);
  
  if (routesNeedingFix.length > 0) {
    console.log('\n🔧 ROUTES NEEDING FIX:');
    routesNeedingFix.forEach(route => console.log(`  ❌ ${route}`));
  }
  
  if (routesAlreadyFixed.length > 0) {
    console.log('\n✅ ROUTES ALREADY FIXED:');
    routesAlreadyFixed.forEach(route => console.log(`  ✅ ${route}`));
  }
  
  if (routesWithErrors.length > 0) {
    console.log('\n❌ ROUTES WITH ERRORS:');
    routesWithErrors.forEach(({ route, error }) => console.log(`  ❌ ${route}: ${error}`));
  }
  
  // Fix routes that need it
  let fixedCount = 0;
  let failedCount = 0;
  
  for (const route of routesNeedingFix) {
    try {
      const success = addDynamicExport(route);
      if (success) {
        fixedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      logger.error(`Failed to fix route ${route}`, error);
      failedCount++;
    }
  }
  
  console.log('\n🎯 FIX RESULTS');
  console.log('===============');
  console.log(`✅ Successfully fixed: ${fixedCount}/${routesNeedingFix.length}`);
  console.log(`❌ Failed to fix: ${failedCount}/${routesNeedingFix.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 DYNAMIC EXPORTS ADDED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('All authenticated API routes now have dynamic rendering.');
    console.log('This should resolve all build-time static generation errors.');
  }
  
  return {
    totalRoutes: allRoutes.length,
    needsFix: routesNeedingFix.length,
    alreadyFixed: routesAlreadyFixed.length,
    skipped: routesSkipped.length,
    errors: routesWithErrors.length,
    fixedCount,
    failedCount
  };
}

// Handle script execution
if (require.main === module) {
  fixAllDynamicExports().catch((error) => {
    logger.error('Script execution failed', error);
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  fixAllDynamicExports,
  getAllApiRoutes,
  checkRouteUsesAuth,
  hasDynamicExport,
  addDynamicExport
};
