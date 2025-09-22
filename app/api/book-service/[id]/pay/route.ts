import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient, paymentProcessor, PAYMENT_CONSTANTS } from "@/lib/paystack";
import { z } from "zod";

const paymentSchema = z.object({
  callbackUrl: z.string().url("Valid callback URL is required"),
});

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

export async function POST(request: NextRequest) {
  const logger = createLogger('PaymentInitialize');
  
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
      logger.warn('Unauthorized payment attempt', { 
        userId: user?.id, 
        role: user?.role 
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;

    // Extract booking ID from URL
    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/pay/);
    bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      logger.warn('Invalid booking ID in URL', { pathname, userId });
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Parse and validate request body
    let validated;
    try {
      const body = await request.json();
      validated = paymentSchema.parse(body);
      logger.info('Using provided callback URL', { 
        bookingId, 
        userId, 
        callbackUrl: validated.callbackUrl 
      });
    } catch (parseError) {
      // Provide default callback URL if none provided
      logger.info('No request body provided, using default callback URL', { bookingId, userId });
      validated = {
        callbackUrl: `${request.nextUrl.origin}/dashboard?payment=success&booking=${bookingId}`
      };
    }

    logger.info('Payment initialization started', { bookingId, userId });

    // STEP 1: Pre-validation outside transaction (fast operations)
    logger.info('Step 1: Pre-validation checks', { bookingId, userId });
    
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
      logger.warn('Booking not found', { bookingId, userId });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Validate booking ownership
    if (booking.clientId !== userId) {
      logger.warn('Forbidden payment attempt', { 
        bookingId, 
        userId, 
        bookingClientId: booking.clientId 
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate booking status - should be ACCEPTED or CONFIRMED
    if (!["CONFIRMED", "PENDING", "ACCEPTED"].includes(booking.status)) {
      logger.warn('Invalid booking status for payment', { 
        bookingId, 
        userId, 
        status: booking.status 
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
    logger.error('Payment initialization failed', error, { 
      bookingId, 
      userId 
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