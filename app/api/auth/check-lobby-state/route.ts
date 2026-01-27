import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Check lobby state for user recovery after login
 * Returns booking status if user was in lobby
 */
export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 })
    }

    // Fetch booking with relations (matching pattern from other routes)
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: { 
          select: { 
            id: true, 
            name: true, 
            email: true 
          } 
        },
        provider: { 
          select: {
            id: true,
            businessName: true,
            user: { 
              select: { 
                name: true 
              } 
            }
          }
        },
        service: { 
          select: { 
            name: true 
          } 
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Verify booking belongs to user
    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        totalAmount: booking.totalAmount,
        address: booking.address,
        provider: booking.provider ? {
          id: booking.provider.id,
          businessName: booking.provider.businessName,
          user: booking.provider.user
        } : null,
        service: booking.service ? {
          name: booking.service.name
        } : null
      }
    })
  } catch (error) {
    console.error("Check lobby state error:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
