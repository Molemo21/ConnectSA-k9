import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { adminDataService } from "@/lib/admin-data-service"

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
    const timeRange = searchParams.get('timeRange') || '30d'

    console.log('Admin analytics API: Starting request for user:', user.id, 'timeRange:', timeRange)

    // Use centralized admin data service
    const analytics = await adminDataService.getAnalyticsData(timeRange)

    console.log('Admin analytics API: Successfully fetched analytics:', analytics)
    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching admin analytics:", error)
    
    // Return default analytics if database is unavailable
    const defaultAnalytics = {
      totalUsers: 0,
      totalProviders: 0,
      pendingProviders: 0,
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      escrowRevenue: 0,
      averageRating: 0,
      totalPayments: 0,
      pendingPayments: 0,
      escrowPayments: 0,
      completedPayments: 0,
      failedPayments: 0,
      totalPayouts: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      userGrowth: 0,
      providerGrowth: 0,
      bookingGrowth: 0,
      revenueGrowth: 0,
      completionRate: 0,
      cancellationRate: 0,
      averageRevenuePerBooking: 0
    }
    
    console.log("Returning default analytics due to error:", error)
    return NextResponse.json(defaultAnalytics)
  }
}
