"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { useSmartBooking } from "@/hooks/use-smart-booking"
import { usePaymentCallback } from "@/hooks/use-payment-callback"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"

export default function BookingsPage() {
  const [user, setUser] = useState<any>(null)
  const [initialBookings, setInitialBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created")

  const { bookings, refreshAllBookings, refreshBooking, isLoading, isConnected, optimisticUpdate } = useSmartBooking(initialBookings)

  // Payment callback handling
  usePaymentCallback({
    onRefreshBooking: refreshBooking,
    onRefreshAll: refreshAllBookings,
  })

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const response = await fetch('/api/bookings/my-bookings', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setInitialBookings(data.bookings || [])
          setFilteredBookings(data.bookings || [])
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.provider?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Most recent first
        case "scheduled":
          return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime() // Most recent scheduled first
        case "amount":
          return b.totalAmount - a.totalAmount
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, sortBy])

  const getStatusStats = () => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "PENDING").length,
      confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
      completed: bookings.filter(b => b.status === "COMPLETED").length,
      cancelled: bookings.filter(b => b.status === "CANCELLED").length
    }
    return stats
  }

  const stats = getStatusStats()

  // Calculate user stats for header
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length
  const completedBookings = bookings.filter(b => b.status === "COMPLETED").length

  if (loading) {
    return (
      <div className="min-h-screen bg-black/90 backdrop-blur-sm">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings,
            pendingBookings,
            completedBookings,
            rating: 4.8 // This could be fetched from user data
          }}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black/90 backdrop-blur-sm">
      <BrandHeaderClient 
        showAuth={false} 
        showUserMenu={true} 
        userStats={{
          totalBookings,
          pendingBookings,
          completedBookings,
          rating: 4.8 // This could be fetched from user data
        }}
      />

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header - Mobile First */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                  My Bookings
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-white/80">
                  Manage and track all your service bookings
                </p>
              </div>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 sm:h-11">
                <a href="/book-service">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Book New Service</span>
                  <span className="sm:hidden">Book Service</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs sm:text-sm text-white/80">Total</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Pending</p>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Confirmed</p>
                    <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Completed</p>
                    <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <X className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80">Cancelled</p>
                    <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 sm:pl-12 h-10 sm:h-11 text-sm sm:text-base bg-black/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-black/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-black/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Date (Newest)</SelectItem>
                      <SelectItem value="scheduled">Date (Most Recent)</SelectItem>
                      <SelectItem value="amount">Amount (High to Low)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setSortBy("created")
                    }}
                    className="w-full border-gray-600 text-gray-300 hover:bg-white/10"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>All Bookings ({filteredBookings.length})</span>
              </CardTitle>
              <CardDescription className="text-white/80">
                {filteredBookings.length === bookings.length 
                  ? "Showing all your bookings" 
                  : `Showing ${filteredBookings.length} of ${bookings.length} bookings`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {bookings.length === 0 ? "No Bookings Yet" : "No Matching Bookings"}
                  </h3>
                  <p className="text-white/80 mb-6">
                    {bookings.length === 0 
                      ? "You haven't made any bookings yet. Start by exploring our services!"
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                  {bookings.length === 0 && (
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <a href="/book-service">Book Your First Service</a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBookings.map((booking) => (
                    <EnhancedBookingCard
                      key={booking.id}
                      booking={booking}
                      onStatusChange={(bookingId, newStatus) => {
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
        </div>
      </div>
    </div>
  )
} 