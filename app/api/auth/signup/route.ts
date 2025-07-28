import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"
import { sendEmail } from '@/lib/utils'

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "PROVIDER"]).default("CLIENT"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      if (!existingUser.emailVerified) {
        // Rate limit: allow max 3 tokens per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentTokens = await prisma.verificationToken.count({
          where: {
            userId: existingUser.id,
            createdAt: { gte: oneHourAgo },
          },
        })
        if (recentTokens >= 3) {
          return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 })
        }
        // Delete any existing tokens for this user
        await prisma.verificationToken.deleteMany({ where: { userId: existingUser.id } })
        // Generate a new token
        const token = crypto.randomBytes(32).toString("hex")
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
        await prisma.verificationToken.create({
          data: {
            userId: existingUser.id,
            token,
            expires,
          },
        })
        // Mock sending email: log the verification link
        const baseUrl = request.nextUrl.origin || "http://localhost:3000"
        const verificationLink = `${baseUrl}/verify-email?token=${token}`
        await sendEmail({
          to: validatedData.email,
          subject: 'Verify your email for ConnectSA',
          html: `<p>Welcome to ConnectSA!</p><p>Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
        })
        return NextResponse.json({
          message: "Email already registered but not verified. We've sent you a new verification email.",
        }, { status: 200 })
      }
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
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

    // If provider, create provider profile
    if (validatedData.role === "PROVIDER") {
      await prisma.provider.create({
        data: {
          userId: user.id,
        },
      })
    }

    // Generate a 1-hour verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })

    // Mock sending email: log the verification link
    const baseUrl = request.nextUrl.origin || "http://localhost:3000"
    const verificationLink = `${baseUrl}/verify-email?token=${token}`
    await sendEmail({
      to: user.email,
      subject: 'Verify your email for ConnectSA',
      html: `<p>Welcome to ConnectSA!</p><p>Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
    })

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 })
    }

    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
