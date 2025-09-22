/**
 * Payment Synchronization Test Suite
 * 
 * This test suite verifies that the payment synchronization system works correctly:
 * - Frontend always reflects true database state
 * - No stale payment states are displayed
 * - Cache invalidation works properly
 * - Error handling is robust
 * - Real-time updates function correctly
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { PaymentStatusSync } from '@/components/ui/payment-status-sync';
import { SynchronizedBookingCard } from '@/components/dashboard/synchronized-booking-card';
import { SynchronizedDashboard } from '@/components/dashboard/synchronized-dashboard';
import { usePaymentSync } from '@/hooks/use-payment-sync';

// Mock fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock toast
jest.mock('@/lib/utils', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Payment Synchronization System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('PaymentStatusSync Component', () => {
    it('should display correct payment status for ESCROW payment', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'ESCROW',
        amount: 100,
        paystackRef: 'ref-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payment: mockPayment,
          booking: null,
        }),
      });

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Paid - In Escrow')).toBeInTheDocument();
      });
    });

    it('should display correct payment status for PENDING payment', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'PENDING',
        amount: 100,
        paystackRef: 'ref-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payment: mockPayment,
          booking: null,
        }),
      });

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Pending')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching payment data', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      expect(screen.getByText('Loading payment status...')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument();
      });
    });

    it('should refresh payment status when refresh button is clicked', async () => {
      const mockPayment = {
        id: 'payment-1',
        status: 'PENDING',
        amount: 100,
        paystackRef: 'ref-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            payment: mockPayment,
            booking: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            payment: { ...mockPayment, status: 'ESCROW' },
            booking: null,
          }),
        });

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Payment Pending')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh payment status');
      await act(async () => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Paid - In Escrow')).toBeInTheDocument();
      });
    });
  });

  describe('SynchronizedBookingCard Component', () => {
    const mockBooking = {
      id: 'booking-1',
      status: 'CONFIRMED',
      scheduledDate: new Date().toISOString(),
      duration: 60,
      totalAmount: 100,
      address: '123 Test St',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        name: 'Test Service',
        category: 'Cleaning',
      },
      provider: {
        id: 'provider-1',
        businessName: 'Test Provider',
        user: {
          name: 'John Doe',
          phone: '123-456-7890',
        },
      },
      client: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      payment: {
        id: 'payment-1',
        status: 'ESCROW',
        amount: 100,
        paystackRef: 'ref-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    it('should display booking information correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payment: mockBooking.payment,
          booking: mockBooking,
        }),
      });

      render(
        <SynchronizedBookingCard
          booking={mockBooking}
          onUpdate={jest.fn()}
          onRefresh={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Service')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
        expect(screen.getByText('Paid - In Escrow')).toBeInTheDocument();
      });
    });

    it('should show payment button for confirmed booking without payment', async () => {
      const bookingWithoutPayment = {
        ...mockBooking,
        payment: undefined,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          payment: null,
          booking: bookingWithoutPayment,
        }),
      });

      render(
        <SynchronizedBookingCard
          booking={bookingWithoutPayment}
          onUpdate={jest.fn()}
          onRefresh={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Pay Now')).toBeInTheDocument();
      });
    });

    it('should handle payment initialization', async () => {
      const bookingWithoutPayment = {
        ...mockBooking,
        payment: undefined,
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            payment: null,
            booking: bookingWithoutPayment,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            authorizationUrl: 'https://checkout.paystack.com/pay/abc123',
          }),
        });

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(
        <SynchronizedBookingCard
          booking={bookingWithoutPayment}
          onUpdate={jest.fn()}
          onRefresh={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Pay Now')).toBeInTheDocument();
      });

      const payButton = screen.getByText('Pay Now');
      await act(async () => {
        payButton.click();
      });

      await waitFor(() => {
        expect(window.location.href).toBe('https://checkout.paystack.com/pay/abc123');
      });
    });
  });

  describe('SynchronizedDashboard Component', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'CLIENT',
    };

    const mockBookings = [
      {
        id: 'booking-1',
        status: 'CONFIRMED',
        scheduledDate: new Date().toISOString(),
        duration: 60,
        totalAmount: 100,
        address: '123 Test St',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        service: {
          name: 'Test Service',
          category: 'Cleaning',
        },
        provider: {
          id: 'provider-1',
          businessName: 'Test Provider',
          user: {
            name: 'John Doe',
            phone: '123-456-7890',
          },
        },
        client: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        payment: {
          id: 'payment-1',
          status: 'ESCROW',
          amount: 100,
          paystackRef: 'ref-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    it('should display dashboard with user information', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bookings: mockBookings }),
        });

      render(
        <SynchronizedDashboard
          initialUser={mockUser}
          initialBookings={mockBookings}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
        expect(screen.getByText('Test Service')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<SynchronizedDashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should handle refresh button click', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bookings: mockBookings }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bookings: mockBookings }),
        });

      render(
        <SynchronizedDashboard
          initialUser={mockUser}
          initialBookings={mockBookings}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh all data');
      await act(async () => {
        refreshButton.click();
      });

      // Should show success toast (mocked)
      expect(require('@/lib/utils').showToast.success).toHaveBeenCalledWith(
        'Booking data refreshed successfully'
      );
    });

    it('should display stats correctly', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ bookings: mockBookings }),
        });

      render(
        <SynchronizedDashboard
          initialUser={mockUser}
          initialBookings={mockBookings}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Total Bookings')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Total bookings
        expect(screen.getByText('Paid Bookings')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Paid bookings
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when payment status changes', () => {
      const { invalidatePaymentCache } = require('@/hooks/use-payment-sync');
      
      // Mock localStorage
      const localStorageMock = {
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });

      invalidatePaymentCache('booking-1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'payment-cache-invalidated',
        expect.any(String)
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'payment-cache-invalidated'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument();
      });
    });

    it('should handle API errors with proper status codes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument();
      });
    });

    it('should retry failed requests when refresh button is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            payment: {
              id: 'payment-1',
              status: 'ESCROW',
              amount: 100,
              paystackRef: 'ref-123',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            booking: null,
          }),
        });

      render(
        <PaymentStatusSync
          paymentRef="ref-123"
          showRefreshButton={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load payment status')).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh payment status');
      await act(async () => {
        refreshButton.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Paid - In Escrow')).toBeInTheDocument();
      });
    });
  });
});
