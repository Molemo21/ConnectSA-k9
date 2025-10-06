import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

export const runtime = 'nodejs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/drafts/user-drafts
 * Get all drafts for the current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    // Get current user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Not authenticated"
      }, { status: 401 })
    }

    // Fetch drafts for the current user, ordered by creation date (newest first)
    const drafts = await db.bookingDraft.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date() // Only get non-expired drafts
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert dates to ISO strings for JSON serialization
    const formattedDrafts = drafts.map(draft => ({
      id: draft.id,
      serviceId: draft.serviceId,
      date: draft.date,
      time: draft.time,
      address: draft.address,
      notes: draft.notes,
      userId: draft.userId,
      createdAt: draft.createdAt.toISOString(),
      expiresAt: draft.expiresAt.toISOString()
    }))

    console.log(`📝 Found ${formattedDrafts.length} drafts for user ${user.id}`)

    return NextResponse.json({
      success: true,
      drafts: formattedDrafts
    })

  } catch (error) {
    console.error('Error fetching user drafts:', error)
    
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
