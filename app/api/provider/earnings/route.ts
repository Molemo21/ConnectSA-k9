import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    if (user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized - Provider role required" }, { status: 403 })
    }

    const provider = await db.provider.findUnique({
      where: { userId: user.id },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider profile not found" }, { status: 404 })
    }

    // Fetch all completed bookings with payments
    const completedBookings = await db.booking.findMany({
      where: {
        providerId: provider.id,
        status: "COMPLETED",
        payment: {
          status: {
            in: ["RELEASED", "COMPLETED"]
          }
        }
      },
      include: {
        service: true,
        payment: true,
        client: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { scheduledDate: "desc" },
    })

    // Calculate earnings by month for the last 12 months
    const monthlyEarnings = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthBookings = completedBookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledDate)
        return bookingDate >= month && bookingDate < nextMonth
      })
      
      const monthEarnings = monthBookings.reduce((sum, booking) => {
        return sum + (booking.payment?.amount || 0)
      }, 0)
      
      monthlyEarnings.push({
        month: month.toISOString().slice(0, 7), // YYYY-MM format
        earnings: monthEarnings,
        bookings: monthBookings.length
      })
    }

    // Calculate total earnings
    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.amount || 0)
    }, 0)

    // Calculate this month's earnings
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    
    const thisMonthBookings = completedBookings.filter(booking => {
      const bookingDate = new Date(booking.scheduledDate)
      return bookingDate >= thisMonth && bookingDate < nextMonth
    })
    
    const thisMonthEarnings = thisMonthBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.amount || 0)
    }, 0)

    // Calculate average earnings per booking
    const averageEarningsPerBooking = completedBookings.length > 0 
      ? totalEarnings / completedBookings.length 
      : 0

    return NextResponse.json({
      totalEarnings,
      thisMonthEarnings,
      averageEarningsPerBooking,
      monthlyEarnings,
      completedBookings: completedBookings.length,
      recentEarnings: completedBookings.slice(0, 10) // Last 10 completed bookings
    })
  } catch (error) {
    console.error("Provider earnings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
