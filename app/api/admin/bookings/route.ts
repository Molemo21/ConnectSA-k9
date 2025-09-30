import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Build where clause
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

    // Get bookings with related data
    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          provider: {
            include: {
              user: {
                select: {
                  id: true,
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
          },
          review: {
            select: {
              rating: true,
              comment: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.booking.count({ where })
    ])

    // Transform bookings data
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      clientPhone: booking.client.phone,
      providerName: booking.provider.user.name,
      providerEmail: booking.provider.user.email,
      service: booking.service.name,
      description: booking.description,
      status: booking.status,
      scheduledDate: booking.scheduledDate?.toISOString().split('T')[0] || null,
      completedDate: booking.completedAt?.toISOString().split('T')[0] || null,
      duration: booking.estimatedDuration || "Not specified",
      location: booking.location || "Not specified",
      address: booking.address || "Not specified",
      price: booking.totalAmount,
      rating: booking.review?.rating || 0,
      review: booking.review?.comment || null,
      createdAt: booking.createdAt.toISOString().split('T')[0]
    }))

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
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
        
        // Clear cache
        adminDataService.clearCache()
        
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
        
        // Clear cache
        adminDataService.clearCache()
        
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
        
        // Clear cache
        adminDataService.clearCache()
        
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
        
        // Clear cache
        adminDataService.clearCache()
        
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