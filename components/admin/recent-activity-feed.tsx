import React, { useState, useEffect, useCallback } from 'react'
import { useSocket, SocketEvent } from '@/lib/socket-client'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Calendar, 
  CheckCircle, 
  User, 
  Clock, 
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface RecentActivity {
  id: string
  type: 'booking' | 'user' | 'provider' | 'payment'
  title: string
  description: string
  status: string
  timestamp: string
  amount?: number
}

interface RecentActivityProps {
  type: 'bookings' | 'users' | 'providers' | 'payments'
  limit?: number
}

export function RecentActivityFeed({ type, limit = 5 }: RecentActivityProps) {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecentActivities = useCallback(async () => {
    try {
      setRefreshing(true)
      
      // Skip API calls during build time
      if (typeof window === 'undefined') {
        console.log('Skipping API call during build time')
        return
      }

      let endpoint = ''
      switch (type) {
        case 'bookings':
          endpoint = '/api/admin/bookings?limit=10&sort=createdAt&order=desc'
          break
        case 'users':
          endpoint = '/api/admin/users?limit=10&sort=createdAt&order=desc'
          break
        case 'providers':
          endpoint = '/api/admin/providers?limit=10&sort=createdAt&order=desc'
          break
        case 'payments':
          endpoint = '/api/admin/payments?limit=10&sort=createdAt&order=desc'
          break
      }

      const response = await fetch(endpoint)
      
      if (response.ok) {
        const data = await response.json()
        const transformedActivities = transformDataToActivities(data, type)
        setActivities(transformedActivities.slice(0, limit))
      } else {
        console.error(`Failed to fetch ${type}:`, response.status)
        showToast.error(`Failed to fetch recent ${type}`)
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      showToast.error(`Error fetching recent ${type}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [type])

  const transformDataToActivities = (data: any, type: string): RecentActivity[] => {
    switch (type) {
      case 'bookings':
        return data.bookings?.map((booking: any) => ({
          id: booking.id,
          type: 'booking' as const,
          title: getBookingTitle(booking.status),
          description: `${booking.serviceName || booking.service?.name || 'Unknown Service'} - ${formatCurrency(booking.totalAmount || booking.amount || 0)}`,
          status: booking.status,
          timestamp: booking.createdAt,
          amount: booking.totalAmount || booking.amount || 0
        })) || []

      case 'users':
        return data.users?.map((user: any) => ({
          id: user.id,
          type: 'user' as const,
          title: 'New User Registered',
          description: user.email,
          status: user.status,
          timestamp: user.createdAt
        })) || []

      case 'providers':
        return data.providers?.map((provider: any) => ({
          id: provider.id,
          type: 'provider' as const,
          title: getProviderTitle(provider.status),
          description: provider.businessName || provider.name,
          status: provider.status,
          timestamp: provider.createdAt
        })) || []

      case 'payments':
        return data.payments?.map((payment: any) => ({
          id: payment.id,
          type: 'payment' as const,
          title: 'Payment Processed',
          description: `${formatCurrency(payment.amount)} - ${payment.description || 'Service Payment'}`,
          status: payment.status,
          timestamp: payment.createdAt,
          amount: payment.amount
        })) || []

      default:
        return []
    }
  }

  const getBookingTitle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'New Booking'
      case 'CONFIRMED': return 'Booking Confirmed'
      case 'PENDING_EXECUTION': return 'Payment Received'
      case 'IN_PROGRESS': return 'Booking In Progress'
      case 'AWAITING_CONFIRMATION': return 'Awaiting Confirmation'
      case 'COMPLETED': return 'Booking Completed'
      case 'CANCELLED': return 'Booking Cancelled'
      default: return 'Booking Update'
    }
  }

  const getProviderTitle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Provider Pending Approval'
      case 'APPROVED': return 'Provider Approved'
      case 'REJECTED': return 'Provider Rejected'
      case 'SUSPENDED': return 'Provider Suspended'
      default: return 'Provider Update'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getStatusBadge = (status: string, type: string) => {
    const statusConfig = {
      booking: {
        'PENDING': { color: 'bg-green-900/50 text-green-400 border-green-800/50', label: 'Pending' },
        'CONFIRMED': { color: 'bg-blue-900/50 text-blue-400 border-blue-800/50', label: 'Confirmed' },
        'IN_PROGRESS': { color: 'bg-orange-900/50 text-orange-400 border-orange-800/50', label: 'In Progress' },
        'COMPLETED': { color: 'bg-blue-900/50 text-blue-400 border-blue-800/50', label: 'Completed' },
        'CANCELLED': { color: 'bg-red-900/50 text-red-400 border-red-800/50', label: 'Cancelled' }
      },
      user: {
        'ACTIVE': { color: 'bg-green-900/50 text-green-400 border-green-800/50', label: 'Active' },
        'INACTIVE': { color: 'bg-gray-900/50 text-gray-400 border-gray-800/50', label: 'Inactive' },
        'SUSPENDED': { color: 'bg-red-900/50 text-red-400 border-red-800/50', label: 'Suspended' }
      },
      provider: {
        'PENDING': { color: 'bg-orange-900/50 text-orange-400 border-orange-800/50', label: 'Pending' },
        'APPROVED': { color: 'bg-green-900/50 text-green-400 border-green-800/50', label: 'Approved' },
        'REJECTED': { color: 'bg-red-900/50 text-red-400 border-red-800/50', label: 'Rejected' },
        'SUSPENDED': { color: 'bg-red-900/50 text-red-400 border-red-800/50', label: 'Suspended' }
      },
      payment: {
        'PENDING': { color: 'bg-orange-900/50 text-orange-400 border-orange-800/50', label: 'Pending' },
        'COMPLETED': { color: 'bg-green-900/50 text-green-400 border-green-800/50', label: 'Completed' },
        'FAILED': { color: 'bg-red-900/50 text-red-400 border-red-800/50', label: 'Failed' },
        'REFUNDED': { color: 'bg-blue-900/50 text-blue-400 border-blue-800/50', label: 'Refunded' }
      }
    }

    const config = statusConfig[type as keyof typeof statusConfig]?.[status as keyof typeof statusConfig[keyof typeof statusConfig]] || 
                   { color: 'bg-gray-900/50 text-gray-400 border-gray-800/50', label: status }

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getIcon = (activityType: string) => {
    switch (activityType) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-green-400" />
      case 'user':
        return <User className="w-5 h-5 text-purple-400" />
      case 'provider':
        return <Clock className="w-5 h-5 text-orange-400" />
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-400" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-400" />
    }
  }

  const getIconBg = (activityType: string) => {
    switch (activityType) {
      case 'booking':
        return 'bg-green-400/20'
      case 'user':
        return 'bg-purple-400/20'
      case 'provider':
        return 'bg-orange-400/20'
      case 'payment':
        return 'bg-green-400/20'
      default:
        return 'bg-blue-400/20'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Handle real-time booking updates
  const handleBookingUpdate = useCallback((event: SocketEvent) => {
    if (event.action === 'status_changed' && type === 'bookings') {
      console.log('📋 Admin: Booking status changed, refreshing activities', event.data)
      // Refresh activities when booking status changes
      fetchRecentActivities()
    }
  }, [type, fetchRecentActivities])

  // Socket connection for real-time updates (only for bookings)
  const { connected } = useSocket({
    userId: 'admin',
    role: 'ADMIN',
    enablePolling: false,
    onBookingUpdate: type === 'bookings' ? handleBookingUpdate : undefined,
  })

  // Initial fetch
  useEffect(() => {
    fetchRecentActivities()
  }, [fetchRecentActivities])

  // Immediate refresh on mount for bookings (to catch any status changes)
  useEffect(() => {
    if (type === 'bookings') {
      // Small delay to ensure page is fully loaded
      const timeout = setTimeout(() => {
        console.log('🔄 Initial refresh for bookings on mount')
        fetchRecentActivities()
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [type, fetchRecentActivities])

  // Auto-refresh every 15 seconds as fallback (for bookings only)
  useEffect(() => {
    if (type !== 'bookings') return // Only auto-refresh bookings
    
    const interval = setInterval(() => {
      console.log(`🔄 Auto-refreshing ${type} activities`)
      fetchRecentActivities()
    }, 15000) // 15 seconds (reduced for faster updates)

    return () => clearInterval(interval)
  }, [type, fetchRecentActivities])

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    if (type !== 'bookings') return
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page visible, refreshing bookings')
        fetchRecentActivities()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [type, fetchRecentActivities])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center mx-auto mb-4">
          {getIcon(type)}
        </div>
        <p className="text-gray-400">No recent {type} activity</p>
        <button
          onClick={fetchRecentActivities}
          className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Recent {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
        <button
          onClick={fetchRecentActivities}
          disabled={refreshing}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${getIconBg(activity.type)} rounded-lg flex items-center justify-center`}>
              {getIcon(activity.type)}
            </div>
            <div>
              <p className="text-white font-medium">{activity.title}</p>
              <p className="text-gray-400 text-sm">{activity.description}</p>
              <p className="text-gray-500 text-xs">{formatTimestamp(activity.timestamp)}</p>
            </div>
          </div>
          {getStatusBadge(activity.status, activity.type)}
        </div>
      ))}
    </div>
  )
}
