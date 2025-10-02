"use client"

import React, { useState, useEffect, useCallback } from "react"
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

interface EnhancedProviderDashboardProps {
  initialUser?: any
}

export function EnhancedProviderDashboard({ initialUser }: EnhancedProviderDashboardProps = {}) {
  const router = useRouter()
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!initialUser,
    isLoading: !initialUser,
    error: null,
    user: initialUser || null
  })
  
  // Dashboard state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    pendingJobs: 0,
    confirmedJobs: 0,
    pendingExecutionJobs: 0,
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
  const [isCheckingBankDetails, setIsCheckingBankDetails] = useState(false)

  // Enhanced authentication check
  const checkAuthentication = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Auth check response:', response.status, response.statusText)

      if (response.status === 401) {
        // User not authenticated - redirect to login
        console.log('User not authenticated, redirecting to login')
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication required',
          user: null
        })
        router.push('/login')
        return false
      }

      if (!response.ok) {
        throw new Error(`Authentication check failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('Auth data received:', data)

      if (data.user && data.user.role === 'PROVIDER') {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
          user: data.user
        })
        return true
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Provider role required',
          user: data.user
        })
        router.push('/dashboard')
        return false
      }
    } catch (error) {
      console.error('Authentication check error:', error)
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed',
        user: null
      })
      return false
    }
  }, [router])

  // Enhanced provider data fetch
  const fetchProviderData = useCallback(async () => {
    if (!authState.isAuthenticated) {
      console.log('Not authenticated, skipping provider data fetch')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching provider bookings...')
      const response = await fetch('/api/provider/bookings', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('Provider bookings response:', response.status, response.statusText)

      if (response.status === 401) {
        console.log('Provider bookings: Authentication required, checking auth again')
        const authSuccess = await checkAuthentication()
        if (!authSuccess) {
          setError('Authentication expired. Please log in again.')
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

      setBookings(data.bookings || [])
      setStats(data.stats || {
        pendingJobs: 0,
        confirmedJobs: 0,
        pendingExecutionJobs: 0,
        inProgressJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        averageRating: 0,
        totalReviews: 0
      })
      setError(null)
      setLastRefresh(new Date())

      // Get provider ID for bank details check
      if (data.providerId) {
        setCurrentProviderId(data.providerId)
        checkBankDetails(data.providerId)
      }

    } catch (error) {
      console.error('Error fetching provider data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load provider data')
    } finally {
      setLoading(false)
    }
  }, [authState.isAuthenticated, checkAuthentication])

  // Check bank details
  const checkBankDetails = useCallback(async (providerId: string) => {
    try {
      setIsCheckingBankDetails(true)
      const response = await fetch(`/api/provider/${providerId}/bank-details`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setHasBankDetails(data.hasBankDetails)
      }
    } catch (error) {
      console.error('Error checking bank details:', error)
    } finally {
      setIsCheckingBankDetails(false)
    }
  }, [])

  // Initial load effect
  useEffect(() => {
    let isInitialized = false
    
    const initializeDashboard = async () => {
      if (isInitialized) return
      isInitialized = true
      
      console.log('Initializing provider dashboard...')
      const authSuccess = await checkAuthentication()
      if (authSuccess) {
        await fetchProviderData()
      }
    }

    initializeDashboard()
  }, []) // Empty dependency array to run only once

  // Auto-refresh effect
  useEffect(() => {
    if (!authState.isAuthenticated) return

    const pollInterval = setInterval(async () => {
      try {
        // Only refresh if we have bookings or if it's been a while since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefresh.getTime()
        if (bookings.length > 0 || timeSinceLastRefresh > 60000) { // 1 minute
          await fetchProviderData()
        }
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(pollInterval)
  }, [authState.isAuthenticated, bookings.length, lastRefresh]) // Remove fetchProviderData dependency

  // Loading state
  if (authState.isLoading || loading) {
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
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            {authState.error || 'You need to log in to access the provider dashboard.'}
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
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            {error?.message || error?.toString() || 'Unknown error'}
          </p>
          <div className="space-y-3">
            <Button 
              onClick={fetchProviderData} 
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

  // Success state - render the dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <ConsolidatedMobileHeaderProvider 
        user={authState.user}
        onRefresh={fetchProviderData}
        isRefreshing={loading}
      />
      
      <main className="pb-20">
        {/* Stats Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon={Calendar}
              trend="up"
            />
            <MobileStatsCard
              title="Earnings"
              value={`R${stats.totalEarnings.toLocaleString()}`}
              icon={DollarSign}
              trend="up"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <MobileStatsCard
              title="Pending"
              value={stats.pendingJobs}
              icon={Clock}
              trend="neutral"
              size="small"
            />
            <MobileStatsCard
              title="Active"
              value={stats.inProgressJobs}
              icon={Play}
              trend="neutral"
              size="small"
            />
            <MobileStatsCard
              title="Completed"
              value={stats.completedJobs}
              icon={CheckCircle}
              trend="up"
              size="small"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <ProviderBookingCard
                  key={booking.id}
                  booking={booking}
                  onAction={(action) => {
                    setSelectedBooking(booking)
                    setSelectedAction(action)
                    setShowConfirmDialog(true)
                  }}
                />
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
