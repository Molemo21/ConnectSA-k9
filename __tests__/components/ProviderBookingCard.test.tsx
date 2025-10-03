/**
 * Tests for ProviderBookingCard component
 * Ensures component renders safely with various data shapes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProviderBookingCard } from '@/components/provider/provider-booking-card';

// Mock the renderSafe utility
jest.mock('@/lib/render-safe', () => ({
  renderSafe: (value: any) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object' && value.message) return value.message;
    return String(value);
  },
  safeGet: (obj: any, path: string, fallback: any) => {
    if (!obj || typeof obj !== 'object') return fallback;
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return fallback;
      current = current[key];
    }
    return current !== undefined && current !== null ? current : fallback;
  }
}));

describe('ProviderBookingCard', () => {
  const mockBooking = {
    id: 'test-booking-1',
    service: {
      name: 'Test Service',
      category: 'Cleaning'
    },
    client: {
      id: 'client-1',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890'
    },
    scheduledDate: '2024-01-01T10:00:00Z',
    totalAmount: 500,
    status: 'PENDING',
    address: '123 Test Street',
    description: 'Test description'
  };

  const defaultProps = {
    booking: mockBooking,
    onAccept: jest.fn(),
    onDecline: jest.fn(),
    onStart: jest.fn(),
    onComplete: jest.fn(),
    onViewDetails: jest.fn(),
    onMessage: jest.fn(),
    onCall: jest.fn()
  };

  it('should render with complete booking data', () => {
    render(<ProviderBookingCard {...defaultProps} />);
    
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
  });

  it('should handle missing service data', () => {
    const bookingWithMissingService = {
      ...mockBooking,
      service: null
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithMissingService} />);
    
    // Should render fallback values
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should handle missing client data', () => {
    const bookingWithMissingClient = {
      ...mockBooking,
      client: null
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithMissingClient} />);
    
    // Should render fallback values
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should handle missing nested properties', () => {
    const bookingWithPartialData = {
      ...mockBooking,
      service: {
        name: 'Test Service'
        // missing category
      },
      client: {
        name: 'Test Client'
        // missing email and phone
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithPartialData} />);
    
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('should handle undefined values', () => {
    const bookingWithUndefined = {
      ...mockBooking,
      service: {
        name: undefined,
        category: undefined
      },
      client: {
        name: undefined,
        email: undefined
      },
      address: undefined,
      totalAmount: undefined
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithUndefined} />);
    
    // Should not crash and render fallback values
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should handle null values', () => {
    const bookingWithNull = {
      ...mockBooking,
      service: {
        name: null,
        category: null
      },
      client: {
        name: null,
        email: null
      },
      address: null,
      totalAmount: null
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithNull} />);
    
    // Should not crash and render fallback values
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should handle object values in string fields', () => {
    const bookingWithObjectValues = {
      ...mockBooking,
      service: {
        name: { message: 'Service name error' },
        category: ['Cleaning', 'Maintenance']
      },
      client: {
        name: { error: 'Client name error' },
        email: { message: 'Email error' }
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithObjectValues} />);
    
    // Should render error messages or stringified values
    expect(screen.getByText('Service name error')).toBeInTheDocument();
  });

  it('should handle array values', () => {
    const bookingWithArrayValues = {
      ...mockBooking,
      service: {
        name: ['Service', 'Name'],
        category: ['Category1', 'Category2']
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithArrayValues} />);
    
    // Should render array values safely
    expect(screen.getByText('Service, Name')).toBeInTheDocument();
  });

  it('should handle payment data safely', () => {
    const bookingWithPayment = {
      ...mockBooking,
      payment: {
        id: 'payment-1',
        status: 'PENDING',
        amount: 500
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithPayment} />);
    
    expect(screen.getByText('R500.00')).toBeInTheDocument();
  });

  it('should handle review data safely', () => {
    const bookingWithReview = {
      ...mockBooking,
      review: {
        id: 'review-1',
        rating: 5,
        comment: 'Great service!'
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithReview} showReview={true} />);
    
    expect(screen.getByText('5/5 stars')).toBeInTheDocument();
    expect(screen.getByText('Great service!')).toBeInTheDocument();
  });

  it('should handle malformed review data', () => {
    const bookingWithMalformedReview = {
      ...mockBooking,
      review: {
        id: 'review-1',
        rating: 'not-a-number',
        comment: null
      }
    };

    render(<ProviderBookingCard {...defaultProps} booking={bookingWithMalformedReview} showReview={true} />);
    
    // Should render 0/5 stars for invalid rating
    expect(screen.getByText('0/5 stars')).toBeInTheDocument();
  });

  it('should not crash with completely invalid booking data', () => {
    const invalidBooking = {
      id: null,
      service: 'not-an-object',
      client: 42,
      status: { error: 'Status error' },
      totalAmount: 'not-a-number'
    };

    // Should not throw an error
    expect(() => {
      render(<ProviderBookingCard {...defaultProps} booking={invalidBooking} />);
    }).not.toThrow();
  });

  it('should handle callback functions safely', () => {
    const mockCallbacks = {
      onAccept: jest.fn(),
      onDecline: jest.fn(),
      onStart: jest.fn(),
      onComplete: jest.fn(),
      onViewDetails: jest.fn(),
      onMessage: jest.fn(),
      onCall: jest.fn()
    };

    render(<ProviderBookingCard {...defaultProps} {...mockCallbacks} />);
    
    // Should render without errors
    expect(screen.getByText('Test Service')).toBeInTheDocument();
  });
});
