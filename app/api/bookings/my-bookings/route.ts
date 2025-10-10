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
    logger.info('Client bookings API: Starting request');
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

    // Fetch all bookings for this client with simplified query
    const bookings = await db.booking.findMany({
      where: {
        clientId: user.id,
      },
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
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true
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
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('Client bookings API: Bookings fetched', { 
      userId: user.id, 
      bookingCount: bookings.length 
    });

    // Transform bookings for frontend (simplified)
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
      provider: booking.provider,
      payment: null, // Simplified - would need separate query
      review: null // Simplified - would need separate query
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length
    });

  } catch (error) {
    logger.error('Client bookings API: Error fetching bookings', error);
    
    // Return empty data instead of error to prevent dashboard crashes
    return NextResponse.json({ 
      success: false,
      bookings: [],
      message: "Failed to fetch bookings",
      error: error.message,
      count: 0
    }, { status: 200 });
  }
}