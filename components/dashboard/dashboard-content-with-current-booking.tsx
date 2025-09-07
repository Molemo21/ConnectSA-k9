"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, 
  TrendingUp, DollarSign, CheckCircle, AlertCircle, BarChart3, RefreshCw, AlertTriangle, 
  Loader2, Menu, X, Bell, Settings, User, LogOut, ChevronLeft, ChevronRight, Activity,
  CreditCard, BookOpen, MessageSquare, Shield, HelpCircle, PanelLeftClose, PanelLeftOpen,
  ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { BookingTimeline, CompactBookingTimeline } from "@/components/dashboard/booking-timeline"
import { showToast, handleApiError } from "@/lib/toast"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useBookingData } from "@/hooks/use-booking-data"

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

  // Get search params to detect payment success callback
  const searchParams = useSearchParams()

  // Use the optimized booking data hook
  const { 
    bookings, 
    refreshBooking, 
    refreshAllBookings, 
    isLoading: isRefreshing, 
    error: refreshError 
  } = useBookingData(initialBookings)

  // Handle payment success callback
  useEffect(() => {
    const paymentSuccess = searchParams.get('payment')
    const bookingId = searchParams.get('booking')
    const trxref = searchParams.get('trxref')
    const reference = searchParams.get('reference')
    
    if (paymentSuccess === 'success' && bookingId) {
      console.log('🎉 Payment success callback detected:', { paymentSuccess, bookingId, trxref, reference })
      
      // Show success message
      showToast.success('Payment completed successfully! Refreshing booking status...')
      
      // Refresh the specific booking to get updated status
      if (refreshBooking) {
        refreshBooking(bookingId)
      }
      
      // Also refresh all bookings to ensure consistency
      setTimeout(() => {
        if (refreshAllBookings) {
          refreshAllBookings()
          setLastRefresh(new Date())
        }
      }, 1000)
      
      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('booking')
      url.searchParams.delete('trxref')
      url.searchParams.delete('reference')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, refreshBooking, refreshAllBookings])

  // Manual refresh function with proper error handling
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

  if (loading) {
    return (
      <div className="h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <LoadingCard text="Loading your dashboard..." />
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
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length
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
  ]

  // Find the most recent active booking
  const activeBooking = bookings
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100">ConnectSA</h1>
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

        {/* Compact Timeline in Sidebar (when not collapsed) */}
        {!sidebarCollapsed && bookings.length > 0 && (
          <div className="p-3 border-t border-gray-800">
            <CompactBookingTimeline bookings={bookings} />
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
              
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              >
                <Bell className="w-5 h-5" />
                {bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse"></span>
                )}
              </Button>
              
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
            
            {/* Payment Status Alert */}
            {bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
              <Card className="bg-blue-900/20 border-blue-800/50 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-300">
                        {bookings.filter(b => b.payment && b.payment.status === 'PENDING').length} payment(s) processing
                      </p>
                      <p className="text-xs text-blue-400">
                        Your payments are being processed. This usually takes 2-5 minutes.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleManualRefresh} 
                      disabled={isRefreshing}
                      className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
                    >
                      {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check Status'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Current Active Booking Section */}
            {activeBooking && (
              <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-800/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-100">Current Active Booking</CardTitle>
                        <p className="text-sm text-gray-400">Your ongoing service booking</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                      asChild
                    >
                      <a href="/bookings">View All Bookings</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
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
                </CardContent>
              </Card>
            )}

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
                  value: completedBookings,
                  change: `${totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0}%`,
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
              
              {/* Booking Timeline - Takes full width on mobile, 1 column on xl */}
              <div className="xl:col-span-1">
                <BookingTimeline 
                  bookings={bookings} 
                  maxItems={4}
                  showViewAll={true}
                />
              </div>

              {/* Recent Bookings - Takes remaining space */}
              <Card className="xl:col-span-2 bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-100">Recent Bookings</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                      asChild
                    >
                      <a href="/bookings">View All</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">No bookings yet</h3>
                      <p className="text-gray-400 mb-6">Start by booking your first service</p>
                      <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700" asChild>
                        <a href="/book-service">Book Your First Service</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.slice(0, 3).map((booking) => (
                        <div 
                          key={booking.id} 
                          className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-100">{booking.service?.name || 'Service'}</p>
                              <p className="text-xs text-gray-400">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge className={`text-xs ${
                            booking.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border-green-800/50' :
                            booking.status === 'CONFIRMED' ? 'bg-blue-900/50 text-blue-400 border-blue-800/50' :
                            booking.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50' :
                            'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Services */}
              <Card className="xl:col-span-1 bg-gray-900 border-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                    Popular Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {popularServices.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-100 mb-2">No services available</h3>
                      <p className="text-xs text-gray-400">Check back later for available services</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {popularServices.slice(0, 4).map((service) => {
                        const Icon = service.icon
                        return (
                          <div 
                            key={service.id}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-all duration-200"
                            onClick={() => window.location.href = `/book-service?service=${service.id}`}
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-100 truncate">{service.name}</p>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-400">{service.averageRating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-4 bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700" asChild>
                    <a href="/book-service">View All Services</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}