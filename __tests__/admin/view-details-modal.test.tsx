/**
 * View Details Modal Tests
 * Tests the user and provider details modals
 */

import { render, screen, waitFor } from '@testing-library/react'
import { AdminUserDetailsModal } from '@/components/admin/admin-user-details-modal-enhanced'
import { AdminProviderDetailsModal } from '@/components/admin/admin-provider-details-modal-enhanced'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock toast
jest.mock('@/lib/toast', () => ({
  showToast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

describe('View Details Modals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('AdminUserDetailsModal', () => {
    it('should fetch and display user details when opened', async () => {
      const mockUserData = {
        id: 'user-1',
        name: 'Molemo Nakin',
        email: 'molemonakin21@gmail.com',
        phone: '+27123456789',
        role: 'CLIENT',
        emailVerified: true,
        isActive: true,
        createdAt: new Date('2025-07-18').toISOString(),
        updatedAt: new Date('2025-09-30').toISOString(),
        bookings: [
          {
            id: 'booking-1',
            status: 'COMPLETED',
            totalAmount: 150,
            scheduledDate: new Date('2025-09-15').toISOString(),
            service: { name: 'House Cleaning' },
            provider: { user: { name: 'Thabang Nakin' } }
          }
        ],
        payments: [
          {
            id: 'payment-1',
            amount: 150,
            status: 'COMPLETED',
            currency: 'ZAR',
            createdAt: new Date('2025-09-15').toISOString()
          }
        ],
        stats: {
          totalBookings: 60,
          completedBookings: 50,
          cancelledBookings: 2,
          totalSpent: 900,
          averageBookingValue: 15
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      render(
        <AdminUserDetailsModal
          userId="user-1"
          isOpen={true}
          onClose={jest.fn()}
        />
      )

      // Should show loading initially
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Molemo Nakin')).toBeInTheDocument()
      })

      // Verify basic info displayed
      expect(screen.getByText('molemonakin21@gmail.com')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument() // Total bookings
      expect(screen.getByText(/R.*900/)).toBeInTheDocument() // Total spent

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1')
    })

    it('should show empty state when user has no bookings', async () => {
      const mockUserData = {
        id: 'user-2',
        name: 'New User',
        email: 'new@test.com',
        role: 'CLIENT',
        emailVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bookings: [],
        payments: [],
        stats: {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalSpent: 0,
          averageBookingValue: 0
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      render(
        <AdminUserDetailsModal
          userId="user-2"
          isOpen={true}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('New User')).toBeInTheDocument()
      })

      // Should show empty state for bookings
      expect(screen.getByText('No bookings yet')).toBeInTheDocument()
    })
  })

  describe('AdminProviderDetailsModal', () => {
    it('should fetch and display provider details when opened', async () => {
      const mockProviderData = {
        id: 'provider-1',
        userId: 'user-1',
        businessName: "John's services",
        description: 'Professional services',
        experience: 5,
        hourlyRate: 150,
        location: 'Cape Town',
        status: 'APPROVED',
        createdAt: new Date('2025-07-18').toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          name: 'Thabang Nakin',
          email: 'thabangnakin17@gmail.com',
          phone: '+27123456789',
          emailVerified: true
        },
        services: [
          {
            id: 'ps-1',
            customRate: 200,
            service: {
              name: 'Plumbing',
              category: 'Home Services'
            }
          }
        ],
        bookings: [
          {
            id: 'booking-1',
            status: 'COMPLETED',
            totalAmount: 300,
            scheduledDate: new Date('2025-09-20').toISOString(),
            service: { name: 'Plumbing Repair' },
            client: { name: 'John Doe' }
          }
        ],
        payouts: [
          {
            id: 'payout-1',
            amount: 2268,
            status: 'COMPLETED',
            createdAt: new Date('2025-09-25').toISOString()
          }
        ],
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: 'Excellent service!',
            createdAt: new Date('2025-09-21').toISOString()
          }
        ],
        stats: {
          totalBookings: 15,
          completedBookings: 15,
          totalEarnings: 2268,
          averageRating: 4.8,
          totalReviews: 5
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProviderData,
      } as Response)

      render(
        <AdminProviderDetailsModal
          providerId="provider-1"
          isOpen={true}
          onClose={jest.fn()}
        />
      )

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("John's services")).toBeInTheDocument()
      })

      // Verify business info
      expect(screen.getByText('Thabang Nakin')).toBeInTheDocument()
      expect(screen.getByText('thabangnakin17@gmail.com')).toBeInTheDocument()

      // Verify stats
      expect(screen.getByText('15')).toBeInTheDocument() // Total jobs
      expect(screen.getByText(/R.*2.*268/)).toBeInTheDocument() // Total earnings
      expect(screen.getByText('4.8')).toBeInTheDocument() // Average rating

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/providers/provider-1')
    })

    it('should display correct currency format in ZAR', async () => {
      const mockProviderData = {
        id: 'provider-1',
        businessName: 'Test Business',
        user: {
          name: 'Test Provider',
          email: 'test@test.com',
          emailVerified: true
        },
        stats: {
          totalBookings: 10,
          completedBookings: 8,
          totalEarnings: 1500.50,
          averageRating: 4.5,
          totalReviews: 3
        },
        services: [],
        bookings: [],
        payouts: [],
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'APPROVED'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProviderData,
      } as Response)

      render(
        <AdminProviderDetailsModal
          providerId="provider-1"
          isOpen={true}
          onClose={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument()
      })

      // Should display amounts in ZAR format (R)
      expect(screen.getByText(/R.*1.*500/)).toBeInTheDocument()
    })
  })
})
