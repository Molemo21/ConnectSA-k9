import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE DATABASE CHECK ===');
    
    // Test basic connectivity
    const userCount = await prisma.user.count();
    const providerCount = await prisma.provider.count();
    const bookingCount = await prisma.booking.count();
    const serviceCount = await prisma.service.count();

    console.log('Database counts:', { userCount, providerCount, bookingCount, serviceCount });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        createdAt: true
      }
    });

    // Get providers with their user info
    const providers = await prisma.provider.findMany({
      take: 5,
      select: {
        id: true,
        businessName: true,
        status: true,
        available: true,
        userId: true
      }
    });

    return NextResponse.json({
      success: true,
      counts: {
        users: userCount,
        providers: providerCount,
        bookings: bookingCount,
        services: serviceCount
      },
      recentBookings,
      providers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Simple database check error:', error);
    return NextResponse.json({ 
      error: "Database error",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
