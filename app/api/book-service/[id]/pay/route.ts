import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs'
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient, paymentProcessor, PAYMENT_CONSTANTS } from "@/lib/paystack";
import { z } from "zod";
import { logPayment } from "@/lib/logger";


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

    // Get booking with simplified query (including paymentMethod)
    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        status: true,
        totalAmount: true,
        paymentMethod: true,
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

    // Check if this is a cash payment - if so, don't process here
    if (booking.paymentMethod === 'CASH') {
      // For cash payments, the payment record should already exist with CASH_PENDING status
      const existingCashPayment = await prisma.payment.findUnique({
        where: { bookingId: booking.id },
        select: {
          id: true,
          status: true,
          amount: true,
          escrowAmount: true,
          platformFee: true,
          paystackRef: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (existingCashPayment && existingCashPayment.status === 'CASH_PENDING') {
        return NextResponse.json({
          success: true,
          message: "This booking uses cash payment. Payment will be confirmed by the provider when service is completed.",
          payment: {
            id: existingCashPayment.id,
            status: existingCashPayment.status,
            amount: existingCashPayment.amount
          },
          isCashPayment: true
        });
      }

      // If payment doesn't exist yet for cash, return error
      return NextResponse.json({
        error: "Cash payment record not found. Please contact support.",
      }, { status: 400 });
    }

    // Validate booking status (only for online payments)
    if (!["CONFIRMED", "PENDING", "ACCEPTED"].includes(booking.status)) {
      return NextResponse.json({ 
        error: "Payment can only be made for confirmed, pending, or accepted bookings" 
      }, { status: 400 });
    }

    // Validate booking amount
    if (!booking.totalAmount || booking.totalAmount <= 0) {
      logPayment.error('initialize', 'Invalid booking amount', new Error('Zero or negative amount'), {
        bookingId: booking.id,
        totalAmount: booking.totalAmount,
        serviceName: booking.service?.name,
        bookingStatus: booking.status
      });
      
      // Provide more helpful error message based on booking status
      let errorMessage = "Invalid booking amount. Please contact support to resolve this issue.";
      let details = `Booking amount is R${booking.totalAmount || 0}, which is invalid for payment processing.`;
      
      if (booking.status === "PENDING") {
        errorMessage = "This booking is still pending provider acceptance. Payment can only be made after the provider accepts your booking.";
        details = "Please wait for the provider to accept your booking before making payment.";
      } else if (booking.totalAmount === 0) {
        errorMessage = "The booking amount has not been set yet. Please contact the provider to confirm the service cost.";
        details = "The provider needs to set the service cost before payment can be processed.";
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: details,
        bookingStatus: booking.status,
        totalAmount: booking.totalAmount
      }, { status: 400 });
    }

    // Validate client email
    if (!booking.client?.email) {
      return NextResponse.json({ error: "Client email is required for payment" }, { status: 400 });
    }

    // Check if payment already exists and is completed (for online payments only)
    // Note: Using only statuses that exist in the database enum
    // HELD_IN_ESCROW is treated as equivalent to ESCROW
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        bookingId: bookingId,
        status: {
          in: ['ESCROW', 'RELEASED', 'COMPLETED', 'CASH_RECEIVED', 'CASH_VERIFIED']
        }
      },
      select: {
        id: true,
        status: true,
        amount: true,
        escrowAmount: true,
        platformFee: true,
        paystackRef: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (existingPayment) {
      return NextResponse.json({ 
        error: "Payment has already been completed for this booking",
        paymentStatus: existingPayment.status
      }, { status: 400 });
    }

    // Check if there's a pending payment that can be retried
    const pendingPayment = await prisma.payment.findFirst({
      where: { 
        bookingId: bookingId,
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true,
        amount: true,
        escrowAmount: true,
        platformFee: true,
        paystackRef: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (pendingPayment) {
      // Allow retry of pending payment - update the existing record
      const paymentReference = paymentProcessor.generateReference('CS');
      const paymentBreakdown = paymentProcessor.calculatePaymentBreakdown(booking.totalAmount);
      
      // Update existing payment record
      const updatedPayment = await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          amount: paymentBreakdown.totalAmount,
          paystackRef: paymentReference,
          status: 'PENDING',
          updatedAt: new Date()
        }
      });

      // Initialize payment with Paystack
      const paystackResponse = await paystackClient.initializePayment({
        amount: paymentBreakdown.totalAmount,
        email: booking.client.email,
        reference: paymentReference,
        callback_url: validated.callbackUrl,
        metadata: {
          bookingId: booking.id,
          clientId: booking.clientId,
          providerId: booking.providerId,
          paymentId: updatedPayment.id,
          serviceName: booking.service?.name || 'Service'
        }
      });

      logPayment.success('retry', 'Payment retry initialized successfully', {
        paymentId: updatedPayment.id,
        bookingId: booking.id,
        reference: paymentReference,
        amount: paymentBreakdown.totalAmount,
        clientId: booking.clientId,
        providerId: booking.providerId
      });

      return NextResponse.json({
        success: true,
        payment: {
          id: updatedPayment.id,
          reference: paymentReference,
          amount: paymentBreakdown.totalAmount,
          status: updatedPayment.status,
          platformFee: paymentBreakdown.platformFee,
          escrowAmount: paymentBreakdown.escrowAmount,
        },
        booking: {
          id: booking.id,
          status: booking.status,
        },
        authorizationUrl: paystackResponse.data.authorization_url,
        message: "Payment retry initialized successfully. Please complete payment to confirm your booking.",
        redirectUrl: paystackResponse.data.authorization_url,
      });
    }

    // Generate unique payment reference
    const paymentReference = paymentProcessor.generateReference('CS');
    
    // Calculate payment breakdown
    const paymentBreakdown = paymentProcessor.calculatePaymentBreakdown(booking.totalAmount);
    
    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: paymentBreakdown.totalAmount,
        escrowAmount: paymentBreakdown.escrowAmount,
        platformFee: paymentBreakdown.platformFee,
        paystackRef: paymentReference,
        status: 'PENDING',
        currency: 'ZAR',
      }
    });

    // Initialize payment with Paystack
    console.log('🔄 Initializing Paystack payment...', {
      bookingId: booking.id,
      amount: paymentBreakdown.totalAmount,
      email: booking.client.email,
      reference: paymentReference
    });

    const paystackResponse = await paystackClient.initializePayment({
      amount: paymentBreakdown.totalAmount,
      email: booking.client.email,
      reference: paymentReference,
      callback_url: validated.callbackUrl,
      metadata: {
        bookingId: booking.id,
        clientId: booking.clientId,
        providerId: booking.providerId,
        paymentId: payment.id,
        serviceName: booking.service?.name || 'Service'
      }
    });
    
    console.log('✅ Paystack payment initialized successfully', {
      reference: paymentReference,
      authorizationUrl: paystackResponse.data.authorization_url
    });

    logPayment.success('initialize', 'Payment initialized successfully', {
      paymentId: payment.id,
      bookingId: booking.id,
      reference: paymentReference,
      amount: paymentBreakdown.totalAmount,
      clientId: booking.clientId,
      providerId: booking.providerId
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        reference: paymentReference,
        amount: paymentBreakdown.totalAmount,
        status: payment.status,
        platformFee: paymentBreakdown.platformFee,
        escrowAmount: paymentBreakdown.escrowAmount,
      },
      booking: {
        id: booking.id,
        status: booking.status,
      },
      authorizationUrl: paystackResponse.data.authorization_url,
      message: "Payment initialized successfully. Please complete payment to confirm your booking.",
      redirectUrl: paystackResponse.data.authorization_url,
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