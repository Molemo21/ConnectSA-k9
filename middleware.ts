import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/services',
  '/book-service',
  '/login',
  '/signup',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
];

// File paths that should always be public
const PUBLIC_FILES = [
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

// API endpoints that should be public
const PUBLIC_API_ENDPOINTS = [
  '/api/services',
  '/api/service-categories',
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/auto-login',
  '/api/auth/debug',
  '/api/auth/test-login-simple',
  '/api/client-logs'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public files
  if (PUBLIC_FILES.some(file => pathname.startsWith(file))) {
    return NextResponse.next()
  }

  // Allow static files and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next()
  }

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // Check if API endpoint is public
  const isPublicApi = PUBLIC_API_ENDPOINTS.some(endpoint =>
    pathname.startsWith(endpoint)
  )

  try {
    // For API routes
    if (pathname.startsWith('/api/')) {
      // Allow public API endpoints
      if (isPublicApi) {
        return NextResponse.next()
      }

      // Check authentication for protected API endpoints
      const token = await getToken({ req: request })
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // For public paths, always allow access
    if (isPublicPath) {
      return NextResponse.next()
    }

    // For protected routes, check authentication
    const token = await getToken({ req: request })
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // For API routes, return error response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
    // For other routes, continue
    return NextResponse.next()
  }
}