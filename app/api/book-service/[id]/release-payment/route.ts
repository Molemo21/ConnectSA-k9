import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackClient, paymentProcessor } from "@/lib/paystack";
import { logPayment } from "@/lib/logger";

export const dynamic = 'force-dynamic'


// Types for better type safety
interface TransferRecipientData {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
}

interface TransferData {
  source: 'balance';
  amount: number;
  recipient: string;
  reason: string;
  reference: string;
}

export async function POST(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      success: false,
      message: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const startTime = Date.now();
  
  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
  
  try {
    // 1. Authentication and authorization
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract booking ID from URL
    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)\/release-payment/);
    const bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    console.log(`🚀 Starting payment release for booking: ${bookingId}`);

    // 3. Main transaction: Validate and prepare payment release
    const transactionStartTime = Date.now();
    const result = await prisma.$transaction(async (tx) => {
      console.log(`🔍 Fetching booking data for ${bookingId}...`);
      
      // Get booking with all necessary relations
      const queryStartTime = Date.now();
      const booking = await tx.booking.findUnique({ 
        where: { id: bookingId },
        include: { 
          payment: true,
          provider: {
            select: {
              id: true,
              userId: true,
              businessName: true,
              bankName: true,
              bankCode: true,
              accountNumber: true,
              accountName: true,
              recipientCode: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          service: true
        }
      });
      
      const queryTime = Date.now() - queryStartTime;
      console.log(`🔍 Database query completed in ${queryTime}ms`);
      
      if (!booking) {
        throw new Error("Booking not found");
      }

      // 4. Authorization checks
      if (booking.clientId !== user.id) {
        throw new Error("Forbidden: You can only release payments for your own bookings");
      }

      if (!booking.payment) {
        throw new Error("No payment found for this booking");
      }

      if (!booking.provider) {
        throw new Error("Provider not found for this booking");
      }

      // 5. Payment status validation and recovery
      console.log(`🔍 Payment status validation for booking ${bookingId}:`, {
        paymentId: booking.payment.id,
        currentStatus: booking.payment.status,
        expectedStatus: "ESCROW",
        bookingStatus: booking.status,
        amount: booking.payment.escrowAmount
      });

      // Handle payment status recovery for stuck payments
      if (booking.payment.status === "PENDING") {
        console.log(`⚠️ Payment ${booking.payment.id} is stuck in PENDING status. Attempting status recovery...`);
        
        try {
          // Verify payment with Paystack to check actual status
          const paystackVerification = await paystackClient.verifyPayment(booking.payment.paystackRef);
          console.log(`🔍 Paystack verification result:`, paystackVerification);
          
          if (paystackVerification.status && paystackVerification.data.status === 'success') {
            console.log(`✅ Paystack verification shows payment was successful. Updating status to ESCROW...`);
            
            // Update payment status to ESCROW since Paystack confirms it was successful
            await tx.payment.update({
              where: { id: booking.payment.id },
              data: { 
                status: 'ESCROW',
                paidAt: new Date(),
                transactionId: paystackVerification.data.id?.toString() || null,
                updatedAt: new Date()
              }
            });
            
            console.log(`✅ Payment status updated to ESCROW via recovery`);
            
            // Update the local payment object for further processing
            booking.payment.status = 'ESCROW';
            booking.payment.paidAt = new Date();
            
          } else {
            console.log(`❌ Paystack verification shows payment was not successful:`, paystackVerification.data.status);
            throw new Error(`Payment verification failed. Paystack status: ${paystackVerification.data.status}`);
          }
          
        } catch (verificationError) {
          console.error(`❌ Payment verification failed during recovery:`, verificationError);
          throw new Error(`Payment verification failed: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
        }
      }

      if (booking.payment.status !== "ESCROW") {
        const errorMessages = {
          "HELD_IN_ESCROW": "Payment is held in escrow but not ready for release. Please contact support.",
          "PROCESSING_RELEASE": "Payment is already being processed for release. Please wait.",
          "RELEASED": "Payment has already been released to the provider.",
          "REFUNDED": "Payment has been refunded and cannot be released.",
          "FAILED": "Payment failed and cannot be released."
        };
        
        const errorMessage = errorMessages[booking.payment.status as keyof typeof errorMessages] || 
                           `Payment status '${booking.payment.status}' is not valid for release. Expected: ESCROW`;
        
        throw new Error(errorMessage);
      }

      // 6. Booking status validation
      if (booking.status !== "AWAITING_CONFIRMATION") {
        throw new Error(`Job is not awaiting confirmation. Current status: ${booking.status}`);
      }

      // 7. Generate unique reference for payout
      const payoutReference = paymentProcessor.generateReference("PO");
      console.log(`💰 Generated payout reference: ${payoutReference}`);

      // 8. Check if payout already exists for this payment
      const existingPayout = await tx.payout.findUnique({
        where: { paymentId: booking.payment.id }
      });

      if (existingPayout) {
        console.log(`⚠️ Payout already exists for payment ${booking.payment.id}:`, {
          payoutId: existingPayout.id,
          status: existingPayout.status,
          amount: existingPayout.amount
        });

        // If payout is already completed, we can't proceed
        if (existingPayout.status === 'COMPLETED') {
          throw new Error(`Payment has already been released to provider. Payout ID: ${existingPayout.id}`);
        }

        // If payout is pending or processing, we can continue with the existing one
        if (['PENDING', 'PROCESSING'].includes(existingPayout.status)) {
          console.log(`✅ Using existing payout ${existingPayout.id} with status: ${existingPayout.status}`);
          
          // Update existing payout with new reference if needed
          if (!existingPayout.paystackRef) {
            await tx.payout.update({
              where: { id: existingPayout.id },
              data: { paystackRef: payoutReference }
            });
            console.log(`✅ Updated existing payout with new reference: ${payoutReference}`);
          }
          
          // Continue with existing payout
          const payout = existingPayout;
          
          // Update payment status to indicate payout is being processed
          const paymentUpdateStartTime = Date.now();
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "PROCESSING_RELEASE" }
          });
          const paymentUpdateTime = Date.now() - paymentUpdateStartTime;
          console.log(`💳 Payment status updated to PROCESSING_RELEASE in ${paymentUpdateTime}ms`);

          // Update booking status to indicate payment is being released
          const bookingUpdateStartTime = Date.now();
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "PAYMENT_PROCESSING" }
          });
          const bookingUpdateTime = Date.now() - bookingUpdateStartTime;
          console.log(`📋 Booking status updated to PAYMENT_PROCESSING in ${bookingUpdateTime}ms`);

          const totalTransactionTime = Date.now() - transactionStartTime;
          console.log(`⏱️ Total database transaction time: ${totalTransactionTime}ms`);

          return { 
            booking, 
            payment: booking.payment, 
            payout,
            provider: booking.provider 
          };
        }
        
        // If payout is FAILED, we can retry by updating the existing one
        if (existingPayout.status === 'FAILED') {
          console.log(`🔄 Retrying failed payout ${existingPayout.id} with new reference: ${payoutReference}`);
          
          // Update the failed payout to retry
          const updatedPayout = await tx.payout.update({
            where: { id: existingPayout.id },
            data: { 
              paystackRef: payoutReference,
              status: "PENDING" // Reset to PENDING to retry
            }
          });
          
          console.log(`✅ Updated failed payout to retry: ${updatedPayout.id}`);
          
          // Continue with updated payout
          const payout = updatedPayout;
          
          // Update payment status to indicate payout is being processed
          const paymentUpdateStartTime = Date.now();
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "PROCESSING_RELEASE" }
          });
          const paymentUpdateTime = Date.now() - paymentUpdateStartTime;
          console.log(`💳 Payment status updated to PROCESSING_RELEASE in ${paymentUpdateTime}ms`);

          // Update booking status to indicate payment is being released
          const bookingUpdateStartTime = Date.now();
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "PAYMENT_PROCESSING" }
          });
          const bookingUpdateTime = Date.now() - bookingUpdateStartTime;
          console.log(`📋 Booking status updated to PAYMENT_PROCESSING in ${bookingUpdateTime}ms`);

          const totalTransactionTime = Date.now() - transactionStartTime;
          console.log(`⏱️ Total database transaction time: ${totalTransactionTime}ms`);

          return { 
            booking, 
            payment: booking.payment, 
            payout,
            provider: booking.provider 
          };
        }
      }

      // 9. Create payout record (only if none exists)
      const payoutStartTime = Date.now();
      const payout = await tx.payout.create({
        data: {
          paymentId: booking.payment.id,
          providerId: booking.provider.id,
          amount: booking.payment.escrowAmount,
          paystackRef: payoutReference,
          status: "PENDING",
        },
      });
      const payoutTime = Date.now() - payoutStartTime;
      console.log(`💰 Payout record created in ${payoutTime}ms`);

      // 10. Update payment status to indicate payout is being processed
      const paymentUpdateStartTime = Date.now();
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "PROCESSING_RELEASE" }
      });
      const paymentUpdateTime = Date.now() - paymentUpdateStartTime;
      console.log(`💳 Payment status updated to PROCESSING_RELEASE in ${paymentUpdateTime}ms`);

      // 11. Update booking status to indicate payment is being released
      const bookingUpdateStartTime = Date.now();
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAYMENT_PROCESSING" }
      });
      const bookingUpdateTime = Date.now() - bookingUpdateStartTime;
      console.log(`📋 Booking status updated to PAYMENT_PROCESSING in ${bookingUpdateTime}ms`);

      const totalTransactionTime = Date.now() - transactionStartTime;
      console.log(`⏱️ Total database transaction time: ${totalTransactionTime}ms`);

      return { 
        booking, 
        payment: booking.payment, 
        payout,
        provider: booking.provider 
      };
    }, {
      timeout: 30000, // 30 seconds timeout
      maxWait: 10000  // 10 seconds max wait for connection
    });

    // 12. Paystack transfer processing (outside transaction for better error handling)
    console.log(`🔄 Processing Paystack transfer for payout: ${result.payout.id}`);
    
    try {
      // 13. Check if provider has recipient_code, create if missing
      let recipientCode = result.provider.recipientCode;
      
      if (!recipientCode) {
        console.log(`📋 Provider ${result.provider.id} has no recipient_code, creating new recipient...`);
        
        // Check if provider has bank details
        if (!result.provider.bankCode || !result.provider.accountNumber || !result.provider.accountName) {
          console.log(`❌ Provider ${result.provider.id} bank details incomplete:`, {
            bankCode: result.provider.bankCode,
            accountNumber: result.provider.accountNumber ? '***' + result.provider.accountNumber.slice(-4) : 'missing',
            accountName: result.provider.accountName,
            bankName: result.provider.bankName
          });
          
          logPayment.error('escrow_release', 'Provider bank details incomplete', new Error('Bank details missing'), {
            userId: user.id,
            bookingId: bookingId,
            paymentId: result.payment.id,
            providerId: result.provider.id,
            error_code: 'INCOMPLETE_BANK_DETAILS',
            metadata: {
              bankCode: !!result.provider.bankCode,
              accountNumber: !!result.provider.accountNumber,
              accountName: !!result.provider.accountName,
              bankName: result.provider.bankName
            }
          });
          
          throw new Error("Provider has not set up their bank account details yet. Please ask the provider to add their bank information in their dashboard, or contact support for assistance.");
        }

      // Create Paystack transfer recipient
      const recipientData: TransferRecipientData = {
        type: 'nuban',
        name: result.provider.accountName,
        account_number: result.provider.accountNumber,
        bank_code: result.provider.bankCode
      };

      logPayment.success('escrow_release', 'Creating Paystack transfer recipient', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: {
          bank: result.provider.bankName,
          accountNumber: result.provider.accountNumber,
          accountName: result.provider.accountName,
          isTestMode
        }
      });

      let recipientResponse;
      
      if (isTestMode) {
        console.log(`🧪 Test mode detected - simulating recipient creation`);
        // In test mode, simulate recipient creation
        recipientResponse = {
          status: true,
          data: {
            recipient_code: `TEST_RECIPIENT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            type: 'nuban',
            name: result.provider.accountName,
            account_number: result.provider.accountNumber,
            bank_code: result.provider.bankCode
          },
          message: 'Recipient simulated successfully in test mode'
        };
        
        logPayment.success('escrow_release', 'Recipient simulated in test mode', {
          userId: user.id,
          bookingId: bookingId,
          paymentId: result.payment.id,
          providerId: result.provider.id,
          metadata: {
            recipientCode: recipientResponse.data.recipient_code,
            mode: 'TEST'
          }
        });
      } else {
        // In production mode, make real API call
        recipientResponse = await paystackClient.createRecipient(recipientData);
      }
      
      if (!recipientResponse.data?.recipient_code) {
        logPayment.error('escrow_release', 'Failed to create transfer recipient', new Error('Paystack response invalid'), {
          userId: user.id,
          bookingId: bookingId,
          paymentId: result.payment.id,
          providerId: result.provider.id,
          error_code: 'RECIPIENT_CREATION_FAILED',
          metadata: { paystackResponse: recipientResponse }
        });
        throw new Error("Failed to create transfer recipient. Paystack response invalid.");
      }

      recipientCode = recipientResponse.data.recipient_code;
      
      logPayment.success('escrow_release', 'Transfer recipient created successfully', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: { recipientCode }
      });

      // Store recipient_code in provider record
      await prisma.provider.update({
        where: { id: result.provider.id },
        data: { recipientCode }
      });
      
      logPayment.success('escrow_release', 'Recipient code stored in provider record', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: { recipientCode }
      });
      } else {
        console.log(`✅ Using existing recipient_code: ${recipientCode}`);
        
        // In test mode, we still need to simulate the recipient for logging
        if (isTestMode) {
          logPayment.success('escrow_release', 'Using existing recipient in test mode', {
            userId: user.id,
            bookingId: bookingId,
            paymentId: result.payment.id,
            providerId: result.provider.id,
            metadata: {
              recipientCode,
              mode: 'TEST'
            }
          });
        }
      }

      // 14. Create transfer to provider
      const transferData: TransferData = {
        source: 'balance',
        amount: result.payment.escrowAmount,
        recipient: recipientCode,
        reason: `Payment for ${result.booking.service?.name || 'service'} - Booking ${result.booking.id}`,
        reference: result.payout.paystackRef,
      };

      console.log(`💸 Initiating Paystack transfer:`, {
        amount: result.payment.escrowAmount,
        recipient: recipientCode,
        reason: transferData.reason,
        reference: transferData.reference
      });

      // Create real Paystack transfer
      logPayment.success('escrow_release', 'Initiating Paystack transfer', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: {
          amount: result.payment.escrowAmount,
          recipient: recipientCode,
          reason: transferData.reason,
          reference: transferData.reference,
          isTestMode
        }
      });

      let transferResponse;
      
      if (isTestMode) {
        console.log(`🧪 Test mode detected - simulating successful transfer`);
        // In test mode, simulate a successful transfer
        transferResponse = {
          status: true,
          data: {
            transfer_code: `TEST_TRANSFER_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            amount: transferData.amount,
            status: 'success',
            reference: transferData.reference,
            recipient: recipientCode
          },
          message: 'Transfer simulated successfully in test mode'
        };
        
        logPayment.success('escrow_release', 'Transfer simulated in test mode', {
          userId: user.id,
          bookingId: bookingId,
          paymentId: result.payment.id,
          providerId: result.provider.id,
          metadata: {
            transferCode: transferResponse.data.transfer_code,
            amount: transferResponse.data.amount,
            status: transferResponse.data.status,
            mode: 'TEST'
          }
        });
      } else {
        // In production mode, make real API call
        transferResponse = await paystackClient.createTransfer(transferData);
      }
      
      if (!transferResponse.data?.transfer_code) {
        logPayment.error('escrow_release', 'Failed to create transfer', new Error('Paystack response invalid'), {
          userId: user.id,
          bookingId: bookingId,
          paymentId: result.payment.id,
          providerId: result.provider.id,
          error_code: 'TRANSFER_CREATION_FAILED',
          metadata: { paystackResponse: transferResponse }
        });
        throw new Error("Failed to create transfer. Paystack response invalid.");
      }

      logPayment.success('escrow_release', 'Paystack transfer created successfully', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: {
          transferCode: transferResponse.data.transfer_code,
          amount: transferResponse.data.amount,
          status: transferResponse.data.status
        }
      });

      // 15. Update payout with transfer details
      await prisma.payout.update({
        where: { id: result.payout.id },
        data: {
          transferCode: transferResponse.data.transfer_code,
          status: "PROCESSING",
        }
      });

      logPayment.success('escrow_release', 'Payout updated with transfer details', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: {
          payoutId: result.payout.id,
          transferCode: transferResponse.data.transfer_code,
          newStatus: 'PROCESSING'
        }
      });

      // 16. Update booking status to COMPLETED
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "COMPLETED" }
      });

      logPayment.success('escrow_release', 'Booking status updated to COMPLETED', {
        userId: user.id,
        bookingId: bookingId,
        paymentId: result.payment.id,
        providerId: result.provider.id,
        metadata: { newBookingStatus: 'COMPLETED' }
      });

      // 17. Update payment status to RELEASED
      await prisma.payment.update({
        where: { id: result.payment.id },
        data: { status: "RELEASED" }
      });

      const totalTime = Date.now() - startTime;
      console.log(`🎉 Payment release completed successfully in ${totalTime}ms`);

      return NextResponse.json({ 
        success: true,
        payout: result.payout,
        message: isTestMode 
          ? "Payment released successfully to provider. Transfer simulated in test mode."
          : "Payment released successfully to provider. Transfer initiated.",
        transferCode: transferResponse.data.transfer_code,
        recipientCode,
        amount: result.payment.escrowAmount,
        bookingStatus: "COMPLETED",
        mode: isTestMode ? 'TEST' : 'PRODUCTION'
      });

    } catch (transferError) {
      console.error("❌ Paystack transfer failed:", transferError);
      
      // 18. Rollback database changes if transfer fails
      console.log(`🔄 Rolling back database changes due to transfer failure...`);
      
      try {
        await prisma.$transaction(async (tx) => {
          // Revert payout status
          await tx.payout.update({
            where: { id: result.payout.id },
            data: { status: "FAILED" }
          });

          // Revert payment status
          await tx.payment.update({
            where: { id: result.payment.id },
            data: { status: "ESCROW" }
          });

          // Revert booking status
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "AWAITING_CONFIRMATION" }
          });
        });
        
        console.log(`✅ Database changes rolled back successfully`);
      } catch (rollbackError) {
        console.error("❌ Failed to rollback database changes:", rollbackError);
      }

      // Return appropriate error message
      let errorMessage = "Failed to initiate payment transfer. Please try again later.";
      let statusCode = 500;

      if (transferError instanceof Error) {
        console.log(`🔍 Transfer error details:`, {
          message: transferError.message,
          stack: transferError.stack
        });
        
        if (transferError.message.includes("bank details are incomplete") || 
            transferError.message.includes("has not set up their bank account details")) {
          errorMessage = "Provider has not set up their bank account details yet. Please ask the provider to add their bank information in their dashboard, or contact support for assistance.";
          statusCode = 400;
        } else if (transferError.message.includes("Failed to create transfer recipient")) {
          errorMessage = "Failed to set up provider bank account. Please contact support.";
          statusCode = 500;
        } else if (transferError.message.includes("Failed to create transfer")) {
          errorMessage = "Payment transfer failed. Please try again later.";
          statusCode = 500;
        } else if (transferError.message.includes("Invalid key")) {
          errorMessage = "Payment system configuration error. Please contact support to resolve this issue.";
          statusCode = 500;
        } else if (transferError.message.includes("Invalid bank code")) {
          errorMessage = "Provider's bank details are invalid. Please ask the provider to update their bank information.";
          statusCode = 400;
        } else if (transferError.message.includes("Invalid account number")) {
          errorMessage = "Provider's account number is invalid. Please ask the provider to verify their account details.";
          statusCode = 400;
        }
      }

      return NextResponse.json({ 
        error: errorMessage,
        details: "The payment has been reverted to escrow. Please try again or contact support."
      }, { status: statusCode });
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Payment release error after ${totalTime}ms:`, error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Transaction already closed') || error.message.includes('expired transaction')) {
        return NextResponse.json({ 
          error: "Payment release is taking longer than expected. Please try again.",
          details: "The operation timed out but may have partially completed. Check your payment status."
        }, { status: 408 }); // Request Timeout
      }
      
      // Handle validation errors
      if (error.message === "Booking not found") {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "No payment found for this booking") {
        return NextResponse.json({ error: "No payment found for this booking" }, { status: 400 });
      }
      if (error.message === "Provider not found for this booking") {
        return NextResponse.json({ error: "Provider not found for this booking" }, { status: 400 });
      }
      
      // Handle payment status errors
      if (error.message.includes("Payment is not in escrow") || 
          error.message.includes("Payment is still pending") ||
          error.message.includes("Payment is held in escrow") ||
          error.message.includes("Payment is already being processed") ||
          error.message.includes("Payment has already been released") ||
          error.message.includes("Payment has been refunded") ||
          error.message.includes("Payment failed")) {
        return NextResponse.json({ 
          error: error.message,
          details: "Please check the payment status or contact support if this persists."
        }, { status: 400 });
      }
      
      // Handle booking status errors
      if (error.message.includes("Job is not awaiting confirmation")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: "Internal server error during payment release",
      details: "Please try again later or contact support if the issue persists."
    }, { status: 500 });
  }
}
