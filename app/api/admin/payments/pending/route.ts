import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

export async function GET(request: NextRequest) {
  // Skip during build time
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
    return NextResponse.json({
      error: "Service temporarily unavailable during deployment"
    }, { status: 503 });
  }

  try {
    // Check if user is authenticated and is an admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    console.log('🔍 Admin fetching pending payments...')

    // Fetch all pending payments with related booking and provider information
    const pendingPayments = await db.payment.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        booking: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true
                  }
                }
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${pendingPayments.length} pending payments`)

    return NextResponse.json({
      success: true,
      payments: pendingPayments,
      count: pendingPayments.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error fetching pending payments:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch pending payments",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
