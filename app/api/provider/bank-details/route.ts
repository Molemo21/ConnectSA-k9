import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

/**
 * GET /api/provider/bank-details
 * Get the current provider's banking details using authentication context
 */
export async function GET() {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    console.log("🔍 Fetching provider's bank details...");

    const user = await getCurrentUser();
    if (!user || user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get provider's banking details using the authenticated user's ID
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      select: {
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
        recipientCode: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    console.log(`✅ Found banking details for provider ${user.id}:`, {
      hasBankName: !!provider.bankName,
      hasBankCode: !!provider.bankCode,
      hasAccountNumber: !!provider.accountNumber,
      hasAccountName: !!provider.accountName
    });

    // Check if bank details are complete
    const hasBankDetails = !!(provider.bankName && provider.bankCode && provider.accountNumber && provider.accountName);

    // Return bank details (mask account number for security)
    const bankDetails = {
      bankName: provider.bankName,
      bankCode: provider.bankCode,
      accountNumber: provider.accountNumber ? 
        `****${provider.accountNumber.slice(-4)}` : null, // Mask for display
      accountName: provider.accountName,
      hasRecipientCode: !!provider.recipientCode,
    };

    return NextResponse.json({
      bankDetails,
      hasBankDetails
    });

  } catch (error) {
    console.error("❌ Error fetching provider bank details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

