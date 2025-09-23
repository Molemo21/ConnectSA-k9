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
  AlertTriangle
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

interface FixedProviderDashboardProps {
  initialUser?: any
}

export function FixedProviderDashboard({ initialUser }: FixedProviderDashboardProps = {}) {
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
      isCheckingBankDetails: false
    }
  })

  // Derived state using useMemo to prevent unnecessary re-renders
  const totalBookings = useMemo(() => {
    return dashboardState.data.bookings.length
  }, [dashboardState.data.bookings.length])

  const filteredBookings = useMemo(() => {
    if (dashboardState.ui.selectedFilter === "all") {
      return dashboardState.data.bookings
    }
    return dashboardState.data.bookings.filter(booking => 
      booking.status.toLowerCase() === dashboardState.ui.selectedFilter.toLowerCase()
    )
  }, [dashboardState.data.bookings, dashboardState.ui.selectedFilter])

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

      console.log('Auth check response:', response.status, response.statusText)

      if (response.status === 401) {
        console.log('User not authenticated, redirecting to login')
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
      console.log('Auth data received:', data)

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

  // Stable provider data fetch function
  const fetchProviderData = useCallback(async () => {
    if (!dashboardState.auth.isAuthenticated) {
      console.log('Not authenticated, skipping provider data fetch')
      return
    }

    try {
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, loading: true, error: null }
      }))

      console.log('Fetching provider bookings...')
      const response = await fetch('/api/provider/bookings', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Provider bookings response:', response.status, response.statusText)

      if (response.status === 401) {
        console.log('Provider bookings: Authentication required, checking auth again')
        const authSuccess = await checkAuthentication()
        if (!authSuccess) {
          setDashboardState(prev => ({
            ...prev,
            ui: { ...prev.ui, error: 'Authentication expired. Please log in again.' }
          }))
          return
        }
        // Retry the request after successful auth
        return fetchProviderData()
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Provider data fetch failed: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Provider data received:', {
        success: data.success,
        bookingCount: data.bookings?.length || 0,
        hasBookings: (data.bookings?.length || 0) > 0,
        message: data.message
      })

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

      // Get provider ID for bank details check
      if (data.providerId) {
        checkBankDetails(data.providerId)
      }

    } catch (error) {
      console.error('Error fetching provider data:', error)
      setDashboardState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          error: error instanceof Error ? error.message : 'Failed to load provider data'
        }
      }))
    } finally {
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, loading: false }
      }))
    }
  }, [dashboardState.auth.isAuthenticated, checkAuthentication])

  // Stable bank details check function
  const checkBankDetails = useCallback(async (providerId: string) => {
    try {
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, isCheckingBankDetails: true }
      }))
      
      const response = await fetch(`/api/provider/${providerId}/bank-details`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setDashboardState(prev => ({
          ...prev,
          data: { ...prev.data, hasBankDetails: data.hasBankDetails }
        }))
      }
    } catch (error) {
      console.error('Error checking bank details:', error)
    } finally {
      setDashboardState(prev => ({
        ...prev,
        ui: { ...prev.ui, isCheckingBankDetails: false }
      }))
    }
  }, [])

  // Single initialization effect - runs only once
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
  }, []) // Empty dependency array - runs only once

  // Auto-refresh effect - only runs when authenticated
  useEffect(() => {
    if (!dashboardState.auth.isAuthenticated) return

    const pollInterval = setInterval(async () => {
      try {
        // Only refresh if it's been a while since last refresh
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
  }, [dashboardState.auth.isAuthenticated]) // Only depend on authentication state

  // Refresh function for manual refresh
  const refreshData = useCallback(async () => {
    lastRefreshTime.current = Date.now()
    await fetchProviderData()
  }, [fetchProviderData])

  // Loading state
  if (dashboardState.auth.isLoading || dashboardState.ui.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading provider dashboard...</p>
        </div>
      </div>
    )
  }

  // Authentication error state
  if (!dashboardState.auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            {dashboardState.auth.error || 'You need to log in to access the provider dashboard.'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="w-full"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            {dashboardState.ui.error}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={refreshData} 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state - render the full dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <ConsolidatedMobileHeaderProvider 
        user={dashboardState.auth.user}
        onRefresh={refreshData}
        isRefreshing={dashboardState.ui.loading}
      />
      
      <main className="pb-20">
        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Bookings"
              value={totalBookings}
              icon={Calendar}
              trend="up"
            />
            <MobileStatsCard
              title="Earnings"
              value={`R${dashboardState.data.stats.totalEarnings.toLocaleString()}`}
              icon={DollarSign}
              trend="up"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <MobileStatsCard
              title="Pending"
              value={dashboardState.data.stats.pendingJobs}
              icon={Clock}
              trend="neutral"
              size="small"
            />
            <MobileStatsCard
              title="Active"
              value={dashboardState.data.stats.inProgressJobs}
              icon={Play}
              trend="neutral"
              size="small"
            />
            <MobileStatsCard
              title="Completed"
              value={dashboardState.data.stats.completedJobs}
              icon={CheckCircle}
              trend="up"
              size="small"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={dashboardState.ui.loading}
            >
              <RefreshCw className={`h-4 w-4 ${dashboardState.ui.loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.service.name}</h4>
                      <p className="text-sm text-gray-600">{booking.client.name}</p>
                      <p className="text-sm text-gray-500">{booking.address}</p>
                    </div>
                    <Badge variant={booking.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.scheduledDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R{booking.totalAmount}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Your bookings will appear here when clients book your services.
              </p>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav activeTab="dashboard" />
      <MobileFloatingActionButton />
    </div>
  )
}
