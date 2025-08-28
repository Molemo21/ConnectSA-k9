import { useState, useEffect, useCallback, useRef } from 'react'

interface Booking {
  id: string
  status: string
  payment?: {
    id: string
    status: string
    createdAt?: string
  } | null
  [key: string]: any
}

interface UseBookingDataReturn {
  bookings: Booking[]
  refreshBooking: (id: string) => Promise<void>
  refreshAllBookings: () => Promise<void>
  isLoading: boolean
  error: string | null
}

// In-memory cache for booking data
const bookingCache = new Map<string, { data: Booking; timestamp: number; ttl: number }>()

// Cache TTL: 30 seconds for payment status, 5 minutes for other data
const PAYMENT_CACHE_TTL = 30 * 1000 // 30 seconds
const GENERAL_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useBookingData(initialBookings: Booking[] = []): UseBookingDataReturn {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshQueue = useRef<Set<string>>(new Set())
  const isRefreshing = useRef(false)

  // Initialize cache with initial data
  useEffect(() => {
    if (initialBookings.length > 0) {
      initialBookings.forEach(booking => {
        const ttl = booking.payment?.status === 'PENDING' ? PAYMENT_CACHE_TTL : GENERAL_CACHE_TTL
        bookingCache.set(booking.id, {
          data: booking,
          timestamp: Date.now(),
          ttl
        })
      })
      setBookings(initialBookings)
    }
  }, [initialBookings])

  // Get cached booking or fetch if needed
  const getCachedOrFetchBooking = useCallback(async (id: string): Promise<Booking | null> => {
    const cached = bookingCache.get(id)
    const now = Date.now()

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data
    }

    // Check if already fetching this booking
    if (refreshQueue.current.has(id)) {
      return null
    }

    try {
      refreshQueue.current.add(id)
      const response = await fetch(`/api/book-service/${id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.status}`)
      }

      const booking = await response.json()
      
      // Update cache with new data
      const ttl = booking.payment?.status === 'PENDING' ? PAYMENT_CACHE_TTL : GENERAL_CACHE_TTL
      bookingCache.set(id, {
        data: booking,
        timestamp: now,
        ttl
      })

      return booking
    } catch (err) {
      console.error(`Error fetching booking ${id}:`, err)
      return null
    } finally {
      refreshQueue.current.delete(id)
    }
  }, [])

  // Refresh a specific booking
  const refreshBooking = useCallback(async (id: string): Promise<void> => {
    if (refreshQueue.current.has(id)) {
      return // Already refreshing
    }

    try {
      const updatedBooking = await getCachedOrFetchBooking(id)
      if (updatedBooking) {
        setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b))
      }
    } catch (err) {
      console.error(`Error refreshing booking ${id}:`, err)
    }
  }, [getCachedOrFetchBooking])

  // Refresh all bookings (for manual refresh)
  const refreshAllBookings = useCallback(async (): Promise<void> => {
    if (isRefreshing.current) {
      return // Already refreshing
    }

    setIsLoading(true)
    setError(null)
    isRefreshing.current = true

    try {
      const pendingBookings = bookings.filter(b => 
        b.payment && b.payment.status === 'PENDING'
      )

      if (pendingBookings.length === 0) {
        return
      }

      // Refresh only pending payments (most likely to change)
      const refreshPromises = pendingBookings.map(booking => 
        getCachedOrFetchBooking(booking.id)
      )

      const updatedBookings = await Promise.all(refreshPromises)
      const validUpdates = updatedBookings.filter(Boolean) as Booking[]

      if (validUpdates.length > 0) {
        setBookings(prev => {
          const updated = [...prev]
          validUpdates.forEach(updatedBooking => {
            const index = updated.findIndex(b => b.id === updatedBooking.id)
            if (index !== -1) {
              updated[index] = updatedBooking
            }
          })
          return updated
        })
      }
    } catch (err) {
      setError('Failed to refresh bookings')
      console.error('Error refreshing all bookings:', err)
    } finally {
      setIsLoading(false)
      isRefreshing.current = false
    }
  }, [bookings, getCachedOrFetchBooking])

  // Auto-refresh pending payments (less aggressive)
  useEffect(() => {
    const pendingBookings = bookings.filter(b => 
      b.payment && b.payment.status === 'PENDING'
    )

    if (pendingBookings.length === 0) return

    const interval = setInterval(async () => {
      // Only refresh if not already refreshing and no manual refresh in progress
      if (isRefreshing.current || refreshQueue.current.size > 0) {
        return
      }

      // Refresh only one pending booking at a time to avoid overwhelming the server
      const randomIndex = Math.floor(Math.random() * pendingBookings.length)
      const bookingToRefresh = pendingBookings[randomIndex]
      
      if (bookingToRefresh) {
        await refreshBooking(bookingToRefresh.id)
      }
    }, 60000) // Every 60 seconds instead of 30

    return () => clearInterval(interval)
  }, [bookings, refreshBooking])

  // Clean up expired cache entries
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      for (const [id, cached] of bookingCache.entries()) {
        if ((now - cached.timestamp) > cached.ttl) {
          bookingCache.delete(id)
        }
      }
    }, 60000) // Clean up every minute

    return () => clearInterval(cleanup)
  }, [])

  return {
    bookings,
    refreshBooking,
    refreshAllBookings,
    isLoading,
    error
  }
}
