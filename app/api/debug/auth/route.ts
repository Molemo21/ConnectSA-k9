import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('=== AUTH DEBUG API ===');
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      cookieDomain: process.env.COOKIE_DOMAIN,
      nextAuthUrl: process.env.NEXTAUTH_URL
    });
    
    // Test database connection
    const userCount = await prisma.user.count();
    console.log('Database connection test - User count:', userCount);
    
    // Test authentication
    const user = await getCurrentUser();
    console.log('Authentication test - User:', user ? 'Authenticated' : 'Not authenticated');
    
    // Get cookies
    const cookies = request.headers.get('cookie');
    console.log('Cookies:', cookies);
    
    return NextResponse.json({
      success: true,
      message: 'Auth debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        cookieDomain: process.env.COOKIE_DOMAIN,
        nextAuthUrl: process.env.NEXTAUTH_URL
      },
      database: {
        connected: true,
        userCount
      },
      authentication: {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        } : null,
        isAuthenticated: !!user
      },
      cookies: {
        raw: cookies,
        hasAuthToken: cookies?.includes('auth-token') || false
      }
    });
    
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
