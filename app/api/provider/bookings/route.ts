import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
  const logger = createLogger('ProviderBookingsAPI');
  
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    logger.info('Starting provider bookings request');
    
    const user = await getCurrentUser();
    logger.info('User fetched', { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email 
    });
    
    if (!user) {
      logger.warn('No user found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (user.role !== "PROVIDER") {
      logger.warn('User is not a provider', { userRole: user.role });
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 });
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: user.id },
    });

    logger.info('Provider lookup result', { 
      providerId: provider?.id,
      businessName: provider?.businessName,
      status: provider?.status 
    });

    if (!provider) {
      logger.warn('Provider profile not found', { userId: user.id });
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Fetch all bookings for this provider
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        status: {
          in: ["PENDING", "CONFIRMED", "PENDING_EXECUTION", "IN_PROGRESS", "COMPLETED"]
        },
      },
      include: {
        service: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { scheduledDate: "asc" },
    })

    // Calculate stats
    const pendingJobs = bookings.filter(b => b.status === "PENDING").length
    const confirmedJobs = bookings.filter(b => b.status === "CONFIRMED").length
    const pendingExecutionJobs = bookings.filter(b => b.status === "PENDING_EXECUTION").length
    const inProgressJobs = bookings.filter(b => b.status === "IN_PROGRESS").length
    const completedJobs = bookings.filter(b => b.status === "COMPLETED").length

    const totalEarnings = bookings
      .filter(b => b.payment && b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
    
    const thisMonthEarnings = bookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return b.payment && 
               b.status === "COMPLETED" &&
               bookingDate.getMonth() === now.getMonth() &&
               bookingDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

    const reviews = bookings.filter(b => b.review)
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / reviews.length 
      : 0

    const stats = {
      pendingJobs,
      confirmedJobs,
      pendingExecutionJobs,
      inProgressJobs,
      completedJobs,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews: reviews.length
    }

    logger.info('Provider bookings API success', {
      providerId: provider.id,
      bookingCount: bookings.length,
      statsCalculated: !!stats
    });

    return NextResponse.json({ bookings, stats, providerId: provider.id });
    
  } catch (error) {
    logger.error('Provider bookings API error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 