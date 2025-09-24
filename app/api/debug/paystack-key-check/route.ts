import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    return NextResponse.json({
      success: true,
      environment: {
        PAYSTACK_SECRET_KEY_PREFIX: secretKey ? secretKey.substring(0, 10) + '...' : 'MISSING',
        PAYSTACK_PUBLIC_KEY_PREFIX: publicKey ? publicKey.substring(0, 10) + '...' : 'MISSING',
        PAYSTACK_SECRET_KEY_LENGTH: secretKey ? secretKey.length : 0,
        PAYSTACK_PUBLIC_KEY_LENGTH: publicKey ? publicKey.length : 0,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
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
