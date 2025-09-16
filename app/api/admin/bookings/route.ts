import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

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
