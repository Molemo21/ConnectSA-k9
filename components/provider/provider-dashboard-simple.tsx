"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConsolidatedMobileHeaderProvider } from "@/components/ui/consolidated-mobile-header-provider"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { MobileStatsCard } from "@/components/ui/mobile-stats-card"
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
  totalBookings: number
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

interface SimpleProviderDashboardProps {
  initialUser?: any
}

export function SimpleProviderDashboard({ initialUser }: SimpleProviderDashboardProps = {}) {
  const router = useRouter()
  
  // State
  const [user, setUser] = useState(initialUser || null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    totalBookings: 0,
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch provider data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const authResponse = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (authResponse.status === 401) {
        setError('Authentication required. Please log in.')
        router.push('/login')
        return
      }

      if (!authResponse.ok) {
        throw new Error('Authentication check failed')
      }

      const authData = await authResponse.json()
      setUser(authData.user)

      if (authData.user.role !== 'PROVIDER') {
        setError('Provider role required')
        router.push('/dashboard')
        return
      }

      // Fetch bookings
      const bookingsResponse = await fetch('/api/provider/bookings', {
        credentials: 'include'
      })

      if (!bookingsResponse.ok) {
        throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`)
      }

      const bookingsData = await bookingsResponse.json()
      setBookings(bookingsData.bookings || [])
      setStats(bookingsData.stats || stats)

    } catch (error) {
      console.error('Error fetching provider data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load provider data')
    } finally {
      setLoading(false)
    }
  }, [router, stats])

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchData()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchData])

  // Initial load
  useEffect(() => {
    if (initialUser) {
      // If we have initial user, just fetch bookings
      fetchData()
    } else {
      // Otherwise, fetch everything
      fetchData()
    }
  }, []) // Only run once on mount

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading provider dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
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
            <Button onClick={refreshData} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/login')} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50">
      <ConsolidatedMobileHeaderProvider 
        user={user}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{booking.service?.name || 'Unknown Service'}</h4>
                      <p className="text-sm text-gray-600">{booking.client?.name || 'Unknown Client'}</p>
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
                        {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'No Date'}
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
