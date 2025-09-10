import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Booking {
  id: string
  status: string
  service?: {
    name: string
  }
  payment?: {
    status: string
  }
  [key: string]: any
}

interface UseDemoBookingReturn {
  bookings: Booking[]
  refreshBooking: (id: string) => Promise<void>
  refreshAllBookings: () => Promise<void>
  isLoading: boolean
  error: string | null
  isConnected: boolean
  optimisticUpdate: (id: string, status: string) => void
  pendingUpdates: Map<string, any>
}

export function useDemoBooking(initialBookings: Booking[] = []): UseDemoBookingReturn {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const { toast } = useToast()
  
  const pendingUpdates = new Map<string, any>()

  // Initialize with demo data
  useEffect(() => {
    setBookings(initialBookings)
  }, [initialBookings])

  // Simulate API calls for demo purposes
  const refreshBooking = useCallback(async (id: string): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In demo mode, just update the booking status randomly
    setBookings(prev => prev.map(booking => {
      if (booking.id === id) {
        const statuses = ['PENDING', 'CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'COMPLETED']
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        
        // Show toast for status changes
        if (booking.status !== randomStatus) {
          const statusMessages = {
            'PENDING': '⏳ Booking is waiting for provider response',
            'CONFIRMED': '🎉 Booking confirmed by provider!',
            'PENDING_EXECUTION': '💳 Payment received, provider can start work',
            'IN_PROGRESS': '🔧 Provider is working on your service',
            'COMPLETED': '✅ Service completed successfully!',
            'CANCELLED': '❌ Booking was cancelled'
          }
          
          const message = statusMessages[randomStatus as keyof typeof statusMessages]
          if (message) {
            toast({
              title: "Demo Status Update",
              description: message,
              duration: 3000
            })
          }
        }
        
        return { ...booking, status: randomStatus }
      }
      return booking
    }))
  }, [toast])

  const refreshAllBookings = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In demo mode, just refresh all bookings
    setBookings(prev => [...prev])
    
    setIsLoading(false)
    toast({
      title: "Demo Refresh",
      description: "All bookings refreshed successfully!",
      duration: 2000
    })
  }, [toast])

  const optimisticUpdate = useCallback((id: string, status: string) => {
    setBookings(prev => prev.map(booking => 
      booking.id === id ? { ...booking, status } : booking
    ))
    
    toast({
      title: "Demo Optimistic Update",
      description: `Status updated to ${status}`,
      duration: 2000
    })
  }, [toast])

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
