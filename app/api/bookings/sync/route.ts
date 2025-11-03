/**
 * Synchronized Bookings API Endpoint
 * 
 * This endpoint provides real-time booking data with proper cache headers
 * to ensure frontend never receives stale payment information.
 * 
 * Features:
 * - No-cache headers for payment-critical data
 * - ETags for conditional requests
 * - Comprehensive error handling
 * - Real-time payment status verification
 * - Proper CORS headers
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

export const dynamic = 'force-dynamic'


export const runtime = 'nodejs';

// Cache control headers for different data types
const CACHE_HEADERS = {
  // Payment data should never be cached
  PAYMENT_DATA: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  // Booking data can be cached briefly
  BOOKING_DATA: {
    'Cache-Control': 'private, max-age=30', // 30 seconds
  },
  // Static data can be cached longer
  STATIC_DATA: {
    'Cache-Control': 'private, max-age=300', // 5 minutes
  }
};

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user || user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const forceRefresh = searchParams.get('force') === 'true';
    const includePaymentStatus = searchParams.get('includePaymentStatus') !== 'false';
    const etag = request.headers.get('if-none-match');

    if (process.env.NODE_ENV === 'development') {


      console.log('📡 Synchronized bookings API request:', {
      userId: user.id,
      forceRefresh,
      includePaymentStatus,
      etag: etag ? 'present' : 'none'
    });


    }

    // Fetch bookings with all related data
    const bookings = await db.booking.findMany({
      where: { clientId: user.id },
      include: {
        service: true,
        provider: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              }
            }
          }
        },
        payment: includePaymentStatus,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (process.env.NODE_ENV === 'development') {


      console.log(`📊 Found ${bookings.length} bookings for user ${user.id}`);


    }

    // Enhance booking data with real-time payment verification
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        let enhancedBooking = { ...booking };

        // If payment exists and is PENDING, verify with Paystack
        if (booking.payment && booking.payment.status === 'PENDING' && includePaymentStatus) {
          try {
            // Import Paystack client dynamically to avoid build issues
            const { paystackClient } = await import('@/lib/paystack');
            
            const verification = await paystackClient.verifyPayment(booking.payment.paystackRef);
            
            if (verification.status && verification.data.status === 'success' && booking.payment.status === 'PENDING') {
              if (process.env.NODE_ENV === 'development') {

                console.log(`🔄 Payment ${booking.payment.paystackRef} verified as successful, updating status`);

              }
              
              // Update payment status in database
              await db.payment.update({
                where: { id: booking.payment.id },
                data: {
                  status: 'ESCROW',
                  paidAt: new Date(),
                  transactionId: verification.data.id?.toString() || null,
                }
              });

              // Update booking status
              if (booking.status === 'CONFIRMED') {
                await db.booking.update({
                  where: { id: booking.id },
                  data: { status: 'PENDING_EXECUTION' }
                });
                enhancedBooking.status = 'PENDING_EXECUTION';
              }

              // Update payment in response
              enhancedBooking.payment = {
                ...booking.payment,
                status: 'ESCROW',
                paidAt: new Date().toISOString(),
                transactionId: verification.data.id?.toString() || null,
              };

              if (process.env.NODE_ENV === 'development') {


                console.log(`✅ Payment ${booking.payment.paystackRef} updated to ESCROW`);


              }
            }
          } catch (verificationError) {
            console.warn(`⚠️ Failed to verify payment ${booking.payment.paystackRef}:`, verificationError);
            // Continue with existing payment data if verification fails
          }
        }

        return enhancedBooking;
      })
    );

    // Calculate metadata
    const metadata = {
      totalBookings: enhancedBookings.length,
      pendingBookings: enhancedBookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: enhancedBookings.filter(b => b.status === 'CONFIRMED').length,
      pendingExecutionBookings: enhancedBookings.filter(b => b.status === 'PENDING_EXECUTION').length,
      inProgressBookings: enhancedBookings.filter(b => b.status === 'IN_PROGRESS').length,
      completedBookings: enhancedBookings.filter(b => b.status === 'COMPLETED').length,
      pendingPayments: enhancedBookings.filter(b => b.payment && b.payment.status === 'PENDING').length,
      paidBookings: enhancedBookings.filter(b => b.payment && ['ESCROW', 'HELD_IN_ESCROW', 'RELEASED', 'COMPLETED'].includes(b.payment.status)).length,
      lastUpdated: new Date().toISOString(),
    };

    // Generate ETag for conditional requests
    const dataHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(enhancedBookings))
      .digest('hex');
    
    const responseETag = `"${dataHash}"`;

    // Check if client has up-to-date data
    if (!forceRefresh && etag === responseETag) {
      if (process.env.NODE_ENV === 'development') {

        console.log('📦 Client has up-to-date data, returning 304');

      }
      return new NextResponse(null, { status: 304 });
    }

    // Prepare response
    const responseData = {
      success: true,
      bookings: enhancedBookings,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Create response with appropriate headers
    const response = NextResponse.json(responseData);
    
    // Set cache headers based on data type
    const hasPendingPayments = metadata.pendingPayments > 0;
    const cacheHeaders = hasPendingPayments ? CACHE_HEADERS.PAYMENT_DATA : CACHE_HEADERS.BOOKING_DATA;
    
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Set ETag for conditional requests
    response.headers.set('ETag', responseETag);
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match');

    if (process.env.NODE_ENV === 'development') {


      console.log(`📤 Returning ${enhancedBookings.length} bookings with metadata:`, metadata);


    }

    return response;

  } catch (error) {
    console.error('❌ Synchronized bookings API error:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });

    // Set no-cache headers for error responses
    Object.entries(CACHE_HEADERS.PAYMENT_DATA).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  // SECURITY: Restrict CORS to production URL instead of wildcard
  // Frontend uses relative URLs, so this is safe
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '*'
    : request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
      'Access-Control-Max-Age': '86400',
    },
  });
}
