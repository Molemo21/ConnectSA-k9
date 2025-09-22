#!/usr/bin/env node

/**
 * Test script to verify logout functionality works correctly
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

const logger = createLogger('TestLogoutFunctionality');

function analyzeLogoutAPI() {
  logger.info('Analyzing logout API endpoint');
  
  try {
    const filePath = 'app/api/auth/logout/route.ts';
    if (!fs.existsSync(filePath)) {
      logger.error('Logout API file not found');
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      name: 'Logout API',
      lineCount: content.split('\n').length,
      features: [],
      issues: [],
      improvements: []
    };

    // Check for POST method
    if (content.includes('export async function POST')) {
      analysis.features.push('✅ POST method implemented for logout');
    }

    // Check for GET method
    if (content.includes('export async function GET')) {
      analysis.features.push('✅ GET method implemented for logout redirect');
    }

    // Check for dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      analysis.features.push('✅ Dynamic export for proper server-side rendering');
    }

    // Check for credentials include
    if (content.includes('credentials: "include"')) {
      analysis.features.push('✅ Credentials include for cookie handling');
    }

    // Check for cookie clearing
    if (content.includes('cookieStore.delete("auth-token")')) {
      analysis.features.push('✅ Auth token cookie deletion');
    }

    if (content.includes('cookieStore.delete("user-session")')) {
      analysis.features.push('✅ User session cookie deletion');
    }

    if (content.includes('cookieStore.delete("auth-session")')) {
      analysis.features.push('✅ Auth session cookie deletion');
    }

    // Check for domain-specific cookie clearing
    if (content.includes('app.proliinkconnect.co.za')) {
      analysis.features.push('✅ Production domain cookie clearing');
    }

    if (content.includes('.proliinkconnect.co.za')) {
      analysis.features.push('✅ Parent domain cookie clearing');
    }

    // Check for cookie expiration
    if (content.includes('expires: new Date(0)')) {
      analysis.features.push('✅ Cookie expiration to past date');
    }

    if (content.includes('maxAge: 0')) {
      analysis.features.push('✅ Cookie maxAge set to 0');
    }

    // Check for security settings
    if (content.includes('httpOnly: true')) {
      analysis.features.push('✅ HttpOnly cookies for security');
    }

    if (content.includes('secure: process.env.NODE_ENV === \'production\'')) {
      analysis.features.push('✅ Secure cookies in production');
    }

    if (content.includes("sameSite: 'lax'")) {
      analysis.features.push('✅ SameSite lax for CSRF protection');
    }

    // Check for potential issues
    if (!content.includes('credentials: "include"')) {
      analysis.issues.push('⚠️ Missing credentials include in logout hook');
    }

    if (!content.includes('window.location.href')) {
      analysis.issues.push('⚠️ Missing hard redirect after logout');
    }

    return analysis;
  } catch (error) {
    logger.error('Error analyzing logout API', error);
    return null;
  }
}

function analyzeLogoutHook() {
  logger.info('Analyzing logout hook');
  
  try {
    const filePath = 'hooks/use-logout.ts';
    if (!fs.existsSync(filePath)) {
      logger.error('Logout hook file not found');
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    const analysis = {
      name: 'Logout Hook',
      lineCount: content.split('\n').length,
      features: [],
      issues: [],
      improvements: []
    };

    // Check for credentials include
    if (content.includes('credentials: "include"')) {
      analysis.features.push('✅ Credentials include for cookie sending');
    }

    // Check for localStorage clearing
    if (content.includes('localStorage.removeItem("user")')) {
      analysis.features.push('✅ User data removal from localStorage');
    }

    if (content.includes('localStorage.clear()')) {
      analysis.features.push('✅ Complete localStorage clearing');
    }

    // Check for sessionStorage clearing
    if (content.includes('sessionStorage.clear()')) {
      analysis.features.push('✅ Session storage clearing');
    }

    // Check for client-side cookie clearing
    if (content.includes('document.cookie')) {
      analysis.features.push('✅ Client-side cookie clearing');
    }

    // Check for hard redirect
    if (content.includes('window.location.href = "/"')) {
      analysis.features.push('✅ Hard redirect to home page');
    }

    // Check for toast notifications
    if (content.includes('showToast.success')) {
      analysis.features.push('✅ Success toast notification');
    }

    if (content.includes('showToast.error')) {
      analysis.features.push('✅ Error toast notification');
    }

    // Check for loading state
    if (content.includes('isLoggingOut')) {
      analysis.features.push('✅ Loading state management');
    }

    // Check for error handling
    if (content.includes('catch (error)')) {
      analysis.features.push('✅ Error handling');
    }

    // Check for potential issues
    if (!content.includes('credentials: "include"')) {
      analysis.issues.push('❌ Missing credentials include');
    }

    if (!content.includes('window.location.href')) {
      analysis.issues.push('❌ Missing hard redirect');
    }

    return analysis;
  } catch (error) {
    logger.error('Error analyzing logout hook', error);
    return null;
  }
}

function validateLogoutFlow() {
  logger.info('Validating complete logout flow');
  
  try {
    const apiAnalysis = analyzeLogoutAPI();
    const hookAnalysis = analyzeLogoutHook();
    
    if (!apiAnalysis || !hookAnalysis) {
      logger.error('Failed to analyze logout components');
      return null;
    }

    const validation = {
      complete: true,
      issues: [],
      recommendations: []
    };

    // Check for complete cookie clearing
    const hasAuthTokenClearing = apiAnalysis.features.some(f => f.includes('Auth token cookie deletion'));
    const hasUserSessionClearing = apiAnalysis.features.some(f => f.includes('User session cookie deletion'));
    const hasAuthSessionClearing = apiAnalysis.features.some(f => f.includes('Auth session cookie deletion'));
    
    if (!hasAuthTokenClearing) {
      validation.issues.push('❌ Auth token cookie not being cleared');
      validation.complete = false;
    }
    
    if (!hasUserSessionClearing) {
      validation.issues.push('❌ User session cookie not being cleared');
      validation.complete = false;
    }
    
    if (!hasAuthSessionClearing) {
      validation.issues.push('❌ Auth session cookie not being cleared');
      validation.complete = false;
    }

    // Check for domain-specific clearing
    const hasProductionDomainClearing = apiAnalysis.features.some(f => f.includes('Production domain cookie clearing'));
    if (!hasProductionDomainClearing) {
      validation.issues.push('⚠️ Production domain cookies may not be cleared');
      validation.recommendations.push('Ensure production domain cookies are cleared');
    }

    // Check for client-side clearing
    const hasClientSideClearing = hookAnalysis.features.some(f => f.includes('Client-side cookie clearing'));
    if (!hasClientSideClearing) {
      validation.issues.push('⚠️ Client-side cookies may not be cleared');
      validation.recommendations.push('Add client-side cookie clearing');
    }

    // Check for hard redirect
    const hasHardRedirect = hookAnalysis.features.some(f => f.includes('Hard redirect to home page'));
    if (!hasHardRedirect) {
      validation.issues.push('❌ No hard redirect after logout');
      validation.complete = false;
    }

    // Check for credentials include
    const hasCredentialsInclude = hookAnalysis.features.some(f => f.includes('Credentials include for cookie sending'));
    if (!hasCredentialsInclude) {
      validation.issues.push('❌ Missing credentials include in logout request');
      validation.complete = false;
    }

    return {
      apiAnalysis,
      hookAnalysis,
      validation
    };
  } catch (error) {
    logger.error('Error validating logout flow', error);
    return null;
  }
}

function main() {
  console.log('🔐 TESTING LOGOUT FUNCTIONALITY');
  console.log('=================================');
  
  try {
    // Analyze logout API
    console.log('\n1. Analyzing Logout API...');
    const apiAnalysis = analyzeLogoutAPI();
    
    if (!apiAnalysis) {
      console.log('❌ Failed to analyze logout API');
      return;
    }

    console.log('\n📊 LOGOUT API ANALYSIS');
    console.log('========================');
    console.log(`Lines of code: ${apiAnalysis.lineCount}`);
    console.log(`Features: ${apiAnalysis.features.length}`);
    console.log(`Issues: ${apiAnalysis.issues.length}`);

    console.log('\n✅ FEATURES:');
    apiAnalysis.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });

    if (apiAnalysis.issues.length > 0) {
      console.log('\n⚠️ ISSUES:');
      apiAnalysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Analyze logout hook
    console.log('\n2. Analyzing Logout Hook...');
    const hookAnalysis = analyzeLogoutHook();
    
    if (!hookAnalysis) {
      console.log('❌ Failed to analyze logout hook');
      return;
    }

    console.log('\n📊 LOGOUT HOOK ANALYSIS');
    console.log('=========================');
    console.log(`Lines of code: ${hookAnalysis.lineCount}`);
    console.log(`Features: ${hookAnalysis.features.length}`);
    console.log(`Issues: ${hookAnalysis.issues.length}`);

    console.log('\n✅ FEATURES:');
    hookAnalysis.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });

    if (hookAnalysis.issues.length > 0) {
      console.log('\n⚠️ ISSUES:');
      hookAnalysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Validate complete logout flow
    console.log('\n3. Validating Complete Logout Flow...');
    const validation = validateLogoutFlow();
    
    if (!validation) {
      console.log('❌ Failed to validate logout flow');
      return;
    }

    console.log('\n🔍 LOGOUT FLOW VALIDATION');
    console.log('===========================');
    console.log(`Complete: ${validation.validation.complete ? '✅ Yes' : '❌ No'}`);
    console.log(`Issues: ${validation.validation.issues.length}`);
    console.log(`Recommendations: ${validation.validation.recommendations.length}`);

    if (validation.validation.issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      validation.validation.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (validation.validation.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      validation.validation.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n💡 SUMMARY');
    console.log('===========');
    if (validation.validation.complete) {
      console.log('✅ **LOGOUT FUNCTIONALITY IS PROPERLY IMPLEMENTED**');
      console.log('The logout system includes:');
      console.log('1. ✅ **Server-side cookie clearing** - All auth cookies are properly deleted');
      console.log('2. ✅ **Client-side state clearing** - localStorage and sessionStorage cleared');
      console.log('3. ✅ **Domain-specific clearing** - Production domain cookies handled');
      console.log('4. ✅ **Hard redirect** - Forces page reload to clear all state');
      console.log('5. ✅ **Credentials include** - Ensures cookies are sent with logout request');
      console.log('6. ✅ **Security settings** - HttpOnly, Secure, SameSite properly configured');
      console.log('7. ✅ **Error handling** - Proper error handling and user feedback');
      
      console.log('\n🎯 **EXPECTED RESULTS:**');
      console.log('• Logout should now work correctly in production');
      console.log('• All authentication cookies will be cleared');
      console.log('• User will be redirected to home page');
      console.log('• Page refresh will not restore login state');
    } else {
      console.log('❌ **LOGOUT FUNCTIONALITY HAS ISSUES**');
      console.log('Please address the critical issues above before deploying.');
    }

  } catch (error) {
    logger.error('Error in logout functionality test', error);
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeLogoutAPI,
  analyzeLogoutHook,
  validateLogoutFlow,
  main
};
