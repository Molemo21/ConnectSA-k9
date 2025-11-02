import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Log to server console with timestamp
    const timestamp = new Date().toISOString();
    const level = logData.level || 'info';
    
    // Use appropriate icon based on log level
    if (level === 'error') {
      console.log(`🔴 CLIENT ERROR [${timestamp}]:`, logData);
    } else {
      console.log(`ℹ️ CLIENT INFO [${timestamp}]:`, logData);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log client log:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
