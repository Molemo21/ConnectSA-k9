import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB Wrapper Test: Starting');
    
    const user = await getCurrentUser()
    console.log('🔍 DB Wrapper Test: User fetched', { hasUser: !!user, userId: user?.id, role: user?.role });
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    console.log('🔍 DB Wrapper Test: Testing provider.findUnique...');
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    })
    console.log('🔍 DB Wrapper Test: Provider found', { hasProvider: !!provider, providerId: provider?.id });

    if (!provider) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    console.log('🔍 DB Wrapper Test: Testing booking.findMany...');
    const bookings = await db.booking.findMany({
      where: {
        providerId: provider.id
      },
      select: {
        id: true,
        status: true
      },
      take: 5
    })
    console.log('🔍 DB Wrapper Test: Bookings found', { count: bookings.length });

    return NextResponse.json({
      success: true,
      test: "db_wrapper_working",
      providerId: provider.id,
      bookingCount: bookings.length,
      bookings: bookings
    })
  } catch (error) {
    console.error("❌ DB Wrapper Test Error:", error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      test: "db_wrapper_failed",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 200 })
  }
}
