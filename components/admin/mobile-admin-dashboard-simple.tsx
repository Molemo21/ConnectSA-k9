"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  TrendingDown,
  XCircle
} from "lucide-react"
import { showToast } from "@/lib/toast"

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

interface MobileAdminDashboardSimpleProps {
  user?: any
}

export function MobileAdminDashboardSimple({ user: propUser }: MobileAdminDashboardSimpleProps) {
  const [user, setUser] = useState<any>(propUser || null)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProviders: 0,
    pendingProviders: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    totalPayments: 0,
    pendingPayments: 0,
    escrowPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    pendingRevenue: 0,
    escrowRevenue: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

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
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
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
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-gray-300/20 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">ConnectSA Admin</h1>
              <p className="text-sm text-gray-400">Dashboard</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isRefreshing}
            className="bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
          >
            {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Providers</p>
                  <p className="text-3xl font-bold text-white">{stats.totalProviders.toLocaleString()}</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Pending Providers</p>
                  <p className="text-3xl font-bold text-white">{stats.pendingProviders.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.totalBookings.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Completed Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.completedBookings.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">R{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Average Rating</p>
                  <p className="text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <CardContent className="relative z-10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Payments</p>
                  <p className="text-3xl font-bold text-white">{stats.totalPayments.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="relative bg-black/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-700 overflow-hidden group mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-500/3 to-blue-400/5 rounded-3xl animate-pulse opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshStats}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </CardHeader>
          <CardContent className="relative z-10 grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <Users className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                <span className="text-sm font-medium">Manage Users</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <CheckCircle className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                <span className="text-sm font-medium">Approve Providers</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <Calendar className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                <span className="text-sm font-medium">View Bookings</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <CreditCard className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                <span className="text-sm font-medium">Manage Payments</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* User Info */}
        <div className="text-center">
          <p className="text-gray-400">Welcome, {user.name}!</p>
          <p className="text-gray-500 text-sm">Role: {user.role}</p>
          <p className="text-gray-500 text-xs mt-1">Last Refresh: {lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  )
}
