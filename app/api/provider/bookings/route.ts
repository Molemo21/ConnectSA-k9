import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== PROVIDER BOOKINGS API START ===')
    
    const user = await getCurrentUser()
    
    if (!user) {
      console.log('Provider bookings API: No user found')
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      console.log('Provider bookings API: User is not a provider:', user.role)
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    })

    if (!provider) {
      console.log('Provider bookings API: Provider profile not found for user:', user.id)
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    console.log('Fetching bookings for provider:', provider.id)

    // Fetch all bookings for this provider with related data
    const bookings = await db.booking.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        service: {
          include: {
            category: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true, // Use avatar instead of image
            phone: true
          }
        },
        payment: true,
        review: true
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    })

    console.log(`Found ${bookings.length} bookings`)

    // Calculate stats
    const pendingJobs = bookings.filter(b => b.status === "PENDING").length
    const confirmedJobs = bookings.filter(b => b.status === "CONFIRMED").length
    const inProgressJobs = bookings.filter(b => b.status === "IN_PROGRESS").length
    const completedJobs = bookings.filter(b => b.status === "COMPLETED").length
    const cancelledJobs = bookings.filter(b => b.status === "CANCELLED").length

    const totalEarnings = bookings
      .filter(b => b.payment && b.payment.amount && b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
    
    const thisMonthEarnings = bookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return b.payment && 
               b.payment.amount &&
               b.status === "COMPLETED" &&
               bookingDate.getMonth() === now.getMonth() &&
               bookingDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

    const reviews = bookings.filter(b => b.review)
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / reviews.length 
      : 0

    const stats = {
      pendingJobs,
      confirmedJobs,
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews: reviews.length
    }

    // Create response with cache-busting headers
    const response = NextResponse.json({ 
      success: true,
      bookings, 
      stats, 
      providerId: provider.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`,
      timestamp: new Date().toISOString()
    })

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    console.log('=== PROVIDER BOOKINGS API SUCCESS ===')
    return response
    
  } catch (error) {
    console.error("=== PROVIDER BOOKINGS API ERROR ===", {
      timestamp: new Date().toISOString(),
      context: 'provider-bookings-api',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
    
    const errorResponse = NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
    
    // Add cache-busting headers to error response too
    errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    errorResponse.headers.set('Pragma', 'no-cache')
    errorResponse.headers.set('Expires', '0')
    
    return errorResponse
  }
}