import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

// Structured logging utility
const createLogger = (context: string) => ({
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  error: (message: string, error?: any, data?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      context,
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({
      level: 'warn',
      context,
      message,
      timestamp: new Date().toISOString(),
      ...data
    }));
  }
});

export async function GET(request: NextRequest) {
  const logger = createLogger('ProviderDashboardAPI');
  
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    logger.info('Provider dashboard API: Starting request');
    
    // Get current user
    const user = await getCurrentUser();
    logger.info('Provider dashboard API: User fetched', { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email 
    });
    
    if (!user) {
      logger.warn('Provider dashboard API: No user found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (user.role !== "PROVIDER") {
      logger.warn('Provider dashboard API: User is not a provider', { userRole: user.role });
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 });
    }

    // Get provider profile
    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!provider) {
      logger.warn('Provider dashboard API: Provider profile not found', { userId: user.id });
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    logger.info('Provider dashboard API: Provider found', { 
      providerId: provider.id,
      businessName: provider.businessName,
      status: provider.status 
    });

    // Fetch all bookings for this provider
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            basePrice: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paystackRef: true,
            paidAt: true,
            authorizationUrl: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Provider dashboard API: Bookings fetched', { 
      providerId: provider.id, 
      bookingCount: bookings.length 
    });

    // Calculate stats
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      inProgressBookings: bookings.filter(b => b.status === 'IN_PROGRESS').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalEarnings: bookings
        .filter(b => b.payment?.status === 'RELEASED')
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      pendingEarnings: bookings
        .filter(b => b.payment?.status === 'ESCROW')
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0)
    };

    // Transform bookings for frontend
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      duration: booking.duration,
      totalAmount: booking.totalAmount,
      platformFee: booking.platformFee,
      description: booking.description,
      address: booking.address,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      service: booking.service,
      client: booking.client,
      payment: booking.payment,
      review: booking.review
    }));

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        description: provider.description,
        location: provider.location,
        status: provider.status,
        user: provider.user
      },
      bookings: transformedBookings,
      stats: stats,
      count: transformedBookings.length
    });

  } catch (error) {
    logger.error('Provider dashboard API: Error fetching data', error);
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to fetch provider dashboard data"
    }, { status: 500 });
  }
}
