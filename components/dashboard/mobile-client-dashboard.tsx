"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
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
  Bell
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { useBookingData } from "@/hooks/use-booking-data"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { CompactBookingCard } from "@/components/dashboard/compact-booking-card"
import { StatusBadge } from "@/components/ui/status-badge"

// Helper function to get service icon
function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase()
  if (name.includes('clean') || name.includes('house')) return Home
  if (name.includes('plumb')) return Wrench
  if (name.includes('paint')) return Paintbrush
  if (name.includes('electr')) return Zap
  if (name.includes('car') || name.includes('wash')) return Car
  if (name.includes('hair') || name.includes('beauty') || name.includes('makeup')) return Scissors
  return Home
}

export function MobileClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialBookings, setInitialBookings] = useState<any[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

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
    
    if (paymentSuccess === 'success' && bookingId) {
      showToast.success('Payment completed successfully! Refreshing booking status...')
      
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
  }, [searchParams, refreshBooking, refreshAllBookings])

  // Auto-refresh mechanism for payment status updates
  useEffect(() => {
    if (!bookings.length || !user) return

    const hasPaymentBookings = bookings.some(booking => 
      booking.payment && ['PENDING', 'ESCROW'].includes(booking.payment.status)
    )

    if (!hasPaymentBookings) return

    const pollInterval = setInterval(async () => {
      try {
        const currentBookings = await fetch('/api/bookings/my-bookings').then(res => res.json()).catch(() => null)
        
        if (currentBookings && currentBookings.bookings) {
          let hasChanges = false
          
          currentBookings.bookings.forEach((currentBooking: any) => {
            const storedBooking = bookings.find(b => b.id === currentBooking.id)
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
  }, [bookings, user, refreshAllBookings])

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calculate stats
  const totalBookings = bookings.length
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length
  const confirmedBookings = bookings.filter(b => b.status === "CONFIRMED").length
  const inProgressBookings = bookings.filter(b => b.status === "IN_PROGRESS").length
  const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length
  
  const recentBookings = bookings.filter(b => {
    if (!b.createdAt) return false
    const now = new Date()
    const created = new Date(b.createdAt)
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24
  }).length
  
  const totalSpent = bookings
    .filter(b => b.payment)
    .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)
  
  const averageRating = bookings
    .filter(b => b.review)
    .reduce((sum, b) => sum + (b.review?.rating || 0), 0) / 
    bookings.filter(b => b.review).length || 0

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

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (selectedFilter === "all") return true
    return booking.status === selectedFilter.toUpperCase()
  })

  // Tab content
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      content: (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="Book New Service"
              description="Find and book a service provider"
              icon={Plus}
              iconColor="blue"
              primaryAction={{
                label: "Book Now",
                onClick: () => window.location.href = '/book-service'
              }}
            />
            <MobileActionCard
              title="View All Bookings"
              description="Manage your service bookings"
              icon={Calendar}
              iconColor="green"
              primaryAction={{
                label: "View Bookings",
                onClick: () => window.location.href = '/bookings'
              }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Bookings"
              value={totalBookings}
              icon={Calendar}
              color="blue"
              change={`${Math.round((completedBookings / totalBookings) * 100)}% completed`}
              changeType="positive"
            />
            <MobileStatsCard
              title="Completed"
              value={completedBookings}
              icon={CheckCircle}
              color="green"
              change={`${Math.round((completedBookings / totalBookings) * 100)}%`}
              changeType="positive"
            />
            <MobileStatsCard
              title="Active"
              value={pendingBookings + confirmedBookings + inProgressBookings}
              icon={Clock}
              color="orange"
              change="In progress"
              changeType="neutral"
            />
            <MobileStatsCard
              title="Total Spent"
              value={`R${totalSpent.toFixed(0)}`}
              icon={DollarSign}
              color="emerald"
              change="This month"
              changeType="positive"
            />
          </div>

          {/* Payment Status Alert */}
          {bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  {bookings.filter(b => b.payment && b.payment.status === 'PENDING').length} payment(s) processing
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-blue-600">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
                <Button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
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
          )}
        </div>
      )
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      badge: filteredBookings.length.toString(),
      content: (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
              <p className="text-gray-600 mb-6">
                {selectedFilter === "all" 
                  ? "You haven't made any bookings yet. Start by exploring our available services!"
                  : "No bookings match your current filter."
                }
              </p>
              {selectedFilter === "all" && (
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <a href="/book-service">Book Your First Service</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.slice(0, 10).map((booking) => (
                <CompactBookingCard
                  key={booking.id}
                  booking={booking}
                  onUpdate={refreshBooking}
                />
              ))}
              {filteredBookings.length > 10 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/bookings'}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    View All {filteredBookings.length} Bookings
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      id: "services",
      label: "Services",
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          {popularServices.length > 0 ? (
            popularServices.map((service) => {
              const Icon = service.icon
              return (
                <div 
                  key={service.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.location.href = `/book-service?service=${service.id}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{service.name}</h3>
                      <p className="text-gray-600 mb-2">{service.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{service.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-gray-500">{service.providerCount} providers</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/book-service?service=${service.id}`
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Book Now
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h3>
              <p className="text-gray-600">
                There are currently no active service providers in your area.
              </p>
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name || user.email}</p>
          </div>

          {/* Main Content */}
          <MobileTabbedSection
            tabs={tabs}
            defaultTab="overview"
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="CLIENT" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="CLIENT" />
    </div>
  )
}
