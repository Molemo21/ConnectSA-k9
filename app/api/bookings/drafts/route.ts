import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { z } from "zod"

export const runtime = 'nodejs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createDraftSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  address: z.string().min(1),
  notes: z.string().optional(),
  expiresAt: z.string().datetime(),
})

/**
 * POST /api/bookings/drafts
 * Create or update a booking draft
 */
export async function POST(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const body = await request.json()
    const validated = createDraftSchema.parse(body)

    // Check if draft already exists
    const existingDraft = await db.bookingDraft.findUnique({
      where: { id: validated.id }
    })

    const expiresAt = new Date(validated.expiresAt)

    if (existingDraft) {
      // Update existing draft
      const updatedDraft = await db.bookingDraft.update({
        where: { id: validated.id },
        data: {
          serviceId: validated.serviceId,
          date: validated.date,
          time: validated.time,
          address: validated.address,
          notes: validated.notes,
          expiresAt,
          updatedAt: new Date()
        }
      })

      console.log(`📝 Updated booking draft: ${validated.id}`)
      
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
    } else {
      // Create new draft
      const newDraft = await db.bookingDraft.create({
        data: {
          id: validated.id,
          serviceId: validated.serviceId,
          date: validated.date,
          time: validated.time,
          address: validated.address,
          notes: validated.notes,
          expiresAt
        }
      })

      console.log(`📝 Created new booking draft: ${validated.id}`)
      
      return NextResponse.json({
        success: true,
        draft: {
          id: newDraft.id,
          serviceId: newDraft.serviceId,
          date: newDraft.date,
          time: newDraft.time,
          address: newDraft.address,
          notes: newDraft.notes,
          userId: newDraft.userId,
          createdAt: newDraft.createdAt.toISOString(),
          expiresAt: newDraft.expiresAt.toISOString()
        }
      })
    }
  } catch (error) {
    console.error('Error creating/updating booking draft:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid draft data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

/**
 * GET /api/bookings/drafts
 * Get all drafts for the current user (if authenticated)
 */
export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    // For now, return empty array since we don't have user authentication in this endpoint
    // This endpoint can be extended later to return user-specific drafts
    return NextResponse.json({
      success: true,
      drafts: []
    })
  } catch (error) {
    console.error('Error getting booking drafts:', error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
