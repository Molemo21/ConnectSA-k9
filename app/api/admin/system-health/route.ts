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

    console.log('Admin system health API: Starting request for user:', user.id)

    // Use centralized admin data service
    const health = await adminDataService.getSystemHealth()

    console.log('Admin system health API: Successfully fetched health:', health)
    return NextResponse.json(health)
  } catch (error) {
    console.error("Error fetching system health:", error)
    
    // Return critical health status if service is unavailable
    const criticalHealth = {
      status: 'critical' as const,
      databaseConnection: false,
      apiResponseTime: 0,
      errorRate: 100,
      activeUsers: 0,
      systemLoad: 100
    }
    
    console.log("Returning critical health due to error:", error)
    return NextResponse.json(criticalHealth)
  }
}
