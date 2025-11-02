import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/notifications', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      
      // Transform API response to match our interface
      // API returns Prisma objects with Date objects, we need ISO strings
      const transformedNotifications = (data.notifications || []).map((notif: any) => ({
        ...notif,
        createdAt: typeof notif.createdAt === 'string' 
          ? notif.createdAt 
          : new Date(notif.createdAt).toISOString()
      }))
      
      setNotifications(transformedNotifications)
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }, [toast])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      setUnreadCount(0)
      
      toast({
        title: "Success",
        description: "All notifications marked as read"
      })
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }, [toast])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId)
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  }, [notifications, toast])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    deleteNotification
  }
}

/**
 * Hook for real-time notification updates
 * This will be used to show toast notifications when new notifications arrive
 */
export function useRealtimeNotifications() {
  const { toast } = useToast()
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)

  // Determine notification type and variant for toast
  const getNotificationVariant = useCallback((notification: any) => {
    const type = (notification.type || '').toUpperCase()
    const title = (notification.title || '').toUpperCase()
    
    // Determine if it's destructive (error)
    if (type.includes('DECLINED') || 
        type.includes('FAILED') || 
        type.includes('CANCELLED') ||
        type.includes('ERROR') ||
        title.includes('DECLINED') ||
        title.includes('FAILED') ||
        title.includes('CANCELLED')) {
      return 'destructive'
    }
    
    // Default variant for success, warning, info
    return 'default'
  }, [])

  // Get appropriate styling class based on notification type
  const getNotificationStyles = useCallback((notification: any) => {
    const type = (notification.type || '').toUpperCase()
    const title = (notification.title || '').toUpperCase()
    
    if (type.includes('PAYMENT_RECEIVED') || 
        type.includes('PAYMENT_RELEASED') ||
        type.includes('BOOKING_ACCEPTED') ||
        type.includes('JOB_COMPLETED') ||
        type.includes('REVIEW_SUBMITTED') ||
        title.includes('PAYMENT') ||
        title.includes('SUCCESS')) {
      return {
        className: 'border-green-200 bg-green-50 text-green-900',
        icon: '✅'
      }
    }
    
    if (type.includes('DISPUTE') || type.includes('WARNING')) {
      return {
        className: 'border-amber-200 bg-amber-50 text-amber-900',
        icon: '⚠️'
      }
    }
    
    if (type.includes('BOOKING') || type.includes('SCHEDULE')) {
      return {
        className: 'border-blue-200 bg-blue-50 text-blue-900',
        icon: '📅'
      }
    }
    
    // Default info style
    return {
      className: 'border-blue-200 bg-blue-50 text-blue-900',
      icon: 'ℹ️'
    }
  }, [])

  const checkForNewNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/latest', {
        credentials: 'include'
      })

      if (!response.ok) return

      const data = await response.json()
      const latestNotification = data.notification

      if (latestNotification && latestNotification.id !== lastNotificationId) {
        setLastNotificationId(latestNotification.id)
        
        // Determine variant and styles
        const variant = getNotificationVariant(latestNotification)
        const styles = getNotificationStyles(latestNotification)
        
        // Show enhanced toast for new notification
        // Note: Action buttons require JSX, so we'll include the URL in the description
        // for now. Users can click the notification popup for full navigation.
        const actionUrl = (() => {
          const type = (latestNotification.type || '').toUpperCase()
          if (type.includes('BOOKING')) {
            return '/provider/dashboard?section=jobs'
          }
          if (type.includes('PAYMENT') || type.includes('ESCROW')) {
            return '/provider/dashboard?section=earnings'
          }
          if (type.includes('REVIEW')) {
            return '/provider/dashboard?section=reviews'
          }
          return null
        })()
        
        // Enhance description with action hint if URL exists
        let enhancedDescription = latestNotification.message || latestNotification.content
        if (actionUrl && enhancedDescription) {
          enhancedDescription = `${enhancedDescription} Click the notification bell to view details.`
        }
        
        toast({
          title: latestNotification.title,
          description: enhancedDescription,
          variant: variant as 'default' | 'destructive',
          className: variant === 'default' ? styles.className : undefined,
          duration: 6000
        })
      }
    } catch (err) {
      console.error('Error checking for new notifications:', err)
    }
  }, [lastNotificationId, toast, getNotificationVariant, getNotificationStyles])

  // Check for new notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(checkForNewNotifications, 10000)
    return () => clearInterval(interval)
  }, [checkForNewNotifications])

  return { checkForNewNotifications }
}
