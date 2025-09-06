export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email"

// TypeScript declaration for global rate limiting
declare global {
  var resendVerificationAttempts: Record<string, number> | undefined
}

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const { email } = await request.json()
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Rate limiting: prevent multiple resend requests
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = `resend_verification:${clientIP}:${email}`
  
  // Simple in-memory rate limiting (in production, use Redis or similar)
  if (global.resendVerificationAttempts && global.resendVerificationAttempts[rateLimitKey]) {
    console.log(`🚫 Rate limited resend verification attempt for email: ${email}`)
    return NextResponse.json({ 
      error: "Too many resend requests. Please wait a moment." 
    }, { status: 429 })
  }
  
  // Set rate limit
  if (!global.resendVerificationAttempts) global.resendVerificationAttempts = {}
  global.resendVerificationAttempts[rateLimitKey] = Date.now()
  
  // Clean up old rate limit entries (older than 5 minutes)
  setTimeout(() => {
    if (global.resendVerificationAttempts && global.resendVerificationAttempts[rateLimitKey]) {
      delete global.resendVerificationAttempts[rateLimitKey]
    }
  }, 5 * 60 * 1000)

  console.log(`📧 Resend verification requested for email: ${email}`)

  try {
    let user = null
    try {
      user = await db.user.findUnique({ where: { email } })
    } catch (dbError) {
      console.error("❌ Database error finding user:", dbError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (!user) {
      // Always return success to avoid leaking user existence
      console.log(`📧 Resend verification: User not found, returning generic response`)
      return NextResponse.json({ message: "If an account exists, a verification email has been sent." })
    }

    if (user.emailVerified) {
      console.log(`📧 Resend verification: User ${email} already verified`)
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }

    console.log(`📧 Resend verification: Processing for user ${email} (ID: ${user.id})`)

    // Rate limit: allow max 3 tokens per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    let recentTokens = 0
    
    try {
      recentTokens = await db.verificationToken.count({
        where: {
          userId: user.id,
          createdAt: { gte: oneHourAgo },
        },
      })
    } catch (countError) {
      console.warn("⚠️ Could not count recent tokens, proceeding with resend:", countError)
    }

    if (recentTokens >= 3) {
      console.log(`📧 Resend verification: Rate limit exceeded for user ${email}`)
      return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 })
    }

    // Delete any existing tokens for this user
    try {
      await db.verificationToken.deleteMany({ where: { userId: user.id } })
      console.log(`🗑️ Deleted existing tokens for user ${email}`)
    } catch (deleteError) {
      console.warn("⚠️ Failed to delete existing tokens:", deleteError)
      // Continue with resend even if cleanup fails
    }

    // Generate a new token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    console.log(`🔑 Creating new verification token for user ${email}`)
    console.log(`⏰ Token expires at: ${expires}`)
    console.log(`🔗 Token preview: ${token.substring(0, 8)}...`)

    try {
      await db.verificationToken.create({
        data: {
          userId: user.id,
          token,
          expires,
        },
      })
      console.log(`✅ New verification token created for user ${email}`)
    } catch (createError) {
      console.error("❌ Failed to create verification token:", createError)
      throw new Error(`Failed to create verification token: ${createError instanceof Error ? createError.message : 'Unknown error'}`)
    }

    // Send verification email via Resend
    const baseUrl = request.nextUrl.origin || "http://localhost:3000"
    const verificationLink = `${baseUrl}/verify-email?token=${token}`
    console.log(`📧 Verification link for resend: ${verificationLink}`)

    try {
      await sendVerificationEmail(
        user.email,
        user.name,
        verificationLink
      )
      console.log(`📤 Verification email sent successfully to ${email}`)
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError)
      // Don't fail the request if email fails, but log the error
      // The user can still use the verification link from console in dev mode
    }

    return NextResponse.json({ 
      message: "Verification email sent successfully",
      details: process.env.NODE_ENV === 'development' ? `Verification link: ${verificationLink}` : undefined
    })

  } catch (error) {
    console.error("❌ Resend verification error:", error)
    return NextResponse.json({ 
      error: "Failed to resend verification email",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 