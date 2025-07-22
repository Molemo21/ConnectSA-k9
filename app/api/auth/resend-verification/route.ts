import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
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