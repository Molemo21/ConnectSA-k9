import { db } from '@/lib/db-utils'
import { AuditAction } from '@prisma/client'

export interface AuditLogData {
  adminId: string
  action: AuditAction | string
  targetType: string
  targetId: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Logs admin actions for audit trail
 */
export async function logAdminAction(data: AuditLogData): Promise<void> {
  try {
    // Check if adminAuditLog is available
    if (!db.adminAuditLog || typeof db.adminAuditLog.create !== 'function') {
      console.warn('AdminAuditLog not available, skipping audit logging')
      return
    }

    // Try to create the audit log entry
    const auditLog = await db.adminAuditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
    
    console.log('✅ Admin action logged successfully:', data.action, 'ID:', auditLog.id)
  } catch (error) {
    console.error('Failed to log admin action:', error)
    
    // Log to console as fallback
    console.log('📝 AUDIT LOG (Fallback):', {
      timestamp: new Date().toISOString(),
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    })
    
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Gets audit logs with pagination and filtering
 */
export async function getAuditLogs(options: {
  page?: number
  limit?: number
  adminId?: string
  action?: AuditAction
  targetType?: string
  startDate?: Date
  endDate?: Date
}) {
  const {
    page = 1,
    limit = 50,
    adminId,
    action,
    targetType,
    startDate,
    endDate,
  } = options

  const where: any = {}
  
  if (adminId) where.adminId = adminId
  if (action) where.action = action
  if (targetType) where.targetType = targetType
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.adminAuditLog.count({ where }),
  ])

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Helper function to extract IP and User Agent from request
 */
export function extractRequestInfo(request: Request): {
  ipAddress?: string
  userAgent?: string
} {
  const ipAddress = 
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}
