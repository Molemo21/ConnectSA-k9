"use client"

import { useState, useEffect } from "react"
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
  Bell
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

export function MobileAdminDashboard() {
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

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        setLoading(true)
        
        // Skip API calls during build time
        if (typeof window === 'undefined') {
          console.log('Skipping API call during build time')
          return
        }

        // Fetch comprehensive admin stats from centralized service
        const response = await fetch('/api/admin/stats')
        
        if (response.ok) {
          const statsData = await response.json()
          setStats(statsData)
        } else {
          console.error('Failed to fetch admin stats')
          setError('Failed to load admin statistics')
        }

      } catch (error) {
        console.error('Error fetching admin stats:', error)
        setError('Failed to load admin statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BrandHeaderClient showAuth={false} showUserMenu={true} />
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-base">Loading admin dashboard...</p>
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
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
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
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              color="blue"
              change="+12%"
              changeType="positive"
            />
            <MobileStatsCard
              title="Active Providers"
              value={stats.totalProviders.toLocaleString()}
              icon={Briefcase}
              color="green"
              change="+8%"
              changeType="positive"
            />
            <MobileStatsCard
              title="Pending Approvals"
              value={stats.pendingProviders.toLocaleString()}
              icon={Clock}
              color="orange"
              change="3 new"
              changeType="neutral"
            />
            <MobileStatsCard
              title="Total Bookings"
              value={stats.totalBookings.toLocaleString()}
              icon={Calendar}
              color="purple"
              change="+15%"
              changeType="positive"
            />
            <MobileStatsCard
              title="Completed Jobs"
              value={stats.completedBookings.toLocaleString()}
              icon={CheckCircle}
              color="green"
              change="+20%"
              changeType="positive"
            />
            <MobileStatsCard
              title="Total Revenue"
              value={`R${stats.totalRevenue.toLocaleString()}`}
              icon={TrendingUp}
              color="emerald"
              change="+25%"
              changeType="positive"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="User Management"
              description="Manage all users including clients, providers, and admins"
              icon={Users}
              iconColor="blue"
              badge={stats.totalUsers.toString()}
              primaryAction={{
                label: "Manage Users",
                onClick: () => window.location.href = '/admin/users'
              }}
            />
            <MobileActionCard
              title="Review Applications"
              description="Review and approve new provider applications"
              icon={AlertTriangle}
              iconColor="orange"
              badge={stats.pendingProviders.toString()}
              primaryAction={{
                label: "Review Now",
                onClick: () => window.location.href = '/admin/providers'
              }}
            />
            <MobileActionCard
              title="Payment Management"
              description="Monitor and manage payment statuses"
              icon={DollarSign}
              iconColor="green"
              badge={stats.pendingPayments.toString()}
              primaryAction={{
                label: "Manage Payments",
                onClick: () => window.location.href = '/admin/payments'
              }}
            />
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average Rating</div>
                <div className="flex items-center justify-center mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "payments",
      label: "Payments",
      icon: DollarSign,
      badge: stats.pendingPayments.toString(),
      content: (
        <div className="space-y-6">
          {/* Payment Stats */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Payments"
              value={stats.totalPayments.toLocaleString()}
              icon={DollarSign}
              color="blue"
            />
            <MobileStatsCard
              title="Pending Payments"
              value={stats.pendingPayments.toLocaleString()}
              icon={Clock}
              color="orange"
            />
            <MobileStatsCard
              title="Escrow Payments"
              value={stats.escrowPayments.toLocaleString()}
              icon={Shield}
              color="purple"
            />
            <MobileStatsCard
              title="Completed Payments"
              value={stats.completedPayments.toLocaleString()}
              icon={CheckCircle}
              color="green"
            />
            <MobileStatsCard
              title="Failed Payments"
              value={stats.failedPayments.toLocaleString()}
              icon={AlertTriangle}
              color="red"
            />
            <MobileStatsCard
              title="Total Payouts"
              value={stats.totalPayouts.toLocaleString()}
              icon={Zap}
              color="emerald"
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Released Revenue</span>
                <span className="font-medium text-green-600">R{stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Revenue</span>
                <span className="font-medium text-orange-600">R{stats.pendingRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Escrow Revenue</span>
                <span className="font-medium text-purple-600">R{stats.escrowRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Management</h3>
            <AdminPaymentManagement />
          </div>
        </div>
      )
    },
    {
      id: "system",
      label: "System",
      icon: Shield,
      content: (
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <AdminSystemHealth 
              totalBookings={stats.totalBookings}
              pendingPayments={stats.pendingPayments}
              escrowPayments={stats.escrowPayments}
              pendingPayouts={stats.pendingPayouts}
            />
          </div>

          {/* Booking Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Overview</h3>
            <AdminBookingOverview 
              totalBookings={stats.totalBookings}
              completedBookings={stats.completedBookings}
              cancelledBookings={stats.cancelledBookings}
              totalRevenue={stats.totalRevenue}
            />
          </div>

          {/* System Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="System Maintenance"
              description="Perform system maintenance tasks"
              icon={Settings}
              iconColor="blue"
              primaryAction={{
                label: "Maintenance",
                onClick: () => window.location.href = '/admin/system'
              }}
            />
            <MobileActionCard
              title="Notifications"
              description="Manage system notifications"
              icon={Bell}
              iconColor="orange"
              primaryAction={{
                label: "Manage",
                onClick: () => window.location.href = '/admin/notifications'
              }}
            />
          </div>
        </div>
      )
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      content: (
        <div className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              color="blue"
            />
            <MobileStatsCard
              title="Active Users"
              value={stats.totalUsers.toLocaleString()}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* User Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage all platform users including clients, providers, and administrators.
              </p>
              <Button 
                onClick={() => window.location.href = '/admin/users'}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </div>

          {/* User Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="View All Users"
              description="Browse and manage all platform users"
              icon={Users}
              iconColor="blue"
              primaryAction={{
                label: "View Users",
                onClick: () => window.location.href = '/admin/users'
              }}
            />
            <MobileActionCard
              title="User Analytics"
              description="View user activity and engagement metrics"
              icon={BarChart3}
              iconColor="purple"
              primaryAction={{
                label: "View Analytics",
                onClick: () => window.location.href = '/admin/analytics'
              }}
            />
          </div>
        </div>
      )
    },
    {
      id: "providers",
      label: "Providers",
      icon: Briefcase,
      badge: stats.pendingProviders.toString(),
      content: (
        <div className="space-y-6">
          {/* Provider Stats */}
          <div className="grid grid-cols-2 gap-4">
            <MobileStatsCard
              title="Total Providers"
              value={stats.totalProviders.toLocaleString()}
              icon={Users}
              color="blue"
            />
            <MobileStatsCard
              title="Pending Approval"
              value={stats.pendingProviders.toLocaleString()}
              icon={Clock}
              color="orange"
            />
            <MobileStatsCard
              title="Active Providers"
              value={(stats.totalProviders - stats.pendingProviders).toLocaleString()}
              icon={CheckCircle}
              color="green"
            />
            <MobileStatsCard
              title="Provider Rating"
              value={stats.averageRating.toFixed(1)}
              icon={Star}
              color="purple"
            />
          </div>

          {/* Provider Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Management</h3>
            <ProviderList />
          </div>

          {/* Provider Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MobileActionCard
              title="Review Applications"
              description="Review pending provider applications"
              icon={AlertTriangle}
              iconColor="orange"
              badge={stats.pendingProviders.toString()}
              primaryAction={{
                label: "Review Now",
                onClick: () => window.location.href = '/admin/providers'
              }}
            />
            <MobileActionCard
              title="Provider Analytics"
              description="View provider performance analytics"
              icon={BarChart3}
              iconColor="blue"
              primaryAction={{
                label: "View Analytics",
                onClick: () => window.location.href = '/admin/analytics'
              }}
            />
          </div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your platform with comprehensive oversight</p>
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
      <MobileBottomNav userRole="ADMIN" />
      
      {/* Floating Action Button */}
      <MobileFloatingActionButton userRole="ADMIN" />
    </div>
  )
}
