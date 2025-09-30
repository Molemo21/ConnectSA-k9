import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-utils'
import { getCurrentUser } from '@/lib/auth'

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

    console.log('Simple providers API: Starting request for user:', user.id, 'page:', page, 'filters:', { search, status })

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Fetch providers with minimal fields to avoid schema issues
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

    // Transform providers data
    const transformedProviders = providers.map(provider => ({
      id: provider.id,
      email: provider.user.email,
      name: provider.user.name || 'N/A',
      businessName: provider.businessName || 'N/A',
      status: provider.status,
      createdAt: provider.createdAt,
      totalBookings: 0, // Simplified for now
      totalEarnings: 0, // Simplified for now
      averageRating: 0, // Simplified for now
      verificationStatus: provider.status === 'APPROVED' ? 'VERIFIED' : 
                          provider.status === 'REJECTED' ? 'REJECTED' : 'PENDING'
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

    console.log('Simple providers API: Successfully fetched providers:', response.pagination.totalCount, 'of', total)
    return NextResponse.json(response)

  } catch (error) {
    console.error("Simple providers API error:", error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
