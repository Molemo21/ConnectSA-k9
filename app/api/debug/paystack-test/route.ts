import { NextRequest, NextResponse } from 'next/server';
import { paystackClient } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Paystack configuration...');
    
    // Check environment variables
    const envCheck = {
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? 'Set' : 'Missing',
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? 'Set' : 'Missing',
      PAYSTACK_WEBHOOK_URL: process.env.PAYSTACK_WEBHOOK_URL || 'Not set',
      PAYSTACK_TEST_MODE: process.env.PAYSTACK_TEST_MODE || 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PHASE: process.env.NEXT_PHASE
    };
    
    console.log('Environment check:', envCheck);
    
    // Test Paystack client initialization
    let clientStatus = 'Unknown';
    try {
      const client = paystackClient;
      clientStatus = 'Initialized';
      console.log('✅ Paystack client initialized successfully');
    } catch (error) {
      clientStatus = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Paystack client initialization failed:', error);
    }
    
    // Test a simple payment initialization
    let paymentTest = 'Not attempted';
    try {
      const testResponse = await paystackClient.initializePayment({
        amount: 100, // R1.00 test amount
        email: 'test@example.com',
        reference: `TEST_${Date.now()}`,
        callback_url: 'https://app.proliinkconnect.co.za/dashboard?payment=test',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });
      
      paymentTest = 'Success';
      console.log('✅ Payment test successful:', {
        reference: testResponse.data.reference,
        authorizationUrl: testResponse.data.authorization_url
      });
    } catch (error) {
      paymentTest = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ Payment test failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      clientStatus,
      paymentTest,
      message: 'Paystack configuration test completed'
    });
    
  } catch (error) {
    console.error('❌ Paystack test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
