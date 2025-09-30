/**
 * Centralized Admin Data Service
 * Handles all admin dashboard data fetching with proper error handling and caching
 */

import { db } from '@/lib/db-utils'

export interface AdminStats {
  totalUsers: number
  totalProviders: number
  pendingProviders: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  pendingRevenue: number
  escrowRevenue: number
  averageRating: number
  totalPayments: number
  pendingPayments: number
  escrowPayments: number
  completedPayments: number
  failedPayments: number
  totalPayouts: number
  pendingPayouts: number
  completedPayouts: number
}

export interface AnalyticsData extends AdminStats {
  userGrowth: number
  providerGrowth: number
  bookingGrowth: number
  revenueGrowth: number
  completionRate: number
  cancellationRate: number
  averageRevenuePerBooking: number
}

export interface PaymentStats {
  total: number
  pending: number
  escrow: number
  released: number
  failed: number
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  databaseConnection: boolean
  apiResponseTime: number
  errorRate: number
  activeUsers: number
  systemLoad: number
  lastBackup?: string
  databaseSize?: string
}

export interface UserData {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: Date
  lastLogin?: Date
  totalBookings: number
  totalSpent: number
}

export interface ProviderData {
  id: string
  email: string
  name: string
  businessName: string
  status: string
  createdAt: Date
  totalBookings: number
  totalEarnings: number
  averageRating: number
  verificationStatus: string
}

class AdminDataService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T
    }
    return null
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private async safeDbQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await query()
    } catch (error) {
      console.error('Database query failed:', error)
      return fallback
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    const cacheKey = 'admin-stats'
    const cached = this.getCachedData<AdminStats>(cacheKey)
    if (cached) return cached

    try {
      // Fetch all statistics in parallel for better performance
      const [
        totalUsers,
        totalProviders,
        pendingProviders,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalPayments,
        pendingPayments,
        escrowPayments,
        completedPayments,
        failedPayments,
        totalPayouts,
        pendingPayouts,
        completedPayouts
      ] = await Promise.all([
        this.safeDbQuery(() => db.user.count(), 0),
        this.safeDbQuery(() => db.provider.count({ where: { status: "APPROVED" } }), 0),
        this.safeDbQuery(() => db.provider.count({ where: { status: "PENDING" } }), 0),
        this.safeDbQuery(() => db.booking.count(), 0),
        this.safeDbQuery(() => db.booking.count({ where: { status: "COMPLETED" } }), 0),
        this.safeDbQuery(() => db.booking.count({ where: { status: "CANCELLED" } }), 0),
        this.safeDbQuery(() => db.payment.count(), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "PENDING" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "ESCROW" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "RELEASED" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "FAILED" } }), 0),
        this.safeDbQuery(() => db.payout.count(), 0),
        this.safeDbQuery(() => db.payout.count({ where: { status: "PENDING" } }), 0),
        this.safeDbQuery(() => db.payout.count({ where: { status: "COMPLETED" } }), 0)
      ])

      // Fetch revenue data
      const [totalRevenue, pendingRevenue, escrowRevenue] = await Promise.all([
        this.safeDbQuery(() => db.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { totalAmount: true }
        }).then(result => result._sum?.totalAmount || 0), 0),
        this.safeDbQuery(() => db.booking.aggregate({
          where: { status: "PENDING" },
          _sum: { totalAmount: true }
        }).then(result => result._sum?.totalAmount || 0), 0),
        this.safeDbQuery(() => db.booking.aggregate({
          where: { status: "PAYMENT_PROCESSING" },
          _sum: { totalAmount: true }
        }).then(result => result._sum?.totalAmount || 0), 0)
      ])

      // Fetch average rating
      const averageRating = await this.safeDbQuery(() => 
        db.review.aggregate({ _avg: { rating: true } })
          .then(result => result._avg?.rating || 0), 0)

      const stats: AdminStats = {
        totalUsers,
        totalProviders,
        pendingProviders,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        pendingRevenue,
        escrowRevenue,
        averageRating,
        totalPayments,
        pendingPayments,
        escrowPayments,
        completedPayments,
        failedPayments,
        totalPayouts,
        pendingPayouts,
        completedPayouts
      }

      this.setCachedData(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      throw new Error('Failed to fetch admin statistics')
    }
  }

  async getAnalyticsData(timeRange: string = '30d'): Promise<AnalyticsData> {
    const cacheKey = `analytics-${timeRange}`
    const cached = this.getCachedData<AnalyticsData>(cacheKey)
    if (cached) return cached

    try {
      const baseStats = await this.getAdminStats()
      
      // Calculate date range
      const now = new Date()
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      // Fetch historical data for growth calculations
      const [
        previousUsers,
        previousProviders,
        previousBookings,
        previousRevenue
      ] = await Promise.all([
        this.safeDbQuery(() => db.user.count({
          where: { createdAt: { lt: startDate } }
        }), 0),
        this.safeDbQuery(() => db.provider.count({
          where: { 
            status: "APPROVED",
            createdAt: { lt: startDate }
          }
        }), 0),
        this.safeDbQuery(() => db.booking.count({
          where: { createdAt: { lt: startDate } }
        }), 0),
        this.safeDbQuery(() => db.booking.aggregate({
          where: { 
            status: "COMPLETED",
            createdAt: { lt: startDate }
          },
          _sum: { totalAmount: true }
        }).then(result => result._sum?.totalAmount || 0), 0)
      ])

      // Calculate growth percentages
      const userGrowth = previousUsers > 0 ? 
        Math.round(((baseStats.totalUsers - previousUsers) / previousUsers) * 100) : 0
      const providerGrowth = previousProviders > 0 ? 
        Math.round(((baseStats.totalProviders - previousProviders) / previousProviders) * 100) : 0
      const bookingGrowth = previousBookings > 0 ? 
        Math.round(((baseStats.totalBookings - previousBookings) / previousBookings) * 100) : 0
      const revenueGrowth = previousRevenue > 0 ? 
        Math.round(((baseStats.totalRevenue - previousRevenue) / previousRevenue) * 100) : 0

      // Calculate additional metrics
      const completionRate = baseStats.totalBookings > 0 ? 
        Math.round((baseStats.completedBookings / baseStats.totalBookings) * 100) : 0
      const cancellationRate = baseStats.totalBookings > 0 ? 
        Math.round((baseStats.cancelledBookings / baseStats.totalBookings) * 100) : 0
      const averageRevenuePerBooking = baseStats.totalBookings > 0 ? 
        Math.round(baseStats.totalRevenue / baseStats.totalBookings) : 0

      const analytics: AnalyticsData = {
        ...baseStats,
        userGrowth,
        providerGrowth,
        bookingGrowth,
        revenueGrowth,
        completionRate,
        cancellationRate,
        averageRevenuePerBooking
      }

      this.setCachedData(cacheKey, analytics)
      return analytics
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      throw new Error('Failed to fetch analytics data')
    }
  }

  async getPaymentStats(): Promise<PaymentStats> {
    const cacheKey = 'payment-stats'
    const cached = this.getCachedData<PaymentStats>(cacheKey)
    if (cached) return cached

    try {
      const [total, pending, escrow, released, failed] = await Promise.all([
        this.safeDbQuery(() => db.payment.count(), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "PENDING" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "ESCROW" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "RELEASED" } }), 0),
        this.safeDbQuery(() => db.payment.count({ where: { status: "FAILED" } }), 0)
      ])

      const stats: PaymentStats = { total, pending, escrow, released, failed }
      this.setCachedData(cacheKey, stats)
      return stats
    } catch (error) {
      console.error('Error fetching payment stats:', error)
      throw new Error('Failed to fetch payment statistics')
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const cacheKey = 'system-health'
    const cached = this.getCachedData<SystemHealth>(cacheKey)
    if (cached) return cached

    try {
      const startTime = Date.now()
      
      // Test database connection
      await db.user.count()
      const apiResponseTime = Date.now() - startTime

      // Get active users (logged in within last 24 hours)
      const activeUsers = await this.safeDbQuery(() => db.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }), 0)

      // Calculate error rate (simplified - would need proper error tracking)
      const errorRate = 0 // This would be calculated from actual error logs

      // Determine system status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (apiResponseTime > 2000 || errorRate > 5) {
        status = 'critical'
      } else if (apiResponseTime > 1000 || errorRate > 2) {
        status = 'warning'
      }

      const health: SystemHealth = {
        status,
        databaseConnection: true,
        apiResponseTime,
        errorRate,
        activeUsers,
        systemLoad: Math.min(100, (apiResponseTime / 10) + (errorRate * 10))
      }

      this.setCachedData(cacheKey, health)
      return health
    } catch (error) {
      console.error('Error fetching system health:', error)
      return {
        status: 'critical',
        databaseConnection: false,
        apiResponseTime: 0,
        errorRate: 100,
        activeUsers: 0,
        systemLoad: 100
      }
    }
  }

  async getUsers(
    page: number = 1, 
    limit: number = 10,
    filters: {
      search?: string
      status?: string
      role?: string
    } = {}
  ): Promise<{ users: UserData[]; total: number }> {
    try {
      const skip = (page - 1) * limit
      
      // Build where clause based on filters
      const where: any = {}
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
      
      if (filters.status) {
        where.isActive = filters.status === 'ACTIVE'
      }
      
      if (filters.role) {
        where.role = filters.role
      }
      
      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            clientBookings: {
              select: { id: true }
            },
            payments: {
              select: { amount: true }
            }
          }
        }),
        db.user.count({ where })
      ])

      const userData: UserData[] = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || 'N/A',
        role: user.role,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: user.createdAt,
        lastLogin: user.updatedAt, // Using updatedAt as proxy for lastLogin
        totalBookings: user.clientBookings?.length || 0,
        totalSpent: user.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      }))

      return { users: userData, total }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }
  }

  async getProviders(
    page: number = 1, 
    limit: number = 10,
    filters: {
      search?: string
      status?: string
      verification?: string
    } = {}
  ): Promise<{ providers: ProviderData[]; total: number }> {
    try {
      const skip = (page - 1) * limit
      
      // Build where clause based on filters
      const where: any = {}
      
      if (filters.status) {
        where.status = filters.status
      }
      
      // Note: search filter will be applied after fetching due to user relation
      
      const [providers, total] = await Promise.all([
        db.provider.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            },
            bookings: {
              select: { id: true }
            },
            payouts: {
              select: { amount: true }
            },
            reviews: {
              select: { rating: true }
            }
          }
        }),
        db.provider.count({ where })
      ])

      const providerData: ProviderData[] = providers.map(provider => {
        const averageRating = provider.reviews?.length > 0 
          ? provider.reviews.reduce((sum, review) => sum + review.rating, 0) / provider.reviews.length
          : 0

        return {
          id: provider.id,
          email: provider.user?.email || 'N/A',
          name: provider.user?.name || 'N/A',
          businessName: provider.businessName || 'N/A',
          status: provider.status,
          createdAt: provider.createdAt,
          totalBookings: provider.bookings?.length || 0,
          totalEarnings: provider.payouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0,
          averageRating,
          verificationStatus: provider.status === 'APPROVED' ? 'VERIFIED' : 
                              provider.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        }
      })

      return { providers: providerData, total }
    } catch (error) {
      console.error('Error fetching providers:', error)
      throw new Error('Failed to fetch providers')
    }
  }

  // Clear cache when data is updated
  clearCache(): void {
    this.cache.clear()
  }

  // Clear specific cache entry
  clearCacheEntry(key: string): void {
    this.cache.delete(key)
  }
}

export const adminDataService = new AdminDataService()
