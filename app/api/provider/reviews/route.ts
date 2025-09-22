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

    // Fetch all reviews for this provider
    const reviews = await db.review.findMany({
      where: {
        providerId: provider.id
      },
      include: {
        booking: {
          include: {
            service: true,
            client: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate rating statistics
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0

    // Count ratings by star
    const ratingCounts = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }

    // Get recent reviews (last 10)
    const recentReviews = reviews.slice(0, 10)

    // Calculate rating distribution percentages
    const ratingDistribution = {
      5: totalReviews > 0 ? (ratingCounts[5] / totalReviews) * 100 : 0,
      4: totalReviews > 0 ? (ratingCounts[4] / totalReviews) * 100 : 0,
      3: totalReviews > 0 ? (ratingCounts[3] / totalReviews) * 100 : 0,
      2: totalReviews > 0 ? (ratingCounts[2] / totalReviews) * 100 : 0,
      1: totalReviews > 0 ? (ratingCounts[1] / totalReviews) * 100 : 0,
    }

    return NextResponse.json({
      totalReviews,
      averageRating,
      ratingCounts,
      ratingDistribution,
      recentReviews,
      allReviews: reviews
    })
  } catch (error) {
    console.error("Provider reviews error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
