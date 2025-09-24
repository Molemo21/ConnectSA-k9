import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient } from "@/lib/paystack";

export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      success: false,
      message: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  console.log('🚀 POST /api/payment/recover-status called');
  console.log('🚀 Request URL:', request.url);
  console.log('🚀 Request method:', request.method);
  console.log('🚀 Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    console.log('🔐 Getting current user...');
    const user = await getCurrentUser();
    console.log('🔐 Current user:', user ? { id: user.id, role: user.role } : 'null');
    
    if (!user) {
      console.log('❌ No user found, returning 401');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('📝 Parsing request body...');
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { paymentId } = body;

    if (!paymentId) {
      console.log('❌ No payment ID provided, returning 400');
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }

    console.log(`🔄 Manual payment status recovery requested for payment: ${paymentId}`);

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { 
        booking: { 
          include: { 
            client: true, 
            provider: true 
          } 
        } 
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if user has permission to recover this payment
    if (user.role === "CLIENT" && payment.booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PROVIDER" && payment.booking.providerId !== user.provider?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`🔍 Payment details:`, {
      id: payment.id,
      status: payment.status,
      paystackRef: payment.paystackRef,
      amount: payment.amount,
      bookingId: payment.bookingId
    });

    // Only attempt recovery for PENDING payments
    if (payment.status !== "PENDING") {
      return NextResponse.json({ 
        message: `Payment status is already ${payment.status}. No recovery needed.`,
        currentStatus: payment.status
      });
    }

    // Verify payment with Paystack
    console.log(`🔍 Verifying payment with Paystack using reference: ${payment.paystackRef}`);
    
    try {
      const paystackVerification = await paystackClient.verifyPayment(payment.paystackRef);
      console.log(`🔍 Paystack verification result:`, paystackVerification);
      
      if (paystackVerification.status && paystackVerification.data.status === 'success') {
        console.log(`✅ Paystack verification successful. Payment was completed.`);
        
        // Update payment status to ESCROW
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: { 
            status: 'ESCROW',
            paidAt: new Date(),
            transactionId: paystackVerification.data.id?.toString() || null,
            updatedAt: new Date()
          }
        });

        // Update booking status to PENDING_EXECUTION if it's still CONFIRMED
        let updatedBooking = null;
        if (payment.booking.status === "CONFIRMED") {
          updatedBooking = await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'PENDING_EXECUTION' }
          });
          console.log(`✅ Booking status updated to PENDING_EXECUTION`);
        }

        console.log(`🎉 Payment status recovery completed successfully!`);
        
        return NextResponse.json({
          success: true,
          message: "Payment status recovered successfully",
          payment: {
            id: updatedPayment.id,
            status: updatedPayment.status,
            paidAt: updatedPayment.paidAt,
            transactionId: updatedPayment.transactionId
          },
          booking: updatedBooking ? {
            id: updatedBooking.id,
            status: updatedBooking.status
          } : null,
          paystackVerification: {
            status: paystackVerification.data.status,
            amount: paystackVerification.data.amount,
            currency: paystackVerification.data.currency
          }
        });

      } else {
        console.log(`❌ Paystack verification shows payment was not successful:`, paystackVerification.data.status);
        
        return NextResponse.json({
          success: false,
          message: `Payment verification failed. Paystack status: ${paystackVerification.data.status}`,
          paystackStatus: paystackVerification.data.status,
          error: "Payment was not completed on Paystack"
        }, { status: 400 });
      }
      
    } catch (verificationError) {
      console.error(`❌ Paystack verification failed:`, verificationError);
      
      // Handle specific Paystack API errors
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      
      if (verificationError instanceof Error) {
        errorMessage = verificationError.message;
        
        // Check for specific Paystack error patterns
        if (errorMessage.includes('Transaction reference not found')) {
          errorMessage = 'Payment reference not found on Paystack. This payment may have been cancelled or never completed.';
          errorDetails = 'The payment reference provided does not exist in Paystack\'s system.';
        } else if (errorMessage.includes('ZodError')) {
          errorMessage = 'Payment verification response format error. Payment may still be valid.';
          errorDetails = 'Paystack returned the payment data but in an unexpected format.';
          
          // For schema errors, we can try a fallback recovery since the payment might actually be successful
          console.log(`🔄 Attempting fallback recovery for schema validation error...`);
          
          try {
            // Try to get the raw response from Paystack to check if payment was actually successful
            const rawResponse = await fetch(`${process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co'}/transaction/verify/${payment.paystackRef}`, {
              headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (rawResponse.ok) {
              const rawData = await rawResponse.json();
              console.log(`🔍 Raw Paystack response:`, rawData);
              
              // Check if the payment was actually successful despite schema issues
              if (rawData.status && rawData.data && rawData.data.status === 'success') {
                console.log(`✅ Fallback recovery successful! Payment was completed despite schema issues.`);
                
                // Update payment status to ESCROW
                const updatedPayment = await prisma.payment.update({
                  where: { id: paymentId },
                  data: { 
                    status: 'ESCROW',
                    paidAt: new Date(),
                    transactionId: rawData.data.id?.toString() || null,
                    updatedAt: new Date()
                  }
                });

                // Update booking status to PENDING_EXECUTION if it's still CONFIRMED
                let updatedBooking = null;
                if (payment.booking.status === "CONFIRMED") {
                  updatedBooking = await prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'PENDING_EXECUTION' }
                  });
                  console.log(`✅ Booking status updated to PENDING_EXECUTION via fallback`);
                }

                console.log(`🎉 Fallback payment status recovery completed successfully!`);
                
                return NextResponse.json({
                  success: true,
                  message: "Payment status recovered successfully via fallback method",
                  recoveryMethod: "fallback",
                  payment: {
                    id: updatedPayment.id,
                    status: updatedPayment.status,
                    paidAt: updatedPayment.paidAt,
                    transactionId: updatedPayment.transactionId
                  },
                  booking: updatedBooking ? {
                    id: updatedBooking.id,
                    status: updatedBooking.status
                  } : null,
                  paystackVerification: {
                    status: rawData.data.status,
                    amount: rawData.data.amount,
                    currency: rawData.data.currency
                  }
                });
              }
            }
          } catch (fallbackError) {
            console.error(`❌ Fallback recovery also failed:`, fallbackError);
          }
        }
      }
      
      return NextResponse.json({
        success: false,
        message: "Failed to verify payment with Paystack",
        error: errorMessage,
        details: errorDetails,
        paystackRef: payment.paystackRef
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Payment status recovery error:', error);
    
    return NextResponse.json({
      success: false,
      message: "Payment status recovery failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
