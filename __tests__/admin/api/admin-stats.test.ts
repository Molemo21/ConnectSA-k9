/**
 * Admin Stats API Tests
 * Tests the admin statistics API endpoints
 */

import { NextRequest } from 'next/server'
import { GET as getStats } from '@/app/api/admin/stats/route'
import { GET as getAnalytics } from '@/app/api/admin/analytics/route'
import { GET as getSystemHealth } from '@/app/api/admin/system-health/route'

// Mock the auth and data service
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/admin-data-service', () => ({
  adminDataService: {
    getAdminStats: jest.fn(),
    getAnalyticsData: jest.fn(),
    getSystemHealth: jest.fn(),
  },
}))

import { getCurrentUser } from '@/lib/auth'
import { adminDataService } from '@/lib/admin-data-service'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockAdminDataService = adminDataService as jest.Mocked<typeof adminDataService>

describe('Admin Stats API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics for authorized admin user', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockStats = {
        totalUsers: 150,
        totalProviders: 45,
        pendingProviders: 12,
        totalBookings: 300,
        completedBookings: 250,
        cancelledBookings: 20,
        totalRevenue: 50000,
        pendingRevenue: 5000,
        escrowRevenue: 8000,
        averageRating: 4.5,
        totalPayments: 400,
        pendingPayments: 15,
        escrowPayments: 25,
        completedPayments: 300,
        failedPayments: 10,
        totalPayouts: 200,
        pendingPayouts: 5,
        completedPayouts: 180,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getAdminStats.mockResolvedValue(mockStats)

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStats)
      expect(mockAdminDataService.getAdminStats).toHaveBeenCalledTimes(1)
    })

    it('should return 401 for unauthorized user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockAdminDataService.getAdminStats).not.toHaveBeenCalled()
    })

    it('should return 401 for non-admin user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'USER',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockAdminDataService.getAdminStats).not.toHaveBeenCalled()
    })

    it('should return default stats when service fails', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getAdminStats.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/api/admin/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Should return default stats
      expect(data.totalUsers).toBe(0)
      expect(data.totalProviders).toBe(0)
      expect(data.totalBookings).toBe(0)
    })
  })

  describe('GET /api/admin/analytics', () => {
    it('should return analytics data with time range', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockAnalytics = {
        totalUsers: 200,
        totalProviders: 50,
        pendingProviders: 10,
        totalBookings: 400,
        completedBookings: 350,
        cancelledBookings: 30,
        totalRevenue: 60000,
        pendingRevenue: 5000,
        escrowRevenue: 8000,
        averageRating: 4.2,
        totalPayments: 500,
        pendingPayments: 20,
        escrowPayments: 30,
        completedPayments: 400,
        failedPayments: 15,
        totalPayouts: 250,
        pendingPayouts: 10,
        completedPayouts: 220,
        userGrowth: 25,
        providerGrowth: 20,
        bookingGrowth: 30,
        revenueGrowth: 40,
        completionRate: 87,
        cancellationRate: 7,
        averageRevenuePerBooking: 150,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getAnalyticsData.mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost:3000/api/admin/analytics?timeRange=30d')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalytics)
      expect(mockAdminDataService.getAnalyticsData).toHaveBeenCalledWith('30d')
    })

    it('should use default time range when not provided', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockAnalytics = {
        totalUsers: 200,
        userGrowth: 25,
        providerGrowth: 20,
        bookingGrowth: 30,
        revenueGrowth: 40,
        completionRate: 87,
        cancellationRate: 7,
        averageRevenuePerBooking: 150,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getAnalyticsData.mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockAdminDataService.getAnalyticsData).toHaveBeenCalledWith('30d')
    })

    it('should return default analytics when service fails', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getAnalyticsData.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/api/admin/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Should return default analytics
      expect(data.totalUsers).toBe(0)
      expect(data.userGrowth).toBe(0)
      expect(data.completionRate).toBe(0)
    })
  })

  describe('GET /api/admin/system-health', () => {
    it('should return system health data', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      const mockHealth = {
        status: 'healthy',
        databaseConnection: true,
        apiResponseTime: 150,
        errorRate: 0.5,
        activeUsers: 75,
        systemLoad: 45,
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getSystemHealth.mockResolvedValue(mockHealth)

      const request = new NextRequest('http://localhost:3000/api/admin/system-health')
      const response = await getSystemHealth(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockHealth)
      expect(mockAdminDataService.getSystemHealth).toHaveBeenCalledTimes(1)
    })

    it('should return critical health when service fails', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      }

      mockGetCurrentUser.mockResolvedValue(mockUser as any)
      mockAdminDataService.getSystemHealth.mockRejectedValue(new Error('Service error'))

      const request = new NextRequest('http://localhost:3000/api/admin/system-health')
      const response = await getSystemHealth(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Should return critical health
      expect(data.status).toBe('critical')
      expect(data.databaseConnection).toBe(false)
      expect(data.errorRate).toBe(100)
    })
  })
})
