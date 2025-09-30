"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { MobileFloatingActionButton } from "@/components/ui/mobile-floating-action-button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Star,
  Activity,
  Loader2,
  RefreshCw,
  Download,
  Filter
} from "lucide-react"
import { showToast } from "@/lib/toast"

interface AnalyticsData {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  pendingRevenue: number
  escrowRevenue: number
  averageRating: number
  userGrowth: number
  providerGrowth: number
  bookingGrowth: number
  revenueGrowth: number
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    escrowRevenue: 0,
    averageRating: 0,
    userGrowth: 0,
    providerGrowth: 0,
    bookingGrowth: 0,
    revenueGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch comprehensive analytics data from centralized service
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      
      if (response.ok) {
        const analyticsData = await response.json()
        setAnalytics(analyticsData)
      } else {
        console.error('Failed to fetch analytics data')
        showToast.error('Error fetching analytics data')
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
      showToast.error('Error fetching analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth > 0
    return (
      <Badge className={isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        <TrendingUp className="w-3 h-3 mr-1" />
        {isPositive ? '+' : ''}{growth}%
      </Badge>
    )
  }

  const getCompletionRate = () => {
    return analytics.completionRate || 0
  }

  const getCancellationRate = () => {
    return analytics.cancellationRate || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeaderClient showAuth={false} showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive platform performance insights</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAnalytics}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={timeRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={timeRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('90d')}
                >
                  90 Days
                </Button>
                <Button
                  variant={timeRange === '1y' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('1y')}
                >
                  1 Year
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {getGrowthBadge(analytics.userGrowth)}
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  {getGrowthBadge(analytics.providerGrowth)}
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalProviders.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Active Providers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  {getGrowthBadge(analytics.bookingGrowth)}
                </div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalBookings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  {getGrowthBadge(analytics.revenueGrowth)}
                </div>
                <div className="text-2xl font-bold text-gray-900">R{analytics.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Booking Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-green-600">{getCompletionRate()}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancellation Rate</span>
                    <span className="font-semibold text-red-600">{getCancellationRate()}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Bookings</span>
                    <span className="font-semibold">{analytics.completedBookings.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cancelled Bookings</span>
                    <span className="font-semibold">{analytics.cancelledBookings.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{analytics.averageRating.toFixed(1)}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">5-Star Reviews</span>
                    <span className="font-semibold text-green-600">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-semibold text-blue-600">95%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">R{analytics.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Released Revenue</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">R{analytics.pendingRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Pending Revenue</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">R{analytics.escrowRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Escrow Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Growth Trends
              </CardTitle>
              <CardDescription>
                Platform growth over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">+{analytics.userGrowth}%</div>
                  <div className="text-sm text-gray-600">User Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">+{analytics.providerGrowth}%</div>
                  <div className="text-sm text-gray-600">Provider Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">+{analytics.bookingGrowth}%</div>
                  <div className="text-sm text-gray-600">Booking Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600">+{analytics.revenueGrowth}%</div>
                  <div className="text-sm text-gray-600">Revenue Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
