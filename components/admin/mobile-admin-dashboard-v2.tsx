"use client"

import React, { useState, useEffect, useCallback } from "react"
// import { useSearchParams } from "next/navigation" // Not used
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { ConsolidatedMobileHeaderAdmin } from "@/components/ui/consolidated-mobile-header-admin"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { MobileStatsCard } from "@/components/ui/mobile-stats-card"
import { MobileActionCard } from "@/components/ui/mobile-action-card"
import { MobileTabbedSection } from "@/components/ui/mobile-tabbed-section"
import { MobileCollapsibleSection } from "@/components/ui/mobile-collapsible-section"
import { 
  Users, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Star, 
  DollarSign, 
  BarChart3, 
  RefreshCw, 
  Loader2, 
  Shield, 
  Zap, 
  Activity,
  Home,
  Settings,
  Bell,
  Menu,
  X,
  ChevronRight,
  User,
  CreditCard,
  HelpCircle,
  Bell as NotificationIcon,
  GripVertical,
  RotateCcw,
  Phone,
  Mail,
  MoreVertical,
  Heart,
  Share2,
  MessageSquare,
  Target,
  Award,
  TrendingDown
} from "lucide-react"
import { showToast } from "@/lib/toast"
import ProviderList from '@/components/admin/provider-list'
import { AdminPaymentManagement } from '@/components/admin/admin-payment-management'
import AdminBookingOverview from '@/components/admin/admin-booking-overview'
import AdminSystemHealth from '@/components/admin/admin-system-health'

interface AdminStats {
  totalUsers: number
  totalProviders: number
  pendingProviders: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  pendingRevenue: number
  escrowRevenue: number
  averageRating: number
  totalPayments: number
  pendingPayments: number
  escrowPayments: number
  completedPayments: number
  failedPayments: number
  totalPayouts: number
  pendingPayouts: number
  completedPayouts: number
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
  stats: AdminStats
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}) {
  const navigationItems = [
    { 
      name: 'Overview', 
      href: '#overview', 
      icon: Home, 
      current: activeSection === 'overview',
      badge: stats.pendingProviders > 0 ? stats.pendingProviders : undefined
    },
    { 
      name: 'Users', 
      href: '#users', 
      icon: Users, 
      current: activeSection === 'users',
      badge: stats.totalUsers > 0 ? stats.totalUsers : undefined
    },
    { 
      name: 'Providers', 
      href: '#providers', 
      icon: Briefcase, 
      current: activeSection === 'providers',
      badge: stats.pendingProviders > 0 ? stats.pendingProviders : undefined
    },
    { 
      name: 'Bookings', 
      href: '#bookings', 
      icon: Calendar, 
      current: activeSection === 'bookings',
      badge: stats.totalBookings > 0 ? stats.totalBookings : undefined
    },
    { 
      name: 'Analytics', 
      href: '#analytics', 
      icon: BarChart3, 
      current: activeSection === 'analytics'
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
                  <p className="text-xs text-gray-400">Admin Dashboard</p>
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
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-2 bg-blue-600 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

// Main Content Component
function MainContent({
  activeSection,
  setActiveSection,
  user,
  stats,
  refreshStats,
  isRefreshing,
  lastRefresh
}: {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  stats: AdminStats
  refreshStats: () => void
  isRefreshing: boolean
  lastRefresh: Date
}) {
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MobileStatsCard
                title="Total Users"
                value={stats.totalUsers.toString()}
                icon={Users}
                color="blue"
                change={stats.totalUsers > 0 ? "+" + stats.totalUsers : "0"}
                changeType="positive"
              />
              <MobileStatsCard
                title="Total Providers"
                value={stats.totalProviders.toString()}
                icon={Briefcase}
                color="green"
                change={stats.totalProviders > 0 ? "+" + stats.totalProviders : "0"}
                changeType="positive"
              />
              <MobileStatsCard
                title="Pending Providers"
                value={stats.pendingProviders.toString()}
                icon={Clock}
                color="orange"
                change={stats.pendingProviders > 0 ? "+" + stats.pendingProviders : "0"}
                changeType="neutral"
              />
              <MobileStatsCard
                title="Total Bookings"
                value={stats.totalBookings.toString()}
                icon={Calendar}
                color="purple"
                change={stats.totalBookings > 0 ? "+" + stats.totalBookings : "0"}
                changeType="positive"
              />
            </div>

            {/* Revenue Overview */}
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
                    <span>Total Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-2">
                    R{stats.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    All time revenue
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
                    <span>Pending Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-white mb-2">
                    R{stats.pendingRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Revenue in escrow
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
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
                  <span>System Health</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshStats}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <AdminSystemHealth 
                  totalBookings={stats.totalBookings}
                  pendingPayments={stats.pendingPayments}
                  escrowPayments={stats.escrowPayments}
                  pendingPayouts={stats.pendingPayouts}
                />
              </CardContent>
            </Card>
          </div>
        )

      case 'users':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">User management interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'providers':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Provider Management</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <ProviderList />
              </CardContent>
            </Card>
          </div>
        )

      case 'bookings':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Booking Overview</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <AdminBookingOverview 
                  totalBookings={stats.totalBookings}
                  completedBookings={stats.completedBookings}
                  cancelledBookings={stats.cancelledBookings}
                  totalRevenue={stats.totalRevenue}
                />
              </CardContent>
            </Card>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
              <CardHeader className="relative z-10">
                <CardTitle className="text-white">Admin Settings</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start hover:bg-gray-800/50 transition-colors duration-200">
                    <User className="w-4 h-4 mr-2" />
                    User Management
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
                {activeSection === 'overview' && 'Admin dashboard overview'}
                {activeSection === 'users' && 'Manage platform users'}
                {activeSection === 'providers' && 'Manage service providers'}
                {activeSection === 'bookings' && 'Monitor all bookings'}
                {activeSection === 'analytics' && 'Platform analytics and insights'}
                {activeSection === 'settings' && 'Admin settings and preferences'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStats}
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

interface MobileAdminDashboardV2Props {
  user?: any
}

export function MobileAdminDashboardV2({ user: propUser }: MobileAdminDashboardV2Props) {
  const [user, setUser] = useState<any>(propUser || null)
  const [activeSection, setActiveSection] = useState('overview')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProviders: 0,
    pendingProviders: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    escrowRevenue: 0,
    averageRating: 0,
    totalPayments: 0,
    pendingPayments: 0,
    escrowPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    completedPayouts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [timeoutReached, setTimeoutReached] = useState(false)

  // Timeout effect to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached')
        setTimeoutReached(true)
        setLoading(false)
        setError('Loading timeout - please refresh the page')
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  // Fetch user data only if not provided as prop
  useEffect(() => {
    if (propUser) {
      console.log('User provided as prop, skipping fetch')
      setUser(propUser)
      setLoading(false)
      return
    }

    async function fetchUser() {
      try {
        console.log('Fetching user data...')
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Content-Type': 'application/json',
          }
        })
        console.log('User response:', response.status)
        
        if (response.ok) {
          const userData = await response.json()
          console.log('User data:', userData)
          setUser(userData)
        } else {
          const errorText = await response.text()
          console.error('Failed to fetch user:', response.status, errorText)
          setError('Failed to fetch user data')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        setError('Error fetching user data')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [propUser])

  // Helper function to fetch with credentials
  const fetchWithCredentials = (url: string) => {
    return fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Fetch admin stats using single consolidated API endpoint
  const fetchAdminStats = useCallback(async () => {
    try {
      setIsRefreshing(true)
      setError(null)
      console.log('Fetching admin stats using consolidated API...')
      
      // Skip API calls during build time
      if (typeof window === 'undefined') {
        console.log('Skipping API call during build time')
        return
      }

      const response = await fetchWithCredentials('/api/admin/stats')
      console.log('Admin stats API response:', response.status)
      
      if (response.ok) {
        const statsData = await response.json()
        console.log('Admin stats data received:', statsData)
        
        setStats(statsData)
        setLastRefresh(new Date())
        setLoading(false)
        console.log('Admin stats set successfully:', statsData)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch admin stats:', response.status, errorText)
        setError(`Failed to fetch admin statistics: ${response.status}`)
        showToast.error('Failed to fetch admin statistics')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError('Error fetching admin statistics')
      showToast.error('Failed to fetch admin statistics')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAdminStats()
    } else if (user && user.role !== 'ADMIN') {
      // User is not admin, set loading to false
      setLoading(false)
    }
  }, [user, fetchAdminStats])

  const refreshStats = useCallback(() => {
    fetchAdminStats()
  }, [fetchAdminStats])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg font-semibold mb-4">Error</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={() => {
              setError(null)
              fetchAdminStats()
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading admin data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Brand Header - Desktop/Tablet Only */}
      <div className="hidden lg:block">
        <BrandHeaderClient 
          showAuth={false} 
          showUserMenu={true} 
          userStats={{
            totalBookings: stats.totalBookings,
            pendingBookings: stats.pendingProviders,
            completedBookings: stats.completedBookings,
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
          stats={stats}
          refreshStats={refreshStats}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ConsolidatedMobileHeaderAdmin
          user={user}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          totalBookings={stats.totalBookings}
          pendingBookings={stats.pendingProviders}
          hasNotifications={stats.pendingProviders > 0}
          className="bg-black/70 backdrop-blur-sm border-b border-white/20"
        />
        <MainContent
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          stats={stats}
          refreshStats={refreshStats}
          isRefreshing={isRefreshing}
          lastRefresh={lastRefresh}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
