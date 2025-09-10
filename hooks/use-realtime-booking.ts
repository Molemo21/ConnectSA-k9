import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

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

interface UseRealtimeBookingReturn {
  bookings: Booking[]
  refreshBooking: (id: string) => Promise<void>
  refreshAllBookings: () => Promise<void>
  isLoading: boolean
  error: string | null
  isConnected: boolean
}

// Cache for booking data with timestamps
const bookingCache = new Map<string, { data: Booking; timestamp: number; ttl: number }>()

// Different TTL based on booking status
const getCacheTTL = (booking: Booking): number => {
  if (booking.payment?.status === 'PENDING') return 10 * 1000 // 10 seconds for pending payments
  if (booking.status === 'PENDING') return 15 * 1000 // 15 seconds for pending bookings
  if (booking.status === 'CONFIRMED') return 30 * 1000 // 30 seconds for confirmed bookings
  return 60 * 1000 // 1 minute for other statuses
}

// Exponential backoff for retries
const getRetryDelay = (attempt: number): number => {
  const baseDelay = 2000 // 2 seconds
  const maxDelay = 30000 // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
  return delay + Math.random() * 1000 // Add jitter
}

export function useRealtimeBooking(initialBookings: Booking[] = []): UseRealtimeBookingReturn {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const { toast } = useToast()
  
  const refreshQueue = useRef<Set<string>>(new Set())
  const isRefreshing = useRef(false)
  const retryAttempts = useRef<Map<string, number>>(new Map())
  const intervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const abortController = useRef<AbortController | null>(null)

  // Initialize cache with initial data
  useEffect(() => {
    if (initialBookings.length > 0) {
      initialBookings.forEach(booking => {
        const ttl = getCacheTTL(booking)
        bookingCache.set(booking.id, {
          data: booking,
          timestamp: Date.now(),
          ttl
        })
      })
      setBookings(initialBookings)
    }
  }, [initialBookings])

  // Fetch single booking with retry logic
  const fetchBooking = useCallback(async (id: string, signal?: AbortSignal): Promise<Booking | null> => {
    try {
      const response = await fetch(`/api/book-service/${id}`, {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.status}`)
      }

      const booking = await response.json()
      
      // Update cache
      const ttl = getCacheTTL(booking)
      bookingCache.set(id, {
        data: booking,
        timestamp: Date.now(),
        ttl
      })

      // Reset retry attempts on success
      retryAttempts.current.delete(id)
      setIsConnected(true)
      
      return booking
    } catch (err) {
      if (signal?.aborted) return null
      
      console.error(`Error fetching booking ${id}:`, err)
      setIsConnected(false)
      
      // Increment retry attempts
      const attempts = retryAttempts.current.get(id) || 0
      retryAttempts.current.set(id, attempts + 1)
      
      return null
    }
  }, [])

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
      const booking = await fetchBooking(id)
      return booking
    } finally {
      refreshQueue.current.delete(id)
    }
  }, [fetchBooking])

  // Refresh a specific booking
  const refreshBooking = useCallback(async (id: string): Promise<void> => {
    if (refreshQueue.current.has(id)) {
      return // Already refreshing
    }

    try {
      const updatedBooking = await getCachedOrFetchBooking(id)
      if (updatedBooking) {
        setBookings(prev => {
          const current = prev.find(b => b.id === id)
          const updated = prev.map(b => b.id === id ? updatedBooking : b)
          
          // Show toast notification for status changes
          if (current && current.status !== updatedBooking.status) {
            const statusMessages = {
              'PENDING': 'Booking is waiting for provider response',
              'CONFIRMED': '🎉 Booking confirmed by provider!',
              'PENDING_EXECUTION': '💳 Payment received, provider can start work',
              'IN_PROGRESS': '🔧 Provider is working on your service',
              'COMPLETED': '✅ Service completed successfully!',
              'CANCELLED': '❌ Booking was cancelled'
            }
            
            const message = statusMessages[updatedBooking.status as keyof typeof statusMessages]
            if (message) {
              toast({
                title: "Booking Status Update",
                description: message,
                duration: 5000
              })
            }
          }
          
          return updated
        })
      }
    } catch (err) {
      console.error(`Error refreshing booking ${id}:`, err)
    }
  }, [getCachedOrFetchBooking, toast])

  // Refresh all bookings
  const refreshAllBookings = useCallback(async (): Promise<void> => {
    if (isRefreshing.current) {
      return
    }

    setIsLoading(true)
    setError(null)
    isRefreshing.current = true

    try {
      // Create new abort controller for this refresh
      if (abortController.current) {
        abortController.current.abort()
      }
      abortController.current = new AbortController()

      const refreshPromises = bookings.map(booking => 
        fetchBooking(booking.id, abortController.current!.signal)
      )

      const updatedBookings = await Promise.all(refreshPromises)
      const validUpdates = updatedBookings.filter(Boolean) as Booking[]

      if (validUpdates.length > 0) {
        setBookings(prev => {
          const updated = [...prev]
          validUpdates.forEach(updatedBooking => {
            const index = updated.findIndex(b => b.id === updatedBooking.id)
            if (index !== -1) {
              const current = updated[index]
              const newBooking = updatedBooking
              
              // Show notifications for status changes
              if (current.status !== newBooking.status) {
                const statusMessages = {
                  'PENDING': 'Booking is waiting for provider response',
                  'CONFIRMED': '🎉 Booking confirmed by provider!',
                  'PENDING_EXECUTION': '💳 Payment received, provider can start work',
                  'IN_PROGRESS': '🔧 Provider is working on your service',
                  'COMPLETED': '✅ Service completed successfully!',
                  'CANCELLED': '❌ Booking was cancelled'
                }
                
                const message = statusMessages[newBooking.status as keyof typeof statusMessages]
                if (message) {
                  toast({
                    title: "Booking Status Update",
                    description: message,
                    duration: 5000
                  })
                }
              }
              
              updated[index] = newBooking
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
  }, [bookings, fetchBooking, toast])

  // Set up real-time polling for different booking types
  useEffect(() => {
    const setupPolling = () => {
      // Clear existing intervals
      intervals.current.forEach(interval => clearInterval(interval))
      intervals.current.clear()

      bookings.forEach(booking => {
        const ttl = getCacheTTL(booking)
        const pollingInterval = Math.max(ttl * 0.8, 5000) // Poll at 80% of TTL, minimum 5 seconds

        const interval = setInterval(async () => {
          // Skip if already refreshing this booking
          if (refreshQueue.current.has(booking.id)) {
            return
          }

          // Skip if no pending statuses that need frequent updates
          const needsFrequentUpdate = 
            booking.status === 'PENDING' || 
            booking.payment?.status === 'PENDING' ||
            booking.status === 'CONFIRMED'

          if (!needsFrequentUpdate) {
            return
          }

          await refreshBooking(booking.id)
        }, pollingInterval)

        intervals.current.set(booking.id, interval)
      })
    }

    setupPolling()

    return () => {
      intervals.current.forEach(interval => clearInterval(interval))
      intervals.current.clear()
    }
  }, [bookings, refreshBooking])

  // Retry failed requests with exponential backoff
  useEffect(() => {
    const retryFailedRequests = async () => {
      const failedBookings = Array.from(retryAttempts.current.entries())
        .filter(([_, attempts]) => attempts > 0)

      for (const [id, attempts] of failedBookings) {
        const delay = getRetryDelay(attempts - 1)
        
        setTimeout(async () => {
          if (retryAttempts.current.get(id) === attempts) {
            await refreshBooking(id)
          }
        }, delay)
      }
    }

    const retryInterval = setInterval(retryFailedRequests, 10000) // Check every 10 seconds
    return () => clearInterval(retryInterval)
  }, [refreshBooking])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      intervals.current.forEach(interval => clearInterval(interval))
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

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
    error,
    isConnected
  }
}
