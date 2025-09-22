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
  const logger = createLogger('UserBookingsAPI');
  
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    logger.info('User bookings API: Starting request');
    
    // Get current user
    const user = await getCurrentUser();
    logger.info('User bookings API: User fetched', { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email 
    });
    
    if (!user) {
      logger.warn('User bookings API: No user found');
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
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
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
                  email: true,
                  phone: true
                }
              }
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
      
      logger.info('User bookings API: Client bookings fetched', { 
        userId: user.id, 
        bookingCount: bookings.length 
      });
      
    } else if (user.role === "PROVIDER") {
      // Fetch provider bookings
      const provider = await prisma.provider.findUnique({
        where: { userId: user.id },
      });

      if (!provider) {
        logger.warn('User bookings API: Provider profile not found', { userId: user.id });
        return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
      }

      bookings = await prisma.booking.findMany({
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
      
      logger.info('User bookings API: Provider bookings fetched', { 
        providerId: provider.id, 
        bookingCount: bookings.length 
      });
      
    } else {
      logger.warn('User bookings API: Invalid user role', { userRole: user.role });
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
    logger.error('User bookings API: Error fetching bookings', error);
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to fetch user bookings"
    }, { status: 500 });
  }
}
