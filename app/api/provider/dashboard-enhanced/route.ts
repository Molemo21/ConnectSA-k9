// Enhanced provider dashboard with better error handling
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Skip during build time
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json({
        error: "Service temporarily unavailable during deployment"
      }, { status: 503 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 });
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        businessName: true,
        status: true,
        createdAt: true
      }
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Using select instead of include to avoid fetching non-existent payoutStatus field
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: {
          in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
        }
      },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        scheduledDate: true,
        duration: true,
        totalAmount: true,
        platformFee: true,
        description: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        catalogueItemId: true,
        bookedPrice: true,
        bookedCurrency: true,
        bookedDurationMins: true,
        paymentMethod: true,
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
      orderBy: { createdAt: 'desc' }
    });

    // Calculate comprehensive stats
    const stats = {
      totalBookings: bookings.length,
      pendingJobs: bookings.filter(b => b.status === "PENDING").length,
      confirmedJobs: bookings.filter(b => b.status === "CONFIRMED").length,
      pendingExecutionJobs: bookings.filter(b => b.status === "PENDING_EXECUTION").length,
      inProgressJobs: bookings.filter(b => b.status === "IN_PROGRESS").length,
      completedJobs: bookings.filter(b => b.status === "COMPLETED").length,
      totalEarnings: bookings
        .filter(b => b.payment && b.status === "COMPLETED")
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      thisMonthEarnings: bookings
        .filter(b => {
          const bookingDate = new Date(b.scheduledDate);
          const now = new Date();
          return b.payment && 
                 b.status === "COMPLETED" &&
                 bookingDate.getMonth() === now.getMonth() &&
                 bookingDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0),
      totalReviews: bookings.filter(b => b.review).length
    };

    return NextResponse.json({
      success: true,
      bookings,
      stats,
      providerId: provider.id,
      providerStatus: provider.status,
      businessName: provider.businessName,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`
    });

  } catch (error) {
    console.error('Provider dashboard enhanced API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
