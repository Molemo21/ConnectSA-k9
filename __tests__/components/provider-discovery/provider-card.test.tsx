import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ProviderCard } from '@/components/provider-discovery/provider-card'

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

const mockProvider = {
  id: 'provider-1',
  businessName: 'Hair Studio Pro',
  description: 'Professional haircut and styling services with years of experience',
  experience: 5,
  location: 'Test City, Test State',
  hourlyRate: 30.0,
  averageRating: 4.8,
  totalReviews: 25,
  completedJobs: 150,
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    avatar: 'avatar1.jpg'
  },
  service: {
    name: 'Haircut',
    description: 'Professional haircut and styling services',
    category: 'Beauty & Personal Care'
  },
  recentReviews: [
    {
      id: 'review-1',
      rating: 5,
      comment: 'Excellent service! Very professional and skilled.',
      createdAt: new Date('2024-08-01'),
      client: { name: 'Sarah M.' }
    },
    {
      id: 'review-2',
      rating: 4,
      comment: 'Great haircut, friendly service.',
      createdAt: new Date('2024-07-28'),
      client: { name: 'Mike R.' }
    }
  ]
}

const defaultProps = {
  provider: mockProvider,
  onAccept: jest.fn(),
  onDecline: jest.fn(),
  onViewDetails: jest.fn()
}

describe('ProviderCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders provider information correctly', () => {
    render(<ProviderCard {...defaultProps} />)

    // Check business name
    expect(screen.getByText('Hair Studio Pro')).toBeInTheDocument()
    
    // Check description
    expect(screen.getByText('Professional haircut and styling services with years of experience')).toBeInTheDocument()
    
    // Check experience
    expect(screen.getByText('5 years experience')).toBeInTheDocument()
    
    // Check location
    expect(screen.getByText('Test City, Test State')).toBeInTheDocument()
    
    // Check hourly rate
    expect(screen.getByText('$30.00/hr')).toBeInTheDocument()
    
    // Check rating
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument()
    
    // Check completed jobs
    expect(screen.getByText('150 completed jobs')).toBeInTheDocument()
  })

  it('renders user avatar and name', () => {
    render(<ProviderCard {...defaultProps} />)

    const avatar = screen.getByAltText('John Doe')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'avatar1.jpg')
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders service information', () => {
    render(<ProviderCard {...defaultProps} />)

    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('Beauty & Personal Care')).toBeInTheDocument()
  })

  it('renders recent reviews', () => {
    render(<ProviderCard {...defaultProps} />)

    expect(screen.getByText('Excellent service! Very professional and skilled.')).toBeInTheDocument()
    expect(screen.getByText('Great haircut, friendly service.')).toBeInTheDocument()
    expect(screen.getByText('Sarah M.')).toBeInTheDocument()
    expect(screen.getByText('Mike R.')).toBeInTheDocument()
  })

  it('calls onAccept when Accept button is clicked', async () => {
    render(<ProviderCard {...defaultProps} />)

    const acceptButton = screen.getByRole('button', { name: /accept/i })
    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(defaultProps.onAccept).toHaveBeenCalledWith('provider-1')
    })
  })

  it('calls onDecline when Decline button is clicked', async () => {
    render(<ProviderCard {...defaultProps} />)

    const declineButton = screen.getByRole('button', { name: /decline/i })
    fireEvent.click(declineButton)

    await waitFor(() => {
      expect(defaultProps.onDecline).toHaveBeenCalledWith('provider-1')
    })
  })

  it('calls onViewDetails when View Details button is clicked', async () => {
    render(<ProviderCard {...defaultProps} />)

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i })
    fireEvent.click(viewDetailsButton)

    await waitFor(() => {
      expect(defaultProps.onViewDetails).toHaveBeenCalledWith(mockProvider)
    })
  })

  it('displays recent reviews when available', () => {
    const providerWithReviews = {
      ...mockProvider,
      recentReviews: [
        {
          id: 'review-1',
          rating: 5,
          comment: 'Excellent service! Very professional and skilled.',
          client: { name: 'Sarah M.' },
          createdAt: '2024-01-15T00:00:00Z'
        },
        {
          id: 'review-2',
          rating: 4,
          comment: 'Great haircut, friendly service.',
          client: { name: 'Mike R.' },
          createdAt: '2024-01-10T00:00:00Z'
        }
      ]
    }

    render(<ProviderCard {...defaultProps} provider={providerWithReviews} />)

    // Click to show reviews
    const showReviewsButton = screen.getByRole('button', { name: /show reviews/i })
    fireEvent.click(showReviewsButton)

    // Check if review content is displayed
    expect(screen.getByText('Excellent service! Very professional and skilled.')).toBeInTheDocument()
    expect(screen.getByText('Great haircut, friendly service.')).toBeInTheDocument()
    expect(screen.getByText('Sarah M.')).toBeInTheDocument()
    expect(screen.getByText('Mike R.')).toBeInTheDocument()
  })

  it('displays stars for rating', () => {
    const providerWithReviews = {
      ...mockProvider,
      recentReviews: [
        {
          id: 'review-1',
          rating: 4,
          comment: 'Great service!',
          client: { name: 'John D.' },
          createdAt: '2024-01-15T00:00:00Z'
        }
      ]
    }

    render(<ProviderCard {...defaultProps} provider={providerWithReviews} />)

    // Click to show reviews
    const showReviewsButton = screen.getByRole('button', { name: /show reviews/i })
    fireEvent.click(showReviewsButton)

    // Check if star icons are rendered (5 stars total, 4 filled for 4 rating)
    const stars = screen.getAllByRole('img', { hidden: true })
    expect(stars).toHaveLength(5)
  })

  it('handles provider without avatar gracefully', () => {
    const providerWithoutAvatar = {
      ...mockProvider,
      user: {
        ...mockProvider.user,
        avatar: null
      }
    }

    render(<ProviderCard {...defaultProps} provider={providerWithoutAvatar} />)

    // Should show fallback avatar with initials
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('handles provider without recent reviews', () => {
    const providerWithoutReviews = {
      ...mockProvider,
      recentReviews: []
    }

    render(<ProviderCard {...defaultProps} provider={providerWithoutReviews} />)

    // Should not show recent reviews section when there are no reviews
    expect(screen.queryByText('Recent Reviews')).not.toBeInTheDocument()
  })

  it('displays correct button states', () => {
    render(<ProviderCard {...defaultProps} />)

    const acceptButton = screen.getByRole('button', { name: /accept/i })
    const declineButton = screen.getByRole('button', { name: /decline/i })
    const viewDetailsButton = screen.getByRole('button', { name: /view details/i })

    expect(acceptButton).toBeEnabled()
    expect(declineButton).toBeEnabled()
    expect(viewDetailsButton).toBeEnabled()
  })

  it('formats price correctly', () => {
    const providerWithDecimalPrice = {
      ...mockProvider,
      hourlyRate: 29.99
    }

    render(<ProviderCard {...defaultProps} provider={providerWithDecimalPrice} />)

    expect(screen.getByText('$29.99/hr')).toBeInTheDocument()
  })

  it('displays zero rating correctly', () => {
    const providerWithZeroRating = {
      ...mockProvider,
      averageRating: 0,
      totalReviews: 0,
      recentReviews: []
    }
    render(<ProviderCard {...defaultProps} provider={providerWithZeroRating} />)

    // Look for the rating in the stats section specifically
    const statsSection = screen.getByText('Average Rating').closest('div')
    const ratingElement = within(statsSection!).getByText('0')
    expect(ratingElement).toBeInTheDocument()
    expect(screen.getByText('(0 reviews)')).toBeInTheDocument()
  })
}) 