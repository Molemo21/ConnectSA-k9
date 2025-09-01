import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserSafe } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUserSafe()
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Test auth error:", error)
    return NextResponse.json({
      authenticated: false,
      error: "Authentication test failed",
      timestamp: new Date().toISOString()
    })
  }
} 