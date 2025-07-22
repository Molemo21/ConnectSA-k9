import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from './lib/auth';
import type { UserRole } from '@prisma/client';

// Map of route prefixes to the role required to access them
const routeRoles: Record<string, UserRole> = {
  '/admin': 'ADMIN',
  '/dashboard': 'CLIENT',
  '/provider': 'PROVIDER',
};

// Default dashboard paths for each role
const roleDashboards: Record<UserRole, string> = {
  ADMIN: '/admin',
  CLIENT: '/dashboard',
  PROVIDER: '/provider/onboarding', // This page will handle further logic
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the user from the token in the request cookies
  const user = await getUserFromRequest(request);

  // Handle redirection for authenticated users trying to access auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const dashboardUrl = roleDashboards[user.role] || '/';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }
  
  // 2. Find which protected route prefix the current path matches
  const matchedPrefix = Object.keys(routeRoles).find(prefix =>
    pathname.startsWith(prefix)
  );

  // If the route is not a protected one, we don't need to do anything.
  if (!matchedPrefix) {
    return NextResponse.next();
  }

  // 3. If accessing a protected route without being authenticated, redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. If the user's email is not verified, redirect them to the verify-email page
  if (!user.emailVerified && pathname !== '/verify-email') {
      return NextResponse.redirect(new URL('/verify-email', request.url));
  }
  
  // 5. If the user's role does not match the required role, redirect to their own dashboard
  const requiredRole = routeRoles[matchedPrefix];
  if (user.role !== requiredRole) {
    const dashboardUrl = roleDashboards[user.role] || '/';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // 6. If all checks pass, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
