#!/usr/bin/env node

/**
 * Debug script to identify logout issues
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

const logger = createLogger('DebugLogoutIssue');

function analyzeAuthFiles() {
  logger.info('Analyzing authentication files');
  
  try {
    const authFiles = [
      'lib/auth.ts',
      'lib/auth-enhanced.ts',
      'app/api/auth/logout/route.ts',
      'hooks/use-logout.ts',
      'app/api/auth/login/route.ts'
    ];

    const analysis = {
      cookieNames: new Set(),
      authMechanisms: [],
      issues: [],
      recommendations: []
    };

    authFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract cookie names
        const cookieMatches = content.match(/['"]([a-zA-Z0-9-_]+)['"]/g);
        if (cookieMatches) {
          cookieMatches.forEach(match => {
            const cookieName = match.replace(/['"]/g, '');
            if (cookieName.includes('auth') || cookieName.includes('session') || cookieName.includes('token')) {
              analysis.cookieNames.add(cookieName);
            }
          });
        }

        // Check for authentication mechanisms
        if (content.includes('setAuthCookie')) {
          analysis.authMechanisms.push('setAuthCookie function');
        }
        if (content.includes('getCurrentUser')) {
          analysis.authMechanisms.push('getCurrentUser function');
        }
        if (content.includes('signToken')) {
          analysis.authMechanisms.push('JWT token signing');
        }
        if (content.includes('verifyToken')) {
          analysis.authMechanisms.push('JWT token verification');
        }

        // Check for potential issues
        if (content.includes('COOKIE_DOMAIN')) {
          analysis.authMechanisms.push('COOKIE_DOMAIN configuration');
        }
        if (content.includes('httpOnly')) {
          analysis.authMechanisms.push('HttpOnly cookies');
        }
        if (content.includes('secure')) {
          analysis.authMechanisms.push('Secure cookies');
        }
      } else {
        logger.warn(`File not found: ${filePath}`);
      }
    });

    return analysis;
  } catch (error) {
    logger.error('Error analyzing auth files', error);
    return null;
  }
}

function identifyLogoutIssues() {
  logger.info('Identifying potential logout issues');
  
  const issues = [];
  const recommendations = [];

  // Check if logout API exists and is properly configured
  const logoutApiPath = 'app/api/auth/logout/route.ts';
  if (!fs.existsSync(logoutApiPath)) {
    issues.push('❌ Logout API endpoint missing');
    recommendations.push('Create logout API endpoint');
  } else {
    const logoutContent = fs.readFileSync(logoutApiPath, 'utf8');
    
    // Check for proper cookie clearing
    if (!logoutContent.includes('auth-token')) {
      issues.push('❌ Auth token not being cleared in logout API');
      recommendations.push('Add auth-token cookie clearing to logout API');
    }
    
    if (!logoutContent.includes('credentials')) {
      issues.push('❌ Credentials not included in logout requests');
      recommendations.push('Add credentials: include to logout requests');
    }
    
    // Check for domain-specific clearing
    if (!logoutContent.includes('proliinkconnect.co.za')) {
      issues.push('⚠️ Production domain cookies may not be cleared');
      recommendations.push('Add production domain cookie clearing');
    }
  }

  // Check logout hook
  const logoutHookPath = 'hooks/use-logout.ts';
  if (!fs.existsSync(logoutHookPath)) {
    issues.push('❌ Logout hook missing');
    recommendations.push('Create logout hook');
  } else {
    const hookContent = fs.readFileSync(logoutHookPath, 'utf8');
    
    if (!hookContent.includes('credentials: "include"')) {
      issues.push('❌ Credentials not included in logout hook');
      recommendations.push('Add credentials: include to logout hook');
    }
    
    if (!hookContent.includes('window.location.href')) {
      issues.push('❌ No hard redirect after logout');
      recommendations.push('Add hard redirect after logout');
    }
  }

  // Check for multiple auth files
  const authFiles = ['lib/auth.ts', 'lib/auth-enhanced.ts'];
  const existingAuthFiles = authFiles.filter(file => fs.existsSync(file));
  
  if (existingAuthFiles.length > 1) {
    issues.push('⚠️ Multiple auth files detected - may cause conflicts');
    recommendations.push('Consolidate authentication logic into single file');
  }

  return { issues, recommendations };
}

function createComprehensiveLogoutFix() {
  logger.info('Creating comprehensive logout fix');
  
  const logoutApiContent = `import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Logout request received');
    
    const cookieStore = await cookies();
    
    // Get all cookies to see what we're working with
    const allCookies = cookieStore.getAll();
    console.log('All cookies before logout:', allCookies.map(c => c.name));

    // Build response
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

    // Helper to expire a cookie with specific domain and path
    const expireCookie = (name: string, domain?: string, path: string = '/') => {
      const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: path,
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      };
      
      response.cookies.set(name, '', cookieConfig);
      console.log(\`Expired cookie: \${name}\`, { domain, path });
    };

    // List of all possible auth cookie names
    const authCookieNames = [
      'auth-token',
      'user-session', 
      'auth-session',
      'session',
      'token',
      'jwt',
      'user',
      'auth',
      'login',
      'sessionid',
      'session_id'
    ];

    // Clear all possible auth cookies
    authCookieNames.forEach(cookieName => {
      // Delete via cookies() API
      cookieStore.delete(cookieName);
      
      // Expire without domain
      expireCookie(cookieName);
      
      // Expire with different path variations
      expireCookie(cookieName, undefined, '/');
      expireCookie(cookieName, undefined, '/api');
      expireCookie(cookieName, undefined, '/dashboard');
      expireCookie(cookieName, undefined, '/provider');
      
      // Expire with domain variations
      if (process.env.NODE_ENV === 'production') {
        expireCookie(cookieName, 'app.proliinkconnect.co.za');
        expireCookie(cookieName, '.app.proliinkconnect.co.za');
        expireCookie(cookieName, '.proliinkconnect.co.za');
        expireCookie(cookieName, 'proliinkconnect.co.za');
      }
      
      // Handle COOKIE_DOMAIN if set
      if (process.env.COOKIE_DOMAIN) {
        expireCookie(cookieName, process.env.COOKIE_DOMAIN);
        if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
          expireCookie(cookieName, \`.\${process.env.COOKIE_DOMAIN}\`);
        }
      }
    });

    console.log('Logout completed successfully');
    return response;
    
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      error: "Failed to logout",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for logout (redirect from form)
  try {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // Same comprehensive cookie clearing as POST
    const expireCookie = (name: string, domain?: string, path: string = '/') => {
      const cookieConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: path,
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      };
      
      response.cookies.set(name, '', cookieConfig);
    };

    const authCookieNames = [
      'auth-token', 'user-session', 'auth-session', 'session', 'token', 
      'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id'
    ];

    authCookieNames.forEach(cookieName => {
      cookieStore.delete(cookieName);
      expireCookie(cookieName);
      expireCookie(cookieName, undefined, '/');
      expireCookie(cookieName, undefined, '/api');
      expireCookie(cookieName, undefined, '/dashboard');
      expireCookie(cookieName, undefined, '/provider');
      
      if (process.env.NODE_ENV === 'production') {
        expireCookie(cookieName, 'app.proliinkconnect.co.za');
        expireCookie(cookieName, '.app.proliinkconnect.co.za');
        expireCookie(cookieName, '.proliinkconnect.co.za');
        expireCookie(cookieName, 'proliinkconnect.co.za');
      }
      
      if (process.env.COOKIE_DOMAIN) {
        expireCookie(cookieName, process.env.COOKIE_DOMAIN);
        if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
          expireCookie(cookieName, \`.\${process.env.COOKIE_DOMAIN}\`);
        }
      }
    });

    return response;
  } catch (error) {
    console.error("Logout GET error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}`;

  const logoutHookContent = `"use client"

import { useState } from "react"
import { showToast } from "@/lib/toast"

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('Starting logout process...')
      
      // Make logout request with credentials
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log('Logout response:', response.status, response.statusText)

      if (response.ok) {
        showToast.success("Logged out successfully")
        console.log('Logout successful, clearing client state...')
        
        // Clear all possible client-side storage
        try {
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear any possible auth-related items
          const keysToRemove = ['user', 'auth', 'token', 'session', 'login']
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Clear any cookies that might be accessible client-side
          if (typeof window !== 'undefined') {
            const cookieNames = [
              'auth-token', 'user-session', 'auth-session', 'session', 'token', 
              'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id'
            ]
            
            cookieNames.forEach(cookieName => {
              // Clear with different domain and path combinations
              const domains = ['', '.proliinkconnect.co.za', 'app.proliinkconnect.co.za', '.app.proliinkconnect.co.za']
              const paths = ['/', '/api', '/dashboard', '/provider']
              
              domains.forEach(domain => {
                paths.forEach(path => {
                  document.cookie = \`\${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=\${path}\${domain ? \`;domain=\${domain}\` : ''}\`
                })
              })
            })
          }
        } catch (storageError) {
          console.error('Error clearing client storage:', storageError)
        }
        
        console.log('Client state cleared, redirecting...')
        
        // Force a complete page reload to ensure all state is cleared
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
        
      } else {
        const error = await response.json()
        console.error('Logout failed:', error)
        showToast.error(error.error || "Failed to logout")
      }
    } catch (error) {
      console.error("Logout error:", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
}`;

  return {
    logoutApiContent,
    logoutHookContent
  };
}

function main() {
  console.log('🔍 DEBUGGING LOGOUT ISSUE');
  console.log('==========================');
  
  try {
    // Analyze authentication files
    console.log('\n1. Analyzing Authentication Files...');
    const authAnalysis = analyzeAuthFiles();
    
    if (authAnalysis) {
      console.log('\n📊 AUTHENTICATION ANALYSIS');
      console.log('============================');
      console.log('Cookie Names Found:');
      Array.from(authAnalysis.cookieNames).forEach(name => {
        console.log(`   - ${name}`);
      });
      
      console.log('\nAuth Mechanisms:');
      authAnalysis.authMechanisms.forEach(mechanism => {
        console.log(`   - ${mechanism}`);
      });
    }

    // Identify logout issues
    console.log('\n2. Identifying Logout Issues...');
    const { issues, recommendations } = identifyLogoutIssues();
    
    console.log('\n🔍 ISSUES IDENTIFIED:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // Create comprehensive fix
    console.log('\n3. Creating Comprehensive Logout Fix...');
    const fix = createComprehensiveLogoutFix();
    
    console.log('\n🔧 COMPREHENSIVE FIX CREATED');
    console.log('=============================');
    console.log('✅ Enhanced logout API with:');
    console.log('   - All possible cookie names cleared');
    console.log('   - Multiple domain variations handled');
    console.log('   - Multiple path variations handled');
    console.log('   - Comprehensive logging for debugging');
    console.log('   - Error handling and detailed responses');
    
    console.log('\n✅ Enhanced logout hook with:');
    console.log('   - Credentials include for cookie sending');
    console.log('   - Complete client-side storage clearing');
    console.log('   - All possible cookie clearing combinations');
    console.log('   - Hard redirect with timeout');
    console.log('   - Comprehensive error handling');

    console.log('\n💡 SUMMARY');
    console.log('===========');
    console.log('The logout issue is likely caused by:');
    console.log('1. 🔍 **Incomplete cookie clearing** - Not all possible cookie names/variations cleared');
    console.log('2. 🌐 **Domain/path issues** - Cookies set with different domains/paths not cleared');
    console.log('3. 🔄 **Client-side state** - localStorage/sessionStorage not fully cleared');
    console.log('4. ⏱️ **Timing issues** - Need hard redirect to ensure complete state clearing');
    
    console.log('\n🎯 **NEXT STEPS:**');
    console.log('1. Apply the comprehensive logout fix');
    console.log('2. Test logout functionality thoroughly');
    console.log('3. Check browser developer tools for remaining cookies');
    console.log('4. Verify complete state clearing after logout');

  } catch (error) {
    logger.error('Error in logout debugging', error);
    console.error(`❌ Debug failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeAuthFiles,
  identifyLogoutIssues,
  createComprehensiveLogoutFix,
  main
};
