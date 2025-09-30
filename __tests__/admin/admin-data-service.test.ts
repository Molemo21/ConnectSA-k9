/**
 * Admin Data Service Tests
 * Tests the centralized admin data service functionality
 */

import { adminDataService } from '@/lib/admin-data-service'
import { db } from '@/lib/db-utils'

// Mock the database
jest.mock('@/lib/db-utils', () => ({
  db: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    provider: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    payment: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    payout: {
      count: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('Admin Data Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    adminDataService.clearCache()
  })

  describe('getAdminStats', () => {
    it('should fetch comprehensive admin statistics', async () => {
      // Mock successful database responses
      mockDb.user.count.mockResolvedValue(150)
      mockDb.provider.count.mockResolvedValueOnce(45) // APPROVED
      mockDb.provider.count.mockResolvedValueOnce(12) // PENDING
      mockDb.booking.count.mockResolvedValueOnce(300) // Total
      mockDb.booking.count.mockResolvedValueOnce(250) // COMPLETED
      mockDb.booking.count.mockResolvedValueOnce(20) // CANCELLED
      mockDb.payment.count.mockResolvedValueOnce(400) // Total
      mockDb.payment.count.mockResolvedValueOnce(15) // PENDING
      mockDb.payment.count.mockResolvedValueOnce(25) // ESCROW
      mockDb.payment.count.mockResolvedValueOnce(300) // RELEASED
      mockDb.payment.count.mockResolvedValueOnce(10) // FAILED
      mockDb.payout.count.mockResolvedValueOnce(200) // Total
      mockDb.payout.count.mockResolvedValueOnce(5) // PENDING
      mockDb.payout.count.mockResolvedValueOnce(180) // COMPLETED
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 50000 } }) // Total revenue
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 5000 } }) // Pending revenue
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 8000 } }) // Escrow revenue
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } })

      const stats = await adminDataService.getAdminStats()

      expect(stats).toEqual({
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
      })

      // Verify all database calls were made
      expect(mockDb.user.count).toHaveBeenCalledTimes(1)
      expect(mockDb.provider.count).toHaveBeenCalledTimes(2)
      expect(mockDb.booking.count).toHaveBeenCalledTimes(3)
      expect(mockDb.payment.count).toHaveBeenCalledTimes(5)
      expect(mockDb.payout.count).toHaveBeenCalledTimes(3)
      expect(mockDb.booking.aggregate).toHaveBeenCalledTimes(3)
      expect(mockDb.review.aggregate).toHaveBeenCalledTimes(1)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockDb.user.count.mockRejectedValue(new Error('Database connection failed'))

      const stats = await adminDataService.getAdminStats()

      // Should return default values when database fails
      expect(stats.totalUsers).toBe(0)
      expect(stats.totalProviders).toBe(0)
      expect(stats.totalBookings).toBe(0)
      expect(stats.totalRevenue).toBe(0)
    })

    it('should use caching for repeated calls', async () => {
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // First call
      await adminDataService.getAdminStats()
      
      // Second call should use cache
      await adminDataService.getAdminStats()

      // Database should only be called once due to caching
      expect(mockDb.user.count).toHaveBeenCalledTimes(1)
    })

    it('should clear cache when requested', async () => {
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // First call
      await adminDataService.getAdminStats()
      
      // Clear cache
      adminDataService.clearCache()
      
      // Second call should hit database again
      await adminDataService.getAdminStats()

      // Database should be called twice
      expect(mockDb.user.count).toHaveBeenCalledTimes(2)
    })
  })

  describe('getAnalyticsData', () => {
    it('should calculate growth metrics correctly', async () => {
      // Mock current stats
      mockDb.user.count.mockResolvedValueOnce(200) // Current users
      mockDb.provider.count.mockResolvedValueOnce(50) // Current providers
      mockDb.booking.count.mockResolvedValueOnce(400) // Current bookings
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 60000 } }) // Current revenue

      // Mock historical data (30 days ago)
      mockDb.user.count.mockResolvedValueOnce(150) // Previous users
      mockDb.provider.count.mockResolvedValueOnce(40) // Previous providers
      mockDb.booking.count.mockResolvedValueOnce(300) // Previous bookings
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 40000 } }) // Previous revenue

      // Mock other required data
      mockDb.provider.count.mockResolvedValueOnce(10) // Pending providers
      mockDb.booking.count.mockResolvedValueOnce(350) // Completed bookings
      mockDb.booking.count.mockResolvedValueOnce(30) // Cancelled bookings
      mockDb.payment.count.mockResolvedValue(100)
      mockDb.payout.count.mockResolvedValue(50)
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.2 } })

      const analytics = await adminDataService.getAnalyticsData('30d')

      // Calculate expected growth percentages
      const expectedUserGrowth = Math.round(((200 - 150) / 150) * 100) // 33%
      const expectedProviderGrowth = Math.round(((50 - 40) / 40) * 100) // 25%
      const expectedBookingGrowth = Math.round(((400 - 300) / 300) * 100) // 33%
      const expectedRevenueGrowth = Math.round(((60000 - 40000) / 40000) * 100) // 50%

      expect(analytics.userGrowth).toBe(expectedUserGrowth)
      expect(analytics.providerGrowth).toBe(expectedProviderGrowth)
      expect(analytics.bookingGrowth).toBe(expectedBookingGrowth)
      expect(analytics.revenueGrowth).toBe(expectedRevenueGrowth)
      expect(analytics.completionRate).toBe(Math.round((350 / 400) * 100))
      expect(analytics.cancellationRate).toBe(Math.round((30 / 400) * 100))
      expect(analytics.averageRevenuePerBooking).toBe(Math.round(60000 / 400))
    })

    it('should handle zero previous values in growth calculations', async () => {
      // Mock current stats
      mockDb.user.count.mockResolvedValueOnce(10) // Current users
      mockDb.provider.count.mockResolvedValueOnce(5) // Current providers
      mockDb.booking.count.mockResolvedValueOnce(20) // Current bookings
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 5000 } }) // Current revenue

      // Mock historical data (all zeros - new system)
      mockDb.user.count.mockResolvedValueOnce(0) // Previous users
      mockDb.provider.count.mockResolvedValueOnce(0) // Previous providers
      mockDb.booking.count.mockResolvedValueOnce(0) // Previous bookings
      mockDb.booking.aggregate.mockResolvedValueOnce({ _sum: { totalAmount: 0 } }) // Previous revenue

      // Mock other required data
      mockDb.provider.count.mockResolvedValueOnce(2) // Pending providers
      mockDb.booking.count.mockResolvedValueOnce(15) // Completed bookings
      mockDb.booking.count.mockResolvedValueOnce(2) // Cancelled bookings
      mockDb.payment.count.mockResolvedValue(25)
      mockDb.payout.count.mockResolvedValue(10)
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      const analytics = await adminDataService.getAnalyticsData('30d')

      // Growth should be 0 when previous values are 0
      expect(analytics.userGrowth).toBe(0)
      expect(analytics.providerGrowth).toBe(0)
      expect(analytics.bookingGrowth).toBe(0)
      expect(analytics.revenueGrowth).toBe(0)
    })
  })

  describe('getSystemHealth', () => {
    it('should return healthy status for good performance', async () => {
      mockDb.user.count.mockResolvedValue(50) // Active users

      const health = await adminDataService.getSystemHealth()

      expect(health.status).toBe('healthy')
      expect(health.databaseConnection).toBe(true)
      expect(health.apiResponseTime).toBeGreaterThan(0)
      expect(health.errorRate).toBe(0)
      expect(health.activeUsers).toBe(50)
      expect(health.systemLoad).toBeGreaterThanOrEqual(0)
    })

    it('should return critical status when database fails', async () => {
      mockDb.user.count.mockRejectedValue(new Error('Database connection failed'))

      const health = await adminDataService.getSystemHealth()

      expect(health.status).toBe('critical')
      expect(health.databaseConnection).toBe(false)
      expect(health.errorRate).toBe(100)
      expect(health.systemLoad).toBe(100)
    })
  })

  describe('getUsers', () => {
    it('should fetch users with pagination', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          name: 'User One',
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: new Date(),
          bookings: [{ id: '1' }, { id: '2' }],
          payments: [{ amount: 100 }, { amount: 200 }]
        },
        {
          id: '2',
          email: 'user2@test.com',
          name: 'User Two',
          role: 'PROVIDER',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLogin: null,
          bookings: [{ id: '3' }],
          payments: [{ amount: 150 }]
        }
      ]

      mockDb.user.findMany.mockResolvedValue(mockUsers)
      mockDb.user.count.mockResolvedValue(2)

      const result = await adminDataService.getUsers(1, 10)

      expect(result.users).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.users[0].totalBookings).toBe(2)
      expect(result.users[0].totalSpent).toBe(300)
      expect(result.users[1].totalBookings).toBe(1)
      expect(result.users[1].totalSpent).toBe(150)
    })
  })

  describe('getProviders', () => {
    it('should fetch providers with statistics', async () => {
      const mockProviders = [
        {
          id: '1',
          email: 'provider1@test.com',
          name: 'Provider One',
          businessName: 'Business One',
          status: 'APPROVED',
          createdAt: new Date(),
          verificationStatus: 'VERIFIED',
          bookings: [{ id: '1' }, { id: '2' }],
          payments: [{ amount: 500 }, { amount: 300 }],
          reviews: [{ rating: 5 }, { rating: 4 }]
        }
      ]

      mockDb.provider.findMany.mockResolvedValue(mockProviders)
      mockDb.provider.count.mockResolvedValue(1)

      const result = await adminDataService.getProviders(1, 10)

      expect(result.providers).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.providers[0].totalBookings).toBe(2)
      expect(result.providers[0].totalEarnings).toBe(800)
      expect(result.providers[0].averageRating).toBe(4.5)
    })
  })
})
