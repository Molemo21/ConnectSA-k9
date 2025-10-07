export const runtime = 'nodejs'
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"
import { sendVerificationEmail } from '@/lib/email'

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "PROVIDER"]).default("CLIENT"),
})

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Rate limit: allow max 3 tokens per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentTokens = await db.verificationToken.count({
          where: {
            userId: existingUser.id,
            createdAt: { gte: oneHourAgo },
          },
        })
        if (recentTokens >= 3) {
          return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 })
        }
        // Delete any existing tokens for this user
        await db.verificationToken.deleteMany({ where: { userId: existingUser.id } })
        // Generate a new token
        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        await db.verificationToken.create({
          data: {
            userId: existingUser.id,
            token,
            expires,
          },
        })
        // Send verification email
        const baseUrl = request.nextUrl.origin || "http://localhost:3000"
        const verificationLink = `${baseUrl}/verify-email?token=${token}`
        await sendVerificationEmail(
          validatedData.email,
          validatedData.name,
          verificationLink
        )
        return NextResponse.json({
          message: "Email already registered but not verified. We've sent you a new verification email.",
        }, { status: 200 })
      }
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        role: validatedData.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    })

    // If provider, create provider profile with INCOMPLETE status
    if (validatedData.role === "PROVIDER") {
      await db.provider.create({
        data: {
          userId: user.id,
          status: "INCOMPLETE", // Start with INCOMPLETE status to force onboarding
        },
      })
    }

    // Generate a 1-hour verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    console.log(`🔑 Creating verification token for new user ${user.email}`)
    console.log(`⏰ Token expires at: ${expires}`)
    console.log(`🔗 Token preview: ${token.substring(0, 8)}...`)
    
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })
    
    console.log(`✅ Verification token created successfully for new user ${user.email}`)

    // Send verification email
    const baseUrl = request.nextUrl.origin || "http://localhost:3000"
    
    // Check if there's a booking draft to preserve across devices
    const draftId = request.headers.get('x-draft-id') || 
                   request.cookies.get('booking_draft_id')?.value
    
    let verificationLink = `${baseUrl}/verify-email?token=${token}`
    if (draftId) {
      verificationLink += `&draftId=${draftId}`
      console.log(`📝 Including draft ID in verification link: ${draftId}`)
    }
    
    console.log(`📧 Verification link for new user: ${verificationLink}`)
    
    // Send verification email with proper error handling
    let emailSent = false
    let emailError = null
    try {
      const emailResult = await sendVerificationEmail(
        user.email,
        user.name,
        verificationLink
      )
      
      if (emailResult.success) {
        console.log(`✅ Verification email sent successfully to ${user.email}`)
        if (emailResult.messageId) {
          console.log(`✅ Email Message ID: ${emailResult.messageId}`)
        }
        emailSent = true
      } else {
        console.error(`❌ Failed to send verification email to ${user.email}:`, emailResult.error)
        emailError = emailResult.error
        // Log to database for admin tracking
        try {
          await db.auditLog.create({
            data: {
              action: 'EMAIL_SEND_FAILED',
              performedBy: 'SYSTEM',
              entityType: 'USER',
              entityId: user.id,
              details: JSON.stringify({
                email: user.email,
                emailType: 'verification',
                error: emailResult.error,
                timestamp: new Date().toISOString()
              })
            }
          }).catch(auditError => {
            console.error('Failed to log email failure to audit log:', auditError)
          })
        } catch (auditError) {
          console.error('Failed to create audit log for email failure:', auditError)
        }
      }
    } catch (emailException) {
      console.error(`❌ Exception sending verification email to ${user.email}:`, emailException)
      emailError = emailException instanceof Error ? emailException.message : 'Unknown error'
    }

    // Return success with warning if email failed
    const response: any = {
      message: emailSent 
        ? "Account created successfully. Please check your email to verify your account."
        : "Account created successfully, but we couldn't send the verification email. Please contact support or try resending the verification email.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    }
    
    // Include email status for debugging (dev only)
    if (process.env.NODE_ENV === 'development') {
      response.emailStatus = {
        sent: emailSent,
        error: emailError
      }
    }
    
    // If email failed, include a flag so frontend can offer to resend
    if (!emailSent) {
      response.emailFailed = true
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 })
    }

    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
