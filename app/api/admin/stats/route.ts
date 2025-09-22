import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getCurrentUser } from "@/lib/auth"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Admin stats API: Starting request for user:', user.id)

    // Get basic counts first (most reliable)
    const [
      totalUsers,
      totalProviders,
      pendingProviders,
      totalBookings,
      completedBookings,
      cancelledBookings
    ] = await Promise.all([
      db.user.count().catch(() => 0),
      db.provider.count({ where: { status: "APPROVED" } }).catch(() => 0),
      db.provider.count({ where: { status: "PENDING" } }).catch(() => 0),
      db.booking.count().catch(() => 0),
      db.booking.count({ where: { status: "COMPLETED" } }).catch(() => 0),
      db.booking.count({ where: { status: "CANCELLED" } }).catch(() => 0)
    ])

    // Get revenue data (might fail, so we'll handle it separately)
    let totalRevenue = 0
    let pendingRevenue = 0
    let escrowRevenue = 0
    
    try {
      const [revenueData, pendingRevenueData, escrowRevenueData] = await Promise.all([
        db.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { totalAmount: true }
        }).catch(() => ({ _sum: { totalAmount: 0 } })),
        db.booking.aggregate({
          where: { status: "PENDING" },
          _sum: { totalAmount: true }
        }).catch(() => ({ _sum: { totalAmount: 0 } })),
        db.booking.aggregate({
          where: { status: "PAYMENT_PROCESSING" },
          _sum: { totalAmount: true }
        }).catch(() => ({ _sum: { totalAmount: 0 } }))
      ])
      
      totalRevenue = revenueData._sum?.totalAmount || 0
      pendingRevenue = pendingRevenueData._sum?.totalAmount || 0
      escrowRevenue = escrowRevenueData._sum?.totalAmount || 0
    } catch (error) {
      console.log('Revenue data fetch failed, using defaults:', error)
    }

    // Get payment data (might fail, so we'll handle it separately)
    let totalPayments = 0
    let pendingPayments = 0
    let escrowPayments = 0
    let completedPayments = 0
    let failedPayments = 0
    
    try {
      const [paymentsCount, pendingPaymentsCount, escrowPaymentsCount, completedPaymentsCount, failedPaymentsCount] = await Promise.all([
        db.payment.count().catch(() => 0),
        db.payment.count({ where: { status: "PENDING" } }).catch(() => 0),
        db.payment.count({ where: { status: "ESCROW" } }).catch(() => 0),
        db.payment.count({ where: { status: "COMPLETED" } }).catch(() => 0),
        db.payment.count({ where: { status: "FAILED" } }).catch(() => 0)
      ])
      
      totalPayments = paymentsCount
      pendingPayments = pendingPaymentsCount
      escrowPayments = escrowPaymentsCount
      completedPayments = completedPaymentsCount
      failedPayments = failedPaymentsCount
    } catch (error) {
      console.log('Payment data fetch failed, using defaults:', error)
    }

    // Get payout data (might fail, so we'll handle it separately)
    let totalPayouts = 0
    let pendingPayouts = 0
    let completedPayouts = 0
    
    try {
      const [payoutsCount, pendingPayoutsCount, completedPayoutsCount] = await Promise.all([
        db.payout.count().catch(() => 0),
        db.payout.count({ where: { status: "PENDING" } }).catch(() => 0),
        db.payout.count({ where: { status: "COMPLETED" } }).catch(() => 0)
      ])
      
      totalPayouts = payoutsCount
      pendingPayouts = pendingPayoutsCount
      completedPayouts = completedPayoutsCount
    } catch (error) {
      console.log('Payout data fetch failed, using defaults:', error)
    }

    // Get average rating (might fail, so we'll handle it separately)
    let averageRating = 0
    try {
      const ratingData = await db.review.aggregate({
        _avg: { rating: true }
      })
      averageRating = ratingData._avg?.rating || 0
    } catch (error) {
      console.log('Rating data fetch failed, using default:', error)
    }

    const stats = {
      totalUsers,
      totalProviders,
      pendingProviders,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      pendingRevenue,
      escrowRevenue,
      averageRating,
      totalPayments,
      pendingPayments,
      escrowPayments,
      completedPayments,
      failedPayments,
      totalPayouts,
      pendingPayouts,
      completedPayouts
    }

    console.log('Admin stats API: Successfully fetched stats:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    
    // Return default stats if database is unavailable
    const defaultStats = {
      totalUsers: 0,
      totalProviders: 0,
      pendingProviders: 0,
      totalBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      escrowRevenue: 0,
      averageRating: 0,
      totalPayments: 0,
      pendingPayments: 0,
      escrowPayments: 0,
      completedPayments: 0,
      failedPayments: 0,
      totalPayouts: 0,
      pendingPayouts: 0,
      completedPayouts: 0
    }
    
    console.log("Returning default stats due to error:", error)
    return NextResponse.json(defaultStats)
  }
}