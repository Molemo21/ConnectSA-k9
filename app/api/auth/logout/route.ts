import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const cookieStore = await cookies();

    // Build response first so we can attach cookie expirations
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });

    // Helper to expire a cookie with specific domain
    const expireAuthCookie = (domain?: string) => {
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
      
      // Also clear other possible auth cookies
      response.cookies.set('user-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
      
      response.cookies.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
    };

    // Delete via cookies() API (current domain scope)
    cookieStore.delete("auth-token");
    cookieStore.delete("user-session");
    cookieStore.delete("auth-session");

    // Also explicitly expire on current host
    expireAuthCookie();

    // And on configured COOKIE_DOMAIN if provided
    if (process.env.COOKIE_DOMAIN) {
      expireAuthCookie(process.env.COOKIE_DOMAIN);
      // Also attempt with leading dot for safety if not present
      if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
        expireAuthCookie(`.${process.env.COOKIE_DOMAIN}`);
      }
    }
    
    // Additional cleanup for production domain
    if (process.env.NODE_ENV === 'production') {
      // Try to clear cookies for the production domain
      expireAuthCookie('app.proliinkconnect.co.za');
      expireAuthCookie('.app.proliinkconnect.co.za');
      expireAuthCookie('.proliinkconnect.co.za');
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ 
      error: "Failed to logout" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  // Handle GET requests for logout (redirect from form)
  try {
    const cookieStore = await cookies();

    const response = NextResponse.redirect(new URL("/", request.url));

    // Delete via cookies() API (current domain scope)
    cookieStore.delete("auth-token");
    cookieStore.delete("user-session");
    cookieStore.delete("auth-session");

    // Also explicitly expire on current host and configured domain
    const expireAuthCookie = (domain?: string) => {
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
      
      // Also clear other possible auth cookies
      response.cookies.set('user-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
      
      response.cookies.set('auth-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        ...(domain ? { domain } : {}),
      });
    };

    expireAuthCookie();
    if (process.env.COOKIE_DOMAIN) {
      expireAuthCookie(process.env.COOKIE_DOMAIN);
      if (!process.env.COOKIE_DOMAIN.startsWith('.')) {
        expireAuthCookie(`.${process.env.COOKIE_DOMAIN}`);
      }
    }
    
    // Additional cleanup for production domain
    if (process.env.NODE_ENV === 'production') {
      // Try to clear cookies for the production domain
      expireAuthCookie('app.proliinkconnect.co.za');
      expireAuthCookie('.app.proliinkconnect.co.za');
      expireAuthCookie('.proliinkconnect.co.za');
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
