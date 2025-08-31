"use client"

import { useState, useEffect, useCallback } from "react"
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
  Bell,
  Banknote,
  RefreshCw
} from "lucide-react"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProviderBookingCard } from "./provider-booking-card"
import { ProviderStatsCards } from "./provider-stats-cards"
import { ProviderEarningsChart } from "./provider-earnings-chart"
import BankDetailsForm from "./bank-details-form"
import Link from "next/link"

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
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionData, setCompletionData] = useState<{ photos: string[], notes: string }>({ photos: [], notes: '' })
  const [currentProviderId, setCurrentProviderId] = useState<string>("")
  const [hasBankDetails, setHasBankDetails] = useState<boolean>(false)
  const [isCheckingBankDetails, setIsCheckingBankDetails] = useState<boolean>(false)

  // Check if provider has bank details
  const checkBankDetails = async (providerId: string) => {
    try {
      setIsCheckingBankDetails(true)
      
      const response = await fetch(`/api/provider/${providerId}/bank-details`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Check if all required bank details fields are present and valid
        const hasDetails = !!data.bankDetails && 
          !!data.bankDetails.bankCode && 
          !!data.bankDetails.accountName && 
          !!data.bankDetails.bankName &&
          data.bankDetails.bankCode.trim() !== '' &&
          data.bankDetails.accountName.trim() !== '' &&
          data.bankDetails.bankName.trim() !== ''
        
        const wasFalse = !hasBankDetails
        setHasBankDetails(hasDetails)
        
        // Show success message if status changed from false to true
        if (wasFalse && hasDetails) {
          showToast.success('Bank details found! Your payment setup is complete.')
        }
      } else if (response.status === 404) {
        setHasBankDetails(false)
      } else {
        console.error('Failed to check bank details:', response.status)
        setHasBankDetails(false)
      }
    } catch (error) {
      console.error('Error checking bank details:', error)
      setHasBankDetails(false)
    } finally {
      setIsCheckingBankDetails(false)
    }
  }

  // Fetch current user and provider ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const user = await response.json()
          if (user.provider?.id) {
            setCurrentProviderId(user.provider.id)
            // Check if provider has bank details
            checkBankDetails(user.provider.id)
          }
        } else {
          console.error('Failed to fetch user:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    
    fetchCurrentUser()
  }, [])

  // Fetch bookings and stats
  useEffect(() => {
    fetchBookings()
  }, [])

  // Refresh bank details status when needed
  const refreshBankDetailsStatus = useCallback(() => {
    if (currentProviderId) {
      checkBankDetails(currentProviderId)
    }
  }, [currentProviderId])

  // Add periodic refresh and focus event listener for bank details status
  useEffect(() => {
    if (!currentProviderId) return

    // Refresh bank details status every 30 seconds while on dashboard
    const intervalId = setInterval(() => {
      refreshBankDetailsStatus()
    }, 30000)

    // Refresh when user returns to the tab
    const handleFocus = () => {
      refreshBankDetailsStatus()
    }

    window.addEventListener('focus', handleFocus)

    // Initial check
    refreshBankDetailsStatus()

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [currentProviderId, refreshBankDetailsStatus])

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
    if (action === "complete") {
      setSelectedBooking(booking)
      setShowCompletionModal(true)
    } else {
      setSelectedBooking(booking)
      setSelectedAction(action)
      setShowConfirmDialog(true)
    }
  }

  // Handle job completion submission
  const handleJobCompletion = async (photos: string[], notes: string) => {
    if (!selectedBooking) return
    
    setProcessingAction(true)
    try {
      const response = await fetch(`/api/book-service/${selectedBooking.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          photos: photos || [], 
          notes: notes || '' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast.success(data.message || "Job completed successfully")
        setShowCompletionModal(false)
        setSelectedBooking(null)
        fetchBookings() // Refresh data
      } else {
        await handleApiError(response, "Failed to complete job")
      }
    } catch (error) {
      console.error("Job completion error:", error)
      showToast.error("Network error. Please try again.")
    } finally {
      setProcessingAction(false)
    }
  }

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    let matchesFilter = true
    if (selectedFilter !== "all") {
      if (selectedFilter === "pending_execution") {
        matchesFilter = booking.status === "PENDING_EXECUTION"
      } else {
        matchesFilter = booking.status === selectedFilter.toUpperCase()
      }
    }
    const matchesSearch = booking.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.address.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Group bookings by status
  const pendingBookings = filteredBookings.filter(b => b.status === "PENDING")
  const confirmedBookings = filteredBookings.filter(b => b.status === "CONFIRMED")
  const pendingExecutionBookings = filteredBookings.filter(b => b.status === "PENDING_EXECUTION")
  const inProgressBookings = filteredBookings.filter(b => b.status === "IN_PROGRESS")
  const completedBookings = filteredBookings.filter(b => b.status === "COMPLETED")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-48 sm:h-64">
              <div className="text-center">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base">Loading your dashboard...</p>
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
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-48 sm:h-64">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-3 sm:mb-4" />
                <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{error}</p>
                <Button onClick={fetchBookings} size="sm" className="h-9 sm:h-10">Try Again</Button>
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
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header - Mobile First */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                  Provider Dashboard
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Manage your bookings and grow your business
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                  <Bell className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden">Notify</span>
                </Button>
                <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Update Location</span>
                  <span className="sm:hidden">Location</span>
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-9 sm:h-10 text-xs sm:text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">View Profile</span>
                  <span className="sm:hidden">Profile</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-9 sm:h-10 text-xs sm:text-sm">
                  <Link href="/provider/bank-details">
                    <Banknote className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Bank Details</span>
                    <span className="sm:hidden">Bank</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Bank Details Reminder Banner - Mobile First */}
          {!hasBankDetails && currentProviderId && (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900 leading-tight">
                        Complete Your Payment Setup
                      </h3>
                      <p className="text-sm text-amber-800 leading-relaxed mt-1">
                        Set up your bank account details to receive payments from completed jobs
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={refreshBankDetailsStatus}
                      disabled={isCheckingBankDetails}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100 h-8 sm:h-9 text-xs"
                    >
                      {isCheckingBankDetails ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      )}
                      {isCheckingBankDetails ? "Checking..." : "Refresh"}
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700 text-white h-8 sm:h-9 text-xs"
                      asChild
                    >
                      <Link href="/provider/bank-details">
                        Set Up Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message for Bank Details - Mobile First */}
          {hasBankDetails && currentProviderId && (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-900 leading-tight">
                        Payment Setup Complete
                      </h3>
                      <p className="text-sm text-green-800 leading-relaxed mt-1">
                        Your bank details are configured and ready for receiving payments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={refreshBankDetailsStatus}
                      disabled={isCheckingBankDetails}
                      className="text-green-700 border-green-300 hover:bg-green-100 h-8 sm:h-9 text-xs"
                    >
                      {isCheckingBankDetails ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      )}
                      {isCheckingBankDetails ? "Checking..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards - Mobile First */}
          <ProviderStatsCards stats={stats} />

          {/* Bank Details Section - Mobile First */}
          {currentProviderId && (
            <div className="mb-6 sm:mb-8">
              <BankDetailsForm 
                providerId={currentProviderId} 
                onSuccess={() => {
                  // Refresh data if needed
                  refreshBankDetailsStatus() // Use the new function
                  showToast.success('Bank details updated successfully! You can now receive payments.')
                }}
              />
            </div>
          )}

          {/* Earnings Chart - Mobile First */}
          <div className="mb-6 sm:mb-8">
            <ProviderEarningsChart bookings={completedBookings} />
          </div>

          {/* Filters and Search - Mobile First */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-9 sm:h-10"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_execution">Pending Execution</option>
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Bookings Sections - Mobile First */}
          <div className="space-y-6 sm:space-y-8">
            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    <span>Pending Bookings ({pendingBookings.length})</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    New booking requests waiting for your response
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
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
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span>Confirmed Bookings ({confirmedBookings.length})</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Upcoming jobs that are confirmed and ready to start
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
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

            {/* Pending Execution Bookings */}
            {pendingExecutionBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Pending Execution ({pendingExecutionBookings.length})</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Jobs that have payment completed and are waiting for the provider to start.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {pendingExecutionBookings.map((booking) => (
                      <ProviderBookingCard
                        key={booking.id}
                        booking={booking}
                        onStart={() => confirmAction(booking, "start")}
                        onViewDetails={() => {/* TODO: Implement details modal */}}
                        onMessage={() => {/* TODO: Implement messaging */}}
                        onCall={() => {/* TODO: Implement calling */}}
                        showStartButton={true}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Progress Bookings */}
            {inProgressBookings.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>In Progress ({inProgressBookings.length})</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Jobs currently being worked on
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
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
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <span>Completed Jobs ({completedBookings.length})</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Recently completed jobs and client feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
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
                <CardContent className="p-8 sm:p-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    {searchTerm || selectedFilter !== "all" ? "No Matching Bookings" : "No Active Bookings"}
                  </h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
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
                      size="sm"
                      className="h-9 sm:h-10"
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

      {/* Job Completion Modal - Mobile First */}
      {showCompletionModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3 sm:mb-4">Complete Job</h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Please provide proof of job completion for {selectedBooking.service.name}
            </p>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter photo URLs (comma separated)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-10 sm:h-11 text-sm sm:text-base"
                  onChange={(e) => {
                    const urls = e.target.value.split(',').map(url => url.trim()).filter(url => url)
                    setCompletionData(prev => ({ ...prev, photos: urls }))
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter photo URLs separated by commas (optional)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Add any notes about the completed job..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-sm sm:text-base"
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  setSelectedBooking(null)
                  setCompletionData({ photos: [], notes: '' })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 h-10 sm:h-11 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJobCompletion(completionData.photos, completionData.notes)}
                disabled={processingAction}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 sm:h-11 text-sm sm:text-base"
              >
                {processingAction ? "Completing..." : "Complete Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 