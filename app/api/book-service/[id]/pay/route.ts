import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";
import { paystackClient, paymentProcessor, PAYMENT_CONSTANTS } from "@/lib/paystack";
import { z } from "zod";
import { logPayment, logger } from "@/lib/logger";

export const dynamic = 'force-dynamic'

// Test endpoint to verify route accessibility
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Payment endpoint is accessible",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}

const paymentSchema = z.object({
  callbackUrl: z.string().url("Valid callback URL is required"),
});

export async function POST(request: NextRequest) {
  
  // Skip during build time (only if we're actually building, not running)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  let bookingId: string | null = null;
  let userId: string | null = null;

  try {
    // Authentication
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;

    // Extract booking ID from URL
    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/pay/);
    bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Parse and validate request body
    let validated;
    try {
      const body = await request.json();
      validated = paymentSchema.parse(body);
    } catch (parseError) {
      // Provide default callback URL if none provided
      validated = {
        callbackUrl: `${request.nextUrl.origin}/dashboard?payment=success&booking=${bookingId}`
      };
    }

    // Get booking with simplified query
    const booking = await db.booking.findUnique({ 
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        status: true,
        totalAmount: true,
        client: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate booking ownership
    if (booking.clientId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate booking status
    if (!["CONFIRMED", "PENDING", "ACCEPTED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Payment can only be made for confirmed, pending, or accepted bookings" 
      }, { status: 400 });
    }

    // Validate booking amount
    if (!booking.totalAmount || booking.totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid booking amount" }, { status: 400 });
    }

    // Validate client email
    if (!booking.client?.email) {
      return NextResponse.json({ error: "Client email is required for payment" }, { status: 400 });
    }

    // Check if payment already exists
    const existingPayment = await db.payment.findFirst({
      where: { bookingId: bookingId }
    });

    if (existingPayment) {
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
    }

    // For now, return a mock payment response to avoid Paystack integration issues
    // This allows the frontend to work while we can implement proper payment later
    const mockPayment = {
      id: `mock_${Date.now()}`,
      reference: `ref_${Date.now()}`,
      amount: booking.totalAmount,
      status: "PENDING",
    };

    return NextResponse.json({
      success: true,
      payment: mockPayment,
      booking: {
        id: booking.id,
        status: booking.status,
      },
      authorizationUrl: `${request.nextUrl.origin}/dashboard?payment=mock&booking=${bookingId}`,
      message: "Mock payment initialized successfully. Payment integration coming soon.",
      redirectUrl: `${request.nextUrl.origin}/dashboard?payment=mock&booking=${bookingId}`,
    });

  } catch (error) {
    console.error(`❌ Payment API Error:`, error);
    
    // Return a proper JSON error response
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Payment initialization failed. Please try again.",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}