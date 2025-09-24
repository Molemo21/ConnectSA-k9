import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
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
      logPayment.error('init', 'Unauthorized payment attempt', new Error('Unauthorized'), {
        userId: user?.id,
        userRole: user?.role,
        error_code: 'UNAUTHORIZED'
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;

    // Extract booking ID from URL
    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/pay/);
    bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      logPayment.error('init', 'Invalid booking ID in URL', new Error('Invalid booking ID'), {
        userId,
        pathname,
        error_code: 'INVALID_BOOKING_ID'
      });
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Parse and validate request body
    let validated;
    try {
      const body = await request.json();
      validated = paymentSchema.parse(body);
      logPayment.success('init', 'Using provided callback URL', {
        userId,
        bookingId,
        metadata: { callbackUrl: validated.callbackUrl }
      });
    } catch (parseError) {
      // Provide default callback URL if none provided
      logPayment.success('init', 'No request body provided, using default callback URL', {
        userId,
        bookingId,
        metadata: { defaultCallback: true }
      });
      validated = {
        callbackUrl: `${request.nextUrl.origin}/dashboard?payment=success&booking=${bookingId}`
      };
    }

    logPayment.success('init', 'Payment initialization started', {
      userId,
      bookingId,
      metadata: { callbackUrl: validated.callbackUrl }
    });

    // STEP 1: Pre-validation outside transaction (fast operations)
    logPayment.success('init', 'Step 1: Pre-validation checks started', {
      userId,
      bookingId
    });
    
    // Get booking with all required relations
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
      logPayment.error('init', 'Booking not found for payment', new Error('Booking not found'), {
        userId,
        bookingId,
        error_code: 'BOOKING_NOT_FOUND'
      });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate booking ownership
    if (booking.clientId !== userId) {
      logPayment.error('init', 'Forbidden payment attempt', new Error('Forbidden'), {
        userId,
        bookingId,
        bookingClientId: booking.clientId,
        error_code: 'FORBIDDEN'
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate booking status - should be ACCEPTED or CONFIRMED
    if (!["CONFIRMED", "PENDING", "ACCEPTED"].includes(booking.status)) {
      logPayment.error('init', 'Invalid booking status for payment', new Error('Invalid booking status'), {
        userId,
        bookingId,
        status: booking.status,
        error_code: 'INVALID_BOOKING_STATUS'
      });
      return NextResponse.json({ 
        error: "Payment can only be made for confirmed, pending, or accepted bookings" 
      }, { status: 400 });
    }

    // Validate booking amount
    if (!booking.totalAmount || booking.totalAmount <= 0) {
      logger.warn('Invalid booking amount', { 
        bookingId, 
        userId, 
        totalAmount: booking.totalAmount 
      });
      return NextResponse.json({ error: "Invalid booking amount" }, { status: 400 });
    }

    // Validate client email
    if (!booking.client?.email) {
      logger.warn('Missing client email', { bookingId, userId });
      return NextResponse.json({ error: "Client email is required for payment" }, { status: 400 });
    }

    // Check if payment already exists
    if (booking.payment) {
      logger.warn('Payment already exists', { 
        bookingId, 
        userId, 
        existingPaymentId: booking.payment.id,
        existingStatus: booking.payment.status
      });
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
    }

    // Double-check for race conditions
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: bookingId }
    });

    if (existingPayment) {
      logger.warn('Payment already exists (race condition)', { 
        bookingId, 
        userId, 
        existingPaymentId: existingPayment.id 
      });
      return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
    }

    logger.info('Pre-validation completed successfully', { bookingId, userId });

    // STEP 2: Calculate payment breakdown
    logger.info('Step 2: Calculating payment breakdown', { bookingId, userId });
    
    const serviceAmount = booking.totalAmount;
    const breakdown = paymentProcessor.calculatePaymentBreakdown(
      serviceAmount, 
      PAYMENT_CONSTANTS.PLATFORM_FEE_PERCENTAGE
    );

    logger.info('Payment breakdown calculated', { 
      bookingId, 
      userId, 
      breakdown 
    });

    // STEP 3: Generate unique reference
    const reference = paymentProcessor.generateReference();
    logger.info('Generated payment reference', { 
      bookingId, 
      userId, 
      reference 
    });

    // STEP 4: Initialize Paystack payment (external API call)
    logger.info('Step 3: Initializing Paystack payment', { 
      bookingId, 
      userId, 
      reference 
    });
    
    const paystackResponse = await paystackClient.initializePayment({
      amount: breakdown.totalAmount,
      email: booking.client.email,
      reference: reference,
      callback_url: validated.callbackUrl,
      metadata: {
        bookingId: booking.id,
        clientId: userId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        serviceName: booking.service?.name,
      },
    });

    logger.info('Paystack payment initialized successfully', { 
      bookingId, 
      userId, 
      reference,
      authorizationUrl: paystackResponse.data.authorization_url 
    });

    // STEP 5: Create payment record in database (critical transaction)
    logger.info('Step 4: Creating payment record', { bookingId, userId, reference });
    
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
          userId: userId,
          amount: breakdown.totalAmount,
          escrowAmount: breakdown.escrowAmount,
          platformFee: breakdown.platformFee,
          currency: PAYMENT_CONSTANTS.CURRENCY,
          paystackRef: reference,
          status: "PENDING",
          authorizationUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          providerResponse: paystackResponse,
        },
      });

      // Get updated booking with payment
      const updatedBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true }
      });

      return { payment, booking: updatedBooking, paystackResponse };
    }, {
      timeout: 10000, // 10 seconds timeout for critical operations
      maxWait: 5000,  // Max wait time for transaction to start
    });

    logger.info('Database transaction completed successfully', { 
      bookingId, 
      userId, 
      reference,
      paymentId: result.payment.id 
    });

    // STEP 6: Success response
    const responseData = { 
      success: true,
      payment: {
        id: result.payment.id,
        reference: result.payment.paystackRef,
        amount: result.payment.amount,
        status: result.payment.status,
      },
      booking: {
        id: result.booking?.id,
        status: result.booking?.status,
      },
      authorizationUrl: result.paystackResponse.data.authorization_url,
      accessCode: result.paystackResponse.data.access_code,
      reference: result.payment.paystackRef,
      message: "Payment initialized successfully. Redirecting to payment gateway...",
      redirectUrl: result.paystackResponse.data.authorization_url,
    };

    logger.info('Payment initialization completed successfully', { 
      bookingId, 
      userId, 
      reference,
      authorizationUrl: result.paystackResponse.data.authorization_url 
    });

    return NextResponse.json(responseData);

  } catch (error) {
    logPayment.error('init', 'Payment initialization failed', error as Error, {
      userId,
      bookingId,
      error_code: 'PAYMENT_INIT_FAILED',
      metadata: { errorMessage: (error as Error).message }
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message.includes("Payment can only be made")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Payment already exists for this booking") {
        return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
      }
      if (error.message.includes("Paystack")) {
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
      logger.error('Transaction timeout error', error, { bookingId, userId });
      return NextResponse.json({ 
        error: "Payment processing timeout. Please try again." 
      }, { status: 408 });
    }

    // Log error details for debugging but don't expose sensitive info
    return NextResponse.json({ 
      error: "Internal server error",
      message: "Payment initialization failed. Please try again."
    }, { status: 500 });
  }
}