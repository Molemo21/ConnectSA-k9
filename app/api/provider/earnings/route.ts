import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Provider Earnings API: Starting');
    
    const user = await getCurrentUser()
    console.log('🔍 Provider Earnings API: User fetched', { hasUser: !!user, userId: user?.id, role: user?.role });
    
    if (!user) {
      console.log('🔍 Provider Earnings API: No user');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      console.log('🔍 Provider Earnings API: Not provider role');
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    console.log('🔍 Provider Earnings API: Finding provider...');
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    })
    console.log('🔍 Provider Earnings API: Provider found', { hasProvider: !!provider, providerId: provider?.id });

    if (!provider) {
      console.log('🔍 Provider Earnings API: No provider found');
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    console.log('🔍 Provider Earnings API: Querying bookings...');
    const completedBookings = await db.booking.findMany({
      where: {
        providerId: provider.id,
        status: "COMPLETED"
      },
      select: {
        id: true,
        totalAmount: true
      },
    })
    console.log('🔍 Provider Earnings API: Bookings queried', { count: completedBookings.length });

    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0)
    }, 0)

    console.log('🔍 Provider Earnings API: Earnings calculated', { totalEarnings });

    return NextResponse.json({
      success: true,
      totalEarnings,
      completedBookings: completedBookings.length
    })
  } catch (error) {
    console.error("❌ Provider earnings error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalEarnings: 0,
      completedBookings: 0
    }, { status: 200 })
  }
}
