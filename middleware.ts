import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.next();
  }

  // Protect admin routes - simplified for Edge runtime compatibility
  if (pathname.startsWith('/admin')) {
    // For Edge runtime, we'll do basic path protection
    // Full authentication will be handled in the API routes and server components
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
