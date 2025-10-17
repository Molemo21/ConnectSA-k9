import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

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
  '/dashboard', // Temporarily add dashboard to test redirect
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
  '/api/book-service/discover-providers',
  '/api/test-provider-discovery',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/auto-login',
  '/api/auth/debug',
  '/api/auth/test-login-simple',
  '/api/client-logs',
  '/api/debug/provider-bookings',
  '/api/debug/simple-check',
  '/api/debug/login-test',
  '/api/admin/assign-services',
  '/api/payment/verify',
  '/api/webhooks/paystack',
  '/api/book-service/discover-providers',
  '/api/book-service/refresh'
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
      const cookieHeader = request.headers.get("cookie")
      if (!cookieHeader) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const token = cookieHeader
        .split(";")
        .find(c => c.trim().startsWith("auth-token="))
        ?.split("=")[1]

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const decoded = await verifyToken(token)
      if (!decoded) {
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
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    const token = cookieHeader
      .split(";")
      .find(c => c.trim().startsWith("auth-token="))
      ?.split("=")[1]

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
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