import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return environment information (without sensitive data)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DATABASE_URL_PRESENT: !!process.env.DATABASE_URL,
      DIRECT_URL_PRESENT: !!process.env.DIRECT_URL,
      DATABASE_URL_PROTOCOL: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('://')[0] : null,
      DIRECT_URL_PROTOCOL: process.env.DIRECT_URL ? process.env.DIRECT_URL.split('://')[0] : null,
      // Don't expose the full URLs for security
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      DIRECT_URL_LENGTH: process.env.DIRECT_URL ? process.env.DIRECT_URL.length : 0,
    }

    return NextResponse.json({
      success: true,
      environment: envInfo,
      message: 'Environment variables check'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
