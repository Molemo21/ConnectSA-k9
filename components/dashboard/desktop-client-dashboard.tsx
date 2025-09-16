"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Calendar, 
  CreditCard, 
  HelpCircle, 
  Settings, 
  LogOut, 
  Menu, 
  RefreshCw, 
  Bell, 
  Plus, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Phone, 
  MapPin, 
  CalendarDays,
  X,
  DollarSign,
  AlertCircle,
  Loader2,
  Star,
  TrendingUp,
  Search,
  Filter
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { useBookingData } from "@/hooks/use-booking-data"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { CompactBookingCard } from "@/components/dashboard/compact-booking-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { processPayment, handlePaymentResult } from "@/lib/payment-utils"

export function DesktopClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState("current")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialBookings, setInitialBookings] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<string | null>(null)
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false)

  // Use the optimized booking data hook
  const { 
    bookings: optimizedBookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading: isRefreshing, 
    error: refreshError 
  } = useBookingData(initialBookings)

  // Handle payment success callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment')
    const bookingId = urlParams.get('booking')
    
    if (paymentSuccess === 'success' && bookingId) {
      if (sessionStorage.getItem('payment_callback_any') !== '1') {
        showToast.success('Payment completed successfully! Refreshing booking status...')
        sessionStorage.setItem('payment_callback_any', '1')
      }
      
      if (refreshBooking) {
        refreshBooking(bookingId)
      }
      
      setTimeout(() => {
        if (refreshAllBookings) {
          refreshAllBookings()
          setLastRefresh(new Date())
        }
      }, 1000)
    }
  }, [refreshBooking, refreshAllBookings])

  // Auto-refresh mechanism for payment status updates
  useEffect(() => {
    if (!optimizedBookings.length || !user) return

    const hasPaymentBookings = optimizedBookings.some(booking => 
      booking.payment && ['PENDING', 'ESCROW'].includes(booking.payment.status)
    )

    if (!hasPaymentBookings) return

    const pollInterval = setInterval(async () => {
      try {
        const currentBookings = await fetch('/api/bookings/my-bookings').then(res => res.json()).catch(() => null)
        
        if (currentBookings && currentBookings.bookings) {
          let hasChanges = false
          
          currentBookings.bookings.forEach((currentBooking: any) => {
            const storedBooking = optimizedBookings.find(b => b.id === currentBooking.id)
            if (storedBooking && storedBooking.payment && currentBooking.payment) {
              if (storedBooking.payment.status !== currentBooking.payment.status) {
                hasChanges = true
              }
            }
          })
          
          if (hasChanges && refreshAllBookings) {
            await refreshAllBookings()
            setLastRefresh(new Date())
          }
        }
      } catch (error) {
        console.error('Payment status polling error:', error)
      }
    }, 8000)

    return () => clearInterval(pollInterval)
  }, [optimizedBookings, user, refreshAllBookings])

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (isRefreshing) {
      showToast.info("Refresh already in progress. Please wait.")
      return
    }

    try {
      await refreshAllBookings()
      setLastRefresh(new Date())
      showToast.success("Payment statuses refreshed successfully!")
    } catch (error) {
      console.error('Manual refresh error:', error)
      showToast.error("Failed to refresh payment statuses. Please try again.")
    }
  }

  // Modal handlers
  const openModal = (content: string) => {
    setModalContent(content)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalContent(null)
  }

  // Payment handler - matches old dashboard exactly
  const handlePay = async (bookingId: string) => {
    // Prevent duplicate clicks
    if (isPaymentInProgress) return
    setIsPaymentInProgress(true)
    
    try {
      const result = await processPayment(bookingId)

      if (result.success && result.shouldRedirect && result.authorizationUrl) {
        // Immediate redirect
        try {
          window.location.href = result.authorizationUrl
          return
        } catch {
          try {
            window.location.replace(result.authorizationUrl)
            return
          } catch {
            const w = window.open(result.authorizationUrl, '_blank', 'noopener,noreferrer')
            if (!w) {
              showToast.error('Redirect blocked. Please allow popups or use Continue Payment link.')
            }
          }
        }
      }

      if (result.success) {
        handlePaymentResult(result)
        return
      }

      // Failure: try recovery by checking current payment
      try {
        const statusRes = await fetch(`/api/book-service/${bookingId}/payment-status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const payment = statusData?.payment
          if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
            window.location.href = payment.authorizationUrl
            return
          }
        }
      } catch {}
      showToast.error(result.message || 'Payment failed. Please try again.')
    } catch (error) {
      console.error('Payment error:', error)
      // Attempt recovery
      try {
        const statusRes = await fetch(`/api/book-service/${bookingId}/payment-status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const payment = statusData?.payment
          if (payment?.status === 'PENDING' && payment?.authorizationUrl) {
            window.location.href = payment.authorizationUrl
            return
          }
        }
      } catch {}
      showToast.error('Network error. Please try again.')
    } finally {
      setIsPaymentInProgress(false)
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          window.location.href = '/login'
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        if (userData.user.role === "PROVIDER") {
          window.location.href = '/provider/dashboard'
          return
        } else if (userData.user.role === "ADMIN") {
          window.location.href = '/admin'
          return
        } else if (userData.user.role !== "CLIENT") {
          window.location.href = '/'
          return
        }

        if (!userData.user.emailVerified) {
          window.location.href = '/verify-email'
          return
        }

        // Fetch bookings
        const bookingsRes = await fetch('/api/bookings/my-bookings', {
          credentials: 'include'
        })
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings || [])
          setInitialBookings(bookingsData.bookings || [])
        }

        // Fetch services
        const servicesRes = await fetch('/api/services', {
          credentials: 'include'
        })
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData)
        }

      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard data fetch error:', err)
        showToast.error('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Helper function to get service icon
  function getServiceIcon(serviceName: string) {
    const name = serviceName.toLowerCase()
    if (name.includes('clean') || name.includes('house')) return Home
    if (name.includes('plumb')) return BarChart3
    if (name.includes('paint')) return BarChart3
    if (name.includes('electr')) return BarChart3
    if (name.includes('car') || name.includes('wash')) return BarChart3
    if (name.includes('hair') || name.includes('beauty') || name.includes('makeup')) return BarChart3
    return Home
  }

  // Get current active booking
  const currentBooking = optimizedBookings.find(b => 
    ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)
  )

  // Calculate booking counts
  const bookingCounts = {
    current: optimizedBookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
    completed: optimizedBookings.filter(b => b.status === 'COMPLETED').length,
    ongoing: optimizedBookings.filter(b => b.status === 'IN_PROGRESS').length,
    payments: optimizedBookings.filter(b => b.payment && b.payment.status === 'PENDING').length
  }

  // Calculate stats
  const totalBookings = optimizedBookings.length
  const completedBookings = optimizedBookings.filter(b => b.status === "COMPLETED").length
  const pendingBookings = optimizedBookings.filter(b => b.status === "PENDING").length
  const confirmedBookings = optimizedBookings.filter(b => b.status === "CONFIRMED").length
  const inProgressBookings = optimizedBookings.filter(b => b.status === "IN_PROGRESS").length
  const cancelledBookings = optimizedBookings.filter(b => b.status === "CANCELLED").length
  
  const totalSpent = optimizedBookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  
  const averageRating = optimizedBookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    optimizedBookings.filter(b => b.review).length || 0

  // Process services
  const popularServices = services.map((service: any) => {
    const providerCount = service.providers?.length || 0
    const allRatings = (service.providers || []).flatMap((ps: any) => 
      (ps.provider?.reviews || []).map((r: any) => r.rating)
    )
    const averageServiceRating = allRatings.length > 0 
      ? allRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allRatings.length 
      : 0

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      providerCount,
      averageRating: Math.round(averageServiceRating * 10) / 10,
      icon: getServiceIcon(service.name),
    }
  }).filter(service => service.providerCount > 0).slice(0, 6)

  // Filter bookings based on selected filter
  const filteredBookings = optimizedBookings.filter(booking => {
    if (selectedFilter === "current") return ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)
    if (selectedFilter === "completed") return booking.status === 'COMPLETED'
    if (selectedFilter === "ongoing") return booking.status === 'IN_PROGRESS'
    if (selectedFilter === "payments") return booking.payment && booking.payment.status === 'PENDING'
    return true
  })

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, active: true, action: () => setSelectedFilter('current') },
    { id: 'bookings', label: 'Bookings', icon: Calendar, badge: bookingCounts.current.toString(), action: () => openModal('bookings') },
    { id: 'payments', label: 'Payments', icon: CreditCard, action: () => openModal('payments') },
    { id: 'support', label: 'Support', icon: HelpCircle, action: () => openModal('support') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => openModal('settings') },
    { id: 'logout', label: 'Logout', icon: LogOut, isDestructive: true, action: () => {
      openModal('logout')
    }}
  ]

  const filterButtons = [
    { id: 'current', label: 'Current', icon: Clock, count: bookingCounts.current },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: bookingCounts.payments },
    { id: 'ongoing', label: 'Ongoing', icon: BarChart3, count: bookingCounts.ongoing },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: bookingCounts.completed }
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                </div>
              </div>
              <div>
                <div className="text-white font-bold text-lg">ProLiink</div>
                <div className="text-blue-400 text-xs">Connect</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors duration-200 ${
                    item.active 
                      ? 'bg-purple-600 text-white' 
                      : item.isDestructive 
                      ? 'text-red-400 hover:bg-red-900/20' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                  {user.name || 'User'}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400">Welcome back, {user.name || user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
              </Button>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {/* Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-6">
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => window.location.href = '/book-service'}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
            {filterButtons.map((button) => {
              const Icon = button.icon
              return (
                <Button
                  key={button.id}
                  variant={selectedFilter === button.id ? "default" : "outline"}
                  className={`${
                    selectedFilter === button.id 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedFilter(button.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {button.label}
                  {button.count > 0 && (
                    <Badge className="ml-2 bg-purple-500 text-white text-xs">
                      {button.count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Payment Status Alert */}
          {optimizedBookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-300">
                    {optimizedBookings.filter(b => b.payment && b.payment.status === 'PENDING').length} payment(s) processing
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-blue-400">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                  <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Active Booking Card */}
          {currentBooking && selectedFilter === 'current' && (
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">Current Active Booking</CardTitle>
                      <CardDescription className="text-gray-400">Your ongoing service booking</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-xl">{currentBooking.service?.name || 'Service'}</h3>
                    <p className="text-gray-400">{currentBooking.service?.category || 'Category'}</p>
                    <Badge className="bg-yellow-500 text-black mt-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentBooking.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">R{currentBooking.totalAmount || '0.00'}</div>
                    <div className="text-gray-400 text-sm">Total Amount</div>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 text-sm">Provider</div>
                    <div className="text-white font-medium">
                      {currentBooking.provider?.businessName || 'Provider Name'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button className="bg-gray-700 hover:bg-gray-600 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Provider
                    </Button>
                    {((currentBooking.status === 'CONFIRMED') && (!currentBooking.payment || currentBooking.payment.status === 'PENDING' || currentBooking.payment.status === 'FAILED')) && (
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handlePay(currentBooking.id)}
                        disabled={isPaymentInProgress}
                      >
                        {isPaymentInProgress ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <DollarSign className="w-4 h-4 mr-2" />
                        )}
                        {isPaymentInProgress ? "Processing..." : "Pay"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">
                        {new Date(currentBooking.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {new Date(currentBooking.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium">Service Location</div>
                      <div className="text-gray-400 text-sm truncate max-w-xs">
                        {currentBooking.address || 'Address not provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                {currentBooking.payment && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-400 text-sm">Payment Status</div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={currentBooking.payment.status} />
                          <span className="text-white font-medium">
                            R{currentBooking.payment.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                      {currentBooking.payment.status === 'PENDING' && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            window.location.href = `/payment/${currentBooking.id}`
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 pt-4">
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this booking?')) {
                        // Handle cancellation
                        showToast.info('Cancellation request sent to provider')
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh Status
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => window.location.href = '/bookings'}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Bookings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Active Booking */}
          {!currentBooking && selectedFilter === 'current' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">No Active Bookings</h3>
                <p className="text-gray-400 mb-6">You don't have any current service bookings.</p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = '/book-service'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Book a Service
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payments Section - Same theme as Current */}
          {selectedFilter === 'payments' && (
            <div className="space-y-6">
              {filteredBookings.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">No Pending Payments</h3>
                    <p className="text-gray-400 mb-6">You don't have any pending payments at the moment.</p>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.location.href = '/book-service'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Book a Service
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Home className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{booking.service?.name || 'Service'}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {booking.provider?.businessName || booking.provider?.firstName} {booking.provider?.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-sm">Scheduled: {new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Time: {new Date(booking.scheduledDate).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{booking.provider?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">R{booking.payment?.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      {booking.payment && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-400 text-sm">Payment Status</div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={booking.payment.status} />
                                <span className="text-white font-medium">
                                  R{booking.payment.amount?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                            {((booking.status === 'CONFIRMED') && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')) && (
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handlePay(booking.id)}
                                disabled={isPaymentInProgress}
                              >
                                {isPaymentInProgress ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <DollarSign className="w-4 h-4 mr-2" />
                                )}
                                {isPaymentInProgress ? "Processing..." : "Pay"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4 pt-4">
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              showToast.info('Cancellation request sent to provider')
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Refresh Status
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => window.location.href = '/bookings'}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View All Bookings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Ongoing Section - Same theme as Current */}
          {selectedFilter === 'ongoing' && (
            <div className="space-y-6">
              {filteredBookings.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">No Ongoing Services</h3>
                    <p className="text-gray-400 mb-6">You don't have any services in progress at the moment.</p>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.location.href = '/book-service'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Book a Service
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{booking.service?.name || 'Service'}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {booking.provider?.businessName || booking.provider?.firstName} {booking.provider?.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-sm">Scheduled: {new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Time: {new Date(booking.scheduledDate).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{booking.provider?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">R{booking.payment?.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      {booking.payment && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-400 text-sm">Payment Status</div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={booking.payment.status} />
                                <span className="text-white font-medium">
                                  R{booking.payment.amount?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                            {((booking.status === 'CONFIRMED') && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')) && (
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handlePay(booking.id)}
                                disabled={isPaymentInProgress}
                              >
                                {isPaymentInProgress ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <DollarSign className="w-4 h-4 mr-2" />
                                )}
                                {isPaymentInProgress ? "Processing..." : "Pay"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4 pt-4">
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              showToast.info('Cancellation request sent to provider')
                            }
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          Refresh Status
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => window.location.href = '/bookings'}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View All Bookings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Completed Section - Same theme as Current */}
          {selectedFilter === 'completed' && (
            <div className="space-y-6">
              {filteredBookings.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">No Completed Services</h3>
                    <p className="text-gray-400 mb-6">You haven't completed any services yet.</p>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.location.href = '/book-service'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Book Your First Service
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{booking.service?.name || 'Service'}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {booking.provider?.businessName || booking.provider?.firstName} {booking.provider?.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <CalendarDays className="w-4 h-4" />
                            <span className="text-sm">Completed: {new Date(booking.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Time: {new Date(booking.updatedAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{booking.address}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{booking.provider?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">R{booking.payment?.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status */}
                      {booking.payment && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-gray-400 text-sm">Payment Status</div>
                              <div className="flex items-center space-x-2">
                                <StatusBadge status={booking.payment.status} />
                                <span className="text-white font-medium">
                                  R{booking.payment.amount?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                            {((booking.status === 'CONFIRMED') && (!booking.payment || booking.payment.status === 'PENDING' || booking.payment.status === 'FAILED')) && (
                              <Button 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handlePay(booking.id)}
                                disabled={isPaymentInProgress}
                              >
                                {isPaymentInProgress ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <DollarSign className="w-4 h-4 mr-2" />
                                )}
                                {isPaymentInProgress ? "Processing..." : "Pay"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-4 pt-4">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            // Handle review
                            showToast.info('Review functionality coming soon')
                          }}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave Review
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => {
                            // Handle rebook
                            window.location.href = `/book-service?service=${booking.serviceId}`
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Again
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => window.location.href = '/bookings'}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View All Bookings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Services Section */}
          {selectedFilter === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold">Popular Services</h3>
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => window.location.href = '/services'}
                >
                  View All Services
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularServices.map((service) => {
                  const Icon = service.icon
                  return (
                    <Card 
                      key={service.id} 
                      className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/book-service?service=${service.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-lg mb-1">{service.name}</h4>
                            <p className="text-gray-400 mb-2">{service.category}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-gray-300">{service.averageRating.toFixed(1)}</span>
                              </div>
                              <span className="text-sm text-gray-500">{service.providerCount} providers</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/book-service?service=${service.id}`
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modal System */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                {modalContent === 'bookings' && 'All Bookings'}
                {modalContent === 'payments' && 'Payment History'}
                {modalContent === 'support' && 'Help & Support'}
                {modalContent === 'settings' && 'Settings'}
                {modalContent === 'logout' && 'Confirm Logout'}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={closeModal}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              {modalContent === 'bookings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{totalBookings}</div>
                      <div className="text-sm text-gray-400">Total Bookings</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{completedBookings}</div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{pendingBookings}</div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{inProgressBookings}</div>
                      <div className="text-sm text-gray-400">In Progress</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {optimizedBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{booking.service?.name || 'Service'}</div>
                            <div className="text-sm text-gray-400">
                              {booking.provider?.businessName || booking.provider?.firstName} {booking.provider?.lastName}
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={booking.status} />
                            <div className="text-sm text-gray-400 mt-1">
                              {new Date(booking.scheduledDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => window.location.href = '/bookings'}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      View All Bookings
                    </Button>
                  </div>
                </div>
              )}

              {modalContent === 'payments' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">R{totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-gray-400">Total Spent</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {optimizedBookings.filter(b => b.payment && b.payment.status === 'PENDING').length}
                      </div>
                      <div className="text-sm text-gray-400">Pending Payments</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {optimizedBookings.filter(b => b.payment && b.payment.status === 'COMPLETED').length}
                      </div>
                      <div className="text-sm text-gray-400">Completed Payments</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {optimizedBookings
                      .filter(b => b.payment)
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{booking.service?.name || 'Service'}</div>
                              <div className="text-sm text-gray-400">
                                {new Date(booking.scheduledDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-white">R{booking.payment?.amount?.toFixed(2) || '0.00'}</div>
                              <StatusBadge status={booking.payment?.status || 'PENDING'} />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {modalContent === 'support' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Need Help?</h3>
                    <p className="text-gray-400">We're here to assist you with any questions or issues.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Contact Support</h4>
                      <p className="text-sm text-gray-400 mb-3">Get help from our support team</p>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Contact Us
                      </Button>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">FAQ</h4>
                      <p className="text-sm text-gray-400 mb-3">Find answers to common questions</p>
                      <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-600">
                        View FAQ
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {modalContent === 'settings' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Account Settings</h3>
                    <p className="text-gray-400">Manage your account preferences and settings.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Profile Information</h4>
                      <p className="text-sm text-gray-400 mb-3">Update your personal details</p>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                        Edit Profile
                      </Button>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Notification Preferences</h4>
                      <p className="text-sm text-gray-400 mb-3">Manage how you receive notifications</p>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                        Notification Settings
                      </Button>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Privacy & Security</h4>
                      <p className="text-sm text-gray-400 mb-3">Control your privacy and security settings</p>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                        Security Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {modalContent === 'logout' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LogOut className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Are you sure you want to logout?</h3>
                    <p className="text-gray-400">You will be signed out of your account and redirected to the login page.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <Button 
                      onClick={closeModal}
                      variant="outline" 
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        window.location.href = '/logout'
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
