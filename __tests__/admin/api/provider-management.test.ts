/**
 * Provider Management API Tests
 * Tests the admin provider management API endpoints
 */

import { NextRequest } from 'next/server'
import { GET as getProviders, PUT as updateProvider } from '@/app/api/admin/providers/route'

// Mock the auth, data service, and database
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/admin-data-service', () => ({
  adminDataService: {
    getProviders: jest.fn(),
    clearCache: jest.fn(),
  },
}))

jest.mock('@/lib/db-utils', () => ({
  db: {
    provider: {
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

describe('Provider Management API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/providers', () => {
    it('should return paginated providers for authorized admin', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockProviders = [
        {
          id: '1',
          email: 'provider1@test.com',
          name: 'Provider One',
          businessName: 'Business One',
          status: 'APPROVED',
          createdAt: new Date(),
          totalBookings: 10,
          totalEarnings: 2000,
          averageRating: 4.5,
          verificationStatus: 'VERIFIED',
        },
        {
          id: '2',
          email: 'provider2@test.com',
          name: 'Provider Two',
          businessName: 'Business Two',
          status: 'PENDING',
          createdAt: new Date(),
          totalBookings: 0,
          totalEarnings: 0,
          averageRating: 0,
          verificationStatus: 'PENDING',
        },
      ]

      const mockResult = {
        providers: mockProviders,
        total: 2,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getProviders.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/providers?page=1&limit=10')
      const response = await getProviders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers).toHaveLength(2)
      expect(data.pagination.totalCount).toBe(2)
      expect(mockAdminDataService.getProviders).toHaveBeenCalledWith(1, 10)
    })

    it('should apply search filter', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockProviders = [
        {
          id: '1',
          email: 'john@test.com',
          name: 'John Provider',
          businessName: 'John Business',
          status: 'APPROVED',
          createdAt: new Date(),
          totalBookings: 5,
          totalEarnings: 1000,
          averageRating: 4.2,
          verificationStatus: 'VERIFIED',
        },
      ]

      const mockResult = {
        providers: mockProviders,
        total: 1,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getProviders.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/providers?search=john')
      const response = await getProviders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers[0].name).toBe('John Provider')
    })

    it('should apply status and verification filters', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockProviders = [
        {
          id: '1',
          email: 'verified@test.com',
          name: 'Verified Provider',
          businessName: 'Verified Business',
          status: 'APPROVED',
          createdAt: new Date(),
          totalBookings: 15,
          totalEarnings: 3000,
          averageRating: 4.8,
          verificationStatus: 'VERIFIED',
        },
      ]

      const mockResult = {
        providers: mockProviders,
        total: 1,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getProviders.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/admin/providers?status=APPROVED&verification=VERIFIED')
      const response = await getProviders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.providers[0].status).toBe('APPROVED')
      expect(data.providers[0].verificationStatus).toBe('VERIFIED')
    })
  })

  describe('PUT /api/admin/providers', () => {
    it('should approve provider', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockApprovedProvider = {
        id: 'provider-1',
        email: 'provider@test.com',
        name: 'Test Provider',
        businessName: 'Test Business',
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'admin-1',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.provider.update.mockResolvedValue(mockApprovedProvider as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'approve',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.provider.status).toBe('APPROVED')
      expect(data.message).toBe('Provider approved successfully')
      expect(mockDb.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          status: 'APPROVED',
          approvedAt: expect.any(Date),
          approvedBy: 'admin-1',
        },
      })
      expect(mockAdminDataService.clearCache).toHaveBeenCalled()
    })

    it('should reject provider', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockRejectedProvider = {
        id: 'provider-1',
        email: 'provider@test.com',
        name: 'Test Provider',
        businessName: 'Test Business',
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: 'admin-1',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.provider.update.mockResolvedValue(mockRejectedProvider as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'reject',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.provider.status).toBe('REJECTED')
      expect(data.message).toBe('Provider rejected successfully')
      expect(mockDb.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          status: 'REJECTED',
          rejectedAt: expect.any(Date),
          rejectedBy: 'admin-1',
        },
      })
    })

    it('should suspend provider', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockSuspendedProvider = {
        id: 'provider-1',
        email: 'provider@test.com',
        name: 'Test Provider',
        businessName: 'Test Business',
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy: 'admin-1',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.provider.update.mockResolvedValue(mockSuspendedProvider as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'suspend',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.provider.status).toBe('SUSPENDED')
      expect(data.message).toBe('Provider suspended successfully')
      expect(mockDb.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspendedBy: 'admin-1',
        },
      })
    })

    it('should reactivate provider', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockReactivatedProvider = {
        id: 'provider-1',
        email: 'provider@test.com',
        name: 'Test Provider',
        businessName: 'Test Business',
        status: 'APPROVED',
        reactivatedAt: new Date(),
        reactivatedBy: 'admin-1',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.provider.update.mockResolvedValue(mockReactivatedProvider as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'reactivate',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.provider.status).toBe('APPROVED')
      expect(data.message).toBe('Provider reactivated successfully')
      expect(mockDb.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          status: 'APPROVED',
          reactivatedAt: expect.any(Date),
          reactivatedBy: 'admin-1',
        },
      })
    })

    it('should update verification status', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockUpdatedProvider = {
        id: 'provider-1',
        email: 'provider@test.com',
        name: 'Test Provider',
        businessName: 'Test Business',
        status: 'APPROVED',
        verificationStatus: 'VERIFIED',
        verificationUpdatedAt: new Date(),
        verificationUpdatedBy: 'admin-1',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockDb.provider.update.mockResolvedValue(mockUpdatedProvider as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'updateVerification',
          data: { verificationStatus: 'VERIFIED' },
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.provider.verificationStatus).toBe('VERIFIED')
      expect(data.message).toBe('Provider verification status updated successfully')
      expect(mockDb.provider.update).toHaveBeenCalledWith({
        where: { id: 'provider-1' },
        data: {
          verificationStatus: 'VERIFIED',
          verificationUpdatedAt: expect.any(Date),
          verificationUpdatedBy: 'admin-1',
        },
      })
    })

    it('should return 400 for invalid action', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'invalidAction',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('should return 401 for unauthorized user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/providers', {
        method: 'PUT',
        body: JSON.stringify({
          providerId: 'provider-1',
          action: 'approve',
          data: {},
        }),
      })

      const response = await updateProvider(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
