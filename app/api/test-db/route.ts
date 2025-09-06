export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log("🧪 Testing database connection and verification token functionality...")
    
    // Test basic database connection
    let userCount = 0
    try {
      userCount = await db.user.count({})
      console.log(`✅ Database connection successful. User count: ${userCount}`)
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError)
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
    }
    
    // Test verification token creation
    const testToken = "test_verification_token_" + Date.now()
    const testExpires = new Date(Date.now() + 60 * 60 * 1000)
    
    // Find a test user or create one
    let testUser = null
    try {
      testUser = await db.user.findFirst({})
      if (!testUser) {
        console.log("⚠️ No users found, creating a test user...")
        testUser = await db.user.create({
          data: {
            name: "Test User",
            email: `test${Date.now()}@example.com`,
            password: "hashedpassword",
            emailVerified: true,
          },
        })
        console.log(`✅ Created test user: ${testUser.email}`)
      }
    } catch (userError) {
      console.error("❌ User creation/retrieval failed:", userError)
      throw new Error(`User test failed: ${userError instanceof Error ? userError.message : 'Unknown error'}`)
    }
    
    // Create a test verification token
    let verificationToken = null
    try {
      verificationToken = await db.verificationToken.create({
        data: {
          userId: testUser.id,
          token: testToken,
          expires: testExpires,
        },
      })
      console.log(`✅ Created test verification token: ${testToken}`)
    } catch (tokenError) {
      console.error("❌ Token creation failed:", tokenError)
      throw new Error(`Token creation failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`)
    }
    
    // Retrieve the token
    let retrievedToken = null
    try {
      retrievedToken = await db.verificationToken.findUnique({
        where: { token: testToken },
        include: { user: true },
      })
      console.log(`✅ Retrieved test verification token: ${retrievedToken ? 'SUCCESS' : 'FAILED'}`)
    } catch (retrieveError) {
      console.error("❌ Token retrieval failed:", retrieveError)
      throw new Error(`Token retrieval failed: ${retrieveError instanceof Error ? retrieveError.message : 'Unknown error'}`)
    }
    
    // Clean up test token
    try {
      await db.verificationToken.delete({ where: { token: testToken } })
      console.log(`🗑️ Cleaned up test verification token`)
    } catch (cleanupError) {
      console.warn("⚠️ Token cleanup failed:", cleanupError)
      // Don't fail the test for cleanup issues
    }
    
    // Check existing verification tokens
    let existingTokens = []
    try {
      existingTokens = await db.verificationToken.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } }
      })
      console.log(`📊 Found ${existingTokens.length} existing verification tokens`)
      existingTokens.forEach(t => {
        console.log(`  - Token: ${t.token.substring(0, 8)}..., User: ${t.user.email}, Expires: ${t.expires}`)
      })
      
      // For testing purposes, return both preview and full tokens
      const tokensForTesting = existingTokens.map(t => ({
        tokenPreview: t.token.substring(0, 8) + "...",
        fullToken: t.token, // Include the full token for testing
        userEmail: t.user.email,
        expires: t.expires,
        createdAt: t.createdAt
      }))
      
      return NextResponse.json({
        message: "Database test completed successfully",
        userCount,
        testTokenCreated: !!verificationToken,
        testTokenRetrieved: !!retrievedToken,
        existingTokensCount: existingTokens.length,
        existingTokens: tokensForTesting
      })
      
    } catch (listError) {
      console.warn("⚠️ Failed to list existing tokens:", listError)
      // Return partial success if we can't list tokens
      return NextResponse.json({
        message: "Database test completed with partial success",
        userCount,
        testTokenCreated: !!verificationToken,
        testTokenRetrieved: !!retrievedToken,
        existingTokensCount: 0,
        existingTokens: []
      })
    }
    
  } catch (error) {
    console.error("❌ Database test failed:", error)
    return NextResponse.json({ 
      error: "Database test failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 