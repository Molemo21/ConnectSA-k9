import { NextRequest, NextResponse } from "next/server"
import { generateAccessToken, verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if JWT_SECRET is set
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({
        error: "JWT_SECRET is not configured",
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Test JWT generation and verification
    const testUser = {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      role: "CLIENT" as const,
      emailVerified: true,
      avatar: null
    }

    try {
      // Generate a test token
      const token = await generateAccessToken(testUser)
      console.log("Test token generated successfully")

      // Verify the token
      const decoded = await verifyToken(token, 'access')
      console.log("Test token verified successfully:", decoded)

      return NextResponse.json({
        success: true,
        message: "JWT is working correctly",
        tokenGenerated: !!token,
        tokenVerified: !!decoded,
        timestamp: new Date().toISOString()
      })
    } catch (jwtError) {
      console.error("JWT test failed:", jwtError)
      return NextResponse.json({
        error: "JWT test failed",
        details: jwtError instanceof Error ? jwtError.message : "Unknown error",
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Test JWT error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 