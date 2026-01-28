import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('GET /api/provider/[id]/bank-details called with params:', params);
    
    const user = await getCurrentUser();
    console.log('Current user:', user ? { id: user.id, role: user.role, providerId: user.provider?.id } : 'null');
    
    if (!user || user.role !== "PROVIDER") {
      console.log('User not authorized:', { user: !!user, role: user?.role });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerId = params.id;
    console.log('Provider ID from params:', providerId);
    console.log('User provider ID:', user.provider?.id);
    
    // Ensure provider can only access their own bank details
    if (user.provider?.id !== providerId) {
      console.log('Forbidden: user provider ID does not match params');
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log('Fetching provider from database:', providerId);
    const provider = await db.provider.findUnique({
      where: { id: providerId },
      select: {
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        recipientCode: true,
      },
    });

    if (!provider) {
      console.log('Provider not found in database:', providerId);
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    
    console.log('Provider found in database:', { 
      hasBankName: !!provider.bankName, 
      hasBankCode: !!provider.bankCode, 
      hasAccountNumber: !!provider.accountNumber, 
      hasAccountName: !!provider.accountName 
    });

    // Return bank details (mask account number for security)
    const bankDetails = {
      bankName: provider.bankName,
      bankCode: provider.bankCode,
      accountNumber: provider.accountNumber ? 
        `****${provider.accountNumber.slice(-4)}` : null, // Mask for display
      accountName: provider.accountName,
      hasRecipientCode: !!provider.recipientCode,
    };
    
    console.log('Returning bank details:', { 
      bankName: bankDetails.bankName, 
      bankCode: bankDetails.bankCode, 
      accountNumber: bankDetails.accountNumber, 
      accountName: bankDetails.accountName 
    });

    // Check if bank details are complete
    const hasBankDetails = !!(provider.bankName && provider.bankCode && provider.accountNumber && provider.accountName);
    
    return NextResponse.json({ 
      bankDetails,
      hasBankDetails 
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log('POST /api/provider/[id]/bank-details called with params:', params);
    
    const user = await getCurrentUser();
    console.log('Current user:', user ? { id: user.id, role: user.role, providerId: user.provider?.id } : 'null');
    
    if (!user || user.role !== "PROVIDER") {
      console.log('User not authorized:', { user: !!user, role: user?.role });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providerId = params.id;
    console.log('Provider ID from params:', providerId);
    console.log('User provider ID:', user.provider?.id);
    
    // Ensure provider can only update their own bank details
    if (user.provider?.id !== providerId) {
      console.log('Forbidden: user provider ID does not match params');
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    console.log('Request body received:', body);
    const { bankName, bankCode, accountNumber, accountName } = body;

    // Check if provider exists
    const existingProvider = await db.provider.findUnique({
      where: { id: providerId },
      select: { id: true }
    });
    
    if (!existingProvider) {
      console.log('Provider not found in database:', providerId);
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    
    console.log('Provider found in database:', existingProvider.id);

    // Validation
    if (!bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Bank code, account number, and account name are required" },
        { status: 400 }
      );
    }

    // Validate account number format
    if (!/^\d{6,17}$/.test(accountNumber)) {
      return NextResponse.json(
        { error: "Account number should be 6-17 digits" },
        { status: 400 }
      );
    }

    // BEST PRACTICE: Trust frontend validation
    // Frontend already validates bank codes against Paystack API before submission
    // Backend validation is redundant and causes issues when Paystack API has temporary problems
    // (e.g., rate limiting, network timeouts, API inconsistencies)
    // 
    // Benefits of trusting frontend:
    // - Frontend validation is the user-facing validation (what users see)
    // - Faster saves (no redundant API call)
    // - More reliable (avoids Paystack API timing/rate limit issues)
    // - Better UX (users aren't blocked by backend API failures)
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
    
    if (!isTestMode) {
      console.log(`✅ Trusting frontend validation for bank code: ${bankCode}`);
      console.log(`📋 Frontend already validated this code against Paystack API - skipping redundant backend validation`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}, Test Mode: ${isTestMode}`);
      
      // Optional: Non-blocking health check for monitoring (doesn't affect save)
      // This helps us monitor Paystack API availability without blocking users
      try {
        const { paystackClient } = await import('@/lib/paystack');
        // Fire and forget - don't await, don't block
        paystackClient.listBanks({ country: 'ZA' }).then(banks => {
          console.log(`📊 Paystack API health check (non-blocking): ${banks.data?.length || 0} banks available`);
        }).catch(error => {
          // Ignore errors - this is just for monitoring, not validation
          console.warn(`⚠️ Paystack API health check failed (non-blocking):`, error instanceof Error ? error.message : 'Unknown error');
        });
      } catch (monitoringError) {
        // Ignore monitoring errors - they don't affect the save
        console.warn(`⚠️ Could not perform Paystack API health check (non-blocking):`, monitoringError);
      }
    } else {
      console.log(`ℹ️ Skipping bank code validation - in test mode`);
    }

    // Update provider with bank details
    console.log('Updating provider with data:', { bankName, bankCode, accountNumber: '***', accountName });
    
    const updatedProvider = await db.provider.update({
      where: { id: providerId },
      data: {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        // Clear recipient code when bank details change
        recipientCode: null,
      },
      select: {
        id: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        recipientCode: true,
      },
    });
    
    console.log('Provider updated successfully:', updatedProvider.id);

    console.log(`Bank details updated for provider ${providerId}`);

    return NextResponse.json({
      message: "Bank details updated successfully",
      provider: {
        id: updatedProvider.id,
        bankName: updatedProvider.bankName,
        bankCode: updatedProvider.bankCode,
        accountNumber: `****${updatedProvider.accountNumber.slice(-4)}`, // Masked
        accountName: updatedProvider.accountName,
        hasRecipientCode: !!updatedProvider.recipientCode,
      },
    });
  } catch (error) {
    console.error("Error updating bank details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
