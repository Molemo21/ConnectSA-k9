"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { 
  Star, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Users, 
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Loader2,
  Filter,
  Search,
  CalendarDays,
  BarChart3,
  Settings,
  Bell
} from "lucide-react"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProviderBookingCard } from "./provider-booking-card"
import { ProviderStatsCards } from "./provider-stats-cards"
import { ProviderEarningsChart } from "./provider-earnings-chart"

interface Booking {
  id: string
  service: {
    name: string
    category: string
  }
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  scheduledDate: string
  totalAmount: number
  status: string
  address: string
  description?: string
  payment?: {
    id: string
    amount: number
    status: string
  }
  review?: {
    id: string
    rating: number
    comment?: string
  }
}

interface ProviderStats {
  pendingJobs: number
  confirmedJobs: number
  inProgressJobs: number
  completedJobs: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

export function ProviderDashboardContent() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    pendingJobs: 0,
    confirmedJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    averageRating: 0,
    totalReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [processingAction, setProcessingAction] = useState(false)

  // Fetch bookings and stats
  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/provider/bookings")
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
        setStats(data.stats)
      } else {
        await handleApiError(response, "Failed to fetch bookings")
        setError("Failed to load bookings")
      }
    } catch (error) {
      console.error("Fetch bookings error:", error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle booking actions
  const handleBookingAction = async (bookingId: string, action: string) => {
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/book-service/${bookingId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (response.ok) {
        const data = await response.json()
        showToast.success(data.message || `${action} completed successfully`)
        fetchBookings() // Refresh data
      } else {
        await handleApiError(response, `Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`${action} booking error:`, error)
      showToast.error("Network error. Please try again.")
    } finally {
      setProcessingAction(false)
      setShowConfirmDialog(false)
      setSelectedBooking(null)
      setSelectedAction("")
    }
  }

  // Confirm action dialog
  const confirmAction = (booking: Booking, action: string) => {
    setSelectedBooking(booking)
    setSelectedAction(action)
    setShowConfirmDialog(true)
  }

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = selectedFilter === "all" || booking.status === selectedFilter.toUpperCase()
    const matchesSearch = booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Group bookings by status
  const pendingBookings = filteredBookings.filter(b => b.status === "PENDING")
  const confirmedBookings = filteredBookings.filter(b => b.status === "CONFIRMED")
  const inProgressBookings = filteredBookings.filter(b => b.status === "IN_PROGRESS")
  const completedBookings = filteredBookings.filter(b => b.status === "COMPLETED")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading your dashboard...</p>
              </div>
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchBookings}>Try Again</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
                  Provider Dashboard
                </h1>
                <p className="text-xl text-gray-600">
                  Manage your bookings and grow your business
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="lg">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </Button>
                <Button variant="outline" size="lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  Update Location
                </Button>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Users className="w-5 h-5 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <ProviderStatsCards stats={stats} />

          {/* Earnings Chart */}
          <div className="mb-8">
            <ProviderEarningsChart bookings={completedBookings} />
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          {/* Bookings Sections */}
          <div className="space-y-8">
            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span>Pending Bookings ({pendingBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    New booking requests waiting for your response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <ProviderBookingCard
                        key={booking.id}
                        booking={booking}
                        onAccept={() => confirmAction(booking, "accept")}
                        onDecline={() => confirmAction(booking, "decline")}
                        onViewDetails={() => {/* TODO: Implement details modal */}}
                        onMessage={() => {/* TODO: Implement messaging */}}
                        onCall={() => {/* TODO: Implement calling */}}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirmed Bookings */}
            {confirmedBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>Confirmed Bookings ({confirmedBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Upcoming jobs that are confirmed and ready to start
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {confirmedBookings.map((booking) => (
                      <ProviderBookingCard
                        key={booking.id}
                        booking={booking}
                        onStart={() => confirmAction(booking, "start")}
                        onViewDetails={() => {/* TODO: Implement details modal */}}
                        onMessage={() => {/* TODO: Implement messaging */}}
                        onCall={() => {/* TODO: Implement calling */}}
                        showStartButton={!!booking.payment}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Progress Bookings */}
            {inProgressBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    <span>In Progress ({inProgressBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Jobs currently being worked on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inProgressBookings.map((booking) => (
                      <ProviderBookingCard
                        key={booking.id}
                        booking={booking}
                        onComplete={() => confirmAction(booking, "complete")}
                        onViewDetails={() => {/* TODO: Implement details modal */}}
                        onMessage={() => {/* TODO: Implement messaging */}}
                        onCall={() => {/* TODO: Implement calling */}}
                        showCompleteButton={true}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Bookings */}
            {completedBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Completed Jobs ({completedBookings.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Recently completed jobs and client feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedBookings.map((booking) => (
                      <ProviderBookingCard
                        key={booking.id}
                        booking={booking}
                        onViewDetails={() => {/* TODO: Implement details modal */}}
                        onMessage={() => {/* TODO: Implement messaging */}}
                        onCall={() => {/* TODO: Implement calling */}}
                        showReview={true}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No bookings message */}
            {filteredBookings.length === 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {searchTerm || selectedFilter !== "all" ? "No Matching Bookings" : "No Active Bookings"}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || selectedFilter !== "all" 
                      ? "Try adjusting your search or filter criteria."
                      : "You don't have any bookings at the moment. New bookings will appear here when clients book your services."
                    }
                  </p>
                  {(searchTerm || selectedFilter !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedFilter("all")
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setSelectedBooking(null)
          setSelectedAction("")
        }}
        onConfirm={() => {
          if (selectedBooking && selectedAction) {
            handleBookingAction(selectedBooking.id, selectedAction)
          }
        }}
        title={`${selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Booking`}
        description={`Are you sure you want to ${selectedAction} this booking?`}
        confirmText={selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}
        cancelText="Cancel"
        variant={selectedAction === "decline" ? "destructive" : "default"}
        loadingText="Processing..."
        isLoading={processingAction}
      />
    </div>
  )
} 