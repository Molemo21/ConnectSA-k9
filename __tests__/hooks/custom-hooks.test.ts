import { renderHook, waitFor } from '@testing-library/react'
import { useBookingData } from '@/hooks/use-booking-data'
import { usePaymentCallback } from '@/hooks/use-payment-callback'
import { useNotifications } from '@/hooks/use-notifications'
import { useLogout } from '@/hooks/use-logout'

// Mock fetch
global.fetch = jest.fn()

describe('Custom Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('useBookingData', () => {
    it('should fetch booking data successfully', async () => {
      const mockBookingData = {
        id: 'booking-123',
        status: 'PENDING',
        service: { name: 'Carpet Cleaning' },
        provider: { name: 'John Doe' }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookingData,
      })

      const { result } = renderHook(() => useBookingData('booking-123'))

      await waitFor(() => {
        expect(result.current.data).toEqual(mockBookingData)
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(null)
      })
    })

    it('should handle fetch error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useBookingData('booking-123'))

      await waitFor(() => {
        expect(result.current.data).toBe(null)
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Network error')
      })
    })

    it('should refetch data when booking ID changes', async () => {
      const mockBookingData1 = { id: 'booking-1', status: 'PENDING' }
      const mockBookingData2 = { id: 'booking-2', status: 'CONFIRMED' }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBookingData1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBookingData2,
        })

      const { result, rerender } = renderHook(
        ({ bookingId }) => useBookingData(bookingId),
        { initialProps: { bookingId: 'booking-1' } }
      )

      await waitFor(() => {
        expect(result.current.data).toEqual(mockBookingData1)
      })

      rerender({ bookingId: 'booking-2' })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockBookingData2)
      })
    })
  })

  describe('usePaymentCallback', () => {
    it('should handle successful payment callback', async () => {
      const mockPaymentData = {
        reference: 'PAY_123456',
        status: 'success',
        amount: 150
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaymentData,
      })

      const { result } = renderHook(() => usePaymentCallback())

      await waitFor(() => {
        expect(result.current.processPaymentCallback).toBeDefined()
      })

      const callbackResult = await result.current.processPaymentCallback('PAY_123456')
      
      expect(callbackResult).toEqual(mockPaymentData)
    })

    it('should handle payment callback error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Payment failed'))

      const { result } = renderHook(() => usePaymentCallback())

      await waitFor(() => {
        expect(result.current.processPaymentCallback).toBeDefined()
      })

      await expect(result.current.processPaymentCallback('PAY_123456')).rejects.toThrow('Payment failed')
    })
  })

  describe('useNotifications', () => {
    it('should show notification', () => {
      const { result } = renderHook(() => useNotifications())

      expect(result.current.showNotification).toBeDefined()
      
      result.current.showNotification('Test message', 'success')
      
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].message).toBe('Test message')
      expect(result.current.notifications[0].type).toBe('success')
    })

    it('should remove notification', () => {
      const { result } = renderHook(() => useNotifications())

      result.current.showNotification('Test message', 'success')
      expect(result.current.notifications).toHaveLength(1)

      result.current.removeNotification(result.current.notifications[0].id)
      expect(result.current.notifications).toHaveLength(0)
    })

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotifications())

      result.current.showNotification('Message 1', 'success')
      result.current.showNotification('Message 2', 'error')
      expect(result.current.notifications).toHaveLength(2)

      result.current.clearNotifications()
      expect(result.current.notifications).toHaveLength(0)
    })
  })

  describe('useLogout', () => {
    it('should logout successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useLogout())

      await waitFor(() => {
        expect(result.current.logout).toBeDefined()
      })

      await result.current.logout()

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('should handle logout error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Logout failed'))

      const { result } = renderHook(() => useLogout())

      await waitFor(() => {
        expect(result.current.logout).toBeDefined()
      })

      await expect(result.current.logout()).rejects.toThrow('Logout failed')
    })
  })
})
