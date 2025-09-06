import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProviderDiscovery } from '@/components/provider-discovery/provider-discovery'

// Mock the toast utility
jest.mock('@/lib/toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    loading: jest.fn(),
  },
  handleApiError: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

const mockProviders = [
  {
    id: 'provider-1',
    businessName: 'Hair Studio Pro',
    description: 'Professional hair styling services',
    experience: 5,
    location: 'Test City, Test State',
    hourlyRate: 50,
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      avatar: null
    },
    service: {
      name: 'Haircut',
      description: 'Professional haircut and styling',
      category: 'Beauty & Personal Care'
    },
    averageRating: 4.8,
    totalReviews: 25,
    completedJobs: 150,
    recentReviews: [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Excellent service!',
        createdAt: '2024-08-01',
        client: { name: 'Client 1' }
      }
    ],
    isAvailable: true
  },
  {
    id: 'provider-2',
    businessName: 'Elite Hair Salon',
    description: 'Luxury hair care and styling',
    experience: 8,
    location: 'Test City, Test State',
    hourlyRate: 75,
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      avatar: null
    },
    service: {
      name: 'Haircut',
      description: 'Premium haircut and styling services',
      category: 'Beauty & Personal Care'
    },
    averageRating: 4.9,
    totalReviews: 42,
    completedJobs: 300,
    recentReviews: [
      {
        id: 'review-2',
        rating: 5,
        comment: 'Amazing work!',
        createdAt: '2024-08-01',
        client: { name: 'Client 2' }
      }
    ],
    isAvailable: true
  }
]

describe('ProviderDiscovery', () => {
  // Use a valid 25-character ID to satisfy client-side format checks (cuid-like)
  const validServiceId = 'clabcdefghijklmnoqrstuvwx'
  const defaultProps = {
    serviceId: validServiceId,
    date: '2024-08-15',
    time: '14:00',
    address: '123 Test Street, Test City',
    notes: 'Test notes',
    onProviderSelected: jest.fn(),
    onBack: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<ProviderDiscovery {...defaultProps} />)

    expect(screen.getByText('Discovering available providers...')).toBeInTheDocument()
  })

  it('fetches providers on mount', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/book-service/discover-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: validServiceId,
          date: '2024-08-15',
          time: '14:00',
          address: '123 Test Street, Test City'
        })
      })
    })
  })

  it('displays providers after successful fetch', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for loading to complete and providers to be displayed
    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Check that we can see the first provider (multiple occurrences may render)
    expect(screen.getAllByText('Provider 1 of 2').length).toBeGreaterThan(0)
  })

  it('shows current provider index and total count', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getAllByText('Provider 1 of 2').length).toBeGreaterThan(0)
    })
  })

  it('navigates to next provider', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
      expect(screen.getAllByText('Provider 2 of 2').length).toBeGreaterThan(0)
    })
  })

  it('navigates to previous provider', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    // Go to next provider first
    const nextButton = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })

    // Then go back
    const prevButton = screen.getByRole('button', { name: /previous/i })
    fireEvent.click(prevButton)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
      expect(screen.getAllByText('Provider 1 of 2').length).toBeGreaterThan(0)
    })
  })

  it('handles provider acceptance', async () => {
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve({
        providers: [
          {
            id: 'provider-1',
            businessName: 'Hair Studio Pro',
            description: 'Professional hair styling services',
            experience: 5,
            location: 'Downtown',
            hourlyRate: 45,
            user: { name: 'John Doe', email: 'john@example.com', avatar: null },
            service: { name: 'Haircut', description: 'Hair cutting and styling', category: 'Beauty & Personal Care' },
            averageRating: 4.8,
            totalReviews: 127,
            completedJobs: 89,
            recentReviews: [],
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        totalCount: 1
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)
    
    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for provider to load
    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    // Mock the send-offer API response
    const mockSendOfferResponse = {
      ok: true,
      json: () => Promise.resolve({ message: 'Job offer sent successfully!' })
    }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockSendOfferResponse)

    // Accept the provider
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i })
    const acceptButton = acceptButtons[acceptButtons.length - 1]
    fireEvent.click(acceptButton)

    // Wait for the send-offer API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/book-service/send-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'provider-1',
          serviceId: validServiceId,
          date: '2024-08-15',
          time: '14:00',
          address: '123 Test Street, Test City',
          notes: 'Test notes'
        })
      })
    })

    // Check if onProviderSelected was called
    expect(defaultProps.onProviderSelected).toHaveBeenCalledWith('provider-1')
  })

  it('handles provider decline', async () => {
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve({
        providers: [
          {
            id: 'provider-1',
            businessName: 'Hair Studio Pro',
            description: 'Professional hair styling services',
            experience: 5,
            location: 'Downtown',
            hourlyRate: 45,
            user: { name: 'John Doe', email: 'john@example.com', avatar: null },
            service: { name: 'Haircut', description: 'Hair cutting and styling', category: 'Beauty & Personal Care' },
            averageRating: 4.8,
            totalReviews: 127,
            completedJobs: 89,
            recentReviews: [],
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'provider-2',
            businessName: 'Elite Hair Salon',
            description: 'Luxury hair care and styling',
            experience: 8,
            location: 'Uptown',
            hourlyRate: 60,
            user: { name: 'Jane Smith', email: 'jane@example.com', avatar: null },
            service: { name: 'Haircut', description: 'Premium hair services', category: 'Beauty & Personal Care' },
            averageRating: 4.9,
            totalReviews: 203,
            completedJobs: 156,
            recentReviews: [],
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        totalCount: 2
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)
    
    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for providers to load
    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    // Decline first provider
    const declineButtons = screen.getAllByRole('button', { name: /decline/i })
    const declineButton = declineButtons[0]
    fireEvent.click(declineButton)

    // Should show second provider
    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })
  })

  it('shows retry option when all providers are declined', async () => {
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve({
        providers: [
          {
            id: 'provider-1',
            businessName: 'Elite Hair Salon',
            description: 'Luxury hair care and styling',
            experience: 8,
            location: 'Uptown',
            hourlyRate: 60,
            user: { name: 'Jane Smith', email: 'jane@example.com', avatar: null },
            service: { name: 'Haircut', description: 'Premium hair services', category: 'Beauty & Personal Care' },
            averageRating: 4.9,
            totalReviews: 203,
            completedJobs: 156,
            recentReviews: [],
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        totalCount: 1
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)
    
    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for provider to load
    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })

    // Decline the only provider
    const declineButtons2 = screen.getAllByRole('button', { name: /decline/i })
    const declineButton = declineButtons2[0]
    fireEvent.click(declineButton)

    // Should show retry button for declined providers
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry declined/i })).toBeInTheDocument()
    })
  })

  it('handles retry with declined providers', async () => {
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve({
        providers: [
          {
            id: 'provider-1',
            businessName: 'Elite Hair Salon',
            description: 'Luxury hair care and styling',
            experience: 8,
            location: 'Uptown',
            hourlyRate: 60,
            user: { name: 'Jane Smith', email: 'jane@example.com', avatar: null },
            service: { name: 'Haircut', description: 'Premium hair services', category: 'Beauty & Personal Care' },
            averageRating: 4.9,
            totalReviews: 203,
            completedJobs: 156,
            recentReviews: [],
            isAvailable: true,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        totalCount: 1
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)
    
    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for provider to load
    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })

    // Decline the provider
    const declineButtons3 = screen.getAllByRole('button', { name: /decline/i })
    const declineButton = declineButtons3[0]
    fireEvent.click(declineButton)

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry declined/i })
    fireEvent.click(retryButton)

    // Should show the provider again
    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    
    render(<ProviderDiscovery {...defaultProps} />)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Provider Discovery Failed')).toBeInTheDocument()
      expect(screen.getByText('Failed to load providers. Please try again.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  it('calls onBack when back button is clicked', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backButton)

    expect(defaultProps.onBack).toHaveBeenCalled()
  })

  it('disables navigation buttons appropriately', async () => {
    const mockFetchResponse = {
      ok: true,
      json: async () => ({
        success: true,
        providers: mockProviders,
        totalCount: 2,
        message: 'Found 2 available providers for your service'
      })
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse)

    render(<ProviderDiscovery {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    const prevButton = screen.getByRole('button', { name: /previous/i })
    const nextButton = screen.getByRole('button', { name: /next/i })

    // First provider - previous should be disabled, next should be enabled
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeEnabled()

    // Go to next provider
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Elite Hair Salon')).toBeInTheDocument()
    })

    // Second provider - both should be enabled
    expect(prevButton).toBeEnabled()
    expect(nextButton).toBeDisabled()

    // Go back to first provider
    fireEvent.click(prevButton)

    await waitFor(() => {
      expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    })

    // First provider again - previous should be disabled, next should be enabled
    expect(prevButton).toBeDisabled()
    expect(nextButton).toBeEnabled()
  })
}) 