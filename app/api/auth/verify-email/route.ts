import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const token = request.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  // Find the verification token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  if (verificationToken.expires < new Date()) {
    // Optionally delete expired token
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.json({ error: "Token has expired" }, { status: 400 })
  }

  // Update user's emailVerified
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { emailVerified: true },
  })

  // Delete the token after use
  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.json({ message: "Email verified successfully" })
} 