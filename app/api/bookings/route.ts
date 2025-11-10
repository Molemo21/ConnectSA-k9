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
  const logger = createLogger('BookingsAPI');
  
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    logger.info('Bookings API: Starting request');
    
    // Get current user
    const user = await getCurrentUser();
    logger.info('Bookings API: User fetched', { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email 
    });
    
    if (!user) {
      logger.warn('Bookings API: No user found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let bookings = [];
    
    if (user.role === "CLIENT") {
      // Fetch client bookings
      bookings = await prisma.booking.findMany({
        where: {
          clientId: user.id,
        },
        include: {
          service: true,
          provider: {
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
          },
          payment: true,
          review: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      logger.info('Bookings API: Client bookings fetched', { 
        userId: user.id, 
        bookingCount: bookings.length 
      });
      
    } else if (user.role === "PROVIDER") {
      // Fetch provider bookings
      const provider = await prisma.provider.findUnique({
        where: { userId: user.id },
      });

      if (!provider) {
        logger.warn('Bookings API: Provider profile not found', { userId: user.id });
        return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
      }

      bookings = await prisma.booking.findMany({
        where: {
          providerId: provider.id,
        },
        include: {
          service: true,
          client: true,
          payment: true,
          review: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      logger.info('Bookings API: Provider bookings fetched', { 
        providerId: provider.id, 
        bookingCount: bookings.length 
      });
      
    } else if (user.role === "ADMIN") {
      // Fetch all bookings for admin
      bookings = await prisma.booking.findMany({
        include: {
          service: true,
          client: true,
          provider: {
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
          },
          payment: true,
          review: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      logger.info('Bookings API: Admin bookings fetched', { 
        adminId: user.id, 
        bookingCount: bookings.length 
      });
      
    } else {
      logger.warn('Bookings API: Invalid user role', { userRole: user.role });
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

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
      // Catalogue pricing fields (for accurate price display)
      bookedPrice: booking.bookedPrice,
      bookedCurrency: booking.bookedCurrency,
      catalogueItemId: booking.catalogueItemId,
      service: booking.service,
      provider: booking.provider,
      client: booking.client,
      payment: booking.payment,
      review: booking.review
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length,
      userRole: user.role
    });

  } catch (error) {
    logger.error('Bookings API: Error fetching bookings', error);
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to fetch bookings"
    }, { status: 500 });
  }
}
