import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient, paymentProcessor, PAYMENT_CONSTANTS } from "@/lib/paystack";
import { z } from "zod";

const paymentSchema = z.object({
  callbackUrl: z.string().url("Valid callback URL is required"),
});

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/pay/);
    const bookingId = match ? match[1] : null;
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Handle request body - provide default callback URL if none provided
    let body;
    let validated;
    
    try {
      body = await request.json();
      validated = paymentSchema.parse(body);
      console.log('📋 Using provided callback URL:', validated.callbackUrl);
    } catch (parseError) {
      // If no body or invalid body, use default callback URL
      console.log("No request body provided, using default callback URL");
      validated = {
        callbackUrl: `${request.nextUrl.origin}/dashboard?payment=success`
      };
      console.log('📋 Using default callback URL:', validated.callbackUrl);
    }

    console.log(`🚀 Payment initialization started for booking ${bookingId}`);

    // STEP 1: Pre-validation outside transaction (fast operations)
    console.log('📋 Step 1: Pre-validation checks...');
    
    // Get booking with payment info
    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { 
        client: true, 
        provider: true, 
        payment: true,
        service: true 
      }
    });
    
    if (!booking) {
      console.log(`❌ Booking not found: ${bookingId}`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user is the client for this booking
    if (booking.clientId !== user.id) {
      console.log(`❌ Forbidden: User ${user.id} trying to pay for booking ${bookingId}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if booking can be paid
    if (!["CONFIRMED", "PENDING"].includes(booking.status)) {
      console.log(`❌ Invalid booking status: ${booking.status} for booking ${bookingId}`);
      return NextResponse.json({ error: "Payment can only be made for confirmed or pending bookings" }, { status: 400 });
    }

    // Check if payment already exists
    if (booking.payment) {
      console.log(`❌ Payment already exists for booking ${bookingId}`);
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
    }

    // Double-check if payment exists (race condition protection)
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: bookingId }
    });

    if (existingPayment) {
      console.log(`❌ Payment already exists (race condition) for booking ${bookingId}`);
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
    }

    console.log('✅ Pre-validation completed successfully');

    // STEP 2: External API call outside transaction
    console.log('🌐 Step 2: Initializing Paystack payment...');
    
    // Calculate payment breakdown
    const serviceAmount = booking.totalAmount || 0;
    const breakdown = paymentProcessor.calculatePaymentBreakdown(
      serviceAmount, 
      PAYMENT_CONSTANTS.PLATFORM_FEE_PERCENTAGE
    );

    console.log('💰 Payment breakdown:', breakdown);

    // Generate unique reference for Paystack
    const reference = paymentProcessor.generateReference();
    console.log('🔑 Generated Paystack reference:', reference);

    // Initialize Paystack payment (external API call)
    console.log('📡 Calling Paystack API with callback URL:', validated.callbackUrl);
    
    const paystackResponse = await paystackClient.initializePayment({
      amount: breakdown.totalAmount,
      email: user.email,
      reference: reference,
      callback_url: validated.callbackUrl,
      metadata: {
        bookingId: booking.id,
        clientId: user.id,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        serviceName: booking.service?.name,
      },
    });

    console.log('✅ Paystack payment initialized successfully');
    console.log('🔗 Paystack authorization URL:', paystackResponse.data.authorization_url);

    // STEP 3: Critical database writes in short transaction
    console.log('💾 Step 3: Creating payment record and updating booking...');
    
    const result = await prisma.$transaction(async (tx) => {
      // Final race condition check inside transaction
      const finalCheck = await tx.payment.findUnique({
        where: { bookingId: bookingId }
      });

      if (finalCheck) {
        throw new Error("Payment already exists for this booking");
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: bookingId,
          amount: breakdown.totalAmount,
          escrowAmount: breakdown.escrowAmount,
          platformFee: breakdown.platformFee,
          currency: PAYMENT_CONSTANTS.CURRENCY,
          paystackRef: reference,
          status: "PENDING",
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
        },
      });

      // IMPORTANT: Keep booking status as CONFIRMED until payment is actually completed
      // The status will be updated to PENDING_EXECUTION when Paystack webhook confirms payment
      const updatedBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true }
      });

      return { payment, booking: updatedBooking, paystackResponse };
    }, {
      timeout: 10000, // 10 seconds timeout for critical operations
      maxWait: 5000,  // Max wait time for transaction to start
    });

    console.log('✅ Database transaction completed successfully');

    // STEP 4: Success response and logging
    console.log(`🎉 Payment initialized for booking ${bookingId}:`, {
      reference: result.payment.paystackRef,
      amount: result.payment.amount,
      escrowAmount: result.payment.escrowAmount,
      platformFee: result.payment.platformFee,
      paystackRef: reference,
      authorizationUrl: result.paystackResponse.data.authorization_url,
    });

    // IMPORTANT: Log the exact response being sent
    const responseData = { 
      success: true,
      payment: result.payment,
      booking: result.booking,
      authorizationUrl: result.paystackResponse.data.authorization_url,
      accessCode: result.paystackResponse.data.access_code,
      reference: result.payment.paystackRef,
      message: "Payment initialized successfully. Redirecting to payment gateway...",
      redirectUrl: result.paystackResponse.data.authorization_url, // Explicit redirect URL
    };

    console.log('📤 Sending response to frontend:', responseData);
    console.log('🔗 Authorization URL being sent:', result.paystackResponse.data.authorization_url);

    // Return the response with all necessary data for the frontend
    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Payment initialization error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Payment can only be made for confirmed or pending bookings") {
        return NextResponse.json({ error: "Payment can only be made for confirmed or pending bookings" }, { status: 400 });
      }
      if (error.message === "Payment already exists for this booking") {
        return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
      }
      if (error.message.includes("Paystack API error")) {
        return NextResponse.json({ 
          error: "Payment service temporarily unavailable. Please try again later." 
        }, { status: 503 });
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    // Handle Prisma transaction errors specifically
    if (error.code === 'P2028') {
      console.error("🔄 Transaction timeout error - this should not happen with our refactored approach");
      return NextResponse.json({ 
        error: "Payment processing timeout. Please try again." 
      }, { status: 408 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 