"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ConsolidatedMobileHeader } from "@/components/ui/consolidated-mobile-header"
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
  Bell,
  Menu,
  X,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  MessageCircle,
  HelpCircle,
  Bell as NotificationIcon,
  GripVertical,
  RotateCcw,
  Phone,
  Mail,
  MoreVertical,
  Heart,
  Share2
} from "lucide-react"
import { showToast } from "@/lib/toast"
import { useBookingData } from "@/hooks/use-booking-data"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { CompactBookingCard } from "@/components/dashboard/compact-booking-card"
import { RecentBookingCard } from "@/components/dashboard/recent-booking-card"
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

function SkeletonServiceCard() {
  return (
    <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-700 rounded w-16"></div>
              <div className="h-4 bg-gray-700 rounded w-20"></div>
            </div>
            <div className="h-8 bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Personalization hook for dashboard widgets
function useDashboardPersonalization() {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-widget-order')
      return saved ? JSON.parse(saved) : ['stats', 'recent-booking-card', 'quick-actions', 'recent-bookings']
    }
    return ['stats', 'recent-booking-card', 'quick-actions', 'recent-bookings']
  })
  
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-hidden-widgets')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })

  const updateWidgetOrder = (newOrder: string[]) => {
    setWidgetOrder(newOrder)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-widget-order', JSON.stringify(newOrder))
    }
  }

  const toggleWidgetVisibility = (widgetId: string) => {
    const newHidden = new Set(hiddenWidgets)
    if (newHidden.has(widgetId)) {
      newHidden.delete(widgetId)
    } else {
      newHidden.add(widgetId)
    }
    setHiddenWidgets(newHidden)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-hidden-widgets', JSON.stringify([...newHidden]))
    }
  }

  return {
    widgetOrder,
    hiddenWidgets,
    updateWidgetOrder,
    toggleWidgetVisibility
  }
}

// Desktop/Tablet Sidebar Component
function DesktopSidebar({ 
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
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      badge: totalBookings > 0 ? totalBookings.toString() : null
    },
    {
      id: "services",
      label: "Services",
      icon: TrendingUp,
      badge: null
    },
    {
      id: "payments",
      label: "Payments",
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
            <h2 className="text-lg lg:text-xl font-semibold text-white whitespace-nowrap">Dashboard</h2>
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
              onClick={() => window.location.href = '/book-service'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Book Service
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full justify-start border-blue-400/30 text-gray-300 hover:bg-blue-400/10 hover:text-white hover:border-blue-400/50 transition-all duration-200 hover:scale-[1.02] min-h-[44px]"
              onClick={() => window.location.href = '/search'}
            >
              <Search className="w-4 h-4 mr-2" />
              Find Providers
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Header Component removed - now using ConsolidatedMobileHeader

// Main Content Area Component - Enhanced with personalization and micro-interactions
function MainContent({ 
  activeSection, 
  setActiveSection,
  user, 
  bookings, 
  services, 
  refreshBooking, 
  refreshAllBookings, 
  isRefreshing, 
  lastRefresh, 
  selectedFilter, 
  setSelectedFilter 
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  bookings: any[]
  services: any[]
  refreshBooking: (id: string) => void
  refreshAllBookings: () => void
  isRefreshing: boolean
  lastRefresh: Date
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
}) {
  // Personalization hook for dashboard widgets
  const { widgetOrder, hiddenWidgets, toggleWidgetVisibility } = useDashboardPersonalization()
  
  // Loading state for section transitions
  const [isSectionLoading, setIsSectionLoading] = useState(false)
  // Calculate stats
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

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (isRefreshing) {
      showToast.info("Refresh already in progress. Please wait.")
      return
    }

    try {
      await refreshAllBookings()
      showToast.success("Payment statuses refreshed successfully!")
    } catch (error) {
      console.error('Manual refresh error:', error)
      showToast.error("Failed to refresh payment statuses. Please try again.")
    }
  }

  // Render different sections based on activeSection
  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Dashboard Customization Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Dashboard Overview</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                onClick={() => {
                  // Toggle customization mode
                  showToast.info("Customization mode coming soon!")
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </div>

            {/* Quick Stats Grid - Enhanced with refined gradients and better accessibility */}
            {!hiddenWidgets.has('stats') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-black/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-300/20 hover:shadow-blue-400/20 hover:border-blue-400/30 transition-all duration-500 ease-out hover:scale-[1.03] group" style={{ animationDelay: '0ms' }}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base font-medium text-gray-300 leading-tight">Total Bookings</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-500 ease-out">{totalBookings}</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-lg">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-300/20 hover:shadow-blue-400/20 hover:border-blue-400/30 transition-all duration-500 ease-out hover:scale-[1.03] group" style={{ animationDelay: '50ms' }}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base font-medium text-gray-300 leading-tight">Completed</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-500 ease-out">{completedBookings}</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-lg">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-300/20 hover:shadow-blue-400/20 hover:border-blue-400/30 transition-all duration-500 ease-out hover:scale-[1.03] group" style={{ animationDelay: '100ms' }}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base font-medium text-gray-300 leading-tight">Active</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-500 ease-out">{pendingBookings + confirmedBookings + inProgressBookings}</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-lg">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-300/20 hover:shadow-blue-400/20 hover:border-blue-400/30 transition-all duration-500 ease-out hover:scale-[1.03] group" style={{ animationDelay: '150ms' }}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm sm:text-base font-medium text-gray-300 leading-tight">Total Spent</p>
                        <p className="text-2xl sm:text-3xl font-bold text-white group-hover:text-blue-400 transition-colors duration-500 ease-out">R{totalSpent.toFixed(0)}</p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out shadow-lg">
                        <DollarSign className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Booking Card - Most recent booking with progress tracking */}
            {!hiddenWidgets.has('recent-booking-card') && (
              <RecentBookingCard
                booking={bookings.length > 0 ? bookings[0] : null}
                onViewAll={() => setActiveSection('bookings')}
                onRefresh={refreshBooking}
                isLoading={isRefreshing}
              />
            )}

            {/* Quick Actions - ProLiink Logo Colors */}
            {!hiddenWidgets.has('quick-actions') && (
              <Card className="bg-black/80 backdrop-blur-md shadow-2xl rounded-3xl border border-gray-300/20 hover:shadow-blue-400/10 transition-all duration-500 ease-out">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center space-x-3 text-xl sm:text-2xl text-white">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gray-300">Get started with these common tasks</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    <Button 
                      className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-blue-400/25 min-h-[96px] group rounded-2xl text-white"
                      onClick={() => window.location.href = '/book-service'}
                      aria-label="Book a new service"
                      style={{ animationDelay: '200ms' }}
                    >
                      <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500 ease-out" />
                      <span className="font-semibold text-base sm:text-lg">Book Service</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-3 border-2 border-blue-400/30 text-gray-300 hover:bg-blue-400/10 hover:border-blue-400/50 hover:text-white transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-blue-400/10 min-h-[96px] group rounded-2xl"
                      onClick={() => window.location.href = '/search'}
                      aria-label="Find service providers"
                      style={{ animationDelay: '250ms' }}
                    >
                      <Search className="w-7 h-7 group-hover:scale-110 transition-transform duration-500 ease-out" />
                      <span className="font-semibold text-base sm:text-lg">Find Providers</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-3 border-2 border-blue-400/30 text-gray-300 hover:bg-blue-400/10 hover:border-blue-400/50 hover:text-white transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-blue-400/10 min-h-[96px] group rounded-2xl"
                      onClick={() => setActiveSection('bookings')}
                      aria-label="View all bookings"
                      style={{ animationDelay: '300ms' }}
                    >
                      <Calendar className="w-7 h-7 group-hover:scale-110 transition-transform duration-500 ease-out" />
                      <span className="font-semibold text-base sm:text-lg">View Bookings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Bookings Preview - Ultimate Wow Factor */}
            {!hiddenWidgets.has('recent-bookings') && (
              <div className="relative group">
                {/* Animated Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
                
                <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group-hover:shadow-blue-400/20 hover:shadow-2xl" style={{ animationDelay: '350ms' }}>
                  {/* Subtle Floating Elements */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full animate-bounce delay-700"></div>
                    <div className="absolute top-1/2 right-4 w-2 h-2 bg-blue-500/20 rounded-full animate-pulse delay-1000"></div>
                  </div>
                  
                  <CardHeader className="pb-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-3 text-xl sm:text-2xl text-white">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl opacity-20 group-hover:opacity-40 blur-sm transition-opacity duration-500"></div>
                        </div>
                        <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-bold tracking-tight">Recent Bookings</span>
                        {bookings.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-400/20 text-blue-400 border-blue-400/30 flex-shrink-0 font-semibold">
                            {bookings.length}
                          </Badge>
                        )}
                      </CardTitle>
                    {bookings.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveSection('bookings')}
                        className="transition-all duration-500 ease-out hover:scale-105 hover:bg-white/10 text-white/80 hover:text-white text-sm px-4 py-2 rounded-xl"
                      >
                        View All
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-purple-500/25">
                        <Calendar className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">No Bookings Yet</h3>
                      <p className="text-white/90 mb-8 sm:mb-10 max-w-md mx-auto text-base sm:text-lg leading-relaxed">
                        You don't have any bookings yet. Tap below to book your first service and get started!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-lg mx-auto">
                        <Button 
                          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 text-base sm:text-lg px-8 py-4 rounded-2xl font-semibold"
                          onClick={() => window.location.href = '/book-service'}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Book Your First Service
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-500 ease-out hover:scale-105 hover:shadow-xl hover:shadow-white/10 text-base sm:text-lg px-8 py-4 rounded-2xl font-semibold"
                          onClick={() => window.location.href = '/search'}
                        >
                          <Search className="w-5 h-5 mr-2" />
                          Browse Services
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6 relative z-10">
                      {bookings.slice(0, 3).map((booking, index) => (
                        <div 
                          key={booking.id} 
                          className="relative group/item overflow-hidden"
                          style={{ animationDelay: `${400 + (index * 50)}ms` }}
                        >
                          {/* Shimmer Effect Background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover/item:translate-x-full transition-transform duration-1500 ease-out"></div>
                          
                          <div className="flex items-center space-x-4 sm:space-x-6 p-4 sm:p-6 bg-gradient-to-r from-blue-400/10 via-blue-500/5 to-blue-400/10 backdrop-blur-md rounded-2xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-blue-400/20 group-hover/item:scale-[1.02]">
                            {/* Enhanced Service Icon */}
                            <div className="relative">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover/item:shadow-blue-400/50 transition-all duration-500 group-hover/item:scale-110 group-hover/item:rotate-3">
                                <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white group-hover/item:scale-110 transition-transform duration-300" />
                              </div>
                              {/* Glowing Ring */}
                              <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 group-hover/item:border-blue-300/50 transition-colors duration-500"></div>
                              {/* Pulse Effect */}
                              <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-pulse opacity-0 group-hover/item:opacity-100 transition-opacity duration-500"></div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg sm:text-xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text truncate leading-tight tracking-tight">
                                  {booking.service?.name || 'Service'}
                                </h4>
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                </div>
                              </div>
                              <p className="text-sm sm:text-base text-gray-300 font-medium flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                              </p>
                            </div>
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={booking.status} />
                            {/* Contextual Actions */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
                              {booking.status === 'COMPLETED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 hover:bg-white/20 transition-all duration-300 ease-out hover:scale-110 rounded-xl"
                                  onClick={() => {
                                    showToast.info("Rebooking feature coming soon!")
                                  }}
                                  title="Rebook this service"
                                >
                                  <RotateCcw className="w-4 h-4 text-blue-300" />
                                </Button>
                              )}
                              {booking.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-9 w-9 p-0 hover:bg-white/20 transition-all duration-300 ease-out hover:scale-110 rounded-xl"
                                  onClick={() => {
                                    showToast.info("Cancellation feature coming soon!")
                                  }}
                                  title="Cancel booking"
                                >
                                  <X className="w-4 h-4 text-red-300" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0 hover:bg-white/20 transition-all duration-300 ease-out hover:scale-110 rounded-xl"
                                onClick={() => {
                                  showToast.info("Contact feature coming soon!")
                                }}
                                title="Contact provider"
                              >
                                <MessageCircle className="w-4 h-4 text-white/60" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      ))}
                      {bookings.length > 3 && (
                        <div className="text-center pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveSection('bookings')}
                            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 ease-out hover:scale-105 px-4 py-2 rounded-xl"
                          >
                            <span className="text-sm font-medium">+{bookings.length - 3} more bookings</span>
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            )}

            {/* Payment Status Alert - Enhanced with better visual hierarchy */}
            {bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status)) && (
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md shadow-2xl rounded-3xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-500 ease-out">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-lg"></div>
                      <div className="absolute inset-0 w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-black">
                          {bookings.filter(b => b.payment && b.payment.status === 'PENDING').length}
                        </h3>
                        <span className="text-base font-semibold text-black">
                          Payment{bookings.filter(b => b.payment && b.payment.status === 'PENDING').length !== 1 ? 's' : ''} Processing
                        </span>
                      </div>
                      <p className="text-sm text-black font-medium">
                        ⏳ Your payments are being processed securely
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Last updated: {lastRefresh.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className="border-2 border-gray-400/50 text-black hover:bg-gray-100 hover:border-gray-500 transition-all duration-300 ease-out hover:scale-105 px-4 py-2 rounded-xl"
                    >
                      {isRefreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "bookings":
        return (
          <div className="space-y-6">
            {/* Search and Filter Bar - Enhanced with micro-interactions */}
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bookings..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ease-out hover:border-gray-500 text-sm sm:text-base bg-black/50 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="border border-gray-600 rounded-lg px-3 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 ease-out hover:border-gray-500 min-w-[140px] bg-black/50 text-white"
                    >
                      <option value="all">All Bookings</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings List - Enhanced with skeleton loading and better empty states */}
            {isSectionLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <SkeletonBookingCard key={i} />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {selectedFilter === "all" ? "No Bookings Yet" : "No Bookings Found"}
                    </h3>
                    <p className="text-white/80 mb-8 max-w-md mx-auto">
                      {selectedFilter === "all" 
                        ? "You don't have any bookings yet. Start by exploring our available services and book your first service!"
                        : `No bookings match your "${selectedFilter}" filter. Try adjusting your search criteria.`
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {selectedFilter === "all" ? (
                        <>
                          <Button 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                            onClick={() => window.location.href = '/book-service'}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Book Your First Service
                          </Button>
                          <Button 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-white/10 transition-all duration-200 hover:scale-105"
                            onClick={() => window.location.href = '/search'}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            Browse Services
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-white/10 transition-all duration-200 hover:scale-105"
                          onClick={() => setSelectedFilter('all')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filter
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="group">
                    <CompactBookingCard
                      booking={booking}
                      onUpdate={refreshBooking}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case "services":
        return (
          <div className="space-y-6">
            {/* Services Header - Enhanced with micro-interactions */}
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl text-white">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span>Available Services</span>
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-white/80">Discover and book services from trusted providers</CardDescription>
              </CardHeader>
            </Card>

            {/* Services Grid - Enhanced with skeleton loading and better empty states */}
            {isSectionLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <SkeletonServiceCard key={i} />
                ))}
              </div>
            ) : popularServices.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {popularServices.slice(0, 6).map((service, index) => {
                    const Icon = service.icon
                    return (
                      <Card 
                        key={service.id} 
                        className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10 hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer group hover:scale-[1.02]"
                        onClick={() => window.location.href = `/book-service?service=${service.id}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start space-x-3 sm:space-x-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ease-out">
                              <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base sm:text-lg mb-1 group-hover:text-blue-400 transition-colors duration-300 ease-out leading-tight">{service.name}</h3>
                              <p className="text-white/80 mb-2 text-sm sm:text-base">{service.category}</p>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm text-white/80">{service.averageRating.toFixed(1)}</span>
                                </div>
                                <span className="text-xs sm:text-sm text-white/60">{service.providerCount} providers</span>
                              </div>
                              <Button 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-out hover:scale-105 text-sm sm:text-base"
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
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                
                {/* Show more services button if there are more than 6 */}
                {popularServices.length > 6 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      className="border-gray-600 text-gray-300 hover:bg-white/10 transition-all duration-200 hover:scale-105"
                      onClick={() => window.location.href = '/search'}
                    >
                      View All {popularServices.length} Services
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">No Services Available</h3>
                    <p className="text-white/80 mb-8 max-w-md mx-auto">
                      There are currently no active service providers in your area. Check back later or try expanding your search radius.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-white/10 transition-all duration-200 hover:scale-105"
                        onClick={() => window.location.href = '/search'}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search All Areas
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                        onClick={() => window.location.href = '/book-service'}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Request Service
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case "payments":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <span>Payment History</span>
                </CardTitle>
                <CardDescription className="text-white/80">View your payment transactions and history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Payment History</h3>
                  <p className="text-white/80">Payment history feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "profile":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <User className="w-5 h-5 text-purple-400" />
                  <span>Profile Settings</span>
                </CardTitle>
                <CardDescription className="text-white/80">Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Profile Settings</h3>
                  <p className="text-white/80">Profile management feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "support":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <span>Support Center</span>
                </CardTitle>
                <CardDescription className="text-white/80">Get help and support for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Support Center</h3>
                  <p className="text-white/80">Support center feature coming soon!</p>
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
    <div className="flex-1 p-4 lg:p-6 bg-transparent">
      <div className="transition-all duration-500 ease-out animate-in slide-in-from-right-4 fade-in-0">
        {renderContent()}
      </div>
    </div>
  )
}

export function MobileClientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [initialBookings, setInitialBookings] = useState<any[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [activeSection, setActiveSection] = useState<string>("overview")
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

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
      if (sessionStorage.getItem('payment_callback_any') !== '1') {
        showToast.success('Payment completed successfully! Refreshing booking status...')
        sessionStorage.setItem('payment_callback_any', '1')
      }
      
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
          console.log('Client bookings data:', bookingsData)
          setInitialBookings(bookingsData.bookings || [])
        } else {
          console.error('Failed to fetch bookings:', bookingsRes.status, await bookingsRes.text())
          setInitialBookings([])
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Brand Header - Desktop/Tablet Only */}
        <div className="hidden lg:block">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
        </div>
        
        {/* Mobile Header - Mobile Only */}
        <div className="lg:hidden">
          <ConsolidatedMobileHeader 
            user={null} 
            activeSection="overview"
            setActiveSection={() => {}}
            totalBookings={0}
            pendingBookings={0}
            hasNotifications={false}
            className="bg-black/70 backdrop-blur-sm border-b border-white/20"
          />
        </div>
        
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <p className="text-white/80 text-base">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Brand Header - Desktop/Tablet Only */}
        <div className="hidden lg:block">
          <BrandHeaderClient showAuth={false} showUserMenu={true} />
        </div>
        
        {/* Mobile Header - Mobile Only */}
        <div className="lg:hidden">
          <ConsolidatedMobileHeader 
            user={null} 
            activeSection="overview"
            setActiveSection={() => {}}
            totalBookings={0}
            pendingBookings={0}
            hasNotifications={false}
            className="bg-black/70 backdrop-blur-sm border-b border-white/20"
          />
        </div>
        
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-white/80 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white">
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

  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === "PENDING").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Brand Header - Desktop/Tablet Only */}
      <div className="hidden lg:block">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings,
            pendingBookings,
            completedBookings: bookings.filter(b => b.status === "COMPLETED").length,
            rating: 4.8 // This could be fetched from user data
          }}
        />
      </div>
      
      {/* Desktop/Tablet Layout */}
      <div className="hidden lg:flex min-h-screen">
        <DesktopSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          totalBookings={totalBookings}
          pendingBookings={pendingBookings}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          bookings={bookings}
          services={services}
          refreshBooking={refreshBooking}
          refreshAllBookings={refreshAllBookings}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsolidatedMobileHeader
          user={user}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          totalBookings={totalBookings}
          pendingBookings={pendingBookings}
          hasNotifications={bookings.some(b => b.payment && ['PENDING', 'ESCROW'].includes(b.payment.status))}
          className="bg-black/70 backdrop-blur-sm border-b border-white/20"
        />
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          bookings={bookings}
          services={services}
          refreshBooking={refreshBooking}
          refreshAllBookings={refreshAllBookings}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
        />
      </div>

      {/* Mobile Bottom Navigation - Optimized for essential actions only */}
      <MobileBottomNav userRole="CLIENT" />
      
      {/* Floating Action Button - Removed to reduce redundancy */}
    </div>
  )
}
