"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MobileStatsCard } from "@/components/ui/mobile-stats-card"
import { MobileActionCard } from "@/components/ui/mobile-action-card"
import { MobileTabbedSection } from "@/components/ui/mobile-tabbed-section"
import { MobileCollapsibleSection } from "@/components/ui/mobile-collapsible-section"
import { 
  Users, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Star, 
  DollarSign, 
  CreditCard, 
  BarChart3,
  Settings,
  Shield,
  TrendingUp,
  Bell,
  User
} from "lucide-react"
import { AdminUserManagementEnhanced } from "@/components/admin/admin-user-management-enhanced"
import { AdminProviderManagementEnhanced } from "@/components/admin/admin-provider-management-enhanced"
import { AdminBookingManagementEnhanced } from "@/components/admin/admin-booking-management-enhanced"
import { AdminPaymentManagement } from "@/components/admin/admin-payment-management"
import { AdminPayoutManagement } from "@/components/admin/admin-payout-management"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import AdminSystemHealth from "@/components/admin/admin-system-health"
import { AdminProviderCleanupTool } from "@/components/admin/admin-provider-cleanup-tool"
import { RecentActivityFeed } from "@/components/admin/recent-activity-feed"

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

interface MainContentAdminProps {
  activeSection: string
  setActiveSection?: (section: string) => void
  user: any
  stats: AdminStats | null
  onRefresh: () => void
  isRefreshing: boolean
}

export function MainContentAdmin({
  activeSection,
  setActiveSection,
  user,
  stats,
  onRefresh,
  isRefreshing
}: MainContentAdminProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h1>
              <p className="text-gray-400">Here's what's happening with your platform today</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MobileStatsCard
                title="Total Users"
                value={stats?.totalUsers?.toLocaleString() || '0'}
                icon={Users}
                color="blue"
                change="+12%"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Total Providers"
                value={stats?.totalProviders?.toLocaleString() || '0'}
                icon={Briefcase}
                color="purple"
                change="+8%"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Pending Providers"
                value={stats?.pendingProviders?.toLocaleString() || '0'}
                icon={Clock}
                color="orange"
                change="Awaiting Review"
                changeType="neutral"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Total Bookings"
                value={stats?.totalBookings?.toLocaleString() || '0'}
                icon={Calendar}
                color="green"
                change="+15%"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Completed Bookings"
                value={stats?.completedBookings?.toLocaleString() || '0'}
                icon={CheckCircle}
                color="emerald"
                change="Success Rate"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                icon={DollarSign}
                color="green"
                change="+22%"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Average Rating"
                value={stats?.averageRating?.toFixed(1) || '0.0'}
                icon={Star}
                color="orange"
                change="Out of 5"
                changeType="neutral"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
              <MobileStatsCard
                title="Total Payments"
                value={stats?.totalPayments?.toLocaleString() || '0'}
                icon={CreditCard}
                color="blue"
                change="Processed"
                changeType="positive"
                className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
              />
            </div>

            {/* Quick Actions */}
            <MobileActionCard
              title="Quick Actions"
              description="Manage your platform efficiently"
              icon={BarChart3}
              iconColor="blue"
              className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
            >
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveSection?.('users')}
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <Users className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                  <span className="text-sm font-medium">Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection?.('providers')}
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-purple-500/30 hover:border-purple-300 hover:text-purple-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <CheckCircle className="w-6 h-6 text-gray-400 group-hover:text-purple-50" />
                  <span className="text-sm font-medium">Approve Providers</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection?.('bookings')}
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-green-500/30 hover:border-green-300 hover:text-green-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-green-50" />
                  <span className="text-sm font-medium">View Bookings</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveSection?.('payments')}
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-cyan-500/30 hover:border-cyan-300 hover:text-cyan-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <CreditCard className="w-6 h-6 text-gray-400 group-hover:text-cyan-50" />
                  <span className="text-sm font-medium">Manage Payments</span>
                </Button>
              </div>
            </MobileActionCard>

            {/* Recent Activity */}
            <MobileTabbedSection
              tabs={[
                { 
                  id: "bookings", 
                  label: "Bookings", 
                  icon: Calendar,
                  content: (
                    <RecentActivityFeed type="bookings" limit={5} />
                  )
                },
                { 
                  id: "users", 
                  label: "Users", 
                  icon: Users,
                  content: (
                    <RecentActivityFeed type="users" limit={5} />
                  )
                },
                { 
                  id: "providers", 
                  label: "Providers", 
                  icon: Briefcase,
                  content: (
                    <RecentActivityFeed type="providers" limit={5} />
                  )
                },
                { 
                  id: "payments", 
                  label: "Payments", 
                  icon: CreditCard,
                  content: (
                    <RecentActivityFeed type="payments" limit={5} />
                  )
                }
              ]}
              className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
            />

            {/* System Health */}
            <MobileCollapsibleSection
              title="System Health"
              icon={Shield}
              iconColor="green"
              className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Database</h3>
                  <p className="text-green-400 text-sm">Operational</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-12 h-12 bg-blue-400/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">API</h3>
                  <p className="text-blue-400 text-sm">Healthy</p>
                </div>
                <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                  <div className="w-12 h-12 bg-purple-400/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Notifications</h3>
                  <p className="text-purple-400 text-sm">Active</p>
                </div>
              </div>
            </MobileCollapsibleSection>
          </div>
        )

      case "users":
        return (
          <div className="space-y-6">
            <AdminUserManagementEnhanced onStatsUpdate={onRefresh} />
          </div>
        )

      case "providers":
        return (
          <div className="space-y-6">
            <AdminProviderManagementEnhanced onStatsUpdate={onRefresh} />
          </div>
        )

      case "bookings":
        return (
          <div className="space-y-6">
            <AdminBookingManagementEnhanced onStatsUpdate={onRefresh} />
          </div>
        )

      case "payments":
        return (
          <div className="space-y-6">
            <AdminPaymentManagement />
          </div>
        )

      case "payouts":
        return (
          <div className="space-y-6">
            <AdminPayoutManagement />
          </div>
        )

      case "analytics":
        return (
          <div className="space-y-6">
            <AdminAnalytics />
          </div>
        )

      case "system":
        return (
          <div className="space-y-6">
            <AdminSystemHealth />
            <AdminProviderCleanupTool />
          </div>
        )

      case "settings":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span>System Settings</span>
                </CardTitle>
                <CardDescription className="text-white/80">Configure system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">System Settings</h3>
                  <p className="text-white/80">System settings feature coming soon!</p>
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
