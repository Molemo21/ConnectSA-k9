"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ConsolidatedMobileHeader } from "@/components/ui/consolidated-mobile-header"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { MobileStatsCard } from "@/components/ui/mobile-stats-card"
import { MobileActionCard } from "@/components/ui/mobile-action-card"
import { MobileTabbedSection } from "@/components/ui/mobile-tabbed-section"
import { MobileCollapsibleSection } from "@/components/ui/mobile-collapsible-section"
import { 
  Calendar, 
  Clock, 
  Star, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  TrendingUp,
  RefreshCw,
  Loader2,
  Home,
  Wrench,
  Paintbrush,
  Zap,
  Car,
  Scissors,
  Search,
  Filter,
  BarChart3,
  Bell,
  Menu,
  X,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  MessageCircle,
  HelpCircle,
  Bell as NotificationIcon,
  GripVertical,
  RotateCcw,
  Phone,
  Mail,
  MoreVertical,
  MapPin,
  Timer,
  CheckSquare,
  AlertTriangle,
  Info,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Activity
} from "lucide-react"
import { useSocket, SocketEvent } from "@/lib/socket-client"
import { useBookingsPagination } from "@/lib/use-pagination"
import { toast } from "react-hot-toast"

interface Booking {
  id: string
  status: string
  scheduledDate: string
  duration: number
  totalAmount: number
  platformFee: number
  description?: string
  address: string
  createdAt: string
  updatedAt: string
  service: {
    id: string
    name: string
    description?: string
    category: string
    basePrice?: number
  }
  provider: {
    id: string
    businessName?: string
    user: {
      id: string
      name: string
      email: string
      phone?: string
    }
  }
  payment?: {
    id: string
    status: string
    amount: number
    escrowAmount: number
    platformFee: number
    paystackRef: string
    paidAt?: string
    authorizationUrl?: string
    payout?: {
      id: string
      status: string
      transferCode?: string
      createdAt: string
      updatedAt: string
    }
  }
  review?: {
    id: string
    rating: number
    comment?: string
    createdAt: string
  }
}

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  inProgressBookings: number
  completedBookings: number
  totalSpent: number
  pendingPayments: number
  averageRating: number
}

export function PaginatedClientDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("all")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    inProgressBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    pendingPayments: 0,
    averageRating: 0
  })

  // Pagination hook for bookings
  const {
    items: bookings,
    loading,
    loadingMore,
    error,
    hasMore,
    count,
    loadMore,
    refresh,
    addItem,
    updateItem
  } = useBookingsPagination('CLIENT', 'test_user_123')

  // WebSocket connection for real-time updates
  const { connected, error: socketError, reconnect, isPolling } = useSocket({
    userId: 'test_user_123',
    role: 'CLIENT',
    enablePolling: true,
    pollingInterval: 60000,
    onBookingUpdate: handleBookingUpdate,
    onPaymentUpdate: handlePaymentUpdate,
    onNotification: handleNotification
  })

  // Handle real-time booking updates
  function handleBookingUpdate(event: SocketEvent) {
    console.log('📱 Booking update received:', event)
    
    if (event.action === 'accepted') {
      toast.success(`🎉 Your booking has been accepted!`, {
        duration: 5000,
        position: 'top-center'
      })
      
      // Update the specific booking in pagination state
      updateItem(event.data as Booking)
      
      // Add notification
      setNotifications(prev => [{
        id: `booking_${event.data.id}_${Date.now()}`,
        type: 'booking_accepted',
        title: 'Booking Accepted',
        message: `Your booking for ${event.data.service?.name} has been accepted`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
    }
  }

  // Handle real-time payment updates
  function handlePaymentUpdate(event: SocketEvent) {
    console.log('💳 Payment update received:', event)
    
    if (event.action === 'status_changed') {
      const statusMessages = {
        'ESCROW': '💰 Payment received and held in escrow',
        'RELEASED': '✅ Payment released to provider',
        'FAILED': '❌ Payment failed'
      }
      
      const message = statusMessages[event.data.status as keyof typeof statusMessages]
      if (message) {
        toast.success(message, {
          duration: 5000,
          position: 'top-center'
        })
      }
      
      // Find and update the booking with the payment change
      const updatedBooking = bookings.find(b => b.payment?.id === event.data.id)
      if (updatedBooking) {
        const updatedPayment = { ...updatedBooking.payment!, status: event.data.status }
        const newBooking = { ...updatedBooking, payment: updatedPayment }
        updateItem(newBooking)
      }
      
      // Add notification
      setNotifications(prev => [{
        id: `payment_${event.data.id}_${Date.now()}`,
        type: 'payment_update',
        title: 'Payment Update',
        message: `Payment status changed to ${event.data.status}`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
    }
  }

  // Handle real-time notifications
  function handleNotification(event: SocketEvent) {
    console.log('🔔 Notification received:', event)
    
    toast.info(event.data.message || 'New notification', {
      duration: 4000,
      position: 'top-center'
    })
    
    setNotifications(prev => [{
      id: `notification_${Date.now()}`,
      type: 'general',
      title: event.data.title || 'Notification',
      message: event.data.message || 'You have a new notification',
      timestamp: new Date().toISOString(),
      read: false
    }, ...prev])
  }

  // Calculate stats from bookings
  useEffect(() => {
    const newStats: DashboardStats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      inProgressBookings: bookings.filter(b => b.status === 'IN_PROGRESS').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalSpent: bookings
        .filter(b => b.payment?.status === 'RELEASED')
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      pendingPayments: bookings
        .filter(b => b.payment?.status === 'ESCROW')
        .reduce((sum, b) => sum + (b.payment?.amount || 0), 0),
      averageRating: bookings
        .filter(b => b.review?.rating)
        .reduce((sum, b, _, arr) => sum + (b.review?.rating || 0) / arr.length, 0)
    }
    
    setStats(newStats)
  }, [bookings])

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2 text-xs">
      {connected ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Live</span>
        </>
      ) : isPolling ? (
        <>
          <Activity className="h-3 w-3 text-yellow-500 animate-pulse" />
          <span className="text-yellow-600">Polling</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  )

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    switch (activeTab) {
      case "pending":
        return booking.status === "PENDING"
      case "confirmed":
        return booking.status === "CONFIRMED"
      case "in-progress":
        return booking.status === "IN_PROGRESS"
      case "completed":
        return booking.status === "COMPLETED"
      default:
        return true
    }
  })

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get payment status badge color
  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ESCROW":
        return "bg-blue-100 text-blue-800"
      case "RELEASED":
        return "bg-green-100 text-green-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600 mb-4">Failed to load bookings</p>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ConsolidatedMobileHeader
        title="My Dashboard"
        showBackButton={false}
        rightElement={
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        }
      />

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MobileStatsCard
            title="Total Bookings"
            value={stats.totalBookings.toString()}
            icon={<Calendar className="h-5 w-5" />}
            trend={stats.totalBookings > 0 ? "+12%" : "0%"}
          />
          <MobileStatsCard
            title="Total Spent"
            value={`R${stats.totalSpent.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend={stats.totalSpent > 0 ? "+8%" : "0%"}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MobileStatsCard
            title="Pending Payments"
            value={`R${stats.pendingPayments.toFixed(2)}`}
            icon={<Clock className="h-5 w-5" />}
            trend="0%"
          />
          <MobileStatsCard
            title="Average Rating"
            value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
            icon={<Star className="h-5 w-5" />}
            trend={stats.averageRating > 0 ? "+5%" : "0%"}
          />
        </div>
      </div>

      {/* Bookings Section */}
      <div className="px-4 pb-20">
        <MobileTabbedSection
          title="My Bookings"
          tabs={[
            { id: "all", label: "All", count: stats.totalBookings },
            { id: "pending", label: "Pending", count: stats.pendingBookings },
            { id: "confirmed", label: "Confirmed", count: stats.confirmedBookings },
            { id: "in-progress", label: "In Progress", count: stats.inProgressBookings },
            { id: "completed", label: "Completed", count: stats.completedBookings }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <div className="space-y-3 mt-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bookings found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === "all" ? "You haven't made any bookings yet" : `No ${activeTab} bookings`}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {booking.service.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {booking.provider.businessName || booking.provider.user.name}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusBadgeColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(booking.scheduledDate).toLocaleDateString('en-ZA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(booking.scheduledDate).toLocaleTimeString('en-ZA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{booking.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>R{booking.totalAmount.toFixed(2)}</span>
                      </div>

                      {booking.payment && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-600">Payment:</span>
                          <Badge className={getPaymentStatusBadgeColor(booking.payment.status)}>
                            {booking.payment.status}
                          </Badge>
                        </div>
                      )}

                      {booking.payment?.payout && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-600">Payout:</span>
                          <Badge className={getPaymentStatusBadgeColor(booking.payment.payout.status)}>
                            {booking.payment.payout.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {booking.status === "PENDING" && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading more bookings...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Load More Bookings
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div className="h-4" />
          </div>
        </MobileTabbedSection>
      </div>

      {/* Floating Action Button */}
      <MobileFloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        onClick={() => window.location.href = '/services'}
        label="Book Service"
      />

      {/* Bottom Navigation */}
      <MobileBottomNav
        activeTab="dashboard"
        onTabChange={(tab) => {
          if (tab === 'services') window.location.href = '/services'
          if (tab === 'profile') window.location.href = '/profile'
        }}
      />
    </div>
  )
}
