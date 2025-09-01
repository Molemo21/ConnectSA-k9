import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Test database connection
    await prisma.$connect()
    
    // Test a simple query
    const userCount = await prisma.user.count()
    
    // Test finding a specific user (replace with your email)
    const testEmail = request.nextUrl.searchParams.get('email')
    let testUser = null
    
    if (testEmail) {
      testUser = await prisma.user.findUnique({
        where: { email: testEmail },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          // Don't select password for security
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        isActive: testUser.isActive,
        emailVerified: testUser.emailVerified
      } : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({
      error: "Database test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 