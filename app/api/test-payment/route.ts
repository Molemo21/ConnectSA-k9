import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Test endpoint to verify basic payment route functionality
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Test payment endpoint is accessible",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "Test payment endpoint POST is accessible",
    method: "POST",
    timestamp: new Date().toISOString()
  });
}
