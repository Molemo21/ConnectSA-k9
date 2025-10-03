import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { normalizeBookings } from '@/lib/normalize-booking'

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  scheduledDate: string
  totalAmount: number
  status: string
  address: string
  description?: string
  payment?: {
    id: string
    amount: number
    status: string
  }
  review?: {
    id: string
    rating: number
    comment?: string
  }
}

interface ProviderStats {
  pendingJobs: number
  confirmedJobs: number
  inProgressJobs: number
  completedJobs: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

interface UseSmartProviderBookingReturn {
  bookings: Booking[]
  stats: ProviderStats
  loading: boolean
  error: string | null
  lastRefresh: Date | null
  isConnected: boolean
  refreshBookings: () => Promise<void>
}

// Cache for provider booking data
let cachedData: { bookings: Booking[]; stats: ProviderStats; timestamp: number } | null = null
const CACHE_TTL = 30000 // 30 seconds

// User activity detection
let lastActivity = Date.now()
let activityTimeout: NodeJS.Timeout | null = null

const updateActivity = () => {
  lastActivity = Date.now()
  if (activityTimeout) {
    clearTimeout(activityTimeout)
  }
  activityTimeout = setTimeout(() => {
    // User is considered inactive after 2 minutes
  }, 120000)
}

export function useSmartProviderBooking(): UseSmartProviderBookingReturn {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    pendingJobs: 0,
    confirmedJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    averageRating: 0,
    totalReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const { toast } = useToast()

  const abortController = useRef<AbortController | null>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const isPolling = useRef(false)

  // Check if data is fresh enough
  const isDataFresh = useCallback(() => {
    if (!cachedData) return false
    const now = Date.now()
    const timeSinceLastFetch = now - cachedData.timestamp
    return timeSinceLastFetch < CACHE_TTL
  }, [])

  // Check if user is active
  const isUserActive = useCallback(() => {
    const now = Date.now()
    return now - lastActivity < 120000 // 2 minutes
  }, [])

  // Fetch provider bookings and stats
  const fetchProviderData = useCallback(async (signal?: AbortSignal) => {
    try {
      console.log('Fetching provider data...')
      const response = await fetch('/api/provider/bookings', {
        credentials: 'include',
        signal
      })

      console.log('Provider data response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Provider data fetch error:', response.status, errorText)
        throw new Error(`Failed to fetch provider data: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Provider data received:', data)
      
      // Update cache
      cachedData = {
        bookings: normalizeBookings(data.bookings || []),
        stats: data.stats || stats,
        timestamp: Date.now()
      }

      setBookings(normalizeBookings(data.bookings || []))
      setStats(data.stats || stats)
      setLastRefresh(new Date())
      setError(null)
      setIsConnected(true)

      return data
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return // Request was cancelled
      }
      
      console.error('Error fetching provider data:', err)
      setError(err.message || 'Failed to fetch provider data')
      setIsConnected(false)
      throw err
    }
  }, [stats])

  // Refresh bookings function
  const refreshBookings = useCallback(async () => {
    if (isPolling.current) return

    try {
      isPolling.current = true
      setLoading(true)

      // Cancel any ongoing request
      if (abortController.current) {
        abortController.current.abort()
      }

      // Create new abort controller
      abortController.current = new AbortController()

      await fetchProviderData(abortController.current.signal)
    } catch (err) {
      console.error('Error refreshing provider data:', err)
    } finally {
      isPolling.current = false
      setLoading(false)
    }
  }, [fetchProviderData])

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingInterval.current) return

    const poll = async () => {
      // Skip if already polling or data is fresh and user is inactive
      if (isPolling.current || (isDataFresh() && !isUserActive())) {
        return
      }

      try {
        await refreshBookings()
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    // Initial fetch
    poll()

    // Set up polling interval
    pollingInterval.current = setInterval(poll, 5000) // Poll every 5 seconds
  }, [refreshBookings, isDataFresh, isUserActive])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }, [])

  // Set up activity listeners
  useEffect(() => {
    const handleActivity = () => updateActivity()
    
    // Listen for user activity
    document.addEventListener('mousedown', handleActivity)
    document.addEventListener('keydown', handleActivity)
    document.addEventListener('scroll', handleActivity)
    document.addEventListener('touchstart', handleActivity)

    // Initial activity
    updateActivity()

    return () => {
      document.removeEventListener('mousedown', handleActivity)
      document.removeEventListener('keydown', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      document.removeEventListener('touchstart', handleActivity)
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
    }
  }, [])

  // Set up polling
  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [startPolling, stopPolling])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startPolling, stopPolling])

  // Handle online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true)
      refreshBookings()
    }

    const handleOffline = () => {
      setIsConnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshBookings])

  return {
    bookings,
    stats,
    loading,
    error,
    lastRefresh,
    isConnected,
    refreshBookings
  }
}
