import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Provider Dashboard API: Starting');
    
    const user = await getCurrentUser();
    console.log('🔍 Provider Dashboard API: User fetched', { hasUser: !!user, userId: user?.id, role: user?.role });
    
    if (!user) {
      console.log('🔍 Provider Dashboard API: No user');
      return NextResponse.json({ 
        success: false,
        message: "No authenticated user found",
        bookings: [],
        stats: {
          totalBookings: 0,
          completedBookings: 0,
          pendingBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0
        }
      }, { status: 200 });
    }
    
    if (user.role !== "PROVIDER") {
      console.log('🔍 Provider Dashboard API: Not provider role');
      return NextResponse.json({ 
        success: false,
        message: "User is not a provider",
        bookings: [],
        stats: {
          totalBookings: 0,
          completedBookings: 0,
          pendingBookings: 0,
          totalEarnings: 0,
          monthlyEarnings: 0
        }
      }, { status: 200 });
    }

    console.log('🔍 Provider Dashboard API: Finding provider...');
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        businessName: true,
        status: true
      }
    });
    console.log('🔍 Provider Dashboard API: Provider found', { hasProvider: !!provider, providerId: provider?.id });

    if (!provider) {
      console.log('🔍 Provider Dashboard API: No provider found');
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    console.log('🔍 Provider Dashboard API: Querying bookings...');
    const bookings = await db.booking.findMany({
      where: {
        providerId: provider.id
      },
      select: {
        id: true,
        status: true,
        totalAmount: true
      },
      take: 10
    });
    console.log('🔍 Provider Dashboard API: Bookings queried', { count: bookings.length });

    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalEarnings: bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };

    console.log('🔍 Provider Dashboard API: Stats calculated', stats);

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        status: provider.status
      },
      bookings: bookings,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Provider dashboard error:', error);
    
    return NextResponse.json({ 
      success: false,
      message: "Failed to fetch provider dashboard data",
      error: error instanceof Error ? error.message : 'Unknown error',
      bookings: [],
      stats: {
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        totalEarnings: 0,
        monthlyEarnings: 0
      }
    }, { status: 200 });
  }
}
