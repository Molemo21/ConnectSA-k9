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

    // Validate bank code against Paystack (production only)
    // BEST PRACTICE: Trust codes that come from Paystack's API list
    // If a code is in Paystack's official bank list, we accept it without additional validation
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
    
    if (!isTestMode) {
      try {
        const { paystackClient } = await import('@/lib/paystack');
        console.log(`🔍 Validating bank code: ${bankCode} for South Africa...`);
        console.log(`📋 Validation strategy: Trust codes from Paystack API list`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}, Test Mode: ${isTestMode}`);
        
        // Validate by checking if code exists in Paystack's official bank list
        // This is the source of truth - if Paystack returns it in their list, we trust it
        const isValidBankCode = await paystackClient.validateBankCode(bankCode, 'ZA');
        
        console.log(`📊 Validation result for "${bankCode}": ${isValidBankCode ? 'VALID' : 'INVALID'}`);
        
        if (!isValidBankCode) {
          // Fetch the bank list to see what's actually available for debugging
          try {
            const banks = await paystackClient.listBanks({ country: 'ZA' });
            const activeBanks = banks.data?.filter(b => b.active && !b.is_deleted) || [];
            const bankWithCode = banks.data?.find(b => b.code === bankCode);
            
            console.error(`❌ Invalid bank code: ${bankCode} - not found in Paystack API active banks list`);
            console.error(`📋 Debug info:`, {
              totalBanksFromAPI: banks.data?.length || 0,
              activeBanksCount: activeBanks.length,
              bankCodeExists: !!bankWithCode,
              bankActive: bankWithCode?.active,
              bankDeleted: bankWithCode?.is_deleted,
              bankName: bankWithCode?.name,
              sampleActiveBanks: activeBanks.slice(0, 5).map(b => `${b.name} (${b.code})`)
            });
          } catch (debugError) {
            console.error(`❌ Could not fetch debug info:`, debugError);
          }
          
          // Include debug info in response for client-side logging
          const debugInfo: Record<string, unknown> = {};
          try {
            const banks = await paystackClient.listBanks({ country: 'ZA' });
            const activeBanks = banks.data?.filter(b => b.active && !b.is_deleted) || [];
            const bankWithCode = banks.data?.find(b => b.code === bankCode);
            
            debugInfo.totalBanksFromAPI = banks.data?.length || 0;
            debugInfo.activeBanksCount = activeBanks.length;
            debugInfo.bankCodeExists = !!bankWithCode;
            debugInfo.bankActive = bankWithCode?.active;
            debugInfo.bankDeleted = bankWithCode?.is_deleted;
            debugInfo.bankName = bankWithCode?.name;
            debugInfo.sampleActiveBanks = activeBanks.slice(0, 5).map(b => `${b.name} (${b.code})`);
          } catch (debugError) {
            debugInfo.debugError = debugError instanceof Error ? debugError.message : 'Unknown error';
          }
          
          return NextResponse.json(
            { 
              error: "Invalid bank code",
              details: `The bank code "${bankCode}" is not valid for South African banks. Please select a valid bank from the list provided by Paystack.`,
              field: "bankCode",
              debug: debugInfo // Include debug info for client-side inspection
            },
            { status: 400 }
          );
        }
        console.log(`✅ Bank code "${bankCode}" validated successfully - found in Paystack API list`);
      } catch (validationError) {
        // Log but don't block - validation is best effort
        // If Paystack API is down, we should still allow the save to proceed
        // The frontend already validates against the API list, so this is a secondary check
        console.warn(`⚠️ Bank code validation warning (continuing anyway):`, validationError);
        console.warn(`⚠️ Validation error details:`, validationError instanceof Error ? validationError.message : 'Unknown error');
        console.warn(`⚠️ Validation error stack:`, validationError instanceof Error ? validationError.stack : 'No stack');
        // Continue with save - don't block user if validation service is down
        // Frontend validation should catch invalid codes before they reach here
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
