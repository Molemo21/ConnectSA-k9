import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

export const dynamic = 'force-dynamic'

/**
 * Sync Booking and Payment Status
 * 
 * This endpoint fixes inconsistencies between booking status and payment status.
 * 
 * Common issues:
 * - Payment is PROCESSING_RELEASE but booking is PENDING_EXECUTION (should be AWAITING_CONFIRMATION)
 * - Payment is RELEASED but booking is not COMPLETED
 * - Other status mismatches
 */
export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/sync-status/);
    const bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Get booking with payment and provider bank details
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        client: { select: { id: true } },
        provider: { 
          select: { 
            id: true,
            bankCode: true,
            accountNumber: true,
            accountName: true
          } 
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user has access to this booking
    if (user.role === 'CLIENT' && booking.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === 'PROVIDER' && booking.providerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!booking.payment) {
      return NextResponse.json({ 
        success: true, 
        message: "No payment found for this booking",
        booking: { id: booking.id, status: booking.status },
        payment: null
      });
    }

    let bookingUpdated = false;
    let paymentUpdated = false;
    let newBookingStatus = booking.status;
    let newPaymentStatus = booking.payment.status;

    // Log current state for debugging
    console.log(`🔍 Sync check for booking ${bookingId}:`, {
      bookingStatus: booking.status,
      paymentStatus: booking.payment.status,
      paymentUpdatedAt: booking.payment.updatedAt,
      hasProvider: !!booking.provider,
      providerId: booking.provider?.id,
      providerBankCode: booking.provider?.bankCode,
      nodeEnv: process.env.NODE_ENV,
      paystackTestMode: process.env.PAYSTACK_TEST_MODE
    });

    // Fix: Payment is PROCESSING_RELEASE but booking is PENDING_EXECUTION
    // This means the client confirmed completion, so booking should be AWAITING_CONFIRMATION
    if (booking.payment.status === 'PROCESSING_RELEASE' && booking.status === 'PENDING_EXECUTION') {
      console.log(`⚠️ Inconsistency detected: Payment is PROCESSING_RELEASE but booking is PENDING_EXECUTION`);
      await db.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'AWAITING_CONFIRMATION',
          updatedAt: new Date()
        }
      });
      bookingUpdated = true;
      newBookingStatus = 'AWAITING_CONFIRMATION';
      console.log(`✅ Fixed sync: Updated booking ${bookingId} from PENDING_EXECUTION to AWAITING_CONFIRMATION (payment is PROCESSING_RELEASE)`);
    }

    // Fix: Payment is PROCESSING_RELEASE and booking is AWAITING_CONFIRMATION (correct state)
    // IMMEDIATELY check for invalid bank codes (no time threshold - this is a validation issue)
    if (booking.payment.status === 'PROCESSING_RELEASE' && booking.status === 'AWAITING_CONFIRMATION') {
      console.log(`🔍 Checking for invalid bank code for booking ${bookingId}...`, {
        hasProvider: !!booking.provider,
        hasBankCode: !!booking.provider?.bankCode,
        bankCode: booking.provider?.bankCode,
        providerId: booking.provider?.id
      });
      
      // First, check if bank code is invalid (immediate check, no time threshold)
      if (booking.provider?.bankCode) {
        try {
          const { PaystackClient } = await import('@/lib/paystack');
          const paystackClient = PaystackClient.getInstance();
          
          const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
          console.log(`🔍 Bank code validation mode:`, { isTestMode, nodeEnv: process.env.NODE_ENV, testModeFlag: process.env.PAYSTACK_TEST_MODE });
          
          if (!isTestMode) {
            console.log(`🔍 Validating bank code "${booking.provider.bankCode}" with Paystack...`);
            const isValidBankCode = await paystackClient.validateBankCode(
              booking.provider.bankCode,
              'ZA'
            );
            
            console.log(`🔍 Bank code validation result:`, { 
              bankCode: booking.provider.bankCode, 
              isValid: isValidBankCode 
            });
            
            if (!isValidBankCode) {
              console.log(`❌ Invalid bank code detected: ${booking.provider.bankCode} - This is likely why payment is stuck`);
              
              // Rollback payment to ESCROW immediately since bank code is invalid
              await db.payment.update({
                where: { id: booking.payment.id },
                data: {
                  status: 'ESCROW',
                  updatedAt: new Date()
                }
              });
              
              paymentUpdated = true;
              newPaymentStatus = 'ESCROW';
              console.log(`✅ Rolled back payment ${booking.payment.id} to ESCROW due to invalid bank code`);
              
              // Get updated booking data for response
              const updatedBooking = await db.booking.findUnique({
                where: { id: bookingId },
                include: {
                  payment: true,
                  service: {
                    select: {
                      name: true,
                      category: true
                    }
                  },
                  provider: {
                    select: {
                      id: true,
                      businessName: true,
                      user: {
                        select: {
                          name: true,
                          email: true,
                          phone: true
                        }
                      }
                    }
                  }
                }
              });
              
              return NextResponse.json({
                success: true,
                message: "Payment rolled back to escrow due to invalid bank code. Provider needs to update their bank details.",
                synced: true,
                issueFound: "invalid_bank_code",
                issueDetails: `The provider's bank code "${booking.provider.bankCode}" is not valid. Payment has been rolled back to escrow.`,
                booking: {
                  id: updatedBooking?.id,
                  status: updatedBooking?.status,
                  scheduledDate: updatedBooking?.scheduledDate,
                  totalAmount: updatedBooking?.totalAmount,
                  address: updatedBooking?.address,
                  description: updatedBooking?.description,
                  createdAt: updatedBooking?.createdAt,
                  updatedAt: updatedBooking?.updatedAt
                },
                payment: updatedBooking?.payment ? {
                  id: updatedBooking.payment.id,
                  amount: updatedBooking.payment.amount,
                  status: updatedBooking.payment.status,
                  paystackRef: updatedBooking.payment.paystackRef,
                  paidAt: updatedBooking.payment.paidAt,
                  createdAt: updatedBooking.payment.createdAt,
                  updatedAt: updatedBooking.payment.updatedAt
                } : null,
                provider: updatedBooking?.provider,
                service: updatedBooking?.service
              });
            } else {
              console.log(`✅ Bank code "${booking.provider.bankCode}" is valid - continuing with transfer verification`);
            }
          } else {
            console.log(`⚠️ Skipping bank code validation - running in test mode`);
          }
        } catch (bankValidationError) {
          console.error('❌ Failed to validate bank code during sync:', bankValidationError);
          // Continue with transfer verification below
        }
      } else {
        console.log(`⚠️ No bank code found for provider ${booking.provider?.id} - cannot validate`);
      }
      
      // If bank code is valid, check if payment has been stuck for >5 minutes and verify transfer
      const paymentUpdatedAt = booking.payment.updatedAt || booking.payment.createdAt;
      if (paymentUpdatedAt) {
        const now = new Date();
        const statusTime = new Date(paymentUpdatedAt);
        const minutesDiff = (now.getTime() - statusTime.getTime()) / (1000 * 60);
        
        // If payment has been stuck for more than 5 minutes, verify with Paystack
        if (minutesDiff > 5) {
          console.log(`⚠️ Payment ${booking.payment.id} has been in PROCESSING_RELEASE for ${minutesDiff.toFixed(2)} minutes. Verifying with Paystack...`);
          
          try {
            // Import Paystack client dynamically to avoid circular dependencies
            const { PaystackClient } = await import('@/lib/paystack');
            const paystackClient = PaystackClient.getInstance();
            
            // Check if payment has a transfer code
            if (booking.payment.transactionId) {
              const transferResponse = await paystackClient.verifyTransfer(booking.payment.transactionId);
              const transferStatus = transferResponse.data.status;
              
              console.log(`🔍 Transfer status for ${booking.payment.transactionId}: ${transferStatus}`);
              
              if (transferStatus === 'success') {
                // Transfer completed - update to RELEASED and COMPLETED
                await db.payment.update({
                  where: { id: booking.payment.id },
                  data: {
                    status: 'RELEASED',
                    updatedAt: new Date()
                  }
                });
                
                await db.booking.update({
                  where: { id: bookingId },
                  data: {
                    status: 'COMPLETED',
                    updatedAt: new Date()
                  }
                });
                
                paymentUpdated = true;
                bookingUpdated = true;
                newPaymentStatus = 'RELEASED';
                newBookingStatus = 'COMPLETED';
                console.log(`✅ Transfer verified as successful - Payment ${booking.payment.id} updated to RELEASED, booking to COMPLETED`);
              } else if (transferStatus === 'failed' || transferStatus === 'reversed') {
                // Transfer failed - rollback to ESCROW
                await db.payment.update({
                  where: { id: booking.payment.id },
                  data: {
                    status: 'ESCROW',
                    updatedAt: new Date()
                  }
                });
                
                paymentUpdated = true;
                newPaymentStatus = 'ESCROW';
                console.log(`⚠️ Transfer verified as failed - Payment ${booking.payment.id} rolled back to ESCROW`);
              } else {
                // Transfer still pending
                console.log(`⏳ Transfer still pending: ${transferStatus}`);
              }
            } else {
              console.log(`⚠️ Payment ${booking.payment.id} has no transfer code. Cannot verify transfer status.`);
            }
          } catch (verifyError) {
            console.error('Failed to verify transfer with Paystack:', verifyError);
            // Don't fail the sync - just log the error
            // The user can use the "Retry Release" button to manually verify
          }
        }
      }
    }

    // Fix: Payment is RELEASED but booking is not COMPLETED
    if (booking.payment.status === 'RELEASED' && booking.status !== 'COMPLETED') {
      await db.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
      bookingUpdated = true;
      newBookingStatus = 'COMPLETED';
      console.log(`✅ Fixed sync: Updated booking ${bookingId} to COMPLETED (payment is RELEASED)`);
    }

    // Fix: Payment is COMPLETED but booking is not COMPLETED
    if (booking.payment.status === 'COMPLETED' && booking.status !== 'COMPLETED') {
      await db.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
      bookingUpdated = true;
      newBookingStatus = 'COMPLETED';
      console.log(`✅ Fixed sync: Updated booking ${bookingId} to COMPLETED (payment is COMPLETED)`);
    }

    // Get updated booking data
    const updatedBooking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        service: {
          select: {
            name: true,
            category: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Log final state
    if (bookingUpdated) {
      console.log(`✅ Sync completed for booking ${bookingId}:`, {
        oldStatus: booking.status,
        newStatus: newBookingStatus,
        paymentStatus: booking.payment.status
      });
    } else {
      console.log(`ℹ️ No sync needed for booking ${bookingId}:`, {
        bookingStatus: booking.status,
        paymentStatus: booking.payment.status
      });
    }

    return NextResponse.json({
      success: true,
      message: bookingUpdated 
        ? "Booking status synchronized successfully" 
        : "Booking and payment statuses are already in sync",
      synced: bookingUpdated || paymentUpdated,
      booking: {
        id: updatedBooking?.id,
        status: updatedBooking?.status,
        scheduledDate: updatedBooking?.scheduledDate,
        totalAmount: updatedBooking?.totalAmount,
        address: updatedBooking?.address,
        description: updatedBooking?.description,
        createdAt: updatedBooking?.createdAt,
        updatedAt: updatedBooking?.updatedAt
      },
      payment: updatedBooking?.payment ? {
        id: updatedBooking.payment.id,
        amount: updatedBooking.payment.amount,
        status: updatedBooking.payment.status,
        paystackRef: updatedBooking.payment.paystackRef,
        paidAt: updatedBooking.payment.paidAt,
        createdAt: updatedBooking.payment.createdAt,
        updatedAt: updatedBooking.payment.updatedAt
      } : null,
      provider: updatedBooking?.provider,
      service: updatedBooking?.service
    });

  } catch (error) {
    console.error('Error syncing booking status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to sync booking status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
