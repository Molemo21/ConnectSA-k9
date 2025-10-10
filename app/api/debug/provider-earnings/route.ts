import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Provider Earnings API: Starting');
    
    // Test 1: Basic response
    console.log('✅ Test 1: Basic response works');
    
    // Test 2: Authentication
    console.log('🔍 Test 2: Testing authentication...');
    const user = await getCurrentUser();
    console.log('✅ Test 2: Authentication result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userRole: user?.role 
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: "Not authenticated",
        test: "auth_failed"
      }, { status: 401 });
    }
    
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized - Provider role required",
        test: "role_failed",
        userRole: user.role
      }, { status: 403 });
    }
    
    // Test 3: Provider lookup
    console.log('🔍 Test 3: Testing provider lookup...');
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    });
    console.log('✅ Test 3: Provider lookup result:', { 
      hasProvider: !!provider, 
      providerId: provider?.id 
    });
    
    if (!provider) {
      return NextResponse.json({ 
        success: false,
        error: "Provider profile not found",
        test: "provider_not_found"
      }, { status: 404 });
    }
    
    // Test 4: Simple booking query
    console.log('🔍 Test 4: Testing simple booking query...');
    const completedBookings = await db.booking.findMany({
      where: {
        providerId: provider.id,
        status: "COMPLETED"
      },
      select: {
        id: true,
        totalAmount: true
      },
      take: 5 // Limit to 5 for testing
    });
    console.log('✅ Test 4: Booking query result:', { 
      bookingCount: completedBookings.length 
    });
    
    // Test 5: Calculate earnings
    console.log('🔍 Test 5: Testing earnings calculation...');
    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);
    console.log('✅ Test 5: Earnings calculation result:', { totalEarnings });
    
    return NextResponse.json({
      success: true,
      test: "all_tests_passed",
      totalEarnings,
      completedBookings: completedBookings.length,
      providerId: provider.id,
      userId: user.id
    });
    
  } catch (error) {
    console.error("❌ Debug Provider Earnings API Error:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      test: "error_caught",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 200 });
  }
}
