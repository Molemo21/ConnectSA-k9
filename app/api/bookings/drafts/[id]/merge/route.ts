import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { z } from "zod"

export const runtime = 'nodejs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const mergeDraftSchema = z.object({
  userId: z.string().min(1)
})

/**
 * POST /api/bookings/drafts/[id]/merge
 * Merge a booking draft with a user after authentication
 */
export async function POST(
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
    const body = await request.json()
    const { userId } = mergeDraftSchema.parse(body)

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Draft ID is required"
      }, { status: 400 })
    }

    // Check if draft exists
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

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 })
    }

    // Update draft with user ID
    const updatedDraft = await db.bookingDraft.update({
      where: { id },
      data: {
        userId,
        updatedAt: new Date()
      }
    })

    console.log(`🔗 Merged booking draft ${id} with user ${userId}`)

    return NextResponse.json({
      success: true,
      draft: {
        id: updatedDraft.id,
        serviceId: updatedDraft.serviceId,
        date: updatedDraft.date,
        time: updatedDraft.time,
        address: updatedDraft.address,
        notes: updatedDraft.notes,
        userId: updatedDraft.userId,
        createdAt: updatedDraft.createdAt.toISOString(),
        expiresAt: updatedDraft.expiresAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error merging booking draft:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid request data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
