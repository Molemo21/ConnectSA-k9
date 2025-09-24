import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? 'SET' : 'MISSING',
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      NEXT_PHASE: process.env.NEXT_PHASE,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING'
    };

    // Try to import Paystack
    let paystackStatus = 'UNKNOWN';
    let paystackError = null;
    
    try {
      const { paystackClient } = await import("@/lib/paystack");
      paystackStatus = 'IMPORT_SUCCESS';
      
      // Try to initialize (just test SDK, not actual API call)
      try {
        // Test SDK initialization without making actual API call
        const { paystackSDK } = await import("@/lib/paystack");
        const client = paystackSDK.getInstance();
        
        // Just check if the client is properly initialized
        if (client && client.secretKey && client.publicKey) {
          paystackStatus = 'INITIALIZATION_SUCCESS';
        } else {
          paystackStatus = 'INITIALIZATION_FAILED';
          paystackError = 'Client not properly initialized';
        }
      } catch (initError) {
        paystackStatus = 'INITIALIZATION_FAILED';
        paystackError = initError instanceof Error ? initError.message : 'Unknown error';
      }
    } catch (importError) {
      paystackStatus = 'IMPORT_FAILED';
      paystackError = importError instanceof Error ? importError.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      paystack: {
        status: paystackStatus,
        error: paystackError
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
