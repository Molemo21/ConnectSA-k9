"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ConsolidatedMobileHeaderProvider } from "@/components/ui/consolidated-mobile-header-provider"
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
  Home,
  Wrench,
  Paintbrush,
  Zap,
  Car,
  Scissors,
  Menu,
  X,
  ChevronRight,
  User,
  CreditCard,
  HelpCircle,
  Bell as NotificationIcon,
  GripVertical,
  RotateCcw,
  Phone as PhoneIcon,
  Mail,
  MoreVertical,
  Heart,
  Share2,
  Activity,
  Wallet,
  MessageSquare,
  Shield,
  Briefcase,
  Target,
  Award,
  TrendingDown,
  LogIn,
  AlertTriangle,
  Plus,
  Briefcase as JobIcon
} from "lucide-react"
import { showToast, handleApiError } from "@/lib/toast"
import { useSocket } from "@/lib/socket-client"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ProviderBookingCard } from "./provider-booking-card"
import { ProviderEarningsChart } from "./provider-earnings-chart"
import { BankDetailsForm } from "./bank-details-form"
import { ComponentErrorBoundary } from "@/components/error-boundaries/ComponentErrorBoundary"
import Link from "next/link"

interface Booking {
  id: string
  service: {
    name: string
    category: string
    description?: string
    basePrice?: number
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
    paystackRef?: string
    paidAt?: string
    authorizationUrl?: string
  }
  review?: {
    id: string
    rating: number
    comment?: string
    createdAt: string
  }
}

interface ProviderStats {
  pendingJobs: number
  confirmedJobs: number
  pendingExecutionJobs: number
  inProgressJobs: number
  completedJobs: number
  totalEarnings: number
  thisMonthEarnings: number
  averageRating: number
  totalReviews: number
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: any | null
}

interface UnifiedProviderDashboardProps {
  initialUser?: any
}

// Desktop Sidebar Component - Matching Client Dashboard Design
function ProviderDesktopSidebar({ 
  activeSection, 
  setActiveSection, 
  user, 
  totalBookings, 
  pendingBookings,
  isCollapsed,
  setIsCollapsed 
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  totalBookings: number
  pendingBookings: number
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) {
  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      badge: null
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: Calendar,
      badge: totalBookings > 0 ? totalBookings.toString() : null
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: DollarSign,
      badge: null
    },
    {
      id: "bank",
      label: "Bank Setup",
      icon: CreditCard,
      badge: null
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      badge: null
    },
    {
      id: "support",
      label: "Support",
      icon: HelpCircle,
      badge: null
    }
  ]

  return (
    <div className={`
      hidden lg:flex flex-col bg-black/80 backdrop-blur-sm border-r border-gray-300/20 transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Sidebar Header - ProLiink Logo Colors */}
      <div className="p-4 border-b border-gray-300/20">
        <div className="flex items-center justify-between">
          <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full'}`}>
            <h2 className="text-lg lg:text-xl font-semibold text-white whitespace-nowrap">Provider Dashboard</h2>
            <p className="text-sm lg:text-base text-gray-300 whitespace-nowrap truncate">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 flex-shrink-0 min-h-[44px] min-w-[44px] transition-transform duration-200 hover:scale-105"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="transition-transform duration-200">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </div>
          </Button>
        </div>
      </div>

      {/* Navigation Items - Enhanced with smooth transitions and better accessibility */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 ease-out min-h-[44px]
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black
                ${isActive 
                  ? 'bg-blue-400/20 backdrop-blur-sm text-white border border-blue-400/30 shadow-lg shadow-blue-400/20' 
                  : 'text-gray-300 hover:bg-blue-400/10 hover:text-white hover:border-blue-400/20 hover:shadow-sm'
                }
              `}
              aria-label={`Switch to ${item.label} section`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
              <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full'}`}>
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto bg-blue-400/20 text-blue-400 border-blue-400/30 flex-shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer - ProLiink Logo Colors */}
      <div className={`p-4 border-t border-gray-300/20 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
        <div className="bg-blue-400/10 backdrop-blur-sm rounded-lg p-3 border border-blue-400/20">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Quick Actions</span>
          </div>
          <div className="space-y-2">
            <Button 
              size="sm" 
              className="w-full justify-start bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all duration-200 hover:scale-[1.02] min-h-[44px] text-white"
              onClick={() => window.location.href = '/provider/profile'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start border-blue-400/30 text-gray-300 hover:bg-blue-400/10 hover:text-white hover:border-blue-400/50 transition-all duration-200 hover:scale-[1.02] min-h-[44px]"
              onClick={() => window.location.href = '/provider/bank-details'}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Bank Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Content Component - Enhanced with personalization and micro-interactions
function ProviderMainContent({ 
  activeSection, 
  setActiveSection,
  user, 
  bookings, 
  stats,
  refreshData, 
  isRefreshing, 
  lastRefresh, 
  selectedFilter, 
  setSelectedFilter,
  hasBankDetails,
  acceptBooking,
  acceptingBooking,
  acceptError,
  acceptSuccess,
  clearAcceptError,
  clearAcceptSuccess,
  handleStartJob,
  handleCompleteJob,
  processingAction,
  handleBankDetailsChange,
  dashboardState,
  memoizedBankDetails
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  bookings: Booking[]
  stats: ProviderStats
  refreshData: () => void
  isRefreshing: boolean
  lastRefresh: Date
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  hasBankDetails: boolean
  acceptBooking: (bookingId: string) => Promise<void>
  acceptingBooking: string | null
  acceptError: string | null
  acceptSuccess: string | null
  clearAcceptError: () => void
  clearAcceptSuccess: () => void
  handleStartJob: (bookingId: string) => Promise<void>
  handleCompleteJob: (bookingId: string) => Promise<void>
  processingAction: boolean
  handleBankDetailsChange: (bankDetails: any) => void
  dashboardState: any
  memoizedBankDetails: any
}) {
  // Calculate derived stats with comprehensive validation
  const safeBookings = Array.isArray(bookings) ? bookings : []
  const totalBookings = safeBookings.length
  const completedBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "COMPLETED").length
  const pendingBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "PENDING").length
  const confirmedBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "CONFIRMED").length
  const pendingExecutionBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "PENDING_EXECUTION").length
  const inProgressBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "IN_PROGRESS").length
  const awaitingConfirmationBookings = safeBookings.filter(b => b && typeof b.status === 'string' && b.status === "AWAITING_CONFIRMATION").length

  // Filter bookings based on selected filter with defensive programming
  const filteredBookings = useMemo(() => {
    if (!bookings || !Array.isArray(bookings)) return []
    if (selectedFilter === "all") return safeBookings.filter(booking => booking && booking.id)
    return safeBookings.filter(booking => 
      booking && 
      booking.id && 
      booking.status && 
      typeof booking.status === 'string' &&
      booking.status.toLowerCase() === selectedFilter.toLowerCase()
    )
  }, [safeBookings, selectedFilter])

  const renderSectionContent = () => {
    try {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Jobs</p>
                      <p className="text-2xl font-bold text-white">{totalBookings}</p>
                    </div>
                    <div className="p-3 bg-blue-400/20 rounded-full">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Jobs</p>
                      <p className="text-2xl font-bold text-white">{inProgressBookings}</p>
                    </div>
                    <div className="p-3 bg-green-400/20 rounded-full">
                      <Play className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Earnings</p>
                      <p className="text-2xl font-bold text-white">R{stats.totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-yellow-400/20 rounded-full">
                      <DollarSign className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Rating</p>
                      <p className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-purple-400/20 rounded-full">
                      <Star className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white"
                    onClick={() => setActiveSection('jobs')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Jobs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-blue-400/30 text-gray-300 hover:bg-blue-400/10 hover:text-white"
                    onClick={() => setActiveSection('bank')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {hasBankDetails ? 'Update Bank Details' : 'Setup Bank Details'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Recent Jobs
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveSection('jobs')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(bookings || []).filter(booking => booking && booking.id).slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-300/10">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-400/20 rounded-full">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{booking.service?.name || 'Unknown Service'}</p>
                          <p className="text-sm text-gray-400">{booking.client?.name || 'Unknown Client'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {booking.status || 'UNKNOWN'}
                        </Badge>
                        <p className="text-sm text-gray-400 mt-1">R{booking.totalAmount || 0}</p>
                      </div>
                    </div>
                  ))}
                  {(!bookings || bookings.length === 0) && (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No jobs yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your jobs will appear here when clients book your services.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "jobs":
        return (
          <div className="space-y-6">
            {/* Job Filters */}
            <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'confirmed', 'in_progress', 'awaiting_confirmation', 'completed'].map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                      className={selectedFilter === filter 
                        ? 'bg-blue-400 hover:bg-blue-500 text-white' 
                        : 'border-gray-300/30 text-gray-300 hover:bg-blue-400/10'
                      }
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <div className="space-y-4">
              {filteredBookings
                .filter(booking => booking && booking.id && typeof booking.id === 'string')
                .map((booking) => {
                  // Additional validation to prevent React errors
                  if (!booking || !booking.id || typeof booking.id !== 'string') {
                    console.warn('Invalid booking object:', booking);
                    return null;
                  }
                  
                  return (
                    <ComponentErrorBoundary key={booking.id} componentName={`BookingCard-${booking.id}`}>
                      <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20 hover:bg-black/60 transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-400/20 rounded-full">
                            <Calendar className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{booking.service?.name || 'Unknown Service'}</h3>
                            <p className="text-sm text-gray-400">{booking.service?.category || 'No Category'}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-400">Client</p>
                            <p className="text-white font-medium">{booking.client?.name || 'Unknown Client'}</p>
                            <p className="text-sm text-gray-400">{booking.client?.email || 'No Email'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Scheduled Date</p>
                            <p className="text-white font-medium">
                              {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'No Date'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleTimeString() : 'No Time'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-gray-400">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.address || 'No Address'}
                          </span>
                          <span className="flex items-center text-gray-400">
                            <DollarSign className="w-4 h-4 mr-1" />
                            R{booking.totalAmount || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {booking.status || 'UNKNOWN'}
                        </Badge>
                        {booking.status && typeof booking.status === 'string' && booking.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            className="bg-green-400 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => acceptBooking(booking.id)}
                            disabled={acceptingBooking === booking.id}
                          >
                            {acceptingBooking === booking.id ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Accepting...
                              </div>
                            ) : (
                              'Accept Job'
                            )}
                          </Button>
                        )}
                        {booking.status && typeof booking.status === 'string' && booking.status === 'CONFIRMED' && (
                          <Button 
                            size="sm" 
                            className="bg-blue-400 hover:bg-blue-500 text-white"
                            disabled
                          >
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accepted
                            </div>
                          </Button>
                        )}
                        {booking.status && typeof booking.status === 'string' && booking.status === 'PENDING_EXECUTION' && (
                          <Button 
                            size="sm" 
                            className="bg-green-400 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleStartJob(booking.id)}
                            disabled={processingAction}
                          >
                            {processingAction ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Starting...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Play className="h-4 w-4 mr-2" />
                                Start Job
                              </div>
                            )}
                          </Button>
                        )}
                        {booking.status && typeof booking.status === 'string' && booking.status === 'IN_PROGRESS' && (
                          <Button 
                            size="sm" 
                            className="bg-green-400 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleCompleteJob(booking.id)}
                            disabled={processingAction}
                          >
                            {processingAction ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Completing...
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Job
                              </div>
                            )}
                          </Button>
                        )}
                        {booking.status && typeof booking.status === 'string' && booking.status === 'AWAITING_CONFIRMATION' && (
                          <Button 
                            size="sm" 
                            className="bg-yellow-400 hover:bg-yellow-500 text-white"
                            disabled
                          >
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Awaiting Confirmation
                            </div>
                          </Button>
                        )}
                        {booking.status && typeof booking.status === 'string' && booking.status === 'COMPLETED' && (
                          <Button 
                            size="sm" 
                            className="bg-gray-400 hover:bg-gray-500 text-white"
                            disabled
                          >
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </div>
                          </Button>
                        )}
                        {/* Fallback for invalid or undefined status */}
                        {(!booking.status || typeof booking.status !== 'string' || 
                          !['PENDING', 'CONFIRMED', 'PENDING_EXECUTION', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'COMPLETED'].includes(booking.status)) && (
                          <Button 
                            size="sm" 
                            className="bg-gray-400 hover:bg-gray-500 text-white"
                            disabled
                          >
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Invalid Status
                            </div>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                    </ComponentErrorBoundary>
                  );
                })
                .filter(Boolean) // Remove any null values from invalid bookings
              }
              
              {/* Accept Success Display */}
              {acceptSuccess && (
                <Card className="bg-green-900/20 backdrop-blur-sm border-green-500/30 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <h4 className="text-green-400 font-medium">Job Accepted!</h4>
                        <p className="text-green-300 text-sm">{acceptSuccess}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-400 hover:text-green-300 ml-auto"
                        onClick={clearAcceptSuccess}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Accept Error Display */}
              {acceptError && (
                <Card className="bg-red-900/20 backdrop-blur-sm border-red-500/30 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div>
                        <h4 className="text-red-400 font-medium">Failed to Accept Job</h4>
                        <p className="text-red-300 text-sm">{acceptError}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 ml-auto"
                        onClick={clearAcceptError}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {filteredBookings.length === 0 && (
                <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Jobs Found</h3>
                    <p className="text-gray-400">
                      {selectedFilter === 'all' 
                        ? 'You haven\'t received any job requests yet.' 
                        : `No jobs with status "${selectedFilter}" found.`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case "earnings":
        return (
          <div className="space-y-6">
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Earnings</p>
                      <p className="text-3xl font-bold text-white">R{stats.totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-400/20 rounded-full">
                      <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">This Month</p>
                      <p className="text-3xl font-bold text-white">R{stats.thisMonthEarnings.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-blue-400/20 rounded-full">
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Average Rating</p>
                      <p className="text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
                      <p className="text-sm text-gray-400">{stats.totalReviews} reviews</p>
                    </div>
                    <div className="p-3 bg-yellow-400/20 rounded-full">
                      <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Chart Placeholder */}
            <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Earnings Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-300/10">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Earnings chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "bank":
        try {
          // Defensive programming for bank section
          const safeDashboardState = dashboardState || {}
          const safeData = safeDashboardState.data || {}
          const bankDetails = safeData.bankDetails || null
          const hasBankDetails = safeData.hasBankDetails || false
          
          return (
            <div className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    Bank Details Setup
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {hasBankDetails 
                      ? 'Your bank details are configured. You can update them below.' 
                      : 'Setup your bank details to receive payments from completed jobs.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ComponentErrorBoundary 
                    componentName="BankDetailsForm"
                    fallback={
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Bank Form Error</h3>
                        <p className="text-gray-400 mb-4">
                          There was an error loading the bank details form.
                        </p>
                        <Button
                          onClick={() => setActiveSection('overview')}
                          className="bg-blue-400 hover:bg-blue-500 text-white mr-2"
                        >
                          Go to Overview
                        </Button>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="outline"
                          className="border-gray-300/30 text-gray-300 hover:bg-gray-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reload Page
                        </Button>
                      </div>
                    }
                  >
                    <BankDetailsForm 
                      initialBankDetails={memoizedBankDetails}
                      // DISABLED: No callback to prevent infinite loops
                      // onBankDetailsChange={handleBankDetailsChange}
                    />
                  </ComponentErrorBoundary>
                </CardContent>
              </Card>
            </div>
          )
        } catch (bankError) {
          console.error('Bank section specific error:', bankError)
          return (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Bank Setup Error</h3>
              <p className="text-gray-400 mb-4">
                There was an error loading the bank setup section.
              </p>
              <div className="text-xs text-gray-500 mb-4">
                Error: {bankError.message}
              </div>
              <Button 
                onClick={() => setActiveSection('overview')}
                className="bg-blue-400 hover:bg-blue-500 text-white mr-2"
              >
                Go to Overview
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-gray-300/30 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          )
        }

      default:
        return (
          <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Section Not Found</h3>
              <p className="text-gray-400">The requested section could not be found.</p>
            </CardContent>
          </Card>
        )
    }
    } catch (error) {
      console.error('Error rendering section content:', error)
      console.error('Active section:', activeSection)
      console.error('Error stack:', error.stack)
      console.error('Dashboard state:', {
        hasBankDetails: dashboardState?.data?.hasBankDetails,
        bankDetails: dashboardState?.data?.bankDetails,
        user: dashboardState?.auth?.user,
        activeSection: activeSection,
        bookingsLength: bookings?.length,
        stats: stats
      })
      
      return (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Content</h3>
          <p className="text-gray-400 mb-4">
            There was an error loading this section. Please try refreshing the page.
          </p>
          <div className="text-xs text-gray-500 mb-4">
            Error: {error.message}
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-400 hover:bg-blue-500 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Page
          </Button>
        </div>
        )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-sm border-b border-gray-300/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">
              {activeSection === 'bank' ? 'Bank Setup' : activeSection}
            </h1>
            <p className="text-gray-400 mt-1">
              {activeSection === 'overview' && 'Manage your provider account and view key metrics'}
              {activeSection === 'jobs' && 'View and manage your job requests'}
              {activeSection === 'earnings' && 'Track your earnings and performance'}
              {activeSection === 'bank' && 'Configure your bank details for payments'}
              {activeSection === 'profile' && 'Update your provider profile'}
              {activeSection === 'support' && 'Get help and support'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="border-gray-300/30 text-gray-300 hover:bg-blue-400/10 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderSectionContent()}
      </div>
    </div>
  )
}

export function UnifiedProviderDashboard({ initialUser }: UnifiedProviderDashboardProps = {}) {
  const router = useRouter()
  
  // Use refs to prevent infinite loops
  const isInitialized = useRef(false)
  const lastRefreshTime = useRef(Date.now())
  
  // Consolidated state management
  const [dashboardState, setDashboardState] = useState({
    // Authentication state
    auth: {
      isAuthenticated: !!initialUser,
      isLoading: !initialUser,
      error: null,
      user: initialUser || null
    },
    // Dashboard data
    data: {
      bookings: [] as Booking[],
      stats: {
        pendingJobs: 0,
        confirmedJobs: 0,
        pendingExecutionJobs: 0,
        inProgressJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        averageRating: 0,
        totalReviews: 0
      } as ProviderStats,
      currentProviderId: "",
      hasBankDetails: false
    },
    // UI state
    ui: {
      loading: true,
      error: null as string | null,
      lastRefresh: new Date(),
      selectedFilter: "all",
      activeSection: "overview",
      isCollapsed: false,
      acceptingBooking: null as string | null, // Track which booking is being accepted
      acceptError: null as string | null, // Track accept errors
      acceptSuccess: null as string | null, // Track accept success messages
      processingAction: false // Track when any action is being processed
    }
  })

  // Stable authentication check function
  const checkAuthentication = useCallback(async () => {
    try {
      setDashboardState(prev => ({
        ...prev,
        auth: { ...prev.auth, isLoading: true, error: null }
      }))
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        setDashboardState(prev => ({
          ...prev,
          auth: {
            isAuthenticated: false,
            isLoading: false,
            error: 'Authentication required',
            user: null
          }
        }))
        router.push('/login')
        return false
      }

      if (!response.ok) {
        throw new Error(`Authentication check failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.user && data.user.role === 'PROVIDER') {
        setDashboardState(prev => ({
          ...prev,
          auth: {
            isAuthenticated: true,
            isLoading: false,
            error: null,
            user: data.user
          }
        }))
        return true
      } else {
        setDashboardState(prev => ({
          ...prev,
          auth: {
            isAuthenticated: false,
            isLoading: false,
            error: 'Provider role required',
            user: data.user
          }
        }))
        router.push('/dashboard')
        return false
      }
    } catch (error) {
      console.error('Authentication check error:', error)
      setDashboardState(prev => ({
        ...prev,
        auth: {
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication failed',
          user: null
        }
      }))
      return false
    }
  }, [router])

  // WebSocket connection for real-time updates
  const { connected, error: socketError, reconnect, isPolling } = useSocket({
    userId: dashboardState.auth.user?.id || 'test_provider_123',
    role: 'PROVIDER',
    enablePolling: true,
    pollingInterval: 60000, // 60 seconds
    onBookingUpdate: (event) => {
      console.log('🔔 Provider booking update received:', event)
      // Refresh data when booking status changes
      fetchProviderData()
    },
    onPaymentUpdate: (event) => {
      console.log('💳 Provider payment update received:', event)
      // Refresh data when payment status changes
      fetchProviderData()
    },
    onPayoutUpdate: (event) => {
      console.log('💰 Provider payout update received:', event)
      // Refresh data when payout status changes
      fetchProviderData()
    },
    onNotification: (event) => {
      console.log('🔔 Provider notification received:', event)
      // Show notification to user
      showToast.info(event.data.message || 'New notification')
    }
  })

  // Stable provider data fetch function with retry logic
  const fetchProviderData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    if (!dashboardState.auth.isAuthenticated) {
      console.log('Not authenticated, skipping provider data fetch')
      return
    }

    try {
      console.log(`Fetching provider data (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, loading: true, error: null }
      }))

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('/api/provider/bookings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        const authSuccess = await checkAuthentication()
        if (!authSuccess) {
          setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, error: 'Authentication expired. Please log in again.' }
          }))
          return
        }
        return fetchProviderData()
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Provider data fetch failed:', response.status, errorData)
        // Don't throw error, just set empty data
        setDashboardState(prev => ({
          ...prev,
          data: {
            bookings: [],
            stats: {
              totalBookings: 0,
              completedBookings: 0,
              pendingBookings: 0,
              totalEarnings: 0,
              monthlyEarnings: 0
            },
            hasBankDetails: false
          },
          loading: false,
          error: `Failed to load data: ${errorData.error || 'Unknown error'}`
        }))
        return
      }

      const data = await response.json()
      console.log('Provider dashboard data:', data)

      setDashboardState(prev => ({
        ...prev,
        data: {
          bookings: data.bookings || [],
          stats: data.stats || prev.data.stats,
          currentProviderId: data.providerId || "",
          hasBankDetails: prev.data.hasBankDetails
        },
        ui: {
          ...prev.ui,
          error: null,
          lastRefresh: new Date()
        }
      }))

      if (data.providerId) {
        checkBankDetails(data.providerId)
      }

    } catch (error) {
      console.error('Error fetching provider data:', error);
      
      if (error.name === 'AbortError') {
        console.log('Request timed out');
      }
      
      if (retryCount < maxRetries) {
        console.log(`Retrying in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => fetchProviderData(retryCount + 1), (retryCount + 1) * 2000);
      } else {
        setDashboardState(prev => ({
          ...prev,
          ui: {
            ...prev.ui,
            loading: false,
            error: `Failed to load provider data after ${maxRetries + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }))
      }
    } finally {
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, loading: false }
      }))
    }
  }, [dashboardState.auth.isAuthenticated, checkAuthentication])

  // Check bank details - OPTIMIZED VERSION with debouncing and caching
  const lastBankDetailsCheck = useRef<number>(0)
  const bankDetailsCache = useRef<{providerId: string, data: any} | null>(null)
  
  const checkBankDetails = useCallback(async (providerId: string) => {
    // Debounce: Don't check more than once every 10 seconds
    const now = Date.now()
    if (now - lastBankDetailsCheck.current < 10000) {
      console.log('checkBankDetails: Skipping due to debounce (last check was', now - lastBankDetailsCheck.current, 'ms ago)')
      return
    }
    
    // Cache: If we already have data for this provider, don't fetch again
    if (bankDetailsCache.current?.providerId === providerId) {
      console.log('checkBankDetails: Using cached data for provider', providerId)
      return
    }
    
    lastBankDetailsCheck.current = now
    
    try {
      console.log('checkBankDetails: Fetching bank details for provider', providerId)
      const response = await fetch(`/api/provider/${providerId}/bank-details`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Bank details API response:', data)
        
        // Cache the response
        bankDetailsCache.current = { providerId, data }
        
        // Defensive programming - ensure data structure is correct
        const hasBankDetails = Boolean(data.hasBankDetails)
        const bankDetails = data.bankDetails || null
        
        setDashboardState(prev => ({
          ...prev,
          data: { 
            ...prev.data, 
            hasBankDetails,
            bankDetails
          }
        }))
      } else {
        console.warn('Bank details API failed:', response.status)
        // Set default values on API failure
        setDashboardState(prev => ({
          ...prev,
          data: { 
            ...prev.data, 
            hasBankDetails: false,
            bankDetails: null
          }
        }))
      }
    } catch (error) {
      console.error('Error checking bank details:', error)
      // Set default values on error
      setDashboardState(prev => ({
        ...prev,
        data: { 
          ...prev.data, 
          hasBankDetails: false,
          bankDetails: null
        }
      }))
    }
  }, [])

  // Memoize bank details props to prevent unnecessary BankDetailsForm re-renders
  const memoizedBankDetails = useMemo(() => {
    const safeDashboardState = dashboardState || {}
    const safeData = safeDashboardState.data || {}
    return safeData.bankDetails || null
  }, [dashboardState?.data?.bankDetails])

  // Single initialization effect
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
    
    const initializeDashboard = async () => {
      console.log('Initializing provider dashboard...')
      const authSuccess = await checkAuthentication()
      if (authSuccess) {
        await fetchProviderData()
      }
    }

    initializeDashboard()
  }, []) // Empty dependency array

  // Auto-refresh effect
  useEffect(() => {
    if (!dashboardState.auth.isAuthenticated) return

    const pollInterval = setInterval(async () => {
      try {
        const timeSinceLastRefresh = Date.now() - lastRefreshTime.current
        if (timeSinceLastRefresh > 60000) { // 1 minute
          lastRefreshTime.current = Date.now()
          await fetchProviderData()
        }
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(pollInterval)
  }, [dashboardState.auth.isAuthenticated])

  // Refresh function for manual refresh
  const refreshData = useCallback(async () => {
    lastRefreshTime.current = Date.now()
    await fetchProviderData()
  }, [fetchProviderData])

  // Handle bank details change with useCallback to prevent re-renders
  const handleBankDetailsChange = useCallback((bankDetails: any) => {
    // Clear cache when bank details are updated
    bankDetailsCache.current = null
    lastBankDetailsCheck.current = 0
    
    setDashboardState(prev => ({
      ...prev,
      data: { 
        ...prev.data, 
        hasBankDetails: true,
        bankDetails: bankDetails
      }
    }))
  }, [])

  // Accept booking function
  const acceptBooking = useCallback(async (bookingId: string) => {
    try {
      // Set loading state for this specific booking
      setDashboardState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          acceptingBooking: bookingId,
          acceptError: null
        }
      }))

      console.log('Accepting booking:', bookingId)

      const response = await fetch(`/api/book-service/${bookingId}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Booking accepted successfully:', result)

      // Update the booking status in the local state
      setDashboardState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          bookings: prev.data.bookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'CONFIRMED' as const }
              : booking
          )
        },
        ui: {
          ...prev.ui,
          acceptingBooking: null,
          acceptError: null
        }
      }))

      // Show success message
      setDashboardState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          acceptSuccess: 'Job accepted successfully! Client has been notified.'
        }
      }))

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setDashboardState(prev => ({
          ...prev,
          ui: { ...prev.ui, acceptSuccess: null }
        }))
      }, 5000)

      console.log('✅ Booking accepted successfully!')

    } catch (error) {
      console.error('Failed to accept booking:', error)
      
      setDashboardState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          acceptingBooking: null,
          acceptError: error.message || 'Failed to accept booking'
        }
      }))

      // Show error message (you could add a toast notification here)
      console.error('❌ Failed to accept booking:', error.message)
    }
  }, [])

  // Handle starting a job
  const handleStartJob = useCallback(async (bookingId: string) => {
    try {
      // Set processing state
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, processingAction: true }
      }))

      console.log('Starting job for booking:', bookingId)

      const response = await fetch(`/api/book-service/${bookingId}/start`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Job started successfully:', result)

      // Update the booking status in the local state
      setDashboardState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          bookings: prev.data.bookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'IN_PROGRESS' as const }
              : booking
          )
        }
      }))

      // Refresh data to get latest state
      await fetchProviderData()

      console.log('✅ Job started successfully!')

    } catch (error) {
      console.error('Failed to start job:', error)
      // You could add a toast notification here
      console.error('❌ Failed to start job:', error.message)
    } finally {
      // Clear processing state
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, processingAction: false }
      }))
    }
  }, [fetchProviderData])

  // Handle completing a job
  const handleCompleteJob = useCallback(async (bookingId: string) => {
    try {
      // Set processing state
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, processingAction: true }
      }))

      console.log('Completing job for booking:', bookingId)

      const response = await fetch(`/api/book-service/${bookingId}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Job completed successfully',
          photos: []
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('Job completed successfully:', result)

      // Update the booking status in the local state
      setDashboardState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          bookings: prev.data.bookings.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'AWAITING_CONFIRMATION' as const }
              : booking
          )
        }
      }))

      // Refresh data to get latest state
      await fetchProviderData()

      console.log('✅ Job completed successfully!')

    } catch (error) {
      console.error('Failed to complete job:', error)
      // You could add a toast notification here
      console.error('❌ Failed to complete job:', error.message)
    } finally {
      // Clear processing state
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, processingAction: false }
      }))
    }
  }, [fetchProviderData])

  // Loading state
  if (dashboardState.auth.isLoading || dashboardState.ui.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading provider dashboard...</p>
        </div>
      </div>
    )
  }

  // Authentication error state
  if (!dashboardState.auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-400 mb-6">
            {dashboardState.auth.error || 'You need to log in to access the provider dashboard.'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="w-full border-gray-300/30 text-gray-300 hover:bg-gray-700"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard error state
  if (dashboardState.ui.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-400 mb-6">
            {dashboardState.ui.error}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={refreshData} 
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/login')} 
              className="w-full border-gray-300/30 text-gray-300 hover:bg-gray-700"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render the unified dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Brand Header - Desktop/Tablet Only */}
      <div className="hidden lg:block">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings: dashboardState.data.bookings.length,
            pendingBookings: dashboardState.data.bookings.filter(b => b.status === "PENDING").length,
            completedBookings: dashboardState.data.bookings.filter(b => b.status === "COMPLETED").length,
            rating: dashboardState.data.stats.averageRating
          }}
        />
      </div>
      
      {/* Desktop/Tablet Layout */}
      <div className="hidden lg:flex min-h-screen">
        <ProviderDesktopSidebar
          activeSection={dashboardState.ui.activeSection}
          setActiveSection={(section) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, activeSection: section }
          }))}
          user={dashboardState.auth.user}
          totalBookings={dashboardState.data.bookings.length}
          pendingBookings={dashboardState.data.bookings.filter(b => b.status === "PENDING").length}
          isCollapsed={dashboardState.ui.isCollapsed}
          setIsCollapsed={(collapsed) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, isCollapsed: collapsed }
          }))}
        />
        <ProviderMainContent
          activeSection={dashboardState.ui.activeSection}
          setActiveSection={(section) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, activeSection: section }
          }))}
          user={dashboardState.auth.user}
          bookings={dashboardState.data.bookings}
          stats={dashboardState.data.stats}
          refreshData={refreshData}
          isRefreshing={dashboardState.ui.loading}
          lastRefresh={dashboardState.ui.lastRefresh}
          selectedFilter={dashboardState.ui.selectedFilter}
          setSelectedFilter={(filter) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, selectedFilter: filter }
          }))}
          hasBankDetails={dashboardState.data.hasBankDetails}
          acceptBooking={acceptBooking}
          acceptingBooking={dashboardState.ui.acceptingBooking}
          acceptError={dashboardState.ui.acceptError}
          acceptSuccess={dashboardState.ui.acceptSuccess}
          clearAcceptError={() => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, acceptError: null }
          }))}
          clearAcceptSuccess={() => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, acceptSuccess: null }
          }))}
          handleStartJob={handleStartJob}
          handleCompleteJob={handleCompleteJob}
          processingAction={dashboardState.ui.processingAction}
          handleBankDetailsChange={handleBankDetailsChange}
          dashboardState={dashboardState}
          memoizedBankDetails={memoizedBankDetails}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsolidatedMobileHeaderProvider
          user={dashboardState.auth.user}
          activeSection={dashboardState.ui.activeSection}
          setActiveSection={(section) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, activeSection: section }
          }))}
          totalBookings={dashboardState.data.bookings.length}
          pendingBookings={dashboardState.data.bookings.filter(b => b.status === "PENDING").length}
          hasNotifications={dashboardState.data.bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status))}
          className="bg-black/70 backdrop-blur-sm border-b border-white/20"
        />
        <ProviderMainContent
          activeSection={dashboardState.ui.activeSection}
          setActiveSection={(section) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, activeSection: section }
          }))}
          user={dashboardState.auth.user}
          bookings={dashboardState.data.bookings}
          stats={dashboardState.data.stats}
          refreshData={refreshData}
          isRefreshing={dashboardState.ui.loading}
          lastRefresh={dashboardState.ui.lastRefresh}
          selectedFilter={dashboardState.ui.selectedFilter}
          setSelectedFilter={(filter) => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, selectedFilter: filter }
          }))}
          hasBankDetails={dashboardState.data.hasBankDetails}
          acceptBooking={acceptBooking}
          acceptingBooking={dashboardState.ui.acceptingBooking}
          acceptError={dashboardState.ui.acceptError}
          acceptSuccess={dashboardState.ui.acceptSuccess}
          clearAcceptError={() => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, acceptError: null }
          }))}
          clearAcceptSuccess={() => setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, acceptSuccess: null }
          }))}
          handleStartJob={handleStartJob}
          handleCompleteJob={handleCompleteJob}
          processingAction={dashboardState.ui.processingAction}
          handleBankDetailsChange={handleBankDetailsChange}
          dashboardState={dashboardState}
          memoizedBankDetails={memoizedBankDetails}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="PROVIDER" />
    </div>
  )
}
