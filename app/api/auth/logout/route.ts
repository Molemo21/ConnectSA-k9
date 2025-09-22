import { NextRequest, NextResponse } from "next/server";
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
      console.log(`Expired cookie: ${name}`, { domain, path });
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
          expireCookie(cookieName, `.${process.env.COOKIE_DOMAIN}`);
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
