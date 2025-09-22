import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('Provider bookings API: Starting request');
    
    const user = await getCurrentUser();
    console.log('Provider bookings API: User fetched:', { 
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

    const provider = await prisma.provider.findUnique({
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
    });

    console.log('Provider bookings API: Bookings fetched:', { 
      providerId: provider.id, 
      bookingCount: bookings.length 
    });

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

    console.log('Provider bookings API: Stats calculated:', stats);

    // Always return success response, even with empty bookings
    return NextResponse.json({ 
      success: true,
      bookings, 
      stats, 
      providerId: provider.id,
      message: bookings.length === 0 
        ? "No active bookings found. Your bookings will appear here when clients book your services."
        : `Found ${bookings.length} active bookings`
    });
    
  } catch (error) {
    console.error("Provider bookings API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}