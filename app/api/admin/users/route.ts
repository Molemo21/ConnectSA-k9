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
    const role = searchParams.get('role') || ''

    console.log('Admin users API: Starting request for user:', user.id, 'page:', page, 'filters:', { search, status, role })

    // Simplified query to avoid complex relations
    const skip = (page - 1) * limit
    
    // Build where clause based on filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.isActive = status === 'ACTIVE'
    }
    
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      db.user.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    const response = {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || 'N/A',
        role: user.role,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: user.createdAt,
        lastLogin: user.updatedAt,
        totalBookings: 0, // Simplified - would need complex query
        totalSpent: 0 // Simplified - would need complex query
      })),
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    console.log('Admin users API: Successfully fetched users:', response.pagination.totalCount)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ 
      error: 'Internal server error',
      users: [],
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
    const { userId, action, data } = body

    console.log('Admin users API: Updating user:', userId, 'action:', action)

    // Handle different user management actions
    switch (action) {
      case 'updateStatus':
        // Update user status
        const updatedUser = await db.user.update({
          where: { id: userId },
          data: { status: data.status }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ success: true, user: updatedUser })

      case 'updateRole':
        // Update user role
        const roleUpdatedUser = await db.user.update({
          where: { id: userId },
          data: { role: data.role }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ success: true, user: roleUpdatedUser })

      case 'suspendUser':
        // Suspend user
        const suspendedUser = await db.user.update({
          where: { id: userId },
          data: { status: 'SUSPENDED' }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ success: true, user: suspendedUser })

      case 'activateUser':
        // Activate user
        const activatedUser = await db.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' }
        })
        
        // Clear cache
        adminDataService.clearCache()
        
        return NextResponse.json({ success: true, user: activatedUser })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}