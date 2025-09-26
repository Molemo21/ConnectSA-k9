import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const provider = await prisma.provider.findUnique({
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
    const existingProvider = await prisma.provider.findUnique({
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

    // Update provider with bank details
    console.log('Updating provider with data:', { bankName, bankCode, accountNumber: '***', accountName });
    
    const updatedProvider = await prisma.provider.update({
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
