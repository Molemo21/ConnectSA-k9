import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Test accept endpoint is working",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Test accept endpoint POST is working",
    method: "POST",
    timestamp: new Date().toISOString()
  });
}
