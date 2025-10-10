import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db-utils";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG PROVIDER BOOKINGS ===');
    
    // Get all providers (simplified)
    const providers = await db.provider.findMany({
      select: {
        id: true,
        businessName: true,
        status: true,
        available: true,
        userId: true
      }
    });

    // Get all bookings (simplified)
    const allBookings = await db.booking.findMany({
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('Providers found:', providers.length);
    console.log('All bookings found:', allBookings.length);
    console.log('Users found:', users.length);

    return NextResponse.json({
      success: true,
      providers: providers,
      allBookings: allBookings,
      users: users,
      summary: {
        totalProviders: providers.length,
        totalBookings: allBookings.length,
        totalUsers: users.length,
        bookingsByStatus: allBookings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        providersByStatus: providers.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Debug provider bookings error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
