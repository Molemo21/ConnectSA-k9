import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserSafe } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      status: "deploying",
      timestamp: new Date().toISOString(),
      message: "Service is being deployed, please try again in a few minutes"
    }, { status: 503 });
  }

  try {
    const startTime = Date.now()
    
    // Check database connection
    let dbConnected = false
    try {
      // Lightweight query to validate connectivity
      await prisma.user.findFirst()
      dbConnected = true
    } catch (e) {
      dbConnected = false
    }
    const dbLatency = Date.now() - startTime
    
    // Check authentication
    let user = null
    let authStatus = "not_authenticated"
    
    try {
      user = await getCurrentUserSafe()
      authStatus = user ? "authenticated" : "not_authenticated"
    } catch (authError) {
      authStatus = "error"
      console.error("Auth check failed:", authError)
    }

    const healthData = {
      status: dbConnected ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        latency: dbLatency,
        url: process.env.DATABASE_URL ? "configured" : "not_configured"
      },
      authentication: {
        status: authStatus,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null
      },
      environment: {
        node: process.env.NODE_ENV || "development",
        database_url_configured: !!process.env.DATABASE_URL
      }
    }

    const statusCode = dbConnected ? 200 : 503

    return NextResponse.json(healthData, { status: statusCode })
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      database: {
        connected: false,
        error: "Failed to check database connection"
      },
      environment: {
        node: process.env.NODE_ENV || "development",
        database_url_configured: !!process.env.DATABASE_URL
      }
    }, { status: 503 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  })
} 