/**
 * Admin Dashboard Integration Tests
 * Tests the integration between admin dashboard components and APIs
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AdminAnalytics } from '@/components/admin/admin-analytics'
import { AdminSystemHealth } from '@/components/admin/admin-system-health'
import { AdminUserManagementEnhanced } from '@/components/admin/admin-user-management-enhanced'
import { AdminProviderManagementEnhanced } from '@/components/admin/admin-provider-management-enhanced'
import { AdminAuditLogsEnhanced } from '@/components/admin/admin-audit-logs-enhanced'

// Mock fetch globally
global.fetch = jest.fn()

// Mock toast
jest.mock('@/lib/toast', () => ({
  showToast: jest.fn(),
}))

// Mock components that might cause issues
jest.mock('@/components/ui/brand-header-client', () => ({
  BrandHeaderClient: () => <div data-testid="brand-header">Brand Header</div>,
}))

jest.mock('@/components/ui/mobile-bottom-nav', () => ({
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav">Mobile Bottom Nav</div>,
}))

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe('Admin Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('AdminAnalytics Component', () => {
    it('should fetch and display analytics data', async () => {
      const mockAnalyticsData = {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalyticsData,
      } as Response)

      render(<AdminAnalytics />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument() // Total users
        expect(screen.getByText('50')).toBeInTheDocument() // Total providers
        expect(screen.getByText('400')).toBeInTheDocument() // Total bookings
      })

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?timeRange=30d')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<AdminAnalytics />)

      // Should show loading state initially
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument()

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument() // Default values
      })
    })

    it('should change time range and refetch data', async () => {
      const mockAnalyticsData = {
        totalUsers: 200,
        userGrowth: 25,
        providerGrowth: 20,
        bookingGrowth: 30,
        revenueGrowth: 40,
        completionRate: 87,
        cancellationRate: 7,
        averageRevenuePerBooking: 150,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAnalyticsData,
      } as Response)

      render(<AdminAnalytics />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument()
      })

      // Change time range
      const timeRangeSelect = screen.getByDisplayValue('30d')
      fireEvent.change(timeRangeSelect, { target: { value: '7d' } })

      // Should make new API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?timeRange=7d')
      })
    })
  })

  describe('AdminSystemHealth Component', () => {
    it('should fetch and display system health data', async () => {
      const mockHealthData = {
        status: 'healthy',
        databaseConnection: true,
        apiResponseTime: 150,
        errorRate: 0.5,
        activeUsers: 75,
        systemLoad: 45,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      } as Response)

      render(<AdminSystemHealth />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Healthy')).toBeInTheDocument()
        expect(screen.getByText('75')).toBeInTheDocument() // Active users
        expect(screen.getByText('150ms')).toBeInTheDocument() // Response time
        expect(screen.getByText('0.5%')).toBeInTheDocument() // Error rate
      })

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/system-health')
    })

    it('should show critical status when system is unhealthy', async () => {
      const mockHealthData = {
        status: 'critical',
        databaseConnection: false,
        apiResponseTime: 0,
        errorRate: 100,
        activeUsers: 0,
        systemLoad: 100,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      } as Response)

      render(<AdminSystemHealth />)

      await waitFor(() => {
        expect(screen.getByText('Critical')).toBeInTheDocument()
        expect(screen.getByText('Critical System Issues Detected')).toBeInTheDocument()
      })
    })

    it('should refresh data when refresh button is clicked', async () => {
      const mockHealthData = {
        status: 'healthy',
        databaseConnection: true,
        apiResponseTime: 150,
        errorRate: 0.5,
        activeUsers: 75,
        systemLoad: 45,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockHealthData,
      } as Response)

      render(<AdminSystemHealth />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Healthy')).toBeInTheDocument()
      })

      // Click refresh button
      const refreshButton = screen.getByText('Refresh')
      fireEvent.click(refreshButton)

      // Should make another API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('AdminUserManagementEnhanced Component', () => {
    it('should fetch and display users with pagination', async () => {
      const mockUsersData = {
        users: [
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
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(<AdminUserManagementEnhanced />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument()
        expect(screen.getByText('User Two')).toBeInTheDocument()
        expect(screen.getByText('user1@test.com')).toBeInTheDocument()
        expect(screen.getByText('user2@test.com')).toBeInTheDocument()
      })

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?page=1&limit=10&search=&status=all&role=all')
    })

    it('should filter users by search term', async () => {
      const mockUsersData = {
        users: [
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
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(<AdminUserManagementEnhanced />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Search for user
      const searchInput = screen.getByPlaceholderText('Search users by name or email...')
      fireEvent.change(searchInput, { target: { value: 'john' } })

      // Should make new API call with search term
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?page=1&limit=10&search=john&status=all&role=all')
      })
    })

    it('should filter users by status and role', async () => {
      const mockUsersData = {
        users: [],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUsersData,
      } as Response)

      render(<AdminUserManagementEnhanced />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('No users found matching your criteria.')).toBeInTheDocument()
      })

      // Change status filter
      const statusSelect = screen.getByDisplayValue('All Status')
      fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } })

      // Change role filter
      const roleSelect = screen.getByDisplayValue('All Roles')
      fireEvent.change(roleSelect, { target: { value: 'PROVIDER' } })

      // Should make new API call with filters
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?page=1&limit=10&search=&status=ACTIVE&role=PROVIDER')
      })
    })
  })

  describe('AdminProviderManagementEnhanced Component', () => {
    it('should fetch and display providers with actions', async () => {
      const mockProvidersData = {
        providers: [
          {
            id: '1',
            email: 'provider1@test.com',
            name: 'Provider One',
            businessName: 'Business One',
            status: 'PENDING',
            createdAt: new Date(),
            totalBookings: 0,
            totalEarnings: 0,
            averageRating: 0,
            verificationStatus: 'PENDING',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProvidersData,
      } as Response)

      render(<AdminProviderManagementEnhanced />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Provider One')).toBeInTheDocument()
        expect(screen.getByText('Business One')).toBeInTheDocument()
        expect(screen.getByText('provider1@test.com')).toBeInTheDocument()
      })

      // Should show action buttons for pending provider
      expect(screen.getByText('Approve')).toBeInTheDocument()
      expect(screen.getByText('Reject')).toBeInTheDocument()
    })

    it('should handle provider approval action', async () => {
      const mockProvidersData = {
        providers: [
          {
            id: '1',
            email: 'provider1@test.com',
            name: 'Provider One',
            businessName: 'Business One',
            status: 'PENDING',
            createdAt: new Date(),
            totalBookings: 0,
            totalEarnings: 0,
            averageRating: 0,
            verificationStatus: 'PENDING',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProvidersData,
      } as Response)

      render(<AdminProviderManagementEnhanced />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Provider One')).toBeInTheDocument()
      })

      // Mock successful approval response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Provider approved successfully',
        }),
      } as Response)

      // Click approve button
      const approveButton = screen.getByText('Approve')
      fireEvent.click(approveButton)

      // Should make API call for approval
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/providers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            providerId: '1',
            action: 'approve',
            data: {},
          }),
        })
      })
    })
  })

  describe('AdminAuditLogsEnhanced Component', () => {
    it('should fetch and display audit logs', async () => {
      const mockLogsData = {
        logs: [
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
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogsData,
      } as Response)

      render(<AdminAuditLogsEnhanced />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('LOGIN')).toBeInTheDocument()
        expect(screen.getByText('USER')).toBeInTheDocument()
        expect(screen.getByText('Success')).toBeInTheDocument()
        expect(screen.getByText('Low')).toBeInTheDocument()
      })

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/audit-logs?page=1&limit=20&search=&action=all&status=all&severity=all&dateRange=7d')
    })

    it('should export audit logs', async () => {
      const mockLogsData = {
        logs: [
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
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLogsData,
      } as Response)

      // Mock CSV export response
      const mockCsvData = 'ID,Timestamp,User Name,Action,Status\n1,2024-01-01,Test User,LOGIN,SUCCESS'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([mockCsvData], { type: 'text/csv' }),
      } as Response)

      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = jest.fn()
      
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      const mockCreateElement = jest.fn(() => mockAnchor)
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
      })
      Object.defineProperty(document.body, 'appendChild', { value: jest.fn() })
      Object.defineProperty(document.body, 'removeChild', { value: jest.fn() })

      render(<AdminAuditLogsEnhanced />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument()
      })

      // Click export button
      const exportButton = screen.getByText('Export')
      fireEvent.click(exportButton)

      // Should make export API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/audit-logs/export?search=&action=all&status=all&severity=all&dateRange=7d&format=csv')
      })
    })
  })
})
