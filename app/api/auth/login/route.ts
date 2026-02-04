// Enhanced login flow with better cookie handling
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { verifyPassword, setAuthCookie, getUserDashboardPath } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const runtime = 'nodejs'

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Ensure Prisma connection before querying
    try {
      const { prisma } = await import('@/lib/prisma');
      if (typeof (prisma as any).connect === 'function') {
        await (prisma as any).connect();
      } else {
        await prisma.$connect();
      }
    } catch (connectError) {
      // Connection might already be established, or might fail - proceed anyway
      const errorMessage = connectError instanceof Error ? connectError.message : String(connectError);
      if (!errorMessage.includes('already connected') && !errorMessage.includes('already been connected')) {
        console.warn('⚠️ Prisma connection check failed in login route:', errorMessage);
      }
    }

    // Find user - fetch basic fields first to avoid any schema mismatches
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    })

    // Fetch provider status separately if user exists and is a provider
    let providerStatus: string | undefined
    if (user && user.role === 'PROVIDER') {
      const provider = await db.provider.findUnique({
        where: { userId: user.id },
        select: {
          status: true,
        },
      })
      providerStatus = provider?.status
    }

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Require verified email before issuing session
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in." }, { status: 403 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account has been deactivated" }, { status: 401 })
    }

    // Create auth user object
    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    }

    // Set auth cookie with enhanced configuration
    await setAuthCookie(authUser)

    // Note: Draft merging is handled client-side after successful login
    // to avoid circular dependencies and authentication issues

    // Determine redirect URL
    const redirectUrl = getUserDashboardPath(
      user.role, 
      user.emailVerified, 
      providerStatus
    )

    console.log('Login successful:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      redirectUrl,
      providerStatus
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
      },
      redirectUrl
    })
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log detailed error for debugging
    console.error('Login error details:', {
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name
    })
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Login failed. Please try again.",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}