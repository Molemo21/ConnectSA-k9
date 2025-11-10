"use client"

import { useEffect, useRef, useState } from "react"
import { usePaymentCallback } from "@/hooks/use-payment-callback"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, 
  TrendingUp, DollarSign, CheckCircle, AlertCircle, BarChart3, RefreshCw, AlertTriangle, 
  Loader2, Menu, X, Bell, Settings, User, LogOut, ChevronLeft, ChevronRight, Activity,
  CreditCard, BookOpen, MessageSquare, Shield, HelpCircle, PanelLeftClose, PanelLeftOpen,
  ArrowUpRight, ArrowDownRight, Phone, Edit
} from "lucide-react"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { BookingTimeline, CompactBookingTimeline } from "@/components/dashboard/booking-timeline"
import { DashboardLoadingScreen } from "@/components/dashboard/dashboard-loading-screen"
import { PaymentsDashboard } from "@/components/dashboard/payments-dashboard"
import { showToast, handleApiError } from "@/lib/toast"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useSmartBooking } from "@/hooks/use-smart-booking"
import { SafeDateDisplay, SafeTimeOnlyDisplay } from "@/components/ui/safe-time-display"
import { NotificationBell } from "@/components/ui/notification-bell"
import { formatBookingPrice } from '@/lib/price-utils'

// Helper function to get service icon
function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase()
  if (name.includes('clean') || name.includes('house')) return Home
  if (name.includes('plumb')) return Wrench
  if (name.includes('paint')) return Paintbrush
  if (name.includes('electr')) return Zap
  if (name.includes('car') || name.includes('wash')) return Car
  if (name.includes('hair') || name.includes('beauty') || name.includes('makeup')) return Scissors
  return Home // default icon
}

export function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialBookings, setInitialBookings] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedActiveBooking, setSelectedActiveBooking] = useState<any>(null)
  
  // Payments dashboard state
  const [isPaymentsDashboardExpanded, setIsPaymentsDashboardExpanded] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Get search params to detect payment success callback
  const searchParams = useSearchParams()

  // Use the smart booking hook with real-time updates
  const { 
    bookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading: isRefreshing, 
    error: refreshError,
    isConnected,
    optimisticUpdate
  } = useSmartBooking(initialBookings)

  // Handle payment success callback via shared hook
  usePaymentCallback({
    onRefreshBooking: refreshBooking,
    onRefreshAll: async () => {
      await refreshAllBookings()
      setLastRefresh(new Date())
    }
  })

  // Handle bookingId URL parameter - scroll to and highlight specific booking card
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Use Next.js searchParams hook for reactive URL parameter reading
    const bookingId = searchParams.get('bookingId')
    
    if (bookingId && bookings && bookings.length > 0) {
      console.log(`🔍 Booking ID detected in URL: ${bookingId}, attempting to scroll to card`)
      
      // Wait for DOM to render
      const scrollTimeout = setTimeout(() => {
        const bookingCard = document.querySelector(`[data-booking-id="${bookingId}"]`)
        
        if (bookingCard) {
          // Scroll to card with smooth behavior
          bookingCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          
          // Add highlight animation
          bookingCard.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'bg-blue-50/30', 'transition-all', 'duration-300')
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            bookingCard.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-75', 'bg-blue-50/30')
          }, 3000)
          
          console.log(`✅ Successfully scrolled to booking card: ${bookingId}`)
        } else {
          console.warn(`⚠️ Booking card not found for bookingId: ${bookingId}. Card may not be rendered yet.`)
          
          // Retry after a longer delay (in case bookings are still loading)
          setTimeout(() => {
            const retryCard = document.querySelector(`[data-booking-id="${bookingId}"]`)
            if (retryCard) {
              retryCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              })
              retryCard.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-75', 'bg-blue-50/30', 'transition-all', 'duration-300')
              setTimeout(() => {
                retryCard.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-75', 'bg-blue-50/30')
              }, 3000)
              console.log(`✅ Successfully found and scrolled to booking card on retry: ${bookingId}`)
            } else {
              console.error(`❌ Booking card still not found after retry: ${bookingId}`)
            }
          }, 1500)
        }
        
        // Clean up URL by removing bookingId parameter
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('bookingId')
        window.history.replaceState({}, '', newUrl.toString())
      }, 500)
      
      return () => clearTimeout(scrollTimeout)
    } else if (bookingId && (!bookings || bookings.length === 0)) {
      console.log(`⏳ Bookings not loaded yet, bookingId will be handled when bookings are available: ${bookingId}`)
    }
  }, [bookings, searchParams])

  // Manual refresh function with proper error handling
  const handleManualRefresh = async () => {
    if (isRefreshing) {
      showToast.info("Refresh already in progress. Please wait.")
      return
    }

    try {
      await refreshAllBookings()
      setLastRefresh(new Date())
      showToast.success("Booking statuses refreshed successfully!")
    } catch (error) {
      console.error('Manual refresh error:', error)
      showToast.error("Failed to refresh booking statuses. Please try again.")
    }
  }

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch user data
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          window.location.href = '/login'
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        // Check user role and redirect if needed
        if (userData.user.role === "PROVIDER") {
          const providerRes = await fetch('/api/provider/status')
          if (providerRes.ok) {
            const providerData = await providerRes.json()
            if (!providerData.provider || providerData.provider.status === "INCOMPLETE" || providerData.provider.status === "REJECTED") {
              window.location.href = '/provider/onboarding'
              return
            } else if (providerData.provider.status === "PENDING") {
              window.location.href = '/provider/pending'
              return
            } else if (providerData.provider.status === "APPROVED") {
              window.location.href = '/provider/dashboard'
              return
            }
          }
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
        console.log('🔍 Fetching bookings from API...')
        const bookingsRes = await fetch('/api/bookings/my-bookings', {
          credentials: 'include' // Include cookies for authentication
        })
        console.log('📥 Bookings API response:', {
          status: bookingsRes.status,
          statusText: bookingsRes.statusText,
          ok: bookingsRes.ok
        })
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          console.log('✅ Bookings data received:', {
            count: bookingsData.bookings?.length || 0,
            bookings: bookingsData.bookings
          })
          
          // Initialize the useBookingData hook with fetched data
          setInitialBookings(bookingsData.bookings || [])
        } else {
          console.error('❌ Failed to fetch bookings:', bookingsRes.status, bookingsRes.statusText)
          const errorText = await bookingsRes.text()
          console.error('❌ Error response body:', errorText)
        }

        // Fetch services
        const servicesRes = await fetch('/api/services', {
          credentials: 'include' // Include cookies for authentication
        })
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json()
          setServices(servicesData)
        } else {
          console.error('Failed to fetch services:', servicesRes.status, servicesRes.statusText)
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

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This ensures hooks are called in the same order on every render

  // Conditional rendering AFTER all hooks have been called
  if (loading) {
    return (
      <div className="h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <DashboardLoadingScreen />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Something went wrong</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  // Calculate real stats with enhanced details
  const totalBookings = bookings.length
  const completedBookingsCount = bookings.filter(b => b.status === "COMPLETED").length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED").length
  const inProgressBookings = bookings.filter(b => b.status === "IN_PROGRESS").length
  const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length
  
  const totalSpent = bookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  
  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

  // Calculate monthly trends (simplified)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear
  }).length

  const lastMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.scheduledDate)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear
  }).length

  const bookingGrowth = lastMonthBookings > 0 
    ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
    : thisMonthBookings > 0 ? 100 : 0

  // Process services with real data
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
  }).filter(service => service.providerCount > 0).slice(0, 6) // Show top 6 services with providers

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      showToast.error('Failed to logout. Please try again.')
    }
  }

  // Navigation items - now defined inside component where bookings is available
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { 
      name: 'Bookings', 
      href: '/bookings', 
      icon: Calendar, 
      current: false, 
      badge: pendingBookings > 0 ? pendingBookings : undefined 
    },
    { name: 'Payments', href: '/payments', icon: CreditCard, current: false },
    { name: 'Support', href: '/support', icon: HelpCircle, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
    { name: 'Logout', href: '#', icon: LogOut, current: false, isAction: true },
  ]

  // Filter bookings for different sections
  const incompleteBookings = bookings.filter(b => 
    !['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status)
  )
  
  const completedBookings = bookings.filter(b => 
    b.status === 'COMPLETED'
  )

  // Find the most recent active booking or use selected one
  const activeBooking = selectedActiveBooking || bookings
    .filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'PENDING_EXECUTION'].includes(b.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-gray-950/80 backdrop-blur border-r border-gray-800 transition-all duration-200 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <img 
                src="/handshake.png" 
                alt="ProLiink Connect Logo" 
                className="w-8 h-8 rounded-lg object-cover shadow-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-100">
                  ProL<span className="text-blue-400">ii</span>nk Connect
                </h1>
                <p className="text-xs text-gray-400">Client Dashboard</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            
            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-red-400 hover:bg-red-900/20 hover:text-red-300 ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`flex-shrink-0 w-5 h-5 ${
                    sidebarCollapsed ? '' : 'mr-3'
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </button>
              )
            }
            
            // Handle Payments navigation specially
            if (item.name === 'Payments') {
              return (
                <button
                  key={item.name}
                  onClick={() => setIsPaymentsDashboardExpanded(true)}
                  className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-purple-900/50 text-purple-400 border border-purple-800/50'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`flex-shrink-0 w-5 h-5 ${
                    sidebarCollapsed ? '' : 'mr-3'
                  }`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate">{item.name}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge className="ml-auto bg-purple-900/50 text-purple-400 text-xs border-purple-800/50">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              )
            }
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.current
                    ? 'bg-purple-900/50 text-purple-400 border border-purple-800/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  sidebarCollapsed ? '' : 'mr-3'
                }`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="ml-auto bg-purple-900/50 text-purple-400 text-xs border-purple-800/50">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </a>
            )
          })}
        </nav>

        {/* Payments Dashboard in Sidebar (when not collapsed) */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-800">
            <PaymentsDashboard
              bookings={bookings}
              isExpanded={false}
              onPaymentSelect={(payment) => {
                setSelectedPayment(payment)
                setIsPaymentsDashboardExpanded(true)
              }}
              onExpandToggle={() => setIsPaymentsDashboardExpanded(true)}
            />
          </div>
        )}

        {/* User Profile */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-purple-900/50 text-purple-400">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-gray-950/80 backdrop-blur border-b border-gray-800 flex-shrink-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-bold text-gray-100">Dashboard</h2>
                <p className="text-sm text-gray-400">Welcome back, {user.name || user.email}</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Connection Status Indicator */}
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
              
              <NotificationBell />
              
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-purple-900/50 text-purple-400">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white transition-all duration-200 hover:scale-105" asChild>
                <a href="/book-service">
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </a>
              </Button>
              <Button className="bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200 border border-gray-700" asChild>
                <a href="/payments">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payments
                </a>
              </Button>
              <Button className="bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all duration-200 border border-gray-700" asChild>
                <a href="/support">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Support
                </a>
              </Button>
            </div>

            {/* Current Active Booking Section OR Expanded Payments Dashboard */}
            {isPaymentsDashboardExpanded ? (
              <PaymentsDashboard
                bookings={bookings}
                isExpanded={true}
                selectedPayment={selectedPayment}
                onPaymentSelect={setSelectedPayment}
                onExpandToggle={() => {
                  setIsPaymentsDashboardExpanded(false)
                  setSelectedPayment(null)
                }}
              />
            ) : activeBooking ? (
              <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-100">Current Active Booking</CardTitle>
                        <p className="text-sm text-gray-400">Your ongoing service booking</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 self-start sm:self-auto"
                      asChild
                    >
                      <a href="/bookings">View All</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <EnhancedBookingCard
                      booking={activeBooking}
                      onStatusChange={(bookingId, newStatus) => {
                        // Update the booking status in the local state
                        setInitialBookings(prev => prev.map(b => 
                          b.id === bookingId ? { ...b, status: newStatus } : b
                        ))
                      }}
                      onRefresh={refreshBooking}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Total Bookings",
                  value: totalBookings,
                  change: `${bookingGrowth >= 0 ? '+' : ''}${bookingGrowth}%`,
                  trend: bookingGrowth >= 0 ? "up" : "down",
                  icon: Calendar,
                  color: "text-blue-400"
                },
                {
                  title: "Completed Jobs",
                  value: completedBookingsCount,
                  change: `${totalBookings > 0 ? Math.round((completedBookingsCount / totalBookings) * 100) : 0}%`,
                  trend: "up",
                  icon: CheckCircle,
                  color: "text-green-400"
                },
                {
                  title: "Active Bookings",
                  value: pendingBookings + confirmedBookings + inProgressBookings,
                  change: "Active",
                  trend: "neutral",
                  icon: Clock,
                  color: "text-orange-400"
                },
                {
                  title: "Total Spent",
                  value: `R${totalSpent.toFixed(2)}`,
                  change: "+25%",
                  trend: "up",
                  icon: DollarSign,
                  color: "text-emerald-400"
                }
              ].map((stat, index) => {
                const Icon = stat.icon
                const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : Clock
                return (
                  <Card key={index} className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-100 mt-1">{stat.value}</p>
                          <div className="flex items-center mt-2">
                            <TrendIcon className={`w-4 h-4 mr-1 ${
                              stat.trend === 'up' ? 'text-green-400' : 
                              stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                            }`} />
                            <span className={`text-sm ${
                              stat.trend === 'up' ? 'text-green-400' : 
                              stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-800">
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Main Content Grid with Timeline */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Booking Timeline - Takes 3 columns on xl - Shows only incomplete bookings */}
              <div className="xl:col-span-3">
                <BookingTimeline 
                  bookings={incompleteBookings} 
                  maxItems={3}
                  showViewAll={true}
                  onBookingClick={(booking) => setSelectedActiveBooking(booking)}
                />
              </div>

              {/* Recent Completed Jobs - Takes 1 column on far right */}
              <div className="xl:col-span-1">
                <Card className="bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-100">Completed</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 text-xs"
                        asChild
                      >
                        <a href="/bookings">All</a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {completedBookings.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-100 mb-2">No completed jobs</h3>
                        <p className="text-xs text-gray-400 mb-4">Complete your first booking</p>
                        <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-xs" asChild>
                          <a href="/book-service">Book Now</a>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {completedBookings.slice(0, 4).map((booking) => (
                          <Dialog key={booking.id}>
                            <DialogTrigger asChild>
                              <div className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-100 truncate">{booking.service?.name || 'Service'}</p>
                                  <p className="text-xs text-gray-400">
                                    <SafeDateDisplay date={booking.scheduledDate} />
                                  </p>
                                  <Badge className="text-xs mt-1 inline-block bg-green-900/50 text-green-400 border-green-800/50">
                                    Completed
                                  </Badge>
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                              <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-xl font-semibold text-gray-100">
                                  {booking.service?.name || 'Service Details'}
                                </DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Booking details and information
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                                {/* Service Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Service</h4>
                                    <p className="text-sm text-gray-100">{booking.service?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-400">{booking.service?.category || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Status</h4>
                                    <Badge className={`text-xs ${
                                      booking.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border-green-800/50' :
                                      booking.status === 'CONFIRMED' ? 'bg-blue-900/50 text-blue-400 border-blue-800/50' :
                                      booking.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50' :
                                      booking.status === 'PENDING_EXECUTION' ? 'bg-purple-900/50 text-purple-400 border-purple-800/50' :
                                      'bg-gray-800 text-gray-400 border-gray-700'
                                    }`}>
                                      {booking.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Date</h4>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-100">
                                        <SafeDateDisplay date={booking.scheduledDate} />
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Time</h4>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-100">
                                        <SafeTimeOnlyDisplay date={booking.scheduledDate} />
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Address */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-300 mb-2">Address</h4>
                                  <div className="flex items-start space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="text-sm text-gray-100">{booking.address}</span>
                                  </div>
                                </div>

                                {/* Amount */}
                                <div>
                                  <h4 className="text-sm font-medium text-gray-300 mb-2">Amount</h4>
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                    <span className="text-lg font-semibold text-gray-100">
                                      {formatBookingPrice(booking)}
                                    </span>
                                  </div>
                                </div>

                                {/* Provider Info */}
                                {booking.provider && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Provider</h4>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                      <p className="text-sm font-medium text-gray-100">{booking.provider.user?.name || 'N/A'}</p>
                                      {booking.provider.businessName && (
                                        <p className="text-xs text-gray-400">{booking.provider.businessName}</p>
                                      )}
                                      {booking.provider.user?.phone && (
                                        <div className="flex items-center space-x-2 mt-2">
                                          <Phone className="w-4 h-4 text-gray-400" />
                                          <span className="text-xs text-gray-300">{booking.provider.user?.phone || ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Description */}
                                {booking.description && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Notes</h4>
                                    <p className="text-sm text-gray-100 bg-gray-800 rounded-lg p-3">
                                      {booking.description}
                                    </p>
                                  </div>
                                )}

                                {/* Payment Info */}
                                {booking.payment && (
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Payment</h4>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-100">Amount: R{booking.payment.amount?.toFixed(2)}</span>
                                        <Badge className={`text-xs ${
                                          booking.payment.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border-green-800/50' :
                                          booking.payment.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50' :
                                          'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>
                                          {booking.payment.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
                                  asChild
                                >
                                  <a href="/bookings">View All Bookings</a>
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-100 flex items-center">
              <LogOut className="w-5 h-5 mr-2 text-red-400" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to logout? You will need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutConfirm(false)}
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowLogoutConfirm(false)
                handleLogout()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
