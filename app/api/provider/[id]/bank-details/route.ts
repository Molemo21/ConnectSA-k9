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
    const { bankName, accountNumber, accountName } = body;
    let bankCode = body.bankCode; // Use let since we may need to update it with resolved code

    // Check if provider exists and get current bank details for comparison
    const existingProvider = await db.provider.findUnique({
      where: { id: providerId },
      select: { 
        id: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        recipientCode: true,
      }
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

    // Advisory validation: Check if bank is in transfer-enabled list
    // NOTE: This is advisory, not authoritative. Hard validation happens during recipient creation.
    const { BankValidationService } = await import('@/lib/services/bank-validation-service');
    const advisoryValidation = await BankValidationService.validateForTransfer(bankCode);
    
    if (!advisoryValidation.valid) {
      console.warn(`⚠️ Advisory validation failed: ${advisoryValidation.error}`);
      return NextResponse.json(
        { 
          error: "Bank not in transfer-enabled list (advisory)",
          details: advisoryValidation.error || "This bank may not support transfers. Please select a transfer-enabled bank from the list.",
          field: "bankCode",
          isAdvisory: true,
        },
        { status: 400 }
      );
    }

    // FIX 2: Smart recipient code management - Check if bank details actually changed
    const bankDetailsChanged = 
      existingProvider.bankCode !== bankCode ||
      existingProvider.accountNumber !== accountNumber ||
      existingProvider.accountName !== accountName;

    console.log('Bank details change check:', {
      bankCodeChanged: existingProvider.bankCode !== bankCode,
      accountNumberChanged: existingProvider.accountNumber !== accountNumber,
      accountNameChanged: existingProvider.accountName !== accountName,
      overallChanged: bankDetailsChanged,
      hasExistingRecipientCode: !!existingProvider.recipientCode
    });

    // FIX 1: Validate bank details with Paystack by creating recipient
    // This ensures the account is valid and can receive transfers
    let recipientCode: string | null = null;
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.PAYSTACK_TEST_MODE === 'true';
    
    // Only validate if bank details changed OR if recipient code doesn't exist
    if (bankDetailsChanged || !existingProvider.recipientCode) {
      console.log('🔄 Validating bank account with Paystack...');
      
      // Declare recipientData outside try block for error handling access
      const recipientData: {
        type: 'nuban';
        name: string;
        account_number: string;
        bank_code: string;
      } = {
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
      };
      
      try {
        const { paystackClient } = await import('@/lib/paystack');
        
        // BEST PRACTICE: Frontend now sends transfer-compatible codes from /api/paystack/banks
        // No conversion needed - codes are already correct for createRecipient API
        console.log('📤 Creating Paystack recipient for validation:', {
          type: recipientData.type,
          name: recipientData.name,
          bank_code: recipientData.bank_code,
          account_number: '***' + accountNumber.slice(-4) // Masked for logging
        });
        
        if (isTestMode) {
          // In test mode, simulate successful recipient creation
          console.log('🧪 Test mode: Simulating recipient creation');
          recipientCode = `TEST_RECIPIENT_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          console.log(`✅ Test recipient code generated: ${recipientCode}`);
        } else {
          // Create actual Paystack recipient to validate bank account
          const recipientResponse = await paystackClient.createRecipient(recipientData);
          
          if (!recipientResponse.status || !recipientResponse.data?.recipient_code) {
            throw new Error('Failed to validate bank account with Paystack');
          }
          
          recipientCode = recipientResponse.data.recipient_code;
          console.log(`✅ Paystack recipient created successfully: ${recipientCode}`);
          console.log('✅ Bank account validated - account can receive transfers');
        }
      } catch (recipientError) {
        console.error('❌ HARD FAILURE: Recipient creation failed:', recipientError);
        
        // Hard failure handling - authoritative validation from payment provider
        const failureResult = BankValidationService.handleRecipientCreationFailure(recipientError);
        
        // Log hard failure for monitoring
        console.error('🚨 Hard failure details:', {
          isHardFailure: failureResult.isHardFailure,
          error: failureResult.error,
          details: failureResult.details,
          recoverable: failureResult.recoverable,
          actionRequired: failureResult.actionRequired,
          bankCode: recipientData.bank_code,
          accountNumber: '***' + accountNumber.slice(-4),
        });
        
        // Determine error field from failure type
        let errorField: string | undefined = undefined;
        if (failureResult.error.includes('bank code')) {
          errorField = 'bankCode';
        } else if (failureResult.error.includes('account number')) {
          errorField = 'accountNumber';
        } else if (failureResult.error.includes('account name')) {
          errorField = 'accountName';
        }
        
        return NextResponse.json(
          { 
            error: failureResult.error,
            details: failureResult.details,
            field: errorField,
            isHardFailure: true,
            recoverable: failureResult.recoverable,
            actionRequired: failureResult.actionRequired,
          },
          { status: 400 }
        );
      }
    } else {
      // Bank details unchanged - keep existing recipient code
      recipientCode = existingProvider.recipientCode;
      console.log('✅ Bank details unchanged, keeping existing recipient code');
    }

    // Update provider with bank details and validated recipient code
    console.log('Updating provider with validated bank details:', { 
      bankName, 
      bankCode, 
      accountNumber: '***', 
      accountName,
      hasRecipientCode: !!recipientCode,
      recipientCodeChanged: bankDetailsChanged || !existingProvider.recipientCode
    });
    
    const updatedProvider = await db.provider.update({
      where: { id: providerId },
      data: {
        bankName,
        bankCode,
        accountNumber,
        accountName,
        recipientCode, // Store validated recipient code (or keep existing if unchanged)
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
    
    console.log('✅ Provider updated successfully with validated bank details:', {
      providerId: updatedProvider.id,
      hasRecipientCode: !!updatedProvider.recipientCode
    });

    return NextResponse.json({
      message: bankDetailsChanged 
        ? "Bank details validated and saved successfully" 
        : "Bank details saved successfully",
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
