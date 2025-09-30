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
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const status = searchParams.get('status') || ''
    const severity = searchParams.get('severity') || ''
    const dateRange = searchParams.get('dateRange') || '7d'
    const format = searchParams.get('format') || 'csv'

    console.log('Admin audit logs export API: Starting export for user:', user.id)

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

    // Fetch all audit logs for export
    const logs = await db.auditLog.findMany({
      where: whereClause,
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
    })

    if (format === 'csv') {
      // Generate CSV content
      const headers = [
        'ID',
        'Timestamp',
        'User Name',
        'User Email',
        'Action',
        'Resource',
        'Resource ID',
        'Status',
        'Severity',
        'IP Address',
        'User Agent',
        'Details'
      ]

      const csvRows = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.timestamp.toISOString(),
          `"${log.userName}"`,
          `"${log.userEmail}"`,
          `"${log.action}"`,
          `"${log.resource}"`,
          `"${log.resourceId || ''}"`,
          `"${log.status}"`,
          `"${log.severity}"`,
          `"${log.ipAddress}"`,
          `"${log.userAgent}"`,
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON format
      return NextResponse.json({
        logs,
        exportInfo: {
          totalCount: logs.length,
          dateRange,
          filters: {
            search,
            action,
            status,
            severity
          },
          exportedAt: new Date().toISOString(),
          exportedBy: user.email
        }
      })
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
