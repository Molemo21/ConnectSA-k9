import { NextRequest, NextResponse } from 'next/server';
import { paystackClient } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * GET /api/paystack/banks/ui
 * 
 * UI Bank Listing Flow - for dropdown display
 * Returns all banks from Paystack (for display purposes only)
 * 
 * NOTE: These banks are for UI display only
 * They may not all support transfers
 * Use /api/paystack/banks/payout for transfer-enabled banks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'ZA';
    const currency = searchParams.get('currency') || 'ZAR';
    
    console.log(`🔍 Fetching UI banks from Paystack for country: ${country}`);
    
    const banks = await paystackClient.listBanks({ country, currency });
    
    if (!banks.status || !banks.data) {
      return NextResponse.json({
        success: false,
        error: banks.message || 'Failed to fetch banks',
        data: [],
      }, { status: 500 });
    }
    
    const formattedBanks = banks.data
      .filter(bank => bank.active && !bank.is_deleted)
      .map(bank => ({
        code: bank.code,
        name: bank.name,
        slug: bank.slug,
        type: bank.type,
        country: bank.country,
        currency: bank.currency,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ Returning ${formattedBanks.length} UI banks`);
    
    return NextResponse.json({
      success: true,
      data: formattedBanks,
      count: formattedBanks.length,
      purpose: 'ui-display',
      warning: 'These banks are for display only. Use /api/paystack/banks/payout for transfer-enabled banks.',
    });
  } catch (error) {
    console.error('❌ Failed to fetch UI banks:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch banks',
      data: [],
    }, { status: 500 });
  }
}
