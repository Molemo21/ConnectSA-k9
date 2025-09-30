/**
 * User Management API Tests
 * Tests the admin user management API endpoints
 */

import { NextRequest } from 'next/server'
import { GET as getUsers, PUT as updateUser } from '@/app/api/admin/users/route'

// Mock the auth, data service, and database
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/admin-data-service', () => ({
  adminDataService: {
    getUsers: jest.fn(),
    clearCache: jest.fn(),
  },
}))

jest.mock('@/lib/db-utils', () => ({
  db: {
    user: {
      update: jest.fn(),
    },
  },
}))

import { getCurrentUser } from '@/lib/auth'
import { adminDataService } from '@/lib/admin-data-service'
import { db } from '@/lib/db-utils'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockAdminDataService = adminDataService as jest.Mocked<typeof adminDataService>
const mockDb = db as jest.Mocked<typeof db>

describe('User Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/users', () => {
    it('should return paginated users for authorized admin', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          name: 'User One',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: new Date(),
          totalBookings: 5,
          totalSpent: 500,
        },
        {
          id: '2',
          email: 'user2@test.com',
          name: 'User Two',
          role: 'PROVIDER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: null,
          totalBookings: 3,
          totalSpent: 300,
        },
      ]

      const mockResult = {
        users: mockUsers,
        total: 2,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getUsers.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=10')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toHaveLength(2)
      expect(data.pagination.totalCount).toBe(2)
      expect(mockAdminDataService.getUsers).toHaveBeenCalledWith(1, 10)
    })

    it('should apply search filter', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUsers = [
        {
          id: '1',
          email: 'john@test.com',
          name: 'John Doe',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: new Date(),
          totalBookings: 5,
          totalSpent: 500,
        },
      ]

      const mockResult = {
        users: mockUsers,
        total: 1,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getUsers.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/users?search=john')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users[0].name).toBe('John Doe')
    })

    it('should apply status and role filters', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUsers = [
        {
          id: '1',
          email: 'provider@test.com',
          name: 'Provider User',
          role: 'PROVIDER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: new Date(),
          totalBookings: 10,
          totalSpent: 1000,
        },
      ]

      const mockResult = {
        users: mockUsers,
        total: 1,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getUsers.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/users?status=ACTIVE&role=PROVIDER')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users[0].role).toBe('PROVIDER')
      expect(data.users[0].status).toBe('ACTIVE')
    })

    it('should return 401 for unauthorized user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/admin/users', () => {
    it('should update user status', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        status: 'SUSPENDED',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.user.update.mockResolvedValue(mockUpdatedUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'updateStatus',
          data: { status: 'SUSPENDED' },
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.status).toBe('SUSPENDED')
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'SUSPENDED' },
      })
      expect(mockAdminDataService.clearCache).toHaveBeenCalled()
    })

    it('should update user role', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'PROVIDER',
        status: 'ACTIVE',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.user.update.mockResolvedValue(mockUpdatedUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'updateRole',
          data: { role: 'PROVIDER' },
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.role).toBe('PROVIDER')
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'PROVIDER' },
      })
    })

    it('should suspend user', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockSuspendedUser = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        status: 'SUSPENDED',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.user.update.mockResolvedValue(mockSuspendedUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'suspendUser',
          data: {},
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.status).toBe('SUSPENDED')
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'SUSPENDED' },
      })
    })

    it('should activate user', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockActivatedUser = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.user.update.mockResolvedValue(mockActivatedUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'activateUser',
          data: {},
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.status).toBe('ACTIVE')
      expect(mockDb.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: 'ACTIVE' },
      })
    })

    it('should return 400 for invalid action', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'invalidAction',
          data: {},
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('should return 401 for unauthorized user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({
          userId: 'user-1',
          action: 'updateStatus',
          data: { status: 'SUSPENDED' },
        }),
      })

      const response = await updateUser(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
