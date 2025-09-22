import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserSafe } from "@/lib/auth"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }

  try {
    // Add request logging for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.ip || 
               request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    console.log(`Debug endpoint called from IP: ${ip}, User-Agent: ${userAgent}`)
    
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")?.value
    const refreshToken = cookieStore.get("refresh-token")?.value
    
    console.log("Auth token exists:", !!authToken)
    console.log("Refresh token exists:", !!refreshToken)
    
    // Get current user
    const user = await getCurrentUserSafe()
    
    // Prepare response data
    const responseData = {
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      } : null,
      timestamp: new Date().toISOString(),
      requestInfo: {
        ip: ip,
        userAgent: userAgent.substring(0, 100), // Limit user agent length
        method: request.method,
        url: request.url
      }
    }
    
    // Add security headers
    const response = NextResponse.json(responseData)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
    
  } catch (error) {
    console.error("Debug endpoint error:", error)
    
    // Don't expose sensitive error details in production
    const isProduction = process.env.NODE_ENV === 'production'
    const errorMessage = isProduction 
      ? "Internal server error" 
      : error instanceof Error ? error.message : "Unknown error"
    
    return NextResponse.json({ 
      error: "Debug failed",
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      }
    })
  }
}

// Add OPTIONS method for CORS if needed
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