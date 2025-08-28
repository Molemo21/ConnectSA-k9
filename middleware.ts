import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequestMiddleware } from './lib/auth-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const user = await getUserFromRequestMiddleware(request);

    if (!user || user.role !== 'ADMIN') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
