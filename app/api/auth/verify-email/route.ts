export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"

// TypeScript declaration for global rate limiting
declare global {
  var verificationAttempts: Record<string, number> | undefined
}

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const token = request.nextUrl.searchParams.get("token")
  if (!token) {
    console.log("❌ Verification attempt without token")
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  // Rate limiting: prevent multiple verification attempts PER IP (not per token)
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = `verify_email:${clientIP}`
  
  // Simple in-memory rate limiting (in production, use Redis or similar)
  if (global.verificationAttempts && global.verificationAttempts[rateLimitKey]) {
    const lastAttempt = global.verificationAttempts[rateLimitKey]
    const timeSinceLastAttempt = Date.now() - lastAttempt
    
    // Only rate limit if attempts are within 30 seconds (more reasonable)
    if (timeSinceLastAttempt < 30000) {
      console.log(`🚫 Rate limited verification attempt from IP: ${clientIP}`)
      return NextResponse.json({ 
        error: "Too many verification attempts. Please wait 30 seconds and try again." 
      }, { status: 429 })
    }
  }
  
  // Set rate limit
  if (!global.verificationAttempts) global.verificationAttempts = {}
  global.verificationAttempts[rateLimitKey] = Date.now()
  
  // Clean up old rate limit entries (older than 2 minutes)
  setTimeout(() => {
    if (global.verificationAttempts && global.verificationAttempts[rateLimitKey]) {
      delete global.verificationAttempts[rateLimitKey]
    }
  }, 2 * 60 * 1000)

  console.log(`🔍 Attempting to verify token: ${token.substring(0, 8)}...`)
  console.log(`🔍 Full token length: ${token.length} characters`)
  console.log(`🔍 Client IP: ${clientIP}`)
  console.log(`🔍 Rate limit key: ${rateLimitKey}`)
  console.log(`🔍 Current rate limit state:`, global.verificationAttempts ? global.verificationAttempts[rateLimitKey] : 'none')

  try {
    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      console.log(`❌ Token not found in database: ${token.substring(0, 8)}...`)
      
      // Debug context (dev only)
      try {
        const allTokens = await db.verificationToken.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { email: true, emailVerified: true } } }
        })
        console.log(`🔍 Found ${allTokens.length} recent tokens in database`)
        allTokens.forEach(t => {
          console.log(`  - Token: ${t.token.substring(0, 8)}..., User: ${t.user.email}, Verified: ${t.user.emailVerified}`)
        })
      } catch (debugError) {
        console.warn("⚠️ Could not fetch tokens for debugging:", debugError)
      }
      
      return NextResponse.json({ 
        error: "Invalid or expired token",
        details: process.env.NODE_ENV === 'development' ? "Token not found in database" : undefined
      }, { status: 400 })
    }

    console.log(`✅ Token found for user: ${verificationToken.user.email}`)
    console.log(`⏰ Token expires at: ${verificationToken.expires}`)
    console.log(`🕐 Current time: ${new Date()}`)

    if (verificationToken.expires < new Date()) {
      console.log(`❌ Token expired at ${verificationToken.expires}`)
      // Delete expired token
      try {
        await db.verificationToken.delete({ where: { token } })
        console.log(`🗑️ Expired token deleted`)
      } catch (deleteError) {
        console.warn("⚠️ Failed to delete expired token:", deleteError)
      }
      return NextResponse.json({ 
        error: "Token has expired",
        details: process.env.NODE_ENV === 'development' ? "Token expired, please request a new one" : undefined
      }, { status: 400 })
    }

    // If already verified, clean up token and return a helpful message
    if (verificationToken.user.emailVerified) {
      try {
        await db.verificationToken.delete({ where: { token } })
      } catch (cleanupError) {
        console.warn('⚠️ Failed to delete token for already-verified user:', cleanupError)
      }
      return NextResponse.json({ 
        message: "Email already verified. You can log in now.",
        user: { email: verificationToken.user.email, emailVerified: true }
      })
    }

    console.log(`✅ Token is valid, updating user emailVerified status`)

    // Update user's emailVerified (idempotent)
    try {
      await db.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      })
      console.log(`✅ User ${verificationToken.user.email} email verified successfully`)
    } catch (updateError) {
      console.error("❌ Failed to update user verification status:", updateError)
      throw new Error(`Failed to update user verification status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`)
    }

    // Attempt to record an audit log (best-effort)
    try {
      await db.adminAuditLog.create({
        data: {
          adminId: verificationToken.userId, // self-action for audit trace
          action: 'USER_ROLE_CHANGED', // closest enum available; adjust if a VERIFY action exists
          targetType: 'USER',
          targetId: verificationToken.userId,
          details: { event: 'EMAIL_VERIFIED', method: 'TOKEN', ip: clientIP },
        },
      })
    } catch (auditError) {
      console.warn('⚠️ Failed to write audit log for verification:', auditError)
    }

    // Delete the token after use
    try {
      await db.verificationToken.delete({ where: { token } })
      console.log(`🗑️ Token deleted after successful verification`)
    } catch (deleteError) {
      console.warn("⚠️ Failed to delete token after verification:", deleteError)
      // Don't fail verification if cleanup fails
    }

    return NextResponse.json({ 
      message: "Email verified successfully",
      user: {
        email: verificationToken.user.email,
        emailVerified: true
      }
    })
  } catch (error) {
    console.error("❌ Error during email verification:", error)
    return NextResponse.json({ 
      error: "Internal server error during verification",
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    }, { status: 500 })
  }
}
