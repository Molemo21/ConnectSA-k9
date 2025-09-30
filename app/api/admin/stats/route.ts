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

    console.log('Admin stats API: Starting request for user:', user.id)

    // Use centralized admin data service
    const stats = await adminDataService.getAdminStats()

    console.log('Admin stats API: Successfully fetched stats:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    
    // Return default stats if database is unavailable
    const defaultStats = {
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
      completedPayouts: 0
    }
    
    console.log("Returning default stats due to error:", error)
    return NextResponse.json(defaultStats)
  }
}