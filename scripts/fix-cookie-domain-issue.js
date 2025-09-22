#!/usr/bin/env node

/**
 * Script to fix potential cookie domain issues
 */

const fs = require('fs');

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

const logger = createLogger('CookieDomainFix');

function analyzeCookieDomainIssue() {
  logger.info('Analyzing cookie domain configuration');
  
  console.log('🍪 COOKIE DOMAIN ANALYSIS');
  console.log('=========================');
  
  // Check current environment variables
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const nodeEnv = process.env.NODE_ENV;
  
  console.log(`Current COOKIE_DOMAIN: ${cookieDomain || 'Not set'}`);
  console.log(`NODE_ENV: ${nodeEnv}`);
  
  // Analyze the issue
  if (cookieDomain === 'app.proliinkconnect.co.za') {
    console.log('\n⚠️  POTENTIAL ISSUE IDENTIFIED:');
    console.log('The COOKIE_DOMAIN is set to "app.proliinkconnect.co.za"');
    console.log('This might cause issues because:');
    console.log('1. The cookie domain should typically start with a dot for subdomain sharing');
    console.log('2. Setting it to the exact domain might prevent cookie access');
    console.log('3. API calls might not include the cookie due to domain restrictions');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('Option 1: Remove COOKIE_DOMAIN entirely (let browser handle it)');
    console.log('Option 2: Set COOKIE_DOMAIN to ".proliinkconnect.co.za" (with leading dot)');
    console.log('Option 3: Set COOKIE_DOMAIN to "proliinkconnect.co.za" (without leading dot)');
    
    return {
      issue: 'cookie_domain_misconfiguration',
      currentDomain: cookieDomain,
      recommendations: [
        'Remove COOKIE_DOMAIN environment variable',
        'Set COOKIE_DOMAIN to ".proliinkconnect.co.za"',
        'Set COOKIE_DOMAIN to "proliinkconnect.co.za"'
      ]
    };
  } else if (!cookieDomain) {
    console.log('\n✅ COOKIE_DOMAIN is not set - this is usually fine');
    console.log('The browser will handle cookie domain automatically');
    return {
      issue: 'no_issue',
      currentDomain: null,
      recommendations: ['No changes needed']
    };
  } else {
    console.log('\n⚠️  UNKNOWN COOKIE_DOMAIN configuration');
    console.log('Please verify the domain setting is correct');
    return {
      issue: 'unknown_configuration',
      currentDomain: cookieDomain,
      recommendations: ['Verify cookie domain configuration']
    };
  }
}

function checkAuthCookieConfiguration() {
  logger.info('Checking authentication cookie configuration');
  
  console.log('\n🔐 AUTHENTICATION COOKIE CONFIGURATION');
  console.log('======================================');
  
  try {
    const authFile = 'lib/auth.ts';
    if (fs.existsSync(authFile)) {
      const content = fs.readFileSync(authFile, 'utf8');
      
      // Check for cookie configuration
      const cookieConfigMatch = content.match(/cookieStore\.set\(['"]auth-token['"].*?\{([^}]+)\}/s);
      if (cookieConfigMatch) {
        console.log('✅ Found auth cookie configuration:');
        console.log(cookieConfigMatch[1]);
        
        // Check for domain setting
        if (content.includes('domain: process.env.COOKIE_DOMAIN')) {
          console.log('✅ Cookie domain is configurable via environment variable');
        }
        
        // Check for security settings
        if (content.includes('httpOnly: true')) {
          console.log('✅ Cookie is httpOnly (secure)');
        }
        
        if (content.includes('secure: process.env.NODE_ENV === "production"')) {
          console.log('✅ Cookie uses secure flag in production');
        }
        
        if (content.includes('sameSite: "lax"')) {
          console.log('✅ Cookie uses sameSite: "lax"');
        }
        
      } else {
        console.log('❌ Could not find auth cookie configuration');
      }
    } else {
      console.log('❌ Auth file not found');
    }
  } catch (error) {
    logger.error('Error checking auth cookie configuration', error);
    console.log(`❌ Error: ${error.message}`);
  }
}

function generateRecommendations() {
  console.log('\n📋 RECOMMENDED ACTIONS');
  console.log('======================');
  
  console.log('1. 🔧 IMMEDIATE FIX - Update COOKIE_DOMAIN:');
  console.log('   Option A: Remove COOKIE_DOMAIN entirely');
  console.log('   Option B: Set COOKIE_DOMAIN=.proliinkconnect.co.za');
  console.log('   Option C: Set COOKIE_DOMAIN=proliinkconnect.co.za');
  
  console.log('\n2. 🧪 TEST THE FIX:');
  console.log('   - Update the environment variable');
  console.log('   - Redeploy the application');
  console.log('   - Try logging in as a provider');
  console.log('   - Check if the provider dashboard loads');
  
  console.log('\n3. 🔍 VERIFY COOKIES:');
  console.log('   - Open browser developer tools');
  console.log('   - Go to Application/Storage tab');
  console.log('   - Check Cookies for app.proliinkconnect.co.za');
  console.log('   - Verify auth-token cookie exists and has correct domain');
  
  console.log('\n4. 📊 MONITOR RESULTS:');
  console.log('   - Check if /api/auth/me returns user data');
  console.log('   - Check if /api/provider/bookings works');
  console.log('   - Verify provider dashboard loads successfully');
}

function main() {
  console.log('🔍 COOKIE DOMAIN DIAGNOSTIC TOOL');
  console.log('================================');
  
  try {
    const analysis = analyzeCookieDomainIssue();
    checkAuthCookieConfiguration();
    generateRecommendations();
    
    console.log('\n🎯 SUMMARY');
    console.log('==========');
    console.log(`Issue: ${analysis.issue}`);
    console.log(`Current domain: ${analysis.currentDomain || 'Not set'}`);
    console.log(`Recommendations: ${analysis.recommendations.length}`);
    
    if (analysis.issue === 'cookie_domain_misconfiguration') {
      console.log('\n🚨 ACTION REQUIRED: Cookie domain misconfiguration detected');
      console.log('This is likely the root cause of the authentication issues');
    }
    
  } catch (error) {
    logger.error('Error in cookie domain analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCookieDomainIssue,
  checkAuthCookieConfiguration,
  generateRecommendations
};
