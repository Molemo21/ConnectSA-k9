import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"

export const runtime = 'nodejs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/drafts/[id]
 * Get a specific booking draft by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Draft ID is required"
      }, { status: 400 })
    }

    const draft = await db.bookingDraft.findUnique({
      where: { id }
    })

    if (!draft) {
      return NextResponse.json({
        success: false,
        error: "Draft not found"
      }, { status: 404 })
    }

    // Check if draft has expired
    if (new Date(draft.expiresAt) < new Date()) {
      // Delete expired draft
      await db.bookingDraft.delete({
        where: { id }
      })

      return NextResponse.json({
        success: false,
        error: "Draft has expired"
      }, { status: 410 })
    }

    console.log(`📖 Retrieved booking draft: ${id}`)

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        serviceId: draft.serviceId,
        date: draft.date,
        time: draft.time,
        address: draft.address,
        notes: draft.notes,
        userId: draft.userId,
        createdAt: draft.createdAt.toISOString(),
        expiresAt: draft.expiresAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error getting booking draft:', error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

/**
 * DELETE /api/bookings/drafts/[id]
 * Delete a specific booking draft by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Draft ID is required"
      }, { status: 400 })
    }

    const draft = await db.bookingDraft.findUnique({
      where: { id }
    })

    if (!draft) {
      return NextResponse.json({
        success: false,
        error: "Draft not found"
      }, { status: 404 })
    }

    await db.bookingDraft.delete({
      where: { id }
    })

    console.log(`🗑️ Deleted booking draft: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Draft deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting booking draft:', error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
