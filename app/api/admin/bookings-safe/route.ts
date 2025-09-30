import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Bookings API: Starting request...')
    
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      console.log('Bookings API: Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Bookings API: User authenticated:', user.id)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    console.log('Bookings API: Request params:', { search, status, page, limit })

    // Build where clause with safe field access
    const where: any = {}
    
    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: "insensitive" } } },
        { provider: { user: { name: { contains: search, mode: "insensitive" } } } },
        { service: { name: { contains: search, mode: "insensitive" } } }
      ]
    }
    
    if (status !== "all") {
      where.status = status
    }

    console.log('Bookings API: Where clause:', where)

    // Get bookings with minimal, safe field selection
    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where,
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          scheduledDate: true,
          description: true,
          address: true,
          client: {
            select: {
              name: true,
              email: true
            }
          },
          provider: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          service: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.booking.count({ where })
    ])

    console.log('Bookings API: Found bookings:', bookings.length, 'Total:', totalCount)

    // Transform bookings data with safe field access
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      clientName: booking.client?.name || 'N/A',
      clientEmail: booking.client?.email || 'N/A',
      providerName: booking.provider?.user?.name || 'N/A',
      providerEmail: booking.provider?.user?.email || 'N/A',
      serviceName: booking.service?.name || 'N/A',
      status: booking.status,
      totalAmount: booking.totalAmount || 0,
      createdAt: booking.createdAt,
      scheduledDate: booking.scheduledDate,
      location: booking.address || 'N/A',
      notes: booking.description || 'N/A'
    }))

    const response = {
      bookings: transformedBookings,
      totalCount: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    }

    console.log('Bookings API: Successfully returning:', response.bookings.length, 'bookings')
    return NextResponse.json(response)

  } catch (error) {
    console.error("Bookings API Error:", error)
    console.error("Error stack:", error.stack)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, action, data } = body

    console.log('Admin bookings API: Updating booking:', bookingId, 'action:', action)

    // Handle different booking management actions
    switch (action) {
      case 'confirm':
        const confirmedBooking = await db.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'CONFIRMED'
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          booking: confirmedBooking,
          message: 'Booking confirmed successfully'
        })

      case 'complete':
        const completedBooking = await db.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'COMPLETED'
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          booking: completedBooking,
          message: 'Booking completed successfully'
        })

      case 'cancel':
        const cancelledBooking = await db.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'CANCELLED'
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          booking: cancelledBooking,
          message: 'Booking cancelled successfully'
        })

      case 'reschedule':
        const rescheduledBooking = await db.booking.update({
          where: { id: bookingId },
          data: { 
            status: 'PENDING'
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          booking: rescheduledBooking,
          message: 'Booking rescheduled successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
