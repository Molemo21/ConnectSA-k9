/**
 * Audit Logs API Tests
 * Tests the admin audit logging API endpoints
 */

import { NextRequest } from 'next/server'
import { GET as getAuditLogs, POST as createAuditLog } from '@/app/api/admin/audit-logs/route'
import { GET as exportAuditLogs } from '@/app/api/admin/audit-logs/export/route'

// Mock the auth and database
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/db-utils', () => ({
  db: {
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db-utils'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockDb = db as jest.Mocked<typeof db>

describe('Audit Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/audit-logs', () => {
    it('should return paginated audit logs for authorized admin', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: { ip: '192.168.1.1' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'LOW',
        },
        {
          id: '2',
          userId: 'admin-1',
          userEmail: 'admin@test.com',
          userName: 'Admin User',
          action: 'UPDATE',
          resource: 'PROVIDER',
          resourceId: 'provider-1',
          details: { status: 'APPROVED' },
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'MEDIUM',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)
      mockDb.auditLog.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?page=1&limit=20')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(2)
      expect(data.pagination.totalCount).toBe(2)
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(20)
    })

    it('should apply search filter', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'john@test.com',
          userName: 'John Doe',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'LOW',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)
      mockDb.auditLog.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?search=john')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs[0].userName).toBe('John Doe')
    })

    it('should apply action filter', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'LOW',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)
      mockDb.auditLog.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?action=LOGIN')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs[0].action).toBe('LOGIN')
    })

    it('should apply status and severity filters', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'HIGH',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)
      mockDb.auditLog.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?status=SUCCESS&severity=HIGH')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs[0].status).toBe('SUCCESS')
      expect(data.logs[0].severity).toBe('HIGH')
    })

    it('should apply date range filter', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'LOW',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)
      mockDb.auditLog.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs?dateRange=7d')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(1)
    })

    it('should return 401 for unauthorized user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs')
      const response = await getAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/admin/audit-logs', () => {
    it('should create audit log entry', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockAuditLog = {
        id: '1',
        userId: 'admin-1',
        userEmail: 'admin@test.com',
        userName: 'Admin User',
        action: 'UPDATE',
        resource: 'USER',
        resourceId: 'user-1',
        details: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        status: 'SUCCESS',
        severity: 'MEDIUM',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.create.mockResolvedValue(mockAuditLog as any)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'POST',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          action: 'UPDATE',
          resource: 'USER',
          resourceId: 'user-1',
          details: { status: 'SUSPENDED' },
          severity: 'MEDIUM',
        }),
      })

      const response = await createAuditLog(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.auditLog.action).toBe('UPDATE')
      expect(data.auditLog.resource).toBe('USER')
      expect(data.auditLog.severity).toBe('MEDIUM')
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          userEmail: 'admin@test.com',
          userName: 'Admin User',
          action: 'UPDATE',
          resource: 'USER',
          resourceId: 'user-1',
          details: { status: 'SUSPENDED' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: expect.any(Date),
          status: 'SUCCESS',
          severity: 'MEDIUM',
        },
      })
    })

    it('should use default severity when not provided', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockAuditLog = {
        id: '1',
        userId: 'admin-1',
        userEmail: 'admin@test.com',
        userName: 'Admin User',
        action: 'LOGIN',
        resource: 'USER',
        resourceId: 'user-1',
        details: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
        status: 'SUCCESS',
        severity: 'LOW',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.create.mockResolvedValue(mockAuditLog as any)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs', {
        method: 'POST',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
        }),
      })

      const response = await createAuditLog(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.auditLog.severity).toBe('LOW')
    })
  })

  describe('GET /api/admin/audit-logs/export', () => {
    it('should export audit logs as CSV', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: { ip: '192.168.1.1' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          status: 'SUCCESS',
          severity: 'LOW',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs/export?format=csv&dateRange=7d')
      const response = await exportAuditLogs(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('audit-logs-')
    })

    it('should export audit logs as JSON', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'LOW',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs/export?format=json&dateRange=7d')
      const response = await exportAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(1)
      expect(data.exportInfo.totalCount).toBe(1)
      expect(data.exportInfo.exportedBy).toBe('admin@test.com')
      expect(data.exportInfo.filters.dateRange).toBe('7d')
    })

    it('should apply filters during export', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          userEmail: 'user@test.com',
          userName: 'Test User',
          action: 'LOGIN',
          resource: 'USER',
          resourceId: 'user-1',
          details: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          status: 'SUCCESS',
          severity: 'HIGH',
        },
      ]

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.auditLog.findMany.mockResolvedValue(mockLogs as any)

      const request = new NextRequest('http://localhost:3000/api/admin/audit-logs/export?action=LOGIN&severity=HIGH&status=SUCCESS')
      const response = await exportAuditLogs(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs[0].action).toBe('LOGIN')
      expect(data.logs[0].severity).toBe('HIGH')
      expect(data.logs[0].status).toBe('SUCCESS')
    })
  })
})
