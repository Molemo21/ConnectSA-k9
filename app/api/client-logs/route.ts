import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Log to server console with timestamp
    const timestamp = new Date().toISOString();
    console.log(`🔴 CLIENT ERROR [${timestamp}]:`, logData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
