import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
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
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const status = searchParams.get('status') || ''
    const severity = searchParams.get('severity') || ''
    const dateRange = searchParams.get('dateRange') || '7d'

    console.log('Admin audit logs API: Starting request for user:', user.id, 'page:', page)

    // Calculate date range
    const now = new Date()
    const days = dateRange === '1d' ? 1 : 
                 dateRange === '7d' ? 7 : 
                 dateRange === '30d' ? 30 : 
                 dateRange === '90d' ? 90 : 
                 dateRange === '1y' ? 365 : 7
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Build where clause
    const whereClause: any = {
      timestamp: {
        gte: startDate
      }
    }

    if (action) {
      whereClause.action = action
    }

    if (status) {
      whereClause.status = status
    }

    if (severity) {
      whereClause.severity = severity
    }

    if (search) {
      whereClause.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch audit logs with pagination
    const skip = (page - 1) * limit
    
    const [logs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          userId: true,
          userEmail: true,
          userName: true,
          action: true,
          resource: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          timestamp: true,
          status: true,
          severity: true
        }
      }),
      db.auditLog.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    const response = {
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

    console.log('Admin audit logs API: Successfully fetched logs:', response.pagination.totalCount)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, resource, resourceId, details, severity = 'LOW' } = body

    console.log('Admin audit logs API: Creating audit log for user:', user.id, 'action:', action)

    // Create audit log entry
    const auditLog = await db.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userName: user.name || 'Unknown',
        action,
        resource,
        resourceId: resourceId || null,
        details: details || {},
        ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date(),
        status: 'SUCCESS',
        severity
      }
    })

    return NextResponse.json({ success: true, auditLog })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}