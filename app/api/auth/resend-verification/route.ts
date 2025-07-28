import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      // Always return success to avoid leaking user existence
      return NextResponse.json({ message: "If an account exists, a verification email has been sent." })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }
    // Rate limit: allow max 3 tokens per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentTokens = await prisma.verificationToken.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    })
    if (recentTokens >= 3) {
      return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 })
    }
    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } })
    // Generate a new token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })
    // Mock sending email: log the verification link
    const baseUrl = request.nextUrl.origin || "http://localhost:3000"
    console.log(
      `Resend verification: ${baseUrl}/verify-email?token=${token}`
    )
    return NextResponse.json({ message: "Verification email resent" })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 500 })
  }
} 