import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      message: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Test endpoint - no authentication required
    const bookings = await prisma.booking.findMany({
      take: 5, // Limit to 5 for testing
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              }
            }
          }
        },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true,
      count: bookings.length,
      bookings: bookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        totalAmount: booking.totalAmount,
        service: booking.service?.name,
        provider: booking.provider?.user?.name,
        hasPayment: !!booking.payment,
        hasReview: !!booking.review,
      }))
    });
  } catch (error) {
    console.error("Test bookings error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    }, { status: 500 });
  }
}
