import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Simple test API called');
    
    const testData = {
      message: 'Hello from simple test API',
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
    console.log('🔍 Returning test data:', testData);
    return NextResponse.json(testData);
  } catch (error) {
    console.error('❌ Error in simple test API:', error);
    return NextResponse.json({ 
      error: 'Simple test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
