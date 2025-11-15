import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"
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
  paymentMethod: z.enum(["ONLINE", "CASH"]).optional(),
  providerId: z.string().optional(),
  catalogueItemId: z.string().optional(),
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

    // Try to get current user (optional - drafts can be saved without auth)
    const user = await getCurrentUser()
    
    // If no user, we can't save to database (userId is required)
    // Return success but note that it's only saved to localStorage
    if (!user) {
      console.log(`📝 Draft ${validated.id} saved to localStorage only (no authenticated user)`)
      return NextResponse.json({
        success: true,
        draft: {
          id: validated.id,
          serviceId: validated.serviceId,
          date: validated.date,
          time: validated.time,
          address: validated.address,
          notes: validated.notes,
          paymentMethod: validated.paymentMethod,
          providerId: validated.providerId,
          catalogueItemId: validated.catalogueItemId,
          createdAt: new Date().toISOString(),
          expiresAt: validated.expiresAt
        },
        note: "Draft saved to localStorage only. Server save requires authentication."
      })
    }

    // Check if draft already exists for this user
    // Try to find draft - if providerId column doesn't exist, Prisma will error
    // We'll catch that and retry without providerId in the query
    let existingDraft
    try {
      existingDraft = await db.bookingDraft.findFirst({
        where: { 
          id: validated.id,
          userId: user.id
        }
      })
    } catch (error: any) {
      // If error is about missing providerId column, try again with explicit select
      if (error?.code === 'P2022' && error?.meta?.column?.includes('providerId')) {
        console.warn('providerId column not found, querying without it')
        existingDraft = await db.bookingDraft.findFirst({
          where: { 
            id: validated.id,
            userId: user.id
          },
          select: {
            id: true,
            userId: true,
            serviceId: true,
            address: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        })
      } else {
        throw error
      }
    }

    if (existingDraft) {
      // Update existing draft
      // Try with providerId first, fallback without it if column doesn't exist
      const updateDataBase: any = {
        serviceId: validated.serviceId,
        address: validated.address,
        description: validated.notes,
        updatedAt: new Date()
      }
      
      let updatedDraft
      try {
        // Try update with providerId if provided
        const updateData = validated.providerId 
          ? { ...updateDataBase, providerId: validated.providerId }
          : updateDataBase
        
        updatedDraft = await db.bookingDraft.update({
          where: { id: existingDraft.id },
          data: updateData,
          select: {
            id: true,
            userId: true,
            serviceId: true,
            address: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        })
      } catch (error: any) {
        // If error is about missing providerId column, retry without it
        if (error?.code === 'P2022' && error?.meta?.column?.includes('providerId')) {
          console.warn('providerId column not found, updating without it')
          updatedDraft = await db.bookingDraft.update({
            where: { id: existingDraft.id },
            data: updateDataBase,
            select: {
              id: true,
              userId: true,
              serviceId: true,
              address: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          })
        } else {
          throw error
        }
      }

      console.log(`📝 Updated booking draft: ${validated.id}`)
      
      return NextResponse.json({
        success: true,
        draft: {
          id: updatedDraft.id,
          serviceId: updatedDraft.serviceId,
          address: updatedDraft.address,
          notes: updatedDraft.description,
          userId: updatedDraft.userId,
          createdAt: updatedDraft.createdAt.toISOString(),
          updatedAt: updatedDraft.updatedAt.toISOString()
        }
      })
    } else {
      // Create new draft
      // Try with providerId first, fallback without it if column doesn't exist
      const createDataBase: any = {
        id: validated.id,
        userId: user.id,
        serviceId: validated.serviceId,
        address: validated.address,
        description: validated.notes,
        status: "DRAFT"
      }
      
      let newDraft
      try {
        // Try create with providerId if provided
        const createData = validated.providerId 
          ? { ...createDataBase, providerId: validated.providerId }
          : createDataBase
        
        newDraft = await db.bookingDraft.create({
          data: createData,
          select: {
            id: true,
            userId: true,
            serviceId: true,
            address: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        })
      } catch (error: any) {
        // If error is about missing providerId column, retry without it
        if (error?.code === 'P2022' && error?.meta?.column?.includes('providerId')) {
          console.warn('providerId column not found, creating without it')
          newDraft = await db.bookingDraft.create({
            data: createDataBase,
            select: {
              id: true,
              userId: true,
              serviceId: true,
              address: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          })
        } else {
          throw error
        }
      }

      console.log(`📝 Created new booking draft: ${validated.id}`)
      
      return NextResponse.json({
        success: true,
        draft: {
          id: newDraft.id,
          serviceId: newDraft.serviceId,
          address: newDraft.address,
          notes: newDraft.description,
          userId: newDraft.userId,
          createdAt: newDraft.createdAt.toISOString(),
          updatedAt: newDraft.updatedAt.toISOString()
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
