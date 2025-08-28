import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Only authenticated users can verify payments
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = verifyPaymentSchema.parse(body);

    const { reference } = validated;

    console.log(`🔍 Payment verification requested for reference: ${reference} by user ${user.id}`);

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { paystackRef: reference },
      include: { 
        booking: { 
          include: { 
            client: true, 
            provider: true,
            service: true 
          } 
        } 
      }
    });

    if (!payment) {
      return NextResponse.json({ 
        error: "Payment not found",
        reference 
      }, { status: 404 });
    }

    // Check if user has permission to view this payment
    if (user.role === 'CLIENT' && payment.booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === 'PROVIDER' && payment.booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify payment with Paystack
    let paystackVerification = null;
    let verificationError = null;

    try {
      console.log(`📡 Verifying payment with Paystack for reference: ${reference}`);
      paystackVerification = await paystackClient.verifyPayment(reference);
      console.log(`✅ Paystack verification successful:`, paystackVerification);
    } catch (error) {
      console.error(`❌ Paystack verification failed:`, error);
      verificationError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine if payment status should be updated based on verification
    let statusUpdate = null;
    let shouldUpdate = false;

    if (paystackVerification && paystackVerification.status) {
      const paystackStatus = paystackVerification.data.status;
      const currentStatus = payment.status;

      console.log(`📊 Status comparison: Database=${currentStatus}, Paystack=${paystackStatus}`);

      // Update payment status if there's a mismatch
      if (paystackStatus === 'success' && currentStatus === 'PENDING') {
        statusUpdate = 'HELD_IN_ESCROW';
        shouldUpdate = true;
      } else if (paystackStatus === 'failed' && currentStatus !== 'FAILED') {
        statusUpdate = 'FAILED';
        shouldUpdate = true;
      } else if (paystackStatus === 'abandoned' && currentStatus === 'PENDING') {
        statusUpdate = 'FAILED';
        shouldUpdate = true;
      }
    }

    // Update payment status if needed
    if (shouldUpdate && statusUpdate) {
      try {
        console.log(`🔄 Updating payment status from ${payment.status} to ${statusUpdate}`);
        
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: statusUpdate,
            updatedAt: new Date(),
            ...(statusUpdate === 'HELD_IN_ESCROW' && {
              paidAt: new Date(),
              transactionId: paystackVerification?.data.id?.toString() || null
            })
          }
        });

        console.log(`✅ Payment status updated successfully to ${statusUpdate}`);

        // Update booking status if payment is successful
        if (statusUpdate === 'HELD_IN_ESCROW') {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PENDING_EXECUTION' }
          });
          console.log(`✅ Booking status updated to PENDING_EXECUTION`);

          // ✅ NEW: Create notification for provider that payment is complete and they can start the job
          const booking = await prisma.booking.findUnique({
            where: { id: payment.bookingId },
            include: { 
              provider: { include: { user: true } },
              service: true 
            }
          });

          if (booking?.provider?.user) {
            // TODO: Create notification for provider when Notification table is available
            // await prisma.notification.create({
            //   data: {
            //     userId: booking.provider.user.id,
            //     type: 'PAYMENT_RECEIVED',
            //     content: `Payment received for ${booking.service?.name || 'your service'} - Booking #${booking.id}. You can now start the job!`,
            //     read: false,
            //   }
            // });
            console.log(`🔔 Provider notification would be created for user ${booking.provider.user.id} (when Notification table is available)`);
          }
        }

        // Update payment object for response
        payment.status = updatedPayment.status;
        payment.paidAt = updatedPayment.paidAt;
        payment.transactionId = updatedPayment.transactionId;
        payment.updatedAt = updatedPayment.updatedAt;

      } catch (updateError) {
        console.error(`❌ Failed to update payment status:`, updateError);
        // Continue with verification response even if update fails
      }
    }

    // Prepare response
    const response = {
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        escrowAmount: payment.escrowAmount,
        platformFee: payment.platformFee,
        currency: payment.currency,
        paystackRef: payment.paystackRef,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        scheduledDate: payment.booking.scheduledDate,
        totalAmount: payment.booking.totalAmount,
        serviceName: payment.booking.service?.name,
        clientName: payment.booking.client.name,
        providerName: payment.booking.provider.businessName || payment.booking.provider.user.name,
      },
      paystackVerification: paystackVerification ? {
        status: paystackVerification.data.status,
        amount: paystackVerification.data.amount,
        currency: paystackVerification.data.currency,
        gateway_response: paystackVerification.data.gateway_response,
        paid_at: paystackVerification.data.paid_at,
        created_at: paystackVerification.data.created_at,
      } : null,
      verificationError,
      statusUpdate: shouldUpdate ? {
        from: payment.status,
        to: statusUpdate,
        updated: shouldUpdate
      } : null,
      message: "Payment verification completed successfully"
    };

    console.log(`✅ Payment verification response prepared for reference: ${reference}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }

    if (error instanceof Error) {
      if (error.message === "Payment not found") {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for retrieving payment status without verification
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const reference = searchParams.get('reference');
    const bookingId = searchParams.get('bookingId');

    if (!reference && !bookingId) {
      return NextResponse.json({ 
        error: "Either reference or bookingId is required" 
      }, { status: 400 });
    }

    let payment;
    
    if (reference) {
      payment = await prisma.payment.findUnique({
        where: { paystackRef: reference },
        include: { 
          booking: { 
            include: { 
              client: true, 
              provider: true,
              service: true 
            } 
          } 
        }
      });
    } else if (bookingId) {
      payment = await prisma.payment.findUnique({
        where: { bookingId },
        include: { 
          booking: { 
            include: { 
              client: true, 
              provider: true,
              service: true 
            } 
          } 
        }
      });
    }

    if (!payment) {
      return NextResponse.json({ 
        error: "Payment not found",
        reference,
        bookingId
      }, { status: 404 });
    }

    // Check permissions
    if (user.role === 'CLIENT' && payment.booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === 'PROVIDER' && payment.booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        escrowAmount: payment.escrowAmount,
        platformFee: payment.platformFee,
        currency: payment.currency,
        paystackRef: payment.paystackRef,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      booking: {
        id: payment.booking.id,
        status: payment.booking.status,
        scheduledDate: payment.booking.scheduledDate,
        totalAmount: payment.booking.totalAmount,
        serviceName: payment.booking.service?.name,
        clientName: payment.booking.client.name,
        providerName: payment.booking.provider.businessName || payment.booking.provider.user.name,
      },
      message: "Payment status retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Payment status retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
