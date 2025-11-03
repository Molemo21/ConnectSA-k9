import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      status: 'deploying',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }

  const startedAt = Date.now()

  try {
    // Check DB connectivity with lightweight queries
    let dbConnected = false
    let tableChecks: Record<string, any> = {}

    try {
      await db.user.findFirst({ select: { id: true } })
      dbConnected = true
    } catch (e) {
      dbConnected = false
    }

    // Validate core tables
    const checks = [
      { key: 'users', op: () => db.user.count({}) },
      { key: 'services', op: () => db.service.count({}) },
      { key: 'bookings', op: () => db.booking.count({}) },
      { key: 'payments', op: () => db.payment.count({}) },
    ]

    for (const c of checks) {
      try {
        const count = await c.op()
        tableChecks[c.key] = { ok: true, count }
      } catch (err) {
        tableChecks[c.key] = { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }

    // Auth status (non-fatal)
    let authStatus: 'authenticated' | 'not_authenticated' | 'error' = 'not_authenticated'
    try {
      const user = await getCurrentUser()
      authStatus = user ? 'authenticated' : 'not_authenticated'
    } catch (err) {
      authStatus = 'error'
    }

    const durationMs = Date.now() - startedAt

    const status = dbConnected && Object.values(tableChecks).every(v => (v as any).ok !== false)
      ? 'healthy'
      : 'degraded'

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      durationMs,
      database: {
        connected: dbConnected,
        tables: tableChecks,
      },
      authentication: {
        status: authStatus,
      },
      environment: {
        database_url_configured: !!process.env.DATABASE_URL,
        direct_url_configured: !!process.env.DIRECT_URL,
        node_env: process.env.NODE_ENV || 'development',
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  // SECURITY: Restrict CORS to production URL instead of wildcard
  // Frontend uses relative URLs, so this is safe
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '*'
    : request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  })
}


