import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/paystack/banks/payout
 * 
 * Transfer Bank Flow - for payout/transfer recipient creation
 * Returns ONLY banks that support Paystack transfers
 * Uses Paystack's pay_with_bank_transfer=true parameter (advisory metadata)
 * 
 * CRITICAL: NO fake operations, NO probing, NO test recipients
 * Paystack metadata is advisory, not authoritative
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'ZA';
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log(`🏦 Fetching transfer-enabled banks for ${country}${forceRefresh ? ' (force refresh)' : ''}...`);
    
    const { transferEnabledBanksService } = await import('@/lib/services/transfer-enabled-banks-service');
    
    let banks;
    try {
      banks = forceRefresh
        ? await transferEnabledBanksService.forceRefresh(country)
        : await transferEnabledBanksService.getTransferEnabledBanks(country);
    } catch (serviceError) {
      console.error('❌ Transfer-enabled banks service failed:', serviceError);
      // Service should have fallback, but if it still fails, return error
      throw new Error(`Failed to load banks: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`);
    }
    
    const cacheStatus = transferEnabledBanksService.getCacheStatus(country);
    
    // If no banks returned, try to provide helpful error message
    if (!banks || banks.length === 0) {
      console.warn('⚠️ No banks returned from service');
      return NextResponse.json({
        success: false,
        error: 'No transfer-enabled banks available. This may be a temporary issue. Please try again later or contact support.',
        data: [],
        count: 0,
      }, { status: 503 }); // Service Unavailable
    }
    
    return NextResponse.json({
      success: true,
      data: banks.map(bank => ({
        code: bank.code,
        name: bank.name,
        slug: bank.slug,
        type: bank.type,
        country: bank.country,
        currency: bank.currency,
        transferEnabled: true, // All banks from this endpoint are transfer-enabled (advisory)
        verified: bank.verified,
        verifiedAt: bank.fetchedAt,
      })),
      count: banks.length,
      purpose: 'payout-transfer',
      source: banks[0]?.verified ? 'paystack_api_pay_with_bank_transfer' : 'static_fallback',
      metadata: {
        advisory: true, // Paystack metadata is advisory, not authoritative
        cache: {
          cached: cacheStatus.cached,
          expiresAt: cacheStatus.expiresAt,
          isStale: cacheStatus.isStale,
        },
        fallback: !banks[0]?.verified, // Indicates if using fallback static config
      },
      note: 'Only banks that support Paystack transfers (advisory metadata). Hard validation occurs during recipient creation.',
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch transfer-enabled banks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transfer-enabled banks';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      data: [],
      count: 0,
      suggestion: 'Please try refreshing the page or contact support if the issue persists.',
    }, { status: 500 });
  }
}
