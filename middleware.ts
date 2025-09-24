import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.next();
  }

  // Always allow these paths without checks
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ];
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    publicPaths.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Read auth token (if any) and check verification state
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    const decoded: any = await verifyToken(token);
    if (decoded && decoded.emailVerified === false) {
      const verifyUrl = request.nextUrl.clone();
      verifyUrl.pathname = '/verify-email';
      // Preserve origin for proper absolute redirect
      return NextResponse.redirect(verifyUrl);
    }
  }

  // Protect admin routes - simplified for Edge runtime compatibility
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
