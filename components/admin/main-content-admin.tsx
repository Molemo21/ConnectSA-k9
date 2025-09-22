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
  user: any
  stats: AdminStats | null
  onRefresh: () => void
  isRefreshing: boolean
}

export function MainContentAdmin({
  activeSection,
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
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <Users className="w-6 h-6 text-gray-400 group-hover:text-blue-50" />
                  <span className="text-sm font-medium">Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-purple-500/30 hover:border-purple-300 hover:text-purple-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <CheckCircle className="w-6 h-6 text-gray-400 group-hover:text-purple-50" />
                  <span className="text-sm font-medium">Approve Providers</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-green-500/30 hover:border-green-300 hover:text-green-50 group transition-all duration-200 flex flex-col items-center space-y-2"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-green-50" />
                  <span className="text-sm font-medium">View Bookings</span>
                </Button>
                <Button
                  variant="outline"
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">New Booking</p>
                            <p className="text-gray-400 text-sm">House Cleaning - R250</p>
                          </div>
                        </div>
                        <Badge className="bg-green-900/50 text-green-400 border-green-800/50">
                          Pending
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Booking Completed</p>
                            <p className="text-gray-400 text-sm">Plumbing Repair - R450</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-900/50 text-blue-400 border-blue-800/50">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  )
                },
                { 
                  id: "users", 
                  label: "Users", 
                  icon: Users,
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">New User Registered</p>
                            <p className="text-gray-400 text-sm">john.doe@example.com</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-900/50 text-purple-400 border-purple-800/50">
                          New
                        </Badge>
                      </div>
                    </div>
                  )
                },
                { 
                  id: "providers", 
                  label: "Providers", 
                  icon: Briefcase,
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-400/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Provider Pending Approval</p>
                            <p className="text-gray-400 text-sm">ABC Cleaning Services</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-900/50 text-orange-400 border-orange-800/50">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  )
                },
                { 
                  id: "payments", 
                  label: "Payments", 
                  icon: CreditCard,
                  content: (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Payment Processed</p>
                            <p className="text-gray-400 text-sm">R250 - House Cleaning</p>
                          </div>
                        </div>
                        <Badge className="bg-green-900/50 text-green-400 border-green-800/50">
                          Completed
                        </Badge>
                      </div>
                    </div>
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
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription className="text-white/80">Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                  <p className="text-white/80">User management feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "providers":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Briefcase className="w-5 h-5 text-purple-400" />
                  <span>Provider Management</span>
                </CardTitle>
                <CardDescription className="text-white/80">Manage service providers and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Provider Management</h3>
                  <p className="text-white/80">Provider management feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "bookings":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Calendar className="w-5 h-5 text-green-400" />
                  <span>Booking Management</span>
                </CardTitle>
                <CardDescription className="text-white/80">View and manage all bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Booking Management</h3>
                  <p className="text-white/80">Booking management feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "payments":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <span>Payment Management</span>
                </CardTitle>
                <CardDescription className="text-white/80">Manage payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Payment Management</h3>
                  <p className="text-white/80">Payment management feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "analytics":
        return (
          <div className="space-y-6">
            <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <span>Analytics Dashboard</span>
                </CardTitle>
                <CardDescription className="text-white/80">View platform analytics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analytics Dashboard</h3>
                  <p className="text-white/80">Analytics dashboard feature coming soon!</p>
                </div>
              </CardContent>
            </Card>
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
