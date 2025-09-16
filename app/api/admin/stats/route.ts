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

    // Get stats from database
    const [
      totalUsers,
      totalProviders,
      pendingProviders,
      totalBookings,
      completedBookings,
      totalRevenue
    ] = await Promise.all([
      db.user.count(),
      db.provider.count({ where: { status: "APPROVED" } }),
      db.provider.count({ where: { status: "PENDING" } }),
      db.booking.count(),
      db.booking.count({ where: { status: "COMPLETED" } }),
      db.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalAmount: true }
      })
    ])

    // Calculate average rating
    const reviews = await db.review.findMany({
      select: { rating: true }
    })
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0

    const stats = {
      totalUsers,
      totalProviders,
      pendingProviders,
      totalBookings,
      completedBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageRating: Math.round(averageRating * 10) / 10
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
