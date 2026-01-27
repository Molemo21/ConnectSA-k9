import { NextRequest, NextResponse } from 'next/server';
import { paystackClient } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

/**
 * GET /api/paystack/banks
 * Fetch list of valid banks from Paystack API
 * 
 * Query parameters:
 * - country: Country code (default: 'ZA' for South Africa)
 * - currency: Currency code (default: 'ZAR')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || 'ZA';
    const currency = searchParams.get('currency') || 'ZAR';
    
    console.log(`🔍 Fetching banks from Paystack for country: ${country}, currency: ${currency}`);
    
    const banks = await paystackClient.listBanks({ country, currency });
    
    if (!banks.status || !banks.data) {
      return NextResponse.json({
        success: false,
        error: banks.message || 'Failed to fetch banks',
        data: []
      }, { status: 500 });
    }
    
    // Format banks for frontend use
    const formattedBanks = banks.data
      .filter(bank => bank.active && !bank.is_deleted)
      .map(bank => ({
        code: bank.code,
        name: bank.name,
        slug: bank.slug,
        type: bank.type,
        country: bank.country,
        currency: bank.currency
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ Fetched ${formattedBanks.length} active banks for ${country}`);
    
    return NextResponse.json({
      success: true,
      data: formattedBanks,
      count: formattedBanks.length,
      country,
      currency
    });
  } catch (error) {
    console.error('❌ Failed to fetch banks:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch banks',
      data: []
    }, { status: 500 });
  }
}
