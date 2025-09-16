import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('Provider bookings API: Starting request')
    
    const user = await getCurrentUser()
    console.log('Provider bookings API: User fetched:', { user: user ? { id: user.id, role: user.role } : null })
    
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

    console.log('Provider bookings API: Provider found:', { provider: provider ? { id: provider.id } : null })

    if (!provider) {
      console.log('Provider bookings API: Provider record not found for user:', user.id)
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    // Fetch all bookings for this provider
    const bookings = await db.booking.findMany({
      where: {
        providerId: provider.id,
        status: {
          in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
        },
      },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { scheduledDate: "asc" },
    })

    // Calculate stats
    const pendingJobs = bookings.filter(b => b.status === "PENDING").length
    const confirmedJobs = bookings.filter(b => b.status === "CONFIRMED").length
    const pendingExecutionJobs = bookings.filter(b => b.status === "PENDING_EXECUTION").length
    const inProgressJobs = bookings.filter(b => b.status === "IN_PROGRESS").length
    const completedJobs = bookings.filter(b => b.status === "COMPLETED").length

    const totalEarnings = bookings
      .filter(b => b.payment && b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
    
    const thisMonthEarnings = bookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return b.payment && 
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
      pendingExecutionJobs,
      inProgressJobs,
      completedJobs,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews: reviews.length
    }

    return NextResponse.json({ bookings, stats })
  } catch (error) {
    console.error("Provider bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 