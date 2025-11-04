import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { adminDataService } from "@/lib/admin-data-service"
import { db } from "@/lib/db-utils"

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const verification = searchParams.get('verification') || ''

    console.log('Admin providers API: Starting request for user:', user.id, 'page:', page, 'filters:', { search, status, verification })

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Simplified query to avoid complex relations
    const [providers, total] = await Promise.all([
      db.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          businessName: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      }),
      db.provider.count({ where })
    ])

    // Transform providers data with simplified fields
    const transformedProviders = providers.map(provider => ({
      id: provider.id,
      email: provider.user?.email || 'N/A',
      name: provider.user?.name || 'N/A',
      businessName: provider.businessName || 'N/A',
      status: provider.status,
      createdAt: provider.createdAt,
      totalBookings: 0, // Simplified - would need complex query
      totalEarnings: 0, // Simplified - would need complex query
      averageRating: 0, // Simplified - would need complex query
      verificationStatus: provider.status === 'APPROVED' ? 'VERIFIED' : 
                          provider.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
    }))

    // Apply search filter
    let filteredProviders = transformedProviders
    if (search) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.businessName.toLowerCase().includes(search.toLowerCase()) ||
        provider.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    const totalPages = Math.ceil(total / limit)

    const response = {
      providers: filteredProviders,
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    console.log('Admin providers API: Successfully fetched providers:', response.pagination.totalCount, 'of', total)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json({ 
      error: 'Internal server error',
      providers: [],
      pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }, { status: 200 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { providerId, action, data } = body

    console.log('Admin providers API: Updating provider:', providerId, 'action:', action)

    // Handle different provider management actions
    switch (action) {
      case 'approve':
        const approvedProvider = await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'APPROVED'
          }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ 
          success: true, 
          provider: approvedProvider,
          message: 'Provider approved successfully'
        })

      case 'reject':
        const rejectedProvider = await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'REJECTED'
          }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ 
          success: true, 
          provider: rejectedProvider,
          message: 'Provider rejected successfully'
        })

      case 'suspend':
        const suspendedProvider = await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'SUSPENDED'
          }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ 
          success: true, 
          provider: suspendedProvider,
          message: 'Provider suspended successfully'
        })

      case 'reactivate':
        const reactivatedProvider = await db.provider.update({
          where: { id: providerId },
          data: { 
            status: 'APPROVED'
          }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ 
          success: true, 
          provider: reactivatedProvider,
          message: 'Provider reactivated successfully'
        })

      case 'updateVerification':
        const verificationUpdatedProvider = await db.provider.update({
          where: { id: providerId },
          data: { 
            verificationStatus: data.verificationStatus,
            verificationUpdatedAt: new Date(),
            verificationUpdatedBy: user.id
          }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ 
          success: true, 
          provider: verificationUpdatedProvider,
          message: 'Provider verification status updated successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating provider:", error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ 
      error: errorMessage,
      message: errorMessage 
    }, { status: 500 })
  }
}