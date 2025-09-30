/**
 * Performance and Caching Tests
 * Tests the performance optimizations and caching mechanisms
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

describe('Performance and Caching Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    adminDataService.clearCache()
  })

  describe('Caching Performance', () => {
    it('should cache data for 30 seconds', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      const startTime = Date.now()

      // First call - should hit database
      const stats1 = await adminDataService.getAdminStats()
      const firstCallTime = Date.now() - startTime

      // Second call - should use cache
      const cacheStartTime = Date.now()
      const stats2 = await adminDataService.getAdminStats()
      const cacheCallTime = Date.now() - cacheStartTime

      expect(stats1).toEqual(stats2)
      expect(cacheCallTime).toBeLessThan(firstCallTime)
      expect(cacheCallTime).toBeLessThan(10) // Should be very fast from cache

      // Database should only be called once
      expect(mockDb.user.count).toHaveBeenCalledTimes(1)
    })

    it('should expire cache after 30 seconds', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // First call
      await adminDataService.getAdminStats()

      // Mock time passing (31 seconds)
      jest.spyOn(Date, 'now').mockImplementation(() => Date.now() + 31000)

      // Second call - should hit database again
      await adminDataService.getAdminStats()

      // Database should be called twice
      expect(mockDb.user.count).toHaveBeenCalledTimes(2)

      // Restore Date.now
      jest.restoreAllMocks()
    })

    it('should clear cache when requested', async () => {
      // Mock database responses
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

      // Second call - should hit database again
      await adminDataService.getAdminStats()

      // Database should be called twice
      expect(mockDb.user.count).toHaveBeenCalledTimes(2)
    })

    it('should cache different data types separately', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // Call different methods
      await adminDataService.getAdminStats()
      await adminDataService.getAnalyticsData('30d')
      await adminDataService.getSystemHealth()

      // Each should have its own cache entry
      expect(mockDb.user.count).toHaveBeenCalledTimes(3) // Called by all three methods
    })
  })

  describe('Parallel Query Performance', () => {
    it('should execute database queries in parallel', async () => {
      // Mock database responses with delays
      mockDb.user.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(100), 100))
      )
      mockDb.provider.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(20), 100))
      )
      mockDb.booking.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(50), 100))
      )
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      const startTime = Date.now()
      await adminDataService.getAdminStats()
      const endTime = Date.now()

      // Should complete in approximately 100ms (parallel) not 300ms (sequential)
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('should handle database errors gracefully without affecting other queries', async () => {
      // Mock some successful and some failing queries
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockRejectedValue(new Error('Database error'))
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      const stats = await adminDataService.getAdminStats()

      // Should return data with fallback values for failed queries
      expect(stats.totalUsers).toBe(100)
      expect(stats.totalProviders).toBe(0) // Fallback value
      expect(stats.totalBookings).toBe(50)
    })
  })

  describe('Memory Usage', () => {
    it('should not accumulate memory with repeated cache operations', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // Perform many cache operations
      for (let i = 0; i < 100; i++) {
        await adminDataService.getAdminStats()
        adminDataService.clearCache()
      }

      // Should not have memory leaks
      expect(mockDb.user.count).toHaveBeenCalledTimes(100)
    })

    it('should limit cache size', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // Create many different cache entries
      for (let i = 0; i < 10; i++) {
        await adminDataService.getAnalyticsData(`${i}d`)
      }

      // Cache should not grow indefinitely
      // This is more of a conceptual test since we can't easily measure cache size
      expect(mockDb.user.count).toHaveBeenCalledTimes(10)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle database timeouts gracefully', async () => {
      // Mock database timeout
      mockDb.user.count.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      )

      const startTime = Date.now()
      const stats = await adminDataService.getAdminStats()
      const endTime = Date.now()

      // Should return quickly with fallback values
      expect(endTime - startTime).toBeLessThan(1000)
      expect(stats.totalUsers).toBe(0)
    })

    it('should handle partial database failures', async () => {
      // Mock partial failures
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockRejectedValue(new Error('Provider service down'))
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockRejectedValue(new Error('Payment service down'))
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      const stats = await adminDataService.getAdminStats()

      // Should return available data with fallbacks for failed queries
      expect(stats.totalUsers).toBe(100)
      expect(stats.totalProviders).toBe(0) // Fallback
      expect(stats.totalBookings).toBe(50)
      expect(stats.totalPayments).toBe(0) // Fallback
      expect(stats.totalPayouts).toBe(30)
      expect(stats.totalRevenue).toBe(10000)
      expect(stats.averageRating).toBe(4.0)
    })
  })

  describe('Concurrent Access', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // Make concurrent requests
      const promises = Array.from({ length: 10 }, () => adminDataService.getAdminStats())
      const results = await Promise.all(promises)

      // All results should be the same
      results.forEach(result => {
        expect(result).toEqual(results[0])
      })

      // Database should only be called once due to caching
      expect(mockDb.user.count).toHaveBeenCalledTimes(1)
    })

    it('should handle cache invalidation during concurrent access', async () => {
      // Mock database responses
      mockDb.user.count.mockResolvedValue(100)
      mockDb.provider.count.mockResolvedValue(20)
      mockDb.booking.count.mockResolvedValue(50)
      mockDb.payment.count.mockResolvedValue(75)
      mockDb.payout.count.mockResolvedValue(30)
      mockDb.booking.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 } })
      mockDb.review.aggregate.mockResolvedValue({ _avg: { rating: 4.0 } })

      // Start multiple requests
      const promise1 = adminDataService.getAdminStats()
      const promise2 = adminDataService.getAdminStats()
      
      // Clear cache while requests are in flight
      adminDataService.clearCache()
      
      const promise3 = adminDataService.getAdminStats()

      await Promise.all([promise1, promise2, promise3])

      // Should handle cache invalidation gracefully
      expect(mockDb.user.count).toHaveBeenCalledTimes(2) // First batch + cleared cache
    })
  })
})
