import { NextRequest, NextResponse } from "next/server";
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
        console.log(`Cleared cookie: ${name}`, config);
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
          clearCookie(cookieName, `.${process.env.COOKIE_DOMAIN}`);
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
          expireCookie(cookieName, `.${process.env.COOKIE_DOMAIN}`);
        }
      }
    });

    return response;
  } catch (error) {
    console.error("Logout GET error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

