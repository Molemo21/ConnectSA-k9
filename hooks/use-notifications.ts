import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
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
      setNotifications(data.notifications || [])
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
        
        // Show toast for new notification
        toast({
          title: latestNotification.title,
          description: latestNotification.content,
          duration: 5000
        })
      }
    } catch (err) {
      console.error('Error checking for new notifications:', err)
    }
  }, [lastNotificationId, toast])

  // Check for new notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(checkForNewNotifications, 10000)
    return () => clearInterval(interval)
  }, [checkForNewNotifications])

  return { checkForNewNotifications }
}
