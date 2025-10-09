import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Testing login route...')
    
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log('🔍 Looking for user:', email)
    
    // Debug: Check what's available on prisma
    console.log('🔍 Prisma object keys:', Object.keys(prisma))
    console.log('🔍 Prisma.user:', prisma.user)
    
    // Test database connection first
    try {
      const testQuery = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Database connection test successful')
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
        isActive: true,
        role: true,
      },
    })

    console.log('👤 User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.password) {
      return NextResponse.json({ error: "User has no password set" }, { status: 400 })
    }

    console.log('✅ Login test successful for:', user.email)
    
    return NextResponse.json({
      success: true,
      message: "Login test successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isActive: user.isActive
      }
    })

  } catch (error) {
    console.error('❌ Login test error:', error)
    return NextResponse.json({ 
      error: "Login test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
