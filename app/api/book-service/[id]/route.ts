import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db-utils";

export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  const startTime = Date.now()
  let dbQueryTime = 0
  
  try {
    // console.time('🔍 GET /api/book-service/[id] - Total')
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathname } = request.nextUrl;
    const match = pathname.match(/book-service\/([^/]+)/);
    const bookingId = match ? match[1] : null;
    
    if (!bookingId) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // console.time('💾 Database Query')
    // Get booking with optimized includes - only fetch what's needed
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        totalAmount: true,
        address: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        paymentMethod: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      }
    });
    // console.timeEnd('💾 Database Query')
    dbQueryTime = Date.now() - startTime

    if (!booking) {
      // console.timeEnd('🔍 GET /api/book-service/[id] - Total')
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if user has access to this booking
    if (user.role === "CLIENT" && booking.client.id !== user.id) {
      // console.timeEnd('🔍 GET /api/book-service/[id] - Total')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PROVIDER" && booking.provider?.id !== user.id) {
      // console.timeEnd('🔍 GET /api/book-service/[id] - Total')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalTime = Date.now() - startTime
    
    // Performance logging
    console.log(`⚡ GET /api/book-service/${bookingId} - Performance:`, {
      totalTime: `${totalTime}ms`,
      dbQueryTime: `${dbQueryTime}ms`,
      cacheHit: false, // Will be true when we implement Redis caching
      userId: user.id,
      userRole: user.role
    })

    // Add performance headers
    const response = NextResponse.json(booking)
    response.headers.set('X-Response-Time', `${totalTime}ms`)
    response.headers.set('X-DB-Query-Time', `${dbQueryTime}ms`)
    response.headers.set('Cache-Control', 'private, max-age=30') // Cache for 30 seconds

    // console.timeEnd('🔍 GET /api/book-service/[id] - Total')
    return response

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ GET /api/book-service/[id] - Error after ${totalTime}ms:`, error)
    // console.timeEnd('🔍 GET /api/book-service/[id] - Total')
    
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

