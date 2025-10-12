"use client"

import { useRef, useEffect, useState } from 'react'
import { Bell, X, Info, CheckCircle, AlertTriangle, DollarSign, Calendar, Clock, User, MapPin, Phone, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from './button'

interface ProviderNotification {
  id: string
  title: string
  message: string
  type: 'booking' | 'payment' | 'review' | 'system' | 'urgent'
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high'
}

interface ProviderNotificationPopupProps {
  isOpen: boolean
  onClose: () => void
  notifications: ProviderNotification[]
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
}

export function ProviderNotificationPopup({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onMarkAsRead,
  onMarkAllAsRead 
}: ProviderNotificationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Handle visibility animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

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

  const getIcon = (type: ProviderNotification['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'payment':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'review':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />
      case 'urgent':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'system':
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBorderColor = (type: ProviderNotification['type'], priority: ProviderNotification['priority']) => {
    if (priority === 'high') return 'border-red-500/30 bg-red-900/20'
    
    switch (type) {
      case 'booking':
        return 'border-blue-500/30 bg-blue-900/20'
      case 'payment':
        return 'border-green-500/30 bg-green-900/20'
      case 'review':
        return 'border-yellow-500/30 bg-yellow-900/20'
      case 'urgent':
        return 'border-red-500/30 bg-red-900/20'
      case 'system':
      default:
        return 'border-gray-500/30 bg-gray-900/20'
    }
  }

  const getPriorityBadge = (priority: ProviderNotification['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Urgent</span>
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Important</span>
      case 'low':
      default:
        return null
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 overflow-y-auto z-[9999]">
        <div className="flex min-h-full items-start justify-end p-4 pt-20 text-center">
          <div 
            ref={popupRef}
            className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-0 text-left align-middle shadow-xl transition-all duration-300 border border-gray-700 ${
              isVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-4'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
              <div className="flex items-center space-x-2">
                <Bell className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && onMarkAllAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg font-medium">No notifications yet!</p>
                  <p className="text-sm mt-2">You'll see booking updates, payments, and reviews here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-900/10' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read && onMarkAsRead) {
                          onMarkAsRead(notification.id)
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                        onClose()
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-200'}`}>
                              {notification.title}
                            </p>
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          {notification.actionText && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (notification.actionUrl) {
                                  window.location.href = notification.actionUrl
                                }
                                onClose()
                              }}
                            >
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => {
                    // Navigate to full notifications page
                    window.location.href = '/provider/notifications'
                    onClose()
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
