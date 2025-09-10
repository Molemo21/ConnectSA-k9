import { useState, useCallback } from 'react'
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

interface OptimisticUpdate {
  id: string
  status: string
  timestamp: number
  originalStatus: string
}

interface UseOptimisticBookingReturn {
  bookings: Booking[]
  updateBooking: (id: string, updates: Partial<Booking>) => void
  optimisticUpdate: (id: string, status: string) => void
  revertOptimisticUpdate: (id: string) => void
  setBookings: (bookings: Booking[]) => void
  pendingUpdates: Map<string, OptimisticUpdate>
}

export function useOptimisticBooking(initialBookings: Booking[] = []): UseOptimisticBookingReturn {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate>>(new Map())
  const { toast } = useToast()

  // Update booking with optimistic UI
  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(booking => 
      booking.id === id ? { ...booking, ...updates } : booking
    ))
  }, [])

  // Apply optimistic update with visual feedback
  const optimisticUpdate = useCallback((id: string, status: string) => {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return

    const originalStatus = booking.status
    const timestamp = Date.now()

    // Store the optimistic update
    setPendingUpdates(prev => new Map(prev.set(id, {
      id,
      status,
      timestamp,
      originalStatus
    })))

    // Apply optimistic update to UI
    updateBooking(id, { status })

    // Show immediate feedback
    const statusMessages = {
      'PENDING': '⏳ Processing...',
      'CONFIRMED': '🎉 Confirmed!',
      'PENDING_EXECUTION': '💳 Payment processing...',
      'IN_PROGRESS': '🔧 In progress...',
      'COMPLETED': '✅ Completed!',
      'CANCELLED': '❌ Cancelled'
    }

    const message = statusMessages[status as keyof typeof statusMessages]
    if (message) {
      toast({
        title: "Booking Update",
        description: message,
        duration: 3000
      })
    }

    // Auto-revert after 30 seconds if no real update comes
    setTimeout(() => {
      setPendingUpdates(prev => {
        const current = prev.get(id)
        if (current && current.timestamp === timestamp) {
          // Revert if still pending
          updateBooking(id, { status: originalStatus })
          prev.delete(id)
          return new Map(prev)
        }
        return prev
      })
    }, 30000)
  }, [bookings, updateBooking, toast])

  // Revert optimistic update
  const revertOptimisticUpdate = useCallback((id: string) => {
    const pendingUpdate = pendingUpdates.get(id)
    if (pendingUpdate) {
      updateBooking(id, { status: pendingUpdate.originalStatus })
      setPendingUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    }
  }, [pendingUpdates, updateBooking])

  // Confirm optimistic update (when real data comes in)
  const confirmOptimisticUpdate = useCallback((id: string, realStatus: string) => {
    const pendingUpdate = pendingUpdates.get(id)
    if (pendingUpdate && pendingUpdate.status === realStatus) {
      // Update was correct, just remove from pending
      setPendingUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    } else if (pendingUpdate) {
      // Update was incorrect, revert and apply real status
      updateBooking(id, { status: realStatus })
      setPendingUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    }
  }, [pendingUpdates, updateBooking])

  return {
    bookings,
    updateBooking,
    optimisticUpdate,
    revertOptimisticUpdate,
    setBookings,
    pendingUpdates
  }
}
