"use client"

import { useState, useEffect, useCallback } from "react"
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
  RefreshCw,
  Home
} from "lucide-react"
import { showToast, handleApiError } from "@/lib/toast"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProviderBookingCard } from "./provider-booking-card"
import { ProviderEarningsChart } from "./provider-earnings-chart"
import { BankDetailsForm } from "./bank-details-form"
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

export function MobileProviderDashboard() {
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
        
        const hasDetails = !!data.bankDetails && 
          !!data.bankDetails.bankCode && 
          !!data.bankDetails.accountName && 
          !!data.bankDetails.bankName &&
          data.bankDetails.bankCode.trim() !== '' &&
          data.bankDetails.accountName.trim() !== '' &&
          data.bankDetails.bankName.trim() !== ''
        
        const wasFalse = !hasBankDetails
        setHasBankDetails(hasDetails)
        
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

    const intervalId = setInterval(() => {
      refreshBankDetailsStatus()
    }, 30000)

    const handleFocus = () => {
      refreshBankDetailsStatus()
    }

    window.addEventListener('focus', handleFocus)
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
        setBookings(data.bookings || [])
        setStats(data.stats || {})
        setError(null) // Clear any previous errors
        
        // Log the response for debugging
        console.log('Provider bookings API response:', {
          success: data.success,
          bookingCount: data.bookings?.length || 0,
          hasBookings: (data.bookings?.length || 0) > 0,
          message: data.message
        });
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
        fetchBookings()
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
        fetchBookings()
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
        <div className="container mx-auto px-4 py-6 pb-20">
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
        <div className="container mx-auto px-4 py-6 pb-20">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error?.message || error?.toString() || 'Unknown error'}</p>
            <Button onClick={fetchBookings} size="sm">Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  // Tab content
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      content: (
        <div className="space-y-6">
          {/* Bank Details Reminder */}
          {!hasBankDetails && currentProviderId && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 leading-tight">
                    Complete Your Payment Setup
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed mt-1">
                    Set up your bank account details to receive payments from completed jobs
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={refreshBankDetailsStatus}
                      disabled={isCheckingBankDetails}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100 h-9 text-xs"
                    >
                      {isCheckingBankDetails ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      {isCheckingBankDetails ? "Checking..." : "Refresh"}
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700 text-white h-9 text-xs"
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

          {/* Success Message for Bank Details */}
          {hasBankDetails && currentProviderId && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 leading-tight">
                    Payment Setup Complete
                  </h3>
                  <p className="text-sm text-green-800 leading-relaxed mt-1">
                    Your bank details are configured and ready for receiving payments
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={refreshBankDetailsStatus}
                  disabled={isCheckingBankDetails}
                  className="text-green-700 border-green-300 hover:bg-green-100 h-9 text-xs"
                >
                  {isCheckingBankDetails ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  {isCheckingBankDetails ? "Checking..." : "Refresh"}
                </Button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Jobs"
              value={stats.pendingJobs + stats.confirmedJobs + stats.inProgressJobs + stats.completedJobs}
              icon={Calendar}
              color="blue"
              change={`${stats.completedJobs} completed`}
              changeType="positive"
            />
            <MobileStatsCard
              title="Completed"
              value={stats.completedJobs}
              icon={CheckCircle}
              color="green"
              change={`${Math.round((stats.completedJobs / (stats.pendingJobs + stats.confirmedJobs + stats.inProgressJobs + stats.completedJobs)) * 100)}%`}
              changeType="positive"
            />
            <MobileStatsCard
              title="Active Jobs"
              value={stats.pendingJobs + stats.confirmedJobs + stats.inProgressJobs}
              icon={Clock}
              color="orange"
              change="In progress"
              changeType="neutral"
            />
            <MobileStatsCard
              title="Total Earnings"
              value={`R${stats.totalEarnings.toFixed(0)}`}
              icon={DollarSign}
              color="emerald"
              change={`R${stats.thisMonthEarnings.toFixed(0)} this month`}
              changeType="positive"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="View All Jobs"
              description="Manage your service bookings"
              icon={Calendar}
              iconColor="blue"
              primaryAction={{
                label: "View Jobs",
                onClick: () => setSelectedFilter("all")
              }}
            />
            <MobileActionCard
              title="Update Profile"
              description="Manage your provider profile"
              icon={Users}
              iconColor="green"
              primaryAction={{
                label: "Edit Profile",
                onClick: () => window.location.href = '/provider/profile'
              }}
            />
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
            <ProviderEarningsChart bookings={completedBookings} />
          </div>
        </div>
      )
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: Calendar,
      badge: filteredBookings.length.toString(),
      content: (
        <div className="space-y-6">
          {/* Filter and Search */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              >
                <option value="all">All Jobs</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending_execution">Pending Execution</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              />
            </div>
          </div>

          {/* Jobs by Status */}
          <div className="space-y-6">
            {/* Pending Bookings */}
            {pendingBookings.length > 0 && (
              <MobileCollapsibleSection
                title="Pending Bookings"
                description="New booking requests waiting for your response"
                icon={Clock}
                iconColor="orange"
                badge={pendingBookings.length.toString()}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {pendingBookings.map((booking) => (
                    <ProviderBookingCard
                      key={booking.id}
                      booking={booking}
                      onAccept={() => confirmAction(booking, "accept")}
                      onDecline={() => confirmAction(booking, "decline")}
                      onViewDetails={() => {}}
                      onMessage={() => {}}
                      onCall={() => {}}
                    />
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* Confirmed Bookings */}
            {confirmedBookings.length > 0 && (
              <MobileCollapsibleSection
                title="Confirmed Bookings"
                description="Upcoming jobs that are confirmed and ready to start"
                icon={CheckCircle}
                iconColor="blue"
                badge={confirmedBookings.length.toString()}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {confirmedBookings.map((booking) => (
                    <ProviderBookingCard
                      key={booking.id}
                      booking={booking}
                      onStart={() => confirmAction(booking, "start")}
                      onViewDetails={() => {}}
                      onMessage={() => {}}
                      onCall={() => {}}
                      showStartButton={!!booking.payment}
                    />
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* Pending Execution Bookings */}
            {pendingExecutionBookings.length > 0 && (
              <MobileCollapsibleSection
                title="Pending Execution"
                description="Jobs that have payment completed and are waiting for the provider to start"
                icon={Play}
                iconColor="purple"
                badge={pendingExecutionBookings.length.toString()}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {pendingExecutionBookings.map((booking) => (
                    <ProviderBookingCard
                      key={booking.id}
                      booking={booking}
                      onStart={() => confirmAction(booking, "start")}
                      onViewDetails={() => {}}
                      onMessage={() => {}}
                      onCall={() => {}}
                      showStartButton={true}
                    />
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* In Progress Bookings */}
            {inProgressBookings.length > 0 && (
              <MobileCollapsibleSection
                title="In Progress"
                description="Jobs currently being worked on"
                icon={Play}
                iconColor="purple"
                badge={inProgressBookings.length.toString()}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  {inProgressBookings.map((booking) => (
                    <ProviderBookingCard
                      key={booking.id}
                      booking={booking}
                      onComplete={() => confirmAction(booking, "complete")}
                      onViewDetails={() => {}}
                      onMessage={() => {}}
                      onCall={() => {}}
                      showCompleteButton={true}
                    />
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* Completed Bookings */}
            {completedBookings.length > 0 && (
              <MobileCollapsibleSection
                title="Completed Jobs"
                description="Recently completed jobs and client feedback"
                icon={CheckCircle}
                iconColor="green"
                badge={completedBookings.length.toString()}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  {completedBookings.map((booking) => (
                    <ProviderBookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={() => {}}
                      onMessage={() => {}}
                      onCall={() => {}}
                      showReview={true}
                    />
                  ))}
                </div>
              </MobileCollapsibleSection>
            )}

            {/* No bookings message */}
            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {searchTerm || selectedFilter !== "all" ? "No Matching Jobs" : "No Active Jobs"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedFilter !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "You don't have any jobs at the moment. New jobs will appear here when clients book your services."
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
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Earnings"
              value={`R${stats.totalEarnings.toFixed(0)}`}
              icon={DollarSign}
              color="emerald"
              change="All time"
              changeType="positive"
            />
            <MobileStatsCard
              title="This Month"
              value={`R${stats.thisMonthEarnings.toFixed(0)}`}
              icon={TrendingUp}
              color="blue"
              change="Current month"
              changeType="positive"
            />
            <MobileStatsCard
              title="Completed Jobs"
              value={stats.completedJobs}
              icon={CheckCircle}
              color="green"
              change={`${Math.round((stats.completedJobs / (stats.pendingJobs + stats.confirmedJobs + stats.inProgressJobs + stats.completedJobs)) * 100)}% success`}
              changeType="positive"
            />
            <MobileStatsCard
              title="Average Rating"
              value={stats.averageRating.toFixed(1)}
              icon={Star}
              color="orange"
              change={`${stats.totalReviews} reviews`}
              changeType="positive"
            />
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h3>
            <ProviderEarningsChart bookings={completedBookings} />
          </div>

          {/* Bank Details */}
          {currentProviderId && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Setup</h3>
              <BankDetailsForm 
                providerId={currentProviderId} 
                onSuccess={() => {
                  refreshBankDetailsStatus()
                  showToast.success('Bank details updated successfully! You can now receive payments.')
                }}
              />
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen gradient-bg-light">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
            <p className="text-gray-600">Manage your bookings and grow your business</p>
          </div>

          {/* Main Content */}
          <MobileTabbedSection
            tabs={tabs}
            defaultTab="overview"
            className="card-elevated rounded-xl"
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="PROVIDER" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="PROVIDER" />

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

      {/* Job Completion Modal */}
      {showCompletionModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Complete Job</h3>
            <p className="text-gray-600 mb-4">
              Please provide proof of job completion for {selectedBooking.service.name}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter photo URLs (comma separated)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-11 text-sm"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 text-sm"
                  onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  setSelectedBooking(null)
                  setCompletionData({ photos: [], notes: '' })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 h-11 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleJobCompletion(completionData.photos, completionData.notes)}
                disabled={processingAction}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-11 text-sm"
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
