export const runtime = 'nodejs'
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { verifyPassword, setAuthCookie, getUserDashboardPath } from "@/lib/auth"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
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

    // Set auth cookie
    await setAuthCookie(authUser)

    // Determine redirect URL
    const redirectUrl = getUserDashboardPath(user.role, user.emailVerified, user.provider?.status)

    return NextResponse.json({
      message: "Login successful",
      user: authUser,
      redirectUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 })
    }

    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
