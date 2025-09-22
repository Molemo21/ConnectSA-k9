import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserSafe } from "@/lib/auth"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const user = await getCurrentUserSafe()
    const cookieHeader = request.headers.get("cookie") || ""
    
    // Extract cookie names
    const cookies = cookieHeader
      .split(";")
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map(c => c.split("=")[0])
    
    const hasAuthToken = cookieHeader.includes("auth-token=")
    
    return NextResponse.json({
      isAuthenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        provider: user.provider
      } : null,
      hasAuthToken,
      cookies,
      cookieHeader: cookieHeader.substring(0, 200) + (cookieHeader.length > 200 ? "..." : ""),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth debug API error:', error)
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      hasAuthToken: false,
      cookies: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}