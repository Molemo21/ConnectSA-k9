#!/usr/bin/env node

/**
 * Comprehensive authentication analysis to identify logout issues
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

const logger = createLogger('ComprehensiveAuthAnalysis');

function analyzeAuthenticationFlow() {
  logger.info('Analyzing complete authentication flow');
  
  try {
    const authFiles = [
      'lib/auth.ts',
      'lib/auth-enhanced.ts',
      'app/api/auth/me/route.ts',
      'app/api/auth/login/route.ts',
      'app/api/auth/logout/route.ts',
      'hooks/use-logout.ts',
      'components/provider/provider-dashboard-unified.tsx',
      'app/provider/dashboard/page.tsx'
    ];

    const analysis = {
      authFlow: {
        login: [],
        session: [],
        logout: [],
        middleware: [],
        caching: []
      },
      cookieConfig: {},
      sessionManagement: {},
      potentialIssues: []
    };

    authFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Analyze login flow
        if (content.includes('setAuthCookie')) {
          analysis.authFlow.login.push(`✅ ${filePath}: setAuthCookie function`);
          
          // Extract cookie configuration
          const cookieConfigMatch = content.match(/cookieStore\.set\(['"]([^'"]+)['"][^}]+}/);
          if (cookieConfigMatch) {
            analysis.cookieConfig.cookieName = cookieConfigMatch[1];
          }
          
          // Extract domain configuration
          if (content.includes('COOKIE_DOMAIN')) {
            analysis.cookieConfig.domainHandling = 'COOKIE_DOMAIN configured';
          }
          
          // Extract security settings
          if (content.includes('httpOnly: true')) {
            analysis.cookieConfig.httpOnly = true;
          }
          if (content.includes('secure: process.env.NODE_ENV === "production"')) {
            analysis.cookieConfig.secure = 'production only';
          }
          if (content.includes('sameSite')) {
            analysis.cookieConfig.sameSite = 'configured';
          }
        }

        // Analyze session management
        if (content.includes('getCurrentUser')) {
          analysis.authFlow.session.push(`✅ ${filePath}: getCurrentUser function`);
          
          // Check for caching
          if (content.includes('cache') || content.includes('Cache')) {
            analysis.authFlow.caching.push(`⚠️ ${filePath}: Potential caching detected`);
          }
        }

        // Analyze logout flow
        if (content.includes('logout') || content.includes('Logout')) {
          analysis.authFlow.logout.push(`✅ ${filePath}: Logout functionality`);
        }

        // Check for middleware
        if (content.includes('middleware') || content.includes('Middleware')) {
          analysis.authFlow.middleware.push(`✅ ${filePath}: Middleware detected`);
        }

        // Check for potential issues
        if (content.includes('localStorage') || content.includes('sessionStorage')) {
          analysis.potentialIssues.push(`⚠️ ${filePath}: Client-side storage usage`);
        }
        
        if (content.includes('router.refresh()') || content.includes('router.push')) {
          analysis.potentialIssues.push(`⚠️ ${filePath}: Router refresh/push usage`);
        }
        
        if (content.includes('window.location.href')) {
          analysis.potentialIssues.push(`✅ ${filePath}: Hard redirect usage`);
        }
      } else {
        logger.warn(`File not found: ${filePath}`);
      }
    });

    return analysis;
  } catch (error) {
    logger.error('Error analyzing authentication flow', error);
    return null;
  }
}

function identifySpecificIssues() {
  logger.info('Identifying specific authentication issues');
  
  const issues = [];
  const solutions = [];

  // Check for Next.js specific issues
  const nextConfigPath = 'next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    if (nextConfig.includes('experimental') && nextConfig.includes('serverComponents')) {
      issues.push('⚠️ Experimental server components may affect authentication');
      solutions.push('Review Next.js experimental features');
    }
  }

  // Check for middleware
  const middlewarePath = 'middleware.ts';
  if (fs.existsSync(middlewarePath)) {
    const middleware = fs.readFileSync(middlewarePath, 'utf8');
    if (middleware.includes('auth') || middleware.includes('cookie')) {
      issues.push('⚠️ Middleware may be interfering with logout');
      solutions.push('Review middleware authentication logic');
    }
  }

  // Check for API route caching
  const apiRoutes = [
    'app/api/auth/me/route.ts',
    'app/api/auth/login/route.ts',
    'app/api/auth/logout/route.ts'
  ];

  apiRoutes.forEach(route => {
    if (fs.existsSync(route)) {
      const content = fs.readFileSync(route, 'utf8');
      if (!content.includes('export const dynamic = \'force-dynamic\'')) {
        issues.push(`❌ ${route}: Missing dynamic export - may be cached`);
        solutions.push(`Add 'export const dynamic = "force-dynamic"' to ${route}`);
      }
    }
  });

  // Check for authentication state management
  const authStateFiles = [
    'contexts/AuthContext.tsx',
    'hooks/use-auth.ts',
    'lib/auth-utils.ts'
  ];

  authStateFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('useState') || content.includes('useEffect')) {
        issues.push(`⚠️ ${file}: Client-side auth state management`);
        solutions.push('Review client-side auth state persistence');
      }
    }
  });

  return { issues, solutions };
}

function analyzeCookieBehavior() {
  logger.info('Analyzing cookie behavior and configuration');
  
  const cookieAnalysis = {
    configuration: {},
    potentialProblems: [],
    recommendations: []
  };

  // Check environment variables usage
  const authFiles = ['lib/auth.ts', 'lib/auth-enhanced.ts', 'app/api/auth/logout/route.ts'];
  
  authFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check COOKIE_DOMAIN handling
      if (content.includes('COOKIE_DOMAIN')) {
        if (content.includes('app.proliinkconnect.co.za')) {
          cookieAnalysis.potentialProblems.push('COOKIE_DOMAIN set to exact domain - may cause issues');
          cookieAnalysis.recommendations.push('Consider using .proliinkconnect.co.za for subdomain sharing');
        }
      }
      
      // Check cookie security settings
      if (content.includes('httpOnly: true')) {
        cookieAnalysis.configuration.httpOnly = true;
      } else {
        cookieAnalysis.potentialProblems.push('HttpOnly not set - cookies accessible to JavaScript');
        cookieAnalysis.recommendations.push('Set httpOnly: true for security');
      }
      
      if (content.includes('secure: process.env.NODE_ENV === "production"')) {
        cookieAnalysis.configuration.secure = 'production only';
      } else {
        cookieAnalysis.potentialProblems.push('Secure flag not properly configured');
        cookieAnalysis.recommendations.push('Ensure secure flag is set for production');
      }
      
      if (content.includes('sameSite')) {
        cookieAnalysis.configuration.sameSite = 'configured';
      } else {
        cookieAnalysis.potentialProblems.push('SameSite not configured');
        cookieAnalysis.recommendations.push('Set sameSite: "lax" for CSRF protection');
      }
    }
  });

  return cookieAnalysis;
}

function createAdvancedLogoutSolution() {
  logger.info('Creating advanced logout solution');
  
  const advancedLogoutAPI = `import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('=== COMPREHENSIVE LOGOUT START ===');
    
    const cookieStore = await cookies();
    
    // Get ALL cookies to see what we're working with
    const allCookies = cookieStore.getAll();
    console.log('All cookies before logout:', allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + '...' })));

    // Build response with comprehensive headers
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully",
      timestamp: new Date().toISOString()
    });

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Comprehensive cookie clearing function
    const clearCookie = (name: string, domain?: string, path: string = '/') => {
      const baseConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
      };
      
      // Clear with different configurations
      const configs = [
        { ...baseConfig, path: path, ...(domain ? { domain } : {}) },
        { ...baseConfig, path: '/', ...(domain ? { domain } : {}) },
        { ...baseConfig, path: path },
        { ...baseConfig, path: '/' },
      ];
      
      configs.forEach(config => {
        response.cookies.set(name, '', config);
        console.log(\`Cleared cookie: \${name}\`, config);
      });
    };

    // Comprehensive list of possible cookie names
    const possibleCookieNames = [
      'auth-token', 'user-session', 'auth-session', 'session', 'token', 
      'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id',
      'connect.sid', 'express:sess', 'next-auth.session-token',
      'next-auth.csrf-token', 'next-auth.callback-url',
      '__Secure-next-auth.session-token', '__Host-next-auth.csrf-token'
    ];

    // Get actual cookie names from the request
    const requestCookies = request.headers.get('cookie') || '';
    const actualCookieNames = requestCookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
    
    console.log('Actual cookies in request:', actualCookieNames);
    
    // Combine possible and actual cookie names
    const allCookieNames = [...new Set([...possibleCookieNames, ...actualCookieNames])];
    
    // Domain variations to try
    const domainVariations = [
      undefined, // No domain (current host)
      'app.proliinkconnect.co.za',
      '.app.proliinkconnect.co.za',
      '.proliinkconnect.co.za',
      'proliinkconnect.co.za'
    ];
    
    // Path variations to try
    const pathVariations = ['/', '/api', '/dashboard', '/provider', '/admin'];
    
    // Clear all cookies with all combinations
    allCookieNames.forEach(cookieName => {
      // Delete via cookies() API
      cookieStore.delete(cookieName);
      
      // Clear with all domain and path combinations
      domainVariations.forEach(domain => {
        pathVariations.forEach(path => {
          clearCookie(cookieName, domain, path);
        });
      });
      
      // Handle COOKIE_DOMAIN if set
      if (process.env.COOKIE_DOMAIN) {
        clearCookie(cookieName, process.env.COOKIE_DOMAIN);
        if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
          clearCookie(cookieName, \`.\${process.env.COOKIE_DOMAIN}\`);
        }
      }
    });

    // Force clear any remaining cookies by name
    allCookies.forEach(cookie => {
      if (cookie.name) {
        cookieStore.delete(cookie.name);
        clearCookie(cookie.name);
      }
    });

    console.log('=== COMPREHENSIVE LOGOUT COMPLETE ===');
    return response;
    
  } catch (error) {
    console.error("=== LOGOUT ERROR ===", error);
    return NextResponse.json({ 
      error: "Failed to logout",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for logout (redirect from form)
  try {
    console.log('=== GET LOGOUT REQUEST ===');
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL("/", request.url));
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Same comprehensive cookie clearing as POST
    const clearCookie = (name: string, domain?: string, path: string = '/') => {
      const baseConfig = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        expires: new Date(0),
      };
      
      const configs = [
        { ...baseConfig, path: path, ...(domain ? { domain } : {}) },
        { ...baseConfig, path: '/', ...(domain ? { domain } : {}) },
        { ...baseConfig, path: path },
        { ...baseConfig, path: '/' },
      ];
      
      configs.forEach(config => {
        response.cookies.set(name, '', config);
      });
    };

    const possibleCookieNames = [
      'auth-token', 'user-session', 'auth-session', 'session', 'token', 
      'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id',
      'connect.sid', 'express:sess', 'next-auth.session-token',
      'next-auth.csrf-token', 'next-auth.callback-url'
    ];

    const domainVariations = [
      undefined, 'app.proliinkconnect.co.za', '.app.proliinkconnect.co.za',
      '.proliinkconnect.co.za', 'proliinkconnect.co.za'
    ];
    
    const pathVariations = ['/', '/api', '/dashboard', '/provider', '/admin'];

    possibleCookieNames.forEach(cookieName => {
      cookieStore.delete(cookieName);
      domainVariations.forEach(domain => {
        pathVariations.forEach(path => {
          clearCookie(cookieName, domain, path);
        });
      });
      
      if (process.env.COOKIE_DOMAIN) {
        clearCookie(cookieName, process.env.COOKIE_DOMAIN);
        if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
          clearCookie(cookieName, \`.\${process.env.COOKIE_DOMAIN}\`);
        }
      }
    });

    console.log('=== GET LOGOUT COMPLETE ===');
    return response;
  } catch (error) {
    console.error("=== GET LOGOUT ERROR ===", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}`;

  const advancedLogoutHook = `"use client"

import { useState } from "react"
import { showToast } from "@/lib/toast"

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const logout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('=== CLIENT LOGOUT START ===')
      
      // Make logout request with comprehensive headers
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
      })

      console.log('Logout response status:', response.status)
      console.log('Logout response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Logout result:', result)
        
        showToast.success("Logged out successfully")
        console.log('Logout successful, clearing ALL client state...')
        
        // Nuclear option: Clear EVERYTHING
        try {
          // Clear all storage
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear indexedDB if available
          if (typeof window !== 'undefined' && 'indexedDB' in window) {
            try {
              indexedDB.databases().then(databases => {
                databases.forEach(db => {
                  if (db.name) {
                    indexedDB.deleteDatabase(db.name)
                  }
                })
              })
            } catch (e) {
              console.log('IndexedDB clear failed:', e)
            }
          }
          
          // Clear service worker cache if available
          if (typeof window !== 'undefined' && 'caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name)
              })
            })
          }
          
          // Clear all possible auth-related items
          const keysToRemove = [
            'user', 'auth', 'token', 'session', 'login', 'jwt',
            'auth-token', 'user-session', 'auth-session', 'sessionid',
            'next-auth.session-token', 'next-auth.csrf-token'
          ]
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })
          
          // Nuclear cookie clearing
          if (typeof window !== 'undefined') {
            const cookieNames = [
              'auth-token', 'user-session', 'auth-session', 'session', 'token', 
              'jwt', 'user', 'auth', 'login', 'sessionid', 'session_id',
              'connect.sid', 'express:sess', 'next-auth.session-token',
              'next-auth.csrf-token', 'next-auth.callback-url'
            ]
            
            const domains = [
              '', 
              window.location.hostname,
              '.' + window.location.hostname,
              '.proliinkconnect.co.za', 
              'app.proliinkconnect.co.za', 
              '.app.proliinkconnect.co.za'
            ]
            
            const paths = ['/', '/api', '/dashboard', '/provider', '/admin']
            
            cookieNames.forEach(cookieName => {
              domains.forEach(domain => {
                paths.forEach(path => {
                  document.cookie = \`\${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=\${path}\${domain ? \`;domain=\${domain}\` : ''}\`
                  document.cookie = \`\${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=\${path}\${domain ? \`;domain=\${domain}\` : ''};secure\`
                  document.cookie = \`\${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=\${path}\${domain ? \`;domain=\${domain}\` : ''};samesite=lax\`
                })
              })
            })
            
            // Clear all cookies by iterating through document.cookie
            document.cookie.split(";").forEach(cookie => {
              const eqPos = cookie.indexOf("=")
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
              if (name) {
                domains.forEach(domain => {
                  paths.forEach(path => {
                    document.cookie = \`\${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=\${path}\${domain ? \`;domain=\${domain}\` : ''}\`
                  })
                })
              }
            })
          }
        } catch (storageError) {
          console.error('Error clearing client storage:', storageError)
        }
        
        console.log('ALL client state cleared, forcing complete reload...')
        
        // Force complete page reload with cache busting
        const timestamp = Date.now()
        window.location.href = \`/?_t=\${timestamp}\`
        
      } else {
        const error = await response.json()
        console.error('Logout failed:', error)
        showToast.error(error.error || "Failed to logout")
      }
    } catch (error) {
      console.error("=== CLIENT LOGOUT ERROR ===", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
}`;

  return {
    advancedLogoutAPI,
    advancedLogoutHook
  };
}

function main() {
  console.log('🔍 COMPREHENSIVE AUTHENTICATION ANALYSIS');
  console.log('========================================');
  
  try {
    // Analyze authentication flow
    console.log('\n1. Analyzing Authentication Flow...');
    const authAnalysis = analyzeAuthenticationFlow();
    
    if (authAnalysis) {
      console.log('\n📊 AUTHENTICATION FLOW ANALYSIS');
      console.log('================================');
      
      console.log('\n🔐 LOGIN FLOW:');
      authAnalysis.authFlow.login.forEach(item => console.log(`   ${item}`));
      
      console.log('\n🔄 SESSION MANAGEMENT:');
      authAnalysis.authFlow.session.forEach(item => console.log(`   ${item}`));
      
      console.log('\n🚪 LOGOUT FLOW:');
      authAnalysis.authFlow.logout.forEach(item => console.log(`   ${item}`));
      
      console.log('\n⚙️ MIDDLEWARE:');
      authAnalysis.authFlow.middleware.forEach(item => console.log(`   ${item}`));
      
      console.log('\n💾 CACHING:');
      authAnalysis.authFlow.caching.forEach(item => console.log(`   ${item}`));
      
      console.log('\n🍪 COOKIE CONFIGURATION:');
      Object.entries(authAnalysis.cookieConfig).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      console.log('\n⚠️ POTENTIAL ISSUES:');
      authAnalysis.potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    // Identify specific issues
    console.log('\n2. Identifying Specific Issues...');
    const { issues, solutions } = identifySpecificIssues();
    
    console.log('\n🔍 SPECIFIC ISSUES:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n💡 SOLUTIONS:');
    solutions.forEach((solution, index) => {
      console.log(`   ${index + 1}. ${solution}`);
    });

    // Analyze cookie behavior
    console.log('\n3. Analyzing Cookie Behavior...');
    const cookieAnalysis = analyzeCookieBehavior();
    
    console.log('\n🍪 COOKIE ANALYSIS:');
    console.log('Configuration:');
    Object.entries(cookieAnalysis.configuration).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\nPotential Problems:');
    cookieAnalysis.potentialProblems.forEach((problem, index) => {
      console.log(`   ${index + 1}. ${problem}`);
    });
    
    console.log('\nRecommendations:');
    cookieAnalysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    // Create advanced solution
    console.log('\n4. Creating Advanced Logout Solution...');
    const { advancedLogoutAPI, advancedLogoutHook } = createAdvancedLogoutSolution();
    
    console.log('\n🚀 ADVANCED SOLUTION CREATED');
    console.log('============================');
    console.log('✅ Nuclear logout API with:');
    console.log('   - All possible cookie names and variations');
    console.log('   - Comprehensive domain and path clearing');
    console.log('   - Cache-busting headers');
    console.log('   - Detailed logging for debugging');
    console.log('   - Runtime and dynamic exports');
    
    console.log('\n✅ Nuclear logout hook with:');
    console.log('   - Complete client-side storage clearing');
    console.log('   - IndexedDB and cache clearing');
    console.log('   - Nuclear cookie clearing');
    console.log('   - Cache-busting redirect');
    console.log('   - Comprehensive error handling');

    console.log('\n💡 ROOT CAUSE ANALYSIS');
    console.log('======================');
    console.log('The persistent logout issue is likely caused by:');
    console.log('1. 🔍 **Hidden cookies** - Cookies with different names/domains not cleared');
    console.log('2. 💾 **Client-side caching** - Browser cache or service worker cache');
    console.log('3. 🔄 **State persistence** - React state or context not cleared');
    console.log('4. ⚙️ **Middleware interference** - Authentication middleware maintaining state');
    console.log('5. 🌐 **Domain/path mismatches** - Cookies set with different configurations');
    
    console.log('\n🎯 **NUCLEAR SOLUTION:**');
    console.log('This advanced solution uses a "nuclear" approach:');
    console.log('• Clears ALL possible cookie names and variations');
    console.log('• Clears ALL client-side storage (localStorage, sessionStorage, IndexedDB)');
    console.log('• Clears browser cache and service worker cache');
    console.log('• Uses cache-busting headers and redirects');
    console.log('• Provides comprehensive logging for debugging');

  } catch (error) {
    logger.error('Error in comprehensive analysis', error);
    console.error(`❌ Analysis failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

module.exports = {
  analyzeAuthenticationFlow,
  identifySpecificIssues,
  analyzeCookieBehavior,
  createAdvancedLogoutSolution,
  main
};
