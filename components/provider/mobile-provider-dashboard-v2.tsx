"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
  TrendingDown
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

// Skeleton Loader Components for micro-interactions
function SkeletonCard() {
  return (
    <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-24"></div>
            <div className="h-6 bg-gray-700 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkeletonBookingCard() {
  return (
    <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  )
}

// Desktop Sidebar Component
function DesktopSidebar({ 
  activeSection, 
  setActiveSection, 
  user, 
  stats,
  isCollapsed,
  setIsCollapsed 
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  stats: ProviderStats
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) {
  const navigationItems = [
    { 
      name: 'Overview', 
      href: '#overview', 
      icon: Home, 
      current: activeSection === 'overview',
      badge: stats.pendingJobs > 0 ? stats.pendingJobs : undefined
    },
    { 
      name: 'Bookings', 
      href: '#bookings', 
      icon: Calendar, 
      current: activeSection === 'bookings',
      badge: stats.confirmedJobs > 0 ? stats.confirmedJobs : undefined
    },
    { 
      name: 'Earnings', 
      href: '#earnings', 
      icon: DollarSign, 
      current: activeSection === 'earnings'
    },
    { 
      name: 'Reviews', 
      href: '#reviews', 
      icon: Star, 
      current: activeSection === 'reviews'
    },
    { 
      name: 'Settings', 
      href: '#settings', 
      icon: Settings, 
      current: activeSection === 'settings'
    }
  ]

  return (
    <aside className={`bg-black/80 backdrop-blur-sm border-r border-gray-300/20 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-300/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">ConnectSA</h2>
                  <p className="text-xs text-gray-400">Provider Dashboard</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => setActiveSection(item.href.replace('#', ''))}
                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  item.current
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-800/50'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : ''}
              >
                <Icon className={`flex-shrink-0 w-5 h-5 ${
                  isCollapsed ? '' : 'mr-3'
                }`} />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="ml-auto bg-blue-900/50 text-blue-400 text-xs border-blue-800/50">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'P'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Provider'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

// Main Content Component
function MainContent({
  activeSection,
  setActiveSection,
  user,
  bookings,
  stats,
  refreshBooking,
  refreshAllBookings,
  isRefreshing,
  lastRefresh,
  selectedFilter,
  setSelectedFilter,
  showConfirmDialog,
  setShowConfirmDialog,
  selectedBooking,
  setSelectedBooking,
  selectedAction,
  setSelectedAction,
  processingAction,
  setProcessingAction,
  showCompletionModal,
  setShowCompletionModal,
  completionData,
  setCompletionData,
  currentProviderId,
  hasBankDetails,
  isCheckingBankDetails
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  bookings: Booking[]
  stats: ProviderStats
  refreshBooking: (id: string) => void
  refreshAllBookings: () => void
  isRefreshing: boolean
  lastRefresh: Date
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  showConfirmDialog: boolean
  setShowConfirmDialog: (show: boolean) => void
  selectedBooking: Booking | null
  setSelectedBooking: (booking: Booking | null) => void
  selectedAction: string
  setSelectedAction: (action: string) => void
  processingAction: boolean
  setProcessingAction: (processing: boolean) => void
  showCompletionModal: boolean
  setShowCompletionModal: (show: boolean) => void
  completionData: { photos: string[], notes: string }
  setCompletionData: (data: { photos: string[], notes: string }) => void
  currentProviderId: string
  hasBankDetails: boolean
  isCheckingBankDetails: boolean
}) {
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MobileStatsCard
                title="Pending Jobs"
                value={stats.pendingJobs.toString()}
                icon={Clock}
                color="orange"
                change={stats.pendingJobs > 0 ? "+" + stats.pendingJobs : "0"}
                changeType="neutral"
              />
              <MobileStatsCard
                title="Confirmed Jobs"
                value={stats.confirmedJobs.toString()}
                icon={CheckCircle}
                color="green"
                change={stats.confirmedJobs > 0 ? "+" + stats.confirmedJobs : "0"}
                changeType="positive"
              />
              <MobileStatsCard
                title="In Progress"
                value={stats.inProgressJobs.toString()}
                icon={Activity}
                color="blue"
                change={stats.inProgressJobs > 0 ? "+" + stats.inProgressJobs : "0"}
                changeType="positive"
              />
              <MobileStatsCard
                title="Completed"
                value={stats.completedJobs.toString()}
                icon={Award}
                color="purple"
                change={stats.completedJobs > 0 ? "+" + stats.completedJobs : "0"}
                changeType="positive"
              />
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 via-emerald-500/3 to-green-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                
                {/* Subtle Floating Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-green-400/30 rounded-full animate-pulse delay-300"></div>
                  <div className="absolute bottom-6 left-4 w-1 h-1 bg-green-300/40 rounded-full animate-bounce delay-700"></div>
                </div>
                
                <CardHeader className="pb-3 relative z-10">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span>Total Earnings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-2">
                    R{stats.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    All time earnings
                  </div>
                </CardContent>
              </Card>

              <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                
                {/* Subtle Floating Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
                  <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
                </div>
                
                <CardHeader className="pb-3 relative z-10">
                  <CardTitle className="text-white flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span>This Month</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-2">
                    R{stats.thisMonthEarnings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Current month earnings
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
              
              {/* Subtle Floating Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
                <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
              </div>
              
              <CardHeader className="pb-6 relative z-10">
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Recent Bookings</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSection('bookings')}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors duration-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        {(() => {
                          const IconComponent = getServiceIcon(booking.service.name)
                          return <IconComponent className="w-5 h-5 text-white" />
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {booking.service?.name || 'Unknown Service'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {booking.client?.name || 'Unknown Client'}
                        </p>
                      </div>
                      <Badge 
                        className={`text-xs ${
                          booking.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' :
                          booking.status === 'CONFIRMED' ? 'bg-green-400/20 text-green-400 border-green-400/30' :
                          booking.status === 'IN_PROGRESS' ? 'bg-blue-400/20 text-blue-400 border-blue-400/30' :
                          'bg-purple-400/20 text-purple-400 border-purple-400/30'
                        }`}
                      >
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'bookings':
        return (
          <div className="space-y-6">
            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {bookings.map((booking) => (
                <ProviderBookingCard
                  key={booking.id}
                  booking={booking}
                  showReview={booking.status === 'COMPLETED'}
                  onAction={(action, booking) => {
                    setSelectedAction(action)
                    setSelectedBooking(booking)
                    setShowConfirmDialog(true)
                  }}
                />
              ))}
            </div>
          </div>
        )

      case 'earnings':
        return (
          <div className="space-y-6">
            {/* Earnings Chart */}
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ProviderEarningsChart bookings={bookings} />
              </CardContent>
            </Card>

            {/* Bank Details */}
            {currentProviderId && (
              <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 via-emerald-500/3 to-green-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white">Payment Setup</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <BankDetailsForm 
                    providerId={currentProviderId} 
                    onSuccess={() => {
                      showToast.success('Bank details updated successfully! You can now receive payments.')
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'reviews':
        return (
          <div className="space-y-6">
            {/* Rating Overview */}
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-amber-500/3 to-yellow-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
              
              {/* Subtle Floating Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-yellow-400/30 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-6 left-4 w-1 h-1 bg-yellow-300/40 rounded-full animate-bounce delay-700"></div>
              </div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-white flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Your Rating</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(stats.averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-400">
                    Based on {stats.totalReviews} reviews
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              {/* Animated Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start hover:bg-gray-800/50 transition-colors duration-200">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-gray-800/50 transition-colors duration-200">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-gray-800/50 transition-colors duration-200">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-gray-300/20 flex-shrink-0 z-30">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-bold text-white capitalize">
                {activeSection.replace('_', ' ')}
              </h2>
              <p className="text-sm text-gray-300">
                {activeSection === 'overview' && 'Your provider dashboard overview'}
                {activeSection === 'bookings' && 'Manage your bookings and jobs'}
                {activeSection === 'earnings' && 'Track your earnings and payments'}
                {activeSection === 'reviews' && 'View client reviews and ratings'}
                {activeSection === 'settings' && 'Account and preference settings'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshAllBookings}
              disabled={isRefreshing}
              className="text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {renderContent()}
      </main>
    </div>
  )
}

export function MobileProviderDashboardV2() {
  const [user, setUser] = useState<any>(null)
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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [activeSection, setActiveSection] = useState<string>("overview")
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>("")
  const [processingAction, setProcessingAction] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionData, setCompletionData] = useState<{ photos: string[], notes: string }>({ photos: [], notes: '' })
  const [currentProviderId, setCurrentProviderId] = useState<string>("")
  const [hasBankDetails, setHasBankDetails] = useState<boolean>(false)
  const [isCheckingBankDetails, setIsCheckingBankDetails] = useState<boolean>(false)

  const searchParams = useSearchParams()

  // Check if provider has bank details
  const checkBankDetails = async (providerId: string) => {
    try {
      setIsCheckingBankDetails(true)
      const response = await fetch(`/api/provider/${providerId}/bank-details`)
      if (response.ok) {
        const data = await response.json()
        setHasBankDetails(data.hasBankDetails)
      }
    } catch (error) {
      console.error('Error checking bank details:', error)
    } finally {
      setIsCheckingBankDetails(false)
    }
  }

  const refreshBankDetailsStatus = useCallback(() => {
    if (currentProviderId) {
      checkBankDetails(currentProviderId)
    }
  }, [currentProviderId])

  // Fetch provider data
  useEffect(() => {
    async function fetchProviderData() {
      try {
        setLoading(true)
        
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          window.location.href = '/login'
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        const bookingsRes = await fetch('/api/provider/bookings', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings || [])
          setStats(bookingsData.stats || stats)
          setError(null) // Clear any previous errors
          
          // Log the response for debugging
          console.log('Provider bookings API response (v2):', {
            success: bookingsData.success,
            bookingCount: bookingsData.bookings?.length || 0,
            hasBookings: (bookingsData.bookings?.length || 0) > 0,
            message: bookingsData.message
          });
          
          // Get provider ID for bank details check
          if (bookingsData.providerId) {
            setCurrentProviderId(bookingsData.providerId)
            checkBankDetails(bookingsData.providerId)
          }
        } else {
          console.error('Provider bookings API error:', bookingsRes.status, bookingsRes.statusText)
          setError('Failed to load provider data')
        }
      } catch (error) {
        console.error('Error fetching provider data:', error)
        setError('Failed to load provider data')
      } finally {
        setLoading(false)
      }
    }

    fetchProviderData()
  }, [])

  // Track interaction state and last refresh time
  const lastRefreshRef = useRef<number>(0)
  const isInteractingRef = useRef<boolean>(false)

  // Auto-refresh mechanism - less aggressive
  useEffect(() => {
    if (!bookings.length || !user) return

    const pollInterval = setInterval(async () => {
      // Only refresh if:
      // 1. Page is visible
      // 2. Not currently loading
      // 3. User is not interacting
      // 4. At least 60 seconds have passed
      const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
      if (document.hidden || 
          loading || 
          isInteractingRef.current ||
          timeSinceLastRefresh < 60000) {
        return
      }

      try {
        lastRefreshRef.current = Date.now()
        const response = await fetch('/api/provider/bookings', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
          setStats(data.stats || stats)
        }
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, 60000) // Check every 60 seconds (was 30 seconds)

    return () => clearInterval(pollInterval)
  }, [bookings, user, stats, loading])

  const refreshAllBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/provider/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
        setStats(data.stats || stats)
        setLastRefresh(new Date())
        showToast.success('Bookings refreshed successfully!')
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error)
      showToast.error('Failed to refresh bookings')
    }
  }, [stats])

  const refreshBooking = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch('/api/provider/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error refreshing booking:', error)
    }
  }, [stats])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-400 mb-4">{error?.message || error?.toString() || 'Unknown error'}</p>
            <Button onClick={() => window.location.reload()}>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Brand Header - Desktop/Tablet Only */}
      <div className="hidden lg:block">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings: bookings.length,
            pendingBookings: stats.pendingJobs,
            completedBookings: stats.completedJobs,
            rating: stats.averageRating
          }}
        />
      </div>
      
      {/* Desktop/Tablet Layout */}
      <div className="hidden lg:flex min-h-screen">
        <DesktopSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          stats={stats}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          bookings={bookings}
          stats={stats}
          refreshBooking={refreshBooking}
          refreshAllBookings={refreshAllBookings}
          isRefreshing={false}
          lastRefresh={lastRefresh}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          selectedBooking={selectedBooking}
          setSelectedBooking={setSelectedBooking}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          processingAction={processingAction}
          setProcessingAction={setProcessingAction}
          showCompletionModal={showCompletionModal}
          setShowCompletionModal={setShowCompletionModal}
          completionData={completionData}
          setCompletionData={setCompletionData}
          currentProviderId={currentProviderId}
          hasBankDetails={hasBankDetails}
          isCheckingBankDetails={isCheckingBankDetails}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsolidatedMobileHeaderProvider
          user={user}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          totalBookings={bookings.length}
          pendingBookings={stats.pendingJobs}
          hasNotifications={bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status))}
          className="bg-black/70 backdrop-blur-sm border-b border-white/20"
        />
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          bookings={bookings}
          stats={stats}
          refreshBooking={refreshBooking}
          refreshAllBookings={refreshAllBookings}
          isRefreshing={false}
          lastRefresh={lastRefresh}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          selectedBooking={selectedBooking}
          setSelectedBooking={setSelectedBooking}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          processingAction={processingAction}
          setProcessingAction={setProcessingAction}
          showCompletionModal={showCompletionModal}
          setShowCompletionModal={setShowCompletionModal}
          completionData={completionData}
          setCompletionData={setCompletionData}
          currentProviderId={currentProviderId}
          hasBankDetails={hasBankDetails}
          isCheckingBankDetails={isCheckingBankDetails}
        />
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
        onConfirm={async () => {
          if (!selectedBooking || !selectedAction) return
          
          setProcessingAction(true)
          try {
            // Handle booking actions here
            showToast.success('Action completed successfully!')
            await refreshAllBookings()
          } catch (error) {
            showToast.error('Failed to complete action')
          } finally {
            setProcessingAction(false)
            setShowConfirmDialog(false)
            setSelectedBooking(null)
            setSelectedAction("")
          }
        }}
        title="Confirm Action"
        description={`Are you sure you want to ${selectedAction} this booking?`}
        confirmText={selectedAction}
        isLoading={processingAction}
      />
    </div>
  )
}
