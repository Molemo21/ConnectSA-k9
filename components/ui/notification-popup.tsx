"use client"

import { useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Bell, X, CheckCircle, AlertCircle, Info, Clock,
  DollarSign, Calendar, Star, ExternalLink, MoreVertical,
  CheckCheck, Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'error'
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
}

interface NotificationPopupProps {
  isOpen: boolean
  onClose: () => void
  notifications?: Notification[]
  className?: string
  onMarkAsRead?: (notificationId: string) => Promise<void> | void
  onMarkAllAsRead?: () => Promise<void> | void
  onDelete?: (notificationId: string) => Promise<void> | void
}

// Notification type styles configuration
const notificationStyles = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    bg: "bg-green-50/80",
    border: "border-l-green-500",
    iconBg: "bg-green-100",
    badge: "bg-green-100 text-green-700"
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-l-amber-500",
    iconBg: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700"
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-600",
    bg: "bg-red-50/80",
    border: "border-l-red-500",
    iconBg: "bg-red-100",
    badge: "bg-red-100 text-red-700"
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bg: "bg-blue-50/80",
    border: "border-l-blue-500",
    iconBg: "bg-blue-100",
    badge: "bg-blue-100 text-blue-700"
  }
} as const

export function NotificationPopup({ 
  isOpen, 
  onClose, 
  notifications = [], 
  className = "",
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete
}: NotificationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const timeoutRefs = useRef<Array<NodeJS.Timeout>>([])
  const router = useRouter()

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close popup on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Cleanup timeouts on unmount or when popup closes
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
      timeoutRefs.current = []
    }
  }, [isOpen])

  // Get appropriate icon based on notification type and title
  const getNotificationIcon = (notification: Notification) => {
    const styles = notificationStyles[notification.type]
    const Icon = styles.icon
    
    // Use contextual icons based on notification title/content
    const titleUpper = notification.title.toUpperCase()
    if (titleUpper.includes('PAYMENT') || titleUpper.includes('EARNINGS')) {
      return { Icon: DollarSign, ...styles }
    }
    if (titleUpper.includes('BOOKING') || titleUpper.includes('SCHEDULE')) {
      return { Icon: Calendar, ...styles }
    }
    if (titleUpper.includes('REVIEW') || titleUpper.includes('RATING')) {
      return { Icon: Star, ...styles }
    }
    
    return { Icon, ...styles }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)
    
    notifications.forEach(notif => {
      const date = new Date(notif.timestamp)
      if (date >= today) {
        groups['Today'].push(notif)
      } else if (date >= yesterday) {
        groups['Yesterday'].push(notif)
      } else if (date >= thisWeek) {
        groups['This Week'].push(notif)
      } else {
        groups['Older'].push(notif)
      }
    })
    
    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [notifications])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`fixed top-16 right-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {notifications.filter(n => !n.read).length > 0 && onMarkAllAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (onMarkAllAsRead) {
                        try {
                          await onMarkAllAsRead()
                        } catch (error) {
                          console.error('Failed to mark all notifications as read:', error)
                        }
                      }
                    }}
                    className="text-xs h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                /* Enhanced Empty State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Bell className="w-10 h-10 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up! 🎉</h4>
                  <p className="text-gray-500 text-sm">
                    You don&apos;t have any notifications right now.<br />
                    We&apos;ll let you know when something new arrives.
                  </p>
                </motion.div>
              ) : (
                /* Grouped Notifications List */
                <div className="divide-y divide-gray-100">
                  {groupedNotifications.map(([groupName, groupNotifications]) => (
                    <div key={groupName}>
                      {/* Group Header */}
                      <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-100 z-10">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {groupName}
                        </span>
                      </div>
                      
                      {/* Group Notifications */}
                      {groupNotifications.map((notification) => {
                        const { Icon, iconColor, bg, border, iconBg } = getNotificationIcon(notification)
                        
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "group relative p-4 hover:bg-gray-50/80 transition-all cursor-pointer border-l-4",
                              !notification.read ? [
                                bg,
                                border,
                                "shadow-sm"
                              ] : "border-transparent hover:border-blue-300"
                            )}
                            onClick={async (e) => {
                              // Check if click target is the View Details button or its children
                              const target = e.target as HTMLElement
                              const isButtonClick = target.closest('button') && 
                                (target.closest('button')?.textContent?.includes(notification.actionText || '') || 
                                 target.closest('button')?.className?.includes('border-blue-500'))
                              
                              // If button was clicked, let button handle navigation (don't navigate twice)
                              if (isButtonClick) {
                                console.log('⏭️ Skipping card click - button will handle navigation')
                                return
                              }
                              
                              // Mark as read if unread
                              if (!notification.read && onMarkAsRead) {
                                try {
                                  await onMarkAsRead(notification.id)
                                } catch (error) {
                                  console.error('Failed to mark notification as read:', error)
                                }
                              }
                              
                              // Navigate to action URL if available (only if button wasn't clicked)
                              if (notification.actionUrl && !isButtonClick) {
                                console.log(`🚀 Card clicked - Navigating to: ${notification.actionUrl}`, {
                                  notificationId: notification.id,
                                  notificationType: notification.type,
                                  actionText: notification.actionText
                                })
                                try {
                                  // Close popup first for smooth UX
                                  onClose()
                                  
                                  // Small delay to ensure popup closes smoothly before navigation
                                  const timeoutId = setTimeout(() => {
                                    if (notification.actionUrl) {
                                      console.log(`📍 Executing router.push to: ${notification.actionUrl}`)
                                      router.push(notification.actionUrl)
                                    }
                                  }, 100)
                                  
                                  // Track timeout for cleanup
                                  timeoutRefs.current.push(timeoutId)
                                } catch (error) {
                                  console.error('Navigation error:', error)
                                  // Fallback to window.location if router.push fails
                                  if (notification.actionUrl) {
                                    window.location.href = notification.actionUrl
                                  }
                                }
                              } else if (!notification.actionUrl) {
                                // Just close if no action URL
                                onClose()
                              }
                            }}
                    >
                            {/* Unread indicator dot */}
                            {!notification.read && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"
                              />
                            )}
                            
                            <div className="flex items-start gap-3">
                              {/* Enhanced Icon */}
                              <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                                iconBg
                              )}>
                                <Icon className={cn("w-5 h-5", iconColor)} />
                        </div>
                              
                        <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h5 className={cn(
                                    "text-sm font-semibold truncate",
                                    !notification.read ? "text-gray-900" : "text-gray-700"
                                  )}>
                              {notification.title}
                            </h5>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                                    </div>
                                    {/* Quick Actions Menu */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        {!notification.read && onMarkAsRead && (
                                          <DropdownMenuItem
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              await onMarkAsRead(notification.id)
                                            }}
                                          >
                                            <CheckCheck className="w-4 h-4 mr-2" />
                                            Mark as read
                                          </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                          <DropdownMenuItem
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              await onDelete(notification.id)
                                            }}
                                            className="text-red-600 focus:text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                            </div>
                          </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-2">
                            {/* Visible Mark as Read button for unread notifications */}
                            {!notification.read && onMarkAsRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    await onMarkAsRead(notification.id)
                                  } catch (error) {
                                    console.error('Failed to mark notification as read:', error)
                                  }
                                }}
                              >
                                <CheckCheck className="w-3 h-3 mr-1.5" />
                                Mark as read
                              </Button>
                            )}
                            
                            {/* View Details button */}
                            {notification.actionText && notification.actionUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 border-blue-500/30 text-blue-600 hover:bg-blue-50 hover:border-blue-500/50 transition-all relative z-10"
                                onClick={async (e) => {
                                  // Stop all event propagation immediately
                                  e.stopPropagation()
                                  e.preventDefault()
                                  
                                  console.log('🔘 View Payment button clicked!', {
                                    actionUrl: notification.actionUrl,
                                    actionText: notification.actionText,
                                    notificationId: notification.id,
                                    notificationType: notification.type
                                  })
                                  
                                  // Verify actionUrl exists
                                  if (!notification.actionUrl) {
                                    console.warn('❌ No action URL for notification:', notification.id)
                                    return
                                  }
                                  
                                  try {
                                    console.log(`🚀 Navigating to: ${notification.actionUrl}`, {
                                      notificationId: notification.id,
                                      notificationType: notification.type,
                                      actionText: notification.actionText
                                    })
                                    
                                    // Close popup first for smooth UX
                                    onClose()
                                    
                                    // Small delay to ensure popup closes smoothly before navigation
                                    const timeoutId = setTimeout(() => {
                                      if (notification.actionUrl) {
                                        console.log(`📍 Executing router.push to: ${notification.actionUrl}`)
                                        try {
                                          router.push(notification.actionUrl)
                                          console.log('✅ router.push successful')
                                        } catch (error) {
                                          console.error('❌ router.push failed:', error)
                                          // Fallback to window.location if router.push fails
                                          console.log('🔄 Falling back to window.location.href')
                                          window.location.href = notification.actionUrl
                                        }
                                      }
                                    }, 100)
                                    
                                    // Track timeout for cleanup
                                    timeoutRefs.current.push(timeoutId)
                                  } catch (error) {
                                    console.error('❌ Error in navigation handler:', error)
                                    // Still try to navigate
                                    if (notification.actionUrl) {
                                      console.log('🔄 Using window.location fallback due to error')
                                      window.location.href = notification.actionUrl
                                    }
                                  }
                                }}
                              >
                                {notification.actionText}
                                <ExternalLink className="w-3 h-3 ml-1.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all"
                  onClick={async () => {
                    if (onMarkAllAsRead) {
                      try {
                        await onMarkAllAsRead()
                      } catch (error) {
                        console.error('Failed to mark all notifications as read:', error)
                      }
                    }
                  }}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark all as read
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
