"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, TrendingUp, DollarSign, CheckCircle, AlertCircle, BarChart3 } from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ReviewSection } from "@/components/review-section"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { EnhancedStatsDashboard } from "@/components/dashboard/enhanced-stats-dashboard"
import { BookingManagement } from "@/components/dashboard/booking-management"
import { showToast, handleApiError } from "@/lib/toast"
import { LoadingCard } from "@/components/ui/loading-spinner"

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
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        const bookingsRes = await fetch('/api/bookings/my-bookings')
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings)
        }

        // Fetch services
        const servicesRes = await fetch('/api/services')
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <LoadingCard text="Loading your dashboard..." />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        </div>
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

  const enhancedStats = [
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `${bookingGrowth >= 0 ? '+' : ''}${bookingGrowth}%`,
      changeType: bookingGrowth >= 0 ? "positive" : "negative",
      details: [
        { label: "This Month", value: thisMonthBookings, trend: bookingGrowth >= 0 ? "up" : "down" },
        { label: "Last Month", value: lastMonthBookings, trend: "stable" },
        { label: "Completed", value: completedBookings, trend: "up" },
        { label: "Cancelled", value: cancelledBookings, trend: "down" }
      ]
    },
    {
      title: "Completed Jobs",
      value: completedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: `${Math.round((completedBookings / totalBookings) * 100)}%`,
      changeType: "positive",
      details: [
        { label: "Success Rate", value: `${Math.round((completedBookings / totalBookings) * 100)}%`, trend: "up" },
        { label: "Average Rating", value: averageRating.toFixed(1), trend: "up" },
        { label: "Total Reviews", value: bookings.filter(b => b.review).length, trend: "up" }
      ]
    },
    {
      title: "Active Bookings",
      value: pendingBookings + confirmedBookings + inProgressBookings,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Active",
      changeType: "neutral",
      details: [
        { label: "Pending", value: pendingBookings, trend: "stable" },
        { label: "Confirmed", value: confirmedBookings, trend: "up" },
        { label: "In Progress", value: inProgressBookings, trend: "up" }
      ]
    },
    {
      title: "Total Spent",
      value: `R${totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      change: "+25%",
      changeType: "positive",
      details: [
        { label: "This Month", value: `R${(totalSpent * 0.3).toFixed(2)}`, trend: "up" },
        { label: "Average per Booking", value: `R${totalBookings > 0 ? (totalSpent / totalBookings).toFixed(2) : '0.00'}`, trend: "up" },
        { label: "Paid Bookings", value: bookings.filter(b => b.payment).length, trend: "up" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {user.name || user.email}!
                </h1>
                <p className="text-xl text-gray-600">
                  Here's what's happening with your services
                </p>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <a href="/book-service">
                  <Plus className="w-5 h-5 mr-2" />
                  Book New Service
                </a>
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Dashboard */}
          <EnhancedStatsDashboard 
            stats={enhancedStats}
            bookings={bookings}
            totalSpent={totalSpent}
            averageRating={averageRating}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Bookings */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>Recent Bookings</span>
                  </CardTitle>
                  <CardDescription>
                    Track the status of your service bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                      <p className="text-gray-600 mb-6">
                        You haven't made any bookings yet. Start by exploring our available services!
                      </p>
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <a href="/book-service">Book Your First Service</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {bookings.slice(0, 5).map((booking) => (
                        <EnhancedBookingCard
                          key={booking.id}
                          booking={booking}
                          onStatusChange={(bookingId, newStatus) => {
                            // Update local state
                            setBookings(prev => prev.map(b => 
                              b.id === bookingId ? { ...b, status: newStatus } : b
                            ))
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Popular Services */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Available Services</span>
                  </CardTitle>
                  <CardDescription>
                    Explore our most popular services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {popularServices.length > 0 ? (
                      popularServices.map((service, index) => {
                        const Icon = service.icon
                        return (
                          <div 
                            key={service.id} 
                            className="group p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer"
                            onClick={() => window.location.href = `/book-service?service=${service.id}`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      <div className="col-span-2 text-center py-8">
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
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/book-service">
                        <Plus className="w-4 h-4 mr-2" />
                        Book New Service
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/bookings">
                        <Calendar className="w-4 h-4 mr-2" />
                        View All Bookings
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/analytics">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start" variant="outline">
                      <a href="/reviews">
                        <Star className="w-4 h-4 mr-2" />
                        My Reviews
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Management */}
              {bookings.length > 0 && (
                <BookingManagement
                  booking={bookings[0]} // Show management for the most recent booking
                  onUpdate={(bookingId, updates) => {
                    setBookings(prev => prev.map(b => 
                      b.id === bookingId ? { ...b, ...updates } : b
                    ))
                  }}
                />
              )}

              {/* Account Status */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Bookings</span>
                      <span className="font-semibold">{totalBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Jobs</span>
                      <span className="font-semibold">{completedBookings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-semibold">R{totalSpent.toFixed(2)}</span>
                    </div>
                    {averageRating > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 