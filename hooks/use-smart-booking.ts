import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useOptimisticBooking } from './use-optimistic-booking'

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

interface UseSmartBookingReturn {
  bookings: Booking[]
  refreshBooking: (id: string) => Promise<void>
  refreshAllBookings: () => Promise<void>
  isLoading: boolean
  error: string | null
  isConnected: boolean
  optimisticUpdate: (id: string, status: string) => void
  pendingUpdates: Map<string, any>
}

// Cache for booking data with smart TTL
const bookingCache = new Map<string, { data: Booking; timestamp: number; ttl: number }>()

// Smart TTL based on booking status and user activity
const getSmartCacheTTL = (booking: Booking, isUserActive: boolean): number => {
  const baseTTL = {
    'PENDING': 5000,           // 5 seconds - most likely to change
    'CONFIRMED': 10000,        // 10 seconds - provider just accepted
    'PENDING_EXECUTION': 15000, // 15 seconds - payment processing
    'IN_PROGRESS': 30000,      // 30 seconds - provider working
    'COMPLETED': 300000,       // 5 minutes - unlikely to change
    'CANCELLED': 300000        // 5 minutes - final state
  }

  let ttl = baseTTL[booking.status as keyof typeof baseTTL] || 60000

  // Reduce TTL if user is active (recent mouse/keyboard activity)
  if (isUserActive) {
    ttl = Math.max(ttl * 0.5, 2000) // At least 2 seconds
  }

  // Reduce TTL for pending payments
  if (booking.payment?.status === 'PENDING') {
    ttl = Math.min(ttl, 5000)
  }

  return ttl
}

// Detect user activity
const useUserActivity = () => {
  const [isActive, setIsActive] = useState(true)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = Date.now()
      setIsActive(true)
    }

    const checkActivity = () => {
      const timeSinceActivity = Date.now() - lastActivity.current
      setIsActive(timeSinceActivity < 30000) // Active if activity within 30 seconds
    }

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    // Check activity every 10 seconds
    const interval = setInterval(checkActivity, 10000)

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
      clearInterval(interval)
    }
  }, [])

  return isActive
}

export function useSmartBooking(initialBookings: Booking[] = []): UseSmartBookingReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const { toast } = useToast()
  const isUserActive = useUserActivity()
  
  const refreshQueue = useRef<Set<string>>(new Set())
  const isRefreshing = useRef(false)
  const retryAttempts = useRef<Map<string, number>>(new Map())
  const intervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const abortController = useRef<AbortController | null>(null)

  // Use optimistic booking for immediate UI updates
  const {
    bookings,
    updateBooking,
    optimisticUpdate,
    revertOptimisticUpdate,
    setBookings: setOptimisticBookings,
    pendingUpdates
  } = useOptimisticBooking(initialBookings)

  // Initialize cache with initial data
  useEffect(() => {
    if (initialBookings.length > 0) {
      initialBookings.forEach(booking => {
        const ttl = getSmartCacheTTL(booking, isUserActive)
        bookingCache.set(booking.id, {
          data: booking,
          timestamp: Date.now(),
          ttl
        })
      })
      setOptimisticBookings(initialBookings)
    }
  }, [initialBookings, isUserActive, setOptimisticBookings])

  // Fetch single booking with smart retry logic
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
      
      // Update cache with smart TTL
      const ttl = getSmartCacheTTL(booking, isUserActive)
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
  }, [isUserActive])

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

  // Refresh a specific booking with optimistic UI integration
  const refreshBooking = useCallback(async (id: string): Promise<void> => {
    if (refreshQueue.current.has(id)) {
      return // Already refreshing
    }

    try {
      const updatedBooking = await getCachedOrFetchBooking(id)
      if (updatedBooking) {
        const currentBooking = bookings.find(b => b.id === id)
        
        // Update the booking
        updateBooking(id, updatedBooking)
        
        // Show toast notification for status changes
        if (currentBooking && currentBooking.status !== updatedBooking.status) {
          const statusMessages = {
            'PENDING': '⏳ Booking is waiting for provider response',
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
      }
    } catch (err) {
      console.error(`Error refreshing booking ${id}:`, err)
    }
  }, [bookings, getCachedOrFetchBooking, updateBooking, toast])

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
        validUpdates.forEach(updatedBooking => {
          const currentBooking = bookings.find(b => b.id === updatedBooking.id)
          
          // Update the booking
          updateBooking(updatedBooking.id, updatedBooking)
          
          // Show notifications for status changes
          if (currentBooking && currentBooking.status !== updatedBooking.status) {
            const statusMessages = {
              'PENDING': '⏳ Booking is waiting for provider response',
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
        })
      }
    } catch (err) {
      setError('Failed to refresh bookings')
      console.error('Error refreshing all bookings:', err)
    } finally {
      setIsLoading(false)
      isRefreshing.current = false
    }
  }, [bookings, fetchBooking, updateBooking, toast])

  // Set up smart polling based on user activity and booking status
  useEffect(() => {
    const setupSmartPolling = () => {
      // Clear existing intervals
      intervals.current.forEach(interval => clearInterval(interval))
      intervals.current.clear()

      bookings.forEach(booking => {
        const ttl = getSmartCacheTTL(booking, isUserActive)
        const pollingInterval = Math.max(ttl * 0.8, 2000) // Poll at 80% of TTL, minimum 2 seconds

        const interval = setInterval(async () => {
          // Skip if already refreshing this booking
          if (refreshQueue.current.has(booking.id)) {
            return
          }

          // Skip if no pending statuses that need frequent updates
          const needsFrequentUpdate = 
            booking.status === 'PENDING' || 
            booking.payment?.status === 'PENDING' ||
            booking.status === 'CONFIRMED' ||
            booking.status === 'PENDING_EXECUTION'

          if (!needsFrequentUpdate) {
            return
          }

          await refreshBooking(booking.id)
        }, pollingInterval)

        intervals.current.set(booking.id, interval)
      })
    }

    setupSmartPolling()

    return () => {
      intervals.current.forEach(interval => clearInterval(interval))
      intervals.current.clear()
    }
  }, [bookings, refreshBooking, isUserActive])

  // Retry failed requests with exponential backoff
  useEffect(() => {
    const retryFailedRequests = async () => {
      const failedBookings = Array.from(retryAttempts.current.entries())
        .filter(([_, attempts]) => attempts > 0)

      for (const [id, attempts] of failedBookings) {
        const baseDelay = 2000
        const maxDelay = 30000
        const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay)
        
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
    isConnected,
    optimisticUpdate,
    pendingUpdates
  }
}
