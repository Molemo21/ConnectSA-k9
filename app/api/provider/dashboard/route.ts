import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logDashboard } from "@/lib/logger";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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

    logDashboard.success('provider', 'dashboard_load', 'Provider dashboard API: Starting request', {
      metadata: { cursor, pageSize }
    });
    
    // Get current user
    const user = await getCurrentUser();
    logDashboard.success('provider', 'dashboard_load', 'Provider dashboard API: User fetched', {
      userId: user?.id,
      metadata: { userRole: user?.role, userEmail: user?.email }
    });
    
    if (!user) {
      logDashboard.warn('provider', 'dashboard_load', 'Provider dashboard API: No user found - returning empty data', {
        error_code: 'NOT_AUTHENTICATED'
      });
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
      logDashboard.warn('provider', 'dashboard_load', 'Provider dashboard API: User is not a provider', {
        userId: user.id,
        userRole: user.role,
        error_code: 'UNAUTHORIZED_ROLE'
      });
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
      logDashboard.error('provider', 'dashboard_load', 'Provider dashboard API: Provider profile not found', new Error('Provider profile not found'), {
        userId: user.id,
        error_code: 'PROVIDER_NOT_FOUND'
      });
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    logDashboard.success('provider', 'dashboard_load', 'Provider dashboard API: Provider found', {
      userId: user.id,
      providerId: provider.id,
      metadata: { businessName: provider.businessName, status: provider.status }
    });

    // Fetch bookings for this provider with cursor-based pagination
    const whereClause = {
      providerId: provider.id,
      ...(cursor && { createdAt: { lt: new Date(cursor) } })
    };

    const bookings = await prisma.booking.findMany({
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

    logDashboard.success('provider', 'dashboard_load', 'Provider dashboard API: Bookings fetched', {
      userId: user.id,
      providerId: provider.id,
      metadata: { bookingCount: bookings.length }
    });

    // Calculate stats including payout information
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      inProgressBookings: bookings.filter(b => b.status === 'IN_PROGRESS').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalEarnings: bookings
        .filter(b => b.payment?.status === 'RELEASED')
        .reduce((sum, b) => sum + (b.payment?.escrowAmount || 0), 0),
      pendingEarnings: bookings
        .filter(b => b.payment?.status === 'ESCROW')
        .reduce((sum, b) => sum + (b.payment?.escrowAmount || 0), 0),
      processingEarnings: bookings
        .filter(b => b.payment?.payout?.status === 'PROCESSING')
        .reduce((sum, b) => sum + (b.payment?.escrowAmount || 0), 0),
      failedPayouts: bookings
        .filter(b => b.payment?.payout?.status === 'FAILED')
        .length,
      completedPayouts: bookings
        .filter(b => b.payment?.payout?.status === 'COMPLETED')
        .length,
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0)
    };

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
      service: booking.service,
      client: booking.client,
      payment: booking.payment,
      review: booking.review
    }));

    logDashboard.success('provider', 'dashboard_load', 'Provider dashboard API: Pagination response prepared', {
      userId: user.id,
      providerId: provider.id,
      metadata: { 
        itemCount: transformedBookings.length,
        hasMore,
        nextCursor: nextCursor ? 'present' : 'null',
        pageSize
      }
    });

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
      pagination: {
        hasMore,
        nextCursor,
        pageSize,
        count: transformedBookings.length
      }
    });

  } catch (error) {
    logDashboard.error('provider', 'dashboard_load', 'Provider dashboard API: Error fetching data', error as Error, {
      error_code: 'INTERNAL_ERROR',
      metadata: { errorMessage: (error as Error).message }
    });
    
    // Return empty data instead of error to prevent dashboard crashes
    return NextResponse.json({ 
      success: false,
      message: "Failed to fetch provider dashboard data",
      error: (error as Error).message,
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
