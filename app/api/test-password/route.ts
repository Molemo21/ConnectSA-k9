import { NextRequest, NextResponse } from "next/server"
export const runtime = 'nodejs'
import { verifyPassword, hashPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        error: "Email and password are required",
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({
        error: "User has no password set",
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Test password verification
    const isValidPassword = await verifyPassword(password, user.password)

    return NextResponse.json({
      success: true,
      userFound: true,
      hasPassword: !!user.password,
      passwordValid: isValidPassword,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Test password error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 