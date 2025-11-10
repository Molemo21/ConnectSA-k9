import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

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
  const logger = createLogger('ClientBookingsAPI');
  
  try {
    // Parse query parameters for pagination and date filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20'); // Default: 20 bookings
    const days = parseInt(searchParams.get('days') || '90'); // Default: last 90 days
    const showAll = searchParams.get('showAll') === 'true'; // Override to show all
    
    logger.info('Client bookings API: Starting request', { 
      page, 
      limit, 
      days, 
      showAll 
    });
    
    logger.info('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      cookieDomain: process.env.COOKIE_DOMAIN
    });
    
    // Get current user
    const user = await getCurrentUser();
    logger.info('Client bookings API: User fetched', { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email,
      isAuthenticated: !!user
    });
    
    if (!user) {
      logger.warn('Client bookings API: No user found - returning empty data');
      return NextResponse.json({ 
        bookings: [],
        message: "No authenticated user found",
        success: false
      }, { status: 200 });
    }
    
    if (user.role !== "CLIENT") {
      logger.warn('Client bookings API: User is not a client', { userRole: user.role });
      return NextResponse.json({ 
        bookings: [],
        message: "User is not a client",
        success: false
      }, { status: 200 });
    }

    // Build where clause with optional date filtering
    const whereClause: any = {
      clientId: user.id,
    };
    
    // Add date filter if not showing all
    if (!showAll) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.createdAt = {
        gte: cutoffDate
      };
    }
    
    // Fetch bookings with optimization (limit + date filter + pagination)
    const bookings = await db.booking.findMany({
      where: whereClause,
      take: limit,
      skip: page * limit,
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        duration: true,
        totalAmount: true,
        platformFee: true,
        description: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        paymentMethod: true,
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true
              }
            }
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            location: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            paystackRef: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true
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
    
    // Get total count for pagination
    const totalCount = await db.booking.count({
      where: whereClause
    });

    logger.info('Client bookings API: Bookings fetched', { 
      userId: user.id, 
      bookingCount: bookings.length 
    });

    // Transform bookings for frontend with complete data
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
      paymentMethod: booking.paymentMethod, // Include payment method
      // Catalogue pricing fields (for accurate price display)
      bookedPrice: booking.bookedPrice,
      bookedCurrency: booking.bookedCurrency,
      catalogueItemId: booking.catalogueItemId,
      service: booking.service,
      provider: booking.provider,
      payment: booking.payment, // Include actual payment data
      review: booking.review // Include actual review data
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length,
      total: totalCount,
      page: page,
      hasMore: (page + 1) * limit < totalCount
    });

  } catch (error) {
    logger.error('Client bookings API: Error fetching bookings', error);
    
    // Return empty data instead of error to prevent dashboard crashes
    return NextResponse.json({ 
      success: false,
      bookings: [],
      message: "Failed to fetch bookings",
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    }, { status: 200 });
  }
}