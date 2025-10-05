export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const body = await request.json()
    const { userId, email } = body

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Find user with provider info if applicable
    const user = await db.user.findUnique({
      where: { id: userId, email },
      include: {
        provider: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ensure email is verified
    if (!user.emailVerified) {
      return NextResponse.json({ error: "Email not verified" }, { status: 403 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: "Account has been deactivated" }, { status: 401 })
    }

    // Create auth user object
    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    }

    // Set auth cookie
    await setAuthCookie(authUser)

    console.log(`✅ Auto-login successful for user ${user.email}`)

    // Check for booking draft to merge
    let draftData = null
    try {
      const draftId = request.headers.get('x-draft-id') || 
                     request.cookies.get('booking_draft_id')?.value
      
      if (draftId) {
        console.log(`🔗 Attempting to merge draft ${draftId} with user ${user.id}`)
        
        // Import the merge function
        const { mergeDraftWithUser } = await import('@/lib/booking-draft')
        const mergeResult = await mergeDraftWithUser(draftId, user.id)
        
        if (mergeResult.success && mergeResult.draft) {
          draftData = mergeResult.draft
          console.log(`✅ Successfully merged draft ${draftId} with user ${user.id}`)
        } else {
          console.warn(`⚠️ Failed to merge draft ${draftId}:`, mergeResult.error)
        }
      }
    } catch (error) {
      console.error('Error merging draft during auto-login:', error)
      // Don't fail auto-login if draft merge fails
    }

    return NextResponse.json({
      success: true,
      user: authUser,
      draft: draftData // Return draft data if available
    })

  } catch (error) {
    console.error("❌ Error during auto-login:", error)
    return NextResponse.json({ 
      error: "Auto-login failed",
      details: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
    }, { status: 500 })
  }
}
