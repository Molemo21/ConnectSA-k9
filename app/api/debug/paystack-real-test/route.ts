import { NextRequest, NextResponse } from "next/server";
import { paystackClient } from "@/lib/paystack";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Test with real Paystack API call using the same parameters as the payment route
    const testData = {
      amount: 1000, // R10.00 in cents
      email: 'test@example.com',
      reference: `test-real-${Date.now()}`,
      callback_url: 'https://app.proliinkconnect.co.za/dashboard',
      metadata: {
        test: true,
        bookingId: 'test-booking',
        clientId: 'test-client'
      }
    };

    console.log('🧪 Testing real Paystack API call with:', testData);

    const result = await paystackClient.initializePayment(testData);
    
    return NextResponse.json({
      success: true,
      message: 'Paystack API call successful',
      result: {
        status: result.status,
        message: result.message,
        authorization_url: result.data?.authorization_url,
        reference: result.data?.reference
      },
      testData
    });

  } catch (error) {
    console.error('❌ Real Paystack test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
