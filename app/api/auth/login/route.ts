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

    // Find user with provider info if applicable
    const user = await db.user.findUnique({
      where: { email },
      include: {
        provider: {
          select: {
            status: true,
          },
        },
      },
    })

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

    // Determine redirect URL
    const redirectUrl = await getUserDashboardPath(
      user.role, 
      user.emailVerified, 
      user.provider?.status
    )

    console.log('Login successful:', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      redirectUrl,
      providerStatus: user.provider?.status
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      redirectUrl
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}