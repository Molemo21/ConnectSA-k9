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

    // Use centralized admin data service with filters
    const result = await adminDataService.getProviders(page, limit, {
      search: search || undefined,
      status: status || undefined,
      verification: verification || undefined
    })

    // Apply search filter on user-related fields (can't be done in DB query due to relation)
    let filteredProviders = result.providers
    if (search) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.name.toLowerCase().includes(search.toLowerCase()) ||
        provider.businessName.toLowerCase().includes(search.toLowerCase()) ||
        provider.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    const totalPages = Math.ceil(result.total / limit)

    const response = {
      providers: result.providers,
      pagination: {
        page,
        limit,
        totalCount: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    console.log('Admin providers API: Successfully fetched providers:', response.pagination.totalCount, 'of', result.total)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}