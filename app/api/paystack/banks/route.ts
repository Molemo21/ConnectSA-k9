import { NextRequest, NextResponse } from 'next/server';
import { paystackClient } from '@/lib/paystack';
import { getTransferCode, hasMapping } from '@/lib/config/bank-code-mappings';

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
    
    // Try with country only first (currency parameter might not be supported for SA)
    let banks = await paystackClient.listBanks({ country });
    
    // If no results and currency was provided, log that we tried with currency
    if ((!banks.data || banks.data.length === 0) && currency) {
      console.log(`⚠️ No banks returned with country only, Paystack might not support currency parameter for SA`);
    }
    
    // Add detailed logging
    console.log(`📊 Paystack API response:`, {
      status: banks.status,
      message: banks.message,
      rawDataLength: banks.data?.length || 0,
      hasData: !!banks.data
    });
    
    if (!banks.status || !banks.data) {
      console.error(`❌ Paystack API error:`, {
        status: banks.status,
        message: banks.message,
        data: banks.data
      });
      return NextResponse.json({
        success: false,
        error: banks.message || 'Failed to fetch banks',
        data: [],
        debug: {
          paystackStatus: banks.status,
          paystackMessage: banks.message
        }
      }, { status: 500 });
    }
    
    // Log raw data before filtering
    console.log(`📋 Raw banks from Paystack (before filtering):`, banks.data.length);
    if (banks.data.length > 0) {
      console.log(`   Sample bank:`, banks.data[0]);
    }
    
    // Format banks for frontend use
    // BEST PRACTICE: Convert display codes to transfer-compatible codes
    // This ensures frontend only sees codes that work with createRecipient API
    const formattedBanks = banks.data
      .filter(bank => bank.active && !bank.is_deleted)
      .map(bank => {
        // Convert display code to transfer-compatible code
        const transferCode = getTransferCode(bank.code);
        
        // Log if mapping was used (for monitoring)
        if (hasMapping(bank.code)) {
          console.log(`🔄 Bank code mapped: ${bank.name} ${bank.code} -> ${transferCode}`);
        }
        
        return {
          code: transferCode, // Use transfer-compatible code
          name: bank.name,
          slug: bank.slug,
          type: bank.type,
          country: bank.country,
          currency: bank.currency
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ After filtering: ${formattedBanks.length} active banks`);
    
    // If filtering removed all banks, log why
    if (banks.data.length > 0 && formattedBanks.length === 0) {
      console.warn(`⚠️ All banks were filtered out!`, {
        totalBanks: banks.data.length,
        inactiveBanks: banks.data.filter(b => !b.active).length,
        deletedBanks: banks.data.filter(b => b.is_deleted).length
      });
    }
    
    // If Paystack returned no banks, use fallback static list (without invalid codes)
    // This ensures providers always have banks to select from
    if (formattedBanks.length === 0 && country === 'ZA') {
      console.warn(`⚠️ Paystack returned no banks for South Africa, using fallback static list`);
      try {
        const { getSupportedBanks } = await import('@/lib/config/paystack-config');
        const fallbackBanks = getSupportedBanks();
        
        // Filter out invalid codes (like "470010" which Paystack rejects)
        // BEST PRACTICE: Apply bank code mappings to fallback banks too
        const validFallbackBanks = fallbackBanks
          .filter(bank => bank.code !== '470010') // Remove invalid Capitec code
          .map(bank => {
            // Convert display code to transfer-compatible code
            const transferCode = getTransferCode(bank.code);
            
            // Log if mapping was used
            if (hasMapping(bank.code)) {
              console.log(`🔄 Fallback bank code mapped: ${bank.name} ${bank.code} -> ${transferCode}`);
            }
            
            return {
              code: transferCode, // Use transfer-compatible code
              name: bank.name,
              slug: bank.code.toLowerCase(),
              type: 'nuban',
              country: 'ZA',
              currency: 'ZAR'
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`📋 Using ${validFallbackBanks.length} banks from fallback static list (Paystack API returned empty)`);
        
        return NextResponse.json({
          success: true,
          data: validFallbackBanks,
          count: validFallbackBanks.length,
          country,
          currency,
          source: 'fallback', // Indicate this is from fallback, not Paystack API
          debug: {
            rawCount: banks.data.length,
            filteredCount: formattedBanks.length,
            fallbackCount: validFallbackBanks.length,
            message: 'Paystack API returned no banks, using fallback static list (invalid codes filtered out)'
          }
        });
      } catch (fallbackError) {
        console.error('❌ Failed to load fallback banks:', fallbackError);
        // Return empty but with error info
        return NextResponse.json({
          success: false,
          error: 'Paystack API returned no banks and fallback failed',
          data: [],
          debug: {
            rawCount: banks.data.length,
            filteredCount: formattedBanks.length,
            fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          }
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: formattedBanks,
      count: formattedBanks.length,
      country,
      currency,
      source: 'paystack', // Indicate this is from Paystack API
      debug: {
        rawCount: banks.data.length,
        filteredCount: formattedBanks.length
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch banks:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch banks',
      data: [],
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
}
