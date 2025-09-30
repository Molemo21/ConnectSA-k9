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

    // Use centralized admin data service with filters
    const result = await adminDataService.getUsers(page, limit, {
      search: search || undefined,
      status: status || undefined,
      role: role || undefined
    })

    const totalPages = Math.ceil(result.total / limit)

    const response = {
      users: result.users,
      pagination: {
        page,
        limit,
        totalCount: result.total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    console.log('Admin users API: Successfully fetched users:', response.pagination.totalCount, 'of', result.total)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching users:", error)
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