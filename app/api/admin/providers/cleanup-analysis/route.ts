import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db-utils"
import { getUserFromRequest } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const admin = await getUserFromRequest(request)
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all providers with related data
    const providers = await db.provider.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        },
        payouts: {
          select: {
            amount: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    })

    // Calculate statistics
    const stats = {
      totalProviders: providers.length,
      incompleteProfiles: providers.filter(p => !p.businessName || p.businessName === 'N/A').length,
      unverifiedProviders: providers.filter(p => p.status === 'PENDING' && !p.verificationStatus).length,
      inactiveProviders: providers.filter(p => p.bookings.length === 0).length,
      duplicateBusinessNames: providers.filter(p => 
        p.businessName && p.businessName !== 'N/A' && 
        providers.filter(pp => pp.businessName === p.businessName).length > 1
      ).length,
      lowRatingProviders: providers.filter(p => {
        const avgRating = p.reviews.length > 0 
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length 
          : 0
        return avgRating < 3.0 && p.reviews.length > 0
      }).length
    }

    // Generate recommended actions
    const actions = []

    for (const provider of providers) {
      const bookings = provider.bookings
      const totalEarnings = provider.payouts.reduce((sum, p) => sum + p.amount, 0)
      const avgRating = provider.reviews.length > 0 
        ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / provider.reviews.length 
        : 0

      // Check for incomplete profiles
      if (!provider.businessName || provider.businessName === 'N/A') {
        actions.push({
          id: `incomplete-${provider.id}`,
          type: 'incomplete',
          provider: {
            id: provider.id,
            name: provider.user.name,
            email: provider.user.email,
            businessName: provider.businessName || 'N/A',
            status: provider.status,
            verification: provider.verificationStatus || 'Unverified',
            rating: avgRating,
            bookings: bookings.length,
            earnings: totalEarnings,
            joinedDate: provider.user.createdAt.toISOString()
          },
          recommendedAction: 'complete_profile',
          reason: 'Missing business name or incomplete profile information',
          priority: 'high'
        })
      }

      // Check for unverified providers
      if (provider.status === 'PENDING' && !provider.verificationStatus) {
        actions.push({
          id: `unverified-${provider.id}`,
          type: 'unverified',
          provider: {
            id: provider.id,
            name: provider.user.name,
            email: provider.user.email,
            businessName: provider.businessName || 'N/A',
            status: provider.status,
            verification: provider.verificationStatus || 'Unverified',
            rating: avgRating,
            bookings: bookings.length,
            earnings: totalEarnings,
            joinedDate: provider.user.createdAt.toISOString()
          },
          recommendedAction: bookings.length > 0 ? 'approve' : 'reject',
          reason: bookings.length > 0 
            ? 'Provider has bookings but is still unverified - should be approved'
            : 'Provider has no bookings and is unverified - consider rejection',
          priority: bookings.length > 0 ? 'high' : 'medium'
        })
      }

      // Check for inactive providers
      if (bookings.length === 0 && provider.status === 'APPROVED') {
        const daysSinceJoined = Math.floor((Date.now() - new Date(provider.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceJoined > 30) {
          actions.push({
            id: `inactive-${provider.id}`,
            type: 'inactive',
            provider: {
              id: provider.id,
              name: provider.user.name,
              email: provider.user.email,
              businessName: provider.businessName || 'N/A',
              status: provider.status,
              verification: provider.verificationStatus || 'Unverified',
              rating: avgRating,
              bookings: bookings.length,
              earnings: totalEarnings,
              joinedDate: provider.user.createdAt.toISOString()
            },
            recommendedAction: 'suspend',
            reason: `No bookings in ${daysSinceJoined} days since joining - consider suspension`,
            priority: 'medium'
          })
        }
      }

      // Check for low ratings
      if (avgRating < 3.0 && provider.reviews.length >= 3) {
        actions.push({
          id: `low-rating-${provider.id}`,
          type: 'low_rating',
          provider: {
            id: provider.id,
            name: provider.user.name,
            email: provider.user.email,
            businessName: provider.businessName || 'N/A',
            status: provider.status,
            verification: provider.verificationStatus || 'Unverified',
            rating: avgRating,
            bookings: bookings.length,
            earnings: totalEarnings,
            joinedDate: provider.user.createdAt.toISOString()
          },
          recommendedAction: 'suspend',
          reason: `Low average rating (${avgRating.toFixed(1)}) with ${provider.reviews.length} reviews`,
          priority: 'high'
        })
      }
    }

    // Check for duplicate business names
    const businessNameGroups = providers.reduce((acc, provider) => {
      if (provider.businessName && provider.businessName !== 'N/A') {
        if (!acc[provider.businessName]) {
          acc[provider.businessName] = []
        }
        acc[provider.businessName].push(provider)
      }
      return acc
    }, {} as Record<string, typeof providers>)

    for (const [businessName, groupProviders] of Object.entries(businessNameGroups)) {
      if (groupProviders.length > 1) {
        // Find the provider with most bookings/earnings to keep
        const primaryProvider = groupProviders.reduce((prev, current) => {
          const prevEarnings = prev.payouts.reduce((sum, p) => sum + p.amount, 0)
          const currentEarnings = current.payouts.reduce((sum, p) => sum + p.amount, 0)
          return currentEarnings > prevEarnings ? current : prev
        })

        // Mark others for merge/deletion
        for (const provider of groupProviders) {
          if (provider.id !== primaryProvider.id) {
            const totalEarnings = provider.payouts.reduce((sum, p) => sum + p.amount, 0)
            const avgRating = provider.reviews.length > 0 
              ? provider.reviews.reduce((sum, r) => sum + r.rating, 0) / provider.reviews.length 
              : 0

            actions.push({
              id: `duplicate-${provider.id}`,
              type: 'duplicate',
              provider: {
                id: provider.id,
                name: provider.user.name,
                email: provider.user.email,
                businessName: provider.businessName || 'N/A',
                status: provider.status,
                verification: provider.verificationStatus || 'Unverified',
                rating: avgRating,
                bookings: provider.bookings.length,
                earnings: totalEarnings,
                joinedDate: provider.user.createdAt.toISOString()
              },
              recommendedAction: totalEarnings === 0 ? 'delete' : 'merge',
              reason: `Duplicate business name "${businessName}" - ${totalEarnings === 0 ? 'no earnings, safe to delete' : 'has earnings, should be merged'}`,
              priority: totalEarnings === 0 ? 'low' : 'high'
            })
          }
        }
      }
    }

    // Sort actions by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    actions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    return NextResponse.json({
      stats,
      actions: actions.slice(0, 20) // Limit to top 20 actions
    })

  } catch (error) {
    console.error('Error analyzing providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
