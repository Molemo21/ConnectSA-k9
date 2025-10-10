import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('=== PROVIDER BOOKINGS API START ===');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      cookieDomain: process.env.COOKIE_DOMAIN
    });
    
    const user = await getCurrentUser();
    console.log('User authenticated:', !!user, { 
      userId: user?.id, 
      userRole: user?.role,
      userEmail: user?.email 
    });
    
    if (!user) {
      console.log('Provider bookings API: No user found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    if (user.role !== "PROVIDER") {
      console.log('Provider bookings API: User is not a provider:', user.role);
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 });
    }

    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    });

    console.log('Provider bookings API: Provider found:', { 
      providerId: provider?.id,
      businessName: provider?.businessName,
      status: provider?.status 
    });

    if (!provider) {
      console.log('Provider bookings API: Provider profile not found for user:', user.id);
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
    }

    // Fetch all bookings for this provider with timeout
    console.log('Fetching bookings for provider:', provider.id);
    
    const bookings = await Promise.race([
      db.booking.findMany({
        where: {
          providerId: provider.id,
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
        orderBy: { scheduledDate: "desc" },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout after 15 seconds')), 15000)
      )
    ]);

    console.log('Bookings fetched successfully:', { 
      providerId: provider.id, 
      bookingCount: bookings.length,
      bookingStatuses: bookings.map(b => b.status)
    });

    // Calculate stats
    const pendingJobs = bookings.filter(b => b.status === "PENDING").length
    const confirmedJobs = bookings.filter(b => b.status === "CONFIRMED").length
    const inProgressJobs = bookings.filter(b => b.status === "IN_PROGRESS").length
    const completedJobs = bookings.filter(b => b.status === "COMPLETED").length
    const cancelledJobs = bookings.filter(b => b.status === "CANCELLED").length

    const totalEarnings = bookings
      .filter(b => b.payment && b.payment.amount && b.status === "COMPLETED")
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
    
    const thisMonthEarnings = bookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate)
        const now = new Date()
        return b.payment && 
               b.payment.amount &&
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
      inProgressJobs,
      completedJobs,
      cancelledJobs,
      totalEarnings,
      thisMonthEarnings,
      averageRating,
      totalReviews: reviews.length
    }

    console.log('Stats calculated successfully:', stats);

    // Create response with cache-busting headers
    const response = NextResponse.json({ 
      success: true,
      bookings, 
      stats, 
      providerId: provider.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`,
      timestamp: new Date().toISOString()
    });

    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log('=== PROVIDER BOOKINGS API SUCCESS ===');
    return response;
    
  } catch (error) {
    console.error("=== PROVIDER BOOKINGS API ERROR ===", error);
    
    const errorResponse = NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
    // Add cache-busting headers to error response too
    errorResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    errorResponse.headers.set('Pragma', 'no-cache');
    errorResponse.headers.set('Expires', '0');
    
    return errorResponse;
  }
}