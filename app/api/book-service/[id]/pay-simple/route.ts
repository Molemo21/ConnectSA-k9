import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simplified payment route to test imports
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Simple payment endpoint is accessible",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    // Test basic imports one by one
    console.log('🔍 Testing basic imports...');
    
    // Test 1: Basic Next.js imports (should work)
    console.log('✅ NextRequest and NextResponse work');
    
    // Test 2: Auth import
    const { getCurrentUser } = await import("@/lib/auth");
    console.log('✅ Auth import works');
    
    // Test 3: Prisma import
    const { prisma } = await import("@/lib/prisma");
    console.log('✅ Prisma import works');
    
    // Test 4: Logger import
    const { logPayment, logger } = await import("@/lib/logger");
    console.log('✅ Logger import works');
    
    // Test 5: Zod import
    const { z } = await import("zod");
    console.log('✅ Zod import works');
    
    // Test 6: Paystack import (this might be the issue)
    const { paystackClient, paymentProcessor, PAYMENT_CONSTANTS } = await import("@/lib/paystack");
    console.log('✅ Paystack import works');
    
    return NextResponse.json({
      message: "All imports successful",
      method: "POST",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    return NextResponse.json({
      error: "Import test failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      method: "POST",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
