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
    
    console.log(`🏦 Fetching transfer-enabled banks for ${country} (using Paystack advisory metadata)...`);
    
    const { transferEnabledBanksService } = await import('@/lib/services/transfer-enabled-banks-service');
    
    const banks = forceRefresh
      ? await transferEnabledBanksService.forceRefresh(country)
      : await transferEnabledBanksService.getTransferEnabledBanks(country);
    
    const cacheStatus = transferEnabledBanksService.getCacheStatus(country);
    
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
      source: 'paystack_api_pay_with_bank_transfer',
      metadata: {
        advisory: true, // Paystack metadata is advisory, not authoritative
        cache: {
          cached: cacheStatus.cached,
          expiresAt: cacheStatus.expiresAt,
          isStale: cacheStatus.isStale,
        },
      },
      note: 'Only banks that support Paystack transfers (advisory metadata). Hard validation occurs during recipient creation.',
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch transfer-enabled banks:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transfer-enabled banks',
      data: [],
    }, { status: 500 });
  }
}
