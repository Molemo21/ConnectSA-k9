import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logDashboard } from "@/lib/logger";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const pageSize = Math.min(limit, 50); // Max 50 items per page

    logDashboard.success('client', 'dashboard_load', 'User bookings API: Starting request', {
      metadata: { cursor, pageSize }
    });
    
    // Get current user
    const user = await getCurrentUser();
    logDashboard.success('client', 'dashboard_load', 'User bookings API: User fetched', {
      userId: user?.id,
      metadata: { userRole: user?.role, userEmail: user?.email }
    });
    
    if (!user) {
      logDashboard.error('client', 'dashboard_load', 'User bookings API: No user found', new Error('Not authenticated'), {
        error_code: 'NOT_AUTHENTICATED'
      });
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let bookings = [];
    
    if (user.role === "CLIENT") {
      // Fetch client bookings with cursor-based pagination
      const whereClause = {
        clientId: user.id,
        ...(cursor && { createdAt: { lt: new Date(cursor) } })
      };

      bookings = await prisma.booking.findMany({
        where: whereClause,
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
          serviceId: true,
          providerId: true,
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
            escrowAmount: true,
            platformFee: true,
            paystackRef: true,
            paidAt: true,
            authorizationUrl: true,
            payout: {
              select: {
                id: true,
                status: true,
                transferCode: true,
                createdAt: true,
                updatedAt: true
              }
            }
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
        },
        take: pageSize + 1 // Take one extra to check if there are more items
      });
      
      logDashboard.success('client', 'dashboard_load', 'User bookings API: Client bookings fetched', {
        userId: user.id,
        metadata: { bookingCount: bookings.length }
      });
      
    } else if (user.role === "PROVIDER") {
      // Fetch provider bookings
      const provider = await prisma.provider.findUnique({
        where: { userId: user.id },
      });

      if (!provider) {
        logDashboard.error('provider', 'dashboard_load', 'User bookings API: Provider profile not found', new Error('Provider profile not found'), {
          userId: user.id,
          error_code: 'PROVIDER_NOT_FOUND'
        });
        return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
      }

      // Fetch provider bookings with cursor-based pagination
      const whereClause = {
        providerId: provider.id,
        ...(cursor && { createdAt: { lt: new Date(cursor) } })
      };

      bookings = await prisma.booking.findMany({
        where: whereClause,
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
            escrowAmount: true,
            platformFee: true,
            paystackRef: true,
            paidAt: true,
            authorizationUrl: true,
            payout: {
              select: {
                id: true,
                status: true,
                transferCode: true,
                createdAt: true,
                updatedAt: true
              }
            }
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
        },
        take: pageSize + 1 // Take one extra to check if there are more items
      });
      
      logDashboard.success('provider', 'dashboard_load', 'User bookings API: Provider bookings fetched', {
        userId: user.id,
        providerId: provider.id,
        metadata: { bookingCount: bookings.length }
      });
      
    } else {
      logDashboard.error('client', 'dashboard_load', 'User bookings API: Invalid user role', new Error('Invalid user role'), {
        userId: user.id,
        userRole: user.role,
        error_code: 'INVALID_USER_ROLE'
      });
      return NextResponse.json({ error: "Invalid user role" }, { status: 403 });
    }

    // Check if there are more items
    const hasMore = bookings.length > pageSize;
    const items = hasMore ? bookings.slice(0, pageSize) : bookings;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    // Transform bookings for frontend
    const transformedBookings = items.map(booking => ({
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

    logDashboard.success('client', 'dashboard_load', 'User bookings API: Pagination response prepared', {
      userId: user.id,
      metadata: { 
        itemCount: transformedBookings.length,
        hasMore,
        nextCursor: nextCursor ? 'present' : 'null',
        pageSize
      }
    });

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      pagination: {
        hasMore,
        nextCursor,
        pageSize,
        count: transformedBookings.length
      },
      userRole: user.role
    });

  } catch (error) {
    logDashboard.error('client', 'dashboard_load', 'User bookings API: Error fetching bookings', error as Error, {
      error_code: 'INTERNAL_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
    
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Failed to fetch user bookings"
    }, { status: 500 });
  }
}
